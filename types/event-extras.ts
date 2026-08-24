// Frühbucher-Rabatt + Add-on-Produkte (events.fruehbucher / events.addons)

export type Fruehbucher = {
  prozent: number; // 1–90
  bis: string;     // ISO-Datum, bis wann der Rabatt gilt (inklusive)
};

export type EventAddon = {
  id: string;
  name: string;       // z. B. "Garderobe", "Getränkegutschein", "Programmheft"
  preis_cent: number;
  aktiv: boolean;
};

export function fruehbucherAktiv(f: Fruehbucher | null | undefined, jetzt: Date = new Date()): f is Fruehbucher {
  if (!f || !f.prozent || f.prozent <= 0 || !f.bis) return false;
  const bis = new Date(f.bis);
  return !isNaN(bis.getTime()) && jetzt.getTime() <= bis.getTime();
}

export function fruehbucherPreis(basisCent: number, f: Fruehbucher): number {
  const prozent = Math.min(90, Math.max(0, f.prozent));
  return Math.round((basisCent * (100 - prozent)) / 100);
}
