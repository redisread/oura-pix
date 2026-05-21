"use client";

import * as m from "@/paraglide/messages.js";

export default function HomePage() {
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
                AI Powered
              </div>

              {/* Title */}
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {m.welcome()}
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-lg text-slate-600">
                {m.description()}
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/generate"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-8 py-3 text-base font-medium text-white transition-all hover:bg-slate-800 hover:scale-105"
                >
                  {m.generate()}
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-8 py-3 text-base font-medium text-slate-700 transition-all hover:bg-slate-50"
                >
                  {m.pricing()}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900">Features</h2>
              <p className="mt-4 text-lg text-slate-600">
                Everything you need to create stunning product pages
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "AI Generation", desc: "Generate pages with AI" },
                { title: "Multi-language", desc: "Support for multiple languages" },
                { title: "Fast Export", desc: "Export in multiple formats" },
                { title: "Easy to Use", desc: "Simple and intuitive interface" },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-900 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Create your first product page in minutes
            </p>
            <div className="mt-10">
              <a
                href="/generate"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-medium text-slate-900 transition-all hover:bg-slate-100 hover:scale-105"
              >
                Start Generating
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
