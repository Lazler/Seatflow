import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Lightning as Zap, QrCode, ChartBar as BarChart3, Check, ArrowRight } from "@phosphor-icons/react/dist/ssr";
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

// Das Kernprodukt zeigen: ein interaktiver Sitzplan, wie ihn Gäste beim
// Buchen sehen — nicht ein generisches Admin-Dashboard.
function SitzplanMockup() {
  const FARBE_PARKETT = "#3b82f6";
  const FARBE_PREMIUM = "#8b5cf6";
  const FARBE_BELEGT = "#cbd5e1";
  const FARBE_GEWAEHLT = "#10b981";

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
        So buchen Ihre Gäste — direkt im Sitzplan
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
          {/* Sitzplan */}
          <div className="flex-1 min-w-0 bg-[#fbfcfe] p-2 sm:p-4">
            <svg viewBox={`0 0 ${breite} ${64 + REIHEN * REIHEN_ABSTAND + 12}`} className="w-full h-auto" role="img"
              aria-label="Beispiel-Sitzplan mit Bühne, freien, belegten und ausgewählten Plätzen">
              {/* Bühne */}
              <rect x={breite / 2 - 130} y={12} width={260} height={26} rx={7} fill="#1e293b" />
              <text x={breite / 2} y={29} textAnchor="middle" fill="rgba(248,250,252,0.9)"
                fontSize="10" fontWeight="700" letterSpacing="3">BÜHNE</text>

              {Array.from({ length: REIHEN }, (_, r) => (
                <g key={r}>
                  {/* Reihen-Label */}
                  <text x={startX - 26} y={sitzY(r) + 3.5} fontSize="10" fontWeight="700"
                    fill="#94a3b8" textAnchor="middle">{String.fromCharCode(65 + r)}</text>
                  {Array.from({ length: SITZE }, (_, s) => {
                    const selektiert = gewaehlt.some(([gr, gs]) => gr === r && gs === s);
                    const belegt = !selektiert && istBelegt(r, s);
                    const farbe = selektiert ? FARBE_GEWAEHLT
                      : belegt ? FARBE_BELEGT
                      : r < 2 ? FARBE_PREMIUM : FARBE_PARKETT;
                    return (
                      <g key={s}>
                        {selektiert && (
                          <circle cx={sitzX(s)} cy={sitzY(r)} r={R + 4} fill={FARBE_GEWAEHLT} opacity={0.25} />
                        )}
                        <circle cx={sitzX(s)} cy={sitzY(r)} r={R} fill={farbe}
                          opacity={belegt ? 0.55 : 1}
                          stroke={belegt ? "none" : "rgba(255,255,255,0.65)"} strokeWidth={1.2} />
                      </g>
                    );
                  })}
                </g>
              ))}
            </svg>

            {/* Legende */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 sm:px-2 pt-1 text-[10px] sm:text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FARBE_PREMIUM }} />Premium — 32 €</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FARBE_PARKETT }} />Parkett — 24 €</span>
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
              <div className="h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-[11px] font-semibold text-primary-foreground">Weiter zur Bestellung →</span>
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
      <SitzplanMockup />

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
            <Link href={blogPath} className="hover:text-foreground transition-colors">Blog</Link>
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
