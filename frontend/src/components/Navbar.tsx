"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import LanguageSelector from "./LanguageSelector";
import NotificationBell from "./notifications/NotificationBell";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Top-level: most-used user features
  const primaryLinks = [
    { href: "/", label: m.home() },
    { href: "/generate", label: m.generate() },
    { href: "/history", label: m.history_title?.() || "生成历史" },
    { href: "/favorites", label: m.favorites_title?.() || "我的收藏" },
  ];

  // "More" dropdown: less frequently used
  const moreLinks = [
    { href: "/teams", label: "团队" },
    { href: "/competitors", label: "竞品" },
    { href: "/stats", label: m.stats_title?.() || "统计" },
    { href: "/api-keys", label: "API Keys" },
    { href: "/metrics", label: "性能监控" },
    { href: "/errors", label: "错误追踪" },
  ];

  const allLinks = [...primaryLinks, ...moreLinks, { href: "/pricing", label: m.pricing() }];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
        isScrolled
          ? "border-slate-200 bg-white/80 backdrop-blur-md"
          : "border-transparent bg-white"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
            <span className="text-sm font-bold text-white">O</span>
          </div>
          <span className="text-lg font-semibold text-slate-900">OuraPix</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {primaryLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}

          {/* "More" dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              更多
              <ChevronDown className={`h-4 w-4 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
            </button>
            {isMoreOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                {moreLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => setIsMoreOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <a
            href="/pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {m.pricing()}
          </a>
        </nav>

        {/* Right Side: Notifications, Language & Auth */}
        <div className="hidden md:flex items-center gap-2">
          <NotificationBell />
          <LanguageSelector />
          <a
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            {m.login()}
          </a>
          <a
            href="/register"
            className="text-sm font-medium bg-slate-900 text-white px-4 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            {m.register()}
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu — all links in flat list */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto">
          <nav className="flex flex-col py-2">
            {allLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="my-2 border-slate-200" />
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {m.login()}
            </a>
            <a
              href="/register"
              className="mx-4 mb-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white text-center rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              {m.register()}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
