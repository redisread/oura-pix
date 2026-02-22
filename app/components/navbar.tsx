"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const { user, isAuthenticated, logout } = useAuth();

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/generate", label: t("generate") || "开始生成" },
    { href: "/pricing", label: t("pricing") },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
        isScrolled
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-lg font-semibold text-foreground">OuraPix</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side: Language Switcher & Auth */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
                  {user?.name || user?.email}
                </span>
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
              >
                {tAuth("logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-slate-800 hover:scale-105 active:scale-95"
              >
                {t("getStarted") || "立即开始"}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Language Switcher */}
            <div className="pt-2 mt-2 border-t border-border">
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
            </div>

            {/* Mobile Auth */}
            <div className="pt-2 mt-2 border-t border-border space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("profile")}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {tAuth("logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="mt-2 block rounded-lg bg-primary px-3 py-2 text-center text-base font-medium text-primary-foreground hover:bg-slate-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("getStarted") || "立即开始"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
