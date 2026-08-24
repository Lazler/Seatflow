import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Zurück
        </Link>
        <h1 className="text-3xl font-bold mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-muted-foreground mb-8">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-3">1. Verantwortlicher</h2>
            <p className="text-muted-foreground">
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
              [Unternehmensname], [Adresse], [E-Mail]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">2. Erhobene Daten und Zweck</h2>
            <p className="text-muted-foreground mb-2">Wir verarbeiten folgende personenbezogene Daten:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>Name und E-Mail-Adresse</strong> – zur Abwicklung von Ticketbuchungen und zum Versand der Tickets</li>
              <li><strong>Zahlungsdaten</strong> – werden ausschließlich durch Stripe verarbeitet (wir speichern keine Kartendaten)</li>
              <li><strong>IP-Adresse und Gerätedaten</strong> – zur Sicherheit und Fehleranalyse (Server-Logs)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">3. Rechtsgrundlagen (DSGVO)</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung (Ticketkauf)</li>
              <li>Art. 6 Abs. 1 lit. c DSGVO – gesetzliche Pflichten (Aufbewahrung von Rechnungen 10 Jahre)</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO – berechtigte Interessen (Sicherheit, Missbrauchsprävention)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">4. Drittanbieter</h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Stripe (Zahlungsabwicklung)</p>
                <p>Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland.<br />
                Datenschutzerklärung: <a href="https://stripe.com/de/privacy" className="text-primary underline" target="_blank" rel="noopener">stripe.com/de/privacy</a></p>
              </div>
              <div>
                <p className="font-medium text-foreground">Supabase (Datenbank / Hosting)</p>
                <p>Supabase Inc., 970 Trestle Glen Rd, Oakland, CA 94610, USA.<br />
                Daten werden in der EU (Frankfurt) gespeichert. DPA vorhanden.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Resend (E-Mail-Versand)</p>
                <p>Resend Inc., San Francisco, USA. Verarbeitungsvertrag (DPA) liegt vor.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">5. Datenspeicherung und Löschung</h2>
            <p className="text-muted-foreground">
              Buchungsdaten werden gemäß handels- und steuerrechtlicher Aufbewahrungsfristen
              10 Jahre gespeichert. Danach werden sie automatisch gelöscht.
              Auf Anfrage löschen wir Ihre Daten, soweit keine gesetzliche Aufbewahrungspflicht besteht.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">6. Ihre Rechte</h2>
            <p className="text-muted-foreground mb-2">Sie haben gemäß DSGVO folgende Rechte:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Auskunft (Art. 15 DSGVO)</li>
              <li>Berichtigung (Art. 16 DSGVO)</li>
              <li>Löschung (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch (Art. 21 DSGVO)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Zur Ausübung Ihrer Rechte: <a href="mailto:datenschutz@[domain].de" className="text-primary underline">datenschutz@[domain].de</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">7. Beschwerderecht</h2>
            <p className="text-muted-foreground">
              Sie haben das Recht, sich bei der zuständigen Datenschutz-Aufsichtsbehörde zu beschweren.
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 pt-6 border-t border-border">
          Hinweis: Platzhalter – bitte vor dem Launch durch einen Datenschutzbeauftragten prüfen lassen.
        </p>
      </div>
    </div>
  );
}
