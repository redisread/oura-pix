"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useAuth } from "@/hooks/use-auth";
import PasswordInput from "./ui/PasswordInput";
import { SocialLoginButtons } from "./auth/SocialLoginButtons";
import { AuthAside } from "./auth/AuthAside";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      window.location.href = localizeHref("/");
    } else {
      setError(result.error || m.login_error());
    }

    setIsLoading(false);
  };

  const checklist = [m.loginMarketing_featureFree(), m.loginMarketing_featureFast(), m.loginMarketing_featureQuality()];

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <AuthAside
        kicker="Returning bench"
        title={
          <>
            {m.loginMarketing_headline()}
            <span className="block text-[hsl(var(--primary))]">{m.loginMarketing_headlineHighlight()}</span>
          </>
        }
        description={m.loginMarketing_description()}
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
            <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--accent))]">Sign in</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.login_title()}</h1>
            <p className="mt-2 text-foreground-muted">{m.login_subtitle()}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-[hsl(var(--color-error)/0.3)] bg-[hsl(var(--color-error-light))] p-4">
              <p className="text-sm font-medium text-[hsl(var(--color-error))]">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={m.login_passwordPlaceholder()}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)]"
                />
                <label htmlFor="remember" className="cursor-pointer select-none text-sm text-foreground-muted">
                  {m.login_rememberMe()}
                </label>
              </div>
              <a
                href={localizeHref("/forgot-password")}
                className="text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary-hover))]"
              >
                {m.login_forgotPassword()}
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary h-11 w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {m.login_loading()}
                </>
              ) : (
                m.login_submit()
              )}
            </button>

            <SocialLoginButtons />
          </form>

          <div className="mt-8 border-t border-[hsl(var(--border))] pt-6">
            <p className="text-center text-sm text-foreground-muted">
              {m.login_noAccount()}{" "}
              <a
                href={localizeHref("/register")}
                className="font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary-hover))]"
              >
                {m.login_signUp()}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
