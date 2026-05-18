"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Fehler beim Laden</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
          Diese Seite konnte nicht geladen werden. Das Problem wurde gemeldet.
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
          Erneut versuchen
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
