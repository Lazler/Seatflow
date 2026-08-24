# Supabase Auth E-Mail-Templates

Gebrandete E-Mail-Templates für SeatFlow (Amber/Gold, dunkler Header, tabellenbasiertes Layout für alle E-Mail-Clients).

## Templates

| Datei | Verwendung | Supabase-Name |
|---|---|---|
| `confirm-signup.html` | Registrierungsbestätigung | "Confirm signup" |
| `reset-password.html` | Passwort zurücksetzen | "Reset Password" |
| `email-change.html` | E-Mail-Adresse ändern | "Change Email Address" |

## Anwenden (Dashboard)

1. Öffne: **https://supabase.com/dashboard/project/suxfjbmranbmqlqbooxy/auth/templates**
2. Wähle den gewünschten Template-Typ (z. B. "Confirm signup")
3. Kopiere den Inhalt der entsprechenden `.html`-Datei
4. Füge ihn in das "Body"-Feld ein
5. Passe ggf. die **Subject Line** an (siehe unten)
6. Klicke **Save**

## Empfohlene Betreffzeilen

| Template | Subject |
|---|---|
| Confirm signup | `SeatFlow – E-Mail-Adresse bestätigen` |
| Reset Password | `SeatFlow – Passwort zurücksetzen` |
| Change Email | `SeatFlow – Neue E-Mail-Adresse bestätigen` |

## Hinweise

- `{{ .ConfirmationURL }}` wird von Supabase automatisch durch den echten Link ersetzt
- `{{ .Email }}` enthält die E-Mail-Adresse des Nutzers (nicht im Template verwendet, aber verfügbar)
- Das Logo-Icon (`icon-ticket.png`) muss unter `https://seatflow.app/icon-ticket.png`
  erreichbar sein — alternativ einfach die `<img>`-Zeilen entfernen, das SVG fehlt dann aber
- Farbe `#c2670b` = SeatFlow-Amber (entspricht dem CSS-Token `--primary`)
