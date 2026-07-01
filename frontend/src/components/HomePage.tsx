/**
 * HomePage Component
 *
 * Refocused homepage with single primary path:
 *   Upload → AI Process → Publish Blog
 *
 * Structure:
 *   1. Hero (single primary CTA + one-liner promise)
 *   2. Three-step path
 *   3. Showcase (before/after)
 *   4. Secondary links (Blog/RSS/History/Profile) — collapsed grid
 */

"use client";

import { ArrowRight, BookOpen, Camera, History, Rss, User, WandSparkles, PackageCheck } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

const platformBadges = ["Amazon", "Shopify", "eBay", "Etsy"];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* ============= 1. Hero (主 CTA + 一句话承诺) ============= */}
        <section className="relative overflow-hidden border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <div className="proof-strip absolute inset-x-0 top-0 h-2" />

          <div className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
            <p className="font-utility text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]">
              {m.home_newHeroKicker()}
            </p>

            <h1 className="font-display mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              {m.home_newHeroTitle()}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted sm:text-xl">
              {m.home_newHeroSubtitle()}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={localizeHref("/generate")}
                className="btn-primary inline-flex h-12 items-center gap-2 px-8 text-base font-semibold"
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                {m.home_newHeroPrimaryCta()}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#showcase"
                className="btn-secondary inline-flex h-12 items-center gap-2 px-8 text-base font-semibold"
              >
                {m.home_newHeroSecondaryCta()}
              </a>
            </div>

            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground-muted">
              {platformBadges.map((p) => (
                <li key={p} className="font-medium">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============= 2. 三步路径 ============= */}
        <section
          aria-labelledby="path-kicker"
          className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <p
              id="path-kicker"
              className="font-utility text-center text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]"
            >
              {m.home_newPathKicker()}
            </p>

            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: 1,
                  icon: Camera,
                  title: m.home_newPathStep1Title(),
                  copy: m.home_newPathStep1Copy(),
                },
                {
                  step: 2,
                  icon: WandSparkles,
                  title: m.home_newPathStep2Title(),
                  copy: m.home_newPathStep2Copy(),
                },
                {
                  step: 3,
                  icon: PackageCheck,
                  title: m.home_newPathStep3Title(),
                  copy: m.home_newPathStep3Copy(),
                },
              ].map(({ step, icon: Icon, title, copy }) => (
                <li
                  key={step}
                  className="panel relative overflow-hidden p-6"
                  aria-label={`${m.home_newPathKicker()} ${step}: ${title}`}
                >
                  <div
                    className="absolute right-4 top-4 font-display text-3xl font-bold text-[hsl(var(--primary)/0.15)]"
                    aria-hidden="true"
                  >
                    0{step}
                  </div>
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============= 3. 范例展示（占位 + Before/After） ============= */}
        <section
          id="showcase"
          aria-labelledby="showcase-kicker"
          className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="text-center">
              <p
                id="showcase-kicker"
                className="font-utility text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]"
              >
                {m.home_newShowcaseKicker()}
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
                {m.home_newShowcaseTitle()}
              </h2>
              <p className="mt-3 text-sm italic text-foreground-muted">
                {m.home_newShowcaseNote()}
              </p>
            </div>

            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((idx) => (
                <li
                  key={idx}
                  className="panel overflow-hidden p-0"
                  aria-label={[
                    m.home_newShowcaseExample1(),
                    m.home_newShowcaseExample2(),
                    m.home_newShowcaseExample3(),
                  ][idx]}
                >
                  <div className="grid grid-cols-2">
                    <div className="aspect-square bg-[hsl(var(--secondary))] p-3">
                      <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-[hsl(var(--border-strong))] text-xs text-foreground-muted">
                        {m.home_heroKicker()}
                      </div>
                    </div>
                    <div className="aspect-square bg-[hsl(var(--primary)/0.08)] p-3">
                      <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-[hsl(var(--primary)/0.4)] text-xs font-medium text-[hsl(var(--primary))]">
                        AI
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[hsl(var(--border))] px-4 py-3 text-sm font-medium text-foreground">
                    {[
                      m.home_newShowcaseExample1(),
                      m.home_newShowcaseExample2(),
                      m.home_newShowcaseExample3(),
                    ][idx]}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============= 4. 次级入口（折叠区） ============= */}
        <section
          aria-labelledby="secondary-title"
          className="bg-[hsl(var(--card))]"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <h2
              id="secondary-title"
              className="font-display text-center text-2xl font-semibold text-foreground"
            >
              {m.home_newSecondaryTitle()}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  href: "/blog",
                  icon: BookOpen,
                  title: m.home_newSecondaryBlog(),
                  copy: m.home_newSecondaryBlogCopy(),
                },
                {
                  href: "/rss.xml",
                  icon: Rss,
                  title: m.home_newSecondaryRss(),
                  copy: m.home_newSecondaryRssCopy(),
                },
                {
                  href: "/history",
                  icon: History,
                  title: m.home_newSecondaryHistory(),
                  copy: m.home_newSecondaryHistoryCopy(),
                },
                {
                  href: "/settings/profile",
                  icon: User,
                  title: m.home_newSecondaryProfile(),
                  copy: m.home_newSecondaryProfileCopy(),
                },
              ].map(({ href, icon: Icon, title, copy }) => (
                <li key={href}>
                  <a
                    href={localizeHref(href)}
                    className="panel flex h-full items-start gap-3 p-4 transition-colors hover:bg-[hsl(var(--secondary))]"
                  >
                    <div
                      className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[hsl(var(--foreground)/0.06)] text-foreground-muted"
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{title}</div>
                      <p className="mt-0.5 text-xs text-foreground-muted">{copy}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
