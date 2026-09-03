"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CircleNotch as Loader2, UserPlus } from "@phosphor-icons/react";
import { migrierteKonfiguration, elementSitzIds, type SitzplanKonfiguration } from "@/types/sitzplan";
import { toast } from "@/components/ui/toaster";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

type EventRow = { id: string; titel: string; datum: string; sitzplan_id: string | null; service_gebuehr_cent: number | null };

type SitzInfo = {
  sitzId: string;
  kategorieId: string;
  kategorieName: string;
  kategoriefarbe: string;
  preisCent: number;
  elementBezeichnung: string;
};

export default function BuchungNeuClient({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const dict = useT();
  const t = dict.manuelleBuchung;
  const locale = useLocale();
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";
  const euro = (cent: number) =>
    (cent / 100).toLocaleString(dateLocale, { style: "currency", currency: "EUR" });
  const [eventId, setEventId] = useState("");
  const [alleeSitze, setAlleeSitze] = useState<SitzInfo[]>([]);
  const [belegte, setBelegte] = useState<Set<string>>(new Set());
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set());
  const [laedt, setLaedt] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"bezahlt" | "ausstehend">("bezahlt");
  const [fehler, setFehler] = useState<string | null>(null);
  const [sitzplanLaedt, setSitzplanLaedt] = useState(false);

  const aktuellesEvent = events.find((e) => e.id === eventId);

  useEffect(() => {
    if (!eventId) { setAlleeSitze([]); setBelegte(new Set()); setAusgewaehlt(new Set()); return; }
    const ev = events.find((e) => e.id === eventId);
    if (!ev?.sitzplan_id) { setAlleeSitze([]); return; }

    setSitzplanLaedt(true);
    const supabase = createClient();

    Promise.all([
      supabase.from("sitzplaene").select("konfiguration").eq("id", ev.sitzplan_id).single(),
      supabase.from("tickets").select("sitzplatz_id").eq("event_id", eventId),
    ]).then(([planRes, ticketRes]) => {
      const konfig: SitzplanKonfiguration = migrierteKonfiguration(planRes.data?.konfiguration);
      const katMap = new Map(konfig.kategorien.map((k) => [k.id, k]));

      const sitze: SitzInfo[] = konfig.elemente.flatMap((el) =>
        elementSitzIds(el).map((sitzId) => {
          const kat = katMap.get(el.kategorie_id);
          return {
            sitzId,
            kategorieId: el.kategorie_id,
            kategorieName: kat?.name ?? "—",
            kategoriefarbe: kat?.farbe ?? "#94a3b8",
            preisCent: kat?.preis_cent ?? 0,
            elementBezeichnung: el.bezeichnung,
          };
        })
      );

      setAlleeSitze(sitze);
      setBelegte(new Set((ticketRes.data ?? []).map((t) => t.sitzplatz_id)));
      setAusgewaehlt(new Set());
      setSitzplanLaedt(false);
    });
  }, [eventId, events]);

  // Group seats by element
  const sitzeNachElement = alleeSitze.reduce<Record<string, SitzInfo[]>>((acc, s) => {
    (acc[s.elementBezeichnung] ??= []).push(s);
    return acc;
  }, {});

  function toggleSitz(sitzId: string) {
    if (belegte.has(sitzId)) return;
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      next.has(sitzId) ? next.delete(sitzId) : next.add(sitzId);
      return next;
    });
  }

  function toggleElement(bezeichnung: string) {
    const sitze = sitzeNachElement[bezeichnung] ?? [];
    const verfuegbar = sitze.filter((s) => !belegte.has(s.sitzId));
    const alleGewaehlt = verfuegbar.every((s) => ausgewaehlt.has(s.sitzId));
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      verfuegbar.forEach((s) => alleGewaehlt ? next.delete(s.sitzId) : next.add(s.sitzId));
      return next;
    });
  }

  const ausgewaehlteSitze = alleeSitze.filter((s) => ausgewaehlt.has(s.sitzId));
  const serviceGebuehr = aktuellesEvent?.service_gebuehr_cent ?? 0;
  const gesamtCent = ausgewaehlteSitze.reduce((s, a) => s + a.preisCent, 0) + ausgewaehlteSitze.length * serviceGebuehr;

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || ausgewaehlt.size === 0) { setFehler(t.fehlerEventPlatz); return; }
    if (!name.trim() || !email.trim()) { setFehler(t.fehlerNameEmail); return; }
    setFehler(null);
    setLaedt(true);

    const res = await fetch("/api/booking/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        gaestName: name,
        gaestEmail: email,
        status,
        sitzplaetze: ausgewaehlteSitze.map((s) => ({
          sitzId: s.sitzId,
          bezeichnung: `${s.kategorieName} · ${s.elementBezeichnung}`,
          preisCent: s.preisCent,
        })),
      }),
    });

    const data = await res.json().catch(() => ({})) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      const msg = data.error ?? t.fehlerAnlegen;
      setFehler(msg);
      toast.error(t.buchungFehlgeschlagen, msg);
      setLaedt(false);
      return;
    }
    const anzahl = ausgewaehlteSitze.length;
    toast.success(t.buchungAngelegt, fmt(anzahl === 1 ? t.angelegtText : t.angelegtText_pl, { n: anzahl, name: name.trim() }));
    router.push(`/dashboard/bookings/${data.id}`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/bookings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {t.titel}
          </h1>
          <p className="text-sm text-muted-foreground">{t.untertitel}</p>
        </div>
      </div>

      <form onSubmit={absenden} className="space-y-5">
        {/* Event */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{dict.buchungen.colEvent}</CardTitle></CardHeader>
          <CardContent>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t.eventWaehlen}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.titel} · {new Date(ev.datum).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Seat picker */}
        {eventId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{t.plaetzeWaehlen}</span>
                {ausgewaehlt.size > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">{fmt(t.gewaehltCount, { n: ausgewaehlt.size })}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sitzplanLaedt ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.sitzplanLaedt}
                </div>
              ) : alleeSitze.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t.keinSitzplan}</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(sitzeNachElement).map(([bezeichnung, sitze]) => {
                    const verfuegbar = sitze.filter((s) => !belegte.has(s.sitzId));
                    const gewaehlt = sitze.filter((s) => ausgewaehlt.has(s.sitzId));
                    const alleGewaehlt = verfuegbar.length > 0 && verfuegbar.every((s) => ausgewaehlt.has(s.sitzId));
                    return (
                      <div key={bezeichnung}>
                        <div className="flex items-center justify-between mb-2">
                          <button type="button" onClick={() => toggleElement(bezeichnung)}
                            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              alleGewaehlt ? "bg-primary border-primary" : "border-input"
                            }`}>
                              {alleGewaehlt && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                            </div>
                            {bezeichnung}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {fmt(t.verfuegbarCount, { n: gewaehlt.length, total: verfuegbar.length })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sitze.map((s) => {
                            const istBelegt = belegte.has(s.sitzId);
                            const istGewaehlt = ausgewaehlt.has(s.sitzId);
                            return (
                              <button
                                key={s.sitzId}
                                type="button"
                                disabled={istBelegt}
                                onClick={() => toggleSitz(s.sitzId)}
                                title={`${s.sitzId} · ${s.kategorieName} · ${euro(s.preisCent)}`}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all border ${
                                  istBelegt
                                    ? "bg-muted text-muted-foreground/40 border-transparent cursor-not-allowed line-through"
                                    : istGewaehlt
                                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                      : "border-input hover:border-primary/50 hover:bg-accent"
                                }`}
                              >
                                {s.sitzId.split("-").pop()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Guest + status */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t.gast}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{dict.venueBearbeiten.nameLabel}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={dict.buchung.namePlaceholder} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t.emailLabel}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} required className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t.zahlungsstatus}</Label>
              <div className="flex gap-2">
                {(["bezahlt", "ausstehend"] as const).map((s) => (
                  <button
                    key={s} type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      status === s
                        ? s === "bezahlt"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-input text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {s === "bezahlt" ? dict.status.bezahlt : dict.status.ausstehend}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary + submit */}
        {ausgewaehlt.size > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4 space-y-1 text-sm">
              {ausgewaehlteSitze.map((s) => (
                <div key={s.sitzId} className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.kategoriefarbe }} />
                    <span>{s.sitzId}</span>
                    <span className="text-muted-foreground text-xs">{s.kategorieName}</span>
                  </div>
                  <span className="tabular-nums">{euro(s.preisCent)}</span>
                </div>
              ))}
              {serviceGebuehr > 0 && (
                <div className="flex justify-between text-muted-foreground text-xs pt-1">
                  <span>{fmt(dict.buchungen.servicegebuehr, { n: ausgewaehlt.size })}</span>
                  <span>{euro(ausgewaehlt.size * serviceGebuehr)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-border pt-2 mt-1">
                <span>{dict.common.gesamt}</span>
                <span>{euro(gesamtCent)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {fehler && <p className="text-sm text-destructive">{fehler}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={laedt || ausgewaehlt.size === 0} className="flex-1">
            {laedt ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.wirdAngelegt}</> : t.buchungAnlegen}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/bookings">{dict.common.abbrechen}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
