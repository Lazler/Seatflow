import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "canvas"],
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
