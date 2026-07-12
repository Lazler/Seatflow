import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sitzAnzeige } from "@/types/sitzplan";

function csvFeld(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// CSV-Export der Gästeliste (nur Veranstalter). Semikolon-getrennt,
// damit deutsches Excel die Datei direkt korrekt öffnet.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { data: event } = await supabase
    .from("events")
    .select("id, titel")
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .single();
  if (!event) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });

  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from("tickets")
    .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, eingeloest_am, buchungen!inner(gaest_name, gaest_email, status)")
    .eq("event_id", id);

  type Zeile = {
    sitzplatz_id: string; sitzplatz_bezeichnung: string; preis_cent: number;
    eingeloest_am: string | null;
    buchungen: { gaest_name: string; gaest_email: string; status: string } | null;
  };

  const zeilen = ((tickets ?? []) as unknown as Zeile[])
    .filter((t) => t.buchungen?.status === "bezahlt")
    .sort((a, b) => sitzAnzeige(a.sitzplatz_id).localeCompare(sitzAnzeige(b.sitzplatz_id), "de", { numeric: true }));

  const kopf = ["Platz", "Kategorie", "Name", "E-Mail", "Preis (EUR)", "Eingecheckt"];
  const daten = zeilen.map((t) => [
    csvFeld(sitzAnzeige(t.sitzplatz_id)),
    csvFeld(t.sitzplatz_bezeichnung),
    csvFeld(t.buchungen?.gaest_name),
    csvFeld(t.buchungen?.gaest_email),
    csvFeld((t.preis_cent / 100).toFixed(2).replace(".", ",")),
    csvFeld(t.eingeloest_am ? "ja" : "nein"),
  ].join(";"));

  // BOM für Excel-Umlaute
  const csv = "﻿" + [kopf.join(";"), ...daten].join("\r\n");
  const slug = event.titel.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gaesteliste-${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
