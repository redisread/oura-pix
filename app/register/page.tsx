"use client";

export const runtime = "edge";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 验证密码是否匹配
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    // 验证密码强度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(t("passwordRequirements"));
      setIsLoading(false);
      return;
    }

    try {
      // 模拟注册 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 存储登录状态到 cookie
      document.cookie = "auth-token=demo-token; path=/; max-age=604800"; // 7天

      // 注册成功，跳转到首页
      router.push("/");
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                {t("name")}
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-slate-900 sm:text-sm"
                  placeholder={t("namePlaceholder")}
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                {t("password")}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-slate-900 sm:text-sm"
                  placeholder={t("passwordPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                {t("confirmPassword")}
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-slate-900 sm:text-sm"
                  placeholder={t("confirmPasswordPlaceholder")}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-slate-900">
                {t("agreeToTerms")}{" "}
                <Link href="/docs/terms" className="text-slate-900 font-medium hover:underline">
                  {t("termsOfService")}
                </Link>{" "}
                {t("and")}{" "}
                <Link href="/docs/privacy" className="text-slate-900 font-medium hover:underline">
                  {t("privacyPolicy")}
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !agreeTerms}
                className="flex w-full justify-center rounded-md border border-transparent bg-slate-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t("loading") : t("submit")}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">
                  {t("hasAccount")}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="font-medium text-slate-900 hover:text-slate-700"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
