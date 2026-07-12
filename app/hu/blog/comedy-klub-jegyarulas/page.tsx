import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Comedy klub jegybolt beállítása: Egy óra alatt élesben",
  description:
    "Lépésről lépésre: hogyan állítsanak fel comedy klubok saját jegyboltot számozott ülőhelyekkel, online fizetéssel és automatikus QR-kódos jegyekkel – fejlesztő nélkül.",
  alternates: { canonical: "https://seatflow.app/hu/blog/comedy-klub-jegyarulas" },
  openGraph: {
    title: "Comedy klub jegybolt beállítása: Egy óra alatt élesben",
    description: "Lépésről lépésre: saját jegybolt comedy kluboknak fejlesztő nélkül.",
    url: "https://seatflow.app/hu/blog/comedy-klub-jegyarulas",
    type: "article",
    publishedTime: "2026-05-08",
  },
};

export default function CikkComedyKlub() {
  return (
    <article>
      <Link href="/hu/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Összes cikk
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-05-08">2026. május 8.</time>
          <span>·</span>
          <span>6 perc olvasás</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Comedy Klub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Comedy klub jegybolt beállítása: Egy óra alatt élesben
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Akár heti stand-up estről, open mic-ról vagy különleges előadásról van szó: azok a comedy klubok, amelyek még mindig az ajtóban értékesítik a jegyeket, pénzt hagynak az asztalon. Így megy át digitálisra egy óra alatt – számozott ülőhelyekkel és automatikus e-jegy kézbesítéssel.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>Miért profitálnak a comedy klubok az online jegyértékesítésből?</h2>
        <p>
          A comedy klub közönsége fiatal, mobil és hozzászokott az online foglaláshoz. Ha az előadása nem foglalható okostelefonon keresztül, elveszíti a spontán látogatókat – különösen a közösségi médiából. Ráadásul az előzetes foglalások megbízható kapacitástervezést tesznek lehetővé: napokkal korábban tudja, hány ember jön.
        </p>
        <p>
          A számozott ülőhelyek extra előnyt adnak: a vendégek megválaszthatják, hova üljenek – első sor az intenzívebb élményért, hátsó sor a nyugodtabb helyért. Ez növeli a jegy észlelt értékét.
        </p>

        <h2>A beállítás 4 lépésben</h2>

        <div className="not-prose space-y-4 my-6">
          {[
            { num: "1", cim: "Fiók létrehozása", ido: "2 perc", leiras: "Név, e-mail, jelszó – nincs szükség bankkártyára. Az ingyenes csomag elegendő a teszteléshez." },
            { num: "2", cim: "Helyszín és alaprajz létrehozása", ido: "20–30 perc", leiras: "Rajzolja meg az ülési elrendezést a vizuális szerkesztővel: húzzon sorokat, adjon hozzá asztalokat, állítsa be a távolságokat. Nem szükséges technikai tudás." },
            { num: "3", cim: "Esemény létrehozása", ido: "5 perc", leiras: "Cím, dátum, leírás, árkategóriák – mindezt egy űrlapon. Ismétlődő előadásokat is létrehozhat." },
            { num: "4", cim: "A foglalási link megosztása", ido: "1 perc", leiras: "A foglalási oldal azonnal elérhető linkként – ossza meg az Instagramon, a hírlevelében, vagy ágyazza be a weboldalába." },
          ].map((step) => (
            <div key={step.num} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">{step.num}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{step.cim}</p>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{step.ido}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.leiras}</p>
              </div>
            </div>
          ))}
        </div>

        <h2>Ellenőrzőlista: a foglalási oldal közzététele előtt</h2>
        <ul>
          <li>Végezzen el legalább egy tesztfoglalást saját maga – beleértve a fizetést is</li>
          <li>Ellenőrizze, hogy a QR-kódos jegy megérkezik a beérkező levelek mappájába (és nem a spambe)</li>
          <li>Tesztelje a foglalási oldalt okostelefonon</li>
          <li>Állítson be Stripe-fiókot a kifizetésekhez (10 perc)</li>
          <li>Készítsen rövid leírást az esemény oldalához</li>
        </ul>

        <h2>Árazás: mi éri meg?</h2>
        <p>
          Comedy klubok esetén a megtérülési pont általában havi 40–60 jegy körül van: ettől a volumentől a Pro csomag (alacsonyabb jegyenkénti díjjal) gazdaságosabb, mint az ingyenes csomag. Heti előadásoknál 50–80 vendéggel a számítás egyértelmű.
        </p>
        <p>
          Ha döntés előtt szeretné összehasonlítani a különböző jegyrendszereket,{" "}
          <Link href="/hu/blog/jegyrendszer-osszehasonlitas" className="text-primary underline underline-offset-4 hover:text-primary/80">
            összehasonlító cikkünk
          </Link>{" "}
          bemutatja a leggyakoribb megoldások közötti különbségeket.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Próbálja ki ingyen – az előadása egy óra alatt élesben</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Nincs bankkártya, fejlesztő vagy megkötöttség. Az ingyenes csomag havi 3 eseményt fed le.
        </p>
        <Button asChild>
          <Link href="/register">Ingyenes kezdés →</Link>
        </Button>
      </div>
    </article>
  );
}
