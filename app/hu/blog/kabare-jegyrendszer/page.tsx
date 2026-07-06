import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Kabaré jegyrendszer: Amire kis színpadoknak valóban szükségük van",
  description:
    "Nincs büdzsé drága jegyértékesítési platformokra? Elmagyarázzuk, milyen funkciókat kell tartalmaznia egy kabaré jegyrendszernek – és melyek azok, amelyek feleslegesek.",
  alternates: { canonical: "https://seatflow.app/hu/blog/kabare-jegyrendszer" },
  openGraph: {
    title: "Kabaré jegyrendszer: Amire kis színpadoknak valóban szükségük van",
    description: "Őszinte útmutató kabaré-szervezők számára a jegyértékesítés témájában.",
    url: "https://seatflow.app/hu/blog/kabare-jegyrendszer",
    type: "article",
    publishedTime: "2026-04-24",
  },
};

export default function CikkKabare() {
  return (
    <article>
      <Link href="/hu/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Összes cikk
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-04-24">2026. április 24.</time>
          <span>·</span>
          <span>5 perc olvasás</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Kabaré</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Kabaré jegyrendszer: Amire kis színpadoknak valóban szükségük van
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Sok kabaré-szervező elrettent a digitális jegyértékesítés látszólagos bonyolultságától. A belépési korlát azonban sokkal alacsonyabb, mint gondolnánk. Ez a cikk elmagyarázza, melyek azok a funkciók, amelyek valóban számítanak a kis kabaréknak – és melyeket lehet nyugodtan figyelmen kívül hagyni.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>A tipikus kabaré helyzet</h2>
        <p>
          Egy kis kabarének általában 40–120 ülőhelye van, és hetente 2–4 esténként játszik. A foglalások gyakran személyes ajánlás, helyi hirdetés vagy törzsközönség útján érkeznek. A kihívás: a foglalásokat manuálisan kezelik – telefonon, e-mailen vagy füzetben – és a telt házas estékről csak az ajtóban derül ki.
        </p>
        <p>
          A digitális jegyrendszer áttekinthetőséget teremt: melyek a szabad helyek, melyek az eladottak, ki jön el. Emellett automatikusan kezeli a fizetést, így a szervezőknek nem kell a kintlevőségek után futniuk.
        </p>

        <h2>Kötelező funkciók kabaréknak</h2>

        <h3>Számozott ülési rend</h3>
        <p>
          A kabarénál fontos az ülőhelyek elrendezése. A vendégek tudni akarják, hogy elöl vagy hátul ülnek-e, középen vagy oldalt. Ezért elengedhetetlen egy vizuális alaprajz, amelyen minden hely kiválasztható – nem luxus, hanem szükséglet.
        </p>

        <h3>Több árkategória</h3>
        <p>
          Diákkedvezmény, előfoglalási kedvezmény, prémium helyek az első sorban: egy jó rendszer lehetővé teszi a különböző árkategóriákat helyenként vagy zónánként, technikai bonyodalmak nélkül.
        </p>

        <h3>QR-kódos jegyek e-mailben</h3>
        <p>
          A vendégek foglalás után PDF-jegyet várnak e-mailben, ideális esetben QR-kóddal. Ez megkíméli a pénztárat – a belépés okostelefonnal ellenőrizhető.
        </p>

        <h3>Egyszerű foglalási link</h3>
        <p>
          A foglalási oldal legyen megosztható: linkként az e-mail hírlevelben, az Instagramon vagy beágyazva a saját weboldalon. Nincs szükség a vendégek regisztrációjára, alkalmazás letöltésére.
        </p>

        <h2>Amire biztosan nincs szükség</h2>
        <ul>
          <li>CRM-rendszer automatizált marketingfunnel-ekkel</li>
          <li>Mobilalkalmazás a vendégek számára</li>
          <li>Többdevizás fizetésfeldolgozás</li>
          <li>Analytics irányítópult 30+ mutatóval</li>
          <li>Vállalati API harmadik féltől való integrációhoz</li>
        </ul>

        <h2>Mennyibe kerül valójában?</h2>
        <ul>
          <li><strong>Jutalékmodell:</strong> Nincs alapdíj, de jegyenként 8–15% jutalék. 15 eurós jegyárnál és 100 jegynél: 120–225 euró/hó jutalék.</li>
          <li><strong>Fix díjas modell:</strong> 30–60 euró/hó alapdíj az előadások számától függetlenül. Nagy volumenre olcsóbb lehet, szezonális üzemeltetésre drága.</li>
          <li><strong>Jegyenkénti szolgáltatási díj:</strong> 0,75–1,50 euró/jegy, alapdíj nélkül. Átlátható, a használathoz igazodik.</li>
        </ul>

        <h2>Következtetés: Tartsa egyszerűnek</h2>
        <p>
          Kis kabaré esetén az ideális jegyrendszer az, amely megbízhatóan működik, könnyen beállítható, és nem viszi el a jegybevétel nagy részét. A technológia a háttérben marad – nem a munkája középpontjában.
        </p>
        <p>
          Ha kíváncsi, milyen platformok állnak rendelkezésre,{" "}
          <Link href="/hu/blog/jegyrendszer-osszehasonlitas" className="text-primary underline underline-offset-4 hover:text-primary/80">
            a jegyrendszerek összehasonlítása
          </Link>{" "}
          hasznos kiindulópont lehet.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Próbálja ki a SeatFlow-t ingyen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Állítsa be az alaprajzot, hozzon létre egy eseményt, ossza meg a linket. Nincs szükség bankkártyára, bármikor lemondható.
        </p>
        <Button asChild>
          <Link href="/registrieren">Ingyenes kezdés →</Link>
        </Button>
      </div>
    </article>
  );
}
