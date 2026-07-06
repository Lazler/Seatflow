"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Warning as AlertTriangle, ArrowCounterClockwise as RotateCcw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[200px]">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Komponente konnte nicht geladen werden</p>
          <p className="text-xs text-muted-foreground mt-1">
            {this.state.error?.message ?? "Unbekannter Fehler"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Erneut laden
        </Button>
      </div>
    );
  }
}
