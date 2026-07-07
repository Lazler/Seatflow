"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dict } from "@/lib/i18n";

type ChartDatum = { datum: string; cent: number };
type EventDatum = { id: string; titel: string; cent: number };

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function BarChart({
  data,
  maxValue,
  valueFn,
  color = "bg-primary",
  emptyLabel,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  valueFn?: (v: number) => string;
  color?: string;
  emptyLabel: string;
}) {
  // Balken beim Erscheinen von 0 hochwachsen lassen
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  if (maxValue === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{emptyLabel}</p>;
  }
  return (
    <div className="flex gap-1 h-32">
      {data.map((d, i) => {
        const pct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        const zielHoehe = Math.max(pct, d.value > 0 ? 2 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full">
            {d.value > 0 && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover border border-border text-[10px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {valueFn ? valueFn(d.value) : d.value}
              </div>
            )}
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full ${color} rounded-t transition-[height] duration-700 ease-out`}
                style={{ height: `${mounted ? zielHoehe : 0}%`, transitionDelay: `${i * 22}ms` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
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
}: {
  chartDaten: ChartDatum[];
  topEvents: EventDatum[];
  buchungenNachWochentag: number[];
  buchungenNachStunde: number[];
  wochentage: string[];
  t: Dict["analytics"];
}) {
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
    label: new Date(d.datum).toLocaleDateString("de-DE", { day: "numeric", month: "short" }),
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
          <BarChart data={revenueBarData} maxValue={maxCent} valueFn={euro} color="bg-emerald-500" emptyLabel={t.nochKeineDaten} />
          <div className="flex items-center gap-1 mt-1">
            {sichtbareDaten.map((d, i) => {
              const every = zeitraum <= 7 ? 1 : zeitraum <= 14 ? 2 : 5;
              const show = i % every === 0 || i === sichtbareDaten.length - 1;
              return (
                <div key={i} className="flex-1 text-center">
                  {show && <span className="text-[9px] text-muted-foreground">{new Date(d.datum).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>}
                </div>
              );
            })}
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
                      <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{euro(e.cent)}</span>
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
              maxValue={maxWochentag} color="bg-violet-500" emptyLabel={t.nochKeineDaten}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{t.nachUhrzeit}</CardTitle></CardHeader>
        <CardContent>
          <BarChart
            data={buchungenNachStunde.map((v, i) => ({ label: `${i}`, value: v }))}
            maxValue={maxStunde} color="bg-amber-500" emptyLabel={t.nochKeineDaten}
          />
        </CardContent>
      </Card>
    </div>
  );
}
