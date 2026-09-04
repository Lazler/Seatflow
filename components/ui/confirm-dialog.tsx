"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
};

// Gemeinsamer Ja/Nein-Dialog für Warnungen, die früher `window.confirm()`
// nutzten — Modal statt native Browser-Abfrage, damit Styling und Sprache
// konsistent zum Rest der App bleiben.
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, cancelLabel, onConfirm, destructive = true,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <DialogBody>
          <DialogDescription>{description}</DialogDescription>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
            <Button variant={destructive ? "destructive" : "default"} onClick={() => { onOpenChange(false); onConfirm(); }}>
              {confirmLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
