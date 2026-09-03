import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { fmt } from "@/lib/i18n/buchung";
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
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum")
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .single();
  if (!event) notFound();

  // Sprache: Cookie > Profil > de (wie im Dashboard-Layout)
  const jar = await cookies();
  const cookieLang = jar.get("dashboard_lang")?.value;
  let locale: Locale = "de";
  if (cookieLang && isLocale(cookieLang)) {
    locale = cookieLang;
  } else {
    const { data: profil } = await supabase
      .from("veranstalter_profile")
      .select("sprache")
      .eq("id", user.id)
      .single();
    if (profil?.sprache && isLocale(profil.sprache)) locale = profil.sprache as Locale;
  }
  const dict = await getDictionary(locale);
  const t = dict.gaesteliste;
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";

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
            <h1 className="text-xl font-bold">{t.titel}</h1>
            <p className="text-sm text-muted-foreground">{event.titel} · {fmt(t.ticketsCount, { n: zeilen.length })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/events/${id}/guest-list`}>
              <DownloadSimple className="h-3.5 w-3.5 mr-1.5" /> CSV
            </a>
          </Button>
          <DruckButton />
        </div>
      </div>

      {/* Druckkopf */}
      <div className="hidden print:block">
        <h1 className="text-lg font-bold">{fmt(t.druckTitel, { titel: event.titel })}</h1>
        <p className="text-sm">
          {new Date(event.datum).toLocaleDateString(dateLocale, {
            weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })} · {fmt(t.ticketsCount, { n: zeilen.length })}
        </p>
      </div>

      {zeilen.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t.keineBezahlten}</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border text-left">
              <th className="py-2 pr-3 w-10 print:border print:border-black print:px-2"></th>
              <th className="py-2 pr-3 print:border print:border-black print:px-2">{t.platz}</th>
              <th className="py-2 pr-3 print:border print:border-black print:px-2">{t.name}</th>
              <th className="py-2 pr-3 print:border print:border-black print:px-2">{t.kategorie}</th>
              <th className="py-2 print:border print:border-black print:px-2">{t.statusSpalte}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.id} className="border-b border-border">
                <td className="py-2 pr-3 print:border print:border-black print:px-2">
                  <span className="inline-block w-4 h-4 border-2 border-slate-400 rounded-sm print:border-black" aria-hidden />
                </td>
                <td className="py-2 pr-3 font-mono font-semibold print:border print:border-black print:px-2">
                  {sitzAnzeige(z.sitzplatz_id)}
                </td>
                <td className="py-2 pr-3 print:border print:border-black print:px-2">{z.buchungen?.gaest_name}</td>
                <td className="py-2 pr-3 text-muted-foreground print:border print:border-black print:px-2">{z.sitzplatz_bezeichnung}</td>
                <td className="py-2 print:border print:border-black print:px-2">
                  {z.eingeloest_am
                    ? <span className="text-green-600 font-medium">{t.eingecheckt}</span>
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
