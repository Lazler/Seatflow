import {
  Document, Page, View, Text, Image, StyleSheet, Font,
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

export function TicketPDF({ tickets }: { tickets: TicketData[] }) {
  const design = tickets[0]?.design;
  if (!design || tickets.length === 0) return null;

  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#f1f5f9",
      padding: 24,
      fontFamily: "Helvetica",
    },
    ticket: {
      backgroundColor: design.hintergrundFarbe,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 16,
      flexDirection: "row",
      // Shadow via border
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
      fontFamily: "Helvetica",
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
      fontFamily: "Helvetica",
      marginTop: 2,
      textAlign: "center",
    },
    footer: {
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
  });

  return (
    <Document
      title={`Tickets – ${tickets[0].eventTitel}`}
      author="SeatFlow"
      creator="SeatFlow"
    >
      <Page size="A4" style={styles.page}>
        {tickets.map((ticket, ti) => (
          <View key={ti} style={styles.ticket}>
            {/* Left accent stripe */}
            <View style={styles.leftAccent} />

            <View style={styles.body}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{ticket.eventTitel}</Text>
                {ticket.ticketTypName && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{ticket.ticketTypName}</Text>
                  </View>
                )}
              </View>

              {/* Main content */}
              <View style={styles.content}>
                <View style={styles.infoSection}>
                  {/* Date */}
                  <View style={styles.row}>
                    <Text style={styles.label}>Datum & Uhrzeit</Text>
                    <Text style={styles.value}>{formatDatum(ticket.eventDatum)}</Text>
                  </View>

                  {/* Venue */}
                  {design.zeigeVeranstaltungsort && ticket.venue && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Veranstaltungsort</Text>
                      <Text style={styles.value}>{ticket.venue}</Text>
                    </View>
                  )}

                  {/* Guest */}
                  <View style={styles.row}>
                    <Text style={styles.label}>Inhaber</Text>
                    <Text style={styles.valueBold}>{ticket.gaestName}</Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Seats */}
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

                {/* QR Code */}
                {design.zeigeQrCode && (
                  <View style={styles.qrSection}>
                    <Image src={ticket.qrCodeDataUrl} style={styles.qrImage} />
                    <Text style={styles.qrLabel}>Einlass-QR</Text>
                    <Text style={styles.bookingId}>{ticket.buchungId.slice(0, 8).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
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
        ))}
      </Page>
    </Document>
  );
}
