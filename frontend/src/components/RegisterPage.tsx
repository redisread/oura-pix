"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useAuth } from "@/hooks/use-auth";
import PasswordInput from "./ui/PasswordInput";
import { SocialLoginButtons } from "./auth/SocialLoginButtons";
import { AuthAside } from "./auth/AuthAside";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(m.register_passwordMismatch());
      setIsLoading(false);
      return;
    }

    const result = await register(name, email, password);

    if (result.success) {
      window.location.href = localizeHref("/");
    } else {
      setError(result.error || m.register_passwordMismatch());
    }

    setIsLoading(false);
  };

  const checklist = [m.registerMarketing_feature1(), m.registerMarketing_feature2(), m.registerMarketing_feature3()];

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <AuthAside
        kicker="New seller bench"
        title={
          <>
            {m.registerMarketing_headline()}
            <span className="block text-[hsl(var(--primary))]">{m.registerMarketing_headlineHighlight()}</span>
          </>
        }
        description={m.registerMarketing_description()}
        checklist={checklist}
      />

      <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <a href={localizeHref("/")} className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <PackageCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="font-display text-2xl font-semibold text-foreground">OuraPix</span>
            </a>
          </div>

          <div className="mb-8">
            <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--accent))]">Create account</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.register_title()}</h1>
            <p className="mt-2 text-foreground-muted">{m.register_subtitle()}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-[hsl(var(--color-error)/0.3)] bg-[hsl(var(--color-error-light))] p-4">
              <p className="text-sm font-medium text-[hsl(var(--color-error))]">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-foreground">{m.register_name()}</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={m.register_namePlaceholder()}
                className="input h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">{m.login_email()}</label>
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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">{m.login_password()}</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={m.login_passwordPlaceholder()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">{m.register_confirmPassword()}</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={m.register_confirmPasswordPlaceholder()}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)]"
              />
              <label htmlFor="agree-terms" className="cursor-pointer select-none text-sm text-foreground-muted">
                {m.register_agreeToTerms()}{" "}
                <a href={localizeHref("/docs/terms")} className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]">
                  {m.register_termsOfService()}
                </a>{" "}
                {m.register_and()}{" "}
                <a href={localizeHref("/docs/privacy")} className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]">
                  {m.register_privacyPolicy()}
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !agreeTerms}
              className="btn-primary h-11 w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {m.register_loading()}
                </>
              ) : (
                m.register_submit()
              )}
            </button>

            <SocialLoginButtons />
          </form>

          <div className="mt-8 border-t border-[hsl(var(--border))] pt-6">
            <p className="text-center text-sm text-foreground-muted">
              {m.register_hasAccount()}{" "}
              <a
                href={localizeHref("/login")}
                className="font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary-hover))]"
              >
                {m.register_signIn()}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
