import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, QrCode, BarChart3, Check } from "lucide-react";

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
  };
  footer: string;
};

const ICON_MAP = {
  map: MapPin,
  zap: Zap,
  qr: QrCode,
  chart: BarChart3,
};

export default function LandingPage({ c, registerPath, loginPath }: {
  c: LandingContent;
  registerPath: string;
  loginPath: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-[11px]">SF</span>
            </div>
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          {c.hero.badge}
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
          {c.hero.h1}{" "}
          <span className="text-primary">{c.hero.h1Accent}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
          {c.hero.lead}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Button size="lg" asChild>
            <Link href={registerPath}>{c.hero.cta}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={loginPath}>{c.hero.ctaSecondary}</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{c.hero.subline}</p>
      </section>

      {/* Stats row */}
      <section className="border-y border-border bg-muted/30">
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
        <div className="grid sm:grid-cols-3 gap-8">
          {c.steps.items.map((step) => (
            <div key={step.num} className="flex flex-col items-start">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
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
                <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-background border border-border">
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
        <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
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
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-muted/30 py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">{c.hero.cta}</h2>
          <p className="text-sm text-muted-foreground mb-6">{c.hero.subline}</p>
          <Button size="lg" asChild>
            <Link href={registerPath}>{c.hero.cta}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {c.footer}
      </footer>
    </div>
  );
}
