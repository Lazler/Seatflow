"use client";

import { useEffect, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

// Globales Toast-System: `toast.success("Gespeichert")` aus jedem Client-
// Code aufrufbar, gerendert von <Toaster /> im Root-Layout. Pub/Sub statt
// Context, damit auch Nicht-React-Code (z. B. Handler) melden kann.

type ToastVariante = "success" | "error" | "info";

export type ToastEintrag = {
  id: number;
  variante: ToastVariante;
  titel: string;
  beschreibung?: string;
};

type Listener = (t: ToastEintrag) => void;

let naechsteId = 1;
const listeners = new Set<Listener>();

function melden(variante: ToastVariante, titel: string, beschreibung?: string) {
  const eintrag: ToastEintrag = { id: naechsteId++, variante, titel, beschreibung };
  listeners.forEach((l) => l(eintrag));
}

export const toast = {
  success: (titel: string, beschreibung?: string) => melden("success", titel, beschreibung),
  error: (titel: string, beschreibung?: string) => melden("error", titel, beschreibung),
  info: (titel: string, beschreibung?: string) => melden("info", titel, beschreibung),
};

const ICONS: Record<ToastVariante, React.ReactNode> = {
  success: <CheckCircle weight="fill" className="h-5 w-5 text-green-600 shrink-0" />,
  error: <WarningCircle weight="fill" className="h-5 w-5 text-destructive shrink-0" />,
  info: <Info weight="fill" className="h-5 w-5 text-primary shrink-0" />,
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEintrag[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => setToasts((prev) => [...prev.slice(-4), t]);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <Toast.Provider swipeDirection="right" duration={3500}>
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          duration={t.variante === "error" ? 6000 : 3500}
          onOpenChange={(offen) => {
            if (!offen) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
          className="toast-root pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card text-card-foreground shadow-lg px-4 py-3"
        >
          <span aria-hidden className="mt-px">{ICONS[t.variante]}</span>
          <div className="min-w-0 flex-1">
            <Toast.Title className="text-sm font-semibold leading-snug">{t.titel}</Toast.Title>
            {t.beschreibung && (
              <Toast.Description className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t.beschreibung}
              </Toast.Description>
            )}
          </div>
          <Toast.Close asChild>
            <button
              aria-label="Schließen"
              className="h-6 w-6 -mr-1 -mt-0.5 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Toast.Close>
        </Toast.Root>
      ))}
      {/* z über Editor-Overlay (z-50) und dessen Sheets (z-[70]) */}
      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 w-full sm:max-w-sm outline-none pointer-events-none"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }} />
    </Toast.Provider>
  );
}
