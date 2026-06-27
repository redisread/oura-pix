"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Sparkles } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import LanguageSelector from "./LanguageSelector";
import NotificationBell from "./notifications/NotificationBell";
import { useAuth } from "@/hooks/use-auth";

type NavItem =
  | { type: "link"; href: string; label: string }
  | { type: "group"; label: string; children: { href: string; label: string }[] };

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = localizeHref("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    {
      type: "group",
      label: m.home(),
      children: [
        { href: "/", label: m.home() },
        { href: "/generate", label: m.generate() },
      ],
    },
    {
      type: "group",
      label: m.nav_content(),
      children: [
        { href: "/history", label: m.history_title() },
        { href: "/favorites", label: m.favorites_title() },
        { href: "/competitors", label: m.nav_competitors() },
      ],
    },
    {
      type: "group",
      label: m.nav_tools(),
      children: [
        { href: "/stats", label: m.stats_title() },
        { href: "/metrics", label: m.nav_metrics() },
        { href: "/errors", label: m.nav_errors() },
        { href: "/api-keys", label: "API Keys" },
        { href: "/categories", label: m.nav_categories() },
      ],
    },
    { type: "link", href: "/teams", label: m.nav_teams() },
    { type: "link", href: "/pricing", label: m.pricing() },
  ];

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "glass border-b border-[hsl(var(--border))] shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href={localizeHref("/")} className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 opacity-80 blur-xl" />
            {/* Icon */}
            <span className="relative text-lg font-bold text-white">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">OuraPix</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) =>
            item.type === "link" ? (
              <a
                key={item.href}
                href={localizeHref(item.href)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
              >
                {item.label}
              </a>
            ) : (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === item.label ? null : item.label);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                >
                  {item.label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      openDropdown === item.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openDropdown === item.label && (
                  <div className="absolute left-0 top-full pt-2 animate-scale-in origin-top-left">
                    <div className="min-w-[160px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-1.5 shadow-xl">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={localizeHref(child.href)}
                          className="flex items-center px-3 py-2 rounded-lg text-sm text-foreground-muted transition-colors hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </nav>

        {/* Right Side: Language & Auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}
          <LanguageSelector />
          {isAuthenticated ? (
            <>
              <a
                href={localizeHref("/profile")}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
              >
                {m.profile()}
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-primary text-sm font-medium px-4 py-2 rounded-lg"
              >
                {m.logout()}
              </button>
            </>
          ) : (
            !isLoading && (
              <>
                <a
                  href={localizeHref("/login")}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                >
                  {m.login()}
                </a>
                <a
                  href={localizeHref("/register")}
                  className="btn-primary text-sm font-medium px-4 py-2 rounded-lg"
                >
                  {m.register()}
                </a>
              </>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg text-foreground-muted hover:bg-[hsl(var(--foreground)/0.05)] transition-colors"
          aria-label={isMenuOpen ? m.nav_closeMenu() : m.nav_openMenu()}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 py-4 animate-fade-in">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <a
                  key={item.href}
                  href={localizeHref(item.href)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                >
                  {item.label}
                </a>
              ) : (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setExpandedMobileGroup(
                        expandedMobileGroup === item.label ? null : item.label
                      )
                    }
                    className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedMobileGroup === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedMobileGroup === item.label && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-[hsl(var(--border))] pl-3">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={localizeHref(child.href)}
                          className="px-3 py-2 rounded-lg text-sm text-foreground-muted transition-colors hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            <hr className="my-3 border-[hsl(var(--border))]" />
            {isAuthenticated ? (
              <>
                <a
                  href={localizeHref("/profile")}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                >
                  {m.profile()}
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-primary text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-1"
                >
                  {m.logout()}
                </button>
              </>
            ) : (
              !isLoading && (
                <>
                  <a
                    href={localizeHref("/login")}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[hsl(var(--foreground)/0.05)]"
                  >
                    {m.login()}
                  </a>
                  <a
                    href={localizeHref("/register")}
                    className="btn-primary text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-1"
                  >
                    {m.register()}
                  </a>
                </>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
