import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Tickets online verkaufen für Theater: Der vollständige Leitfaden",
  description:
    "Wie kleine und mittlere Theater ihren Ticketverkauf digitalisieren – von der Sitzplatzverwaltung bis zur automatischen E-Mail-Zustellung. Schritt-für-Schritt erklärt.",
  alternates: { canonical: "https://seatflow.app/blog/tickets-verkaufen-theater" },
  openGraph: {
    title: "Tickets online verkaufen für Theater",
    description: "Leitfaden zur Digitalisierung des Ticketverkaufs für Theater und Bühnen.",
    url: "https://seatflow.app/blog/tickets-verkaufen-theater",
    type: "article",
    publishedTime: "2026-04-10",
  },
};

export default function ArtikelTheater() {
  return (
    <article>
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Alle Artikel
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-04-10">10. April 2026</time>
          <span>·</span>
          <span>7 min Lesezeit</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Theater</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Tickets online verkaufen für Theater: Der vollständige Leitfaden
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Viele kleine Theater verkaufen Tickets noch per Telefon, E-Mail oder an der Abendkasse. Das kostet Zeit und Nerven. Dieser Leitfaden zeigt, wie Sie in wenigen Stunden auf digitalen Ticketverkauf umstellen — ohne IT-Kenntnisse und ohne teure Agentur.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>Warum digitaler Ticketverkauf für Theater?</h2>
        <p>
          Ein kleines Theater mit 120 Plätzen, das dreimal pro Woche spielt, nimmt pro Saison mehrere tausend Buchungen entgegen. Wenn jede Buchung ein Telefonanruf oder eine E-Mail bedeutet, bindet das erhebliche Ressourcen — und schreckt spontan buchende Gäste ab.
        </p>
        <p>
          Moderne Ticketshops lösen dieses Problem: Gäste wählen ihren Platz selbst, zahlen online, und erhalten ihr Ticket sofort per E-Mail. Für das Theater entfällt die manuelle Reservierungsverwaltung.
        </p>

        <h2>Die drei wichtigsten Anforderungen für Theaterkarten</h2>

        <h3>1. Nummerierte Sitzplätze</h3>
        <p>
          Im Gegensatz zu Konzerten oder Festivals haben Theater fast immer feste Bestuhlung. Gäste möchten <em>ihren</em> Platz wählen — nicht nur eine Kategorie buchen. Ein gutes Theaterkassen-System zeigt daher einen interaktiven Raumplan, auf dem freie Plätze sichtbar sind.
        </p>

        <h3>2. Automatische Ticket-Zustellung</h3>
        <p>
          Nach dem Kauf sollte das Ticket sofort per E-Mail als PDF ankommen — mit QR-Code für den Einlass. Das spart dem Theater die Abendkassenarbeit und gibt Gästen Sicherheit.
        </p>

        <h3>3. Keine monatlichen Grundgebühren</h3>
        <p>
          Kleine Theater spielen nicht das ganze Jahr. Eine Plattform mit hoher Grundgebühr und Provisions-Aufschlag macht keinen Sinn, wenn nur 3–4 Produktionen pro Saison gezeigt werden. Besser: ein Modell mit reiner Ticketgebühr ohne Grundkosten.
        </p>

        <h2>Schritt-für-Schritt: Eigenen Ticketshop aufbauen</h2>
        <ol>
          <li><strong>Raumplan digital erfassen</strong> — Die meisten Systeme bieten einen visuellen Editor, in dem Sie Reihen und Plätze positionieren. Das dauert für einen typischen Theatersaal 30–60 Minuten.</li>
          <li><strong>Preiskategorien definieren</strong> — Parkett, Balkon, Loge, Ermäßigt: jeder Platz kann einer Kategorie mit eigenem Preis zugeordnet werden.</li>
          <li><strong>Event anlegen</strong> — Titel, Datum, Beschreibung und ggf. eine Buchungsfrist eingeben.</li>
          <li><strong>Link teilen</strong> — Die Buchungsseite erhalten Sie als Link, den Sie auf Ihrer Website einbinden oder direkt verschicken können.</li>
        </ol>

        <h2>Häufige Fehler beim Einstieg</h2>
        <ul>
          <li><strong>Zu komplexe Systeme wählen:</strong> Für ein Theater mit 100 Plätzen brauchen Sie keine Enterprise-Lösung mit CRM-Integration.</li>
          <li><strong>Provision unterschätzen:</strong> Einige Anbieter nehmen 10–15% pro Ticket als Provision. Bei einem 18-€-Ticket sind das bis zu 2,70 € — mehr als eine monatliche Grundgebühr.</li>
          <li><strong>Kein Test vor dem Launch:</strong> Kaufen Sie mindestens ein Testticket durch den gesamten Prozess, bevor Sie die Buchungsseite veröffentlichen.</li>
        </ul>

        <h2>Kosten im Überblick</h2>
        <p>
          Die tatsächlichen Kosten hängen stark vom Modell ab. Ein Theater mit 80 Plätzen, das monatlich 3 Vorstellungen ausverkauft (240 Tickets), zahlt:
        </p>
        <ul>
          <li>Bei <strong>Provisionsmodell (10%)</strong> mit 18 € Ticketpreis: ~432 €/Monat</li>
          <li>Bei <strong>Festgebühr + Servicegebühr</strong> (z. B. 29 €/Monat + 0,75 €/Ticket): ~209 €/Monat</li>
          <li>Bei <strong>reiner Servicegebühr</strong> (1,50 €/Ticket): ~360 €/Monat ohne Monatskosten</li>
        </ul>
        <p>
          SeatFlow arbeitet ohne Provision: Free-Plan mit 1,50 €/Ticket, Pro-Plan ab 29 €/Monat mit 0,75 €/Ticket.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">SeatFlow ausprobieren — kostenlos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Raumplan zeichnen, Event anlegen, Buchungslink teilen. Keine Kreditkarte, keine Kündigung nötig.
        </p>
        <Button asChild>
          <Link href="/registrieren">Kostenlos starten →</Link>
        </Button>
      </div>
    </article>
  );
}
