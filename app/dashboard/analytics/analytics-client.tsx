"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dict, Locale } from "@/lib/i18n";
import { intlLocale } from "@/lib/i18n/buchung";

type ChartDatum = { datum: string; cent: number };
type EventDatum = { id: string; titel: string; cent: number };

function euro(cent: number, loc: string) {
  return (cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" });
}

// Kompakte Zahl für die direkten Balken-Labels (1.234, 12,3k)
function kompakt(v: number, loc: string) {
  if (v >= 1000) return `${(v / 1000).toLocaleString(loc, { maximumFractionDigits: 1 })}k`;
  return v.toLocaleString(loc);
}
function euroKompakt(cent: number, loc: string) {
  const v = cent / 100;
  if (v >= 1000) return `${(v / 1000).toLocaleString(loc, { maximumFractionDigits: 1 })}k €`;
  return `${Math.round(v).toLocaleString(loc)} €`;
}

const BAR_TRACK = 128; // px — Höhe der Balkenfläche (h-32)
const BAR_MAX = 108;   // px — max. Balkenhöhe, lässt oben Platz fürs Wert-Label

// Säulendiagramm im Stil gängiger Chart-Libraries (Tremor/shadcn):
// dünne, oben abgerundete Balken auf einer Grundlinie, mit DIREKT sichtbaren
// Zahlen (nicht nur beim Hovern) + präzisem Hover-Tooltip als Zusatzebene.
function BarChart({
  data,
  maxValue,
  tooltipFn,
  labelFn,
  color = "bg-primary",
  emptyLabel,
  scrollable = false,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  // exakter Wert im Hover-Tooltip
  tooltipFn?: (v: number) => string;
  // kompakter Wert direkt am Balken; fehlt er, wird nichts direkt beschriftet
  labelFn?: (v: number) => string;
  color?: string;
  emptyLabel: string;
  // scrollable: feste Balkenbreite + min-w-max (Container muss overflow-x-auto sein)
  scrollable?: boolean;
}) {
  // Balken beim Erscheinen von 0 hochwachsen lassen
  const [mounted, setMounted] = useState(false);
  const [aktiv, setAktiv] = useState<number | null>(null);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  if (maxValue === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{emptyLabel}</p>;
  }

  // Bei wenigen Balken jeden Wert beschriften, bei vielen nur die Spitze —
  // sonst wird es unleserlich (Direktlabels wirken, weil sie sparsam sind).
  const alleWerte = data.length <= 12;
  const spitzeIdx = data.reduce((best, d, i, arr) => (d.value > arr[best].value ? i : best), 0);
  const slot = scrollable ? "w-10 shrink-0" : "flex-1 min-w-0";

  return (
    <div className={scrollable ? "min-w-max" : ""}>
      {/* Balkenfläche mit Grundlinie */}
      <div className="flex gap-1.5 items-end border-b border-border" style={{ height: BAR_TRACK }}>
        {data.map((d, i) => {
          const hoehe = Math.round((d.value / maxValue) * BAR_MAX);
          const zielHoehe = d.value > 0 ? Math.max(hoehe, 3) : 0;
          const zeigeWert = !!labelFn && d.value > 0 && (alleWerte || i === spitzeIdx);
          const gedimmt = aktiv !== null && aktiv !== i;
          return (
            <div
              key={i}
              onMouseEnter={() => setAktiv(i)}
              onMouseLeave={() => setAktiv(null)}
              className={`${slot} h-full flex flex-col items-center justify-end group relative`}
            >
              {/* präziser Wert im Hover-Tooltip */}
              {d.value > 0 && tooltipFn && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full bg-popover border border-border text-[10px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {tooltipFn(d.value)}
                </div>
              )}
              {/* direkt sichtbarer Wert am Balken */}
              {zeigeWert && (
                <span className={`text-[10px] leading-none tabular-nums mb-1 transition-colors ${aktiv === i ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {labelFn!(d.value)}
                </span>
              )}
              <div
                className={`w-full ${color} rounded-t-[4px] transition-[height,opacity] duration-700 ease-out`}
                style={{
                  height: mounted ? zielHoehe : 0,
                  maxWidth: 22,
                  opacity: gedimmt ? 0.35 : 1,
                  transitionDelay: `${i * 20}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X-Achsen-Beschriftung — bei vielen Balken kurze Labels nicht abschneiden */}
      <div className="flex gap-1.5 pt-1.5">
        {data.map((d, i) => (
          <span key={i} className={`${slot} text-[9px] text-muted-foreground text-center ${scrollable ? "truncate" : "whitespace-nowrap"}`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsClient({
  chartDaten,
  topEvents,
  buchungenNachWochentag,
  buchungenNachStunde,
  wochentage,
  t,
  locale,
}: {
  chartDaten: ChartDatum[];
  topEvents: EventDatum[];
  buchungenNachWochentag: number[];
  buchungenNachStunde: number[];
  wochentage: string[];
  t: Dict["analytics"];
  locale: Locale;
}) {
  const loc = intlLocale(locale);
  const euroL = (c: number) => euro(c, loc);
  const kompaktL = (v: number) => kompakt(v, loc);
  const euroKompaktL = (c: number) => euroKompakt(c, loc);
  const [zeitraum, setZeitraum] = useState<7 | 14 | 30>(30);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const sichtbareDaten = chartDaten.slice(-zeitraum);
  const maxCent = Math.max(...sichtbareDaten.map((d) => d.cent), 1);
  const maxWochentag = Math.max(...buchungenNachWochentag, 1);
  const maxStunde = Math.max(...buchungenNachStunde, 1);
  const maxTopEvent = Math.max(...topEvents.map((e) => e.cent), 1);

  const revenueBarData = sichtbareDaten.map((d) => ({
    label: new Date(d.datum).toLocaleDateString(loc, { day: "numeric", month: "short" }),
    value: d.cent,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t.umsatz}</CardTitle>
            <div className="flex gap-1">
              {([7, 14, 30] as const).map((z) => (
                <button key={z} onClick={() => setZeitraum(z)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    zeitraum === z ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {z}{t.tageSuffix}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Horizontal scrollbar bei vielen Tagen — feste Balkenbreite, Datum je Balken */}
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <BarChart data={revenueBarData} maxValue={maxCent} tooltipFn={euroL} labelFn={euroKompaktL} color="bg-emerald-500" emptyLabel={t.nochKeineDaten} scrollable />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t.topEvents}</CardTitle></CardHeader>
          <CardContent>
            {topEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t.nochKeineDaten}</p>
            ) : (
              <div className="space-y-3">
                {topEvents.map((e, i) => (
                  <div key={e.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[180px] font-medium">{e.titel}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{euroL(e.cent)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${mounted ? Math.round((e.cent / maxTopEvent) * 100) : 0}%`, transitionDelay: `${i * 40}ms` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t.nachWochentag}</CardTitle></CardHeader>
          <CardContent>
            <BarChart
              data={buchungenNachWochentag.map((v, i) => ({ label: wochentage[i], value: v }))}
              maxValue={maxWochentag} tooltipFn={kompaktL} labelFn={kompaktL} color="bg-violet-500" emptyLabel={t.nochKeineDaten}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{t.nachUhrzeit}</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={buchungenNachStunde.map((v, i) => ({ label: i % 3 === 0 ? `${i}` : "", value: v }))}
            maxValue={maxStunde} tooltipFn={kompaktL} labelFn={kompaktL} color="bg-amber-500" emptyLabel={t.nochKeineDaten}
          />
        </CardContent>
      </Card>
    </div>
  );
}
