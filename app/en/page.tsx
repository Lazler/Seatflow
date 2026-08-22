import type { Metadata } from "next";
import LandingPage, { type LandingContent } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "SeatFlow: Numbered Seat Ticketing for Small Venues",
  description:
    "SeatFlow gives theaters, cabarets and comedy clubs a professional ticketing shop with interactive seating plan, no commission, no developer, live within an hour.",
  alternates: {
    canonical: "https://seatflow.app/en",
    languages: {
      "de": "https://seatflow.app/",
      "en": "https://seatflow.app/en",
      "hu": "https://seatflow.app/hu",
    },
  },
  openGraph: {
    title: "SeatFlow: Numbered Seat Ticketing for Small Venues",
    description:
      "Seating plan ticketing for theaters, cabarets and comedy clubs. Live in one hour, no commission, €0.50 / ticket.",
    url: "https://seatflow.app/en",
    siteName: "SeatFlow",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SeatFlow: Seat Ticketing for Small Venues",
    description:
      "Theater, cabaret, comedy club: your own ticketing shop with interactive seating plan, live in one hour, no developer needed.",
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
    "SeatFlow is a seating plan ticketing platform for small venues: theaters, cabarets and comedy clubs. Visual seat map builder, automatic ticket shop, QR-code tickets and real-time dashboard.",
  url: "https://seatflow.app",
  inLanguage: ["de", "en", "hu"],
};

const EN: LandingContent = {
  lang: "en",
  nav: {
    anmelden: "Log in",
    kostenlosStarten: "Start for free",
  },
  hero: {
    badge: "For theaters, cabarets and comedy clubs",
    h1: "Sell numbered seats,",
    h1Accent: "without a developer.",
    lead: "SeatFlow gives small venues a ready-made ticketing shop with interactive seating plan. No commission, no code, no hassle. Live within an hour.",
    cta: "Start for free",
    subline: "No setup fees, no commission, €0.50 per ticket",
  },
  stats: [
    { value: "< 1 h", label: "Setup time" },
    { value: "€0.50", label: "per ticket, no commission" },
    { value: "100 %", label: "web-based, no app download" },
  ],
  usp: {
    heading: "Your venue.",
    headingAccent: "Exactly as it is.",
    sub: "Curved rows, centre aisles, tables, standing areas, blocked seats: the seat map builder recreates any room faithfully. Try it: the plan is real and clickable.",
    demo: {
      badge: "Live demo: actually clickable",
      leer: "Click a few seats",
      gewaehlt: "{n} seats selected · {preis}",
      zuruecksetzen: "Reset selection",
      zoneFrei: "free",
      zoneGewaehlt: "selected",
      zoneHinzufuegen: "+ Tap to add",
      zoneAusverkauft: "sold out",
      canvasAria: "Interactive seating plan demo",
      barrierefrei: "wheelchair accessible",
      stehplatz: "STANDING",
      zoomVergroessern: "Zoom in",
      zoomVerkleinern: "Zoom out",
      zoomReset: "Reset view",
    },
    punkte: [
      { icon: "reihen", title: "Curved rows & centre aisle", desc: "Theatre arcs with numbering that continues across the aisle, just like the real room." },
      { icon: "tische", title: "Tables & standing areas", desc: "Round tables for cabaret, capacity zones for concerts, combine freely." },
      { icon: "kategorien", title: "Price categories with colours", desc: "Stalls, premium, box: each category with its own price and colour." },
      { icon: "sperren", title: "Block individual seats", desc: "Tech desk, camera aisle, broken seat: blocked with one click, never sold by accident." },
      { icon: "vorlagen", title: "Templates & generator", desc: "Theatre, cabaret or mixed seating in seconds, then customise freely." },
      { icon: "ebenen", title: "Multiple levels", desc: "Stalls and balcony as separate plans in one event. Guests switch via tabs." },
    ],
  },
  steps: {
    heading: "Live in three steps",
    items: [
      {
        num: "1",
        title: "Draw your floor plan",
        desc: "Place rows, tables and stage elements via drag & drop. No design tool required.",
      },
      {
        num: "2",
        title: "Create your event",
        desc: "Set date, ticket price, description and configure your booking page in minutes.",
      },
      {
        num: "3",
        title: "Share the link, done",
        desc: "Guests pick their seat, pay via Stripe and receive the ticket instantly by email.",
      },
    ],
  },
  features: {
    heading: "Everything a venue needs",
    items: [
      {
        icon: "map",
        title: "Visual seat map builder",
        desc: "Freely position rows, tables and open areas. The map becomes your booking page directly.",
      },
      {
        icon: "zap",
        title: "Automatic ticket shop",
        desc: "No extra tool needed: guests book directly on your page and pay securely via Stripe.",
      },
      {
        icon: "qr",
        title: "QR-code tickets by email",
        desc: "Sent immediately after booking. Check-in at the door via smartphone, no extra hardware.",
      },
      {
        icon: "chart",
        title: "Real-time occupancy overview",
        desc: "Which seats are free, who has booked, how much revenue? Everything at a glance.",
      },
    ],
  },
  pricing: {
    heading: "Transparent pricing",
    subline: "Cancel anytime, no setup fees, service fee can be passed to the buyer",
    popular: "Most popular",
    startBtn: "Start for free",
    plans: [
      {
        name: "Free",
        price: "€0",
        period: "/month",
        desc: "Free forever, no credit card required",
        features: ["3 events/month", "Up to 80 seats", "Seat map builder", "Email tickets & QR code", "€1.50 service fee/ticket"],
        highlight: false,
      },
      {
        name: "Pro",
        price: "€29",
        period: "/month",
        desc: "Pays for itself from 40 tickets/month",
        features: [
          "Unlimited events",
          "Unlimited seats",
          "€0.75 service fee/ticket",
          "Custom branding",
          "Analytics",
        ],
        highlight: true,
      },
    ],
    rechner: {
      heading: "What will I actually pay?",
      ticketsLabel: "Tickets per month",
      breakevenHint: "Pro pays for itself from {n} tickets/month",
      upgradeBtn: "Try Pro",
      currency: "€",
    },
  },
  footer: "© 2026 SeatFlow · All rights reserved",
};

export default function EnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingPage c={EN} registerPath="/register" loginPath="/login" blogPath="/en/blog" />
    </>
  );
}
