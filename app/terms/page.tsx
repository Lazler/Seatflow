import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Zurück
        </Link>
        <h1 className="text-3xl font-bold mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-sm text-muted-foreground mb-8">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-3">§ 1 Geltungsbereich</h2>
            <p className="text-muted-foreground">
              Diese AGB gelten für alle über SeatFlow abgeschlossenen Ticketkaufverträge zwischen dem
              Ticketkäufer und dem jeweiligen Veranstalter. SeatFlow ([Unternehmensname]) handelt dabei
              als technischer Dienstleister und ist nicht selbst Veranstalter.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 2 Vertragsschluss</h2>
            <p className="text-muted-foreground">
              Durch Klicken auf „Zahlungspflichtig bestellen" und erfolgreicher Zahlung kommt ein
              verbindlicher Kaufvertrag über die gewählten Tickets zustande. Die Buchungsbestätigung
              per E-Mail stellt die Annahme des Angebots dar.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 3 Ausschluss des Widerrufsrechts</h2>
            <p className="text-muted-foreground">
              Gemäß <strong>§ 312g Abs. 2 Nr. 9 BGB</strong> besteht für Tickets zu Freizeitveranstaltungen
              (Konzerte, Shows, Events) kein Widerrufsrecht, da es sich um Verträge über Dienstleistungen
              im Zusammenhang mit Freizeitbetätigungen handelt, die zu einem bestimmten Termin erbracht werden.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 4 Preise und Zahlungsbedingungen</h2>
            <p className="text-muted-foreground">
              Alle Preise sind Endpreise in Euro inkl. gesetzlicher Mehrwertsteuer. Zusätzlich wird eine
              Servicegebühr pro Ticket erhoben, die beim Kaufvorgang ausgewiesen wird. Die Zahlung erfolgt
              über den Zahlungsdienstleister Stripe.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 5 Stornierung und Erstattung</h2>
            <p className="text-muted-foreground">
              Eine Stornierung durch den Käufer ist grundsätzlich ausgeschlossen (vgl. § 3).
              Bei Absage oder wesentlicher Änderung einer Veranstaltung durch den Veranstalter werden
              die Ticketkosten (ohne Servicegebühr) erstattet. Stornierungsanfragen richten sich
              direkt an den Veranstalter.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 6 Übertragbarkeit von Tickets</h2>
            <p className="text-muted-foreground">
              Tickets sind grundsätzlich übertragbar, sofern der Veranstalter nichts anderes bestimmt.
              Bei personalisierten Tickets ist die Übertragung ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 7 Haftungsbeschränkung</h2>
            <p className="text-muted-foreground">
              SeatFlow haftet als Vermittler nicht für die Durchführung von Veranstaltungen.
              Für technische Störungen haftet SeatFlow nur bei grober Fahrlässigkeit oder Vorsatz.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">§ 8 Anwendbares Recht und Gerichtsstand</h2>
            <p className="text-muted-foreground">
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist [Ort],
              sofern der Käufer Kaufmann oder juristische Person ist.
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 pt-6 border-t border-border">
          Hinweis: Platzhalter – vor dem Launch von einem Rechtsanwalt prüfen lassen.
        </p>
      </div>
    </div>
  );
}
