import { elementSitzIds, type SitzplanKonfiguration } from "@/types/sitzplan";
import { MapPin } from "@phosphor-icons/react/dist/ssr";

const MAX_DOTS = 91; // 7 Reihen × 13 Punkte — Dichte wie im Design-System-Mockup
const DOTS_PRO_REIHE = 13;
const ZELLE = 16;

// Miniaturansicht eines Raumplans für die Venue-Karte: echte Kategorie-Farben
// und echte Platzanzahl (gedeckelt), als kompaktes Punktraster auf dunklem Grund.
export function VenueThumbnail({ konfiguration }: { konfiguration: SitzplanKonfiguration | null }) {
  if (!konfiguration || konfiguration.elemente.length === 0) {
    return (
      <div className="h-40 bg-ink flex items-center justify-center">
        <MapPin className="h-7 w-7 text-white/25" />
      </div>
    );
  }

  const farben: string[] = [];
  for (const el of konfiguration.elemente) {
    if (farben.length >= MAX_DOTS) break;
    const kat = konfiguration.kategorien.find((k) => k.id === el.kategorie_id);
    const farbe = kat?.farbe ?? "#3a3c40";
    const anzahl = elementSitzIds(el).length;
    for (let i = 0; i < anzahl && farben.length < MAX_DOTS; i++) farben.push(farbe);
  }

  if (farben.length === 0) {
    return (
      <div className="h-40 bg-ink flex items-center justify-center">
        <MapPin className="h-7 w-7 text-white/25" />
      </div>
    );
  }

  const reihen = Math.ceil(farben.length / DOTS_PRO_REIHE);
  const breite = DOTS_PRO_REIHE * ZELLE;
  const hoehe = reihen * ZELLE;

  return (
    <div className="h-40 bg-ink overflow-hidden flex items-center justify-center">
      <svg viewBox={`0 0 ${breite} ${hoehe}`} width="88%" style={{ maxHeight: "80%" }}>
        {farben.map((farbe, i) => {
          const r = Math.floor(i / DOTS_PRO_REIHE);
          const c = i % DOTS_PRO_REIHE;
          return (
            <circle key={i} cx={c * ZELLE + ZELLE / 2} cy={r * ZELLE + ZELLE / 2} r={6}
              fill={farbe} stroke="rgba(250,250,250,0.18)" strokeWidth={0.5} />
          );
        })}
      </svg>
    </div>
  );
}
