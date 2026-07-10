import { Warning } from "@phosphor-icons/react/dist/ssr";
import type { Dict } from "@/lib/i18n";

// Betreiber-Hinweis: prüft server-seitig, ob kritische Umgebungsvariablen im
// Deployment gesetzt sind. Fehlt etwas, funktionieren Kernfunktionen (Kauf,
// Ticket-Mails, Scanner, manuelle Buchung) nicht — das soll der Betreiber
// sofort und überall im Dashboard sehen, nicht erst beim Klick auf ein Feature.
export function KonfigurationsWarnung({ t }: { t: Dict["konfigWarnung"] }) {
  const fehlend: { name: string; folge: string }[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    fehlend.push({ name: "SUPABASE_SERVICE_ROLE_KEY", folge: t.folgeService });
  if (!process.env.STRIPE_SECRET_KEY)
    fehlend.push({ name: "STRIPE_SECRET_KEY", folge: t.folgeStripeSecret });
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    fehlend.push({ name: "STRIPE_WEBHOOK_SECRET", folge: t.folgeWebhook });
  if (!process.env.RESEND_API_KEY)
    fehlend.push({ name: "RESEND_API_KEY", folge: t.folgeResend });

  if (fehlend.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="flex items-start gap-2.5">
        <Warning weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">{t.heading}</p>
          <p className="mt-0.5 text-amber-800">
            {t.bodyVor}
            <code className="font-mono text-xs bg-amber-100 rounded px-1 py-0.5 mx-0.5">.env</code>
            {t.bodyNach}
          </p>
          <ul className="mt-2 space-y-1">
            {fehlend.map((f) => (
              <li key={f.name} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <code className="font-mono text-xs bg-amber-100 rounded px-1.5 py-0.5 shrink-0">{f.name}</code>
                <span className="text-xs text-amber-800">— {f.folge}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            {t.footerVor} <code className="font-mono bg-amber-100 rounded px-1 py-0.5">/api/health</code>{t.footerNach}
          </p>
        </div>
      </div>
    </div>
  );
}
