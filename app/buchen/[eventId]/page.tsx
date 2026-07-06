import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, Globe } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import BuchungsSeiteClient from "@/components/buchung/buchungs-seite-client";
import { migrierteKonfiguration } from "@/types/sitzplan";
import { belegteSitzIdsLaden } from "@/lib/belegte-sitze";
import { fruehbucherAktiv, type Fruehbucher, type EventAddon } from "@/types/event-extras";
import { BUCHUNG_STRINGS, fmt } from "@/lib/i18n/buchung";
import type { TicketTyp } from "@/types/ticket-typ";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";

type EtageRaw = { id: string; name: string; sitzplan_id: string };

function isLocale(v: string): v is Locale {
  return ["de", "en", "hu"].includes(v);
}

export default async function BuchungsSeite({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ eventId }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, titel, beschreibung, datum, service_gebuehr_cent, status, sitzplan_id, etagen, ticket_typen, cancel_url, sprachen, translations, venues(name, adresse)"
    )
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) notFound();

  const eventSprachen = (event.sprachen as string[] | null) ?? ["de"];
  const eventTranslations = (event.translations as Record<string, { titel: string; beschreibung: string }> | null) ?? {};

  // Determine display language
  const requestedLang = sp.lang && isLocale(sp.lang) ? sp.lang : null;
  const displayLang: Locale =
    requestedLang && eventSprachen.includes(requestedLang)
      ? requestedLang
      : (eventSprachen[0] as Locale) ?? "de";

  // Resolve localized content
  const localizedTitel =
    displayLang === "de"
      ? event.titel
      : (eventTranslations[displayLang]?.titel || event.titel);
  const localizedBeschreibung =
    displayLang === "de"
      ? event.beschreibung
      : (eventTranslations[displayLang]?.beschreibung || event.beschreibung);

  const cancelUrl = event.cancel_url ?? null;
  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string; adresse?: string })
    : null;

  const etagen = (event.etagen as EtageRaw[] | null)?.filter((e) => e.sitzplan_id) ?? null;
  const sitzplanIds: string[] = etagen
    ? etagen.map((e) => e.sitzplan_id)
    : event.sitzplan_id
      ? [event.sitzplan_id]
      : [];

  // Frühbucher + Add-ons separat und fehler-tolerant laden — die Spalten
  // existieren erst nach der Migration 20260705120000_fruehbucher_addons
  const extrasPromise = supabase
    .from("events")
    .select("fruehbucher, addons, verkauf_ab, verkauf_bis, max_pro_buchung")
    .eq("id", eventId)
    .maybeSingle()
    .then((r) => (r.error ? null : r.data));

  const [sitzplaeneResults, belegteSitzIds, extras] = await Promise.all([
    Promise.all(
      sitzplanIds.map((id) =>
        supabase.from("sitzplaene").select("id, konfiguration").eq("id", id).single()
      )
    ),
    // Bezahlte Tickets + frische Checkout-Holds; abgelaufene Holds geben frei
    belegteSitzIdsLaden(eventId),
    extrasPromise,
  ]);

  const fruehbucher = (extras?.fruehbucher as Fruehbucher | null) ?? null;
  const addons = ((extras?.addons as EventAddon[] | null) ?? []).filter((a) => a.aktiv && a.name.trim());

  // Verkaufsfenster + Buchungslimit
  // Server Component: läuft einmal pro Request, Date.now() ist hier korrekt
  // eslint-disable-next-line react-hooks/purity
  const jetzt = Date.now();
  const verkaufAb = extras?.verkauf_ab ? new Date(extras.verkauf_ab as string) : null;
  const verkaufBis = extras?.verkauf_bis ? new Date(extras.verkauf_bis as string) : null;
  const verkaufNochNicht = !!verkaufAb && jetzt < verkaufAb.getTime();
  const verkaufVorbei = !!verkaufBis && jetzt > verkaufBis.getTime();
  const maxProBuchung = (extras?.max_pro_buchung as number | null) ?? 8;
  const strings = BUCHUNG_STRINGS[displayLang];
  const datumsLocale = displayLang === "de" ? "de-DE" : displayLang === "hu" ? "hu-HU" : "en-GB";

  const floors = sitzplanIds
    .map((id, i) => {
      const plan = sitzplaeneResults[i]?.data;
      if (!plan) return null;
      const etageName = etagen ? etagen[i]?.name : null;
      return {
        id: etagen ? etagen[i].id : id,
        name: etageName ?? null,
        translations: (etagen?.[i] as { translations?: Record<string, { name: string }> } | undefined)?.translations ?? null,
        sitzplanId: id,
        konfiguration: migrierteKonfiguration(plan.konfiguration),
      };
    })
    .filter(Boolean) as {
      id: string;
      name: string | null;
      sitzplanId: string;
      konfiguration: ReturnType<typeof migrierteKonfiguration>;
    }[];

  const hasMultipleLangs = eventSprachen.length > 1;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Nav */}
      <nav className="border-b border-border bg-background sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {cancelUrl ? (
            <a
              href={cancelUrl}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
          ) : (
            <Link
              href={`/buchen/${eventId}`}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-[10px]">SF</span>
            </div>
            <span className="font-semibold text-sm truncate">{localizedTitel}</span>
          </div>

          {/* Language switcher */}
          {hasMultipleLangs && (
            <div className="flex items-center gap-1 shrink-0">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              {eventSprachen.map((lang) => {
                const kuerzel = lang.toUpperCase();
                const isActive = lang === displayLang;
                return (
                  <Link
                    key={lang}
                    href={`/buchen/${eventId}?lang=${lang}`}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="font-semibold tabular-nums mr-1">{kuerzel}</span>{LOCALE_LABELS[lang as Locale]}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Event-Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1.5">{localizedTitel}</h1>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              {new Date(event.datum).toLocaleDateString(
                displayLang === "de" ? "de-DE" : displayLang === "hu" ? "hu-HU" : "en-GB",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
            {venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{venue.name}{venue.adresse ? `, ${venue.adresse}` : ""}</span>
              </span>
            )}
          </div>
          {localizedBeschreibung && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{localizedBeschreibung}</p>
          )}
        </div>

        {/* Sitzplan + Checkout */}
        {verkaufNochNicht || verkaufVorbei ? (
          <div className="rounded-xl border border-border bg-background p-12 text-center space-y-2">
            <p className="text-base font-semibold">
              {verkaufNochNicht
                ? fmt(strings.verkaufAb, {
                    datum: verkaufAb!.toLocaleDateString(datumsLocale, {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    }),
                  })
                : strings.verkaufBeendet}
            </p>
            <p className="text-sm text-muted-foreground">{venue?.name}</p>
          </div>
        ) : floors.length > 0 ? (
          <BuchungsSeiteClient
            eventId={event.id}
            eventTitel={localizedTitel}
            eventDatum={event.datum}
            venueName={venue?.name}
            floors={floors}
            belegteSitzIds={belegteSitzIds}
            serviceGebuehrCent={event.service_gebuehr_cent ?? 50}
            ticketTypen={((event.ticket_typen as TicketTyp[] | null) ?? []).filter((t) => t.aktiv)}
            displayLang={displayLang}
            fruehbucher={fruehbucherAktiv(fruehbucher) ? fruehbucher : null}
            addons={addons}
            maxProBuchung={maxProBuchung}
          />
        ) : (
          <div className="rounded-xl border border-border bg-background p-12 text-center text-muted-foreground text-sm">
            {displayLang === "en"
              ? "No seating plan has been assigned to this event yet."
              : displayLang === "hu"
              ? "Ehhez a rendezvényhez még nincs hozzárendelve ülésrend."
              : "Für dieses Event wurde noch kein Sitzplan zugewiesen."}
          </div>
        )}
      </div>

      {/* Rechts-Footer: Anbieterkennzeichnung + Pflicht-Links */}
      <footer className="border-t border-border bg-background mt-10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="text-center sm:text-left space-y-0.5">
            {venue?.name && (
              <p>
                {strings.veranstaltetVon} <span className="font-medium text-foreground">{venue.name}</span>
                {venue.adresse ? `, ${venue.adresse}` : ""}
              </p>
            )}
            <p>{strings.ticketshopVon}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/impressum" className="hover:text-foreground transition-colors">{strings.impressum}</Link>
            <Link href="/datenschutz" className="hover:text-foreground transition-colors">{strings.datenschutz}</Link>
            <Link href="/agb" className="hover:text-foreground transition-colors">{strings.agbFooter}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
