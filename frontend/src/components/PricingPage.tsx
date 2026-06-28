"use client";

import { ArrowRight, CheckCircle2, CircleMinus, PackageCheck } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

export default function PricingPage() {
  const plans = [
    {
      key: "free",
      name: m.pricing_free_name(),
      description: m.pricing_free_description(),
      price: "0",
      period: m.pricing_free_period(),
      features: [
        { text: `${m.pricingFeatures_generationsPerMonth()}: 10`, included: true },
        { text: `${m.pricingFeatures_templates()}: ${m.pricingFeatures_basicTemplates()}`, included: true },
        { text: `${m.pricingFeatures_resolution()}: ${m.pricingFeatures_standard()}`, included: true },
        { text: `${m.pricingFeatures_platforms()}: ${m.pricingFeatures_amazon()}`, included: true },
        { text: m.pricingFeatures_batchGeneration(), included: false },
        { text: m.pricingFeatures_apiAccess(), included: false },
        { text: m.pricingFeatures_generationSpeed(), included: false },
        { text: m.pricingFeatures_support(), included: false },
      ],
      cta: m.pricing_free_cta(),
      ctaLink: "/generate",
      popular: false,
    },
    {
      key: "pro",
      name: m.pricing_pro_name(),
      description: m.pricing_pro_description(),
      price: "99",
      period: m.pricing_pro_period(),
      features: [
        { text: `${m.pricingFeatures_generationsPerMonth()}: 200`, included: true },
        { text: `${m.pricingFeatures_templates()}: ${m.pricingFeatures_allTemplates()}`, included: true },
        { text: `${m.pricingFeatures_resolution()}: ${m.pricingFeatures_hd()}`, included: true },
        { text: `${m.pricingFeatures_platforms()}: ${m.pricingFeatures_multiPlatform()}`, included: true },
        { text: `${m.pricingFeatures_batchGeneration()}: ${m.pricingFeatures_batch10()}`, included: true },
        { text: m.pricingFeatures_apiAccess(), included: true },
        { text: `${m.pricingFeatures_generationSpeed()}: ${m.pricingFeatures_priority()}`, included: true },
        { text: m.pricingFeatures_prioritySupport(), included: true },
      ],
      cta: m.pricing_pro_cta(),
      ctaLink: "/generate",
      popular: true,
    },
    {
      key: "enterprise",
      name: m.pricing_enterprise_name(),
      description: m.pricing_enterprise_description(),
      price: "499",
      period: m.pricing_enterprise_period(),
      features: [
        { text: `${m.pricingFeatures_generationsPerMonth()}: ${m.pricingFeatures_unlimited()}`, included: true },
        { text: `${m.pricingFeatures_templates()}: ${m.pricingFeatures_customTemplates()}`, included: true },
        { text: `${m.pricingFeatures_resolution()}: ${m.pricingFeatures_4k()}`, included: true },
        { text: `${m.pricingFeatures_platforms()}: ${m.pricingFeatures_allPlatforms()}`, included: true },
        { text: `${m.pricingFeatures_batchGeneration()}: ${m.pricingFeatures_unlimited()}`, included: true },
        { text: m.pricingFeatures_apiAccess(), included: true },
        { text: `${m.pricingFeatures_generationSpeed()}: ${m.pricingFeatures_highestPriority()}`, included: true },
        { text: m.pricingFeatures_dedicatedManager(), included: true },
      ],
      cta: m.pricing_enterprise_cta(),
      ctaLink: "mailto:sales@ourapix.com",
      popular: false,
    },
  ];

  const comparisons = [
    { feature: m.pricingFeatures_generationsPerMonth(), free: "10", pro: "200", enterprise: m.pricingFeatures_unlimited() },
    { feature: m.pricingFeatures_resolution(), free: m.pricingFeatures_standard(), pro: m.pricingFeatures_hd(), enterprise: m.pricingFeatures_4k() },
    { feature: m.pricingFeatures_templates(), free: m.pricingFeatures_basicTemplates(), pro: m.pricingFeatures_allTemplates(), enterprise: m.pricingFeatures_customTemplates() },
    { feature: m.pricingFeatures_platforms(), free: m.pricingFeatures_amazon(), pro: m.pricingFeatures_multiPlatform(), enterprise: m.pricingFeatures_allPlatforms() },
    { feature: m.pricingFeatures_batchGeneration(), free: m.pricingFeatures_notAvailable(), pro: m.pricingFeatures_batch10(), enterprise: m.pricingFeatures_unlimited() },
    { feature: m.pricingFeatures_apiAccess(), free: m.pricingFeatures_notAvailable(), pro: "Yes", enterprise: "Yes" },
    { feature: m.pricingFeatures_generationSpeed(), free: m.pricingFeatures_standardSpeed(), pro: m.pricingFeatures_priority(), enterprise: m.pricingFeatures_highestPriority() },
    { feature: m.pricingFeatures_support(), free: m.pricingFeatures_community(), pro: m.pricingFeatures_prioritySupport(), enterprise: m.pricingFeatures_dedicatedManager() },
  ];

  const faqs = [
    { question: m.pricing_faq1_question(), answer: m.pricing_faq1_answer() },
    { question: m.pricing_faq2_question(), answer: m.pricing_faq2_answer() },
    { question: m.pricing_faq3_question(), answer: m.pricing_faq3_answer() },
    { question: m.pricing_faq4_question(), answer: m.pricing_faq4_answer() },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <div className="proof-strip h-2" />
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:px-8">
            <div>
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--accent))]">
                Listing capacity rate card
              </p>
              <h1 className="font-display mt-3 max-w-3xl text-5xl font-semibold text-foreground sm:text-6xl">
                {m.pricing_title()}
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-foreground-muted">
                {m.pricing_subtitle()}
              </p>
            </div>
            <div className="card overflow-hidden">
              <div className="proof-strip h-2" />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                    <PackageCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-utility text-xs font-semibold uppercase text-foreground-muted">
                      Best fit
                    </p>
                    <p className="text-lg font-semibold text-foreground">{m.pricing_pro_name()}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-foreground-muted">
                  200 monthly generations with batch support and priority output speed for active shops.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-stretch gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.key}
                  className={`card flex flex-col overflow-hidden ${
                    plan.popular ? "border-[hsl(var(--primary))] shadow-lg" : ""
                  }`}
                >
                  <div className={plan.popular ? "proof-strip h-2" : "h-2 bg-[hsl(var(--background-secondary))]"} />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">{plan.name}</h2>
                        <p className="mt-2 text-sm text-foreground-muted">{plan.description}</p>
                      </div>
                      {plan.popular && (
                        <span className="badge shrink-0">{m.pricing_mostPopular()}</span>
                      )}
                    </div>

                    <div className="mt-7 flex items-end gap-1 border-b border-[hsl(var(--border))] pb-6">
                      <span className="pb-2 text-2xl font-semibold text-foreground">¥</span>
                      <span className="font-display text-6xl font-semibold leading-none text-foreground">
                        {plan.price}
                      </span>
                      <span className="pb-2 text-sm font-medium text-foreground-muted">{plan.period}</span>
                    </div>

                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-3 text-sm">
                          {feature.included ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--primary))]" aria-hidden="true" />
                          ) : (
                            <CircleMinus className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                          )}
                          <span className={feature.included ? "text-foreground" : "text-foreground-muted"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={plan.ctaLink.startsWith("/") ? localizeHref(plan.ctaLink) : plan.ctaLink}
                      className={`${plan.popular ? "btn-primary" : "btn-secondary"} mt-8 w-full gap-2 px-4 py-3 text-center`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--primary))]">
                Comparison sheet
              </p>
              <h2 className="font-display mt-3 text-4xl font-semibold text-foreground">
                {m.pricing_comparison()}
              </h2>
              <p className="mt-3 text-foreground-muted">{m.pricing_comparisonSubtitle()}</p>
            </div>

            <div className="card mt-8 overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background-secondary)/0.52)]">
                    <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">{m.pricingFeatures_feature()}</th>
                    <th className="px-5 py-4 text-center text-sm font-semibold text-foreground">{m.pricing_free_name()}</th>
                    <th className="px-5 py-4 text-center text-sm font-semibold text-[hsl(var(--primary))]">{m.pricing_pro_name()}</th>
                    <th className="px-5 py-4 text-center text-sm font-semibold text-foreground">{m.pricing_enterprise_name()}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {comparisons.map((row) => (
                    <tr key={row.feature}>
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                      <td className="px-5 py-4 text-center text-sm text-foreground-muted">{row.free}</td>
                      <td className="bg-[hsl(var(--primary)/0.06)] px-5 py-4 text-center text-sm font-semibold text-foreground">
                        {row.pro}
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-foreground-muted">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
            <div>
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--accent))]">
                Notes
              </p>
              <h2 className="font-display mt-3 text-4xl font-semibold text-foreground">
                {m.pricing_faq()}
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {faqs.map((faq) => (
                <article key={faq.question} className="card p-5">
                  <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-3 text-sm text-foreground-muted">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[hsl(var(--foreground))] py-14 text-[hsl(var(--background))]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--background)/0.62)]">
                Start the bench
              </p>
              <h2 className="font-display mt-3 text-4xl font-semibold">{m.pricing_ctaTitle()}</h2>
              <p className="mt-3 max-w-2xl text-[hsl(var(--background)/0.72)]">{m.pricing_ctaSubtitle()}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={localizeHref("/generate")}
                className="inline-flex items-center justify-center rounded-md bg-[hsl(var(--background))] px-6 py-3 text-base font-semibold text-foreground transition hover:bg-[hsl(var(--background-secondary))]"
              >
                {m.pricing_ctaFree()}
              </a>
              <a
                href="mailto:sales@ourapix.com"
                className="inline-flex items-center justify-center rounded-md border border-[hsl(var(--background)/0.32)] px-6 py-3 text-base font-semibold text-[hsl(var(--background))] transition hover:bg-[hsl(var(--background)/0.08)]"
              >
                {m.pricing_ctaContact()}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
