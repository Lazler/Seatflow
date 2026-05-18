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
    rules: {
      // Prevent accidental import of service-role admin client in client components.
      // `server-only` in admin.ts gives a build error; this rule catches it at lint time.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "Admin client uses the service role key — only import in server-side code (API routes, Server Components, Server Actions).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
