import { createClient } from "@/lib/supabase/server";
import { getServerDict, getServerLocale } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/buchung";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyEur as EuroIcon, Ticket, TrendUp as TrendingUp, Users } from "@phosphor-icons/react/dist/ssr";
import AnalyticsClient from "./analytics-client";
import { CountUp } from "@/components/ui/count-up";

function euro(cent: number, loc: string) {
  return (cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" });
}

export default async function AnalyticsSeite() {
  const [t, supabase, locale] = await Promise.all([getServerDict(), createClient(), getServerLocale()]);
  const dateLocale = intlLocale(locale);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: alleEvents } = await supabase
    .from("events").select("id, titel, status").eq("veranstalter_id", user!.id);

  const eventIds = (alleEvents ?? []).map((e) => e.id);

  if (eventIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t.analytics.title}</h1>
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">{t.analytics.nochKeineDaten}</p>
          <p className="text-sm mt-1">{t.analytics.erstelleEvent}</p>
        </div>
      </div>
    );
  }

  const [{ data: alleBuchungen }, { data: alleTickets }] = await Promise.all([
    supabase.from("buchungen").select("id, event_id, gesamt_cent, status, erstellt_am")
      .in("event_id", eventIds).order("erstellt_am", { ascending: true }),
    supabase.from("tickets").select("event_id, eingeloest_am").in("event_id", eventIds),
  ]);

  const buchungen = alleBuchungen ?? [];
  const tickets = alleTickets ?? [];
  const bezahlt = buchungen.filter((b) => b.status === "bezahlt");
  const gesamtCent = bezahlt.reduce((s, b) => s + b.gesamt_cent, 0);
  const eingeloest = tickets.filter((t) => t.eingeloest_am).length;
  const ausstehend = buchungen.filter((b) => b.status === "ausstehend").length;
  const conversion = bezahlt.length + ausstehend > 0
    ? Math.round((bezahlt.length / (bezahlt.length + ausstehend)) * 100) : null;

  // Tages-Buckets konsistent nach Europe/Berlin bilden UND matchen. Vorher
  // wurden die Keys aus lokaler Server-Zeit (setHours) via toISOString() als
  // UTC-Datum gebaut, aber erstellt_am rein als UTC-Datum gematcht — auf einem
  // Server östlich von UTC fiel der heutige Umsatz aus dem letzten Bucket
  // heraus und die Grafik blieb leer.
  const TZ = "Europe/Berlin";
  const berlinTag = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
  const heuteNoon = new Date(); heuteNoon.setHours(12, 0, 0, 0);
  const umsatzProTag = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    umsatzProTag.set(berlinTag(new Date(heuteNoon.getTime() - i * 86_400_000)), 0);
  }
  for (const b of bezahlt) {
    const tag = berlinTag(new Date(b.erstellt_am));
    if (umsatzProTag.has(tag)) umsatzProTag.set(tag, (umsatzProTag.get(tag) ?? 0) + b.gesamt_cent);
  }
  const chartDaten = Array.from(umsatzProTag.entries()).map(([datum, cent]) => ({ datum, cent }));

  const eventTitel = new Map((alleEvents ?? []).map((e) => [e.id, e.titel]));
  const umsatzProEvent = new Map<string, number>();
  for (const b of bezahlt) umsatzProEvent.set(b.event_id, (umsatzProEvent.get(b.event_id) ?? 0) + b.gesamt_cent);
  const topEvents = Array.from(umsatzProEvent.entries())
    .map(([id, cent]) => ({ id, titel: eventTitel.get(id) ?? id, cent }))
    .sort((a, b) => b.cent - a.cent).slice(0, 10);

  const buchungenNachWochentag = new Array(7).fill(0);
  for (const b of bezahlt) buchungenNachWochentag[(new Date(b.erstellt_am).getDay() + 6) % 7]++;
  const buchungenNachStunde = new Array(24).fill(0);
  for (const b of bezahlt) buchungenNachStunde[new Date(b.erstellt_am).getHours()]++;

  const wochentage = [...t.dashboardHome.wochentage];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.analytics.title}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.analytics.gesamtumsatz}</p>
              <p className="text-2xl font-bold mt-1"><CountUp value={gesamtCent} format="euro" /></p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <EuroIcon className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{bezahlt.length} {t.status.bezahlt.toLowerCase()}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.analytics.tickets}</p>
              <p className="text-2xl font-bold mt-1"><CountUp value={tickets.length} /></p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Ticket className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{eingeloest} {t.analytics.eingeloest}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.analytics.conversion}</p>
              <p className="text-2xl font-bold mt-1">{conversion !== null ? <CountUp value={conversion} format="percent" /> : "—"}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t.analytics.bezahltInitiiert}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.analytics.kaeufer}</p>
              <p className="text-2xl font-bold mt-1"><CountUp value={bezahlt.length} /></p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Ø {bezahlt.length > 0 ? euro(Math.round(gesamtCent / bezahlt.length), dateLocale) : "—"} {t.analytics.avProBuchung}</p>
        </CardContent></Card>
      </div>

      <AnalyticsClient
        chartDaten={chartDaten}
        topEvents={topEvents}
        buchungenNachWochentag={buchungenNachWochentag}
        buchungenNachStunde={buchungenNachStunde}
        wochentage={wochentage}
        t={t.analytics}
      />
    </div>
  );
}
