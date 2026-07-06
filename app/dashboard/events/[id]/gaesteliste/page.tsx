import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DownloadSimple, Printer } from "@phosphor-icons/react/dist/ssr";
import { sitzAnzeige } from "@/types/sitzplan";
import DruckButton from "./druck-button";

// Druckbare Einlassliste — für die Abendkasse ohne Smartphone.
export default async function Gaesteliste({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum")
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .single();
  if (!event) notFound();

  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from("tickets")
    .select("id, sitzplatz_id, sitzplatz_bezeichnung, eingeloest_am, buchungen!inner(gaest_name, status)")
    .eq("event_id", id);

  type Zeile = {
    id: string; sitzplatz_id: string; sitzplatz_bezeichnung: string;
    eingeloest_am: string | null;
    buchungen: { gaest_name: string; status: string } | null;
  };
  const zeilen = ((tickets ?? []) as unknown as Zeile[])
    .filter((t) => t.buchungen?.status === "bezahlt")
    .sort((a, b) => sitzAnzeige(a.sitzplatz_id).localeCompare(sitzAnzeige(b.sitzplatz_id), "de", { numeric: true }));

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/events/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Gästeliste</h1>
            <p className="text-sm text-muted-foreground">{event.titel} · {zeilen.length} Tickets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/events/${id}/gaesteliste`}>
              <DownloadSimple className="h-3.5 w-3.5 mr-1.5" /> CSV
            </a>
          </Button>
          <DruckButton />
        </div>
      </div>

      {/* Druckkopf */}
      <div className="hidden print:block">
        <h1 className="text-lg font-bold">{event.titel} — Einlassliste</h1>
        <p className="text-sm">
          {new Date(event.datum).toLocaleDateString("de-DE", {
            weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })} · {zeilen.length} Tickets
        </p>
      </div>

      {zeilen.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Noch keine bezahlten Buchungen.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border text-left">
              <th className="py-2 pr-3 w-10 print:border print:border-black print:px-2"></th>
              <th className="py-2 pr-3 print:border print:border-black print:px-2">Platz</th>
              <th className="py-2 pr-3 print:border print:border-black print:px-2">Name</th>
              <th className="py-2 pr-3 print:border print:border-black print:px-2">Kategorie</th>
              <th className="py-2 print:border print:border-black print:px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((t) => (
              <tr key={t.id} className="border-b border-border">
                <td className="py-2 pr-3 print:border print:border-black print:px-2">
                  <span className="inline-block w-4 h-4 border-2 border-slate-400 rounded-sm print:border-black" aria-hidden />
                </td>
                <td className="py-2 pr-3 font-mono font-semibold print:border print:border-black print:px-2">
                  {sitzAnzeige(t.sitzplatz_id)}
                </td>
                <td className="py-2 pr-3 print:border print:border-black print:px-2">{t.buchungen?.gaest_name}</td>
                <td className="py-2 pr-3 text-muted-foreground print:border print:border-black print:px-2">{t.sitzplatz_bezeichnung}</td>
                <td className="py-2 print:border print:border-black print:px-2">
                  {t.eingeloest_am
                    ? <span className="text-green-600 font-medium">eingecheckt</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
