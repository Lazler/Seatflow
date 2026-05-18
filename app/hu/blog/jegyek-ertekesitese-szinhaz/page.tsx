import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Online jegyértékesítés színházaknak: Teljes útmutató",
  description:
    "Hogyan digitalizálhatják kis és közepes méretű színházak jegyértékesítésüket – az ülőhelyek kezelésétől az automatikus e-mail kézbesítésig. Lépésről lépésre elmagyarázva.",
  alternates: { canonical: "https://seatflow.app/hu/blog/jegyek-ertekesitese-szinhaz" },
  openGraph: {
    title: "Online jegyértékesítés színházaknak: Teljes útmutató",
    description: "Útmutató a jegyértékesítés digitalizálásához színházak és előadóhelyek számára.",
    url: "https://seatflow.app/hu/blog/jegyek-ertekesitese-szinhaz",
    type: "article",
    publishedTime: "2026-04-10",
  },
};

export default function CikkSzinhaz() {
  return (
    <article>
      <Link href="/hu/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Összes cikk
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <time dateTime="2026-04-10">2026. április 10.</time>
          <span>·</span>
          <span>7 perc olvasás</span>
          <span>·</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Színház</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Online jegyértékesítés színházaknak: Teljes útmutató
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Sok kis színház még mindig telefonon, e-mailen vagy a pénztárnál értékesíti a jegyeket. Ez időt és energiát pazarol. Ez az útmutató megmutatja, hogyan álljon át a digitális jegyértékesítésre néhány óra alatt – informatikai tudás és drága ügynökség nélkül.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5">

        <h2>Miért érdemes a digitális jegyértékesítés a színházaknak?</h2>
        <p>
          Egy kis, 120 férőhelyes színház, amely hetente háromszor játszik, évadanként több ezer foglalást kezel. Ha minden foglalás egy telefonhívást vagy e-mailt jelent, az jelentős erőforrásokat köt le – és elveri a spontán foglalni kívánó vendégeket.
        </p>
        <p>
          A modern jegyáruházak megoldják ezt a problémát: a vendégek maguk választják ki a helyüket, online fizetnek, és azonnal megkapják a jegyüket e-mailben. A színháznak megszűnik a kézi foglaláskezelés.
        </p>

        <h2>A három legfontosabb követelmény a színházjegyeknél</h2>

        <h3>1. Számozott ülőhelyek</h3>
        <p>
          A koncertekkel vagy fesztiválokkal ellentétben a színházakban szinte mindig rögzített az ülésrend. A vendégek <em>a saját</em> helyüket akarják kiválasztani – nem csak egy kategóriát foglalni. Egy jó színházi jegyrendszer ezért interaktív alaprajzot mutat, amelyen láthatók a szabad helyek.
        </p>

        <h3>2. Automatikus jegykézbesítés</h3>
        <p>
          A vásárlás után a jegynek azonnal meg kell érkeznie e-mailben PDF formátumban – QR-kóddal a belépéshez. Ez megkíméli a színházat a pénztári munkától, és biztonságérzetet ad a vendégeknek.
        </p>

        <h3>3. Nincs havi alapdíj</h3>
        <p>
          A kis színházak nem egész évben játszanak. Magas alapdíjjal és jutaléktöbblettel rendelkező platform nem éri meg, ha évadanként csak 3-4 produkciót mutatnak be. Jobb: egy modell, amelynek csak jegyenkénti díja van, alapköltségek nélkül.
        </p>

        <h2>Lépésről lépésre: Saját jegybolt felépítése</h2>
        <ol>
          <li><strong>Az alaprajz digitalizálása</strong> — A legtöbb rendszer vizuális szerkesztőt kínál, amelyben sorokat és helyeket helyezhet el. Egy tipikus színházi teremhez ez 30–60 percet vesz igénybe.</li>
          <li><strong>Árkategóriák meghatározása</strong> — Földszint, erkély, páholy, kedvezményes: minden hely hozzárendelhető egy saját árú kategóriához.</li>
          <li><strong>Esemény létrehozása</strong> — Adja meg a címet, dátumot, leírást és esetleg a foglalási határidőt.</li>
          <li><strong>A link megosztása</strong> — A foglalási oldalt linkként kapja, amelyet beágyazhat a weboldalára vagy közvetlenül elküldhet.</li>
        </ol>

        <h2>Gyakori hibák a kezdetkor</h2>
        <ul>
          <li><strong>Túl összetett rendszerek választása:</strong> Egy 100 férőhelyes színháznak nincs szüksége CRM-integrációval rendelkező vállalati megoldásra.</li>
          <li><strong>A jutalék alábecsülése:</strong> Egyes szolgáltatók jegyenkénti jutalékként 10–15%-ot vesznek el. Egy 18 eurós jegynél ez akár 2,70 euró is lehet – több, mint egy havi alapdíj.</li>
          <li><strong>Nincs tesztelés az indítás előtt:</strong> Vásároljon legalább egy tesztjegyet a teljes folyamaton keresztül, mielőtt közzéteszi a foglalási oldalt.</li>
        </ul>

        <h2>Költségek áttekintése</h2>
        <p>
          A tényleges költségek erősen függnek a modelltől. Egy 80 férőhelyes színház, amely havonta 3 előadást ad el telt házzal (240 jegy):
        </p>
        <ul>
          <li><strong>Jutalékmodell (10%)</strong> 18 eurós jegyárnál: kb. 432 euró/hó</li>
          <li><strong>Alapdíj + szolgáltatási díj</strong> (pl. 29 euró/hó + 0,75 euró/jegy): kb. 209 euró/hó</li>
          <li><strong>Csak szolgáltatási díj</strong> (1,50 euró/jegy): kb. 360 euró/hó, havidíj nélkül</li>
        </ul>
        <p>
          A SeatFlow jutalék nélkül működik: Ingyenes csomag 1,50 euró/jegy díjjal, Pro csomag 29 eurótól/hó 0,75 euró/jegy díjjal.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
        <h3 className="font-semibold mb-2">Próbálja ki a SeatFlow-t – ingyen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Rajzolja meg az alaprajzot, hozzon létre egy eseményt, ossza meg a foglalási linket. Nincs szükség bankkártyára vagy lemondásra.
        </p>
        <Button asChild>
          <Link href="/registrieren">Ingyenes kezdés →</Link>
        </Button>
      </div>
    </article>
  );
}
