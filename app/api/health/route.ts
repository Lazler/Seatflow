import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Deployment-Selbstdiagnose: prüft Env-Konfiguration und DB-Erreichbarkeit.
// Gibt nur Booleans zurück — keine Secrets, kein Datenzugriff nach außen.
export async function GET() {
  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    resendApiKey: !!process.env.RESEND_API_KEY,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    sentryDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  // Admin-DB-Verbindung testen (Kern vieler Seiten: Buchung, Editor, Scanner)
  let adminDb: "ok" | "fehler" | "kein_key" = "kein_key";
  if (env.supabaseServiceRoleKey) {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("events")
        .select("id", { count: "exact", head: true })
        .limit(1);
      adminDb = error ? "fehler" : "ok";
    } catch {
      adminDb = "fehler";
    }
  }

  const gesund =
    env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey &&
    env.stripeSecretKey && env.stripeWebhookSecret && env.resendApiKey &&
    adminDb === "ok";

  return NextResponse.json(
    { gesund, env, adminDb },
    { status: gesund ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
