"use client";

import { useState, useRef, useEffect } from "react";
import * as m from "@/paraglide/messages.js";
import { getLocale, setLocale, type Locale } from "@/paraglide/runtime.js";

type LanguageTag = Locale;

const languages: { tag: LanguageTag; label: string; flag: string }[] = [
  { tag: "zh-CN", label: m.language_zh(), flag: "🇨🇳" },
  { tag: "en", label: "English", flag: "🇺🇸" },
  { tag: "ja", label: m.language_ja(), flag: "🇯🇵" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageTag>(() => getLocale());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLang(getLocale());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: LanguageTag) => {
    setCurrentLang(lang);
    setLocale(lang);
  };

  const currentLanguage = languages.find((l) => l.tag === currentLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
        aria-label={m.language_selector()}
        aria-expanded={isOpen}
      >
        <span>{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1 shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.tag}
              type="button"
              onClick={() => {
                handleLanguageChange(lang.tag);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                currentLang === lang.tag
                  ? "bg-[hsl(var(--primary)/0.1)] text-foreground"
                  : "text-foreground-muted hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {currentLang === lang.tag && (
                <svg className="ml-auto h-4 w-4 text-[hsl(var(--accent))]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
