"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass as Search, ArrowRight, Receipt as ReceiptText, Plus } from "@phosphor-icons/react";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt, intlLocale } from "@/lib/i18n/buchung";
import type { Dict } from "@/lib/i18n";

type Buchung = {
  id: string;
  gaest_name: string;
  gaest_email: string;
  gesamt_cent: number;
  status: string;
  erstellt_am: string;
  event_id: string;
  notiz: string | null;
};

type Event = { id: string; titel: string };

type SortKey = "datum_desc" | "datum_asc" | "betrag_desc" | "betrag_asc";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bezahlt: "default", ausstehend: "secondary", storniert: "destructive", erstattet: "outline",
};

function euro(cent: number, loc: string) {
  return (cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" });
}

function zeitVor(iso: string, tz: Dict["time"], loc: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return tz.geradeEben;
  if (min < 60) return fmt(tz.vorMin, { min });
  const h = Math.floor(min / 60);
  if (h < 24) return fmt(tz.vorStd, { h });
  const d = Math.floor(h / 24);
  if (d < 30) return fmt(d === 1 ? tz.vorTagen : tz.vorTagen_pl, { d });
  return new Date(iso).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
}

function kurzId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default function BuchungenListe({ buchungen, events }: { buchungen: Buchung[]; events: Event[] }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = intlLocale(locale);
  const [suche, setSuche] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [sortierung, setSortierung] = useState<SortKey>("datum_desc");

  const eventTitel = useMemo(() => new Map(events.map((e) => [e.id, e.titel])), [events]);

  const gefiltert = useMemo(() => {
    const term = suche.toLowerCase().trim();
    let liste = buchungen.filter((b) => {
      const matchStatus = statusFilter === "alle" || b.status === statusFilter;
      const matchSuche = !term ||
        b.gaest_name.toLowerCase().includes(term) ||
        b.gaest_email.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (eventTitel.get(b.event_id) ?? "").toLowerCase().includes(term) ||
        (b.notiz ?? "").toLowerCase().includes(term);
      return matchStatus && matchSuche;
    });

    liste = [...liste].sort((a, b) => {
      if (sortierung === "datum_desc") return new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime();
      if (sortierung === "datum_asc")  return new Date(a.erstellt_am).getTime() - new Date(b.erstellt_am).getTime();
      if (sortierung === "betrag_desc") return b.gesamt_cent - a.gesamt_cent;
      if (sortierung === "betrag_asc")  return a.gesamt_cent - b.gesamt_cent;
      return 0;
    });
    return liste;
  }, [buchungen, suche, statusFilter, sortierung, eventTitel]);

  const bezahlt   = buchungen.filter((b) => b.status === "bezahlt");
  const gesamtCent = bezahlt.reduce((s, b) => s + b.gesamt_cent, 0);

  const STATUS_LABEL: Record<string, string> = {
    bezahlt: t.status.bezahlt, ausstehend: t.status.ausstehend, storniert: t.status.storniert, erstattet: t.status.erstattet,
  };

  const FILTER_TABS = [
    { key: "alle",       label: t.common.alle,             count: buchungen.length },
    { key: "bezahlt",    label: t.status.bezahlt,          count: buchungen.filter(b => b.status === "bezahlt").length },
    { key: "ausstehend", label: t.status.ausstehend,       count: buchungen.filter(b => b.status === "ausstehend").length },
    { key: "storniert",  label: t.status.storniert,        count: buchungen.filter(b => b.status === "storniert").length },
  ];

  const SORT_OPTIONS: { key: SortKey; label: string; icon?: React.ReactNode }[] = [
    { key: "datum_desc",  label: t.buchungen.datumDesc },
    { key: "datum_asc",   label: t.buchungen.datumAsc },
    { key: "betrag_desc", label: t.buchungen.betragDesc },
    { key: "betrag_asc",  label: t.buchungen.betragAsc },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.buchungen.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {fmt(t.buchungen.umsatzSubline, { n: bezahlt.length, betrag: euro(gesamtCent, dateLocale) })}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/bookings/new">
            <Plus className="h-4 w-4 mr-1.5" /> {t.buchungen.manuellanlagen}
          </Link>
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t.buchungen.suchePlaceholder}
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as SortKey)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Status filter tabs — horizontal scrollbar auf schmalen Screens */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors relative shrink-0 whitespace-nowrap ${
              statusFilter === tab.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            )}
            {statusFilter === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {buchungen.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <ReceiptText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">{t.buchungen.nochKeineBuchungen}</p>
          <p className="text-sm mt-1">{t.buchungen.buchungenErscheinen}</p>
        </div>
      ) : gefiltert.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <p className="text-sm">{t.buchungen.keineErgebnisse.replace("{term}", suche)}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.buchungen.colId}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.buchungen.colGast}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">{t.buchungen.colEvent}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.buchungen.colBetrag}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">{t.buchungen.colStatus}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">{t.buchungen.colDatum}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gefiltert.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/bookings/${b.id}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{kurzId(b.id)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.gaest_name}</p>
                    <p className="text-xs text-muted-foreground">{b.gaest_email}</p>
                    {b.notiz && <p className="text-xs text-muted-foreground/60 truncate max-w-[180px] mt-0.5">📝 {b.notiz}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {eventTitel.get(b.event_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{euro(b.gesamt_cent, dateLocale)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={STATUS_VARIANT[b.status] ?? "secondary"} className="text-xs">
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden lg:table-cell">
                    {zeitVor(b.erstellt_am, t.time, dateLocale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {gefiltert.length} {t.buchungen.title}
            {gefiltert.length !== buchungen.length && ` ${fmt(t.buchungen.vonGesamt, { n: buchungen.length })}`}
          </div>
        </div>
      )}
    </div>
  );
}
