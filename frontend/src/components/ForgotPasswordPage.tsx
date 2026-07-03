"use client";

import { useState } from "react";
import { MailCheck, Send } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { requestPasswordReset } from "@/lib/auth";
import BrandLink from "./ui/BrandLink";
import { ErrorBanner } from "./ui";
import { AuthAside } from "./auth/AuthAside";

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
      <AuthAside
        kicker={m.forgotPassword_sideKicker()}
        title={m.forgotPassword_sideTitle()}
        description={m.forgotPassword_sideDescription()}
        checklist={[
          m.forgotPassword_proofEmail(),
          m.forgotPassword_proofHistory(),
          m.forgotPassword_proofTeams(),
        ]}
      />

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

              {error && <ErrorBanner message={error} className="mb-6" />}

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
