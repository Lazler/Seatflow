export type Locale = "de" | "en" | "hu";
export const LOCALES: Locale[] = ["de", "en", "hu"];
export const LOCALE_LABELS: Record<Locale, string> = { de: "Deutsch", en: "English", hu: "Magyar" };
export function isLocale(v: string): v is Locale { return LOCALES.includes(v as Locale); }

// Recursively replace all leaf strings with `string` so all language dicts are assignable
type Stringify<T> = T extends string
  ? string
  : { [K in keyof T]: Stringify<T[K]> };

export type Dict = Stringify<typeof import("./de").dict>;

export async function getDictionary(locale: Locale): Promise<Dict> {
  const dicts: Record<Locale, () => Promise<Dict>> = {
    de: () => import("./de").then((m) => m.dict as unknown as Dict),
    en: () => import("./en").then((m) => m.dict as unknown as Dict),
    hu: () => import("./hu").then((m) => m.dict as unknown as Dict),
  };
  return dicts[locale]();
}
