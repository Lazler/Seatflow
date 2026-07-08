export type TicketDesign = {
  headerFarbe: string;
  akzentFarbe: string;
  hintergrundFarbe: string;
  textFarbe: string;
  // Header-Stil: "farbig" = vollflächiger Farb-Header (Standard),
  // "hell" = weißer Header mit dunklem Titel + Akzentlinie (druckoptimiert,
  // spart Toner). Undefined = "farbig" (Abwärtskompatibilität).
  headerStil?: "farbig" | "hell";
  logoUrl?: string;
  fusszeile?: string;
  kleingedrucktes?: string;
  zeigeVeranstaltungsort: boolean;
  zeigeKategorie: boolean;
  zeigeQrCode: boolean;
};

export const DEFAULT_TICKET_DESIGN: TicketDesign = {
  headerFarbe: "#0f172a",
  akzentFarbe: "#6366f1",
  hintergrundFarbe: "#ffffff",
  textFarbe: "#1e293b",
  zeigeVeranstaltungsort: true,
  zeigeKategorie: true,
  zeigeQrCode: true,
};
