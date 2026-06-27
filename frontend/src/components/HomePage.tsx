"use client";

import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Globe2,
  PackageCheck,
  ScanLine,
  WandSparkles,
} from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

const proofRows = [
  { label: "Input", value: "1 product photo", tone: "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" },
  { label: "Market", value: "Amazon, Shopify, eBay", tone: "bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]" },
  { label: "Output", value: "Copy, image scenes, tags", tone: "bg-[hsl(var(--foreground)/0.08)] text-foreground" },
];

const workflow = [
  {
    icon: Camera,
    title: "Drop in the hero image",
    copy: "Start with the product photo your team already has. Add reference shots only when the brand direction needs it.",
  },
  {
    icon: ScanLine,
    title: "Set marketplace constraints",
    copy: "Choose platform, language, aspect ratio, scene count, and style before a generation starts.",
  },
  {
    icon: PackageCheck,
    title: "Review listing-ready assets",
    copy: "Scan the generated title, selling points, tags, and scene images in the same workspace.",
  },
];

const platformBadges = ["Amazon", "Shopify", "eBay", "Etsy"];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <div className="proof-strip absolute inset-x-0 top-0 h-2" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-20 lg:pt-20">
            <div className="flex flex-col justify-center">
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--accent))]">
                Product photo to listing bench
              </p>
              <h1 className="font-display mt-5 max-w-3xl text-5xl font-semibold text-foreground sm:text-6xl lg:text-7xl">
                Turn one product shot into a marketplace-ready detail page.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-foreground-muted">
                OuraPix helps cross-border teams turn product imagery into copy, visual scenes,
                tags, and exportable detail-page material without leaving the browser.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={localizeHref("/generate")}
                  className="btn-primary gap-2 px-6 py-3 text-base"
                >
                  <WandSparkles className="h-5 w-5" aria-hidden="true" />
                  {m.generate()}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={localizeHref("/pricing")}
                  className="btn-secondary gap-2 px-6 py-3 text-base"
                >
                  {m.pricing()}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2" aria-label="Supported marketplaces">
                {platformBadges.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.8)] px-3 py-1 text-sm font-semibold text-foreground-muted"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <aside className="relative" aria-label="OuraPix generation specimen">
              <div className="card specimen-shadow overflow-hidden border-2 border-[hsl(var(--foreground)/0.14)]">
                <div className="proof-strip h-3" />
                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_0.88fr]">
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-utility text-xs font-semibold uppercase text-foreground-muted">
                          Source image
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-foreground">
                          Travel mug set
                        </h2>
                      </div>
                      <BadgeCheck className="h-5 w-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                    </div>

                    <div className="mt-4 aspect-[4/3] overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                      <div className="bench-grid flex h-full items-center justify-center p-8">
                        <img
                          src="/logo.png"
                          alt="OuraPix product preview placeholder"
                          className="h-full max-h-48 w-full object-contain"
                          loading="eager"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {proofRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2"
                        >
                          <span className="font-utility text-[11px] font-semibold uppercase text-foreground-muted">
                            {row.label}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.tone}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                      <p className="font-utility text-xs font-semibold uppercase text-foreground-muted">
                        Generated listing
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-foreground">
                        Leakproof mug for daily carry
                      </h3>
                      <p className="mt-3 text-sm text-foreground-muted">
                        Compact silhouette, textured grip, and insulated body described for marketplace search.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["BPA free", "commute", "giftable"].map((tag) => (
                          <span key={tag} className="badge">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--foreground))] p-4 text-[hsl(var(--background))]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--background)/0.68)]">
                          Export check
                        </p>
                        <Globe2 className="h-5 w-5 text-[hsl(var(--background))]" aria-hidden="true" />
                      </div>
                      <div className="mt-5 space-y-3">
                        {["Localized copy", "Scene ratios", "SEO tags"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm font-semibold">
                            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent))]" aria-hidden="true" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[hsl(var(--card))] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--primary))]">
                  Operating line
                </p>
                <h2 className="font-display mt-3 text-4xl font-semibold text-foreground">
                  Built around the actual listing workflow.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {workflow.map((item) => (
                  <div
                    key={item.title}
                    className="border-l-2 border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] p-5"
                  >
                    <item.icon className="h-5 w-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm text-foreground-muted">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--foreground))] py-14 text-[hsl(var(--background))]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--background)/0.62)]">
                Ready at the bench
              </p>
              <h2 className="font-display mt-3 text-4xl font-semibold">
                Start with the product image you already have.
              </h2>
            </div>
            <a
              href={localizeHref("/generate")}
              className="inline-flex items-center justify-center rounded-md bg-[hsl(var(--background))] px-6 py-3 text-base font-semibold text-foreground transition hover:bg-[hsl(var(--background-secondary))]"
            >
              {m.generate()}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
