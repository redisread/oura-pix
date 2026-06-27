"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Sparkles } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import LanguageSelector from "./LanguageSelector";
import NotificationBell from "./notifications/NotificationBell";

type NavItem =
  | { type: "link"; href: string; label: string }
  | { type: "group"; label: string; children: { href: string; label: string }[] };

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      label: "内容",
      children: [
        { href: "/history", label: m.history_title?.() || "生成历史" },
        { href: "/favorites", label: m.favorites_title?.() || "我的收藏" },
        { href: "/competitors", label: "竞品" },
      ],
    },
    {
      type: "group",
      label: "工具",
      children: [
        { href: "/stats", label: m.stats_title?.() || "统计" },
        { href: "/metrics", label: "性能监控" },
        { href: "/errors", label: "错误追踪" },
        { href: "/api-keys", label: "API Keys" },
        { href: "/categories", label: "商品类目" },
      ],
    },
    { type: "link", href: "/teams", label: "团队" },
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
          ? "glass border-b border-[oklch(var(--border))] shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(var(--primary))] to-violet-500 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(var(--primary))] to-violet-500 opacity-80 blur-xl" />
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
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
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
                    <div className="min-w-[160px] rounded-xl border border-[oklch(var(--border))] bg-[oklch(var(--popover))] p-1.5 shadow-xl">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="flex items-center px-3 py-2 rounded-lg text-sm text-foreground-muted transition-colors hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
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
          <NotificationBell />
          <LanguageSelector />
          <a
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted transition-all duration-200 hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
          >
            {m.login()}
          </a>
          <a
            href="/register"
            className="btn-primary text-sm font-medium px-4 py-2 rounded-lg"
          >
            {m.register()}
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg text-foreground-muted hover:bg-[oklch(var(--foreground)/0.05)] transition-colors"
          aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[oklch(var(--border))] bg-[oklch(var(--background))]/95 backdrop-blur-xl px-4 py-4 animate-fade-in">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
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
                    className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedMobileGroup === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedMobileGroup === item.label && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-[oklch(var(--border))] pl-3">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="px-3 py-2 rounded-lg text-sm text-foreground-muted transition-colors hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            <hr className="my-3 border-[oklch(var(--border))]" />
            <a
              href="/login"
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted transition-colors hover:text-foreground hover:bg-[oklch(var(--foreground)/0.05)]"
            >
              {m.login()}
            </a>
            <a
              href="/register"
              className="btn-primary text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-1"
            >
              {m.register()}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
