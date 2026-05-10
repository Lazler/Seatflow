import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Zap, QrCode, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    titel: "Visueller Raumplan-Builder",
    beschreibung:
      "Sitzreihen, Tische und Bühnenelemente per Drag & Drop positionieren. Kein Code, kein Design-Tool.",
  },
  {
    icon: Zap,
    titel: "Automatischer Ticketshop",
    beschreibung:
      "Aus dem Raumplan wird sofort eine buchbare Seite. Gäste klicken auf ihren Platz, zahlen per Stripe.",
  },
  {
    icon: QrCode,
    titel: "QR-Code-Tickets",
    beschreibung:
      "Sofortige E-Mail-Bestätigung mit QR-Code. Check-in per Smartphone – ohne extra Hardware.",
  },
  {
    icon: BarChart3,
    titel: "Echtzeit-Dashboard",
    beschreibung:
      "Belegungsübersicht, Gästeliste und Auszahlungen über Stripe Connect auf einen Blick.",
  },
];

const PREISE = [
  {
    name: "Starter",
    preis: "€49",
    beschreibung: "Für den Einstieg",
    features: ["5 Events/Monat", "Bis 150 Plätze", "Sitzplan-Builder", "Shop & E-Mail-Bestätigung"],
    hervorgehoben: false,
  },
  {
    name: "Pro",
    preis: "€99",
    beschreibung: "Für aktive Venues",
    features: [
      "Unlimitierte Events",
      "Bis 500 Plätze",
      "Check-in App",
      "Eigenes Branding",
      "Analytics",
    ],
    hervorgehoben: true,
  },
  {
    name: "Venue",
    preis: "€149",
    beschreibung: "Für große Häuser",
    features: [
      "Unlimitierte Events",
      "Unlimitierte Plätze",
      "Multi-User",
      "API-Zugang",
      "Priority Support",
    ],
    hervorgehoben: false,
  },
];

export default function Startseite() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SF</span>
            </div>
            <span className="font-semibold text-lg">SeatFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/anmelden">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link href="/registrieren">Kostenlos starten</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <Badge variant="secondary" className="mb-6">
          Für kleine Venues in DACH
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          Nummerierte Sitzplätze verkaufen –{" "}
          <span className="text-muted-foreground">ohne Entwickler</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          SeatFlow gibt kleinen Theatern, Kabaretts und Comedy-Clubs einen professionellen
          Ticketshop mit interaktivem Sitzplan – eingerichtet in unter einer Stunde.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/registrieren">Jetzt kostenlos starten</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/anmelden">Anmelden</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Kein Setup-Aufwand · Keine Provision · €0,50 / Ticket
        </p>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Alles in einem Paket</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.titel}>
                <CardHeader>
                  <f.icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-base">{f.titel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.beschreibung}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Transparente Preise</h2>
          <p className="text-center text-muted-foreground mb-12">
            + €0,50 pro verkauftem Ticket (Weitergabe an Gast möglich)
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PREISE.map((p) => (
              <Card key={p.name} className={p.hervorgehoben ? "border-primary shadow-md" : ""}>
                <CardHeader>
                  {p.hervorgehoben && <Badge className="w-fit mb-2">Beliebteste Wahl</Badge>}
                  <CardTitle>{p.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{p.preis}</span>
                    <span className="text-muted-foreground text-sm">/Monat</span>
                  </div>
                  <CardDescription>{p.beschreibung}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={p.hervorgehoben ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/registrieren">Starten</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 SeatFlow · Alle Rechte vorbehalten</p>
      </footer>
    </div>
  );
}
