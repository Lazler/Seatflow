import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_EMAIL } from "@/lib/demo";

// Meldet den Besucher ohne Eingabe im read-only Demokonto an und leitet ins
// Dashboard. Nutzt den Admin-Client, um serverseitig ein Magic-Link-Token zu
// erzeugen, und löst es sofort über die SSR-Session ein (setzt die Cookies).
export async function GET(req: NextRequest) {
  // Öffentliche Basis-URL bestimmen — hinter einem Reverse-Proxy (Coolify)
  // meldet req.url den internen Host (localhost:3000). Darum bevorzugt die
  // konfigurierte App-URL bzw. die Forwarded-Header des Proxys nutzen.
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${proto}://${host}` : new URL(req.url).origin);
  const ziel = (pfad: string) => NextResponse.redirect(new URL(pfad, base));

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // Ohne Service-Key kein Demo-Login möglich → zur Registrierung
    return ziel("/register");
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_EMAIL,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[demo/login] generateLink fehlgeschlagen:", error);
    return ziel("/login");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) {
    console.error("[demo/login] verifyOtp fehlgeschlagen:", verifyError);
    return ziel("/login");
  }

  return ziel("/dashboard");
}
