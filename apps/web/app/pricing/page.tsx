"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const tFeatures = useTranslations("pricing.features");

  const plans = [
    {
      key: "free",
      name: t("free.name"),
      description: t("free.description"),
      price: "0",
      period: t("free.period"),
      features: [
        { text: `${tFeatures("generationsPerMonth")}: 10`, included: true },
        { text: `${tFeatures("templates")}: ${tFeatures("basicTemplates")}`, included: true },
        { text: `${tFeatures("resolution")}: ${tFeatures("standard")}`, included: true },
        { text: `${tFeatures("platforms")}: ${tFeatures("amazon")}`, included: true },
        { text: tFeatures("batchGeneration"), included: false },
        { text: tFeatures("apiAccess"), included: false },
        { text: tFeatures("support"), included: false },
      ],
      cta: t("free.cta"),
      ctaLink: "/generate",
      popular: false,
    },
    {
      key: "pro",
      name: t("pro.name"),
      description: t("pro.description"),
      price: "99",
      period: t("pro.period"),
      features: [
        { text: `${tFeatures("generationsPerMonth")}: 200`, included: true },
        { text: `${tFeatures("templates")}: ${tFeatures("allTemplates")}`, included: true },
        { text: `${tFeatures("resolution")}: ${tFeatures("hd")}`, included: true },
        { text: `${tFeatures("platforms")}: ${tFeatures("multiPlatform")}`, included: true },
        { text: `${tFeatures("batchGeneration")}: ${tFeatures("batch10")}`, included: true },
        { text: tFeatures("apiAccess"), included: false },
        { text: tFeatures("support"), included: true },
      ],
      cta: t("pro.cta"),
      ctaLink: "/generate",
      popular: true,
    },
    {
      key: "enterprise",
      name: t("enterprise.name"),
      description: t("enterprise.description"),
      price: "499",
      period: t("enterprise.period"),
      features: [
        { text: `${tFeatures("generationsPerMonth")}: ${tFeatures("unlimited")}`, included: true },
        { text: `${tFeatures("templates")}: ${tFeatures("customTemplates")}`, included: true },
        { text: `${tFeatures("resolution")}: ${tFeatures("4k")}`, included: true },
        { text: `${tFeatures("platforms")}: ${tFeatures("allPlatforms")}`, included: true },
        { text: `${tFeatures("batchGeneration")}: ${tFeatures("unlimited")}`, included: true },
        { text: tFeatures("apiAccess"), included: true },
        { text: tFeatures("support"), included: true },
      ],
      cta: t("enterprise.cta"),
      ctaLink: "#",
      popular: false,
    },
  ];

  const comparisons = [
    { feature: tFeatures("generationsPerMonth"), free: "10", pro: "200", enterprise: tFeatures("unlimited") },
    { feature: tFeatures("resolution"), free: tFeatures("standard"), pro: tFeatures("hd"), enterprise: tFeatures("4k") },
    { feature: tFeatures("templates"), free: tFeatures("basicTemplates"), pro: tFeatures("allTemplates"), enterprise: tFeatures("customTemplates") },
    { feature: tFeatures("platforms"), free: tFeatures("amazon"), pro: tFeatures("multiPlatform"), enterprise: tFeatures("allPlatforms") },
    { feature: tFeatures("batchGeneration"), free: tFeatures("notAvailable"), pro: tFeatures("batch10"), enterprise: tFeatures("unlimited") },
    { feature: tFeatures("apiAccess"), free: tFeatures("notAvailable"), pro: tFeatures("notAvailable"), enterprise: "✓" },
    { feature: tFeatures("generationSpeed"), free: tFeatures("standardSpeed"), pro: tFeatures("priority"), enterprise: tFeatures("highestPriority") },
    { feature: tFeatures("support"), free: tFeatures("community"), pro: tFeatures("prioritySupport"), enterprise: tFeatures("dedicatedManager") },
  ];

  const faqs = [
    {
      question: t("faq1.question"),
      answer: t("faq1.answer"),
    },
    {
      question: t("faq2.question"),
      answer: t("faq2.answer"),
    },
    {
      question: t("faq3.question"),
      answer: t("faq3.answer"),
    },
    {
      question: t("faq4.question"),
      answer: t("faq4.answer"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Header */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.key}
                  className={`
                    relative flex flex-col rounded-2xl bg-white p-8 shadow-sm
                    ${plan.popular ? "ring-2 ring-slate-900" : "border border-slate-200"}
                  `}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                        {t("mostPopular")}
                      </span>
                    </div>
                  )}

                  {/* Plan Info */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-slate-900">¥</span>
                      <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                      <span className="ml-1 text-slate-500">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <svg className="h-5 w-5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 shrink-0 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={feature.included ? "text-slate-700" : "text-slate-400"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    href={plan.ctaLink}
                    className={`
                      block w-full rounded-lg px-4 py-3 text-center text-sm font-medium transition-all
                      ${plan.popular
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      }
                    `}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">{t("comparison")}</h2>
              <p className="mt-2 text-slate-600">{t("comparisonSubtitle")}</p>
            </div>

            <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">{tFeatures("feature")}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{t("free.name")}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 bg-slate-100">{t("pro.name")}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{t("enterprise.name")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {comparisons.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-6 py-4 text-sm text-slate-700">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">{row.free}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 bg-slate-50">{row.pro}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">{t("faq")}</h2>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-slate-900 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              {t("ctaSubtitle")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/generate"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-slate-900 transition-all hover:bg-slate-100"
              >
                {t("ctaFree")}
              </Link>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-transparent px-6 py-3 text-base font-medium text-white transition-all hover:bg-slate-800"
              >
                {t("ctaContact")}
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
