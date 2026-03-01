"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations();

  const steps = [
    {
      number: "01",
      title: t("steps.step1.title"),
      description: t("steps.step1.description"),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: t("steps.step2.title"),
      description: t("steps.step2.description"),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: t("steps.step3.title"),
      description: t("steps.step3.description"),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  const features = [
    {
      title: t("homeFeatures.feature1.title"),
      description: t("homeFeatures.feature1.description"),
    },
    {
      title: t("homeFeatures.feature2.title"),
      description: t("homeFeatures.feature2.description"),
    },
    {
      title: t("homeFeatures.feature3.title"),
      description: t("homeFeatures.feature3.description"),
    },
    {
      title: t("homeFeatures.feature4.title"),
      description: t("homeFeatures.feature4.description"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-20 text-center lg:py-32">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm">
                <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500"></span>
                {t("hero.badge")}
              </div>

              {/* Title */}
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {t("hero.title")}
                <span className="relative mx-2">
                  <span className="relative z-10">{t("hero.titleHighlight")}</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200/60 -z-0"></span>
                </span>
                {t("hero.subtitle")}
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-lg text-slate-600">
                {t("hero.description")}
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/generate"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-8 py-3 text-base font-medium text-white transition-all hover:bg-slate-800 hover:scale-105"
                >
                  {t("hero.ctaPrimary")}
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-8 py-3 text-base font-medium text-slate-700 transition-all hover:bg-slate-50"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 border-t border-slate-200 pt-8 sm:gap-16">
                <div>
                  <div className="text-3xl font-bold text-slate-900">10K+</div>
                  <div className="mt-1 text-sm text-slate-500">{t("stats.pagesGenerated")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">98%</div>
                  <div className="mt-1 text-sm text-slate-500">{t("stats.satisfaction")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">3min</div>
                  <div className="mt-1 text-sm text-slate-500">{t("stats.avgTime")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900">{t("steps.title")}</h2>
              <p className="mt-4 text-lg text-slate-600">
                {t("steps.subtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 text-6xl font-bold text-slate-100">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-slate-600">{step.description}</p>

                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <svg className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900">{t("homeFeatures.title")}</h2>
              <p className="mt-4 text-lg text-slate-600">
                {t("homeFeatures.subtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-900 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              {t("cta.subtitle")}
            </p>
            <div className="mt-10">
              <Link
                href="/generate"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-medium text-slate-900 transition-all hover:bg-slate-100 hover:scale-105"
              >
                {t("hero.ctaFree")}
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
