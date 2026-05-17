"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { CheckCircle, XCircle, AlertCircle, Camera, CameraOff, RotateCcw } from "lucide-react";

type ScanResult = {
  status: "ok" | "ungueltig" | "bereits_eingeloest";
  message: string;
  guestName?: string;
  sitzplatz?: string;
};

const STATUS_CONFIG = {
  ok: {
    bg: "bg-green-500",
    border: "border-green-400",
    icon: CheckCircle,
    textColor: "text-white",
  },
  bereits_eingeloest: {
    bg: "bg-amber-500",
    border: "border-amber-400",
    icon: AlertCircle,
    textColor: "text-white",
  },
  ungueltig: {
    bg: "bg-red-500",
    border: "border-red-400",
    icon: XCircle,
    textColor: "text-white",
  },
};

export default function ScannerClient({
  eventId,
  eventTitel,
}: {
  eventId: string;
  eventTitel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [kameraAktiv, setKameraAktiv] = useState(false);
  const [kameraFehler, setKameraFehler] = useState<string | null>(null);
  const [letzterScan, setLetzterScan] = useState<ScanResult | null>(null);
  const [scanAnzahl, setScanAnzahl] = useState(0);
  const [verarbeitet, setVerarbeitet] = useState(false);
  const cooldownRef = useRef(false);

  const verarbeiteCode = useCallback(async (code: string) => {
    if (cooldownRef.current || verarbeitet) return;
    cooldownRef.current = true;
    setVerarbeitet(true);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, eventId }),
      });
      const json: ScanResult = await res.json();
      setLetzterScan(json);
      if (json.status === "ok") setScanAnzahl((n) => n + 1);
    } catch {
      setLetzterScan({ status: "ungueltig", message: "Netzwerkfehler" });
    }

    // Allow new scan after 3 seconds
    setTimeout(() => {
      cooldownRef.current = false;
      setVerarbeitet(false);
    }, 3000);
  }, [eventId, verarbeitet]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setKameraFehler(null);
    try {
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      // Prefer back camera on mobile
      const device = devices.find((d) =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      ) ?? devices[0];

      if (!device) {
        setKameraFehler("Keine Kamera gefunden");
        return;
      }

      const controls = await reader.decodeFromVideoDevice(
        device.deviceId,
        videoRef.current,
        (result) => {
          if (result) verarbeiteCode(result.getText());
        }
      );
      controlsRef.current = controls;
      setKameraAktiv(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setKameraFehler("Kamerazugriff verweigert. Bitte in den Browser-Einstellungen erlauben.");
      } else {
        setKameraFehler(`Kamera konnte nicht gestartet werden: ${msg}`);
      }
    }
  }, [verarbeiteCode]);

  useEffect(() => {
    startScanner();
    return () => {
      controlsRef.current?.stop();
    };
  }, [startScanner]);

  const result = letzterScan;
  const cfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div>
          <p className="text-xs text-white/60 uppercase tracking-wide">Ticket-Scanner</p>
          <p className="text-sm font-semibold truncate max-w-[200px]">{eventTitel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Eingelassen</p>
          <p className="text-2xl font-bold">{scanAnzahl}</p>
        </div>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning overlay */}
        {kameraAktiv && !result && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner marks */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute top-2 left-2 right-2 h-0.5 bg-green-400/80 animate-bounce" style={{ animationDuration: "2s" }} />
            </div>
            <p className="absolute bottom-20 text-white/70 text-sm">QR-Code in den Rahmen halten</p>
          </div>
        )}

        {/* No camera */}
        {!kameraAktiv && !kameraFehler && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
            <Camera className="h-16 w-16 text-white/30 animate-pulse" />
            <p className="text-white/60 text-sm">Kamera wird gestartet…</p>
          </div>
        )}

        {/* Camera error */}
        {kameraFehler && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 px-8 text-center">
            <CameraOff className="h-16 w-16 text-red-400" />
            <p className="text-white/80 text-sm">{kameraFehler}</p>
            <button
              onClick={startScanner}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Erneut versuchen
            </button>
          </div>
        )}

        {/* Scan result overlay */}
        {result && cfg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className={`${cfg.bg} rounded-2xl px-8 py-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4 shadow-2xl border-2 ${cfg.border}`}>
              <cfg.icon className={`h-20 w-20 ${cfg.textColor}`} />
              <div className="text-center space-y-1">
                <p className={`text-xl font-bold ${cfg.textColor}`}>{result.message}</p>
                {result.guestName && (
                  <p className={`text-base font-medium ${cfg.textColor}`}>{result.guestName}</p>
                )}
                {result.sitzplatz && (
                  <p className={`text-sm opacity-80 ${cfg.textColor}`}>{result.sitzplatz}</p>
                )}
              </div>
              <p className={`text-xs opacity-60 ${cfg.textColor}`}>Nächster Scan in 3 Sekunden…</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-4 py-3 bg-black/80 backdrop-blur-sm border-t border-white/10 text-center">
        <p className="text-xs text-white/40">
          {kameraAktiv ? "Scanner aktiv · Kamera läuft" : "Scanner inaktiv"}
        </p>
      </div>
    </div>
  );
}
