import "server-only";
import { cookies } from "next/headers";
import { getDictionary, isLocale, type Dict, type Locale } from "@/lib/i18n";

export async function getServerDict(): Promise<Dict> {
  const jar = await cookies();
  const lang = jar.get("dashboard_lang")?.value ?? "de";
  const locale: Locale = isLocale(lang) ? lang : "de";
  return getDictionary(locale);
}
