// Prüft, ob ein Event verkaufsbereit ist. Rein (keine DB) — die Seite lädt die
// nötigen Daten und übergibt sie. Verhindert, dass ein Event mit totem/leerem
// Buchungslink veröffentlicht wird.

export type Anforderung = {
  key: string;
  erfuellt: boolean;
  pflicht: boolean; // true = blockiert Veröffentlichung
  label: string;
  hinweis?: string;
  fixHref?: string;
};

export function pruefeVeroeffentlichung(args: {
  eventId: string;
  hatVenue: boolean;
  hatSaalplan: boolean;
  buchbarePlaetze: number;
  hatBild: boolean;
  // Tarif-Durchsetzung: im Free-Tarif ist die Platzzahl begrenzt
  plan?: "free" | "pro";
  sitzLimit?: number | null;
}): { anforderungen: Anforderung[]; harteBlocker: number } {
  const { eventId, hatVenue, hatSaalplan, buchbarePlaetze, hatBild, plan = "pro", sitzLimit = null } = args;
  const einst = `/dashboard/events/${eventId}/einstellungen`;

  const anforderungen: Anforderung[] = [
    {
      key: "saalplan",
      erfuellt: hatSaalplan,
      pflicht: true,
      label: "Saalplan zugewiesen",
      hinweis: "Ohne Saalplan können Gäste keine Plätze wählen.",
      fixHref: einst,
    },
    {
      key: "plaetze",
      erfuellt: hatSaalplan && buchbarePlaetze > 0,
      pflicht: true,
      label: "Mindestens ein buchbarer Platz",
      hinweis: "Der zugewiesene Saalplan enthält keine Plätze — im Editor Reihen oder Zonen hinzufügen.",
      fixHref: einst,
    },
    {
      key: "venue",
      erfuellt: hatVenue,
      pflicht: false,
      label: "Veranstaltungsort hinterlegt",
      hinweis: "Empfohlen: Adresse erscheint auf der Buchungsseite (Pflichtangabe nach dt. Recht).",
      fixHref: einst,
    },
    {
      key: "bild",
      erfuellt: hatBild,
      pflicht: false,
      label: "Event-Bild hochgeladen",
      hinweis: "Optional, macht die Buchungsseite zur vollwertigen Veranstaltungsseite.",
      fixHref: einst,
    },
  ];

  // Tarif-Grenze (nur Free): harte Sperre, wenn der Saalplan das Platzlimit überschreitet
  if (plan === "free" && sitzLimit !== null && hatSaalplan) {
    anforderungen.push({
      key: "sitzlimit",
      erfuellt: buchbarePlaetze <= sitzLimit,
      pflicht: true,
      label: `Free-Tarif: höchstens ${sitzLimit} Plätze`,
      hinweis: `Dieser Saalplan hat ${buchbarePlaetze} Plätze. Im Free-Tarif sind bis zu ${sitzLimit} möglich — mit Pro unbegrenzt.`,
      fixHref: "/dashboard/abo",
    });
  }

  const harteBlocker = anforderungen.filter((a) => a.pflicht && !a.erfuellt).length;
  return { anforderungen, harteBlocker };
}
