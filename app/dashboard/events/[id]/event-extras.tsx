"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Gift, Plus, Trash as Trash2 } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toaster";
import type { Fruehbucher, EventAddon } from "@/types/event-extras";
import { fruehbucherAktiv } from "@/types/event-extras";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

export default function EventExtras({
  eventId,
  initialFruehbucher,
  initialAddons,
}: {
  eventId: string;
  initialFruehbucher: Fruehbucher | null;
  initialAddons: EventAddon[];
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";
  const euro = (cent: number) =>
    (cent / 100).toLocaleString(dateLocale, { style: "currency", currency: "EUR" });
  const router = useRouter();
  const [fb, setFb] = useState<Fruehbucher | null>(initialFruehbucher);
  const [fbAktiviert, setFbAktiviert] = useState(!!initialFruehbucher);
  const [addons, setAddons] = useState<EventAddon[]>(initialAddons);
  const [speichert, setSpeichert] = useState(false);

  async function speichern() {
    setSpeichert(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        fruehbucher: fbAktiviert && fb && fb.prozent > 0 && fb.bis ? fb : null,
        addons: addons.length > 0 ? addons : null,
      })
      .eq("id", eventId);
    setSpeichert(false);
    if (error) {
      toast.error(
        t.common.speichernFehlgeschlagen,
        error.message.includes("column")
          ? t.eventExtras.migrationFehlt
          : error.message
      );
      return;
    }
    toast.success(t.common.gespeichert, t.eventExtras.toastText);
    router.refresh();
  }

  function addonHinzufuegen() {
    setAddons((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", preis_cent: 300, aktiv: true },
    ]);
  }

  function addonAendern(id: string, patch: Partial<EventAddon>) {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  const laeuft = fbAktiviert && fruehbucherAktiv(fb);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          {t.eventExtras.titel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ── Frühbucher-Rabatt ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.eventExtras.fruehbucherRabatt}</p>
              <p className="text-xs text-muted-foreground">
                {t.eventExtras.fruehbucherHinweis}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFbAktiviert((v) => !v);
                if (!fb) setFb({ prozent: 15, bis: "" });
              }}
              role="switch"
              aria-checked={fbAktiviert}
              className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${fbAktiviert ? "bg-primary" : "bg-input"}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fbAktiviert ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {fbAktiviert && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="space-y-1">
                <Label className="text-xs">{t.eventExtras.rabattProzent}</Label>
                <Input
                  type="number" min={1} max={90}
                  value={fb?.prozent ?? 15}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) setFb((p) => ({ prozent: Math.min(90, Math.max(1, v)), bis: p?.bis ?? "" }));
                  }}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t.eventExtras.gueltigBis}</Label>
                <Input
                  type="date"
                  value={fb?.bis ? fb.bis.slice(0, 10) : ""}
                  onChange={(e) => {
                    const datum = e.target.value;
                    setFb((p) => ({
                      prozent: p?.prozent ?? 15,
                      // Ende des gewählten Tages, damit "bis inkl." stimmt
                      bis: datum ? `${datum}T23:59:59` : "",
                    }));
                  }}
                  className="h-9 text-sm"
                />
              </div>
              {fbAktiviert && fb?.bis && (
                <p className={`col-span-2 text-xs font-medium ${laeuft ? "text-green-600" : "text-muted-foreground"}`}>
                  {laeuft
                    ? fmt(t.eventExtras.laeuft, { p: fb.prozent })
                    : t.eventExtras.inaktiv}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* ── Add-ons ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-primary" /> {t.eventExtras.addons}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.eventExtras.addonsHinweis}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={addonHinzufuegen} className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" /> {t.eventExtras.addon}
            </Button>
          </div>

          {addons.length > 0 && (
            <div className="space-y-2">
              {addons.map((a) => (
                <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg border ${a.aktiv ? "border-border" : "border-border opacity-50"}`}>
                  <Input
                    value={a.name}
                    placeholder={t.eventExtras.addonPlaceholder}
                    onChange={(e) => addonAendern(a.id, { name: e.target.value.slice(0, 60) })}
                    className="h-9 text-sm flex-1"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number" min={0} step={0.5}
                      value={(a.preis_cent / 100).toFixed(2)}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) addonAendern(a.id, { preis_cent: Math.max(0, Math.round(v * 100)) });
                      }}
                      className="h-9 w-20 text-sm text-right"
                    />
                    <span className="text-xs text-muted-foreground">€</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addonAendern(a.id, { aktiv: !a.aktiv })}
                    role="switch" aria-checked={a.aktiv}
                    title={a.aktiv ? t.eventExtras.aktiv : t.eventExtras.addonInaktiv}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${a.aktiv ? "bg-primary" : "bg-input"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${a.aktiv ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setAddons((prev) => prev.filter((x) => x.id !== a.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {fmt(t.eventExtras.mehrumsatz, {
                  betrag: euro(addons.filter((a) => a.aktiv).reduce((s, a) => s + a.preis_cent, 0)),
                })}
              </p>
            </div>
          )}
        </div>

        <Button size="sm" onClick={speichern} disabled={speichert}>
          {speichert ? t.common.speichernLaeuft : t.common.speichern}
        </Button>
      </CardContent>
    </Card>
  );
}
