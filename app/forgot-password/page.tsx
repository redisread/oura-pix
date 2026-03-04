"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSent(true);
    } catch (err) {
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-2xl" />
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
            忘记密码？<br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              别担心
            </span>
          </h1>

          <p className="text-lg text-slate-300 mb-8 max-w-md">
            我们会向您发送一封包含重置链接的邮件，帮您快速找回账户访问权限。
          </p>

          <div className="flex items-center gap-3 text-slate-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span>检查收件箱，邮件可能被归类到垃圾邮件</span>
          </div>
        </div>
      </div>

      {/* 右侧表单区域 */}
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

          {isSent ? (
            <div className="text-center animate-fade-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {t("successTitle")}
              </h2>
              <p className="text-slate-500 mb-8">
                {t("success")}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <>
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

              {/* 表单 */}
              <form className="space-y-5" onSubmit={handleSubmit}>
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

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
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
              </form>

              {/* 返回登录 */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-slate-500">
                  <Link
                    href="/login"
                    className="font-medium text-slate-900 hover:text-slate-700 transition-colors"
                  >
                    {t("backToLogin")}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
