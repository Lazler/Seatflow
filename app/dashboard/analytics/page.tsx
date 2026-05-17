import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EuroIcon, Ticket, TrendingUp, Users } from "lucide-react";
import AnalyticsClient from "./analytics-client";

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function AnalyticsSeite() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: alleEvents } = await supabase
    .from("events")
    .select("id, titel, status")
    .eq("veranstalter_id", user!.id);

  const eventIds = (alleEvents ?? []).map((e) => e.id);

  if (eventIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Noch keine Daten</p>
          <p className="text-sm mt-1">Erstelle dein erstes Event um Analytics zu sehen.</p>
        </div>
      </div>
    );
  }

  const { data: alleBuchungen } = await supabase
    .from("buchungen")
    .select("id, event_id, gesamt_cent, status, erstellt_am")
    .in("event_id", eventIds)
    .order("erstellt_am", { ascending: true });

  const { data: alleTickets } = await supabase
    .from("tickets")
    .select("event_id, eingeloest_am")
    .in("event_id", eventIds);

  const buchungen = alleBuchungen ?? [];
  const tickets = alleTickets ?? [];

  const bezahlt = buchungen.filter((b) => b.status === "bezahlt");
  const gesamtCent = bezahlt.reduce((s, b) => s + b.gesamt_cent, 0);
  const eingeloest = tickets.filter((t) => t.eingeloest_am).length;

  // Conversion rate: bezahlt / (bezahlt + ausstehend)
  const ausstehend = buchungen.filter((b) => b.status === "ausstehend").length;
  const conversion = bezahlt.length + ausstehend > 0
    ? Math.round((bezahlt.length / (bezahlt.length + ausstehend)) * 100)
    : null;

  // Revenue by day (last 30 days)
  const heute = new Date();
  const vor30 = new Date(heute); vor30.setDate(heute.getDate() - 29);
  vor30.setHours(0, 0, 0, 0);

  const umsatzProTag = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(vor30); d.setDate(vor30.getDate() + i);
    umsatzProTag.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of bezahlt) {
    const tag = b.erstellt_am.slice(0, 10);
    if (umsatzProTag.has(tag)) {
      umsatzProTag.set(tag, (umsatzProTag.get(tag) ?? 0) + b.gesamt_cent);
    }
  }
  const chartDaten = Array.from(umsatzProTag.entries()).map(([datum, cent]) => ({ datum, cent }));

  // Revenue by event (top 10)
  const eventTitel = new Map((alleEvents ?? []).map((e) => [e.id, e.titel]));
  const umsatzProEvent = new Map<string, number>();
  for (const b of bezahlt) {
    umsatzProEvent.set(b.event_id, (umsatzProEvent.get(b.event_id) ?? 0) + b.gesamt_cent);
  }
  const topEvents = Array.from(umsatzProEvent.entries())
    .map(([id, cent]) => ({ id, titel: eventTitel.get(id) ?? id, cent }))
    .sort((a, b) => b.cent - a.cent)
    .slice(0, 10);

  // Buchungen by day-of-week
  const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const buchungenNachWochentag = new Array(7).fill(0);
  for (const b of bezahlt) {
    const tag = (new Date(b.erstellt_am).getDay() + 6) % 7; // Mon=0
    buchungenNachWochentag[tag]++;
  }

  // Buchungen by hour
  const buchungenNachStunde = new Array(24).fill(0);
  for (const b of bezahlt) {
    buchungenNachStunde[new Date(b.erstellt_am).getHours()]++;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gesamtumsatz</p>
                <p className="text-2xl font-bold mt-1">{euro(gesamtCent)}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <EuroIcon className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{bezahlt.length} bezahlte Buchungen</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tickets</p>
                <p className="text-2xl font-bold mt-1">{tickets.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Ticket className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{eingeloest} eingelöst</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversion</p>
                <p className="text-2xl font-bold mt-1">{conversion !== null ? `${conversion}%` : "—"}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Bezahlt / Initiiert</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Käufer</p>
                <p className="text-2xl font-bold mt-1">{bezahlt.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ø {bezahlt.length > 0 ? euro(Math.round(gesamtCent / bezahlt.length)) : "—"} pro Buchung</p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsClient
        chartDaten={chartDaten}
        topEvents={topEvents}
        buchungenNachWochentag={buchungenNachWochentag}
        buchungenNachStunde={buchungenNachStunde}
        wochentage={wochentage}
      />
    </div>
  );
}
