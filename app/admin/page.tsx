import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { effectivePlan } from "@/lib/plan";
import { DEMO_USER_ID } from "@/lib/demo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyEur as EuroIcon, Users, Ticket, TrendUp as TrendingUp, LinkSimple as Link2, Warning as AlertTriangle } from "@phosphor-icons/react/dist/ssr";

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export default async function AdminPage() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_USER_IDS.includes(user.id)) redirect("/dashboard");

  const admin = createAdminClient();

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const [profilesRes, buchungenRes, ticketsRes, demoEventsRes] = await Promise.all([
    admin.from("veranstalter_profile").select("id, name, plan, abo_bis, stripe_account_id, stripe_connect_onboarded, erstellt_am"),
    admin.from("buchungen").select("id, event_id, gesamt_cent, status, erstellt_am"),
    admin.from("tickets").select("id, buchung_id, preis_cent"),
    admin.from("events").select("id").eq("veranstalter_id", DEMO_USER_ID),
  ]);

  // Demokonto aus den Plattform-Kennzahlen ausschließen — es sind keine echten
  // Kunden/Umsätze, sondern nur Anschauungsdaten.
  const demoEventIds = new Set((demoEventsRes.data ?? []).map((e) => e.id));
  const profile = (profilesRes.data ?? []).filter((p) => p.id !== DEMO_USER_ID);
  const buchungenAlle = buchungenRes.data ?? [];
  const demoBuchungIds = new Set(buchungenAlle.filter((b) => demoEventIds.has(b.event_id)).map((b) => b.id));
  const buchungen = buchungenAlle.filter((b) => !demoEventIds.has(b.event_id));
  const tickets = (ticketsRes.data ?? []).filter((t) => !demoBuchungIds.has(t.buchung_id));

  // ── User metrics ───────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const proUser = profile.filter((p) => effectivePlan(p.plan, p.abo_bis) === "pro");
  const freeUser = profile.filter((p) => effectivePlan(p.plan, p.abo_bis) === "free");
  const neueUserDiesenMonat = profile.filter((p) => p.erstellt_am && new Date(p.erstellt_am) >= monthStart).length;
  const connectVerbunden = profile.filter((p) => p.stripe_connect_onboarded).length;
  const connectAusstehend = profile.filter((p) => p.stripe_account_id && !p.stripe_connect_onboarded).length;

  // MRR: Pro-Abos × Monatspreis (Jahresabo ÷ 12)
  const MRR_MONTHLY = 29;
  // Approximation: we don't store billing interval, so use monthly rate for all Pro
  const mrrCent = proUser.length * MRR_MONTHLY * 100;

  // ── Revenue metrics ────────────────────────────────────────────────────────
  const bezahlte = buchungen.filter((b) => b.status === "bezahlt");

  // Fee revenue = gesamt_cent - sum(ticket.preis_cent) per booking
  const ticketsByBuchung = new Map<string, number>();
  for (const t of tickets) {
    ticketsByBuchung.set(t.buchung_id, (ticketsByBuchung.get(t.buchung_id) ?? 0) + t.preis_cent);
  }

  let gesamtTicketFeesCent = 0;
  let gesamtBruttoCent = 0;
  const feesProMonat = new Map<string, number>();

  for (const b of bezahlte) {
    const sitzpreise = ticketsByBuchung.get(b.id) ?? 0;
    const fee = Math.max(0, b.gesamt_cent - sitzpreise);
    gesamtTicketFeesCent += fee;
    gesamtBruttoCent += b.gesamt_cent;

    const monat = b.erstellt_am ? b.erstellt_am.slice(0, 7) : "unbekannt";
    feesProMonat.set(monat, (feesProMonat.get(monat) ?? 0) + fee);
  }

  const feeDiesenMonat = feesProMonat.get(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`) ?? 0;
  const buchungenDiesenMonat = bezahlte.filter((b) => b.erstellt_am && new Date(b.erstellt_am) >= monthStart).length;

  // Last 6 months revenue trend
  const letzteMonateKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    letzteMonateKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const maxFeeMonat = Math.max(...letzteMonateKeys.map((k) => feesProMonat.get(k) ?? 0), 1);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Internes Dashboard</p>
          <h1 className="text-2xl font-bold">Revenue & Platform-Übersicht</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stand: {now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MRR (approx.)</p>
                  <p className="text-2xl font-bold mt-1">{euro(mrrCent)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{proUser.length} Pro-Abos aktiv</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket-Fees gesamt</p>
                  <p className="text-2xl font-bold mt-1">{euro(gesamtTicketFeesCent)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <EuroIcon className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Diesen Monat: {euro(feeDiesenMonat)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Veranstalter</p>
                  <p className="text-2xl font-bold mt-1">{profile.length}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">+{neueUserDiesenMonat} diesen Monat</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Buchungen/Monat</p>
                  <p className="text-2xl font-bold mt-1">{buchungenDiesenMonat}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Ticket className="h-4 w-4 text-violet-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Gesamt: {bezahlte.length} bezahlt</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket-Fee-Umsatz — letzte 6 Monate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32">
              {letzteMonateKeys.map((key) => {
                const fee = feesProMonat.get(key) ?? 0;
                const pct = Math.round((fee / maxFeeMonat) * 100);
                const [year, month] = key.split("-");
                const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("de-DE", { month: "short" });
                const isCurrentMonth = key === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground font-mono">{euro(fee)}</span>
                    <div className="w-full flex items-end" style={{ height: 80 }}>
                      <div
                        className={`w-full rounded-t-md transition-all ${isCurrentMonth ? "bg-primary" : "bg-primary/30"}`}
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className={`text-xs ${isCurrentMonth ? "font-semibold text-primary" : "text-muted-foreground"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plan Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan-Verteilung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pro</span>
                  <span className="font-semibold">{proUser.length} ({profile.length ? Math.round((proUser.length / profile.length) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: profile.length ? `${(proUser.length / profile.length) * 100}%` : "0%" }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Free</span>
                  <span className="font-semibold">{freeUser.length}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Brutto-Ticketumsatz gesamt</span>
                  <span className="font-medium text-foreground">{euro(gesamtBruttoCent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>davon SeatFlow-Fees</span>
                  <span className="font-medium text-foreground">{euro(gesamtTicketFeesCent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee-Quote</span>
                  <span className="font-medium text-foreground">
                    {gesamtBruttoCent ? `${((gesamtTicketFeesCent / gesamtBruttoCent) * 100).toFixed(1)}%` : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Connect Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Stripe Connect Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-2xl font-bold text-emerald-700">{connectVerbunden}</p>
                  <p className="text-xs text-emerald-600 mt-1">Verbunden</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-2xl font-bold text-amber-700">{connectAusstehend}</p>
                  <p className="text-xs text-amber-600 mt-1">Ausstehend</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-2xl font-bold">{profile.length - connectVerbunden - connectAusstehend}</p>
                  <p className="text-xs text-muted-foreground mt-1">Nicht verbunden</p>
                </div>
              </div>
              {connectVerbunden < profile.length && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{profile.length - connectVerbunden} Veranstalter ohne verbundenes Stripe-Konto — Auszahlungen müssen manuell veranlasst werden.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Veranstalter-Tabelle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alle Veranstalter</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stripe Connect</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Registriert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profile.map((p) => {
                    const aktiverPlan = effectivePlan(p.plan, p.abo_bis);
                    return (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{p.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${aktiverPlan === "pro" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {aktiverPlan === "pro" ? "Pro" : "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.stripe_connect_onboarded ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verbunden
                            </span>
                          ) : p.stripe_account_id ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Ausstehend
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {p.erstellt_am ? new Date(p.erstellt_am).toLocaleDateString("de-DE") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
