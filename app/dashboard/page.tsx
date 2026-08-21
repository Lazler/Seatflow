import { createClient } from "@/lib/supabase/server";
import { getServerDict, getServerLocale } from "@/lib/i18n/server";
import { fmt, intlLocale } from "@/lib/i18n/buchung";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CurrencyEur as EuroIcon, Ticket, TrendUp as TrendingUp, CalendarCheck, Plus, ArrowRight, Clock, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { migrierteKonfiguration, elementSitzIds } from "@/types/sitzplan";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  entwurf: "secondary",
  veroeffentlicht: "default",
  abgesagt: "destructive",
  beendet: "outline",
};

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 px-4 sm:px-6 pb-5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <p className="font-mono text-2xl sm:text-3xl font-medium tracking-tight mt-2 truncate">{value}</p>
        <p className="text-xs text-muted-foreground mt-1.5 truncate">{sub}</p>
      </CardContent>
    </Card>
  );
}

function euro(cent: number, loc: string) {
  return (cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" });
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
  const [supabase, t, locale] = await Promise.all([createClient(), getServerDict(), getServerLocale()]);
  const dateLocale = intlLocale(locale);

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

  // ── Setup-Fortschritt (geführtes Onboarding) ──────────────────────────────
  const { data: meineVenues } = await supabase
    .from("venues")
    .select("id")
    .eq("veranstalter_id", user!.id);
  const venueIds = (meineVenues ?? []).map((v) => v.id);
  const { count: plaeneCount } = venueIds.length > 0
    ? await supabase.from("sitzplaene").select("id", { count: "exact", head: true }).in("venue_id", venueIds)
    : { count: 0 };
  const hatVenue = venueIds.length > 0;
  const hatPlan = (plaeneCount ?? 0) > 0;
  const hatEvent = (alleEvents ?? []).length > 0;
  const hatLive = (alleEvents ?? []).some((e) => e.status === "veroeffentlicht");
  const ersteVenueId = venueIds[0] ?? null;

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

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground mb-2">
            {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight truncate">{profil?.name ?? t.dashboard.title}</h1>
        </div>
        <Button asChild size="lg" className="self-start sm:self-auto shrink-0 gap-2">
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4" /> {t.dashboard.neuesEvent}
          </Link>
        </Button>
      </div>

      {/* ── KPI Kacheln ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={EuroIcon} label={t.dashboard.einnahmen} value={euro(gesamteinnahmenCent, dateLocale)}
          sub={t.dashboard.bezahlteBuchungen.replace("{n}", String(bezahlt.length))} />
        <StatCard icon={Ticket} label={t.analytics.tickets} value={String(gesamtTickets)}
          sub={t.dashboard.ticketsGesamt} />
        <StatCard icon={TrendingUp} label={t.dashboard.heute} value={String(buchungenHeute)}
          sub={t.dashboard.neueBuchungenHeute} />
        <StatCard icon={CalendarCheck} label={t.dashboard.liveEvents} value={String(aktiveEvents.length)}
          sub={t.dashboard.veroeffentlichtBevorstehend} />
      </div>

      {/* ── Geführtes Onboarding (bis zur ersten Veröffentlichung) ── */}
      {!hatLive && (() => {
        const schritte = [
          { done: hatVenue, titel: t.dashboardHome.schritt1Titel, desc: t.dashboardHome.schritt1Desc, href: "/dashboard/venues/new" },
          { done: hatPlan, titel: t.dashboardHome.schritt2Titel, desc: t.dashboardHome.schritt2Desc,
            href: ersteVenueId ? `/dashboard/venues/${ersteVenueId}` : "/dashboard/venues/new" },
          { done: hatEvent, titel: t.dashboardHome.schritt3Titel, desc: t.dashboardHome.schritt3Desc, href: "/dashboard/events/new" },
          { done: hatLive, titel: t.dashboardHome.schritt4Titel, desc: t.dashboardHome.schritt4Desc, href: "/dashboard/events" },
        ];
        const erledigte = schritte.filter((s) => s.done).length;
        const naechsterIdx = schritte.findIndex((s) => !s.done);

        return (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{t.dashboardHome.startklar}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{fmt(t.dashboardHome.erledigtVon, { erledigte })}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {schritte.map((step, i) => {
                  const istNaechster = i === naechsterIdx;
                  return (
                    <Link
                      key={i}
                      href={step.href}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${
                        istNaechster
                          ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle weight="fill" className="h-6 w-6 text-emerald-600 shrink-0" />
                      ) : (
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                          istNaechster ? "border-primary bg-primary text-primary-foreground" : "border-primary/30 text-primary"
                        }`}>
                          {i + 1}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-none ${step.done ? "text-muted-foreground line-through" : ""}`}>{step.titel}</p>
                        {!step.done && <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>}
                      </div>
                      {istNaechster && (
                        <span className="text-xs font-medium text-primary flex items-center gap-0.5 shrink-0">
                          {t.dashboardHome.jetzt} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Events + Auslastung ── */}
      {eventsTabelle.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-xl font-bold">{t.dashboard.auslastungUmsatz}</h2>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard/events">{t.dashboard.alleEvents} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {eventsTabelle.map((event) => {
              const sold     = ticketsProEvent.get(event.id) ?? 0;
              const kapazitaet = event.sitzplan_id ? (kapazitaetProSitzplan.get(event.sitzplan_id) ?? null) : null;
              const pct      = kapazitaet && kapazitaet > 0 ? Math.round((sold / kapazitaet) * 100) : null;
              const revenue  = einnahmenProEvent.get(event.id) ?? 0;
              const d = new Date(event.datum);

              return (
                <Link key={event.id} href={`/dashboard/events/${event.id}`}
                  className="grid grid-cols-[52px_1fr_auto] sm:grid-cols-[64px_1fr_auto_auto] items-center gap-4 py-4 -mx-2 px-2 rounded-md hover:bg-muted/40 transition-colors">
                  <div className="font-mono text-[11px] text-muted-foreground leading-tight">
                    <span className="block font-sans text-lg font-bold text-foreground leading-none mb-1">
                      {d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                    </span>
                    {d.toLocaleDateString(dateLocale, { weekday: "short" })} · {d.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{event.titel}</p>
                    {kapazitaet !== null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden shrink-0">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t.dashboard.plaetze.replace("{sold}", String(sold)).replace("{total}", String(kapazitaet))}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">{t.dashboard.ticketsVerkauft.replace("{n}", String(sold))}</p>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-mono font-medium text-right">{euro(revenue, dateLocale)}</span>
                  <Badge variant={STATUS_VARIANT[event.status]} className="text-[10px] px-1.5 py-0 justify-self-end shrink-0">
                    {STATUS_LABEL[event.status]}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Letzte Buchungen ── */}
      {recentBuchungen.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">{t.dashboard.letzteBuchungen}</h2>
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
                      <span className="text-sm font-semibold font-mono">{euro(b.gesamt_cent, dateLocale)}</span>
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
