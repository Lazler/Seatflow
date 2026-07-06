"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, UploadSimple, Trash, CircleNotch } from "@phosphor-icons/react";

// Event-Bild: Hero auf der Buchungsseite. Upload in den öffentlichen
// Storage-Bucket "event-bilder" (Ordner = eigene User-ID, per RLS erzwungen).
export default function EventBild({ eventId, userId, initialBildUrl }: {
  eventId: string;
  userId: string;
  initialBildUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [bildUrl, setBildUrl] = useState(initialBildUrl);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function hochladen(datei: File) {
    if (datei.size > 5 * 1024 * 1024) { setFehler("Maximal 5 MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(datei.type)) {
      setFehler("Nur JPG, PNG oder WebP."); return;
    }
    setLaedt(true);
    setFehler(null);
    const supabase = createClient();
    const endung = datei.type === "image/png" ? "png" : datei.type === "image/webp" ? "webp" : "jpg";
    const pfad = `${userId}/${eventId}-${crypto.randomUUID().slice(0, 8)}.${endung}`;

    const { error: uploadFehler } = await supabase.storage
      .from("event-bilder")
      .upload(pfad, datei, { cacheControl: "31536000", upsert: false });
    if (uploadFehler) { setLaedt(false); setFehler(`Upload fehlgeschlagen: ${uploadFehler.message}`); return; }

    const { data: { publicUrl } } = supabase.storage.from("event-bilder").getPublicUrl(pfad);
    const { error: dbFehler } = await supabase
      .from("events")
      .update({ bild_url: publicUrl })
      .eq("id", eventId);
    setLaedt(false);
    if (dbFehler) { setFehler("Speichern fehlgeschlagen."); return; }
    setBildUrl(publicUrl);
    router.refresh();
  }

  async function entfernen() {
    setLaedt(true);
    const supabase = createClient();
    await supabase.from("events").update({ bild_url: null }).eq("id", eventId);
    // Datei im Storage bewusst behalten (könnte von Kopien referenziert sein)
    setLaedt(false);
    setBildUrl(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Event-Bild
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bildUrl ? (
          <div className="space-y-2">
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-border bg-muted">
              <Image src={bildUrl} alt="Event-Bild" fill unoptimized className="object-cover" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={laedt}>
                {laedt ? <CircleNotch className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UploadSimple className="h-3.5 w-3.5 mr-1.5" />}
                Ersetzen
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive"
                onClick={entfernen} disabled={laedt}>
                <Trash className="h-3.5 w-3.5 mr-1.5" /> Entfernen
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={laedt}
            className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            {laedt
              ? <CircleNotch className="h-6 w-6 animate-spin" />
              : <>
                  <UploadSimple className="h-6 w-6" />
                  <span className="text-sm font-medium">Bild hochladen</span>
                  <span className="text-xs">JPG, PNG oder WebP · max. 5 MB · ideal 1600×533</span>
                </>}
          </button>
        )}
        <input
          ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" aria-label="Event-Bild wählen"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) hochladen(f); e.target.value = ""; }}
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Wird als Kopfbild auf der Buchungsseite angezeigt und macht sie zur
          vollwertigen Veranstaltungsseite.
        </p>
        {fehler && <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fehler}</p>}
      </CardContent>
    </Card>
  );
}
