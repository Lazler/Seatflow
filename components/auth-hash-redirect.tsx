"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// Handles Supabase recovery links that land on the root URL (/#access_token=...&type=recovery)
// by redirecting to the dedicated password-reset page.
export function AuthHashRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.get("type") === "recovery" && pathname !== "/reset-password") {
      router.replace(`/reset-password#${hash}`);
    }
  }, [pathname, router]);

  return null;
}
