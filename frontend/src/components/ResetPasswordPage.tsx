"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { resetPassword } from "@/lib/auth";

// PasswordInput sub-component
function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 ${className}`}
        {...props}
      />
      <button
        type="button"
        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
        aria-label={showPassword ? m.resetPassword_hidePassword() : m.resetPassword_showPassword()}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

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
    if (!token) {
      setIsValidToken(false);
      return;
    }
    setIsValidToken(true);
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

  // Invalid token state
  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          </div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <div className="mb-8">
              <a href={localizeHref("/")} className="flex items-center gap-3 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
                  <span className="text-2xl font-bold text-white">O</span>
                </div>
                <span className="text-3xl font-bold text-white">OuraPix</span>
              </a>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              {m.resetPassword_invalidHeroTitle()}<br />
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {m.resetPassword_invalidHeroHighlight()}
              </span>
            </h1>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12 xl:px-16 bg-white">
          <div className="w-full max-w-md mx-auto">
            <div className="lg:hidden flex justify-center mb-8">
              <a href={localizeHref("/")} className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                  <span className="text-xl font-bold text-white">O</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">OuraPix</span>
              </a>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {m.resetPassword_invalidTitle()}
              </h2>
              <p className="text-slate-500 mb-8">
                {m.resetPassword_invalidDescription()}
              </p>
              <a
                href={localizeHref("/forgot-password")}
                className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
              >
                {m.resetPassword_requestAgain()}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          </div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <div className="mb-8">
              <a href={localizeHref("/")} className="flex items-center gap-3 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
                  <span className="text-2xl font-bold text-white">O</span>
                </div>
                <span className="text-3xl font-bold text-white">OuraPix</span>
              </a>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              {m.resetPassword_successHeroTitle()}<br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {m.resetPassword_successHeroHighlight()}
              </span>
            </h1>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12 xl:px-16 bg-white">
          <div className="w-full max-w-md mx-auto">
            <div className="lg:hidden flex justify-center mb-8">
              <a href={localizeHref("/")} className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                  <span className="text-xl font-bold text-white">O</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">OuraPix</span>
              </a>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {m.resetPassword_successTitle()}
              </h2>
              <p className="text-slate-500 mb-8">
                {m.resetPassword_successDescription()}
              </p>
              <a
                href={localizeHref("/login")}
                className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
              >
                {m.resetPassword_loginNow()}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <a href={localizeHref("/")} className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
                <span className="text-2xl font-bold text-white">O</span>
              </div>
              <span className="text-3xl font-bold text-white">OuraPix</span>
            </a>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            {m.resetPassword_heroTitle()}<br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {m.resetPassword_heroHighlight()}
            </span>
          </h1>

          <p className="text-lg text-slate-300 mb-8 max-w-md">
            {m.resetPassword_heroDescription()}
          </p>

          <div className="flex items-center gap-3 text-slate-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>{m.resetPassword_securityHint()}</span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12 xl:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <a href={localizeHref("/")} className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                <span className="text-xl font-bold text-white">O</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">OuraPix</span>
            </a>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {m.resetPassword_formTitle()}
            </h2>
            <p className="text-slate-500">
              {m.resetPassword_formDescription()}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                {m.resetPassword_newPassword()}
              </label>
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
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                {m.resetPassword_confirmPassword()}
              </label>
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
              className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-medium transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {m.resetPassword_loading()}
                </>
              ) : (
                m.resetPassword_submit()
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-500">
              <a
                href={localizeHref("/login")}
                className="font-medium text-slate-900 hover:text-slate-700 transition-colors"
              >
                {m.resetPassword_backToLogin()}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
