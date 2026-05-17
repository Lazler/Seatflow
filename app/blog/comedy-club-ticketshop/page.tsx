import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Comedy-Club Ticketshop einrichten: In einer Stunde live",
  description:
    "Schritt-für-Schritt-Anleitung: Comedy-Club Ticketshop mit nummerierten Sitzplätzen, Online-Zahlung und automatischen QR-Code-Tickets aufsetzen — ohne Entwickler.",
  alternates: { canonical: "https://seatflow.app/blog/comedy-club-ticketshop" },
  openGraph: {
    title: "Comedy-Club Ticketshop einrichten: In einer Stunde live",
    description: "Schritt-für-Schritt: Eigener Ticketshop für Comedy-Clubs ohne Entwickler.",
    url: "https://seatflow.app/blog/comedy-club-ticketshop",
    type: "article",
    publishedTime: "2026-05-08",
  },
};

const SCHRITTE = [
  {
    num: "1",
    titel: "Konto erstellen",
    dauer: "2 Minuten",
    desc: "Name, E-Mail, Passwort — kein Kreditkartenzwang. Der Free-Plan reicht zum Testen.",
  },
  {
    num: "2",
    titel: "Venue und Raumplan anlegen",
    dauer: "20–30 Minuten",
    desc: "Geben Sie Ihrem Club einen Namen und zeichnen Sie den Sitzplan: Reihen, Tische, Bühne. Drag & Drop, kein Designprogramm nötig.",
  },
  {
    num: "3",
    titel: "Event erstellen",
    dauer: "5 Minuten",
    desc: "Datum, Uhrzeit, Beschreibung, Ticketpreis — fertig. Optional: mehrere Preiskategorien (z. B. Standard, VIP Tisch).",
  },
  {
    num: "4",
    titel: "Buchungslink teilen",
    dauer: "1 Minute",
    desc: "Kopieren Sie den Link und teilen Sie ihn auf Instagram, in Ihrer Bio, per Newsletter oder direkt in der WhatsApp-Gruppe.",
  },
];

export default function ArtikelComedyClub() {
  return (
    <article>
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Alle Artikel
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-05-08">8. Mai 2026</time>
          <span>·</span>
          <span>6 min Lesezeit</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Comedy-Club</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Comedy-Club Ticketshop einrichten: In einer Stunde live
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Comedy-Clubs sind oft spontaner und digitaler als klassische Theater. Gäste entscheiden kurzfristig, buchen über Social Media und erwarten sofortige Bestätigung. Hier ist die komplette Anleitung für einen Ticketshop in unter einer Stunde.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">

        <h2>Warum Comedy-Clubs einen eigenen Ticketshop brauchen</h2>
        <p>
          Viele Comedy-Clubs verkaufen noch über Drittplattformen mit 15–20% Provision, oder sie wickeln alles über DMs auf Instagram ab. Beide Wege haben klare Nachteile:
        </p>
        <ul>
          <li>Drittplattformen nehmen hohe Provisionen und Sie verlieren die Kundendaten</li>
          <li>Manuelle DM-Buchungen sind nicht skalierbar und fehleranfällig</li>
          <li>Keine Übersicht über Auslastung und Umsatz in Echtzeit</li>
        </ul>
        <p>
          Ein eigener Ticketshop kostet heute weniger als eine Tankfüllung pro Monat — und Sie behalten die volle Kontrolle.
        </p>
      </div>

      {/* Steps */}
      <div className="my-10 space-y-4">
        <h2 className="text-xl font-bold">In 4 Schritten live</h2>
        {SCHRITTE.map((s) => (
          <div key={s.num} className="flex gap-4 p-5 rounded-xl border border-border">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              {s.num}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{s.titel}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{s.dauer}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">

        <h2>Besonderheiten für Comedy-Clubs</h2>

        <h3>Tischbelegung statt Stuhlreihen</h3>
        <p>
          Die meisten Comedy-Clubs haben keine klassische Theaterbestuhlung, sondern Tische mit 2–6 Plätzen. Mit einem flexiblen Sitzplan-Editor können Sie Tische als Gruppen konfigurieren — Gäste buchen dann z. B. "Tisch 4, Platz A" statt "Reihe 3, Platz 12".
        </p>

        <h3>Kurzfristige Buchungen über Social Media</h3>
        <p>
          Comedy-Club-Gäste entscheiden oft spontan. Teilen Sie den Buchungslink in der Instagram-Bio, im Story-Link und in der Facebook-Veranstaltung. Der Link funktioniert direkt ohne App-Download.
        </p>

        <h3>Last-Minute-Plätze ausverkaufen</h3>
        <p>
          Mit Echtzeit-Belegungsübersicht sehen Sie sofort, wie viele Plätze noch frei sind. Das ermöglicht gezielte Last-Minute-Posts: "Noch 8 Plätze für heute Abend — jetzt buchen!"
        </p>

        <h2>Was passiert nach der Buchung?</h2>
        <p>
          Gäste erhalten sofort eine Bestätigungs-E-Mail mit:
        </p>
        <ul>
          <li>QR-Code-Ticket als PDF-Anhang</li>
          <li>Datum, Uhrzeit und Adresse der Veranstaltung</li>
          <li>Gebuchter Platz / Tisch</li>
          <li>Möglichkeit, Ticket herunterzuladen</li>
        </ul>
        <p>
          Am Einlass scannen Sie den QR-Code mit jedem Smartphone — keine extra Hardware nötig.
        </p>

        <h2>Fazit: Lohnt sich ein eigener Ticketshop?</h2>
        <p>
          Ja — wenn Ihr Club mehr als 10 Shows pro Monat macht oder Sie mehr als 50 Tickets verkaufen. Die Zeitersparnis durch automatisierte Buchungsabwicklung zahlt sich schnell aus. Und mit einer reinen Servicegebühr statt Provision bleibt mehr Marge bei Ihnen.
        </p>
      </div>

      {/* Checklist */}
      <div className="my-10 rounded-xl bg-muted/30 border border-border p-6">
        <h3 className="font-semibold mb-4">Checkliste: Ist SeatFlow das Richtige für Ihren Club?</h3>
        <ul className="space-y-3">
          {[
            "Feste Bestuhlung oder Tischbelegung (nicht Free-Standing)",
            "Weniger als 500 Plätze pro Venue",
            "1–50 Events pro Monat",
            "Möchten Tickets selbst verkaufen (kein Drittanbieter-Marktplatz)",
            "Keine Provision zahlen wollen",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-4">
          Trifft das meiste zu? Dann ist SeatFlow wahrscheinlich eine gute Wahl.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Jetzt ausprobieren — kostenlos und ohne Kreditkarte</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Free-Plan: 3 Events/Monat, bis 80 Plätze. In einer Stunde live.
        </p>
        <Button asChild>
          <Link href="/registrieren">Kostenlos starten →</Link>
        </Button>
      </div>
    </article>
  );
}
