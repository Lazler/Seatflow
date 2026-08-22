import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { MapPin, Lightning as Zap, QrCode, ChartBar as BarChart3, Check, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Preisrechner from "@/components/pricing/preisrechner";
import BuilderDemo, { type BuilderDemoTexte } from "@/components/landing/builder-demo";
import { Reveal } from "@/components/landing/reveal";

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
    punkte: { title: string; desc: string }[];
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

// Das Kernprodukt zeigen: ein interaktiver Sitzplan, wie ihn Gäste beim
// Buchen sehen — nicht ein generisches Admin-Dashboard.
function SitzplanMockup() {
  const FARBE_PARKETT = "#53565c";
  const FARBE_PREMIUM = "#d9481f";
  const FARBE_BELEGT = "#6b6e73";
  const FARBE_GEWAEHLT = "#d9481f";

  // Deterministisch "zufällig" belegte Plätze (kein Math.random im Render)
  const istBelegt = (reihe: number, sitz: number) => (reihe * 13 + sitz * 7 + 3) % 11 < 3;
  const REIHEN = 6;
  const SITZE = 14;
  const R = 9;               // Sitzradius
  const ABSTAND = 26;        // horizontal
  const REIHEN_ABSTAND = 30; // vertikal
  const GANG = 30;           // Mittelgang-Lücke
  const breite = (SITZE - 1) * ABSTAND + GANG + 2 * R + 56;
  const startX = 44;
  const gewaehlt: [number, number][] = [[3, 6], [3, 7]];

  const sitzX = (s: number) => startX + s * ABSTAND + (s >= SITZE / 2 ? GANG : 0);
  const sitzY = (r: number) => 64 + r * REIHEN_ABSTAND;

  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6 -mb-8 z-10">
      <p className="text-center text-xs text-muted-foreground mb-3 uppercase tracking-widest font-medium">
        So buchen Ihre Gäste, direkt im Sitzplan
      </p>
      <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
        {/* Browser-Topbar */}
        <div className="h-9 bg-muted/60 border-b border-border flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <div className="flex-1 mx-4 h-4 bg-border/60 rounded-full max-w-56" />
        </div>

        <div className="flex">
          {/* Sitzplan — dunkler Bühnenrahmen, wie auf der echten Buchungsseite */}
          <div className="flex-1 min-w-0 bg-[#1c1d20] p-2 sm:p-4">
            <svg viewBox={`0 0 ${breite} ${64 + REIHEN * REIHEN_ABSTAND + 12}`} className="w-full h-auto" role="img"
              aria-label="Beispiel-Sitzplan mit Bühne, freien, belegten und ausgewählten Plätzen">
              {/* Bühne */}
              <rect x={breite / 2 - 130} y={12} width={260} height={26} rx={7} fill="#3a3c40" />
              <text x={breite / 2} y={29} textAnchor="middle" fill="rgba(250,250,250,0.9)"
                fontSize="10" fontWeight="700" letterSpacing="3">BÜHNE</text>

              {Array.from({ length: REIHEN }, (_, r) => (
                <g key={r}>
                  {/* Reihen-Label */}
                  <text x={startX - 26} y={sitzY(r) + 3.5} fontSize="10" fontWeight="700"
                    fill="rgba(250,250,250,0.55)" textAnchor="middle">{String.fromCharCode(65 + r)}</text>
                  {Array.from({ length: SITZE }, (_, s) => {
                    const selektiert = gewaehlt.some(([gr, gs]) => gr === r && gs === s);
                    const belegt = !selektiert && istBelegt(r, s);
                    const farbe = belegt ? FARBE_BELEGT : r < 2 ? FARBE_PREMIUM : FARBE_PARKETT;
                    return (
                      <g key={s}>
                        {selektiert && (
                          <circle cx={sitzX(s)} cy={sitzY(r)} r={R + 4} fill={FARBE_GEWAEHLT} opacity={0.22} />
                        )}
                        <circle cx={sitzX(s)} cy={sitzY(r)} r={R}
                          fill={selektiert ? "#ffffff" : farbe}
                          opacity={belegt ? 0.55 : 1}
                          stroke={selektiert ? FARBE_GEWAEHLT : belegt ? "none" : "rgba(255,255,255,0.4)"}
                          strokeWidth={selektiert ? 2 : 1.2} />
                      </g>
                    );
                  })}
                </g>
              ))}
            </svg>

            {/* Legende */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 sm:px-2 pt-1 text-[10px] sm:text-[11px] text-white/60">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FARBE_PREMIUM }} />Premium, 32 €</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FARBE_PARKETT }} />Parkett, 24 €</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FARBE_BELEGT }} />Belegt</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FARBE_GEWAEHLT }} />Ausgewählt</span>
            </div>
          </div>

          {/* Auswahl-Panel (wie die echte Buchungsseite) */}
          <div className="hidden md:flex w-52 shrink-0 border-l border-border flex-col">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold">Deine Auswahl</p>
            </div>
            <div className="px-4 py-3 space-y-2.5 flex-1">
              {["D-7", "D-8"].map((platz) => (
                <div key={platz} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: FARBE_GEWAEHLT }} />
                    <span className="font-mono">{platz}</span>
                    <span className="text-muted-foreground font-normal">Parkett</span>
                  </span>
                  <span className="text-xs tabular-nums font-medium">24,00 €</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Servicegebühr (2×)</span>
                <span className="tabular-nums">1,00 €</span>
              </div>
              <div className="border-t border-dashed border-border pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold">Gesamt</span>
                <span className="text-xs font-bold tabular-nums">49,00 €</span>
              </div>
            </div>
            <div className="p-3">
              <div className="h-9 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white">Weiter zur Bestellung →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-soft text-brand-deep rounded-full px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <p className="text-xs font-semibold uppercase tracking-widest">
            {c.hero.badge}
          </p>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-6">
          {c.hero.h1}{" "}
          <span className="text-brand">{c.hero.h1Accent}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
          {c.hero.lead}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
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
      </section>

      {/* Dashboard Mockup */}
      <SitzplanMockup />

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

      {/* USP: Der Raumplan-Builder — live und klickbar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)]">
            {c.usp.heading}{" "}
            <span className="text-brand">{c.usp.headingAccent}</span>
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">{c.usp.sub}</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Live-Demo: echter Buchungs-Canvas, klickbar */}
          <BuilderDemo texte={c.usp.demo} />

          {/* Customization-Punkte */}
          <div className="space-y-1">
            {c.usp.punkte.map((p, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="group flex gap-3 rounded-xl px-4 py-3 hover:bg-accent transition-colors">
                  <span className="mt-1 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
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
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">{c.features.heading}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {c.features.items.map((f, i) => {
              const Icon = ICON_MAP[f.icon];
              return (
                <Reveal key={f.title} delay={i * 0.06}>
                  <div className="flex gap-4 p-5 rounded-xl bg-background border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-[transform,border-color] duration-200">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
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
                  plan.highlight ? "border-border border-t-[3px] border-t-brand bg-background" : "border-border bg-background"
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
