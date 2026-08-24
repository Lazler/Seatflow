# Seatflow – Production Readiness Tasks

## Phase 1 – Security 🔴
- [x] Server-side Preisvalidierung im Checkout
- [x] RLS Audit aller Supabase-Tabellen
- [x] Rate Limiting auf Checkout + Auth-Endpunkten
- [x] Zod Input-Validierung in API-Routen

## Phase 2 – Legal 🔴
- [x] Impressum-Seite (/impressum)
- [x] Datenschutzerklärung (/datenschutz)
- [x] AGB (/agb)
- [x] Rechnungs-PDF (Rechnung per E-Mail nach Kauf)
- [x] Rechnungsnummer-System (sequential, pro Veranstalter)

## Phase 3 – Missing Flows 🟡
- [x] Erstattungs-UI für Veranstalter (Stripe Refund via Buchungs-Detail)
- [x] Event-Absage: Bulk-Refund + Benachrichtigung aller Käufer
- [x] Buchungsbestätigungs-Seite robuster machen
- [ ] Stornierung durch Käufer (Self-Service) — entfällt wegen §312g BGB
- [ ] Double-Opt-In E-Mail für Käufer

## Phase 4 – Nice to Haves 🟢
- [x] Analytics-Dashboard (Einnahmen-Charts, Conversion, Top-Events, Wochentag/Stunden)
- [x] Ticket-Scanner-App (QR-Code scannen via Kamera, Einlass markieren)
- [ ] Mehrsprachigkeit (DE/EN via next-intl)

---
Abgeschlossen: Alle kritischen Phasen (1-3) + Analytics + Ticket-Scanner
