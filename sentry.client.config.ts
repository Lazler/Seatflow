import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 10% of transactions in production for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only upload source maps and send events when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  beforeSend(event) {
    // Strip PII: remove user email from breadcrumb messages
    const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const crumbs = event.breadcrumbs;
    if (Array.isArray(crumbs)) {
      event.breadcrumbs = crumbs.map((b) => ({
        ...b,
        message: typeof b.message === "string" ? b.message.replace(emailRe, "[email]") : b.message,
      }));
    }
    return event;
  },
});
