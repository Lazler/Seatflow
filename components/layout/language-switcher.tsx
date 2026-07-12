"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/i18n-provider";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
      });
    }
    setOpen((v) => !v);
  }

  async function changeLanguage(lang: Locale) {
    setOpen(false);
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
      >
        <span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>
        <span>{LOCALE_LABELS[locale]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[140px]"
            style={dropdownStyle}
          >
            {LOCALES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => changeLanguage(lang)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors ${lang === locale ? "font-semibold" : ""}`}
              >
                <span>{LOCALE_FLAGS[lang]}</span>
                {LOCALE_LABELS[lang]}
                {lang === locale && <span className="ml-auto text-xs text-primary">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const LOCALE_FLAGS: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  hu: "HU",
};
