"use client";

import * as m from "@/paraglide/messages.js";

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
    { feature: m.pricingFeatures_apiAccess(), free: m.pricingFeatures_notAvailable(), pro: "✓", enterprise: "✓" },
    { feature: m.pricingFeatures_generationSpeed(), free: m.pricingFeatures_standardSpeed(), pro: m.pricingFeatures_priority(), enterprise: m.pricingFeatures_highestPriority() },
    { feature: m.pricingFeatures_support(), free: m.pricingFeatures_community(), pro: m.pricingFeatures_prioritySupport(), enterprise: m.pricingFeatures_dedicatedManager() },
  ];

  const faqs = [
    {
      question: m.pricing_faq1_question(),
      answer: m.pricing_faq1_answer(),
    },
    {
      question: m.pricing_faq2_question(),
      answer: m.pricing_faq2_answer(),
    },
    {
      question: m.pricing_faq3_question(),
      answer: m.pricing_faq3_answer(),
    },
    {
      question: m.pricing_faq4_question(),
      answer: m.pricing_faq4_answer(),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Header */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
              {m.pricing_title()}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              {m.pricing_subtitle()}
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
                        {m.pricing_mostPopular()}
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
                  <a
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
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">{m.pricing_comparison()}</h2>
              <p className="mt-2 text-slate-600">{m.pricing_comparisonSubtitle()}</p>
            </div>

            <div className="mt-10 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">{m.pricingFeatures_feature()}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{m.pricing_free_name()}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 bg-slate-100">{m.pricing_pro_name()}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{m.pricing_enterprise_name()}</th>
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
              <h2 className="text-2xl font-bold text-slate-900">{m.pricing_faq()}</h2>
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
              {m.pricing_ctaTitle()}
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              {m.pricing_ctaSubtitle()}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/generate"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-slate-900 transition-all hover:bg-slate-100"
              >
                {m.pricing_ctaFree()}
              </a>
              <a
                href="mailto:sales@ourapix.com"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-transparent px-6 py-3 text-base font-medium text-white transition-all hover:bg-slate-800"
              >
                {m.pricing_ctaContact()}
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
