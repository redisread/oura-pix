"use client";

import { Sparkles } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 opacity-80" />
                <span className="relative text-sm font-bold text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground">OuraPix</span>
            </div>
            <p className="mt-4 text-sm text-foreground-muted max-w-sm">
              AI-powered cross-border e-commerce product detail page generator
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={localizeHref("/generate")} className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Generate
                </a>
              </li>
              <li>
                <a href={localizeHref("/pricing")} className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={localizeHref("/docs")} className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href={localizeHref("/blog")} className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-[hsl(var(--border))] pt-8">
          <p className="text-center text-sm text-foreground-muted">
            © {currentYear} OuraPix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
