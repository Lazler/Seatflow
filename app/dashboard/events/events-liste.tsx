"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass as Search, ArrowRight, Calendar, Plus } from "@phosphor-icons/react";
import { useT, useLocale } from "@/components/i18n-provider";
import { intlLocale } from "@/lib/i18n/buchung";
import EventDuplizieren from "./event-duplizieren";

type Event = {
  id: string;
  titel: string;
  datum: string;
  status: string;
  ticket_preis_cent: number;
  verkauft: number;
  kapazitaet: number | null;
};

export default function EventsListe({ events }: { events: Event[] }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = intlLocale(locale);
  const [suche, setSuche] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");

  const STATUS_LABEL: Record<string, string> = {
    entwurf: t.status.entwurf,
    veroeffentlicht: t.status.veroeffentlicht,
    abgesagt: t.status.abgesagt,
    beendet: t.status.beendet,
  };
  const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    entwurf: "secondary",
    veroeffentlicht: "default",
    abgesagt: "destructive",
    beendet: "outline",
  };

  const FILTER_TABS = [
    { key: "alle", label: t.common.alle, count: events.length },
    { key: "entwurf", label: t.status.entwurf, count: events.filter((e) => e.status === "entwurf").length },
    { key: "veroeffentlicht", label: t.status.veroeffentlicht, count: events.filter((e) => e.status === "veroeffentlicht").length },
    { key: "beendet", label: t.status.beendet, count: events.filter((e) => e.status === "beendet").length },
  ];

  const gefiltert = useMemo(() => {
    const term = suche.toLowerCase().trim();
    return events.filter((e) => {
      const matchStatus = statusFilter === "alle" || e.status === statusFilter;
      const matchSuche = !term || e.titel.toLowerCase().includes(term);
      return matchStatus && matchSuche;
    });
  }, [events, suche, statusFilter]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-foreground">{t.events.nochKeineEvents}</p>
        <p className="text-sm mt-1 mb-4">{t.events.erstelleErstesEvent}</p>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4 mr-1" /> {t.events.eventErstellen}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1 rounded-md border border-input bg-card p-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors shrink-0 whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} · {tab.count}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t.events.suchePlaceholder}
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {gefiltert.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <p className="text-sm">{t.events.keineErgebnisse.replace("{term}", suche)}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.events.colDatum}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.events.colTitel}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">{t.events.colBelegung}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.events.colPreis}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.events.colStatus}</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gefiltert.map((event) => {
                const d = new Date(event.datum);
                const pct = event.kapazitaet && event.kapazitaet > 0 ? Math.round((event.verkauft / event.kapazitaet) * 100) : null;
                return (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block font-semibold text-sm leading-none mb-1">
                        {d.toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {d.toLocaleDateString(dateLocale, { weekday: "short" })} · {d.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/events/${event.id}`} className="font-medium hover:underline underline-offset-2">
                        {event.titel}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {event.kapazitaet !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden shrink-0">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{event.verkauft} / {event.kapazitaet}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {(event.ticket_preis_cent / 100).toLocaleString(dateLocale, { style: "currency", currency: "EUR" })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[event.status] ?? "secondary"} className="text-xs">
                        {STATUS_LABEL[event.status] ?? event.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <EventDuplizieren eventId={event.id} eventTitel={event.titel} />
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {gefiltert.length} {t.events.title}
          </div>
        </div>
      )}
    </div>
  );
}
