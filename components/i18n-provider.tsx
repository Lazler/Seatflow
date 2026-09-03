"use client";

import { createContext, useContext } from "react";
import type { Dict, Locale } from "@/lib/i18n";

type I18nContext = { dict: Dict; locale: Locale };
const Ctx = createContext<I18nContext | null>(null);

export function LanguageProvider({
  dict,
  locale,
  children,
}: {
  dict: Dict;
  locale: Locale;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ dict, locale }}>{children}</Ctx.Provider>;
}

export function useT(): Dict {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx.dict;
}

export function useLocale(): Locale {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used inside LanguageProvider");
  return ctx.locale;
}
