import type { Metadata } from "next";
import LandingPage, { type LandingContent } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "SeatFlow – Ticketshop mit nummerierter Bestuhlung für kleine Venues",
  description:
    "SeatFlow gibt Theatern, Kabaretts und Comedy-Clubs einen professionellen Sitzplan-Ticketshop – ohne Provision, ohne Entwickler, in einer Stunde live.",
  alternates: {
    canonical: "https://seatflow.app/",
    languages: {
      "de": "https://seatflow.app/",
      "en": "https://seatflow.app/en",
      "hu": "https://seatflow.app/hu",
    },
  },
  openGraph: {
    title: "SeatFlow – Ticketshop mit nummerierter Bestuhlung für kleine Venues",
    description:
      "Sitzplan-Ticketshop für Theater, Kabarett und Comedy-Clubs. In einer Stunde live, keine Provision, €0,50 / Ticket.",
    url: "https://seatflow.app/",
    siteName: "SeatFlow",
    locale: "de_AT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SeatFlow – Ticketshop mit Sitzplan für kleine Venues",
    description:
      "Theater, Kabarett, Comedy-Club: In einer Stunde deinen eigenen Ticketshop mit interaktivem Sitzplan – kein Entwickler nötig.",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SeatFlow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "EUR",
  },
  description:
    "SeatFlow ist ein Sitzplan-Ticketshop für kleine Venues – Theater, Kabarett, Comedy-Club. Interaktiver Raumplan-Builder, automatischer Ticketshop, QR-Code-Tickets und Echtzeit-Dashboard.",
  url: "https://seatflow.app",
  inLanguage: ["de", "en", "hu"],
};

const DE: LandingContent = {
  lang: "de",
  nav: {
    anmelden: "Anmelden",
    kostenlosStarten: "Kostenlos starten",
  },
  hero: {
    badge: "Ticketshop für Theater · Kabarett · Comedy-Clubs",
    h1: "Nummerierte Sitzplätze verkaufen –",
    h1Accent: "ohne Entwickler.",
    lead: "SeatFlow gibt kleinen Venues einen fertigen Ticketshop mit interaktivem Sitzplan. Keine Provision, kein Code, kein Aufwand – in einer Stunde live.",
    cta: "Jetzt kostenlos starten",
    ctaSecondary: "Anmelden",
    subline: "Kein Setup-Aufwand · Keine Provision · €0,50 pro Ticket",
  },
  stats: [
    { value: "< 1 h", label: "Einrichtungszeit" },
    { value: "€0,50", label: "pro Ticket, keine Provision" },
    { value: "100 %", label: "web-basiert, kein App-Download" },
  ],
  steps: {
    heading: "In drei Schritten live",
    items: [
      {
        num: "1",
        title: "Raumplan zeichnen",
        desc: "Sitzreihen, Tische und Bühnenelemente per Drag & Drop platzieren. Kein Designprogramm nötig.",
      },
      {
        num: "2",
        title: "Event anlegen",
        desc: "Datum, Ticketpreis, Beschreibung und Buchungsseite in wenigen Minuten konfigurieren.",
      },
      {
        num: "3",
        title: "Link teilen – fertig",
        desc: "Gäste klicken auf ihren Wunschplatz, zahlen per Stripe und erhalten das Ticket sofort per E-Mail.",
      },
    ],
  },
  features: {
    heading: "Alles, was ein Venue braucht",
    items: [
      {
        icon: "map",
        title: "Visueller Sitzplan-Builder",
        desc: "Reihen, Tische und Freiflächen frei positionieren. Der Plan wird direkt zur buchbaren Seite.",
      },
      {
        icon: "zap",
        title: "Automatischer Ticketshop",
        desc: "Kein Extra-Tool: Gäste buchen direkt auf deiner Seite und zahlen sicher über Stripe.",
      },
      {
        icon: "qr",
        title: "QR-Code-Tickets per E-Mail",
        desc: "Sofort nach der Buchung. Check-in am Einlass per Smartphone – keine extra Hardware.",
      },
      {
        icon: "chart",
        title: "Echtzeit-Belegungsübersicht",
        desc: "Welche Plätze sind frei, wer hat gebucht, wie viel Umsatz? Alles auf einen Blick.",
      },
    ],
  },
  pricing: {
    heading: "Transparente Preise",
    subline: "Monatlich kündbar · Alle Pläne inkl. Sitzplan-Builder, Ticketshop & QR-Code-Check-in",
    popular: "Beliebteste Wahl",
    startBtn: "Starten",
    plans: [
      {
        name: "Starter",
        price: "€49",
        period: "/Monat",
        desc: "Für den Einstieg",
        features: ["5 Events/Monat", "Bis 150 Plätze", "Sitzplan-Builder", "E-Mail-Tickets & QR-Code"],
        highlight: false,
      },
      {
        name: "Pro",
        price: "€99",
        period: "/Monat",
        desc: "Für aktive Venues",
        features: [
          "Unlimitierte Events",
          "Bis 500 Plätze",
          "Mehrere Ticket-Kategorien",
          "Check-in App",
          "Analytics",
        ],
        highlight: true,
      },
      {
        name: "Venue",
        price: "€149",
        period: "/Monat",
        desc: "Für große Häuser",
        features: [
          "Unlimitierte Events & Plätze",
          "Mehrsprachige Buchungsseite",
          "Multi-User",
          "API-Zugang",
          "Priority Support",
        ],
        highlight: false,
      },
    ],
  },
  footer: "© 2026 SeatFlow · Alle Rechte vorbehalten",
};

export default function Startseite() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingPage c={DE} registerPath="/registrieren" loginPath="/anmelden" />
    </>
  );
}
