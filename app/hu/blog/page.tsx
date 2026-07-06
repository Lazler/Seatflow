import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "SeatFlow Blog – Tippek rendezvényszervezőknek",
  description:
    "Gyakorlati tanácsok jegyértékesítésről, ülőhelyek kezeléséről és rendezvényszervezésről színházaknak, kabarénak és komédiakluboknak.",
  alternates: { canonical: "https://seatflow.app/hu/blog" },
};

const CIKKEK = [
  {
    slug: "jegyek-ertekesitese-szinhaz",
    cim: "Online jegyértékesítés színházaknak: Teljes útmutató",
    bevezeto:
      "Hogyan digitalizálhatják kis és közepes méretű színházak jegyértékesítésüket – az ülőhelyek kezelésétől az automatikus e-mail kézbesítésig. Lépésről lépésre elmagyarázva.",
    datum: "2026-04-10",
    olvasasiIdo: "7 perc",
  },
  {
    slug: "kabare-jegyrendszer",
    cim: "Kabaré jegyrendszer: Amire kis színpadoknak valóban szükségük van",
    bevezeto:
      "Nincs büdzsé drága jegyértékesítési platformokra? Elmagyarázzuk, milyen funkciókat kell tartalmaznia egy kabaré jegyrendszernek – és melyek azok, amelyek feleslegesek.",
    datum: "2026-04-24",
    olvasasiIdo: "5 perc",
  },
  {
    slug: "comedy-klub-jegyarulas",
    cim: "Comedy klub jegybolt beállítása: Egy óra alatt élesben",
    bevezeto:
      "Lépésről lépésre: hogyan állítsanak fel comedy klubok saját jegyboltot számozott ülőhelyekkel – fejlesztő és havidíj nélkül.",
    datum: "2026-05-08",
    olvasasiIdo: "6 perc",
  },
  {
    slug: "jegyrendszer-osszehasonlitas",
    cim: "Jegyrendszerek összehasonlítása: Mi való kis kulturális helyszíneknek?",
    bevezeto:
      "Eventbrite, TicketTailor, pretix vagy saját fejlesztés? Összehasonlítjuk a leggyakoribb megoldásokat színházak, kabarék és comedy klubok számára.",
    datum: "2026-05-15",
    olvasasiIdo: "8 perc",
  },
];

export default function HuBlogIndex() {
  return (
    <div>
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Tippek rendezvényszervezőknek</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Gyakorlati ismeretek jegyértékesítésről, ülőhelyek kezeléséről és rendezvényszervezésről színházaknak, kabaréknak és comedy kluboknak.
        </p>
      </div>

      <div className="space-y-8">
        {CIKKEK.map((a) => (
          <Link
            key={a.slug}
            href={`/hu/blog/${a.slug}`}
            className="group block border border-border rounded-xl p-6 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <time dateTime={a.datum}>
                {new Date(a.datum).toLocaleDateString("hu-HU", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <span>·</span>
              <span>{a.olvasasiIdo} olvasás</span>
            </div>
            <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{a.cim}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{a.bevezeto}</p>
            <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
              Tovább olvasom <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
