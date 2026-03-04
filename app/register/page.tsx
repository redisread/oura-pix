"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

export default function RegisterPage() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
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

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    const result = await register(name, email, password);

    if (result.success) {
      toast({
        title: t("successTitle"),
        description: t("successDesc"),
      });
      router.push("/");
    } else {
      setError(result.error || t("error"));
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl" />
        </div>

        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
                <Image src="/favicon.svg" alt="OuraPix" width={28} height={28} />
              </div>
              <span className="text-3xl font-bold text-white">OuraPix</span>
            </Link>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            开启您的<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              创意之旅
            </span>
          </h1>

          <p className="text-lg text-slate-300 mb-8 max-w-md">
            注册即可享受 AI 智能修图、一键抠图、批量处理等强大功能，让创作更简单。
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span>AI 智能处理，效率提升 10 倍</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>支持多种图片格式，批量上传</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span>数据安全加密，隐私有保障</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧注册表单区域 */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-12 xl:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                <Image src="/favicon.svg" alt="OuraPix" width={24} height={24} />
              </div>
              <span className="text-2xl font-bold text-slate-900">OuraPix</span>
            </Link>
          </div>

          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {t("title")}
            </h2>
            <p className="text-slate-500">
              {t("subtitle")}
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 注册表单 */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">
                {t("name")}
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                {t("email")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                {t("password")}
              </Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                {t("confirmPassword")}
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-slate-900 transition-colors"
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
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-sm text-slate-600 cursor-pointer select-none">
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

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
              disabled={isLoading || authLoading || !agreeTerms}
            >
              {isLoading || authLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("loading")}
                </span>
              ) : (
                t("submit")
              )}
            </Button>

            <SocialLoginButtons />
          </form>

          {/* 登录链接 */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-500">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-slate-900 hover:text-slate-700 transition-colors"
              >
                {t("signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}