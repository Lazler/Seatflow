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
  usp: {
    heading: "Ihr Saal.",
    headingAccent: "Exakt wie er ist.",
    sub: "Gebogene Reihen, Mittelgang, Tische, Stehplätze, gesperrte Sitze — der Raumplan-Builder bildet jeden Saal originalgetreu ab. Probieren Sie es aus: Der Plan unten ist echt und klickbar.",
    demo: {
      badge: "Live-Demo — echt klickbar",
      leer: "Klicken Sie ein paar Plätze an",
      gewaehlt: "{n} Plätze gewählt · {preis}",
      zuruecksetzen: "Auswahl zurücksetzen",
      zoneFrei: "frei",
      zoneGewaehlt: "gewählt",
      zoneHinzufuegen: "+ Tippen zum Hinzufügen",
      zoneAusverkauft: "ausverkauft",
      canvasAria: "Interaktive Sitzplan-Demo",
    },
    punkte: [
      { title: "Gebogene Reihen & Mittelgang", desc: "Theater-Halbrund mit durchlaufender Nummerierung über den Gang hinweg — wie im echten Saal." },
      { title: "Tische & Stehplatz-Zonen", desc: "Rundtische fürs Kabarett, Zonen mit Kapazität fürs Konzert — frei kombinierbar." },
      { title: "Preiskategorien mit Farben", desc: "Parkett, Premium, Loge — jede Kategorie mit eigenem Preis und eigener Farbe." },
      { title: "Einzelne Plätze sperren", desc: "Technikplatz, Kameragasse, defekter Sitz — per Klick blockiert, nie versehentlich verkauft." },
      { title: "Vorlagen & Generator", desc: "Theater, Kabarett oder Mischbestuhlung in Sekunden — danach frei anpassen." },
      { title: "Mehrere Ebenen", desc: "Parkett und Balkon als eigene Pläne im selben Event — Gäste wechseln per Tab." },
    ],
  },
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
    subline: "Monatlich kündbar · Kein Setup-Aufwand · Servicegebühr wird an Käufer weitergegeben",
    popular: "Beliebteste Wahl",
    startBtn: "Kostenlos starten",
    plans: [
      {
        name: "Free",
        price: "€0",
        period: "/Monat",
        desc: "Dauerhaft kostenlos, keine Kreditkarte nötig",
        features: ["3 Events/Monat", "Max. 80 Plätze", "Sitzplan-Builder", "E-Mail-Tickets & QR-Code", "€1,50 Servicegebühr/Ticket"],
        highlight: false,
      },
      {
        name: "Pro",
        price: "€29",
        period: "/Monat",
        desc: "Rechnet sich ab 40 Tickets/Monat",
        features: [
          "Unlimitierte Events",
          "Unlimitierte Plätze",
          "€0,75 Servicegebühr/Ticket",
          "Eigenes Branding",
          "Analytics",
        ],
        highlight: true,
      },
    ],
    rechner: {
      heading: "Was zahle ich wirklich?",
      ticketsLabel: "Tickets pro Monat",
      breakevenHint: "Pro rechnet sich ab {n} Tickets/Monat",
      upgradeBtn: "Pro ausprobieren",
      currency: "€",
    },
  },
  footer: "© 2026 SeatFlow · Alle Rechte vorbehalten",
};

const DE_TICKET_REF: LandingContent = {
  ...DE,
  hero: {
    badge: "Sie sind Veranstalter?",
    h1: "Das Ticketsystem hinter dem Event –",
    h1Accent: "jetzt für Ihr Venue.",
    lead: "SeatFlow ist der Ticketshop, den Sie gerade erlebt haben. Interaktiver Sitzplan, automatische E-Mail-Tickets, keine Provision. In einer Stunde live.",
    cta: "Kostenlos ausprobieren",
    ctaSecondary: "Anmelden",
    subline: "Kein Setup-Aufwand · Keine Provision · €0,50 pro Ticket",
  },
};

export default async function Startseite({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const content = ref === "ticket" ? DE_TICKET_REF : DE;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingPage c={content} registerPath="/registrieren" loginPath="/anmelden" />
    </>
  );
}
