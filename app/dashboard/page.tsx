import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EuroIcon, Ticket, TrendingUp, CalendarCheck, Plus, ArrowRight, Clock } from "lucide-react";
import { migrierteKonfiguration, elementSitzIds } from "@/types/sitzplan";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  entwurf: "secondary",
  veroeffentlicht: "default",
  abgesagt: "destructive",
  beendet: "outline",
};

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function zeitVor(iso: string, t: import("@/lib/i18n").Dict["time"]) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t.geradeEben;
  if (min < 60) return t.vorMin.replace("{min}", String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t.vorStd.replace("{h}", String(h));
  const d = Math.floor(h / 24);
  return (d === 1 ? t.vorTagen : t.vorTagen_pl).replace("{d}", String(d));
}

export default async function Dashboard() {
  const [supabase, t] = await Promise.all([createClient(), getServerDict()]);

  const STATUS_LABEL: Record<string, string> = {
    entwurf: t.status.entwurf,
    veroeffentlicht: t.status.live,
    abgesagt: t.status.abgesagt,
    beendet: t.status.beendet,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("name")
    .eq("id", user!.id)
    .single();

  const { data: alleEvents } = await supabase
    .from("events")
    .select("id, titel, datum, status, sitzplan_id")
    .eq("veranstalter_id", user!.id)
    .order("datum", { ascending: false });

  const eventIds = (alleEvents ?? []).map((e) => e.id);
  const sitzplanIds = [...new Set((alleEvents ?? []).map((e) => e.sitzplan_id).filter(Boolean) as string[])];

  const [buchungenRes, ticketsRes, sitzplaeneRes] = await Promise.all([
    eventIds.length > 0
      ? supabase
          .from("buchungen")
          .select("id, gaest_name, gesamt_cent, status, erstellt_am, event_id")
          .in("event_id", eventIds)
          .order("erstellt_am", { ascending: false })
      : { data: [] },
    eventIds.length > 0
      ? supabase.from("tickets").select("event_id").in("event_id", eventIds)
      : { data: [] },
    sitzplanIds.length > 0
      ? supabase.from("sitzplaene").select("id, konfiguration").in("id", sitzplanIds)
      : { data: [] },
  ]);

  const buchungen = buchungenRes.data ?? [];
  const tickets   = ticketsRes.data ?? [];
  const sitzplaene = sitzplaeneRes.data ?? [];

  // ── Metrics ──────────────────────────────────────────────
  const bezahlt = buchungen.filter((b) => b.status === "bezahlt");
  const gesamteinnahmenCent = bezahlt.reduce((s, b) => s + b.gesamt_cent, 0);
  const gesamtTickets = tickets.length;

  const tagesstart = new Date(); tagesstart.setHours(0, 0, 0, 0);
  const buchungenHeute = buchungen.filter((b) => new Date(b.erstellt_am) >= tagesstart).length;

  const jetzt = new Date();
  const aktiveEvents = (alleEvents ?? []).filter(
    (e) => e.status === "veroeffentlicht" && new Date(e.datum) >= jetzt
  );

  // ── Per-event lookups ─────────────────────────────────────
  const ticketsProEvent = new Map<string, number>();
  for (const tk of tickets) {
    ticketsProEvent.set(tk.event_id, (ticketsProEvent.get(tk.event_id) ?? 0) + 1);
  }

  const einnahmenProEvent = new Map<string, number>();
  for (const b of bezahlt) {
    einnahmenProEvent.set(b.event_id, (einnahmenProEvent.get(b.event_id) ?? 0) + b.gesamt_cent);
  }

  const kapazitaetProSitzplan = new Map<string, number>();
  for (const plan of sitzplaene) {
    const konfig = migrierteKonfiguration(plan.konfiguration);
    kapazitaetProSitzplan.set(
      plan.id,
      konfig.elemente.reduce((s, e) => s + elementSitzIds(e).length, 0)
    );
  }

  // Events to show in the sales table: active first, then recent past
  const eventsTabelle = [
    ...(alleEvents ?? []).filter((e) => e.status === "veroeffentlicht" && new Date(e.datum) >= jetzt),
    ...(alleEvents ?? []).filter((e) => e.status === "beendet" || (e.status === "veroeffentlicht" && new Date(e.datum) < jetzt)),
  ].slice(0, 6);

  const recentBuchungen = buchungen.slice(0, 8);
  const eventTitel = new Map((alleEvents ?? []).map((e) => [e.id, e.titel]));

  const hatDaten = buchungen.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profil?.name ?? t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/events/neu">
            <Plus className="h-4 w-4 mr-1.5" /> {t.dashboard.neuesEvent}
          </Link>
        </Button>
      </div>

      {/* ── KPI Kacheln ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.dashboard.einnahmen}</p>
                <p className="text-2xl font-bold mt-1">{euro(gesamteinnahmenCent)}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <EuroIcon className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t.dashboard.bezahlteBuchungen.replace("{n}", String(bezahlt.length))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.analytics.tickets}</p>
                <p className="text-2xl font-bold mt-1">{gesamtTickets}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Ticket className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t.dashboard.ticketsGesamt}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.dashboard.heute}</p>
                <p className="text-2xl font-bold mt-1">{buchungenHeute}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t.dashboard.neueBuchungenHeute}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.dashboard.liveEvents}</p>
                <p className="text-2xl font-bold mt-1">{aktiveEvents.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t.dashboard.veroeffentlichtBevorstehend}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Keine Daten: Onboarding ── */}
      {!hatDaten && (alleEvents ?? []).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold mb-1">{t.dashboard.nochKeineEvents}</p>
            <p className="text-sm text-muted-foreground mb-5">
              {t.dashboard.erstelleErstesEvent}
            </p>
            <Button asChild>
              <Link href="/dashboard/events/neu">
                <Plus className="h-4 w-4 mr-1.5" /> {t.dashboard.erstesEventErstellen}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Events + Auslastung ── */}
      {eventsTabelle.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{t.dashboard.auslastungUmsatz}</h2>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard/events">{t.dashboard.alleEvents} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {eventsTabelle.map((event) => {
              const sold     = ticketsProEvent.get(event.id) ?? 0;
              const kapazitaet = event.sitzplan_id ? (kapazitaetProSitzplan.get(event.sitzplan_id) ?? null) : null;
              const pct      = kapazitaet && kapazitaet > 0 ? Math.round((sold / kapazitaet) * 100) : null;
              const revenue  = einnahmenProEvent.get(event.id) ?? 0;
              const istLive  = event.status === "veroeffentlicht" && new Date(event.datum) >= jetzt;

              return (
                <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                  <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{event.titel}</span>
                            <Badge variant={STATUS_VARIANT[event.status]} className="text-[10px] px-1.5 py-0 shrink-0">
                              {STATUS_LABEL[event.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.datum).toLocaleDateString("de-DE", {
                              weekday: "short", day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                          {/* Capacity bar */}
                          {kapazitaet !== null ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {t.dashboard.plaetze.replace("{sold}", String(sold)).replace("{total}", String(kapazitaet))}
                                </span>
                                <span className={`font-semibold ${pct! >= 90 ? "text-red-600" : pct! >= 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                                  {pct}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct! >= 90 ? "bg-red-500" : pct! >= 60 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">{t.dashboard.ticketsVerkauft.replace("{n}", String(sold))}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-sm font-semibold">{euro(revenue)}</p>
                          {istLive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Letzte Buchungen ── */}
      {recentBuchungen.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">{t.dashboard.letzteBuchungen}</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentBuchungen.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">{b.gaest_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {eventTitel.get(b.event_id) ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-semibold">{euro(b.gesamt_cent)}</span>
                      <Badge
                        variant={b.status === "bezahlt" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0 hidden sm:inline-flex"
                      >
                        {b.status === "bezahlt" ? t.status.bezahlt : b.status === "ausstehend" ? t.status.ausstehend : b.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                        <Clock className="h-3 w-3" />
                        {zeitVor(b.erstellt_am, t.time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
