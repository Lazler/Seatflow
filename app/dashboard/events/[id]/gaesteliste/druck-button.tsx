"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "@phosphor-icons/react";

export default function DruckButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5 mr-1.5" /> Drucken
    </Button>
  );
}
