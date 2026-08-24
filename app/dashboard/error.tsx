"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { Warning as AlertTriangle, ArrowCounterClockwise as RotateCcw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t.fehlerSeite.titel}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
          {t.fehlerSeite.text}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
            ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          {t.fehlerSeite.erneut}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">{t.dashboard.title}</Link>
        </Button>
      </div>
    </div>
  );
}
