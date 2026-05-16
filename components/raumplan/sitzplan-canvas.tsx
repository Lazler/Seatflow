"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Circle, Text, Group, Line, Transformer } from "react-konva";
import type Konva from "konva";
import {
  type SitzplanElement,
  type ReiheElement,
  type TischreiheElement,
  type RundtischElement,
  type SitzplanKonfiguration,
  type Preiskategorie,
  type Buehne,
  SITZ_RADIUS,
  TISCH_HOEHE,
  TISCH_SITZ_ABSTAND,
  TISCH_SEAT_GAP,
  FARBE_BELEGT,
  FARBE_AUSGEWAEHLT,
  FARBE_ELEMENT_SELEKTIERT,
  tischreiheBreite,
} from "@/types/sitzplan";

export type Auswahl = { typ: "buehne" } | { typ: "element"; ids: string[] } | null;

function sitzFarbe({ sitzId, kategoriefarbe, belegt, buchungAusgewaehlt, editorAusgewaehlt }: {
  sitzId: string; kategoriefarbe: string; belegt: boolean; buchungAusgewaehlt: boolean; editorAusgewaehlt: boolean;
}): { fill: string; opacity: number } {
  void sitzId;
  if (belegt)             return { fill: FARBE_BELEGT, opacity: 0.4 };
  if (buchungAusgewaehlt) return { fill: FARBE_AUSGEWAEHLT, opacity: 1 };
  if (editorAusgewaehlt)  return { fill: FARBE_ELEMENT_SELEKTIERT, opacity: 1 };
  return { fill: kategoriefarbe, opacity: 1 };
}

const DRAG_MARGIN = 40;

type ElementProps<T> = {
  el: T; kategoriefarbe: string; editorAusgewaehlt: boolean;
  belegte: Set<string>; buchungAusgewaehlt: Set<string>;
  istBuchungsmodus: boolean; raumbreite: number; raumhoehe: number;
  onKlick: () => void; onDragEnd: (x: number, y: number) => void;
  onSitzKlick?: (sitzId: string) => void;
};

function ReiheKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<ReiheElement>) {
  const breite = (el.anzahlSitze - 1) * el.sitzAbstand;
  const LH = SITZ_RADIUS * 2; // label height
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel} offsetX={breite / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, pos.x)), y: Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Reihen-Bezeichnung links — immer lesbar */}
      <Text x={-21} y={0} offsetX={15} offsetY={SITZ_RADIUS} rotation={-el.winkel}
        width={30} height={LH} text={el.bezeichnung}
        fill="#64748b" fontSize={12} fontStyle="bold" verticalAlign="middle" align="right" listening={false} />
      {Array.from({ length: el.anzahlSitze }, (_, i) => {
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        const belegt = belegte.has(sitzId);
        const ausgewaehlt = buchungAusgewaehlt.has(sitzId);
        const { fill, opacity } = sitzFarbe({ sitzId, kategoriefarbe, belegt, buchungAusgewaehlt: ausgewaehlt, editorAusgewaehlt });
        return (
          <Group key={sitzId} x={i * el.sitzAbstand} y={0}
            onClick={istBuchungsmodus && !belegt ? () => onSitzKlick?.(sitzId) : undefined}
            onTap={istBuchungsmodus && !belegt ? () => onSitzKlick?.(sitzId) : undefined}
            onMouseEnter={(e) => { if (istBuchungsmodus && !belegt) e.target.getStage()!.container().style.cursor = "pointer"; }}
            onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
          >
            <Circle radius={SITZ_RADIUS} fill={fill} opacity={opacity} />
            {/* Sitznummer — immer aufrecht */}
            <Text x={0} y={0} offsetX={SITZ_RADIUS} offsetY={SITZ_RADIUS} rotation={-el.winkel}
              width={SITZ_RADIUS * 2} height={SITZ_RADIUS * 2}
              text={String(i + 1)} fill="white" fontSize={9}
              align="center" verticalAlign="middle" listening={false} />
          </Group>
        );
      })}
      {/* Reihen-Bezeichnung rechts — immer lesbar */}
      <Text x={breite + SITZ_RADIUS + 21} y={0} offsetX={15} offsetY={SITZ_RADIUS} rotation={-el.winkel}
        width={30} height={LH} text={el.bezeichnung}
        fill="#64748b" fontSize={12} fontStyle="bold" verticalAlign="middle" listening={false} />
      {editorAusgewaehlt && <Rect x={-SITZ_RADIUS - 8} y={-SITZ_RADIUS - 6} width={breite + SITZ_RADIUS * 2 + 16} height={SITZ_RADIUS * 2 + 12} stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={2} fill="transparent" cornerRadius={8} dash={[6, 3]} listening={false} />}
    </Group>
  );
}

function TischreiheKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<TischreiheElement>) {
  const tischBreite = el.sitzeProTisch * TISCH_SITZ_ABSTAND;
  const gesamtBreite = tischreiheBreite(el);
  const sitzY = TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS;
  const tischFarbe = kategoriefarbe + "55";
  // Bezeichnung-Label: erscheint links, zentriert auf y=0, immer lesbar
  const LW = 36; const LH = 16;
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel} offsetX={gesamtBreite / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, pos.x)), y: Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Element-Bezeichnung links — immer aufrecht */}
      <Text x={-40 + LW / 2} y={0} offsetX={LW / 2} offsetY={LH / 2} rotation={-el.winkel}
        width={LW} height={LH} text={el.bezeichnung}
        fill="#64748b" fontSize={11} fontStyle="bold" align="right" verticalAlign="middle" listening={false} />
      {Array.from({ length: el.anzahlTische }, (_, ti) => {
        const tischX = ti * (tischBreite + el.tischAbstand);
        return (
          <Group key={ti} x={tischX}>
            <Rect x={0} y={-TISCH_HOEHE / 2} width={tischBreite} height={TISCH_HOEHE} fill={tischFarbe} cornerRadius={4}
              stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe} strokeWidth={1.5} />
            {/* Tischnummer — immer aufrecht */}
            <Text x={tischBreite / 2} y={0} offsetX={tischBreite / 2} offsetY={TISCH_HOEHE / 2} rotation={-el.winkel}
              width={tischBreite} height={TISCH_HOEHE}
              text={String(ti + 1)} fill="#1e40af" fontSize={10} fontStyle="bold"
              align="center" verticalAlign="middle" listening={false} />
            {Array.from({ length: el.sitzeProTisch }, (_, si) => {
              const globalIndex = ti * el.sitzeProTisch + si;
              const sitzId = `${el.bezeichnung}-${globalIndex + 1}`;
              const belegt = belegte.has(sitzId);
              const ausgewaehlt = buchungAusgewaehlt.has(sitzId);
              const { fill, opacity } = sitzFarbe({ sitzId, kategoriefarbe, belegt, buchungAusgewaehlt: ausgewaehlt, editorAusgewaehlt });
              return (
                <Group key={si} x={si * TISCH_SITZ_ABSTAND + TISCH_SITZ_ABSTAND / 2} y={sitzY}
                  onClick={istBuchungsmodus && !belegt ? () => onSitzKlick?.(sitzId) : undefined}
                  onTap={istBuchungsmodus && !belegt ? () => onSitzKlick?.(sitzId) : undefined}
                  onMouseEnter={(e) => { if (istBuchungsmodus && !belegt) e.target.getStage()!.container().style.cursor = "pointer"; }}
                  onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
                >
                  <Circle radius={SITZ_RADIUS} fill={fill} opacity={opacity} />
                  {/* Sitznummer — immer aufrecht */}
                  <Text x={0} y={0} offsetX={SITZ_RADIUS} offsetY={SITZ_RADIUS} rotation={-el.winkel}
                    width={SITZ_RADIUS * 2} height={SITZ_RADIUS * 2}
                    text={String(globalIndex + 1)} fill="white" fontSize={9}
                    align="center" verticalAlign="middle" listening={false} />
                </Group>
              );
            })}
          </Group>
        );
      })}
      {editorAusgewaehlt && <Rect x={-8} y={-TISCH_HOEHE / 2 - 8} width={gesamtBreite + 16} height={TISCH_HOEHE + TISCH_SEAT_GAP + SITZ_RADIUS * 2 + 16} stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={2} fill="transparent" cornerRadius={8} dash={[6, 3]} listening={false} />}
    </Group>
  );
}

function RundtischKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<RundtischElement>) {
  const sitzAbstand = el.tischRadius + SITZ_RADIUS + 8;
  const tischFarbe = kategoriefarbe + "55";
  const r = sitzAbstand + SITZ_RADIUS + 8;
  const labelD = el.tischRadius * 2; // diameter for label bounding box
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(r, Math.min(raumbreite - r, pos.x)), y: Math.max(r, Math.min(raumhoehe - r, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Circle radius={el.tischRadius} fill={tischFarbe} stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe} strokeWidth={1.5} />
      {/* Tisch-Bezeichnung — immer aufrecht zentriert auf Tischmitte */}
      <Text x={0} y={0} offsetX={el.tischRadius} offsetY={el.tischRadius} rotation={-el.winkel}
        width={labelD} height={labelD}
        text={el.bezeichnung} fill="#1e40af" fontSize={11} fontStyle="bold"
        align="center" verticalAlign="middle" listening={false} />
      {Array.from({ length: el.anzahlSitze }, (_, i) => {
        const winkelRad = (2 * Math.PI * i) / el.anzahlSitze - Math.PI / 2;
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        const belegt = belegte.has(sitzId);
        const ausgewaehlt = buchungAusgewaehlt.has(sitzId);
        const { fill, opacity } = sitzFarbe({ sitzId, kategoriefarbe, belegt, buchungAusgewaehlt: ausgewaehlt, editorAusgewaehlt });
        return (
          <Group key={i} x={Math.cos(winkelRad) * sitzAbstand} y={Math.sin(winkelRad) * sitzAbstand}
            onClick={istBuchungsmodus && !belegt ? () => onSitzKlick?.(sitzId) : undefined}
            onTap={istBuchungsmodus && !belegt ? () => onSitzKlick?.(sitzId) : undefined}
            onMouseEnter={(e) => { if (istBuchungsmodus && !belegt) e.target.getStage()!.container().style.cursor = "pointer"; }}
            onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
          >
            <Circle radius={SITZ_RADIUS} fill={fill} opacity={opacity} />
            {/* Sitznummer — immer aufrecht, unabhängig von Tischwinkel */}
            <Text x={0} y={0} offsetX={SITZ_RADIUS} offsetY={SITZ_RADIUS} rotation={-el.winkel}
              width={SITZ_RADIUS * 2} height={SITZ_RADIUS * 2}
              text={String(i + 1)} fill="white" fontSize={9}
              align="center" verticalAlign="middle" listening={false} />
          </Group>
        );
      })}
      {editorAusgewaehlt && <Circle radius={sitzAbstand + SITZ_RADIUS + 6} stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={2} fill="transparent" dash={[6, 3]} listening={false} />}
    </Group>
  );
}

function BuehneKomponente({ buehne, ausgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, nodeRef }: {
  buehne: Buehne; ausgewaehlt: boolean; istBuchungsmodus: boolean;
  raumbreite: number; raumhoehe: number;
  onKlick: () => void; onDragEnd: (x: number, y: number) => void;
  nodeRef: React.RefObject<Konva.Group | null>;
}) {
  return (
    <Group ref={nodeRef} x={buehne.x} y={buehne.y} rotation={buehne.winkel}
      offsetX={buehne.breite / 2} offsetY={buehne.hoehe / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(buehne.breite / 2 + 4, Math.min(raumbreite - buehne.breite / 2 - 4, pos.x)), y: Math.max(buehne.hoehe / 2 + 4, Math.min(raumhoehe - buehne.hoehe / 2 - 4, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Rect width={buehne.breite} height={buehne.hoehe} fill="#1e293b" cornerRadius={6}
        stroke={ausgewaehlt ? FARBE_ELEMENT_SELEKTIERT : "transparent"} strokeWidth={2} />
      {/* Bühnen-Label — immer aufrecht */}
      <Text x={buehne.breite / 2} y={buehne.hoehe / 2}
        offsetX={buehne.breite / 2} offsetY={buehne.hoehe / 2}
        rotation={-buehne.winkel}
        width={buehne.breite} height={buehne.hoehe}
        text={buehne.label} fill="#f8fafc" fontSize={14} fontStyle="bold" letterSpacing={4}
        align="center" verticalAlign="middle" listening={false} />
    </Group>
  );
}

export type CanvasModus = "editor" | "buchung";

type Props = {
  konfiguration: SitzplanKonfiguration;
  modus: CanvasModus;
  renderScale?: number;
  auswahl?: Auswahl;
  onAuswaehlen?: (a: Auswahl) => void;
  onElementVerschieben?: (id: string, x: number, y: number) => void;
  onMehrereElementeVerschieben?: (list: { id: string; x: number; y: number }[]) => void;
  onBuehneVerschieben?: (x: number, y: number) => void;
  onBuehneTransformiert?: (breite: number, hoehe: number, x: number, y: number, winkel: number) => void;
  belegteSitze?: Set<string>;
  ausgewaehlteSitze?: Set<string>;
  onSitzKlicken?: (sitzId: string) => void;
};

export default function SitzplanCanvas({
  konfiguration, modus, renderScale = 1,
  auswahl, onAuswaehlen, onElementVerschieben, onMehrereElementeVerschieben, onBuehneVerschieben, onBuehneTransformiert,
  belegteSitze = new Set(), ausgewaehlteSitze = new Set(), onSitzKlicken,
}: Props) {
  const buehneRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const istBuchungsmodus = modus === "buchung";
  const scale = Math.min(1, renderScale);

  // Shift key tracking (ref, no re-render)
  const shiftHeldRef = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Shift") shiftHeldRef.current = true; };
    const up   = (e: KeyboardEvent) => { if (e.key === "Shift") shiftHeldRef.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Rubber band selection state + refs
  const [selectRect, setSelectRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const isSelectingRef = useRef(false);
  const selectStartRef = useRef({ x: 0, y: 0 });
  const drewBandRef = useRef(false);

  useEffect(() => {
    if (!trRef.current) return;
    if (auswahl?.typ === "buehne" && buehneRef.current) trRef.current.nodes([buehneRef.current]);
    else trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [auswahl]);

  const kategorienMap = new Map<string, Preiskategorie>(konfiguration.kategorien.map((k) => [k.id, k]));
  const { breite: raumbreite, hoehe: raumhoehe } = konfiguration;

  function renderElement(el: SitzplanElement) {
    const istAusgewaehlt = auswahl?.typ === "element" && auswahl.ids.includes(el.id);
    const kat = kategorienMap.get(el.kategorie_id);
    const gemeinsam = {
      kategoriefarbe: kat?.farbe ?? "#3b82f6",
      editorAusgewaehlt: istAusgewaehlt,
      belegte: belegteSitze,
      buchungAusgewaehlt: ausgewaehlteSitze,
      istBuchungsmodus,
      raumbreite,
      raumhoehe,
      onKlick: () => {
        const shift = shiftHeldRef.current;
        const currentIds = auswahl?.typ === "element" ? auswahl.ids : [];
        if (shift) {
          const newIds = currentIds.includes(el.id)
            ? currentIds.filter(id => id !== el.id)
            : [...currentIds, el.id];
          onAuswaehlen?.(newIds.length > 0 ? { typ: "element", ids: newIds } : null);
        } else {
          const alreadySingle = currentIds.length === 1 && currentIds[0] === el.id;
          onAuswaehlen?.(alreadySingle ? null : { typ: "element", ids: [el.id] });
        }
      },
      onDragEnd: (x: number, y: number) => {
        const selectedIds = auswahl?.typ === "element" ? auswahl.ids : [];
        if (selectedIds.length > 1 && selectedIds.includes(el.id)) {
          const dx = x - el.x; const dy = y - el.y;
          const list = konfiguration.elemente
            .filter(e => selectedIds.includes(e.id))
            .map(e => ({
              id: e.id,
              x: e.id === el.id ? x : Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, e.x + dx)),
              y: e.id === el.id ? y : Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, e.y + dy)),
            }));
          onMehrereElementeVerschieben?.(list);
        } else {
          onElementVerschieben?.(el.id, x, y);
        }
      },
      onSitzKlick: onSitzKlicken,
    };
    switch (el.typ) {
      case "reihe":      return <ReiheKomponente      key={el.id} el={el} {...gemeinsam} />;
      case "tischreihe": return <TischreiheKomponente key={el.id} el={el} {...gemeinsam} />;
      case "rundtisch":  return <RundtischKomponente  key={el.id} el={el} {...gemeinsam} />;
    }
  }

  return (
    <Stage
      width={raumbreite * scale} height={raumhoehe * scale}
      scale={{ x: scale, y: scale }}
      onMouseDown={(e) => {
        if (istBuchungsmodus) return;
        const targetId = (e.target as Konva.Shape).id?.() ?? "";
        const isEmpty = e.target === e.target.getStage() || targetId === "bg";
        if (!isEmpty) return;
        const pos = e.target.getStage()!.getPointerPosition()!;
        const x = pos.x / scale; const y = pos.y / scale;
        isSelectingRef.current = true;
        drewBandRef.current = false;
        selectStartRef.current = { x, y };
        setSelectRect({ x, y, w: 0, h: 0 });
      }}
      onMouseMove={(e) => {
        if (!isSelectingRef.current) return;
        const pos = e.target.getStage()!.getPointerPosition()!;
        const cx = pos.x / scale; const cy = pos.y / scale;
        const { x: sx, y: sy } = selectStartRef.current;
        const w = cx - sx; const h = cy - sy;
        setSelectRect({ x: w < 0 ? cx : sx, y: h < 0 ? cy : sy, w: Math.abs(w), h: Math.abs(h) });
        if (Math.abs(w) > 4 || Math.abs(h) > 4) drewBandRef.current = true;
      }}
      onMouseUp={() => {
        if (!isSelectingRef.current) return;
        isSelectingRef.current = false;
        const rect = selectRect;
        setSelectRect(null);
        if (!rect || !drewBandRef.current) return;
        const found = konfiguration.elemente.filter(el =>
          el.x >= rect.x && el.x <= rect.x + rect.w &&
          el.y >= rect.y && el.y <= rect.y + rect.h
        );
        if (found.length > 0) onAuswaehlen?.({ typ: "element", ids: found.map(e => e.id) });
      }}
      onClick={(e) => {
        if (drewBandRef.current) return;
        const targetId = (e.target as Konva.Shape).id?.() ?? "";
        if (e.target === e.target.getStage() || targetId === "bg") onAuswaehlen?.(null);
      }}
    >
      <Layer>
        <Rect id="bg" x={0} y={0} width={raumbreite} height={raumhoehe} fill="#f8fafc" />
        {Array.from({ length: Math.ceil(raumhoehe / 40) }, (_, i) => (
          <Line key={`h${i}`} points={[0, i * 40, raumbreite, i * 40]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
        ))}
        {Array.from({ length: Math.ceil(raumbreite / 40) }, (_, i) => (
          <Line key={`v${i}`} points={[i * 40, 0, i * 40, raumhoehe]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
        ))}
        <Rect x={0} y={0} width={raumbreite} height={raumhoehe} stroke="#cbd5e1" strokeWidth={2} fill="transparent" listening={false} />
        <BuehneKomponente
          buehne={konfiguration.buehne} ausgewaehlt={auswahl?.typ === "buehne"}
          istBuchungsmodus={istBuchungsmodus} raumbreite={raumbreite} raumhoehe={raumhoehe}
          onKlick={() => onAuswaehlen?.(auswahl?.typ === "buehne" ? null : { typ: "buehne" })}
          onDragEnd={(x, y) => onBuehneVerschieben?.(x, y)} nodeRef={buehneRef}
        />
        {konfiguration.elemente.map(renderElement)}
        {selectRect && (
          <Rect
            x={selectRect.x} y={selectRect.y} width={selectRect.w} height={selectRect.h}
            fill={FARBE_ELEMENT_SELEKTIERT + "18"}
            stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1}
            dash={[5, 3]} listening={false}
          />
        )}
        {!istBuchungsmodus && (
          <Transformer ref={trRef} rotateEnabled
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]}
            boundBoxFunc={(old, n) => (n.width < 80 || n.height < 20 ? old : n)}
            onTransformEnd={() => {
              const node = buehneRef.current;
              if (!node) return;
              const sx = node.scaleX(), sy = node.scaleY();
              node.scaleX(1); node.scaleY(1);
              onBuehneTransformiert?.(
                Math.max(80, Math.round(konfiguration.buehne.breite * sx)),
                Math.max(20, Math.round(konfiguration.buehne.hoehe * sy)),
                node.x(), node.y(), node.rotation(),
              );
            }}
          />
        )}
      </Layer>
    </Stage>
  );
}
