"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import { resetPassword } from "@/lib/auth";
import BrandLink from "./ui/BrandLink";
import { ErrorBanner } from "./ui";
import PasswordInput from "./ui/PasswordInput";
import * as m from "@/paraglide/messages.js";
import { AuthAside } from "./auth/AuthAside";

const RESET_CHECKLIST = [
  m.resetPassword_requirementLength(),
  m.resetPassword_requirementLogin(),
  m.resetPassword_requirementData(),
] as const;

interface Props {
  token: string | null;
}

export default function ResetPasswordPage({ token }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    setIsValidToken(Boolean(token));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(m.resetPassword_errorMismatch());
      return;
    }

    if (password.length < 8) {
      setError(m.resetPassword_errorTooShort());
      return;
    }

    if (!token) {
      setError(m.resetPassword_errorInvalidLink());
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);
      if (!result.success) {
        setError(result.error || m.resetPassword_errorFailed());
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = localizeHref("/login");
        }, 3000);
      }
    } catch {
      setError(m.resetPassword_errorFailed());
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <AuthAside
          kicker={m.resetPassword_sideKicker()}
          title={m.resetPassword_invalidSideTitle()}
          description={m.resetPassword_invalidSideDescription()}
          checklist={[...RESET_CHECKLIST]}
        />
        <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLink />
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--color-error-light))] text-[hsl(var(--color-error))]">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="page-kicker">{m.resetPassword_invalidKicker()}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.resetPassword_invalidHeroTitle()}</h1>
            <p className="mt-3 text-foreground-muted">{m.resetPassword_invalidDescription()}</p>
            <a href={localizeHref("/forgot-password")} className="btn-primary mt-8 h-11 px-6">{m.resetPassword_requestAgain()}</a>
          </div>
        </main>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <AuthAside
          kicker={m.resetPassword_sideKicker()}
          title={m.resetPassword_successSideTitle()}
          description={m.resetPassword_successSideDescription()}
          checklist={[...RESET_CHECKLIST]}
        />
        <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLink />
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--color-success-light))] text-[hsl(var(--color-success))]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="page-kicker">{m.resetPassword_successKicker()}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.resetPassword_successTitle()}</h1>
            <p className="mt-3 text-foreground-muted">{m.resetPassword_successDescription()}</p>
            <a href={localizeHref("/login")} className="btn-primary mt-8 h-11 px-6">{m.resetPassword_loginNow()}</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <AuthAside
        kicker={m.resetPassword_sideKicker()}
        title={m.resetPassword_formSideTitle()}
        description={m.resetPassword_formSideDescription()}
        checklist={[...RESET_CHECKLIST]}
      />

      <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLink />
          </div>

          <div className="mb-8">
            <p className="page-kicker">{m.resetPassword_formKicker()}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">{m.resetPassword_heroTitle()}</h1>
            <p className="mt-2 text-foreground-muted">{m.resetPassword_formDescription()}</p>
          </div>

          {error && <ErrorBanner message={error} className="mb-6" />}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">{m.resetPassword_newPassword()}</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={m.resetPassword_newPasswordPlaceholder()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">{m.resetPassword_confirmPassword()}</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={m.resetPassword_confirmPasswordPlaceholder()}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary h-11 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {isLoading ? m.resetPassword_loading() : m.resetPassword_submit()}
            </button>
          </form>

          <div className="mt-8 border-t border-[hsl(var(--border))] pt-6 text-center">
            <a
              href={localizeHref("/login")}
              className="text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary-hover))]"
            >{m.resetPassword_backToLogin()}</a>
          </div>
        </div>
      </main>
    </div>
  );
}
