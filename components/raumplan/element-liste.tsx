"use client";

import { Dialog as Modal, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import {
  type SitzplanElement, type Buehne, type Preiskategorie,
  elementSitzIds,
} from "@/types/sitzplan";
import { TextAlignJustify as AlignJustify, Armchair, Record as CircleDot, Users, TextT as Type, MaskHappy as Theater, WarningCircle } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";

const TYP_ICON: Record<SitzplanElement["typ"], React.ElementType> = {
  reihe: AlignJustify,
  tischreihe: Armchair,
  rundtisch: CircleDot,
  stehplatz: Users,
  text: Type,
};

export type ElementListeAuswahl = { typ: "buehne" } | { typ: "element"; id: string };

export function ElementListeModal({
  open, onClose, elemente, buehne, kategorien, ausgewaehlteId, ausserhalbIds, onAuswaehlen,
}: {
  open: boolean;
  onClose: () => void;
  elemente: SitzplanElement[];
  buehne: Buehne;
  kategorien: Preiskategorie[];
  // "buehne" | Element-ID | null — nur bei Einzelauswahl markiert, sonst null
  ausgewaehlteId: string | null;
  // Elemente, die außerhalb der Raumgröße liegen (siehe elementeAusserhalb)
  ausserhalbIds?: Set<string>;
  onAuswaehlen: (ziel: ElementListeAuswahl) => void;
}) {
  const t = useT();
  const kategorienMap = new Map(kategorien.map((k) => [k.id, k]));

  function waehlen(ziel: ElementListeAuswahl) {
    onAuswaehlen(ziel);
    onClose();
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t.editor.elementListe.titel}</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="max-h-[50vh] overflow-y-auto -mx-1 space-y-0.5">
            <button type="button" onClick={() => waehlen({ typ: "buehne" })}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors ${
                ausgewaehlteId === "buehne" ? "bg-accent" : "hover:bg-accent"
              }`}>
              <Theater className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium truncate">{buehne.label || t.editorToolbar.buehnePodium}</span>
            </button>
            {elemente.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">{t.editor.elementListe.leer}</p>
            ) : (
              elemente.map((el) => {
                const Icon = TYP_ICON[el.typ];
                const kat = kategorienMap.get(el.kategorie_id);
                const anzahlSitze = elementSitzIds(el).length;
                return (
                  <button key={el.id} type="button" onClick={() => waehlen({ typ: "element", id: el.id })}
                    title={ausserhalbIds?.has(el.id) ? t.editor.elementListe.ausserhalb : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors ${
                      ausgewaehlteId === el.id ? "bg-accent" : "hover:bg-accent"
                    }`}>
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium truncate">{el.bezeichnung}</span>
                    {ausserhalbIds?.has(el.id) && (
                      <WarningCircle className="h-4 w-4 shrink-0 text-amber-500" aria-label={t.editor.elementListe.ausserhalb} />
                    )}
                    {kat && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: kat.farbe }} />}
                    {anzahlSitze > 0 && <span className="text-xs text-muted-foreground tabular-nums shrink-0">{anzahlSitze}</span>}
                  </button>
                );
              })
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Modal>
  );
}
