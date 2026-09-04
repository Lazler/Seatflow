"use client";

import { Dialog as Modal, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MagicWand as Wand2, CursorClick as MousePointer2, Tag as Tags, FloppyDisk as Save, Compass } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";

export function EditorGuideModal({ open, onClose, onStartTour }: { open: boolean; onClose: () => void; onStartTour: () => void }) {
  const t = useT();

  const schritte = [
    { icon: Wand2, titel: t.editor.guide.schritt1Titel, text: t.editor.guide.schritt1Text },
    { icon: MousePointer2, titel: t.editor.guide.schritt2Titel, text: t.editor.guide.schritt2Text },
    { icon: Tags, titel: t.editor.guide.schritt3Titel, text: t.editor.guide.schritt3Text },
    { icon: Save, titel: t.editor.guide.schritt4Titel, text: t.editor.guide.schritt4Text },
  ];

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.editor.guide.titel}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground -mt-1">{t.editor.guide.intro}</p>
          <div className="space-y-2.5">
            {schritte.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-brand-soft text-brand-deep flex items-center justify-center">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{s.titel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-10" onClick={onStartTour}>
              <Compass className="h-4 w-4 mr-1.5" /> {t.editor.guide.tourStarten}
            </Button>
            <Button className="flex-1 h-10" onClick={onClose}>{t.editor.guide.cta}</Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Modal>
  );
}
