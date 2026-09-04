import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { execSync } from "node:child_process";

// Commit-SHA fürs Versions-Badge im Dashboard: bevorzugt vom Hosting injizierte
// Env-Vars (Coolify: SOURCE_COMMIT, Vercel: VERCEL_GIT_COMMIT_SHA) — schneller
// und funktioniert auch ohne .git im Build-Kontext. Fallback: git selbst fragen
// (lokale Entwicklung).
function ermittleCommitSha(): string {
  const vonEnv = process.env.SOURCE_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA;
  if (vonEnv) return vonEnv.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

const APP_VERSION = ermittleCommitSha();
const BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
  },
  serverExternalPackages: ["@react-pdf/renderer", "canvas"],
  // Der eigenständige tsc-Lauf in `next build` spitzt direkt nach dem
  // Turbopack-Compile nochmal ~1–2 GB Speicher an und ließ den (uncached)
  // Coolify-Build-Container OOM-sterben. Die Typprüfung läuft bereits in der
  // GitHub-CI vor jedem Deploy — daher hier überspringen, um den Speicher-Peak
  // beim Deploy zu vermeiden. (ESLint läuft mit Turbopack ohnehin nicht im Build.)
  typescript: { ignoreBuildErrors: true },
  // Alte deutsche URL-Slugs → neue englische. Hält bereits verschickte
  // Ticket-/E-Mail-Links, Bookmarks und alte Auth-Mail-Templates am Leben.
  async redirects() {
    return [
      { source: "/anmelden", destination: "/login", permanent: true },
      { source: "/registrieren", destination: "/register", permanent: true },
      { source: "/passwort-zuruecksetzen", destination: "/reset-password", permanent: true },
      { source: "/datenschutz", destination: "/privacy", permanent: true },
      { source: "/impressum", destination: "/imprint", permanent: true },
      { source: "/agb", destination: "/terms", permanent: true },
      { source: "/buchen/:path*", destination: "/book/:path*", permanent: true },
      { source: "/buchung/:id", destination: "/booking/:id", permanent: true },
      { source: "/dashboard/abo", destination: "/dashboard/subscription", permanent: true },
      { source: "/dashboard/gutscheine", destination: "/dashboard/vouchers", permanent: true },
      { source: "/dashboard/buchungen/:path*", destination: "/dashboard/bookings/:path*", permanent: true },
      // API-Altpfade (falls extern referenziert)
      { source: "/api/buchung/:path*", destination: "/api/booking/:path*", permanent: true },
      { source: "/api/buchungen/:path*", destination: "/api/bookings/:path*", permanent: true },
      { source: "/api/gutscheine/:path*", destination: "/api/vouchers/:path*", permanent: true },
      { source: "/api/abonnement/:path*", destination: "/api/subscription/:path*", permanent: true },
      { source: "/api/sprache", destination: "/api/language", permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print Sentry output in CI; suppress noise in local dev
  silent: !process.env.CI,

  // Skip source map uploads when auth token is absent (local dev / forks)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  disableLogger: true,
  autoInstrumentServerFunctions: true,
});
