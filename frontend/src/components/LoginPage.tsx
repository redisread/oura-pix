"use client";

import { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useAuth } from "@/hooks/use-auth";
import { signInSocial } from "@/lib/auth";

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
        className={`input pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        className="absolute right-0 top-0 h-full px-3 text-foreground-muted hover:text-foreground transition-colors"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
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

// Social login buttons
function SocialLoginButtons() {
  const handleGoogleLogin = () => {
    signInSocial("google", localizeHref("/"));
  };

  const handleGitHubLogin = () => {
    signInSocial("github", localizeHref("/"));
  };

  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[hsl(var(--border))]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[hsl(var(--background))] px-3 text-foreground-muted">
            {m.auth_continueWith()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-secondary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={handleGitHubLogin}
          className="btn-secondary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>
    </>
  );
}

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

  return (
    <div className="flex min-h-screen">
      {/* Left side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[hsl(var(--background-secondary))]">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[hsl(var(--primary))]/10 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <a href={localizeHref("/")} className="flex items-center gap-3 group">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 opacity-80 blur-xl" />
                <span className="relative text-2xl font-bold text-white">
                  <Sparkles className="h-6 w-6" />
                </span>
              </div>
              <span className="text-3xl font-bold text-foreground">OuraPix</span>
            </a>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
            {m.loginMarketing_headline()}<br />
            <span className="gradient-text">
              {m.loginMarketing_headlineHighlight()}
            </span>
          </h1>

          <p className="text-lg text-foreground-muted mb-8 max-w-md">
            {m.loginMarketing_description()}
          </p>

          <div className="flex items-center gap-6 text-sm text-foreground-muted">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[hsl(var(--primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{m.loginMarketing_featureFree()}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[hsl(var(--primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{m.loginMarketing_featureFast()}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[hsl(var(--primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{m.loginMarketing_featureQuality()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12 xl:px-16 bg-[hsl(var(--background))]">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <a href={localizeHref("/")} className="flex items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 opacity-80" />
                <span className="relative text-xl font-bold text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
              </div>
              <span className="text-2xl font-bold text-foreground">OuraPix</span>
            </a>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {m.login_title()}
            </h2>
            <p className="text-foreground-muted">
              {m.login_subtitle()}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[hsl(var(--color-error-light))] border border-[hsl(var(--color-error)/0.3)]">
              <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {m.login_password()}
              </label>
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)]"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-foreground-muted cursor-pointer select-none"
                >
                  {m.login_rememberMe()}
                </label>
              </div>
              <a
                href={localizeHref("/forgot-password")}
                className="text-sm font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))] transition-colors"
              >
                {m.login_forgotPassword()}
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-11 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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

          {/* Register link */}
          <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
            <p className="text-center text-foreground-muted text-sm">
              {m.login_noAccount()}{" "}
              <a
                href={localizeHref("/register")}
                className="font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))] transition-colors"
              >
                {m.login_signUp()}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
