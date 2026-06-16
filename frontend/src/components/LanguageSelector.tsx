"use client";

import { useState, useRef, useEffect } from "react";
import * as m from "@/paraglide/messages.js";

type LanguageTag = "zh-CN" | "en" | "ja";

const languages: { tag: LanguageTag; label: string; flag: string }[] = [
  { tag: "zh-CN", label: "中文", flag: "🇨🇳" },
  { tag: "en", label: "English", flag: "🇺🇸" },
  { tag: "ja", label: "日本語", flag: "🇯🇵" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageTag>("zh-CN");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current language from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("paraglide_language");
    if (stored && languages.some((l) => l.tag === stored)) {
      setCurrentLang(stored as LanguageTag);
    }
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
    localStorage.setItem("paraglide_language", lang);
    // Reload page to apply new language
    window.location.reload();
  };

  const currentLanguage = languages.find((l) => l.tag === currentLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label={typeof (m as Record<string, unknown>).language_selector === 'function'
          ? ((m as Record<string, () => string>).language_selector())
          : "Language"}
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
        <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.tag}
              onClick={() => {
                handleLanguageChange(lang.tag);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                currentLang === lang.tag
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {currentLang === lang.tag && (
                <svg className="h-4 w-4 ml-auto text-amber-600" fill="currentColor" viewBox="0 0 20 20">
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
