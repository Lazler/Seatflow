"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f1f5f9" }}>
        <div style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 48,
            background: "#fef2f2",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            fontSize: 22, fontWeight: 800, color: "#dc2626",
          }}>
            !
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            Ein Fehler ist aufgetreten
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b", maxWidth: 360, lineHeight: 1.6 }}>
            Etwas ist schiefgelaufen. Unser Team wurde automatisch informiert.
          </p>
          <button
            onClick={unstable_retry}
            style={{
              padding: "10px 20px",
              background: "#c2670b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Seite neu laden
          </button>
          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
              Fehler-ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
