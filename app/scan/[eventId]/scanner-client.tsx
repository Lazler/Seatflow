"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { CheckCircle, XCircle, WarningCircle as AlertCircle, Camera, CameraSlash as CameraOff, ArrowCounterClockwise as RotateCcw, Lightning as Zap, LightningSlash as ZapOff, CaretUp as ChevronUp, CaretDown as ChevronDown, X } from "@phosphor-icons/react";

type ScanStatus = "ok" | "ungueltig" | "bereits_eingeloest";

type ScanResult = {
  status: ScanStatus;
  message: string;
  guestName?: string;
  sitzplatz?: string;
};

type HistorieEintrag = ScanResult & { zeit: string; id: number };

const STATUS = {
  ok: {
    bg: "bg-green-500",
    icon: CheckCircle,
    dot: "bg-green-400",
  },
  bereits_eingeloest: {
    bg: "bg-amber-500",
    icon: AlertCircle,
    dot: "bg-amber-400",
  },
  ungueltig: {
    bg: "bg-red-500",
    icon: XCircle,
    dot: "bg-red-400",
  },
} satisfies Record<ScanStatus, { bg: string; icon: typeof CheckCircle; dot: string }>;

function beep(status: ScanStatus) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    if (status === "ok") {
      osc.frequency.value = 1047;
      osc.type = "sine";
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (status === "ungueltig") {
      osc.frequency.value = 220;
      osc.type = "sawtooth";
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.frequency.value = 659;
      osc.type = "sine";
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch { /* AudioContext nicht verfügbar */ }
}

function haptic(status: ScanStatus) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (status === "ok") navigator.vibrate(80);
  else if (status === "ungueltig") navigator.vibrate([70, 50, 70, 50, 70]);
  else navigator.vibrate([100, 70, 100]);
}

export default function ScannerClient({
  eventId,
  eventTitel,
  gesamt,
  initialEingelassen,
  pin = null,
}: {
  eventId: string;
  eventTitel: string;
  gesamt: number;
  initialEingelassen: number;
  // Scanner-PIN des Einlasspersonals (null = Veranstalter-Session)
  pin?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const cooldownRef = useRef(false);
  const verlaufIdRef = useRef(0);

  const [kameraAktiv, setKameraAktiv] = useState(false);
  const [kameraFehler, setKameraFehler] = useState<string | null>(null);
  const [letzterScan, setLetzterScan] = useState<ScanResult | null>(null);
  const [eingelassen, setEingelassen] = useState(initialEingelassen);
  const [verlaufOffen, setVerlaufOffen] = useState(false);
  const [verlauf, setVerlauf] = useState<HistorieEintrag[]>([]);
  const [taschenlampe, setTaschenlampe] = useState(false);
  const [taschenlampVerfuegbar, setTaschenlampVerfuegbar] = useState(false);

  const verarbeiteCode = useCallback(async (code: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    let result: ScanResult;
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, eventId, ...(pin ? { pin } : {}) }),
      });
      result = await res.json();
    } catch {
      result = { status: "ungueltig", message: "Netzwerkfehler" };
    }

    beep(result.status);
    haptic(result.status);
    setLetzterScan(result);
    if (result.status === "ok") setEingelassen((n) => n + 1);

    const zeit = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    setVerlauf((prev) =>
      [{ ...result, zeit, id: ++verlaufIdRef.current }, ...prev].slice(0, 30)
    );

    setTimeout(() => {
      cooldownRef.current = false;
      setLetzterScan(null);
    }, 2500);
  }, [eventId, pin]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setKameraFehler(null);
    try {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result) => { if (result) verarbeiteCode(result.getText()); }
      );
      controlsRef.current = controls;
      setKameraAktiv(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setKameraFehler(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Kamerazugriff verweigert – bitte in den Browser-Einstellungen erlauben."
          : "Kamera konnte nicht gestartet werden."
      );
    }
  }, [verarbeiteCode]);

  // Check torch capability once camera is active
  useEffect(() => {
    if (!kameraAktiv || !videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
    setTaschenlampVerfuegbar(!!caps?.torch);
  }, [kameraAktiv]);

  const toggleTaschenlampe = useCallback(async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !taschenlampe } as MediaTrackConstraintSet] });
      setTaschenlampe((v) => !v);
    } catch { /* Taschenlampe nicht unterstützt */ }
  }, [taschenlampe]);

  useEffect(() => {
    startScanner();
    return () => { controlsRef.current?.stop(); };
  }, [startScanner]);

  const cfg = letzterScan ? STATUS[letzterScan.status] : null;

  return (
    <div
      className="fixed inset-0 bg-black text-white overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Camera video — base layer */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Top gradient + header */}
      <div
        className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <div className="flex items-start justify-between px-5 pb-10 pointer-events-auto">
          {/* Event info */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em]">
              Ticket-Scanner
            </p>
            <p className="text-[15px] font-bold truncate max-w-[200px] mt-0.5 leading-tight">
              {eventTitel}
            </p>
          </div>

          {/* Controls + counter */}
          <div className="flex items-center gap-2 shrink-0">
            {taschenlampVerfuegbar && (
              <button
                onClick={toggleTaschenlampe}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 active:scale-95 transition-transform"
                aria-label="Taschenlampe umschalten"
              >
                {taschenlampe
                  ? <ZapOff className="w-[18px] h-[18px]" />
                  : <Zap className="w-[18px] h-[18px]" />
                }
              </button>
            )}
            <div className="flex flex-col items-end bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-2 min-w-[68px]">
              <p className="text-[10px] text-white/50 leading-none">Eingelassen</p>
              <p className="text-2xl font-bold leading-tight tabular-nums">
                {eingelassen}
                {gesamt > 0 && (
                  <span className="text-sm font-normal text-white/40"> /{gesamt}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!kameraAktiv && !kameraFehler && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/90">
          <Camera className="w-16 h-16 text-white/20 animate-pulse" />
          <p className="text-white/50 text-sm">Kamera wird gestartet…</p>
        </div>
      )}

      {/* Error state */}
      {kameraFehler && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/95 px-10 text-center">
          <CameraOff className="w-14 h-14 text-red-400" />
          <p className="text-white/80 text-sm leading-relaxed">{kameraFehler}</p>
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 active:bg-white/20 rounded-2xl text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Scan frame overlay — only when idle */}
      {kameraAktiv && !letzterScan && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          {/* Corner-frame with box-shadow vignette */}
          <div
            className="relative w-[260px] h-[260px]"
            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }}
          >
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-white rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-white rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-white rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-white rounded-br-sm" />
            {/* Sweep line */}
            <div className="scan-sweep-line left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent" />
          </div>

          <p className="mt-6 text-white/60 text-sm tracking-wide">QR-Code in den Rahmen halten</p>
        </div>
      )}

      {/* Result card — slides up from bottom */}
      {letzterScan && cfg && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 scanner-result-in"
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
        >
          <div className={`mx-4 ${cfg.bg} rounded-2xl p-5 flex items-center gap-4 shadow-2xl`}>
            <cfg.icon className="w-14 h-14 text-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-xl leading-tight">
                {letzterScan.message}
              </p>
              {letzterScan.guestName && (
                <p className="text-white/90 text-base mt-1 truncate">
                  {letzterScan.guestName}
                </p>
              )}
              {letzterScan.sitzplatz && (
                <p className="text-white/70 text-sm mt-0.5 truncate">
                  {letzterScan.sitzplatz}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setLetzterScan(null);
                cooldownRef.current = false;
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 active:bg-black/40 shrink-0 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar — history toggle + status */}
      {!letzterScan && (
        <div
          className="absolute inset-x-0 bottom-0 z-20"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Scan history panel */}
          {verlaufOffen && verlauf.length > 0 && (
            <div className="bg-black/90 backdrop-blur-md border-t border-white/10 max-h-52 overflow-y-auto overscroll-contain">
              {verlauf.map((entry) => {
                const c = STATUS[entry.status];
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {entry.guestName ?? entry.message}
                      </p>
                      {entry.sitzplatz && (
                        <p className="text-xs text-white/40 truncate">{entry.sitzplatz}</p>
                      )}
                    </div>
                    <span className="text-xs text-white/40 shrink-0 tabular-nums">
                      {entry.zeit}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-black/70 backdrop-blur-sm border-t border-white/10">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  kameraAktiv ? "bg-green-400 animate-pulse" : "bg-white/30"
                }`}
              />
              <span className="text-xs text-white/50">
                {kameraAktiv ? "Scanner aktiv" : "Scanner inaktiv"}
              </span>
            </div>
            {verlauf.length > 0 ? (
              <button
                onClick={() => setVerlaufOffen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-white/60 active:text-white py-1 px-2 -mr-2 transition-colors"
              >
                {verlaufOffen
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronUp className="w-3.5 h-3.5" />
                }
                Verlauf ({verlauf.length})
              </button>
            ) : (
              <span className="text-xs text-white/30">Noch kein Scan</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
