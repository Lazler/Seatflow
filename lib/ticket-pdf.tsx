import {
  Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";
import type { TicketDesign } from "@/types/ticket-design";

type TicketData = {
  eventTitel: string;
  eventDatum: Date;
  venue?: string;
  sitzplaetze: { sitzId: string; bezeichnung: string; preisCent: number }[];
  buchungId: string;
  gaestName: string;
  ticketTypName?: string;
  qrCodeDataUrl: string;
  design: TicketDesign;
};

function euro(cent: number) {
  return (cent / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDatum(d: Date) {
  return d.toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Inline markdown parser for PDF Text ───────────────────────────────────
   Supports: **bold**, *italic*, plain text.
   Returns an array of <Text> nodes with appropriate font families.          */
function parseInline(text: string, baseColor: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <Text key={i} style={{ fontFamily: "Helvetica-Bold", color: baseColor }}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <Text key={i} style={{ fontFamily: "Helvetica-Oblique", color: baseColor }}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={i} style={{ color: baseColor }}>{part}</Text>;
  });
}

/* ─── Block markdown renderer for PDF ──────────────────────────────────────
   Supports: # H1, ## H2, - bullet, * bullet, blank lines, paragraphs.     */
function MarkdownBlock({ markdown, textFarbe }: { markdown: string; textFarbe: string }) {
  const lines = markdown.split("\n");
  const muted = "#64748b";

  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trimEnd();

        if (trimmed.startsWith("# ")) {
          return (
            <Text key={i} style={{ fontFamily: "Helvetica-Bold", fontSize: 11, color: textFarbe, marginBottom: 4, marginTop: 6 }}>
              {trimmed.slice(2)}
            </Text>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <Text key={i} style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: textFarbe, marginBottom: 3, marginTop: 5 }}>
              {trimmed.slice(3)}
            </Text>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <View key={i} style={{ flexDirection: "row", marginBottom: 2, paddingLeft: 4 }}>
              <Text style={{ fontSize: 8, color: muted, marginRight: 5, marginTop: 1 }}>•</Text>
              <Text style={{ fontSize: 8, color: muted, flex: 1 }}>
                {parseInline(trimmed.slice(2), muted)}
              </Text>
            </View>
          );
        }
        if (trimmed === "") {
          return <View key={i} style={{ height: 5 }} />;
        }
        return (
          <Text key={i} style={{ fontSize: 8, color: muted, marginBottom: 2, lineHeight: 1.5 }}>
            {parseInline(trimmed, muted)}
          </Text>
        );
      })}
    </View>
  );
}

export function TicketPDF({ tickets }: { tickets: TicketData[] }) {
  const design = tickets[0]?.design;
  if (!design || tickets.length === 0) return null;

  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#f1f5f9",
      padding: 24,
      fontFamily: "Helvetica",
    },
    ticketWrapper: {
      marginBottom: 20,
    },
    ticket: {
      backgroundColor: design.hintergrundFarbe,
      borderRadius: 10,
      overflow: "hidden",
      flexDirection: "row",
      border: "1pt solid #e2e8f0",
    },
    leftAccent: {
      width: 8,
      backgroundColor: design.akzentFarbe,
    },
    body: {
      flex: 1,
      padding: 0,
    },
    header: {
      backgroundColor: design.headerFarbe,
      padding: "14pt 20pt",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      color: "#ffffff",
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      maxWidth: 280,
    },
    headerBadge: {
      backgroundColor: design.akzentFarbe,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    headerBadgeText: {
      color: "#ffffff",
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
    },
    content: {
      flexDirection: "row",
      padding: "14pt 20pt",
      gap: 16,
    },
    infoSection: {
      flex: 1,
    },
    row: {
      marginBottom: 8,
    },
    label: {
      fontSize: 8,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
      fontFamily: "Helvetica-Bold",
    },
    value: {
      fontSize: 11,
      color: design.textFarbe,
    },
    valueBold: {
      fontSize: 11,
      color: design.textFarbe,
      fontFamily: "Helvetica-Bold",
    },
    divider: {
      borderTop: "1pt dashed #e2e8f0",
      marginVertical: 10,
    },
    seatRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    seatId: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: design.akzentFarbe,
      letterSpacing: 0.5,
    },
    seatLabel: {
      fontSize: 10,
      color: "#64748b",
    },
    seatPrice: {
      fontSize: 10,
      color: "#64748b",
    },
    qrSection: {
      width: 96,
      alignItems: "center",
      justifyContent: "center",
      borderLeft: "1pt dashed #e2e8f0",
      paddingLeft: 14,
    },
    qrImage: {
      width: 80,
      height: 80,
    },
    qrLabel: {
      fontSize: 7,
      color: "#94a3b8",
      marginTop: 4,
      textAlign: "center",
    },
    bookingId: {
      fontSize: 6,
      color: "#cbd5e1",
      marginTop: 2,
      textAlign: "center",
    },
    ticketFooter: {
      backgroundColor: "#f8fafc",
      borderTop: "1pt solid #e2e8f0",
      padding: "8pt 20pt",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: 8,
      color: "#94a3b8",
    },
    logoImage: {
      height: 20,
      maxWidth: 80,
      objectFit: "contain",
    },
    // Fine print below ticket
    kleingedrucktesWrapper: {
      marginTop: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 4,
      borderLeft: "2pt solid #e2e8f0",
    },
    kleingedrucktesHeader: {
      fontSize: 7,
      color: "#94a3b8",
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
  });

  return (
    <Document
      title={`Tickets – ${tickets[0].eventTitel}`}
      author="SeatFlow"
      creator="SeatFlow"
    >
      <Page size="A4" style={styles.page}>
        {tickets.map((ticket, ti) => (
          <View key={ti} style={styles.ticketWrapper}>
            {/* Ticket card */}
            <View style={styles.ticket}>
              <View style={styles.leftAccent} />
              <View style={styles.body}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>{ticket.eventTitel}</Text>
                  {ticket.ticketTypName && (
                    <View style={styles.headerBadge}>
                      <Text style={styles.headerBadgeText}>{ticket.ticketTypName}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.content}>
                  <View style={styles.infoSection}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Datum & Uhrzeit</Text>
                      <Text style={styles.value}>{formatDatum(ticket.eventDatum)}</Text>
                    </View>
                    {design.zeigeVeranstaltungsort && ticket.venue && (
                      <View style={styles.row}>
                        <Text style={styles.label}>Veranstaltungsort</Text>
                        <Text style={styles.value}>{ticket.venue}</Text>
                      </View>
                    )}
                    <View style={styles.row}>
                      <Text style={styles.label}>Inhaber</Text>
                      <Text style={styles.valueBold}>{ticket.gaestName}</Text>
                    </View>
                    <View style={styles.divider} />
                    {ticket.sitzplaetze.map((s, si) => (
                      <View key={si} style={styles.seatRow}>
                        <View>
                          <Text style={styles.seatId}>{s.sitzId}</Text>
                          {design.zeigeKategorie && (
                            <Text style={styles.seatLabel}>{s.bezeichnung}</Text>
                          )}
                        </View>
                        <Text style={styles.seatPrice}>{euro(s.preisCent)}</Text>
                      </View>
                    ))}
                  </View>

                  {design.zeigeQrCode && (
                    <View style={styles.qrSection}>
                      <Image src={ticket.qrCodeDataUrl} style={styles.qrImage} />
                      <Text style={styles.qrLabel}>Einlass-QR</Text>
                      <Text style={styles.bookingId}>{ticket.buchungId.slice(0, 8).toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.ticketFooter}>
                  {design.logoUrl ? (
                    <Image src={design.logoUrl} style={styles.logoImage} />
                  ) : (
                    <Text style={styles.footerText}>SeatFlow</Text>
                  )}
                  <Text style={styles.footerText}>
                    {design.fusszeile || `Buchung #${ticket.buchungId.slice(0, 8).toUpperCase()}`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Fine print / Kleingedrucktes — rendered as formatted markdown below ticket */}
            {design.kleingedrucktes?.trim() && (
              <View style={styles.kleingedrucktesWrapper}>
                <Text style={styles.kleingedrucktesHeader}>Hinweise & Bedingungen</Text>
                <MarkdownBlock markdown={design.kleingedrucktes} textFarbe={design.textFarbe} />
              </View>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}
