import Link from "next/link";
import { CheckCircle, WarningCircle, Circle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Anforderung } from "@/lib/event-bereitschaft";

// Checkliste „Bereit zum Veröffentlichen?" — zeigt harte Blocker (rot) und
// Empfehlungen (grau), jeweils mit Direktlink zum Beheben.
export function VeroeffentlichungsCheck({ anforderungen }: { anforderungen: Anforderung[] }) {
  const offeneBlocker = anforderungen.filter((a) => a.pflicht && !a.erfuellt).length;
  const bereit = offeneBlocker === 0;

  return (
    <div className={`rounded-xl border p-4 ${bereit ? "border-emerald-200 bg-emerald-50/50" : "border-amber-300 bg-amber-50/60"}`}>
      <p className="text-sm font-semibold flex items-center gap-2">
        {bereit ? (
          <><CheckCircle weight="fill" className="h-4 w-4 text-emerald-600" /> Bereit zum Veröffentlichen</>
        ) : (
          <><WarningCircle weight="fill" className="h-4 w-4 text-amber-600" /> Vor dem Veröffentlichen</>
        )}
      </p>
      <ul className="mt-3 space-y-2">
        {anforderungen.map((a) => {
          const rot = a.pflicht && !a.erfuellt;
          return (
            <li key={a.key} className="flex items-start gap-2.5 text-sm">
              {a.erfuellt ? (
                <CheckCircle weight="fill" className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : rot ? (
                <WarningCircle weight="fill" className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <span className={a.erfuellt ? "text-muted-foreground line-through" : "font-medium"}>
                  {a.label}
                </span>
                {!a.pflicht && !a.erfuellt && (
                  <span className="text-xs text-muted-foreground ml-1.5">(optional)</span>
                )}
                {!a.erfuellt && a.hinweis && (
                  <p className="text-xs text-muted-foreground mt-0.5">{a.hinweis}</p>
                )}
              </div>
              {!a.erfuellt && a.fixHref && (
                <Link href={a.fixHref} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 shrink-0 mt-0.5">
                  Beheben <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
