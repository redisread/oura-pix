"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
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
          {navItems.map((item) =>
            item.type === "link" ? (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
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
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {item.label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      openDropdown === item.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openDropdown === item.label && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
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
          <nav className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                    className="flex w-full items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedMobileGroup === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedMobileGroup === item.label && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
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
