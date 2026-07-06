import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Zurück
        </Link>
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-2">Angaben gemäß § 5 TMG</h2>
            <p className="text-muted-foreground">
              [Unternehmensname]<br />
              [Straße Hausnummer]<br />
              [PLZ Ort]<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Vertreten durch</h2>
            <p className="text-muted-foreground">[Geschäftsführer / Inhaber]</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Kontakt</h2>
            <p className="text-muted-foreground">
              Telefon: [+49 ...]<br />
              E-Mail: [kontakt@domain.de]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Umsatzsteuer-ID</h2>
            <p className="text-muted-foreground">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
              DE[XXXXXXXXX]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p className="text-muted-foreground">
              [Name]<br />
              [Adresse]
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">EU-Streitschlichtung</h2>
            <p className="text-muted-foreground">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr/" className="text-primary underline" target="_blank" rel="noopener">
                https://ec.europa.eu/consumers/odr/
              </a>
              <br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p className="text-muted-foreground">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 pt-6 border-t border-border">
          Hinweis: Platzhalter – bitte vor dem Launch mit echten Angaben ersetzen.
        </p>
      </div>
    </div>
  );
}
