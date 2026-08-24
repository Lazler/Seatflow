import { NextResponse } from "next/server";

// Festes Read-only-Demokonto. Serverseitig durch restriktive RLS-Policies
// (Migration 20260707120000) sowie durch die Guards unten abgesichert.
export const DEMO_USER_ID = "aaaaaaaa-0000-4000-8000-000000000001";
export const DEMO_EMAIL = "ui-review@seatflow.test";

export function istDemo(userId: string | null | undefined): boolean {
  return userId === DEMO_USER_ID;
}

// Bequemer Guard für API-Routen, die über den Admin-Client schreiben und damit
// RLS umgehen (z. B. manuelle Buchung, Erstattung, E-Mail-Versand). Gibt eine
// 403-Antwort zurück, wenn es das Demokonto ist — sonst null.
export function demoBlockiert(userId: string | null | undefined): NextResponse | null {
  if (!istDemo(userId)) return null;
  return NextResponse.json(
    { error: "Im Demo-Modus nicht verfügbar. Registriere dich kostenlos für ein eigenes Konto.", code: "DEMO_READONLY" },
    { status: 403 },
  );
}
