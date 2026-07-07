import { Warning } from "@phosphor-icons/react/dist/ssr";

// Betreiber-Hinweis: prüft server-seitig, ob kritische Umgebungsvariablen im
// Deployment gesetzt sind. Fehlt etwas, funktionieren Kernfunktionen (Kauf,
// Ticket-Mails, Scanner, manuelle Buchung) nicht — das soll der Betreiber
// sofort und überall im Dashboard sehen, nicht erst beim Klick auf ein Feature.
export function KonfigurationsWarnung() {
  const fehlend: { name: string; folge: string }[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    fehlend.push({ name: "SUPABASE_SERVICE_ROLE_KEY", folge: "Käufe werden nicht abgeschlossen, keine Ticket-Mails, Scanner & manuelle Buchung gesperrt" });
  if (!process.env.STRIPE_SECRET_KEY)
    fehlend.push({ name: "STRIPE_SECRET_KEY", folge: "keine Zahlungen möglich" });
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    fehlend.push({ name: "STRIPE_WEBHOOK_SECRET", folge: "bezahlte Käufe werden nicht bestätigt" });
  if (!process.env.RESEND_API_KEY)
    fehlend.push({ name: "RESEND_API_KEY", folge: "es werden keine E-Mails versendet" });

  if (fehlend.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="flex items-start gap-2.5">
        <Warning weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">Deine Installation ist unvollständig konfiguriert</p>
          <p className="mt-0.5 text-amber-800">
            Folgende Umgebungsvariablen fehlen im Deployment. Setze sie in deinem Hosting
            (z. B. Vercel → Project → Settings → Environment Variables) und deploye neu:
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
            Details prüfen unter <code className="font-mono bg-amber-100 rounded px-1 py-0.5">/api/health</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
