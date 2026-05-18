import type { Metadata } from "next";
import LandingPage, { type LandingContent } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "SeatFlow – Számozott ülőhelyek értékesítése kis helyszíneknek",
  description:
    "A SeatFlow professzionális jegyvásárlási felületet ad színházaknak, kabarénak és komédiakluboknak – jutalék nélkül, fejlesztő nélkül, egy órán belül élesben.",
  alternates: {
    canonical: "https://seatflow.app/hu",
    languages: {
      "de": "https://seatflow.app/",
      "en": "https://seatflow.app/en",
      "hu": "https://seatflow.app/hu",
    },
  },
  openGraph: {
    title: "SeatFlow – Számozott ülőhelyek értékesítése kis helyszíneknek",
    description:
      "Ülésrend alapú jegyrendszer színházaknak, kabarénak és komédiakluboknak. Egy óra alatt éles, jutalék nélkül, €0,50/jegy.",
    url: "https://seatflow.app/hu",
    siteName: "SeatFlow",
    locale: "hu_HU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SeatFlow – Ülőhelyes jegyrendszer kis helyszíneknek",
    description:
      "Színház, kabaré, komédiaklubok: saját jegyrendszer interaktív ülésrenddel, egy óra alatt – fejlesztő nélkül.",
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
    "A SeatFlow ülésrend alapú jegyrendszer kis helyszíneknek – színházaknak, kabarénak és komédiakluboknak. Vizuális alaprajz-szerkesztő, automatikus jegyboltt, QR-kódos jegyek és valós idejű áttekintő.",
  url: "https://seatflow.app",
  inLanguage: ["de", "en", "hu"],
};

const HU: LandingContent = {
  lang: "hu",
  nav: {
    anmelden: "Bejelentkezés",
    kostenlosStarten: "Ingyenes indítás",
  },
  hero: {
    badge: "Jegyrendszer színházaknak · kabarénak · komédiakluboknak",
    h1: "Számozott ülőhelyek értékesítése –",
    h1Accent: "fejlesztő nélkül.",
    lead: "A SeatFlow kész jegyboltt ad kis helyszíneknek interaktív ülésrenddel. Jutalék nélkül, kód nélkül, gond nélkül – egy órán belül élesben.",
    cta: "Ingyenes indítás",
    ctaSecondary: "Bejelentkezés",
    subline: "Nincs beállítási díj · Nincs jutalék · €0,50 jegyenként",
  },
  stats: [
    { value: "< 1 ó", label: "beállítási idő" },
    { value: "€0,50", label: "jegyenként, jutalék nélkül" },
    { value: "100 %", label: "webalapú, nem kell alkalmazás" },
  ],
  steps: {
    heading: "Három lépésben élesben",
    items: [
      {
        num: "1",
        title: "Rajzold meg az alaprajzot",
        desc: "Sorokat, asztalokat és pódiumelemeket drag & drop segítségével helyezz el. Nincs szükség tervezőprogramra.",
      },
      {
        num: "2",
        title: "Hozd létre az eseményt",
        desc: "Dátum, jegyár, leírás és a foglalási oldal beállítása néhány perc alatt.",
      },
      {
        num: "3",
        title: "Oszd meg a linket – kész",
        desc: "A vendégek kiválasztják helyüket, fizetnek Stripe-on keresztül, és azonnal megkapják a jegyet e-mailben.",
      },
    ],
  },
  features: {
    heading: "Minden, amire egy helyszínnek szüksége van",
    items: [
      {
        icon: "map",
        title: "Vizuális alaprajz-szerkesztő",
        desc: "Sorokat, asztalokat és szabad területeket szabadon pozicionálhatsz. Az alaprajz közvetlenül foglalható oldallá válik.",
      },
      {
        icon: "zap",
        title: "Automatikus jegybolt",
        desc: "Nincs szükség extra eszközre: a vendégek közvetlenül az oldaladon foglalnak, és biztonságosan fizetnek Stripe-on.",
      },
      {
        icon: "qr",
        title: "QR-kódos jegyek e-mailben",
        desc: "Azonnal a foglalás után. Beengedés okostelefonnal a bejáratnál – nincs szükség extra hardverre.",
      },
      {
        icon: "chart",
        title: "Valós idejű helyfoglaltság-áttekintő",
        desc: "Melyik hely szabad, ki foglalt, mennyi a bevétel? Minden egy pillantásra.",
      },
    ],
  },
  pricing: {
    heading: "Átlátható árak",
    subline: "Bármikor lemondható · Nincs beállítási díj · A szolgáltatási díj áthárítható a vevőre",
    popular: "Legnépszerűbb",
    startBtn: "Ingyenes indítás",
    plans: [
      {
        name: "Free",
        price: "€0",
        period: "/hó",
        desc: "Örökre ingyenes, nem kell bankkártya",
        features: ["3 esemény/hó", "Max. 80 férőhely", "Alaprajz-szerkesztő", "E-mail jegyek & QR-kód", "€1,50 szolgáltatási díj/jegy"],
        highlight: false,
      },
      {
        name: "Pro",
        price: "€29",
        period: "/hó",
        desc: "Megtérül 40 jegy/hótól",
        features: [
          "Korlátlan esemény",
          "Korlátlan férőhely",
          "€0,75 szolgáltatási díj/jegy",
          "Saját arculat",
          "Analitika",
        ],
        highlight: true,
      },
    ],
    rechner: {
      heading: "Mennyit fizetek valójában?",
      ticketsLabel: "Jegy havonta",
      breakevenHint: "A Pro {n} jegy/hótól éri meg",
      upgradeBtn: "Pro kipróbálása",
      currency: "€",
    },
  },
  footer: "© 2026 SeatFlow · Minden jog fenntartva",
};

export default function HuPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingPage c={HU} registerPath="/registrieren" loginPath="/anmelden" blogPath="/hu/blog" />
    </>
  );
}
