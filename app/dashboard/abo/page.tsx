"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { effectivePlan, type Plan } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { Check, Lightning as Zap, Crown, LinkSimple as Link2, Warning as AlertTriangle, CheckCircle as CheckCircle2 } from "@phosphor-icons/react";

type ProfilData = {
  plan: string;
  abo_bis: string | null;
  stripe_subscription_id: string | null;
  stripe_account_id: string | null;
  stripe_connect_onboarded: boolean;
};

const MONTHLY_EUR = 29;
const ANNUAL_EUR = 249;

export default function AboPage() {
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [laedt, setLaedt] = useState(true);
  const [aktionLaedt, setAktionLaedt] = useState(false);
  const [connectLaedt, setConnectLaedt] = useState(false);
  const [interval, setInterval] = useState<"month" | "year">("year");
  const searchParams = useSearchParams();
  const connectSuccess = searchParams.get("connect") === "success";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("veranstalter_profile")
        .select("plan, abo_bis, stripe_subscription_id, stripe_account_id, stripe_connect_onboarded")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfil(data as ProfilData);
          setLaedt(false);
        });
    });
  }, []);

  const plan: Plan = profil ? effectivePlan(profil.plan, profil.abo_bis) : "free";
  const aboBisDatum = profil?.abo_bis ? new Date(profil.abo_bis) : null;

  async function upgradeToProClick() {
    setAktionLaedt(true);
    const res = await fetch("/api/abonnement/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setAktionLaedt(false);
  }

  async function manageClick() {
    setAktionLaedt(true);
    const res = await fetch("/api/abonnement/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setAktionLaedt(false);
  }

  async function connectClick() {
    setConnectLaedt(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setConnectLaedt(false);
  }

  if (laedt) {
    return <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Lädt…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Abonnement</h1>
        <p className="text-sm text-muted-foreground mt-1">Verwalte deinen Plan und deine Abrechnung.</p>
      </div>

      {/* Current plan badge */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan === "pro" ? "bg-primary/10" : "bg-muted"}`}>
          {plan === "pro" ? <Crown className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{plan === "pro" ? "Pro Plan" : "Free Plan"}</p>
          {plan === "pro" && aboBisDatum ? (
            <p className="text-sm text-muted-foreground">
              Aktiv bis {aboBisDatum.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">3 Events/Monat · max. 80 Plätze · €1,50 Servicegebühr/Ticket</p>
          )}
        </div>
        {plan === "pro" && (
          <Button variant="outline" size="sm" onClick={manageClick} disabled={aktionLaedt}>
            {aktionLaedt ? "Lädt…" : "Verwalten"}
          </Button>
        )}
      </div>

      {/* Upgrade card — only show on free */}
      {plan === "free" && (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-base">Upgrade auf Pro</p>
              <p className="text-sm text-muted-foreground mt-1">
                Rechnet sich ab <strong>40 Tickets pro Monat</strong> — dann ist Pro günstiger als Free.
              </p>
            </div>

            {/* Interval toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden text-sm shrink-0">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={`px-3 py-1.5 transition-colors ${interval === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                Monatlich
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={`px-3 py-1.5 transition-colors ${interval === "year" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                Jährlich{" "}
                <span className="text-[10px] font-semibold text-green-600 ml-1">−2 Mon.</span>
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">
              {interval === "year" ? `€${(ANNUAL_EUR / 12).toFixed(0)}` : `€${MONTHLY_EUR}`}
            </span>
            <span className="text-sm text-muted-foreground">/Monat</span>
            {interval === "year" && (
              <span className="text-xs text-muted-foreground ml-2">
                (€{ANNUAL_EUR}/Jahr — statt €{MONTHLY_EUR * 12})
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {[
              "Unlimitierte Events",
              "Unlimitierte Plätze",
              "Servicegebühr nur €0,75/Ticket (statt €1,50)",
              "Eigenes Branding auf Tickets",
              "Analytics",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button onClick={upgradeToProClick} disabled={aktionLaedt} className="w-full sm:w-auto">
            {aktionLaedt ? "Weiterleitung…" : `Pro ${interval === "year" ? "jährlich" : "monatlich"} abonnieren`}
          </Button>
        </div>
      )}

      {/* Stripe Connect */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Stripe-Auszahlungskonto</h2>
        <p className="text-sm text-muted-foreground">
          Verbinden Sie Ihr Stripe-Konto damit Ticketeinnahmen direkt an Sie ausgezahlt werden. SeatFlow behält nur die Servicegebühr.
        </p>

        {connectSuccess && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Ihr Stripe-Konto wurde erfolgreich verbunden. Zahlungen werden ab sofort direkt ausgezahlt.
          </div>
        )}

        {profil?.stripe_connect_onboarded ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">Stripe-Konto verbunden</p>
              <p className="text-xs text-emerald-700 mt-0.5">Ticketeinnahmen werden direkt auf Ihr Konto überwiesen.</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground hidden sm:block">
              {String(profil.stripe_account_id).slice(0, 18)}…
            </span>
          </div>
        ) : profil?.stripe_account_id ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Onboarding nicht abgeschlossen</p>
              <p className="text-xs text-amber-700 mt-0.5">Bitte schließen Sie die Stripe-Verifizierung ab, um Auszahlungen zu aktivieren.</p>
            </div>
            <Button size="sm" variant="outline" onClick={connectClick} disabled={connectLaedt}>
              {connectLaedt ? "Weiterleitung…" : "Fortsetzen"}
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Kein Stripe-Konto verbunden</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ohne verbundenes Konto verbleiben Ticketeinnahmen auf dem SeatFlow-Konto bis zur manuellen Auszahlung.
              </p>
            </div>
            <Button size="sm" onClick={connectClick} disabled={connectLaedt} className="shrink-0 gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              {connectLaedt ? "Weiterleitung…" : "Jetzt verbinden"}
            </Button>
          </div>
        )}
      </div>

      {/* Fee comparison table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
              <th className="text-center px-4 py-3 font-medium">Free</th>
              <th className="text-center px-4 py-3 font-medium text-primary">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              ["Events/Monat", "3", "Unbegrenzt"],
              ["Plätze/Event", "80", "Unbegrenzt"],
              ["Servicegebühr/Ticket", "€1,50", "€0,75"],
              ["Eigenes Branding", "–", "✓"],
              ["Analytics", "–", "✓"],
            ].map(([label, frei, pro]) => (
              <tr key={label}>
                <td className="px-4 py-3 text-muted-foreground">{label}</td>
                <td className="px-4 py-3 text-center">{frei}</td>
                <td className="px-4 py-3 text-center font-medium">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
