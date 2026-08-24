import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Beendet die read-only Demo-Session und leitet zur Registrierung. Ohne
// vorheriges Abmelden bliebe der Besucher als Demokonto eingeloggt.
export async function GET(req: NextRequest) {
  // Öffentliche Basis-URL bestimmen — hinter einem Reverse-Proxy (Coolify)
  // meldet req.url den internen Host (localhost:3000). Darum bevorzugt die
  // konfigurierte App-URL bzw. die Forwarded-Header des Proxys nutzen.
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${proto}://${host}` : new URL(req.url).origin);

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/register", base));
}
