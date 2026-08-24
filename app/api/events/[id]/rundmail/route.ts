import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendeRundmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { demoBlockiert } from "@/lib/demo";
import { z } from "zod";

const Schema = z.object({
  betreff: z.string().min(3).max(150),
  nachricht: z.string().min(10).max(5000),
});

// Rundmail an alle Käufer eines Events (nur Veranstalter).
// Ein Empfänger pro E-Mail-Adresse, auch bei mehreren Buchungen.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const demo = demoBlockiert(user.id); if (demo) return demo;

  // Missbrauchsschutz: max. 2 Rundmails pro Event pro Stunde
  if (rateLimit(`rundmail:${id}`, 2, 3600)) {
    return NextResponse.json(
      { error: "Maximal 2 Rundmails pro Stunde und Event." },
      { status: 429 },
    );
  }

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Betreff (min. 3 Zeichen) und Nachricht (min. 10 Zeichen) erforderlich." }, { status: 400 });
  }
  const { betreff, nachricht } = parsed.data;

  const { data: event } = await supabase
    .from("events")
    .select("id, titel, veranstalter_id")
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .single();
  if (!event) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });

  const admin = createAdminClient();
  const [{ data: buchungen }, { data: profil }] = await Promise.all([
    admin
      .from("buchungen")
      .select("id, gaest_email")
      .eq("event_id", id)
      .eq("status", "bezahlt"),
    admin
      .from("veranstalter_profile")
      .select("name")
      .eq("id", user.id)
      .single(),
  ]);

  // Pro Adresse genau eine Mail; Link zeigt auf die jeweils erste Buchung
  const proAdresse = new Map<string, string>();
  for (const b of buchungen ?? []) {
    const mail = b.gaest_email.toLowerCase();
    if (!proAdresse.has(mail)) proAdresse.set(mail, b.id);
  }
  if (proAdresse.size === 0) {
    return NextResponse.json({ error: "Keine bezahlten Buchungen vorhanden." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seatflow.app";
  const ergebnisse = await Promise.allSettled(
    [...proAdresse.entries()].map(([email, buchungId]) =>
      sendeRundmail({
        to: email,
        betreff,
        nachricht,
        eventTitel: event.titel,
        veranstalterName: profil?.name ?? "dem Veranstalter",
        buchungLink: `${appUrl}/booking/${buchungId}`,
      })
    )
  );

  const gesendet = ergebnisse.filter((r) => r.status === "fulfilled").length;
  const fehlgeschlagen = ergebnisse.length - gesendet;
  return NextResponse.json({ gesendet, fehlgeschlagen });
}
