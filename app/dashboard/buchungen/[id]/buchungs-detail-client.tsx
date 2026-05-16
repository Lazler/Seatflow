"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, Check, X, Send, Loader2, Ticket } from "lucide-react";

type Buchung = {
  id: string; gaest_name: string; gaest_email: string;
  gesamt_cent: number; status: string; erstellt_am: string;
  event_id: string; notiz: string | null;
};
type TicketRow = { id: string; sitzplatz_id: string; sitzplatz_bezeichnung: string; preis_cent: number };
type Kommentar = { id: string; text: string; erstellt_am: string };
type EventInfo = { id: string; titel: string; datum: string; serviceGebuehrCent: number };

const STATUS_OPTIONEN = ["ausstehend", "bezahlt", "storniert", "erstattet"] as const;
const STATUS_LABEL: Record<string, string> = {
  bezahlt: "Bezahlt", ausstehend: "Ausstehend", storniert: "Storniert", erstattet: "Erstattet",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bezahlt: "default", ausstehend: "secondary", storniert: "destructive", erstattet: "outline",
};

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function kurzId(id: string) { return id.slice(0, 8).toUpperCase(); }

function datumsAnzeige(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function zeitVor(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tag${d === 1 ? "" : "en"}`;
}

type Props = {
  buchung: Buchung;
  event: EventInfo;
  tickets: TicketRow[];
  kommentare: Kommentar[];
};

export default function BuchungsDetail({ buchung, event, tickets, kommentare: initialKommentare }: Props) {
  const router = useRouter();
  const [editModus, setEditModus] = useState(false);
  const [name, setName] = useState(buchung.gaest_name);
  const [email, setEmail] = useState(buchung.gaest_email);
  const [status, setStatus] = useState(buchung.status);
  const [notiz, setNotiz] = useState(buchung.notiz ?? "");
  const [speichertEdit, setSpeichertEdit] = useState(false);

  const [kommentare, setKommentare] = useState<Kommentar[]>(initialKommentare);
  const [neuerKommentar, setNeuerKommentar] = useState("");
  const [sendetKommentar, setSendetKommentar] = useState(false);
  const kommentarEndeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    kommentarEndeRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [kommentare]);

  async function editSpeichern() {
    setSpeichertEdit(true);
    const supabase = createClient();
    await supabase.from("buchungen").update({
      gaest_name: name.trim(),
      gaest_email: email.trim(),
      status,
      notiz: notiz.trim() || null,
    }).eq("id", buchung.id);
    setSpeichertEdit(false);
    setEditModus(false);
    router.refresh();
  }

  function editAbbrechen() {
    setName(buchung.gaest_name);
    setEmail(buchung.gaest_email);
    setStatus(buchung.status);
    setNotiz(buchung.notiz ?? "");
    setEditModus(false);
  }

  async function kommentarSenden() {
    const text = neuerKommentar.trim();
    if (!text) return;
    setSendetKommentar(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("buchungs_kommentare")
      .insert({ buchung_id: buchung.id, text })
      .select("id, text, erstellt_am")
      .single();
    if (data) setKommentare((prev) => [...prev, data]);
    setNeuerKommentar("");
    setSendetKommentar(false);
  }

  const ticketsSumme = tickets.reduce((s, t) => s + t.preis_cent, 0);
  const serviceGebuehr = tickets.length * event.serviceGebuehrCent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/buchungen"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{buchung.gaest_name}</h1>
            <Badge variant={STATUS_VARIANT[buchung.status] ?? "secondary"}>
              {STATUS_LABEL[buchung.status] ?? buchung.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            #{kurzId(buchung.id)} · {datumsAnzeige(buchung.erstellt_am)}
          </p>
        </div>
        {!editModus ? (
          <Button size="sm" variant="outline" onClick={() => setEditModus(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Bearbeiten
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={editAbbrechen} disabled={speichertEdit}>
              <X className="h-3.5 w-3.5 mr-1" /> Abbrechen
            </Button>
            <Button size="sm" onClick={editSpeichern} disabled={speichertEdit}>
              {speichertEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Speichern
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: booking info */}
        <div className="lg:col-span-3 space-y-4">
          {/* Gast */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editModus ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-Mail</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium mt-0.5">{buchung.gaest_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-Mail</p>
                    <a href={`mailto:${buchung.gaest_email}`}
                      className="text-sm font-medium text-primary hover:underline mt-0.5 block">
                      {buchung.gaest_email}
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Event */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Event</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/events/${event.id}`}
                className="text-sm font-medium text-primary hover:underline">
                {event.titel}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{datumsAnzeige(event.datum)}</p>
            </CardContent>
          </Card>

          {/* Tickets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ticket className="h-4 w-4" /> Tickets ({tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Tickets erfasst.</p>
              ) : (
                <div className="divide-y divide-border">
                  {tickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <span className="text-sm font-medium font-mono">{t.sitzplatz_id}</span>
                          {t.sitzplatz_bezeichnung && t.sitzplatz_bezeichnung !== t.sitzplatz_id && (
                            <span className="text-xs text-muted-foreground ml-2">{t.sitzplatz_bezeichnung}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm tabular-nums">{euro(t.preis_cent)}</span>
                    </div>
                  ))}
                  <div className="pt-2.5 space-y-1">
                    {event.serviceGebuehrCent > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Servicegebühr ({tickets.length}×)</span>
                        <span>{euro(serviceGebuehr)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border mt-1">
                      <span>Gesamt</span>
                      <span>{euro(buchung.gesamt_cent)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status + Notiz */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status &amp; Notiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editModus ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {STATUS_OPTIONEN.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Interne Notiz</Label>
                    <textarea
                      value={notiz}
                      onChange={(e) => setNotiz(e.target.value)}
                      placeholder="Notiz für interne Zwecke…"
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={STATUS_VARIANT[buchung.status] ?? "secondary"} className="mt-1">
                      {STATUS_LABEL[buchung.status] ?? buchung.status}
                    </Badge>
                  </div>
                  {buchung.notiz && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notiz</p>
                      <p className="text-sm mt-1 text-foreground">{buchung.notiz}</p>
                    </div>
                  )}
                  {!buchung.notiz && !editModus && (
                    <button type="button" onClick={() => setEditModus(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      + Notiz hinzufügen
                    </button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: comment thread */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-sm">
                Kommentare {kommentare.length > 0 && <span className="text-muted-foreground font-normal">({kommentare.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-3 min-h-0 px-4 pb-4">
              {/* Comment list */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] lg:max-h-[500px] pr-1">
                {kommentare.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Noch keine Kommentare.</p>
                ) : (
                  kommentare.map((k) => (
                    <div key={k.id} className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1">
                      <p className="text-sm leading-relaxed">{k.text}</p>
                      <p className="text-[11px] text-muted-foreground">{zeitVor(k.erstellt_am)}</p>
                    </div>
                  ))
                )}
                <div ref={kommentarEndeRef} />
              </div>

              {/* New comment input */}
              <div className="flex gap-2 shrink-0 pt-1 border-t border-border">
                <textarea
                  value={neuerKommentar}
                  onChange={(e) => setNeuerKommentar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); kommentarSenden(); }
                  }}
                  placeholder="Kommentar schreiben… (Enter zum Senden)"
                  rows={2}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <button
                  type="button"
                  onClick={kommentarSenden}
                  disabled={!neuerKommentar.trim() || sendetKommentar}
                  className="h-9 w-9 shrink-0 self-end rounded-md border border-input bg-background hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-30"
                >
                  {sendetKommentar
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
