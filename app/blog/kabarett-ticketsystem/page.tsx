import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Kabarett-Ticketsystem: Was kleine Bühnen wirklich brauchen",
  description:
    "Welche Funktionen ein Kabarett-Ticketsystem haben muss – und welche übertrieben sind. Ehrlicher Vergleich für kleine Bühnen mit begrenztem Budget.",
  alternates: { canonical: "https://seatflow.app/blog/kabarett-ticketsystem" },
  openGraph: {
    title: "Kabarett-Ticketsystem: Was kleine Bühnen wirklich brauchen",
    description: "Ehrlicher Leitfaden für Kabarett-Veranstalter beim Thema Ticketing.",
    url: "https://seatflow.app/blog/kabarett-ticketsystem",
    type: "article",
    publishedTime: "2026-04-24",
  },
};

export default function ArtikelKabarett() {
  return (
    <article>
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Alle Artikel
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-04-24">24. April 2026</time>
          <span>·</span>
          <span>5 min Lesezeit</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Kabarett</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Kabarett-Ticketsystem: Was kleine Bühnen wirklich brauchen
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Kabaretts sind oft kleine, fein kuratierte Bühnen. Die Stammgäste kommen immer wieder, kennen das Programm und wollen ihren Lieblingsplatz. Hier sind die Anforderungen an ein Ticketsystem ganz anders als bei einem Großkonzert.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_table]:text-sm [&_td]:p-3 [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold">

        <h2>Die typische Kabarett-Situation</h2>
        <p>
          Ein Kabarett hat 40–120 Plätze, spielt 2–6 mal pro Monat und hat eine treue Stammkundschaft. Viele laufen noch über Telefonreservierung oder Vorverkauf an der Kasse. Das Problem: Wer nicht rechtzeitig anruft, bekommt keinen Platz — auch wenn noch welche frei wären.
        </p>
        <p>
          Ein Online-Ticketsystem löst das: Gäste reservieren rund um die Uhr, auch spätabends nach dem Feierabend.
        </p>

        <h2>Muss-Funktionen für Kabarett-Ticketing</h2>

        <h3>Interaktiver Sitzplan</h3>
        <p>
          Kabarett-Stammgäste haben Lieblingsplätze. Der Platz in der ersten Reihe links, nah an der Bühne — den wollen sie immer. Ein Ticketsystem ohne Sitzplan-Auswahl kann das nicht abbilden. Ohne Sitzplanauswahl verlieren Sie Stammgäste.
        </p>

        <h3>Schnelle Buchung — maximal 2 Klicks</h3>
        <p>
          Kabarett-Publikum ist oft 40+, nicht unbedingt digital-nativ. Die Buchungsstrecke muss so einfach sein, dass keine Fragen entstehen: Platz wählen → Name und E-Mail eingeben → bezahlen. Fertig.
        </p>

        <h3>Keine Registrierungspflicht für Gäste</h3>
        <p>
          Niemand möchte ein weiteres Konto erstellen, nur um ein Kabarettticket zu kaufen. Das beste Ticketsystem fragt nur Name, E-Mail und Zahlungsdaten — keine Registrierung.
        </p>

        <h3>Gutscheine und Ermäßigungen</h3>
        <p>
          Viele Kabaretts bieten Abonnements, Gruppenrabatte oder Gutscheine an. Das Ticketsystem sollte zumindest einfache Rabattcodes unterstützen.
        </p>

        <h2>Was Sie für ein kleines Kabarett NICHT brauchen</h2>
        <ul>
          <li>CRM-Integration und E-Mail-Marketing-Automatisierung</li>
          <li>App-Download für Gäste</li>
          <li>Warteschlangensystem (für 80 Plätze unnötig)</li>
          <li>Mehrstufige Genehmigungsworkflows für Buchungen</li>
          <li>Dedicated Server und SLA-Verträge</li>
        </ul>

        <h2>Kostenvergleich: Typische Systeme für kleine Venues</h2>

        <div className="rounded-xl overflow-hidden border border-border">
          <table>
            <thead className="bg-muted/50">
              <tr>
                <th>Modell</th>
                <th>Grundgebühr</th>
                <th>Pro Ticket</th>
                <th>Bei 150 Tickets/Monat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr>
                <td>Provision 10 %</td>
                <td>€0</td>
                <td>~€1,50–€2,50</td>
                <td>€225–€375</td>
              </tr>
              <tr>
                <td>Flatrate</td>
                <td>€79–€199</td>
                <td>€0–€0,50</td>
                <td>€79–€274</td>
              </tr>
              <tr className="bg-primary/[0.03]">
                <td className="font-medium text-foreground">SeatFlow Free</td>
                <td>€0</td>
                <td>€1,50</td>
                <td>€225</td>
              </tr>
              <tr className="bg-primary/[0.03]">
                <td className="font-medium text-foreground">SeatFlow Pro</td>
                <td>€29</td>
                <td>€0,75</td>
                <td>€141</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Bei 150 Tickets pro Monat (5 Vorstellungen × 30 Plätze) spart der SeatFlow Pro-Plan gegenüber einem klassischen Provisionsmodell rund €100/Monat — also über €1.000 pro Jahr.
        </p>

        <h2>Fazit</h2>
        <p>
          Ein Kabarett braucht kein Enterprise-Ticketsystem. Es braucht: einen klaren Sitzplan, eine reibungslose Buchungsstrecke ohne Registrierungszwang, und faire Preise ohne Überraschungs-Provision. Das sind die Kriterien — und sie sind einfacher zu erfüllen als viele denken.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">SeatFlow für Ihr Kabarett</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sitzplan zeichnen, Preise setzen, sofort live. Free-Plan ohne Monatsgebühr.
        </p>
        <Button asChild>
          <Link href="/registrieren">Kostenlos ausprobieren →</Link>
        </Button>
      </div>
    </article>
  );
}
