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
- [ ] Stornierung durch Käufer (Self-Service)
- [ ] Erstattungs-UI für Veranstalter (Stripe Refund)
- [ ] Event-Absage: Bulk-Refund + Benachrichtigung aller Käufer
- [ ] Buchungsbestätigungs-Seite robuster machen
- [ ] Double-Opt-In E-Mail für Käufer

## Phase 4 – Nice to Haves 🟢
- [ ] Analytics-Dashboard (Einnahmen-Charts, Conversion)
- [ ] Ticket-Scanner-App (QR-Code scannen, Einlass markieren)
- [ ] Mehrsprachigkeit (DE/EN via next-intl)

---
Current: Phase 1
