import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Ziel aller Auth-E-Mail-Links (Registrierungs-Bestätigung, Passwort-Reset,
// Magic-Link). Tauscht den PKCE-`code` bzw. `token_hash` gegen eine Session
// und leitet dann weiter. Supabase muss diese URL in den erlaubten
// Redirect-URLs führen.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextRaw = searchParams.get("next") ?? "/dashboard";

  // Open-Redirect verhindern: nur interne Pfade zulassen
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  // Absolute Basis hinter dem Reverse-Proxy (Coolify) bestimmen
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${proto}://${host}` : new URL(req.url).origin);
  const ziel = (pfad: string) => NextResponse.redirect(new URL(pfad, base));

  const supabase = await createClient();

  // PKCE-Code (Standard-Templates, redirect_to?code=…)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return ziel(next);
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
  } else if (tokenHash && type) {
    // token_hash-Flow (empfohlene SSR-Templates — geräteunabhängig)
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return ziel(next);
    console.error("[auth/callback] verifyOtp:", error.message);
  }

  // Fehlgeschlagen / abgelaufen → zurück zur Anmeldung mit Hinweis
  console.error("[auth/callback] kein gültiger code/token_hash im Link:", {
    hatCode: Boolean(code),
    hatTokenHash: Boolean(tokenHash),
    type,
    next,
  });
  return ziel("/login?fehler=link");
}
