"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import LanguageSelector from "./LanguageSelector";
import NotificationBell from "./notifications/NotificationBell";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: m.home() },
    { href: "/generate", label: m.generate() },
    { href: "/history", label: m.history_title?.() || "生成历史" },
    { href: "/favorites", label: m.favorites_title?.() || "我的收藏" },
    { href: "/stats", label: m.stats_title?.() || "统计" },
    { href: "/api-keys", label: "API Keys" },
    { href: "/metrics", label: "性能监控" },
    { href: "/errors", label: "错误追踪" },
    { href: "/pricing", label: m.pricing() },
  ];

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
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side: Language & Auth */}
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
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <hr className="my-2 border-slate-200" />
            <a
              href="/login"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {m.login()}
            </a>
            <a
              href="/register"
              className="px-3 py-2 rounded-md text-sm font-medium bg-slate-900 text-white text-center"
            >
              {m.register()}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
