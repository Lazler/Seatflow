import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { MapPin, Lightning as Zap, QrCode, ChartBar as BarChart3, Rows, Table, Palette, LockSimple, MagicWand, Stack, Check, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Preisrechner from "@/components/pricing/preisrechner";
import BuilderDemo, { type BuilderDemoTexte } from "@/components/landing/builder-demo";
import { Reveal, HeroReveal } from "@/components/landing/reveal";

export type LandingContent = {
  lang: "de" | "en" | "hu";
  nav: { anmelden: string; kostenlosStarten: string };
  hero: {
    badge: string;
    h1: string;
    h1Accent: string;
    lead: string;
    cta: string;
    subline: string;
  };
  steps: {
    heading: string;
    items: { num: string; title: string; desc: string }[];
  };
  stats: { value: string; label: string }[];
  usp: {
    heading: string;
    headingAccent: string;
    sub: string;
    demo: BuilderDemoTexte;
    punkte: { icon: "reihen" | "tische" | "kategorien" | "sperren" | "vorlagen" | "ebenen"; title: string; desc: string }[];
  };
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

const USP_ICON_MAP = {
  reihen: Rows,
  tische: Table,
  kategorien: Palette,
  sperren: LockSimple,
  vorlagen: MagicWand,
  ebenen: Stack,
};

export default function LandingPage({ c, registerPath, loginPath, blogPath = "/blog" }: {
  c: LandingContent;
  registerPath: string;
  loginPath: string;
  blogPath?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={loginPath}>{c.nav.anmelden}</Link>
            </Button>
            <Button variant="brand" size="sm" asChild>
              <Link href={registerPath}>{c.nav.kostenlosStarten}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero: asymmetrischer Split — Text links, echter klickbarer Sitzplan rechts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-12 items-center">
          <div>
            <HeroReveal>
              <div className="inline-flex items-center gap-2 bg-brand-soft text-brand-deep rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <p className="text-xs font-semibold uppercase tracking-widest">
                  {c.hero.badge}
                </p>
              </div>
            </HeroReveal>
            <HeroReveal delay={0.05}>
              <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl leading-[1.15] tracking-tight mb-6">
                {c.hero.h1}{" "}
                <span className="text-brand">{c.hero.h1Accent}</span>
              </h1>
            </HeroReveal>
            <HeroReveal delay={0.1}>
              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                {c.hero.lead}
              </p>
            </HeroReveal>
            <HeroReveal delay={0.15}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="brand" size="lg" asChild className="gap-2">
                  <Link href={registerPath}>
                    {c.hero.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  {/* Voll navigierender Link, die Route setzt die Demo-Session und leitet weiter */}
                  <a href="/api/demo/login">
                    {c.lang === "en" ? "View live demo" : c.lang === "hu" ? "Élő demó" : "Live-Demo ansehen"}
                  </a>
                </Button>
              </div>
            </HeroReveal>
          </div>

          {/* Echter klickbarer Sitzplan als Hero-Visual statt Fake-Screenshot */}
          <HeroReveal delay={0.12} className="w-full">
            <BuilderDemo texte={c.usp.demo} />
          </HeroReveal>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-border bg-muted/30 pt-16 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-4 text-center">
          {c.stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USP: Was der Raumplan-Builder abbildet */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)]">
            {c.usp.heading}{" "}
            <span className="text-brand">{c.usp.headingAccent}</span>
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">{c.usp.sub}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {c.usp.punkte.map((p, i) => {
            const Icon = USP_ICON_MAP[p.icon];
            return (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="h-full rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:-translate-y-0.5 transition-[transform,border-color] duration-200">
                  <span className="inline-flex w-9 h-9 rounded-lg bg-brand-soft text-brand items-center justify-center mb-4">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold leading-snug">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 pt-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">{c.steps.heading}</h2>
        <div className="grid sm:grid-cols-3 gap-8 relative">
          {/* Connecting line on desktop */}
          <div className="hidden sm:block absolute top-4 left-[calc(16.67%-0.5px)] right-[calc(16.67%-0.5px)] h-px bg-border z-0" />
          {c.steps.items.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.1} className="relative z-10">
              <div className="flex flex-col items-start">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-4 shrink-0">
                  {step.num}
                </span>
                <div className={i === 1 ? "sm:mt-5" : undefined}>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">{c.features.heading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {c.features.items.map((f, i) => {
              const Icon = ICON_MAP[f.icon];
              const gross = i === 0;
              return (
                <Reveal key={f.title} delay={i * 0.06} className={gross ? "sm:col-span-2" : undefined}>
                  <div
                    className={`h-full flex gap-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-[transform,border-color] duration-200 ${
                      gross ? "p-6 sm:items-center" : "p-5"
                    }`}
                  >
                    <div className={`shrink-0 rounded-lg bg-primary/10 flex items-center justify-center ${gross ? "w-12 h-12" : "w-9 h-9"}`}>
                      <Icon className={gross ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"} />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${gross ? "text-base" : "text-sm"}`}>{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
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
          {c.pricing.plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={`rounded-xl border p-6 flex flex-col h-full hover:-translate-y-0.5 transition-transform duration-200 ${
                  plan.highlight ? "border-border border-t-[3px] border-t-brand bg-brand-soft/40" : "border-border bg-background"
                }`}
              >
                {plan.highlight && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand mb-3">
                    {c.pricing.popular}
                  </span>
                )}
                <p className="font-semibold text-sm mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-mono text-3xl font-extrabold tabular-nums">{plan.price}</span>
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
                  variant={plan.highlight ? "brand" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={registerPath}>{c.pricing.startBtn}</Link>
                </Button>
              </div>
            </Reveal>
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
      <section className="border-t border-border bg-muted/30 py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">{c.hero.cta}</h2>
          <p className="text-sm text-muted-foreground mb-6">{c.hero.subline}</p>
          <Button variant="brand" size="lg" asChild className="gap-2">
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
            <Logo size="sm" />
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{c.footer}</span>
          </div>
          <div className="flex gap-5">
            <Link href={blogPath} className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">AGB</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link href="/imprint" className="hover:text-foreground transition-colors">Impressum</Link>
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
