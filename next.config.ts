import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "canvas"],
  // Der eigenständige tsc-Lauf in `next build` spitzt direkt nach dem
  // Turbopack-Compile nochmal ~1–2 GB Speicher an und ließ den (uncached)
  // Coolify-Build-Container OOM-sterben. Die Typprüfung läuft bereits in der
  // GitHub-CI vor jedem Deploy — daher hier überspringen, um den Speicher-Peak
  // beim Deploy zu vermeiden. (ESLint läuft mit Turbopack ohnehin nicht im Build.)
  typescript: { ignoreBuildErrors: true },
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
