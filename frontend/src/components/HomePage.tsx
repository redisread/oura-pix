"use client";

import { ArrowRight, Sparkles, Zap, Globe, Shield } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient mesh */}
          <div className="absolute inset-0 gradient-mesh" />
          <div className="absolute inset-0 gradient-radial" />

          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary))]/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-24 text-center lg:py-36">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.1)] px-4 py-1.5 text-sm animate-fade-in-up">
                <span className="status-dot status-dot-online" />
                <span className="text-foreground-muted">AI Powered Product Generation</span>
              </div>

              {/* Title */}
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-in-up stagger-1">
                {m.welcome()}
              </h1>

              {/* Gradient text effect for key word */}
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight mt-2 sm:text-5xl lg:text-6xl animate-fade-in-up stagger-2">
                <span className="gradient-text">{m.description()}</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-lg text-foreground-muted animate-fade-in-up stagger-3">
                Transform your product images into stunning detail pages with AI.
                Generate professional content for Amazon, Shopify, eBay, and more.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row animate-fade-in-up stagger-4">
                <a
                  href={localizeHref("/generate")}
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium"
                >
                  <Sparkles className="h-5 w-5" />
                  {m.generate()}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={localizeHref("/pricing")}
                  className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium"
                >
                  {m.pricing()}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl animate-fade-in-up">
                Everything you need
              </h2>
              <p className="mt-4 text-lg text-foreground-muted">
                Create stunning product pages in minutes
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Sparkles,
                  title: "AI Generation",
                  desc: "Generate pages with AI",
                  color: "from-[hsl(var(--primary))] to-violet-500",
                },
                {
                  icon: Globe,
                  title: "Multi-language",
                  desc: "Support for multiple languages",
                  color: "from-cyan-500 to-blue-500",
                },
                {
                  icon: Zap,
                  title: "Fast Export",
                  desc: "Export in multiple formats",
                  color: "from-amber-500 to-orange-500",
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  desc: "Your data stays protected",
                  color: "from-emerald-500 to-green-500",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="card card-hover p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-2.5`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-foreground-muted">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24">
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="card p-12 lg:p-16 glow-sm">
              <div className="absolute inset-0 gradient-radial opacity-50" />
              <div className="relative">
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Ready to get started?
                </h2>
                <p className="mt-4 text-lg text-foreground-muted">
                  Create your first product page in minutes
                </p>
                <div className="mt-10">
                  <a
                    href={localizeHref("/generate")}
                    className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium"
                  >
                    <Sparkles className="h-5 w-5" />
                    Start Generating
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
