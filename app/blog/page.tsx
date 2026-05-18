import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "SeatFlow Blog – Tipps für Veranstalter",
  description:
    "Praxistipps rund um Ticketverkauf, Sitzplatzverwaltung und Eventorganisation für Theater, Kabarett und Comedy-Clubs.",
  alternates: { canonical: "https://seatflow.app/blog" },
};

const ARTIKEL = [
  {
    slug: "tickets-verkaufen-theater",
    titel: "Tickets online verkaufen für Theater: Der vollständige Leitfaden",
    teaser:
      "Wie kleine und mittlere Theater ihren Ticketverkauf digitalisieren können – von der Sitzplatzverwaltung bis zur automatischen E-Mail-Zustellung.",
    datum: "2026-04-10",
    lesezeit: "7 min",
  },
  {
    slug: "kabarett-ticketsystem",
    titel: "Kabarett-Ticketsystem: Was kleine Bühnen wirklich brauchen",
    teaser:
      "Kein Budget für teure Ticketing-Plattformen? Wir erklären, welche Funktionen ein Kabarett-Ticketsystem bieten muss – und welche übertrieben sind.",
    datum: "2026-04-24",
    lesezeit: "5 min",
  },
  {
    slug: "comedy-club-ticketshop",
    titel: "Comedy-Club Ticketshop einrichten: In einer Stunde live",
    teaser:
      "Schritt-für-Schritt: Wie Comedy-Clubs ihren eigenen Ticketshop mit nummerierten Sitzplätzen aufsetzen – ohne Entwickler und ohne Monatsgebühren.",
    datum: "2026-05-08",
    lesezeit: "6 min",
  },
  {
    slug: "ticketing-vergleich",
    titel: "Ticketing-Systeme im Vergleich: Was passt zu kleinen Kulturveranstaltungen?",
    teaser:
      "Eventbrite, TicketTailor, pretix oder Eigenentwicklung? Wir vergleichen die gängigsten Lösungen für Theater, Kabarett und Comedy-Clubs – und zeigen, worauf es wirklich ankommt.",
    datum: "2026-05-15",
    lesezeit: "8 min",
  },
];

export default function BlogIndex() {
  return (
    <div>
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Tipps für Veranstalter</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Praxiswissen rund um Ticketverkauf, Sitzplatzverwaltung und Eventorganisation für Theater, Kabarett und Comedy-Clubs.
        </p>
      </div>

      <div className="space-y-8">
        {ARTIKEL.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="group block border border-border rounded-xl p-6 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <time dateTime={a.datum}>
                {new Date(a.datum).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <span>·</span>
              <span>{a.lesezeit} Lesezeit</span>
            </div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{a.titel}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{a.teaser}</p>
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
              Weiterlesen <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
