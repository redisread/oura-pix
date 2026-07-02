"use client";

import { useState } from "react";
import { CheckCircle2, MailCheck, Send } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { requestPasswordReset } from "@/lib/auth";
import BrandLink from "./ui/BrandLink";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await requestPasswordReset(email);
      if (!result.success) {
        setError(result.error || m.common_requestFailed());
      } else {
        setIsSent(true);
      }
    } catch {
      setError(m.common_requestFailed());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:block">
        <div className="proof-strip absolute inset-x-0 top-0 h-2" />
        <div className="bench-grid absolute inset-0 opacity-40" />
        <div className="relative z-10 flex min-h-screen flex-col justify-center px-12 xl:px-20">
          <BrandLink />
          <p className="page-kicker mt-12">{m.forgotPassword_sideKicker()}</p>
          <h2 className="font-display mt-4 max-w-xl text-5xl font-semibold leading-none text-foreground">
            {m.forgotPassword_sideTitle()}
          </h2>
          <p className="mt-6 max-w-md text-lg text-foreground-muted">
            {m.forgotPassword_sideDescription()}
          </p>
          <div className="card mt-10 overflow-hidden">
            <div className="proof-strip h-2" />
            <div className="space-y-4 p-5">
              {[m.forgotPassword_proofEmail(), m.forgotPassword_proofHistory(), m.forgotPassword_proofTeams()].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLink />
          </div>

          {isSent ? (
            <section className="text-center animate-fade-in">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--color-success-light))] text-[hsl(var(--color-success))]">
                <MailCheck className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="page-kicker">{m.forgotPassword_sentKicker()}</p>
              <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.forgotPassword_sentTitle()}</h1>
              <p className="mt-3 text-foreground-muted">{m.forgotPassword_sentDescription()}</p>
              <a href={localizeHref("/login")} className="btn-primary mt-8 h-11 px-6">{m.forgotPassword_backToLogin()}</a>
            </section>
          ) : (
            <>
              <div className="mb-8">
                <p className="page-kicker">{m.forgotPassword_formKicker()}</p>
                <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.forgotPassword_formTitle()}</h1>
                <p className="mt-2 text-foreground-muted">{m.forgotPassword_formDescription()}</p>
              </div>

              {error && (
                <div className="error-banner mb-6">
                  <p>{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    {m.login_email()}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={m.login_emailPlaceholder()}
                    className="input h-11"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary h-11 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {isLoading ? m.forgotPassword_sending() : m.forgotPassword_submit()}
                </button>
              </form>

              <div className="mt-8 border-t border-[hsl(var(--border))] pt-6 text-center">
                <a
                  href={localizeHref("/login")}
                  className="text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary-hover))]"
                >{m.forgotPassword_backToLogin()}</a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
