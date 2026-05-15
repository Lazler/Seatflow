"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Save,
  Minus,
  Info,
  GripVertical,
} from "lucide-react";
import type { Reihe, SitzKategorie } from "@/types/sitzplan";

type Props = {
  reihen: Reihe[];
  ausgewaehlteReiheId: string | null;
  speichernLaedt: boolean;
  gesamtSitze: number;
  onReiheHinzufuegen: () => void;
  onReiheLoeschen: (id: string) => void;
  onSitzeAendern: (id: string, delta: number) => void;
  onKategorieAendern: (id: string, kategorie: SitzKategorie) => void;
  onBezeichnungAendern: (id: string, bezeichnung: string) => void;
  onReiheAuswaehlen: (id: string | null) => void;
  onSpeichern: () => void;
};

export default function EditorToolbar({
  reihen,
  ausgewaehlteReiheId,
  speichernLaedt,
  gesamtSitze,
  onReiheHinzufuegen,
  onReiheLoeschen,
  onSitzeAendern,
  onKategorieAendern,
  onBezeichnungAendern,
  onReiheAuswaehlen,
  onSpeichern,
}: Props) {
  const ausgewaehlteReihe = reihen.find((r) => r.id === ausgewaehlteReiheId) ?? null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Kopf */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{reihen.length} Reihen</p>
          <p className="text-xs text-muted-foreground">{gesamtSitze} Sitze gesamt</p>
        </div>
        <Button size="sm" onClick={onReiheHinzufuegen}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Reihe
        </Button>
      </div>

      {/* Ausgewählte Reihe – Eigenschaften */}
      {ausgewaehlteReihe ? (
        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-amber-700 uppercase tracking-wide">
              Reihe bearbeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bezeichnung</Label>
              <Input
                value={ausgewaehlteReihe.bezeichnung}
                onChange={(e) =>
                  onBezeichnungAendern(ausgewaehlteReihe.id, e.target.value.toUpperCase().slice(0, 3))
                }
                className="h-7 text-sm"
                maxLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Anzahl Sitze</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => onSitzeAendern(ausgewaehlteReihe.id, -1)}
                  disabled={ausgewaehlteReihe.anzahlSitze <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">
                  {ausgewaehlteReihe.anzahlSitze}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => onSitzeAendern(ausgewaehlteReihe.id, +1)}
                  disabled={ausgewaehlteReihe.anzahlSitze >= 40}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Kategorie</Label>
              <div className="flex gap-2">
                {(["standard", "premium"] as SitzKategorie[]).map((kat) => (
                  <button
                    key={kat}
                    onClick={() => onKategorieAendern(ausgewaehlteReihe.id, kat)}
                    className={`flex-1 py-1 rounded-md text-xs font-medium border transition-colors ${
                      ausgewaehlteReihe.kategorie === kat
                        ? kat === "premium"
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-blue-600 text-white border-blue-600"
                        : "bg-background text-muted-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {kat === "premium" ? "Premium" : "Standard"}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={() => onReiheLoeschen(ausgewaehlteReihe.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Reihe löschen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Klicke eine Reihe im Plan an, um sie zu bearbeiten.
        </div>
      )}

      {/* Reihen-Liste */}
      <div className="flex-1 overflow-auto space-y-1">
        {reihen.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Noch keine Reihen. Klicke auf „+ Reihe".
          </p>
        ) : (
          reihen
            .slice()
            .sort((a, b) => a.y - b.y)
            .map((reihe) => (
              <button
                key={reihe.id}
                onClick={() =>
                  onReiheAuswaehlen(
                    ausgewaehlteReiheId === reihe.id ? null : reihe.id
                  )
                }
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                  ausgewaehlteReiheId === reihe.id
                    ? "bg-amber-100 text-amber-900"
                    : "hover:bg-muted"
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium w-6">{reihe.bezeichnung}</span>
                <span className="text-muted-foreground text-xs flex-1">
                  {reihe.anzahlSitze} Sitze
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs py-0 ${
                    reihe.kategorie === "premium"
                      ? "border-violet-300 text-violet-700"
                      : "border-blue-300 text-blue-700"
                  }`}
                >
                  {reihe.kategorie === "premium" ? "Prem." : "Std."}
                </Badge>
              </button>
            ))
        )}
      </div>

      {/* Speichern */}
      <Button onClick={onSpeichern} disabled={speichernLaedt} className="w-full">
        {speichernLaedt ? (
          "Wird gespeichert..."
        ) : (
          <>
            <Save className="h-4 w-4 mr-1.5" /> Raumplan speichern
          </>
        )}
      </Button>
    </div>
  );
}
