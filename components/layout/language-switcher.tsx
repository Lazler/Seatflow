"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/i18n-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LOCALE_FLAGS: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  hu: "🇭🇺",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function changeLanguage(lang: string) {
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <Select value={locale} onValueChange={changeLanguage}>
      <SelectTrigger className="h-8 w-full gap-1.5 border-transparent bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-accent hover:text-accent-foreground focus:border-transparent focus:ring-0">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
            {LOCALE_LABELS[locale]}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[9rem]">
        {LOCALES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{LOCALE_FLAGS[lang]}</span>
              {LOCALE_LABELS[lang]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
