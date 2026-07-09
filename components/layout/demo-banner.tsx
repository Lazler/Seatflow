import Link from "next/link";
import { Eye, ArrowRight } from "@phosphor-icons/react/dist/ssr";

// Sichtbar im Dashboard, wenn das read-only Demokonto aktiv ist.
export function DemoBanner() {
  return (
    <div className="mb-6 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-2.5 min-w-0">
        <Eye weight="fill" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm min-w-0">
          <p className="font-semibold">Demo-Modus — nur Ansicht</p>
          <p className="text-muted-foreground">
            Du erkundest ein Beispielkonto mit fiktiven Daten. Änderungen (Speichern, Veröffentlichen, Löschen …) sind deaktiviert.
          </p>
        </div>
      </div>
      <Link
        href="/registrieren"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium px-3.5 py-2 hover:bg-primary/90 active:scale-[0.97] transition"
      >
        Kostenlos eigenes Konto <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
