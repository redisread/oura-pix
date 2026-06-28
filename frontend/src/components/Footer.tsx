"use client";

import { PackageCheck } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import * as m from "@/paraglide/messages.js";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="font-display text-xl font-semibold text-foreground">OuraPix</span>
            </div>
            <p className="mt-4 text-sm text-foreground-muted max-w-sm">
              {m.footer_description()}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-utility text-xs font-semibold uppercase text-foreground">{m.footer_product()}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={localizeHref("/generate")} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {m.footer_generate()}
                </a>
              </li>
              <li>
                <a href={localizeHref("/pricing")} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {m.footer_pricing()}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-utility text-xs font-semibold uppercase text-foreground">{m.footer_support()}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={localizeHref("/docs")} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {m.footer_documentation()}
                </a>
              </li>
              <li>
                <a href={localizeHref("/blog")} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {m.footer_blog()}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-[hsl(var(--border))] pt-8">
          <p className="text-center text-sm text-foreground-muted">
            {m.footer_copyright({ year: currentYear.toString() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
