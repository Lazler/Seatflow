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

const DRAG_MARGIN = 40;

// ── Seat component with smooth hover scale animation ──────────────────────────

type SitzProps = {
  x: number; y: number;
  sitzId: string; nummer: number;
  kategoriefarbe: string;
  belegt: boolean; buchungAusgewaehlt: boolean; editorAusgewaehlt: boolean;
  istBuchungsmodus: boolean; elementWinkel: number;
  onSitzKlick?: (id: string) => void;
};

function SitzKreis({ x, y, sitzId, nummer, kategoriefarbe, belegt, buchungAusgewaehlt, editorAusgewaehlt, istBuchungsmodus, elementWinkel, onSitzKlick }: SitzProps) {
  const istKlickbar = istBuchungsmodus && !belegt;

  let fill = kategoriefarbe;
  if (belegt)             fill = FARBE_BELEGT;
  else if (buchungAusgewaehlt) fill = FARBE_AUSGEWAEHLT;
  else if (editorAusgewaehlt)  fill = FARBE_ELEMENT_SELEKTIERT;

  return (
    <Group x={x} y={y}
      onClick={istKlickbar ? () => onSitzKlick?.(sitzId) : undefined}
      onTap={istKlickbar ? () => onSitzKlick?.(sitzId) : undefined}
      onMouseEnter={(e) => {
        if (istKlickbar) {
          (e.currentTarget as unknown as Konva.Node).to({ scaleX: 1.15, scaleY: 1.15, duration: 0.1 });
          e.target.getStage()!.container().style.cursor = "pointer";
        }
      }}
      onMouseLeave={(e) => {
        if (istKlickbar) {
          (e.currentTarget as unknown as Konva.Node).to({ scaleX: 1, scaleY: 1, duration: 0.1 });
          e.target.getStage()!.container().style.cursor = "default";
        }
      }}
    >
      {/* Emerald glow ring when selected */}
      {buchungAusgewaehlt && (
        <Circle radius={SITZ_RADIUS + 5} fill={FARBE_AUSGEWAEHLT} opacity={0.22} listening={false} />
      )}
      <Circle
        radius={SITZ_RADIUS}
        fill={fill}
        stroke={belegt ? "transparent" : "rgba(255,255,255,0.6)"}
        strokeWidth={1.5}
        shadowColor={
          belegt ? "transparent" :
          buchungAusgewaehlt ? FARBE_AUSGEWAEHLT :
          "#0f172a"
        }
        shadowBlur={buchungAusgewaehlt ? 10 : 4}
        shadowOpacity={buchungAusgewaehlt ? 0.35 : 0.18}
        shadowOffsetY={buchungAusgewaehlt ? 0 : 1}
        opacity={belegt ? 0.5 : 1}
      />
      {!belegt && (
        <Text
          x={0} y={0} offsetX={SITZ_RADIUS} offsetY={SITZ_RADIUS}
          rotation={-elementWinkel}
          width={SITZ_RADIUS * 2} height={SITZ_RADIUS * 2}
          text={String(nummer)}
          fill="rgba(255,255,255,0.92)" fontSize={9} fontStyle="bold"
          align="center" verticalAlign="middle" listening={false}
        />
      )}
    </Group>
  );
}

// ── Shared element props ──────────────────────────────────────────────────────

type ElementProps<T> = {
  el: T; kategoriefarbe: string; editorAusgewaehlt: boolean;
  belegte: Set<string>; buchungAusgewaehlt: Set<string>;
  istBuchungsmodus: boolean; raumbreite: number; raumhoehe: number;
  onKlick: () => void; onDragEnd: (x: number, y: number) => void;
  onSitzKlick?: (sitzId: string) => void;
};

// ── Reihe ─────────────────────────────────────────────────────────────────────

function ReiheKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<ReiheElement>) {
  const breite = (el.anzahlSitze - 1) * el.sitzAbstand;
  const LH = SITZ_RADIUS * 2;
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel} offsetX={breite / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, pos.x)), y: Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Row label left */}
      <Text x={-24} y={0} offsetX={16} offsetY={SITZ_RADIUS} rotation={-el.winkel}
        width={32} height={LH} text={el.bezeichnung}
        fill="#475569" fontSize={11} fontStyle="bold" verticalAlign="middle" align="right" listening={false} />
      {Array.from({ length: el.anzahlSitze }, (_, i) => {
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        return (
          <SitzKreis key={sitzId}
            x={i * el.sitzAbstand} y={0}
            sitzId={sitzId} nummer={i + 1}
            kategoriefarbe={kategoriefarbe}
            belegt={belegte.has(sitzId)}
            buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
            editorAusgewaehlt={editorAusgewaehlt}
            istBuchungsmodus={istBuchungsmodus}
            elementWinkel={el.winkel}
            onSitzKlick={onSitzKlick}
          />
        );
      })}
      {/* Row label right */}
      <Text x={breite + SITZ_RADIUS + 22} y={0} offsetX={16} offsetY={SITZ_RADIUS} rotation={-el.winkel}
        width={32} height={LH} text={el.bezeichnung}
        fill="#475569" fontSize={11} fontStyle="bold" verticalAlign="middle" listening={false} />
      {editorAusgewaehlt && (
        <Rect
          x={-SITZ_RADIUS - 10} y={-SITZ_RADIUS - 8}
          width={breite + SITZ_RADIUS * 2 + 20} height={SITZ_RADIUS * 2 + 16}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(245,158,11,0.04)" cornerRadius={10}
          dash={[6, 4]} listening={false}
        />
      )}
    </Group>
  );
}

// ── Tischreihe ────────────────────────────────────────────────────────────────

function TischreiheKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<TischreiheElement>) {
  const tischBreite = el.sitzeProTisch * TISCH_SITZ_ABSTAND;
  const gesamtBreite = tischreiheBreite(el);
  const sitzY = TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS;
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
      {/* Element label */}
      <Text x={-42 + LW / 2} y={0} offsetX={LW / 2} offsetY={LH / 2} rotation={-el.winkel}
        width={LW} height={LH} text={el.bezeichnung}
        fill="#475569" fontSize={11} fontStyle="bold" align="right" verticalAlign="middle" listening={false} />
      {Array.from({ length: el.anzahlTische }, (_, ti) => {
        const tischX = ti * (tischBreite + el.tischAbstand);
        return (
          <Group key={ti} x={tischX}>
            {/* Premium table card */}
            <Rect
              x={0} y={-TISCH_HOEHE / 2}
              width={tischBreite} height={TISCH_HOEHE}
              fill={kategoriefarbe + "28"}
              stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe}
              strokeWidth={1.5}
              cornerRadius={6}
              shadowColor={kategoriefarbe}
              shadowBlur={8}
              shadowOpacity={0.18}
              shadowOffsetY={2}
            />
            {/* Table number — always upright */}
            <Text
              x={tischBreite / 2} y={0}
              offsetX={tischBreite / 2} offsetY={TISCH_HOEHE / 2}
              rotation={-el.winkel}
              width={tischBreite} height={TISCH_HOEHE}
              text={String(ti + 1)}
              fill="#1e3a5f" fontSize={10} fontStyle="bold"
              align="center" verticalAlign="middle" listening={false}
            />
            {Array.from({ length: el.sitzeProTisch }, (_, si) => {
              const globalIndex = ti * el.sitzeProTisch + si;
              const sitzId = `${el.bezeichnung}-${globalIndex + 1}`;
              return (
                <SitzKreis key={si}
                  x={si * TISCH_SITZ_ABSTAND + TISCH_SITZ_ABSTAND / 2} y={sitzY}
                  sitzId={sitzId} nummer={globalIndex + 1}
                  kategoriefarbe={kategoriefarbe}
                  belegt={belegte.has(sitzId)}
                  buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
                  editorAusgewaehlt={editorAusgewaehlt}
                  istBuchungsmodus={istBuchungsmodus}
                  elementWinkel={el.winkel}
                  onSitzKlick={onSitzKlick}
                />
              );
            })}
          </Group>
        );
      })}
      {editorAusgewaehlt && (
        <Rect
          x={-10} y={-TISCH_HOEHE / 2 - 10}
          width={gesamtBreite + 20} height={TISCH_HOEHE + TISCH_SEAT_GAP + SITZ_RADIUS * 2 + 20}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(245,158,11,0.04)" cornerRadius={10}
          dash={[6, 4]} listening={false}
        />
      )}
    </Group>
  );
}

// ── Rundtisch ─────────────────────────────────────────────────────────────────

function RundtischKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<RundtischElement>) {
  const sitzAbstand = el.tischRadius + SITZ_RADIUS + 8;
  const r = sitzAbstand + SITZ_RADIUS + 8;
  const labelD = el.tischRadius * 2;
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(r, Math.min(raumbreite - r, pos.x)), y: Math.max(r, Math.min(raumhoehe - r, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Premium round table */}
      <Circle
        radius={el.tischRadius}
        fill={kategoriefarbe + "22"}
        stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe}
        strokeWidth={2}
        shadowColor="#0f172a"
        shadowBlur={10}
        shadowOpacity={0.12}
        shadowOffsetY={2}
      />
      {/* Table label — always upright */}
      <Text
        x={0} y={0}
        offsetX={el.tischRadius} offsetY={el.tischRadius}
        rotation={-el.winkel}
        width={labelD} height={labelD}
        text={el.bezeichnung}
        fill="#1e3a5f" fontSize={12} fontStyle="bold"
        align="center" verticalAlign="middle" listening={false}
      />
      {Array.from({ length: el.anzahlSitze }, (_, i) => {
        const winkelRad = (2 * Math.PI * i) / el.anzahlSitze - Math.PI / 2;
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        return (
          <SitzKreis key={i}
            x={Math.cos(winkelRad) * sitzAbstand}
            y={Math.sin(winkelRad) * sitzAbstand}
            sitzId={sitzId} nummer={i + 1}
            kategoriefarbe={kategoriefarbe}
            belegt={belegte.has(sitzId)}
            buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
            editorAusgewaehlt={editorAusgewaehlt}
            istBuchungsmodus={istBuchungsmodus}
            elementWinkel={el.winkel}
            onSitzKlick={onSitzKlick}
          />
        );
      })}
      {editorAusgewaehlt && (
        <Circle
          radius={sitzAbstand + SITZ_RADIUS + 8}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(245,158,11,0.04)"
          dash={[6, 4]} listening={false}
        />
      )}
    </Group>
  );
}

// ── Bühne ─────────────────────────────────────────────────────────────────────

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
      {/* Premium gradient stage */}
      <Rect
        width={buehne.breite} height={buehne.hoehe}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: buehne.hoehe }}
        fillLinearGradientColorStops={[0, "#334155", 1, "#0f172a"]}
        cornerRadius={8}
        stroke={ausgewaehlt ? FARBE_ELEMENT_SELEKTIERT : "rgba(255,255,255,0.10)"}
        strokeWidth={ausgewaehlt ? 2 : 1}
        shadowColor="#000000"
        shadowBlur={20}
        shadowOpacity={0.32}
        shadowOffsetY={4}
      />
      {/* Stage label — always upright */}
      <Text
        x={buehne.breite / 2} y={buehne.hoehe / 2}
        offsetX={buehne.breite / 2} offsetY={buehne.hoehe / 2}
        rotation={-buehne.winkel}
        width={buehne.breite} height={buehne.hoehe}
        text={buehne.label}
        fill="rgba(248,250,252,0.90)" fontSize={13} fontStyle="bold" letterSpacing={5}
        align="center" verticalAlign="middle" listening={false}
      />
    </Group>
  );
}

// ── Canvas ────────────────────────────────────────────────────────────────────

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

  const shiftHeldRef = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Shift") shiftHeldRef.current = true; };
    const up   = (e: KeyboardEvent) => { if (e.key === "Shift") shiftHeldRef.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

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
        {/* Background */}
        <Rect id="bg" x={0} y={0} width={raumbreite} height={raumhoehe} fill="#f5f7fc" />
        {/* Subtle grid */}
        {Array.from({ length: Math.ceil(raumhoehe / 40) }, (_, i) => (
          <Line key={`h${i}`} points={[0, i * 40, raumbreite, i * 40]} stroke="#e4e9f2" strokeWidth={0.75} listening={false} />
        ))}
        {Array.from({ length: Math.ceil(raumbreite / 40) }, (_, i) => (
          <Line key={`v${i}`} points={[i * 40, 0, i * 40, raumhoehe]} stroke="#e4e9f2" strokeWidth={0.75} listening={false} />
        ))}
        {/* Canvas border */}
        <Rect x={0} y={0} width={raumbreite} height={raumhoehe} stroke="#c8d3e0" strokeWidth={1.5} fill="transparent" listening={false} />
        {/* Stage / Bühne */}
        <BuehneKomponente
          buehne={konfiguration.buehne} ausgewaehlt={auswahl?.typ === "buehne"}
          istBuchungsmodus={istBuchungsmodus} raumbreite={raumbreite} raumhoehe={raumhoehe}
          onKlick={() => onAuswaehlen?.(auswahl?.typ === "buehne" ? null : { typ: "buehne" })}
          onDragEnd={(x, y) => onBuehneVerschieben?.(x, y)} nodeRef={buehneRef}
        />
        {/* Seat elements */}
        {konfiguration.elemente.map(renderElement)}
        {/* Rubber band selection rect */}
        {selectRect && (
          <Rect
            x={selectRect.x} y={selectRect.y} width={selectRect.w} height={selectRect.h}
            fill={FARBE_ELEMENT_SELEKTIERT + "14"}
            stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
            cornerRadius={4} dash={[6, 4]} listening={false}
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
