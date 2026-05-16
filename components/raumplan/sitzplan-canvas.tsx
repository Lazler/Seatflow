"use client";

import { useRef, useEffect } from "react";
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

export type Auswahl = { typ: "buehne" } | { typ: "element"; id: string } | null;

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
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel} offsetX={breite / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, pos.x)), y: Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Text x={-36} y={-SITZ_RADIUS} width={30} height={SITZ_RADIUS * 2} text={el.bezeichnung} fill="#64748b" fontSize={12} fontStyle="bold" verticalAlign="middle" align="right" />
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
            <Text x={-SITZ_RADIUS} y={-7} width={SITZ_RADIUS * 2} text={String(i + 1)} fill="white" fontSize={9} align="center" listening={false} />
          </Group>
        );
      })}
      <Text x={breite + SITZ_RADIUS + 6} y={-SITZ_RADIUS} width={30} height={SITZ_RADIUS * 2} text={el.bezeichnung} fill="#64748b" fontSize={12} fontStyle="bold" verticalAlign="middle" />
      {editorAusgewaehlt && <Rect x={-SITZ_RADIUS - 8} y={-SITZ_RADIUS - 6} width={breite + SITZ_RADIUS * 2 + 16} height={SITZ_RADIUS * 2 + 12} stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={2} fill="transparent" cornerRadius={8} dash={[6, 3]} listening={false} />}
    </Group>
  );
}

function TischreiheKomponente({ el, kategoriefarbe, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, onKlick, onDragEnd, onSitzKlick }: ElementProps<TischreiheElement>) {
  const tischBreite = el.sitzeProTisch * TISCH_SITZ_ABSTAND;
  const gesamtBreite = tischreiheBreite(el);
  const sitzY = TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS;
  const tischFarbe = kategoriefarbe + "55";
  return (
    <Group x={el.x} y={el.y} rotation={el.winkel} offsetX={gesamtBreite / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => ({ x: Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, pos.x)), y: Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, pos.y)) })}
      onClick={!istBuchungsmodus ? onKlick : undefined} onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Text x={-40} y={-8} width={36} text={el.bezeichnung} fill="#64748b" fontSize={11} fontStyle="bold" align="right" />
      {Array.from({ length: el.anzahlTische }, (_, ti) => {
        const tischX = ti * (tischBreite + el.tischAbstand);
        return (
          <Group key={ti} x={tischX}>
            <Rect x={0} y={-TISCH_HOEHE / 2} width={tischBreite} height={TISCH_HOEHE} fill={tischFarbe} cornerRadius={4}
              stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe} strokeWidth={1.5} />
            <Text x={0} y={-7} width={tischBreite} text={String(ti + 1)} fill="#1e40af" fontSize={10} fontStyle="bold" align="center" listening={false} />
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
                  <Text x={-SITZ_RADIUS} y={-7} width={SITZ_RADIUS * 2} text={String(globalIndex + 1)} fill="white" fontSize={9} align="center" listening={false} />
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
      <Text x={-el.tischRadius} y={-8} width={el.tischRadius * 2} text={el.bezeichnung} fill="#1e40af" fontSize={11} fontStyle="bold" align="center" listening={false} />
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
            <Text x={-SITZ_RADIUS} y={-7} width={SITZ_RADIUS * 2} text={String(i + 1)} fill="white" fontSize={9} align="center" listening={false} />
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
      <Text width={buehne.breite} height={buehne.hoehe} text={buehne.label}
        fill="#f8fafc" fontSize={14} fontStyle="bold" letterSpacing={4} align="center" verticalAlign="middle" listening={false} />
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
  onBuehneVerschieben?: (x: number, y: number) => void;
  onBuehneTransformiert?: (breite: number, hoehe: number, x: number, y: number, winkel: number) => void;
  belegteSitze?: Set<string>;
  ausgewaehlteSitze?: Set<string>;
  onSitzKlicken?: (sitzId: string) => void;
};

export default function SitzplanCanvas({
  konfiguration, modus, renderScale = 1,
  auswahl, onAuswaehlen, onElementVerschieben, onBuehneVerschieben, onBuehneTransformiert,
  belegteSitze = new Set(), ausgewaehlteSitze = new Set(), onSitzKlicken,
}: Props) {
  const buehneRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const istBuchungsmodus = modus === "buchung";
  const scale = Math.min(1, renderScale);

  useEffect(() => {
    if (!trRef.current) return;
    if (auswahl?.typ === "buehne" && buehneRef.current) trRef.current.nodes([buehneRef.current]);
    else trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [auswahl]);

  const kategorienMap = new Map<string, Preiskategorie>(konfiguration.kategorien.map((k) => [k.id, k]));
  const { breite: raumbreite, hoehe: raumhoehe } = konfiguration;

  function renderElement(el: SitzplanElement) {
    const istAusgewaehlt = auswahl?.typ === "element" && auswahl.id === el.id;
    const kat = kategorienMap.get(el.kategorie_id);
    const gemeinsam = {
      kategoriefarbe: kat?.farbe ?? "#3b82f6",
      editorAusgewaehlt: istAusgewaehlt,
      belegte: belegteSitze,
      buchungAusgewaehlt: ausgewaehlteSitze,
      istBuchungsmodus,
      raumbreite,
      raumhoehe,
      onKlick: () => onAuswaehlen?.(istAusgewaehlt ? null : { typ: "element", id: el.id }),
      onDragEnd: (x: number, y: number) => onElementVerschieben?.(el.id, x, y),
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
      onClick={(e) => { if (e.target === e.target.getStage()) onAuswaehlen?.(null); }}
    >
      <Layer>
        <Rect x={0} y={0} width={raumbreite} height={raumhoehe} fill="#f8fafc" />
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
