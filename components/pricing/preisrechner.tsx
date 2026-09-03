"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  labels: {
    heading: string;
    ticketsLabel: string;
    breakevenHint: string;
    upgradeBtn: string;
    currency: string;
  };
  registerPath: string;
};

const FREE_FEE = 1.5;
const PRO_FEE = 0.75;
const PRO_MONTHLY = 29;

export default function Preisrechner({ labels, registerPath }: Props) {
  const [tickets, setTickets] = useState(50);

  const freeCost = tickets * FREE_FEE;
  const proCost = PRO_MONTHLY + tickets * PRO_FEE;
  const savings = freeCost - proCost;
  const breakeven = Math.ceil(PRO_MONTHLY / (FREE_FEE - PRO_FEE));
  const proIsCheaper = tickets >= breakeven;

  return (
    <div className="rounded-xl border border-border bg-background p-6 space-y-5">
      <h3 className="font-semibold">{labels.heading}</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{labels.ticketsLabel}</span>
          <span className="font-semibold tabular-nums">{tickets}</span>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={tickets}
          onChange={(e) => setTickets(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>10</span>
          <span>500</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-lg border p-4 ${!proIsCheaper ? "border-primary bg-primary/[0.04]" : "border-border"}`}>
          <p className="text-xs text-muted-foreground mb-1">Free</p>
          <p className="text-2xl font-bold tabular-nums">
            {labels.currency}{freeCost.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {tickets} × {labels.currency}1,50
          </p>
        </div>
        <div className={`rounded-lg border p-4 ${proIsCheaper ? "border-primary bg-primary/[0.04]" : "border-border"}`}>
          <p className="text-xs text-muted-foreground mb-1">Pro</p>
          <p className="text-2xl font-bold tabular-nums">
            {labels.currency}{proCost.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {labels.currency}29 + {tickets} × {labels.currency}0,75
          </p>
        </div>
      </div>

      {proIsCheaper ? (
        <p className="text-sm text-primary font-medium text-center">
          Pro spart dir {labels.currency}{savings.toFixed(2).replace(".", ",")} / Monat
        </p>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          {labels.breakevenHint.replace("{n}", String(breakeven))}
        </p>
      )}

      <Button className="w-full" asChild>
        <Link href={registerPath}>{labels.upgradeBtn}</Link>
      </Button>
    </div>
  );
}
