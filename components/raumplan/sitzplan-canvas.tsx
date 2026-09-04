"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Stage, Layer, Rect, Circle, Text, Group, Line, Path, Transformer } from "react-konva";
import type Konva from "konva";
import { MagnifyingGlassPlus as ZoomIn, MagnifyingGlassMinus as ZoomOut, CornersOut as Maximize } from "@phosphor-icons/react";
import { fmt } from "@/lib/i18n/buchung";
import { reihenBreite, reihenSitzPositionen, rundtischSitzRadius, rundtischSitzPositionen } from "@/lib/sitzplan-geometrie";
import {
  type SitzplanElement,
  type ReiheElement,
  type TischreiheElement,
  type RundtischElement,
  type StehplatzElement,
  type TextElement,
  type SitzplanKonfiguration,
  type Preiskategorie,
  type Buehne,
  SITZ_RADIUS,
  TISCH_HOEHE,
  TISCH_SITZ_ABSTAND,
  TISCH_SEAT_GAP,
  FARBE_BELEGT,
  FARBE_AUSGEWAEHLT_RING,
  FARBE_SAALFLAECHE,
  FARBE_ELEMENT_SELEKTIERT,
  tischreiheBreite,
  elementSitzIds,
} from "@/types/sitzplan";

export type Auswahl = { typ: "buehne" } | { typ: "element"; ids: string[] } | null;

const DRAG_MARGIN = 40;

// Stabile No-Op-Referenz für memoisierte Element-Props im Buchungsmodus
const NOOP = () => {};

// Rollstuhl-Symbol (Phosphor "Wheelchair", ViewBox 256) für Barrierefrei-Badges
const ROLLSTUHL_PFAD = "M255.59,189.47a8,8,0,0,0-10.12-5.06l-17.42,5.81-28.9-57.8A8,8,0,0,0,192,128H112V104h56a8,8,0,0,0,0-16H112V79a32,32,0,1,0-16,0V89.81A72,72,0,0,0,112,232c33.52,0,63.69-22.71,71.75-54a8,8,0,1,0-15.5-4C162.09,198,137.91,216,112,216A56,56,0,0,1,96,106.34V136a8,8,0,0,0,8,8h83.05l29.79,59.58a8,8,0,0,0,9.69,4l24-8A8,8,0,0,0,255.59,189.47ZM88,48a16,16,0,1,1,16,16A16,16,0,0,1,88,48Z";

// dragBoundFunc arbeitet in Viewport-Koordinaten (inkl. Stage-Scale).
// Für Clamping + Raster-Snapping in Content-Koordinaten umrechnen.
function begrenzeUndSnappe(
  pos: { x: number; y: number },
  stageScale: number, snapRaster: number,
  minX: number, maxX: number, minY: number, maxY: number,
) {
  const s = stageScale || 1;
  let cx = pos.x / s, cy = pos.y / s;
  if (snapRaster > 0) {
    cx = Math.round(cx / snapRaster) * snapRaster;
    cy = Math.round(cy / snapRaster) * snapRaster;
  }
  return {
    x: Math.max(minX, Math.min(maxX, cx)) * s,
    y: Math.max(minY, Math.min(maxY, cy)) * s,
  };
}

// ── Seat component with smooth hover scale animation ──────────────────────────

export type SeatHoverInfo = {
  x: number; y: number;           // Content-Koordinaten des Sitzes
  sitzId: string;
  kategorieName: string;
  preisCent: number;
  barrierefrei?: boolean;
} | null;

type SitzProps = {
  x: number; y: number;
  sitzId: string; nummer: number;
  kategoriefarbe: string;
  kategorieName?: string; kategoriePreisCent?: number;
  belegt: boolean; buchungAusgewaehlt: boolean; editorAusgewaehlt: boolean;
  istBuchungsmodus: boolean; elementWinkel: number;
  nummerAusblenden: boolean;
  sperrModus?: boolean;
  barrierefrei?: boolean;
  // Bei tischweiser Buchung wählt der Käufer den Tisch, nicht den einzelnen
  // Platz — einzelne Sitzkreise sind dann nicht direkt klickbar, Klicks
  // fallen auf den Tisch (Group) durch, siehe TischreiheKomponente/
  // RundtischKomponente.
  tischweiseModus?: boolean;
  onSitzKlick?: (id: string) => void;
  onHoverInfo?: (info: SeatHoverInfo) => void;
};

const SitzKreis = memo(function SitzKreis({ x, y, sitzId, nummer, kategoriefarbe, kategorieName, kategoriePreisCent, belegt, buchungAusgewaehlt, editorAusgewaehlt, istBuchungsmodus, elementWinkel, nummerAusblenden, sperrModus, barrierefrei = false, tischweiseModus = false, onSitzKlick, onHoverInfo }: SitzProps) {
  // Im Sperrmodus sind ALLE Sitze klickbar (auch gesperrte, zum Entsperren)
  const istKlickbar = sperrModus || (istBuchungsmodus && !belegt && !tischweiseModus);

  // Ausgewählte Plätze behalten ihre Kategoriefarbe — erkennbar wird die
  // Auswahl über Ring + Häkchen (siehe unten), nicht über eine zweite Farbe.
  let fill = kategoriefarbe;
  if (belegt)                 fill = FARBE_BELEGT;
  else if (editorAusgewaehlt) fill = FARBE_ELEMENT_SELEKTIERT;

  return (
    <Group x={x} y={y}
      // Nicht-klickbare Sitze (belegt, oder Editor ohne Sperr-/BF-Modus) aus
      // dem Hit-Graph nehmen → Klicks fallen auf die Reihe durch, schnelleres Zeichnen
      listening={istKlickbar}
      onClick={istKlickbar ? (e) => { e.cancelBubble = true; onSitzKlick?.(sitzId); } : undefined}
      onTap={istKlickbar ? (e) => { e.cancelBubble = true; onSitzKlick?.(sitzId); } : undefined}
      onMouseEnter={(e) => {
        if (istKlickbar) {
          (e.currentTarget as unknown as Konva.Node).to({ scaleX: 1.15, scaleY: 1.15, duration: 0.1 });
          e.target.getStage()!.container().style.cursor = "pointer";
          if (onHoverInfo && kategorieName) {
            // Sitzposition in Content-Koordinaten (Stage-Transform herausrechnen)
            const node = e.currentTarget as unknown as Konva.Node;
            const stage = node.getStage()!;
            const abs = node.getAbsolutePosition();
            const inv = stage.getAbsoluteTransform().copy().invert();
            const p = inv.point(abs);
            onHoverInfo({ x: p.x, y: p.y, sitzId, kategorieName, preisCent: kategoriePreisCent ?? 0, barrierefrei });
          }
        }
      }}
      onMouseLeave={(e) => {
        if (istKlickbar) {
          (e.currentTarget as unknown as Konva.Node).to({ scaleX: 1, scaleY: 1, duration: 0.1 });
          e.target.getStage()!.container().style.cursor = "default";
          onHoverInfo?.(null);
        }
      }}
    >
      <Circle
        radius={SITZ_RADIUS}
        fill={fill}
        // Freie Plätze bekommen eine helle Trennlinie, damit eng stehende Sitze
        // nicht verschmelzen. Belegte brauchen keine — sie sollen zurücktreten.
        stroke={buchungAusgewaehlt ? FARBE_AUSGEWAEHLT_RING : belegt ? "transparent" : "rgba(255,255,255,0.85)"}
        strokeWidth={buchungAusgewaehlt ? 3 : 1.5}
        // Schatten NUR auf ausgewählten Sitzen — auf allen wäre es der teuerste
        // Posten beim Layer-Neuzeichnen (killt Zoom/Tap-Performance)
        shadowColor={buchungAusgewaehlt ? FARBE_AUSGEWAEHLT_RING : undefined}
        shadowBlur={buchungAusgewaehlt ? 8 : 0}
        shadowOpacity={buchungAusgewaehlt ? 0.3 : 0}
        shadowEnabled={buchungAusgewaehlt}
        shadowForStrokeEnabled={false}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
      />
      {/* Auswahl-Häkchen: codiert den Zustand über die Form, damit er nie mit
          einer Kategoriefarbe verwechselt werden kann. */}
      {buchungAusgewaehlt && (
        <Group x={SITZ_RADIUS - 4.5} y={-(SITZ_RADIUS - 4.5)} rotation={-elementWinkel} listening={false}>
          <Circle radius={6.5} fill={FARBE_AUSGEWAEHLT_RING} perfectDrawEnabled={false} />
          <Line points={[-2.8, 0.2, -0.9, 2.2, 3, -2.4]} stroke="#ffffff" strokeWidth={1.9}
            lineCap="round" lineJoin="round" perfectDrawEnabled={false} />
        </Group>
      )}
      {!belegt && !nummerAusblenden && (
        <Text
          x={0} y={0} offsetX={SITZ_RADIUS} offsetY={SITZ_RADIUS}
          rotation={-elementWinkel}
          width={SITZ_RADIUS * 2} height={SITZ_RADIUS * 2}
          text={String(nummer)}
          fill="rgba(255,255,255,0.92)" fontSize={9} fontStyle="bold"
          align="center" verticalAlign="middle" listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {/* Barrierefrei-Badge (Rollstuhl-Symbol, immer aufrecht) */}
      {barrierefrei && (
        <Group x={SITZ_RADIUS - 4} y={SITZ_RADIUS - 4} rotation={-elementWinkel} listening={false}>
          <Circle radius={7} fill="#ffffff" stroke="#17181a" strokeWidth={1.2} perfectDrawEnabled={false} />
          <Path data={ROLLSTUHL_PFAD} fill="#17181a"
            x={-4.5} y={-4.5} scaleX={9 / 256} scaleY={9 / 256} perfectDrawEnabled={false} />
        </Group>
      )}
    </Group>
  );
});

// ── Label chip — always upright, always readable ──────────────────────────────

function LabelChip({ x, y, text, winkel, kategoriefarbe }: {
  x: number; y: number; text: string; winkel: number; kategoriefarbe: string;
}) {
  const W = Math.max(22, text.length * 8 + 12);
  const H = 20;
  return (
    <Group x={x} y={y} rotation={-winkel} listening={false}>
      <Rect
        x={-W / 2} y={-H / 2} width={W} height={H}
        fill="rgba(255,255,255,0.97)"
        stroke={kategoriefarbe} strokeWidth={1.5}
        cornerRadius={H / 2}
        shadowColor="#17181a" shadowBlur={6} shadowOpacity={0.12} shadowOffsetY={1}
        perfectDrawEnabled={false} shadowForStrokeEnabled={false}
      />
      <Text
        x={-W / 2} y={-H / 2} width={W} height={H}
        text={text} fill="#17181a" fontSize={11} fontStyle="bold"
        align="center" verticalAlign="middle"
      />
    </Group>
  );
}

// ── Shared element props ──────────────────────────────────────────────────────

type ElementProps<T> = {
  el: T; kategoriefarbe: string; kategorieName: string; kategoriePreisCent: number;
  stageScale: number; snapRaster: number;
  editorAusgewaehlt: boolean;
  belegte: Set<string>; buchungAusgewaehlt: Set<string>; barrierefreie: Set<string>;
  istBuchungsmodus: boolean; raumbreite: number; raumhoehe: number;
  nummerAusblenden: boolean;
  sperrModus?: boolean;
  // Bei Tischen (Tischreihe/Rundtisch): Käufer wählt nur den Tisch + Anzahl,
  // nicht den exakten Platz. Andere Elementtypen ignorieren das Flag.
  tischweiseBuchung: boolean;
  zonenTexte: typeof TEXTE_DEFAULT;
  onKlick: () => void; onDragEnd: (x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  registerNode: (node: Konva.Node | null) => void;
  onSitzKlick?: (sitzId: string) => void;
  onHoverInfo?: (info: SeatHoverInfo) => void;
};

// ── Reihe ─────────────────────────────────────────────────────────────────────

const ReiheKomponente = memo(function ReiheKomponente({ el, kategoriefarbe, kategorieName, kategoriePreisCent, stageScale, snapRaster, sperrModus, editorAusgewaehlt, belegte, buchungAusgewaehlt, barrierefreie, istBuchungsmodus, raumbreite, raumhoehe, nummerAusblenden, onKlick, onDragEnd, onDragMove, registerNode, onSitzKlick, onHoverInfo }: ElementProps<ReiheElement>) {
  const breite = reihenBreite(el);
  const bogen = el.bogen ?? 0;
  const sitze = reihenSitzPositionen(el);
  return (
    <Group ref={registerNode} x={el.x} y={el.y} rotation={el.winkel} offsetX={breite / 2}
      draggable={!istBuchungsmodus && !sperrModus}
      dragBoundFunc={(pos) => begrenzeUndSnappe(pos, stageScale, snapRaster, DRAG_MARGIN, raumbreite - DRAG_MARGIN, DRAG_MARGIN, raumhoehe - DRAG_MARGIN)}
      onClick={!istBuchungsmodus && !sperrModus ? onKlick : undefined} onTap={!istBuchungsmodus && !sperrModus ? onKlick : undefined}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Unsichtbare Hit-Area: im Editor sind einzelne Sitze meist listening=false
          (Performance), damit ohne diese Fläche nichts im Group hit-testbar wäre
          und die Reihe weder anklick- noch verschiebbar wäre. */}
      {!istBuchungsmodus && (
        <Rect
          x={-SITZ_RADIUS - 10} y={-SITZ_RADIUS - 8}
          width={breite + SITZ_RADIUS * 2 + 20} height={SITZ_RADIUS * 2 + 16 + bogen}
          fill="transparent" listening perfectDrawEnabled={false}
        />
      )}
      {/* Row label — pill chip, anchored left of first seat */}
      {!el.labelAusblenden && (
        <LabelChip x={-(SITZ_RADIUS + 20)} y={sitze[0]?.y ?? 0} text={el.bezeichnung} winkel={el.winkel} kategoriefarbe={kategoriefarbe} />
      )}
      {sitze.map(({ sitzId, nummer, x, y }) => (
        <SitzKreis key={sitzId}
          x={x} y={y}
          sitzId={sitzId} nummer={nummer}
          kategoriefarbe={kategoriefarbe}
          belegt={belegte.has(sitzId)}
          buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
          editorAusgewaehlt={editorAusgewaehlt}
          istBuchungsmodus={istBuchungsmodus}
          elementWinkel={el.winkel}
          nummerAusblenden={nummerAusblenden}
          onSitzKlick={onSitzKlick}
          kategorieName={kategorieName} kategoriePreisCent={kategoriePreisCent}
          sperrModus={sperrModus}
          barrierefrei={barrierefreie.has(sitzId)}
          onHoverInfo={onHoverInfo}
        />
      ))}
      {editorAusgewaehlt && (
        <Rect
          x={-SITZ_RADIUS - 10} y={-SITZ_RADIUS - 8}
          width={breite + SITZ_RADIUS * 2 + 20} height={SITZ_RADIUS * 2 + 16 + bogen}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(217,72,31,0.05)" cornerRadius={10}
          dash={[6, 4]} listening={false}
        />
      )}
    </Group>
  );
});

// ── Einzelner Rechtecktisch ───────────────────────────────────────────────────

const TischreiheKomponente = memo(function TischreiheKomponente({ el, kategoriefarbe, kategorieName, kategoriePreisCent, stageScale, snapRaster, sperrModus, tischweiseBuchung, editorAusgewaehlt, belegte, buchungAusgewaehlt, barrierefreie, istBuchungsmodus, raumbreite, raumhoehe, nummerAusblenden, onKlick, onDragEnd, onDragMove, registerNode, onSitzKlick, onHoverInfo }: ElementProps<TischreiheElement>) {
  const tischBreite = el.sitzeProSeite * TISCH_SITZ_ABSTAND;
  const sitzTopY  = -(TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS);
  const sitzBotY  =  (TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS);

  // Selection outline bounds
  const selTop = (el.sitzeOben  ? sitzTopY - SITZ_RADIUS : -TISCH_HOEHE / 2) - 8;
  const selBot = (el.sitzeUnten ? sitzBotY + SITZ_RADIUS :  TISCH_HOEHE / 2) + 8;

  // Tischweise Buchung: Käufer klickt den Tisch statt einen Sitzkreis —
  // der nächste freie Platz am Tisch wird automatisch gewählt.
  const tischweiseModus = istBuchungsmodus && tischweiseBuchung;
  const freieTischSitze = tischweiseModus
    ? elementSitzIds(el).filter((id) => !belegte.has(id) && !buchungAusgewaehlt.has(id))
    : [];
  const tischKlickbar = tischweiseModus && freieTischSitze.length > 0;
  const gruppenKlick = !istBuchungsmodus
    ? (!sperrModus ? onKlick : undefined)
    : (tischKlickbar ? () => onSitzKlick?.(freieTischSitze[0]) : undefined);

  return (
    <Group ref={registerNode} x={el.x} y={el.y} rotation={el.winkel} offsetX={tischBreite / 2}
      draggable={!istBuchungsmodus && !sperrModus}
      dragBoundFunc={(pos) => begrenzeUndSnappe(pos, stageScale, snapRaster, DRAG_MARGIN, raumbreite - DRAG_MARGIN, DRAG_MARGIN, raumhoehe - DRAG_MARGIN)}
      onClick={gruppenKlick} onTap={gruppenKlick}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => {
        const c = e.target.getStage()!.container();
        if (!istBuchungsmodus) c.style.cursor = "grab";
        else if (tischKlickbar) c.style.cursor = "pointer";
      }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Table surface */}
      <Rect
        x={0} y={-TISCH_HOEHE / 2}
        width={tischBreite} height={TISCH_HOEHE}
        fill={kategoriefarbe + "28"}
        stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe}
        strokeWidth={1.5} cornerRadius={6}
        shadowColor={kategoriefarbe} shadowBlur={8} shadowOpacity={0.18} shadowOffsetY={2}
        perfectDrawEnabled={false} shadowForStrokeEnabled={false}
      />
      {/* Table label — on the surface, always upright (like Rundtisch) */}
      <Text
        x={tischBreite / 2} y={0}
        offsetX={tischBreite / 2} offsetY={TISCH_HOEHE / 2}
        rotation={-el.winkel}
        width={tischBreite} height={TISCH_HOEHE}
        text={el.bezeichnung} fill="#17181a" fontSize={11} fontStyle="bold"
        align="center" verticalAlign="middle" listening={false}
      />
      {/* Top seats */}
      {el.sitzeOben && Array.from({ length: el.sitzeProSeite }, (_, i) => {
        const sitzId = `${el.bezeichnung}-${i + 1}`;
        return (
          <SitzKreis key={`o${i}`}
            x={i * TISCH_SITZ_ABSTAND + TISCH_SITZ_ABSTAND / 2} y={sitzTopY}
            sitzId={sitzId} nummer={i + 1}
            kategoriefarbe={kategoriefarbe}
            belegt={belegte.has(sitzId)} buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
            editorAusgewaehlt={editorAusgewaehlt} istBuchungsmodus={istBuchungsmodus}
            elementWinkel={el.winkel} nummerAusblenden={nummerAusblenden} onSitzKlick={onSitzKlick}
            kategorieName={kategorieName} kategoriePreisCent={kategoriePreisCent}
            sperrModus={sperrModus}
            barrierefrei={barrierefreie.has(sitzId)}
            tischweiseModus={tischweiseModus}
            onHoverInfo={onHoverInfo}
          />
        );
      })}
      {/* Bottom seats */}
      {el.sitzeUnten && Array.from({ length: el.sitzeProSeite }, (_, i) => {
        const sitzId = `${el.bezeichnung}-${el.sitzeProSeite + i + 1}`;
        return (
          <SitzKreis key={`u${i}`}
            x={i * TISCH_SITZ_ABSTAND + TISCH_SITZ_ABSTAND / 2} y={sitzBotY}
            sitzId={sitzId} nummer={el.sitzeProSeite + i + 1}
            kategoriefarbe={kategoriefarbe}
            belegt={belegte.has(sitzId)} buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
            editorAusgewaehlt={editorAusgewaehlt} istBuchungsmodus={istBuchungsmodus}
            elementWinkel={el.winkel} nummerAusblenden={nummerAusblenden} onSitzKlick={onSitzKlick}
            kategorieName={kategorieName} kategoriePreisCent={kategoriePreisCent}
            sperrModus={sperrModus}
            barrierefrei={barrierefreie.has(sitzId)}
            tischweiseModus={tischweiseModus}
            onHoverInfo={onHoverInfo}
          />
        );
      })}
      {editorAusgewaehlt && (
        <Rect
          x={-8} y={selTop}
          width={tischBreite + 16} height={selBot - selTop}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(217,72,31,0.05)" cornerRadius={10}
          dash={[6, 4]} listening={false}
        />
      )}
    </Group>
  );
});

// ── Rundtisch ─────────────────────────────────────────────────────────────────

const RundtischKomponente = memo(function RundtischKomponente({ el, kategoriefarbe, kategorieName, kategoriePreisCent, stageScale, snapRaster, sperrModus, tischweiseBuchung, editorAusgewaehlt, belegte, buchungAusgewaehlt, barrierefreie, istBuchungsmodus, raumbreite, raumhoehe, nummerAusblenden, onKlick, onDragEnd, onDragMove, registerNode, onSitzKlick, onHoverInfo }: ElementProps<RundtischElement>) {
  const sitzAbstand = rundtischSitzRadius(el);
  const r = sitzAbstand + SITZ_RADIUS + 8;
  const labelD = el.tischRadius * 2;
  const sitze = rundtischSitzPositionen(el);

  // Tischweise Buchung: Käufer klickt den Tisch statt einen Sitzkreis —
  // der nächste freie Platz am Tisch wird automatisch gewählt.
  const tischweiseModus = istBuchungsmodus && tischweiseBuchung;
  const freieTischSitze = tischweiseModus
    ? elementSitzIds(el).filter((id) => !belegte.has(id) && !buchungAusgewaehlt.has(id))
    : [];
  const tischKlickbar = tischweiseModus && freieTischSitze.length > 0;
  const gruppenKlick = !istBuchungsmodus
    ? (!sperrModus ? onKlick : undefined)
    : (tischKlickbar ? () => onSitzKlick?.(freieTischSitze[0]) : undefined);

  return (
    <Group ref={registerNode} x={el.x} y={el.y} rotation={el.winkel}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => begrenzeUndSnappe(pos, stageScale, snapRaster, r, raumbreite - r, r, raumhoehe - r)}
      onClick={gruppenKlick} onTap={gruppenKlick}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => {
        const c = e.target.getStage()!.container();
        if (!istBuchungsmodus) c.style.cursor = "grab";
        else if (tischKlickbar) c.style.cursor = "pointer";
      }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      {/* Premium round table */}
      <Circle
        radius={el.tischRadius}
        fill={kategoriefarbe + "22"}
        stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe}
        strokeWidth={2}
        shadowColor="#17181a"
        shadowBlur={10}
        shadowOpacity={0.12}
        shadowOffsetY={2}
        perfectDrawEnabled={false} shadowForStrokeEnabled={false}
      />
      {/* Table label — always upright */}
      <Text
        x={0} y={0}
        offsetX={el.tischRadius} offsetY={el.tischRadius}
        rotation={-el.winkel}
        width={labelD} height={labelD}
        text={el.bezeichnung}
        fill="#17181a" fontSize={12} fontStyle="bold"
        align="center" verticalAlign="middle" listening={false}
      />
      {sitze.map(({ sitzId, nummer, x, y }) => (
        <SitzKreis key={sitzId}
          x={x} y={y}
          sitzId={sitzId} nummer={nummer}
          kategoriefarbe={kategoriefarbe}
          belegt={belegte.has(sitzId)}
          buchungAusgewaehlt={buchungAusgewaehlt.has(sitzId)}
          editorAusgewaehlt={editorAusgewaehlt}
          istBuchungsmodus={istBuchungsmodus}
          elementWinkel={el.winkel}
          nummerAusblenden={nummerAusblenden}
          onSitzKlick={onSitzKlick}
          kategorieName={kategorieName} kategoriePreisCent={kategoriePreisCent}
          sperrModus={sperrModus}
          barrierefrei={barrierefreie.has(sitzId)}
          tischweiseModus={tischweiseModus}
          onHoverInfo={onHoverInfo}
        />
      ))}
      {editorAusgewaehlt && (
        <Circle
          radius={sitzAbstand + SITZ_RADIUS + 8}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(217,72,31,0.05)"
          dash={[6, 4]} listening={false}
        />
      )}
    </Group>
  );
});


// ── Stehplatz-Zone ────────────────────────────────────────────────────────────

const StehplatzKomponente = memo(function StehplatzKomponente({ el, kategoriefarbe, kategorieName, kategoriePreisCent, stageScale, snapRaster, editorAusgewaehlt, belegte, buchungAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, zonenTexte, onKlick, onDragEnd, onDragMove, registerNode, onSitzKlick }: ElementProps<StehplatzElement>) {
  const ids = elementSitzIds(el);
  const freie = ids.filter((id) => !belegte.has(id) && !buchungAusgewaehlt.has(id));
  const gewaehlt = ids.filter((id) => buchungAusgewaehlt.has(id)).length;
  const klickbar = istBuchungsmodus && freie.length > 0;

  return (
    <Group ref={registerNode} x={el.x} y={el.y} rotation={el.winkel}
      offsetX={el.breite / 2} offsetY={el.hoehe / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => begrenzeUndSnappe(pos, stageScale, snapRaster,
        DRAG_MARGIN, raumbreite - DRAG_MARGIN, DRAG_MARGIN, raumhoehe - DRAG_MARGIN)}
      onClick={istBuchungsmodus ? (klickbar ? () => onSitzKlick?.(freie[0]) : undefined) : onKlick}
      onTap={istBuchungsmodus ? (klickbar ? () => onSitzKlick?.(freie[0]) : undefined) : onKlick}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => {
        const c = e.target.getStage()!.container();
        if (!istBuchungsmodus) c.style.cursor = "grab";
        else if (klickbar) c.style.cursor = "pointer";
      }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Rect
        width={el.breite} height={el.hoehe}
        fill={kategoriefarbe + (gewaehlt > 0 ? "30" : "16")}
        stroke={editorAusgewaehlt ? FARBE_ELEMENT_SELEKTIERT : kategoriefarbe}
        strokeWidth={1.5} dash={[8, 5]} cornerRadius={10}
      />
      {/* Zentrierte Beschriftung — immer aufrecht */}
      <Group x={el.breite / 2} y={el.hoehe / 2} rotation={-el.winkel} listening={false}>
        <Text
          x={-el.breite / 2} y={-20} width={el.breite} height={16}
          text={`${zonenTexte.stehplatz} ${el.bezeichnung}`}
          fill="#17181a" fontSize={11} fontStyle="bold" letterSpacing={1.5}
          align="center" verticalAlign="middle"
        />
        <Text
          x={-el.breite / 2} y={-2} width={el.breite} height={14}
          text={istBuchungsmodus
            ? (freie.length === 0 && gewaehlt === 0
                ? zonenTexte.zoneAusverkauft
                : `${freie.length} ${zonenTexte.zoneFrei}${gewaehlt > 0 ? ` · ${gewaehlt} ${zonenTexte.zoneGewaehlt}` : ""}`)
            : fmt(zonenTexte.stehplatzInfo, { kapazitaet: el.kapazitaet, kategorieName, preis: (kategoriePreisCent / 100).toLocaleString(zonenTexte.currencyLocale, { style: "currency", currency: "EUR" }) })}
          fill="#6b6e73" fontSize={10}
          align="center" verticalAlign="middle"
        />
        {istBuchungsmodus && klickbar && (
          <Text
            x={-el.breite / 2} y={14} width={el.breite} height={13}
            text={zonenTexte.zoneHinzufuegen}
            fill={kategoriefarbe} fontSize={9.5} fontStyle="bold"
            align="center" verticalAlign="middle"
          />
        )}
      </Group>
      {editorAusgewaehlt && (
        <Rect x={-6} y={-6} width={el.breite + 12} height={el.hoehe + 12}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(217,72,31,0.05)" cornerRadius={12} dash={[6, 4]} listening={false} />
      )}
    </Group>
  );
});

// ── Text-Annotation ───────────────────────────────────────────────────────────

function TextKomponente({ el, stageScale, snapRaster, editorAusgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, zonenTexte, onKlick, onDragEnd, onDragMove, registerNode }: ElementProps<TextElement>) {
  // Bold-Großbuchstaben + letterSpacing brauchen ~0.78 × fontSize pro Zeichen
  const geschaetzteBreite = Math.max(48, el.text.length * el.fontSize * 0.78 + 12);
  const H = el.fontSize * 1.5;
  return (
    <Group ref={registerNode} x={el.x} y={el.y} rotation={el.winkel}
      offsetX={geschaetzteBreite / 2} offsetY={H / 2}
      draggable={!istBuchungsmodus}
      listening={!istBuchungsmodus}
      dragBoundFunc={(pos) => begrenzeUndSnappe(pos, stageScale, snapRaster,
        20, raumbreite - 20, 12, raumhoehe - 12)}
      onClick={!istBuchungsmodus ? onKlick : undefined}
      onTap={!istBuchungsmodus ? onKlick : undefined}
      onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={(e) => { if (!istBuchungsmodus) e.target.getStage()!.container().style.cursor = "grab"; }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
    >
      <Text
        width={geschaetzteBreite} height={H}
        text={el.text || zonenTexte.textFallback}
        fill="#3a3c40" fontSize={el.fontSize} fontStyle="bold" letterSpacing={0.5}
        align="center" verticalAlign="middle"
      />
      {editorAusgewaehlt && (
        <Rect x={-6} y={-4} width={geschaetzteBreite + 12} height={H + 8}
          stroke={FARBE_ELEMENT_SELEKTIERT} strokeWidth={1.5}
          fill="rgba(217,72,31,0.05)" cornerRadius={6} dash={[6, 4]} listening={false} />
      )}
    </Group>
  );
}

// ── Bühne ─────────────────────────────────────────────────────────────────────

function BuehneKomponente({ buehne, ausgewaehlt, istBuchungsmodus, raumbreite, raumhoehe, stageScale, snapRaster, onKlick, onDragEnd, nodeRef }: {
  buehne: Buehne; ausgewaehlt: boolean; istBuchungsmodus: boolean;
  raumbreite: number; raumhoehe: number; stageScale: number; snapRaster: number;
  onKlick: () => void; onDragEnd: (x: number, y: number) => void;
  nodeRef: React.RefObject<Konva.Group | null>;
}) {
  // Compute the stage's visual (screen) width at the current rotation angle.
  // The counter-rotated label must fit within this width to stay inside the shape.
  const θ = buehne.winkel * Math.PI / 180;
  const visW = Math.abs(Math.cos(θ)) * buehne.breite + Math.abs(Math.sin(θ)) * buehne.hoehe;
  const visH = Math.abs(Math.sin(θ)) * buehne.breite + Math.abs(Math.cos(θ)) * buehne.hoehe;
  const labelW = Math.max(50, Math.min(visW - 16, 240));
  const labelH = Math.max(20, Math.min(visH - 8, 32));

  return (
    <Group ref={nodeRef} x={buehne.x} y={buehne.y} rotation={buehne.winkel}
      offsetX={buehne.breite / 2} offsetY={buehne.hoehe / 2}
      draggable={!istBuchungsmodus}
      dragBoundFunc={(pos) => begrenzeUndSnappe(pos, stageScale, snapRaster,
        visW / 2 + 4, raumbreite - visW / 2 - 4, visH / 2 + 4, raumhoehe - visH / 2 - 4)}
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
        fillLinearGradientColorStops={[0, "#3a3c40", 1, "#17181a"]}
        cornerRadius={8}
        stroke={ausgewaehlt ? FARBE_ELEMENT_SELEKTIERT : "rgba(255,255,255,0.10)"}
        strokeWidth={ausgewaehlt ? 2 : 1}
        shadowColor="#000000"
        shadowBlur={20}
        shadowOpacity={0.32}
        shadowOffsetY={4}
        perfectDrawEnabled={false} shadowForStrokeEnabled={false}
      />
      {/* Stage label — counter-rotated, bounded to visual footprint */}
      <Text
        x={buehne.breite / 2} y={buehne.hoehe / 2}
        offsetX={labelW / 2} offsetY={labelH / 2}
        rotation={-buehne.winkel}
        width={labelW} height={labelH}
        text={buehne.label}
        fill="rgba(248,250,252,0.92)" fontSize={11} fontStyle="bold" letterSpacing={3}
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
  // Barrierefreie Plätze — Badge im Canvas, Hinweis im Tooltip
  barrierefreieSitze?: Set<string>;
  onSitzKlicken?: (sitzId: string) => void;
  snapRaster?: number;
  // Editor-Sperrmodus: Sitze anklickbar zum Sperren/Entsperren
  sperrModus?: boolean;
  // Lokalisierte Texte für Buchungs- UND Editor-Modus.
  // Buchungsmodus liefert die Zonen-/Zoom-Texte, Editor-Modus die editorAria/
  // textFallback/stehplatzInfo/currencyLocale-Felder — daher alle optional und
  // per TEXTE_DEFAULT aufgefüllt.
  texte?: Partial<typeof TEXTE_DEFAULT>;
};

const TEXTE_DEFAULT = {
  zoneFrei: "frei",
  zoneGewaehlt: "gewählt",
  zoneHinzufuegen: "+ Tippen zum Hinzufügen",
  zoneAusverkauft: "ausverkauft",
  canvasAria: "Sitzplan – klicke auf einen Platz, um ihn auszuwählen",
  barrierefrei: "barrierefrei",
  stehplatz: "STEHPLATZ",
  zoomVergroessern: "Vergrößern",
  zoomVerkleinern: "Verkleinern",
  zoomReset: "Ansicht zurücksetzen",
  // Editor-Modus
  editorAria: "Sitzplan-Editor",
  textFallback: "Text",
  stehplatzInfo: "{kapazitaet} Personen · {kategorieName} {preis}",
  currencyLocale: "de-DE",
};

export default function SitzplanCanvas({
  konfiguration, modus, renderScale = 1,
  auswahl, onAuswaehlen, onElementVerschieben, onMehrereElementeVerschieben, onBuehneVerschieben, onBuehneTransformiert,
  belegteSitze = new Set(), ausgewaehlteSitze = new Set(), onSitzKlicken,
  barrierefreieSitze = new Set(), snapRaster = 0, sperrModus = false, texte,
}: Props) {
  const txt = { ...TEXTE_DEFAULT, ...texte };
  const buehneRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const istBuchungsmodus = modus === "buchung";
  // Kein Cap mehr bei 1 — der Editor-Zoom skaliert bewusst über 1 hinaus
  const scale = renderScale;

  // ── Zoom & Pan (nur Buchungsmodus) ──────────────────────────────────────────
  const MIN_ZOOM = 1, MAX_ZOOM = 3.5;
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  // Laufende Wahrheit während einer Geste — ohne React-Render pro Frame.
  // Der State (zoom/stagePos) wird erst am Gestenende committet.
  const zoomRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);
  const commitTimerRef = useRef<number | null>(null);
  const pinchRef = useRef<{ dist: number; center: { x: number; y: number } } | null>(null);
  const [tooltip, setTooltip] = useState<SeatHoverInfo>(null);

  const viewportW = konfiguration.breite * scale;
  const viewportH = konfiguration.hoehe * scale;

  const clampPos = useCallback((pos: { x: number; y: number }, z: number) => ({
    x: Math.min(0, Math.max(viewportW * (1 - z), pos.x)),
    y: Math.min(0, Math.max(viewportH * (1 - z), pos.y)),
  }), [viewportW, viewportH]);

  // Zoom/Pan imperativ auf den Stage-Node schreiben (60 fps, kein Re-Render).
  const liveApply = useCallback((z: number, pos: { x: number; y: number }) => {
    zoomRef.current = z;
    posRef.current = pos;
    const st = stageRef.current;
    if (!st) return;
    st.scale({ x: scale * z, y: scale * z });
    st.position(pos);
    st.batchDraw();
  }, [scale]);

  // Ref-Werte in den React-State übernehmen (einmalig, am Gestenende)
  const commit = useCallback(() => {
    setZoom(zoomRef.current);
    setStagePos(posRef.current);
  }, []);

  // ── Layer-Caching während Gesten ────────────────────────────────────────────
  // Der Flaschenhals ist die Node-Zahl (Hunderte Sitze × Kreis+Text). Beim
  // Pinch/Pan rastern wir den Layer EINMAL zu einer Bitmap — danach wird nur
  // noch dieses eine Bild transformiert (unabhängig von der Sitzanzahl). Am
  // Gestenende wird der Cache verworfen → wieder gestochen scharf.
  const layerRef = useRef<Konva.Layer>(null);
  const cacheAktivRef = useRef(false);
  // Konva-Knoten aller Elemente, per id — damit bei Mehrfachauswahl während des
  // Ziehens (onDragMove) auch die NICHT gegriffenen Elemente live mitwandern,
  // statt erst beim Loslassen zu springen. Direkte Node-Mutation statt
  // React-State pro Frame, sonst würde jede Maus-Bewegung einen History-Eintrag
  // erzeugen und Dutzende Re-Renders pro Sekunde auslösen.
  const elementNodesRef = useRef<Map<string, Konva.Node>>(new Map());
  const layerCachen = useCallback(() => {
    const l = layerRef.current;
    if (l && !cacheAktivRef.current) {
      // moderater pixelRatio: scharf genug nahe Basiszoom, günstig zu erzeugen
      l.cache({ pixelRatio: 1.5 });
      cacheAktivRef.current = true;
    }
  }, []);
  const layerEntcachen = useCallback(() => {
    const l = layerRef.current;
    if (l && cacheAktivRef.current) {
      l.clearCache();
      cacheAktivRef.current = false;
      l.batchDraw();
    }
  }, []);

  useEffect(() => () => { if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current); }, []);

  // Zoomt so, dass der Punkt (Viewport-Koordinaten) an Ort und Stelle bleibt.
  // defer=true committet verzögert (Wheel/Trackpad feuert in schneller Folge).
  const applyZoom = useCallback((point: { x: number; y: number }, zielZoom: number, defer = false) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zielZoom));
    if (z === 1) {
      liveApply(1, { x: 0, y: 0 });
    } else {
      const curZoom = zoomRef.current;
      const curPos = posRef.current;
      const c = {
        x: (point.x - curPos.x) / (scale * curZoom),
        y: (point.y - curPos.y) / (scale * curZoom),
      };
      liveApply(z, clampPos({ x: point.x - c.x * scale * z, y: point.y - c.y * scale * z }, z));
    }
    if (defer) {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = window.setTimeout(commit, 140);
    } else {
      commit();
    }
  }, [scale, clampPos, liveApply, commit]);

  const viewportMitte = { x: viewportW / 2, y: viewportH / 2 };

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

  if (scale <= 0 || raumbreite <= 0 || raumhoehe <= 0) return null;

  function renderElement(el: SitzplanElement) {
    const istAusgewaehlt = auswahl?.typ === "element" && auswahl.ids.includes(el.id);
    const kat = kategorienMap.get(el.kategorie_id);
    const gemeinsam = {
      kategoriefarbe: kat?.farbe ?? "#3a3c40",
      kategorieName: kat?.name ?? "",
      kategoriePreisCent: kat?.preis_cent ?? 0,
      stageScale: scale,
      snapRaster,
      sperrModus,
      tischweiseBuchung: konfiguration.tischweiseBuchung ?? false,
      zonenTexte: txt,
      onHoverInfo: istBuchungsmodus ? setTooltip : undefined,
      editorAusgewaehlt: istAusgewaehlt,
      belegte: belegteSitze,
      buchungAusgewaehlt: ausgewaehlteSitze,
      barrierefreie: barrierefreieSitze,
      istBuchungsmodus,
      raumbreite,
      raumhoehe,
      nummerAusblenden: el.nummerAusblenden ?? false,
      // Im Buchungsmodus sind Elemente nicht klick-/ziehbar — stabile NOOPs,
      // damit die memoisierten Element-Komponenten nicht bei jedem Render neue
      // Callback-Identitäten sehen (sonst greift memo nicht).
      onKlick: istBuchungsmodus ? NOOP : () => {
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
      onDragEnd: istBuchungsmodus ? NOOP : (x: number, y: number) => {
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
      // Live-Vorschau während des Ziehens: bei Mehrfachauswahl die anderen
      // ausgewählten Elemente per direkter Node-Mutation mitziehen (kein
      // State-Update pro Frame — das committet erst onDragEnd oben).
      onDragMove: istBuchungsmodus ? NOOP : (x: number, y: number) => {
        const selectedIds = auswahl?.typ === "element" ? auswahl.ids : [];
        if (selectedIds.length <= 1 || !selectedIds.includes(el.id)) return;
        const dx = x - el.x; const dy = y - el.y;
        for (const otherId of selectedIds) {
          if (otherId === el.id) continue;
          const otherEl = konfiguration.elemente.find((e) => e.id === otherId);
          const node = elementNodesRef.current.get(otherId);
          if (!otherEl || !node) continue;
          node.x(Math.max(DRAG_MARGIN, Math.min(raumbreite - DRAG_MARGIN, otherEl.x + dx)));
          node.y(Math.max(DRAG_MARGIN, Math.min(raumhoehe - DRAG_MARGIN, otherEl.y + dy)));
        }
        layerRef.current?.batchDraw();
      },
      registerNode: istBuchungsmodus ? NOOP : (node: Konva.Node | null) => {
        if (node) elementNodesRef.current.set(el.id, node);
        else elementNodesRef.current.delete(el.id);
      },
      onSitzKlick: onSitzKlicken,
    };
    switch (el.typ) {
      case "reihe":      return <ReiheKomponente      key={el.id} el={el} {...gemeinsam} />;
      case "tischreihe": return <TischreiheKomponente key={el.id} el={el} {...gemeinsam} />;
      case "rundtisch":  return <RundtischKomponente  key={el.id} el={el} {...gemeinsam} />;
      case "stehplatz":  return <StehplatzKomponente  key={el.id} el={el} {...gemeinsam} />;
      case "text":       return <TextKomponente       key={el.id} el={el} {...gemeinsam} />;
    }
  }

  const effektiverZoom = istBuchungsmodus ? zoom : 1;

  return (
    <div
      className="relative"
      style={istBuchungsmodus ? { touchAction: zoom > 1 ? "none" : "pan-y" } : undefined}
    >
    <Stage
      ref={stageRef}
      width={raumbreite * scale} height={raumhoehe * scale}
      scale={{ x: scale * effektiverZoom, y: scale * effektiverZoom }}
      x={istBuchungsmodus ? stagePos.x : 0}
      y={istBuchungsmodus ? stagePos.y : 0}
      draggable={istBuchungsmodus && zoom > 1}
      dragBoundFunc={(pos) => clampPos(pos, zoomRef.current)}
      onDragStart={(e) => { if (istBuchungsmodus && e.target === e.target.getStage()) layerCachen(); }}
      onDragEnd={(e) => {
        if (istBuchungsmodus && e.target === e.target.getStage()) {
          const pos = { x: e.target.x(), y: e.target.y() };
          posRef.current = pos;
          layerEntcachen();
          setStagePos(pos);
        }
      }}
      role={istBuchungsmodus ? "application" : undefined}
      aria-label={istBuchungsmodus ? txt.canvasAria : txt.editorAria}
      onWheel={(e) => {
        // Ctrl/Cmd+Scroll und Trackpad-Pinch zoomen; normales Scrollen bleibt Scrollen
        if (!istBuchungsmodus || (!e.evt.ctrlKey && !e.evt.metaKey)) return;
        e.evt.preventDefault();
        const p = e.target.getStage()!.getPointerPosition();
        if (!p) return;
        applyZoom(p, zoomRef.current * (e.evt.deltaY < 0 ? 1.15 : 1 / 1.15), true);
      }}
      onDblClick={(e) => {
        if (!istBuchungsmodus) return;
        // Nur auf leerer Fläche — schnelle Klicks auf benachbarte Sitze
        // sind Auswahl, kein Zoom
        const tid = (e.target as Konva.Shape).id?.() ?? "";
        if (e.target !== e.target.getStage() && tid !== "bg") return;
        const p = e.target.getStage()!.getPointerPosition();
        if (p) applyZoom(p, zoomRef.current > 1 ? 1 : 2);
      }}
      onDblTap={(e) => {
        if (!istBuchungsmodus) return;
        const tid = (e.target as Konva.Shape).id?.() ?? "";
        if (e.target !== e.target.getStage() && tid !== "bg") return;
        const p = e.target.getStage()!.getPointerPosition();
        if (p) applyZoom(p, zoomRef.current > 1 ? 1 : 2);
      }}
      onTouchStart={(e) => {
        // Zwei-Finger-Start → Layer für die Pinch-Geste cachen
        if (istBuchungsmodus && e.evt.touches.length === 2) layerCachen();
      }}
      onTouchMove={(e) => {
        if (!istBuchungsmodus || e.evt.touches.length !== 2) return;
        e.evt.preventDefault();
        const stage = e.target.getStage()!;
        if (stage.isDragging()) stage.stopDrag();
        const rect = stage.container().getBoundingClientRect();
        const [t1, t2] = [e.evt.touches[0], e.evt.touches[1]];
        const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
        const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const prev = pinchRef.current;
        if (prev) {
          // Pinch = Zoom um das (bewegte) Fingerzentrum → zoomt und pannt zugleich.
          // Rein imperativ (liveApply) — kein React-Render pro Frame.
          const curZoom = zoomRef.current;
          const curPos = posRef.current;
          const c = {
            x: (prev.center.x - curPos.x) / (scale * curZoom),
            y: (prev.center.y - curPos.y) / (scale * curZoom),
          };
          const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, curZoom * (dist / prev.dist)));
          liveApply(z, z === 1
            ? { x: 0, y: 0 }
            : clampPos({ x: center.x - c.x * scale * z, y: center.y - c.y * scale * z }, z));
        }
        pinchRef.current = { dist, center };
      }}
      onTouchEnd={() => {
        // Erst am Gestenende in den React-State übernehmen (ein Render)
        if (pinchRef.current) { pinchRef.current = null; layerEntcachen(); commit(); }
      }}
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
      <Layer ref={layerRef}>
        {/* Background — Buchungsmodus: dunkler Bühnenrahmen (die Marke). Editor: helle Bone-Fläche. */}
        <Rect id="bg" x={0} y={0} width={raumbreite} height={raumhoehe}
          fill={istBuchungsmodus ? FARBE_SAALFLAECHE : "#ffffff"} />
        {/* Editor-Raster (nur im Editor sichtbar) */}
        {!istBuchungsmodus && Array.from({ length: Math.ceil(raumhoehe / 40) }, (_, i) => (
          <Line key={`h${i}`} points={[0, i * 40, raumbreite, i * 40]} stroke="#e5e5e7" strokeWidth={0.75} listening={false} />
        ))}
        {!istBuchungsmodus && Array.from({ length: Math.ceil(raumbreite / 40) }, (_, i) => (
          <Line key={`v${i}`} points={[i * 40, 0, i * 40, raumhoehe]} stroke="#e5e5e7" strokeWidth={0.75} listening={false} />
        ))}
        {/* Canvas border */}
        <Rect x={0} y={0} width={raumbreite} height={raumhoehe}
          stroke="#e2e5ea" strokeWidth={1.5} fill="transparent" listening={false} />
        {/* Stage / Bühne */}
        <BuehneKomponente
          buehne={konfiguration.buehne} ausgewaehlt={auswahl?.typ === "buehne"}
          istBuchungsmodus={istBuchungsmodus} raumbreite={raumbreite} raumhoehe={raumhoehe}
          stageScale={scale} snapRaster={snapRaster}
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
        {/* Sitz-Tooltip (Desktop-Hover im Buchungsmodus) */}
        {istBuchungsmodus && tooltip && (() => {
          const zeile1 = tooltip.sitzId;
          const zeile2 = `${tooltip.kategorieName} · ${(tooltip.preisCent / 100).toLocaleString(txt.currencyLocale, { style: "currency", currency: "EUR" })}${tooltip.barrierefrei ? ` · ${txt.barrierefrei}` : ""}`;
          const W = Math.max(zeile1.length, zeile2.length) * 6.6 + 20;
          const H = 40;
          return (
            <Group x={tooltip.x} y={tooltip.y - SITZ_RADIUS - 10} listening={false}>
              <Rect x={-W / 2} y={-H} width={W} height={H}
                fill="#17181a" cornerRadius={8} opacity={0.94}
                shadowColor="#17181a" shadowBlur={12} shadowOpacity={0.25} shadowOffsetY={2} />
              {/* Pfeilspitze */}
              <Line points={[-5, 0, 5, 0, 0, 5]} closed fill="#17181a" opacity={0.94} />
              <Text x={-W / 2} y={-H + 6} width={W} height={14} text={zeile1}
                fill="#ffffff" fontSize={12} fontStyle="bold" align="center" />
              <Text x={-W / 2} y={-H + 21} width={W} height={13} text={zeile2}
                fill="rgba(255,255,255,0.75)" fontSize={10.5} align="center" />
            </Group>
          );
        })()}
      </Layer>
    </Stage>

    {/* Zoom-Controls (nur Buchungsmodus) */}
    {istBuchungsmodus && (
      <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
        <button type="button" aria-label={txt.zoomVergroessern}
          onClick={() => applyZoom(viewportMitte, zoom * 1.5)}
          disabled={zoom >= MAX_ZOOM}
          className="h-9 w-9 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition disabled:opacity-40">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button type="button" aria-label={txt.zoomVerkleinern}
          onClick={() => applyZoom(viewportMitte, zoom / 1.5)}
          disabled={zoom <= MIN_ZOOM}
          className="h-9 w-9 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition disabled:opacity-40">
          <ZoomOut className="h-4 w-4" />
        </button>
        {zoom > 1 && (
          <button type="button" aria-label={txt.zoomReset}
            onClick={() => applyZoom(viewportMitte, 1)}
            className="h-9 w-9 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition">
            <Maximize className="h-4 w-4" />
          </button>
        )}
      </div>
    )}
    </div>
  );
}
