"use client";

export const runtime = "edge";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 模拟发送重置密码邮件
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSent(true);
    } catch (err) {
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-lg font-bold text-white">O</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">OuraPix</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          {t("title")}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10">
          {isSent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm text-slate-600">{t("success")}</p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="font-medium text-slate-900 hover:text-slate-700"
                >
                  {t("backToLogin")}
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  {t("email")}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-slate-900 sm:text-sm"
                    placeholder={t("emailPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-slate-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t("loading") : t("submit")}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-900 hover:text-slate-700"
                >
                  {t("backToLogin")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
