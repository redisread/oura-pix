"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, PackageCheck } from "lucide-react";
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
          ? "glass border-b border-[hsl(var(--border))] shadow-sm"
          : "bg-[hsl(var(--background)/0.86)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href={localizeHref("/")} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-sm">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">OuraPix</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) =>
            item.type === "link" ? (
              <a
                key={item.href}
                href={localizeHref(item.href)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-foreground-muted transition-all duration-200 hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === item.label ? null : item.label);
                  }}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-foreground-muted transition-all duration-200 hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
                  aria-expanded={openDropdown === item.label}
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
                    <div className="min-w-[180px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-1.5 shadow-xl">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={localizeHref(child.href)}
                          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
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
                className="rounded-md px-3 py-2 text-sm font-semibold text-foreground-muted transition-all duration-200 hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
              >
                {m.profile()}
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-primary px-4 py-2 text-sm"
              >
                {m.logout()}
              </button>
            </>
          ) : (
            !isLoading && (
              <>
                <a
                  href={localizeHref("/login")}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-foreground-muted transition-all duration-200 hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
                >
                  {m.login()}
                </a>
                <a
                  href={localizeHref("/register")}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {m.register()}
                </a>
              </>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-2 text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] md:hidden"
          aria-label={isMenuOpen ? m.nav_closeMenu() : m.nav_openMenu()}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="animate-fade-in border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/96 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <a
                  key={item.href}
                  href={localizeHref(item.href)}
                  className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMobileGroup(
                        expandedMobileGroup === item.label ? null : item.label
                      )
                    }
                    className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
                    aria-expanded={expandedMobileGroup === item.label}
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
                          className="rounded-md px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
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
                  className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
                >
                  {m.profile()}
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-primary mt-1 px-4 py-2.5 text-center text-sm"
                >
                  {m.logout()}
                </button>
              </>
            ) : (
              !isLoading && (
                <>
                  <a
                    href={localizeHref("/login")}
                    className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[hsl(var(--foreground)/0.06)] hover:text-foreground"
                  >
                    {m.login()}
                  </a>
                  <a
                    href={localizeHref("/register")}
                    className="btn-primary mt-1 px-4 py-2.5 text-center text-sm"
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
