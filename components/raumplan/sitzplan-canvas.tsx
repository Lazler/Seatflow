"use client";

import { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Text, Group, Line, Arc, Transformer } from "react-konva";
import type Konva from "konva";
import {
  type SitzplanElement,
  type ReiheElement,
  type TischreiheElement,
  type RundtischElement,
  type SitzplanKonfiguration,
  type Buehne,
  SITZ_RADIUS,
  SITZ_FARBE,
  SITZ_FARBE_AUSGEWAEHLT,
  TISCH_HOEHE,
  TISCH_SITZ_ABSTAND,
  TISCH_SEAT_GAP,
  TISCH_FARBE,
  tischreiheBreite,
} from "@/types/sitzplan";

// --- Auswahl-Typ ---
export type Auswahl =
  | { typ: "buehne" }
  | { typ: "element"; id: string }
  | null;

// --- Reihe ---
function ReiheKomponente({
  el,
  ausgewaehlt,
  belegte,
  lesemodus,
  onKlick,
  onDragEnd,
}: {
  el: ReiheElement;
  ausgewaehlt: boolean;
  belegte: Set<string>;
  lesemodus: boolean;
  onKlick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const breite = (el.anzahlSitze - 1) * el.sitzAbstand;
  const farbe = ausgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : SITZ_FARBE[el.kategorie];

  return (
    <Group
      x={el.x}
      y={el.y}
      rotation={el.winkel}
      offsetX={breite / 2}
      draggable={!lesemodus}
      onClick={onKlick}
      onTap={onKlick}
      onDragEnd={(e) => onDragEnd(e.target.x() + breite / 2, e.target.y())}
      onMouseEnter={(e) => { if (!lesemodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Bezeichnung links */}
      <Text
        x={-36}
        y={-SITZ_RADIUS}
        width={30}
        height={SITZ_RADIUS * 2}
        text={el.bezeichnung}
        fill="#64748b"
        fontSize={12}
        fontStyle="bold"
        verticalAlign="middle"
        align="right"
      />
      {/* Sitze */}
      {Array.from({ length: el.anzahlSitze }, (_, i) => {
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        const belegt = belegte.has(sitzId);
        return (
          <Group key={sitzId} x={i * el.sitzAbstand} y={0}>
            <Circle radius={SITZ_RADIUS} fill={belegt ? "#94a3b8" : farbe} opacity={belegt ? 0.45 : 1} />
            <Text x={-SITZ_RADIUS} y={-7} width={SITZ_RADIUS * 2} text={String(i + 1)} fill="white" fontSize={9} align="center" />
          </Group>
        );
      })}
      {/* Bezeichnung rechts */}
      <Text
        x={breite + SITZ_RADIUS + 6}
        y={-SITZ_RADIUS}
        width={30}
        height={SITZ_RADIUS * 2}
        text={el.bezeichnung}
        fill="#64748b"
        fontSize={12}
        fontStyle="bold"
        verticalAlign="middle"
      />
      {/* Auswahlrahmen */}
      {ausgewaehlt && (
        <Rect
          x={-SITZ_RADIUS - 8}
          y={-SITZ_RADIUS - 6}
          width={breite + SITZ_RADIUS * 2 + 16}
          height={SITZ_RADIUS * 2 + 12}
          stroke={SITZ_FARBE_AUSGEWAEHLT}
          strokeWidth={2}
          fill="transparent"
          cornerRadius={8}
          dash={[6, 3]}
          listening={false}
        />
      )}
    </Group>
  );
}

// --- Tischreihe ---
function TischreiheKomponente({
  el,
  ausgewaehlt,
  belegte,
  lesemodus,
  onKlick,
  onDragEnd,
}: {
  el: TischreiheElement;
  ausgewaehlt: boolean;
  belegte: Set<string>;
  lesemodus: boolean;
  onKlick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const tischBreite = el.sitzeProTisch * TISCH_SITZ_ABSTAND;
  const gesamtBreite = tischreiheBreite(el);
  const sitzFarbe = ausgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : SITZ_FARBE[el.kategorie];
  const tischFarbe = TISCH_FARBE[el.kategorie];
  const sitzY = TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS;

  return (
    <Group
      x={el.x}
      y={el.y}
      rotation={el.winkel}
      offsetX={gesamtBreite / 2}
      draggable={!lesemodus}
      onClick={onKlick}
      onTap={onKlick}
      onDragEnd={(e) => onDragEnd(e.target.x() + gesamtBreite / 2, e.target.y())}
      onMouseEnter={(e) => { if (!lesemodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {Array.from({ length: el.anzahlTische }, (_, ti) => {
        const tischX = ti * (tischBreite + el.tischAbstand);
        return (
          <Group key={ti} x={tischX}>
            {/* Tischplatte */}
            <Rect
              x={0}
              y={-TISCH_HOEHE / 2}
              width={tischBreite}
              height={TISCH_HOEHE}
              fill={tischFarbe}
              cornerRadius={4}
              stroke={ausgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : "#93c5fd"}
              strokeWidth={1}
            />
            {/* Tisch-Nummer */}
            <Text
              x={0}
              y={-7}
              width={tischBreite}
              text={String(ti + 1)}
              fill="#1e40af"
              fontSize={10}
              fontStyle="bold"
              align="center"
            />
            {/* Sitze */}
            {Array.from({ length: el.sitzeProTisch }, (_, si) => {
              const globalIndex = ti * el.sitzeProTisch + si;
              const sitzId = `${el.bezeichnung}-${globalIndex + 1}`;
              const belegt = belegte.has(sitzId);
              const sitzX = si * TISCH_SITZ_ABSTAND + TISCH_SITZ_ABSTAND / 2;
              return (
                <Group key={si} x={sitzX} y={sitzY}>
                  <Circle radius={SITZ_RADIUS} fill={belegt ? "#94a3b8" : sitzFarbe} opacity={belegt ? 0.45 : 1} />
                  <Text x={-SITZ_RADIUS} y={-7} width={SITZ_RADIUS * 2} text={String(globalIndex + 1)} fill="white" fontSize={9} align="center" />
                </Group>
              );
            })}
          </Group>
        );
      })}
      {/* Bezeichnung */}
      <Text
        x={-36}
        y={-SITZ_RADIUS}
        width={32}
        text={el.bezeichnung}
        fill="#64748b"
        fontSize={11}
        fontStyle="bold"
        align="right"
      />
      {/* Auswahlrahmen */}
      {ausgewaehlt && (
        <Rect
          x={-8}
          y={-TISCH_HOEHE / 2 - 8}
          width={gesamtBreite + 16}
          height={TISCH_HOEHE + TISCH_SEAT_GAP + SITZ_RADIUS * 2 + 16}
          stroke={SITZ_FARBE_AUSGEWAEHLT}
          strokeWidth={2}
          fill="transparent"
          cornerRadius={8}
          dash={[6, 3]}
          listening={false}
        />
      )}
    </Group>
  );
}

// --- Rundtisch ---
function RundtischKomponente({
  el,
  ausgewaehlt,
  belegte,
  lesemodus,
  onKlick,
  onDragEnd,
}: {
  el: RundtischElement;
  ausgewaehlt: boolean;
  belegte: Set<string>;
  lesemodus: boolean;
  onKlick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const sitzFarbe = ausgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : SITZ_FARBE[el.kategorie];
  const tischFarbe = TISCH_FARBE[el.kategorie];
  const sitzAbstand = el.tischRadius + SITZ_RADIUS + 8;

  return (
    <Group
      x={el.x}
      y={el.y}
      rotation={el.winkel}
      draggable={!lesemodus}
      onClick={onKlick}
      onTap={onKlick}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!lesemodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Runder Tisch */}
      <Circle
        radius={el.tischRadius}
        fill={tischFarbe}
        stroke={ausgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : "#93c5fd"}
        strokeWidth={1.5}
      />
      <Text
        x={-el.tischRadius}
        y={-8}
        width={el.tischRadius * 2}
        text={el.bezeichnung}
        fill="#1e40af"
        fontSize={11}
        fontStyle="bold"
        align="center"
      />
      {/* Sitze ringsum */}
      {Array.from({ length: el.anzahlSitze }, (_, i) => {
        const winkelRad = (2 * Math.PI * i) / el.anzahlSitze - Math.PI / 2;
        const sx = Math.cos(winkelRad) * sitzAbstand;
        const sy = Math.sin(winkelRad) * sitzAbstand;
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        const belegt = belegte.has(sitzId);
        return (
          <Group key={i} x={sx} y={sy}>
            <Circle radius={SITZ_RADIUS} fill={belegt ? "#94a3b8" : sitzFarbe} opacity={belegt ? 0.45 : 1} />
            <Text x={-SITZ_RADIUS} y={-7} width={SITZ_RADIUS * 2} text={String(i + 1)} fill="white" fontSize={9} align="center" />
          </Group>
        );
      })}
      {/* Auswahlrahmen */}
      {ausgewaehlt && (
        <Circle
          radius={sitzAbstand + SITZ_RADIUS + 6}
          stroke={SITZ_FARBE_AUSGEWAEHLT}
          strokeWidth={2}
          fill="transparent"
          dash={[6, 3]}
          listening={false}
        />
      )}
    </Group>
  );
}

// --- Bühne ---
function BuehneKomponente({
  buehne,
  ausgewaehlt,
  lesemodus,
  onKlick,
  onDragEnd,
  onTransformEnd,
  nodeRef,
}: {
  buehne: Buehne;
  ausgewaehlt: boolean;
  lesemodus: boolean;
  onKlick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (breite: number, hoehe: number, x: number, y: number, winkel: number) => void;
  nodeRef: React.RefObject<Konva.Group | null>;
}) {
  return (
    <Group
      ref={nodeRef}
      x={buehne.x}
      y={buehne.y}
      rotation={buehne.winkel}
      offsetX={buehne.breite / 2}
      offsetY={buehne.hoehe / 2}
      draggable={!lesemodus}
      onClick={onKlick}
      onTap={onKlick}
      onDragEnd={(e) => {
        onDragEnd(
          e.target.x() + buehne.breite / 2,
          e.target.y() + buehne.hoehe / 2
        );
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd(
          Math.max(80, buehne.breite * scaleX),
          Math.max(30, buehne.hoehe * scaleY),
          node.x() + (buehne.breite * scaleX) / 2,
          node.y() + (buehne.hoehe * scaleY) / 2,
          node.rotation()
        );
      }}
      onMouseEnter={(e) => { if (!lesemodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Rect
        width={buehne.breite}
        height={buehne.hoehe}
        fill="#1e293b"
        cornerRadius={6}
        stroke={ausgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : "transparent"}
        strokeWidth={2}
      />
      <Text
        width={buehne.breite}
        height={buehne.hoehe}
        text={buehne.label}
        fill="#f8fafc"
        fontSize={14}
        fontStyle="bold"
        letterSpacing={4}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}

// --- Haupt-Canvas ---
type Props = {
  konfiguration: SitzplanKonfiguration;
  auswahl: Auswahl;
  onAuswaehlen: (a: Auswahl) => void;
  onElementVerschieben: (id: string, x: number, y: number) => void;
  onBuehneVerschieben: (x: number, y: number) => void;
  onBuehneTransformieren: (breite: number, hoehe: number, x: number, y: number, winkel: number) => void;
  belegteStize?: Set<string>;
  lesemodus?: boolean;
};

export default function SitzplanCanvas({
  konfiguration,
  auswahl,
  onAuswaehlen,
  onElementVerschieben,
  onBuehneVerschieben,
  onBuehneTransformieren,
  belegteStize = new Set(),
  lesemodus = false,
}: Props) {
  const buehneRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Transformer an Bühne anhängen wenn ausgewählt
  useEffect(() => {
    if (!trRef.current) return;
    if (auswahl?.typ === "buehne" && buehneRef.current) {
      trRef.current.nodes([buehneRef.current]);
    } else {
      trRef.current.nodes([]);
    }
    trRef.current.getLayer()?.batchDraw();
  }, [auswahl]);

  function renderElement(el: SitzplanElement) {
    const istAusgewaehlt = auswahl?.typ === "element" && auswahl.id === el.id;
    const gemeinsam = {
      ausgewaehlt: istAusgewaehlt,
      belegte: belegteStize,
      lesemodus,
      onKlick: () => onAuswaehlen(istAusgewaehlt ? null : { typ: "element", id: el.id }),
      onDragEnd: (x: number, y: number) => onElementVerschieben(el.id, x, y),
    };
    switch (el.typ) {
      case "reihe":      return <ReiheKomponente key={el.id} el={el} {...gemeinsam} />;
      case "tischreihe": return <TischreiheKomponente key={el.id} el={el} {...gemeinsam} />;
      case "rundtisch":  return <RundtischKomponente key={el.id} el={el} {...gemeinsam} />;
    }
  }

  return (
    <Stage
      width={konfiguration.breite}
      height={konfiguration.hoehe}
      onClick={(e) => {
        if (e.target === e.target.getStage()) onAuswaehlen(null);
      }}
    >
      <Layer>
        {/* Hintergrund */}
        <Rect x={0} y={0} width={konfiguration.breite} height={konfiguration.hoehe} fill="#f8fafc" />
        {/* Gitter */}
        {Array.from({ length: Math.ceil(konfiguration.hoehe / 40) }, (_, i) => (
          <Line key={`h${i}`} points={[0, i * 40, konfiguration.breite, i * 40]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
        ))}
        {Array.from({ length: Math.ceil(konfiguration.breite / 40) }, (_, i) => (
          <Line key={`v${i}`} points={[i * 40, 0, i * 40, konfiguration.hoehe]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
        ))}

        {/* Bühne */}
        <BuehneKomponente
          buehne={konfiguration.buehne}
          ausgewaehlt={auswahl?.typ === "buehne"}
          lesemodus={lesemodus}
          onKlick={() => onAuswaehlen(auswahl?.typ === "buehne" ? null : { typ: "buehne" })}
          onDragEnd={onBuehneVerschieben}
          onTransformEnd={onBuehneTransformieren}
          nodeRef={buehneRef}
        />

        {/* Elemente */}
        {konfiguration.elemente.map(renderElement)}

        {/* Transformer für Bühne */}
        {!lesemodus && (
          <Transformer
            ref={trRef}
            rotateEnabled={true}
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 80 || newBox.height < 20) return oldBox;
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
}
