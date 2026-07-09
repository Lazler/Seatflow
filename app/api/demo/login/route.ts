import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_EMAIL } from "@/lib/demo";

// Meldet den Besucher ohne Eingabe im read-only Demokonto an und leitet ins
// Dashboard. Nutzt den Admin-Client, um serverseitig ein Magic-Link-Token zu
// erzeugen, und löst es sofort über die SSR-Session ein (setzt die Cookies).
export async function GET(req: NextRequest) {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // Ohne Service-Key kein Demo-Login möglich → zur Registrierung
    return NextResponse.redirect(new URL("/registrieren", req.url));
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_EMAIL,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[demo/login] generateLink fehlgeschlagen:", error);
    return NextResponse.redirect(new URL("/anmelden", req.url));
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) {
    console.error("[demo/login] verifyOtp fehlgeschlagen:", verifyError);
    return NextResponse.redirect(new URL("/anmelden", req.url));
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
