import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, QrCode, BarChart3, Check, ArrowRight } from "lucide-react";
import Preisrechner from "@/components/pricing/preisrechner";

export type LandingContent = {
  lang: "de" | "en" | "hu";
  nav: { anmelden: string; kostenlosStarten: string };
  hero: {
    badge: string;
    h1: string;
    h1Accent: string;
    lead: string;
    cta: string;
    ctaSecondary: string;
    subline: string;
  };
  steps: {
    heading: string;
    items: { num: string; title: string; desc: string }[];
  };
  stats: { value: string; label: string }[];
  features: {
    heading: string;
    items: { icon: "map" | "zap" | "qr" | "chart"; title: string; desc: string }[];
  };
  pricing: {
    heading: string;
    subline: string;
    popular: string;
    startBtn: string;
    plans: { name: string; price: string; period: string; desc: string; features: string[]; highlight: boolean }[];
    rechner: {
      heading: string;
      ticketsLabel: string;
      breakevenHint: string;
      upgradeBtn: string;
      currency: string;
    };
  };
  footer: string;
};

const ICON_MAP = {
  map: MapPin,
  zap: Zap,
  qr: QrCode,
  chart: BarChart3,
};

function LogoMark({ size = 7 }: { size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} bg-primary rounded-lg flex items-center justify-center shrink-0`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 text-primary-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z" />
        <line x1="9" y1="8" x2="9" y2="16" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6 -mb-8 z-10">
      <p className="text-center text-xs text-muted-foreground mb-3 uppercase tracking-widest font-medium">
        So sieht Ihr Dashboard aus
      </p>
      <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
        {/* Mock-Topbar */}
        <div className="h-9 bg-muted/60 border-b border-border flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <div className="flex-1 mx-4 h-4 bg-border/60 rounded-full max-w-48" />
        </div>
        <div className="flex" style={{ minHeight: 260 }}>
          {/* Mock-Sidebar */}
          <div className="w-44 shrink-0 border-r border-border bg-card p-3 space-y-1 hidden sm:block">
            <div className="h-8 flex items-center gap-2 mb-3 px-1">
              <div className="w-5 h-5 rounded bg-primary shrink-0" />
              <div className="h-3 bg-muted rounded flex-1" />
            </div>
            {[80, 65, 90, 55, 70, 60].map((w, i) => (
              <div
                key={i}
                className={`h-7 rounded-md flex items-center gap-2 px-2 ${i === 0 ? "bg-primary/15" : ""}`}
              >
                <div className={`w-3.5 h-3.5 rounded ${i === 0 ? "bg-primary/40" : "bg-muted"}`} />
                <div
                  className={`h-2.5 rounded ${i === 0 ? "bg-primary/30" : "bg-muted"}`}
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
          {/* Mock-Content */}
          <div className="flex-1 p-5 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { color: "bg-emerald-100", bar: "bg-emerald-400" },
                { color: "bg-blue-100", bar: "bg-blue-400" },
                { color: "bg-violet-100", bar: "bg-violet-400" },
                { color: "bg-amber-100", bar: "bg-amber-400" },
              ].map((c, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="h-2 bg-muted rounded w-16" />
                      <div className="h-4 bg-foreground/15 rounded w-12" />
                    </div>
                    <div className={`w-7 h-7 rounded-lg ${c.color} shrink-0`} />
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${40 + i * 15}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Event List */}
            <div className="space-y-2">
              {[90, 60, 35].map((pct, i) => (
                <div key={i} className="rounded-lg border border-border px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-foreground/15 rounded" style={{ width: `${50 + i * 10}%` }} />
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="h-2.5 w-14 bg-muted rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ c, registerPath, loginPath }: {
  c: LandingContent;
  registerPath: string;
  loginPath: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={7} />
            <span className="font-semibold">SeatFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={loginPath}>{c.nav.anmelden}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={registerPath}>{c.nav.kostenlosStarten}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest">
            {c.hero.badge}
          </p>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6">
          {c.hero.h1}{" "}
          <span className="text-primary italic">{c.hero.h1Accent}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
          {c.hero.lead}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Button size="lg" asChild className="gap-2">
            <Link href={registerPath}>
              {c.hero.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={loginPath}>{c.hero.ctaSecondary}</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{c.hero.subline}</p>
      </section>

      {/* Dashboard Mockup */}
      <DashboardMockup />

      {/* Stats row */}
      <section className="border-y border-border bg-muted/30 pt-16 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-4 text-center">
          {c.stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">{c.steps.heading}</h2>
        <div className="grid sm:grid-cols-3 gap-8 relative">
          {/* Connecting line on desktop */}
          <div className="hidden sm:block absolute top-4 left-[calc(16.67%-0.5px)] right-[calc(16.67%-0.5px)] h-px bg-border z-0" />
          {c.steps.items.map((step) => (
            <div key={step.num} className="flex flex-col items-start relative z-10">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-4 shrink-0">
                {step.num}
              </span>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">{c.features.heading}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {c.features.items.map((f) => {
              const Icon = ICON_MAP[f.icon];
              return (
                <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">{c.pricing.heading}</h2>
        <p className="text-center text-sm text-muted-foreground mb-12">{c.pricing.subline}</p>
        <div className="grid lg:grid-cols-3 gap-8 max-w-4xl mx-auto items-start">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
          {c.pricing.plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlight ? "border-primary shadow-sm bg-primary/[0.03]" : "border-border bg-background"
              }`}
            >
              {plan.highlight && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-3">
                  {c.pricing.popular}
                </span>
              )}
              <p className="font-semibold text-sm mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-5">{plan.desc}</p>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlight ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={registerPath}>{c.pricing.startBtn}</Link>
              </Button>
            </div>
          ))}
        </div>
        <Preisrechner
          registerPath={registerPath}
          labels={{
            heading: c.pricing.rechner.heading,
            ticketsLabel: c.pricing.rechner.ticketsLabel,
            breakevenHint: c.pricing.rechner.breakevenHint,
            upgradeBtn: c.pricing.rechner.upgradeBtn,
            currency: c.pricing.rechner.currency,
          }}
        />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-primary/5 py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">{c.hero.cta}</h2>
          <p className="text-sm text-muted-foreground mb-6">{c.hero.subline}</p>
          <Button size="lg" asChild className="gap-2">
            <Link href={registerPath}>
              {c.hero.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <LogoMark size={6} />
            <span className="font-medium text-foreground">SeatFlow</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{c.footer}</span>
          </div>
          <div className="flex gap-5">
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/agb" className="hover:text-foreground transition-colors">AGB</Link>
            <Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
          </div>
          <div className="flex gap-3">
            <Link href={loginPath} className="hover:text-foreground transition-colors">{c.nav.anmelden}</Link>
            <Link href={registerPath} className="text-primary font-medium hover:text-primary/80 transition-colors">
              {c.nav.kostenlosStarten}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
