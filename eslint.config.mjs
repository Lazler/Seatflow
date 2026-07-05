import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Nur components/** — API-Routen und Server Components dürfen den Admin-
    // Client nutzen. Client-Komponenten außerhalb von components/ fängt der
    // "server-only"-Import in admin.ts als Build-Fehler ab.
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "Admin client uses the service role key — never import it in components.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      // Deutsche Anführungszeichen („…", ‚…') in JSX-Texten sind gewollt
      "react/no-unescaped-entities": "off",
      // React-Compiler-Empfehlung, kein Bug: bestehende Sync-Patterns
      // (Laden bei Mount, Reset bei Prop-Wechsel) bleiben vorerst Warnungen
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
