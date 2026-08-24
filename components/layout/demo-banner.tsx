import { ArrowRight, Eye } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/i18n";

// Sichtbar im Dashboard, wenn das read-only Demokonto aktiv ist.
export function DemoBanner({ t }: { t: Dict["demo"] }) {
  return (
    <div className="mb-6 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-2.5 min-w-0">
        <Eye weight="fill" className="h-5 w-5 text-brand shrink-0 mt-0.5" />
        <div className="text-sm min-w-0">
          <p className="font-semibold">{t.titel}</p>
          <p className="text-muted-foreground">{t.text}</p>
        </div>
      </div>
      {/* Voll-Navigation (kein <Link>), damit die Demo-Session zuerst beendet
          wird, bevor die Registrierung geöffnet wird. */}
      <a
        href="/api/demo/logout"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-brand text-white text-sm font-medium px-3.5 py-2 hover:bg-brand-deep active:translate-y-px transition"
      >
        {t.cta} <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
