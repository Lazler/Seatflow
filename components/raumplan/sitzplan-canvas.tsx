"use client";

import { Stage, Layer, Rect, Circle, Text, Group, Line } from "react-konva";
import type Konva from "konva";
import {
  type Reihe,
  type SitzplanKonfiguration,
  SITZ_RADIUS,
  SITZ_FARBE,
  SITZ_FARBE_AUSGEWAEHLT,
  reiheStartX,
} from "@/types/sitzplan";

const BUEHNE_Y = 20;
const BUEHNE_HOEHE = 44;
const REIHEN_OFFSET_Y = BUEHNE_Y + BUEHNE_HOEHE + 50; // erste Reihe unter der Bühne

type Props = {
  konfiguration: SitzplanKonfiguration;
  ausgewaehlteReiheId: string | null;
  onReiheAuswaehlen: (id: string | null) => void;
  onReiheVerschieben: (id: string, neuesY: number) => void;
  belegteStize?: Set<string>; // für die Buchungsseite
  lesemodusNurAnzeigen?: boolean;
};

export default function SitzplanCanvas({
  konfiguration,
  ausgewaehlteReiheId,
  onReiheAuswaehlen,
  onReiheVerschieben,
  belegteStize,
  lesemodusNurAnzeigen = false,
}: Props) {
  const { breite, hoehe, buehne, reihen } = konfiguration;
  const buehneX = (breite - buehne.breite) / 2;

  function handleReiheKlick(reihe: Reihe) {
    if (lesemodusNurAnzeigen) return;
    onReiheAuswaehlen(
      ausgewaehlteReiheId === reihe.id ? null : reihe.id
    );
  }

  function handleDragEnd(reihe: Reihe, e: Konva.KonvaEventObject<DragEvent>) {
    const neuesY = Math.max(
      REIHEN_OFFSET_Y,
      Math.round(e.target.y() / 10) * 10 // auf 10px einrasten
    );
    e.target.y(neuesY);
    onReiheVerschieben(reihe.id, neuesY);
  }

  return (
    <Stage
      width={breite}
      height={hoehe}
      onClick={(e) => {
        if (e.target === e.target.getStage()) onReiheAuswaehlen(null);
      }}
      style={{ cursor: lesemodusNurAnzeigen ? "default" : "default" }}
    >
      <Layer>
        {/* Hintergrund */}
        <Rect x={0} y={0} width={breite} height={hoehe} fill="#f8fafc" />

        {/* Gitterlinien */}
        {Array.from({ length: Math.floor(hoehe / 40) }, (_, i) => (
          <Line
            key={`h-${i}`}
            points={[0, i * 40, breite, i * 40]}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        ))}

        {/* Bühne */}
        <Rect
          x={buehneX}
          y={BUEHNE_Y}
          width={buehne.breite}
          height={BUEHNE_HOEHE}
          fill="#1e293b"
          cornerRadius={6}
        />
        <Text
          x={buehneX}
          y={BUEHNE_Y + 14}
          width={buehne.breite}
          text={buehne.label}
          fill="#f8fafc"
          fontSize={14}
          fontStyle="bold"
          letterSpacing={4}
          align="center"
        />

        {/* Reihen */}
        {reihen.map((reihe) => {
          const istAusgewaehlt = reihe.id === ausgewaehlteReiheId;
          const startX = reiheStartX(reihe, breite);
          const farbe = istAusgewaehlt ? SITZ_FARBE_AUSGEWAEHLT : SITZ_FARBE[reihe.kategorie];

          return (
            <Group
              key={reihe.id}
              x={0}
              y={reihe.y}
              draggable={!lesemodusNurAnzeigen}
              onClick={() => handleReiheKlick(reihe)}
              onDragEnd={(e) => handleDragEnd(reihe, e)}
              onMouseEnter={(e) => {
                if (!lesemodusNurAnzeigen)
                  e.target.getStage()!.container().style.cursor = "grab";
              }}
              onMouseLeave={(e) => {
                e.target.getStage()!.container().style.cursor = "default";
              }}
            >
              {/* Reihen-Bezeichnung links */}
              <Text
                x={startX - 36}
                y={-SITZ_RADIUS}
                width={30}
                height={SITZ_RADIUS * 2}
                text={reihe.bezeichnung}
                fill="#64748b"
                fontSize={12}
                fontStyle="bold"
                verticalAlign="middle"
                align="right"
              />

              {/* Sitze */}
              {Array.from({ length: reihe.anzahlSitze }, (_, i) => {
                const sitzId = `${reihe.bezeichnung}-${i + 1}`;
                const belegt = belegteStize?.has(sitzId) ?? false;
                const sitzFarbe = belegt ? "#94a3b8" : farbe;

                return (
                  <Group key={sitzId} x={startX + i * reihe.sitzAbstand} y={0}>
                    <Circle
                      x={0}
                      y={0}
                      radius={SITZ_RADIUS}
                      fill={sitzFarbe}
                      opacity={belegt ? 0.4 : 1}
                    />
                    <Text
                      x={-SITZ_RADIUS}
                      y={-7}
                      width={SITZ_RADIUS * 2}
                      text={String(i + 1)}
                      fill="white"
                      fontSize={9}
                      align="center"
                    />
                  </Group>
                );
              })}

              {/* Reihen-Bezeichnung rechts */}
              <Text
                x={startX + (reihe.anzahlSitze - 1) * reihe.sitzAbstand + SITZ_RADIUS + 6}
                y={-SITZ_RADIUS}
                width={30}
                height={SITZ_RADIUS * 2}
                text={reihe.bezeichnung}
                fill="#64748b"
                fontSize={12}
                fontStyle="bold"
                verticalAlign="middle"
              />

              {/* Auswahlrahmen */}
              {istAusgewaehlt && (
                <Rect
                  x={startX - SITZ_RADIUS - 8}
                  y={-SITZ_RADIUS - 6}
                  width={
                    (reihe.anzahlSitze - 1) * reihe.sitzAbstand +
                    SITZ_RADIUS * 2 +
                    16
                  }
                  height={SITZ_RADIUS * 2 + 12}
                  stroke={SITZ_FARBE_AUSGEWAEHLT}
                  strokeWidth={2}
                  fill="transparent"
                  cornerRadius={8}
                  dash={[6, 3]}
                />
              )}
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
