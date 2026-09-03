import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const Schema = z.object({
  eventId: z.string().uuid(),
  pin: z.string().regex(/^\d{6}$/),
});

// PIN-Prüfung fürs Einlasspersonal: bei Erfolg kommen Titel + Zählerstand
// zurück, damit der Scanner ohne Veranstalter-Login starten kann.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimit(`scan-pin:${ip}`, 10, 60)) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte kurz warten." }, { status: 429 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  const { eventId, pin } = parsed.data;

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, titel, scanner_pin")
    .eq("id", eventId)
    .single();

  if (!event?.scanner_pin || event.scanner_pin !== pin) {
    return NextResponse.json({ error: "Falsche PIN" }, { status: 403 });
  }

  const [{ count: gesamt }, { count: eingelassen }] = await Promise.all([
    admin.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    admin.from("tickets").select("id", { count: "exact", head: true })
      .eq("event_id", eventId).not("eingeloest_am", "is", null),
  ]);

  return NextResponse.json({
    ok: true,
    titel: event.titel,
    gesamt: gesamt ?? 0,
    eingelassen: eingelassen ?? 0,
  });
}
