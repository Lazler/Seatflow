export type PflichtFeldTyp = "text" | "zahl" | "email" | "auswahl";

export type PflichtFeld = {
  id: string;
  label: string;
  typ: PflichtFeldTyp;
  optionen?: string[];
  pflicht: boolean;
};

export type PreisRegel =
  | { typ: "basis" }
  | { typ: "fest"; cent: number }
  | { typ: "prozent"; prozent: number }
  | { typ: "rabatt_cent"; cent: number };

export type TicketTyp = {
  id: string;
  name: string;
  beschreibung?: string;
  preis_regel: PreisRegel;
  pflichtfelder: PflichtFeld[];
  max_pro_buchung?: number;
  aktiv: boolean;
};

export type GewaehlterTicketTyp = {
  id: string;
  name: string;
  extra_felder: Record<string, string>;
};

export function preisNachRegel(basisCent: number, regel: PreisRegel): number {
  switch (regel.typ) {
    case "basis": return basisCent;
    case "fest": return regel.cent;
    case "prozent": return Math.round(basisCent * regel.prozent / 100);
    case "rabatt_cent": return Math.max(0, basisCent - regel.cent);
  }
}

export function regelLabel(regel: PreisRegel): string {
  switch (regel.typ) {
    case "basis": return "Normaler Preis";
    case "fest": return `Festpreis ${(regel.cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`;
    case "prozent": return `${regel.prozent} % des Sitzpreises`;
    case "rabatt_cent": return `${(regel.cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} Rabatt`;
  }
}
