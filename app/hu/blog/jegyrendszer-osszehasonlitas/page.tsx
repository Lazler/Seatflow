import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Jegyrendszerek összehasonlítása: Mi való kis kulturális helyszíneknek?",
  description:
    "Eventbrite, TicketTailor, pretix vagy saját fejlesztés? Összehasonlítjuk a leggyakoribb megoldásokat színházak, kabarék és comedy klubok számára – és megmutatjuk, mi számít igazán.",
  alternates: { canonical: "https://seatflow.app/hu/blog/jegyrendszer-osszehasonlitas" },
  openGraph: {
    title: "Jegyrendszerek összehasonlítása: Mi való kis kulturális helyszíneknek?",
    description: "Az Eventbrite, TicketTailor, pretix, saját fejlesztés és SeatFlow őszinte összehasonlítása kis helyszíneknek.",
    url: "https://seatflow.app/hu/blog/jegyrendszer-osszehasonlitas",
    type: "article",
    publishedTime: "2026-05-15",
  },
};

export default function CikkOsszehasonlitas() {
  return (
    <article>
      <Link href="/hu/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Összes cikk
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-05-15">2026. május 15.</time>
          <span>·</span>
          <span>8 perc olvasás</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Összehasonlítás</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Jegyrendszerek összehasonlítása: Mi való kis kulturális helyszíneknek?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Aki kis színházat, kabarét vagy comedy klubot üzemeltet, előbb-utóbb ugyanazzal a kérdéssel szembesül: melyik jegyrendszer a megfelelő? A piac áttekinthetetlen, az ármodellek nehezen összehasonlíthatók, a nagy platformok pedig nem kis helyszínekre épültek. Ez a cikk összehasonlítja a leggyakoribb lehetőségeket – őszintén és marketingszöveg nélkül.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">

        <h2>Az öt leggyakoribb megközelítés</h2>
        <p>
          A kis kulturális helyszínek üzemeltetői általában néhány lehetőség közül választanak: ismert nemzetközi platformok, mint az Eventbrite vagy a TicketTailor, nyílt forráskódú megoldások, mint a pretix, saját fejlesztés – vagy egy kisebb helyszínekre specializált megoldás. Minden lehetőségnek vannak valódi előnyei és valódi hátrányai, amelyek az adott felhasználási esettől függnek.
        </p>
        <p>
          Ha arra kíváncsi, milyen alapfunkciókat kell tartalmaznia egy jegyrendszernek az Ön{" "}
          <Link href="/hu/blog/kabare-jegyrendszer" className="text-primary underline underline-offset-4 hover:text-primary/80">
            kabarénál
          </Link>{" "}
          vagy{" "}
          <Link href="/hu/blog/jegyek-ertekesitese-szinhaz" className="text-primary underline underline-offset-4 hover:text-primary/80">
            színházánál
          </Link>
          , érdemes előbb megnézni a vonatkozó útmutatóinkat.
        </p>

        <h2>Eventbrite</h2>
        <p>
          Az Eventbrite a világ legismertebb jegyértékesítési platformja, és sokak számára az első lépés. A kezdés ingyenes és a platform széles körben ismert – ami egyben hátrány is, hiszen a vendégek az Eventbrite oldalán kötnek ki, nem az Önén. A jutalékmodell gyorsan összeadódik: a jegy árának akár 6,5%-a plusz 0,59 euró/jegy egyenesen az Eventbrite-hoz kerül. Egy 20 eurós jegynél ez 1,89 euró – az árbevétel kb. 9,5%-a.
        </p>

        <h2>TicketTailor</h2>
        <p>
          A TicketTailor más megközelítést alkalmaz: jutalék helyett a szervezők havi alapdíjat fizetnek kb. 49 eurótól. Ez teljesen megszünteti a jegyenkénti jutalékot – nagyobb volumen esetén vonzó. A platform szilárd, angol nyelvű és nemzetközi szervezőknek szánt.
        </p>

        <h2>pretix</h2>
        <p>
          A pretix egy nyílt forráskódú jegyértékesítési megoldás, amely elvben ingyen önállóan telepíthető – vagy havi díjért hosztolt verzióként használható. A projekt technikailag érett, GDPR-kompatibilis és sok bővítési lehetőséget kínál.
        </p>
        <p>
          A gond: a pretix technikus felhasználóknak vagy IT-erőforrásokkal rendelkező szervezeteknek szól. Egy önállóan hosztolt példány beállítása napokig tart, nem óráig.
        </p>

        <h2>Saját fejlesztés</h2>
        <p>
          Egyes üzemeltetők saját foglalási megoldás fejlesztésén gondolkodnak. Ez elvben lehetséges, de reálisan jelentős erőfeszítéssel jár: 3–6 hónap fejlesztési idő, 15 000 eurótól induló költségek (gyakran sokkal több), majd folyamatos karbantartás.
        </p>
        <p>
          Egyedi{" "}
          <Link href="/hu/blog/comedy-klub-jegyarulas" className="text-primary underline underline-offset-4 hover:text-primary/80">
            comedy klub
          </Link>{" "}
          esetén ez gazdaságilag szinte soha nem éri meg.
        </p>

        <h2>SeatFlow</h2>
        <p>
          A SeatFlow kifejezetten kis kulturális helyszínek számára lett fejlesztve. A hangsúly a számozott alaprajzokon, az egyszerű beállításon és az átlátható, jutalék nélküli ármodellen van. Az ingyenes csomag havi 3 eseményt tesz lehetővé, a Pro csomag 29 euró/hó, csökkentett szolgáltatási díjjal.
        </p>

        <h2>Összehasonlító táblázat</h2>
      </div>

      <div className="overflow-x-auto my-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-3 pr-4 font-semibold">Szempont</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">Eventbrite</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">TicketTailor</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">pretix</th>
              <th className="text-center py-3 px-3 font-semibold text-primary">SeatFlow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-3 pr-4 font-medium">Beállítási idő</td>
              <td className="text-center py-3 px-3 text-muted-foreground">1–2 óra</td>
              <td className="text-center py-3 px-3 text-muted-foreground">1–2 óra</td>
              <td className="text-center py-3 px-3 text-muted-foreground">1–3 nap</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">&lt; 1 óra</td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Számozott ülési rend</td>
              <td className="text-center py-3 px-3 text-muted-foreground">Korlátozott</td>
              <td className="text-center py-3 px-3 text-muted-foreground">Egyszerű</td>
              <td className="text-center py-3 px-3"><span className="text-emerald-600 font-medium">✓</span></td>
              <td className="text-center py-3 px-3 font-semibold text-primary"><span className="text-emerald-600">✓</span> (vizuális)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">Magyar/DACH fókusz</td>
              <td className="text-center py-3 px-3"><span className="text-red-500">✗</span></td>
              <td className="text-center py-3 px-3"><span className="text-red-500">✗</span></td>
              <td className="text-center py-3 px-3"><span className="text-amber-500">○</span></td>
              <td className="text-center py-3 px-3 font-semibold"><span className="text-emerald-600">✓</span></td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Ingyenes belépés</td>
              <td className="text-center py-3 px-3 text-muted-foreground"><span className="text-emerald-600">✓</span> (jutalék)</td>
              <td className="text-center py-3 px-3 text-muted-foreground"><span className="text-emerald-600">✓</span> (korlátozott)</td>
              <td className="text-center py-3 px-3 text-muted-foreground"><span className="text-emerald-600">✓</span> (saját szerver)</td>
              <td className="text-center py-3 px-3 font-semibold text-primary"><span className="text-emerald-600">✓</span> (Ingyenes csomag)</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">Havi alapköltség</td>
              <td className="text-center py-3 px-3 text-muted-foreground">0 €</td>
              <td className="text-center py-3 px-3 text-muted-foreground">49 €-tól</td>
              <td className="text-center py-3 px-3 text-muted-foreground">0 €–változó</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">0–29 €</td>
            </tr>
            <tr className="bg-muted/20">
              <td className="py-3 pr-4 font-medium">Jegyenkénti díj</td>
              <td className="text-center py-3 px-3 text-muted-foreground">6,5% + 0,59 €</td>
              <td className="text-center py-3 px-3 text-muted-foreground">0 € (csomagban)</td>
              <td className="text-center py-3 px-3 text-muted-foreground">változó</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">0,75–1,50 €</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">Nyelv / támogatás</td>
              <td className="text-center py-3 px-3 text-muted-foreground">EN</td>
              <td className="text-center py-3 px-3 text-muted-foreground">EN</td>
              <td className="text-center py-3 px-3 text-muted-foreground">DE/EN</td>
              <td className="text-center py-3 px-3 font-semibold text-primary">DE (DACH)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">
        <h2>Következtetés</h2>
        <p>
          Nincs egyetlen legjobb jegyértékesítési megoldás. A választás attól függ, milyen gyakran játszik, törzs- vagy új közönséget céloz-e, szüksége van-e számozott alaprajzra, és milyen büdzsét szán erre.
        </p>
        <p>
          Bármely rendszert is választja: tesztelje alaposan egy valódi jegyvásárlással, mielőtt közzéteszi a foglalási oldalt.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Próbálja ki a SeatFlow-t ingyen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Rajzolja meg az alaprajzot, hozzon létre egy eseményt, ossza meg a foglalási linket – bankkártya és havidíj nélkül.
        </p>
        <Button asChild>
          <Link href="/registrieren">Ingyenes kezdés →</Link>
        </Button>
      </div>
    </article>
  );
}
