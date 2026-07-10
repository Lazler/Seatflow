"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";

export default function DruckButton() {
  const t = useT();
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5 mr-1.5" /> {t.gaesteliste.drucken}
    </Button>
  );
}
