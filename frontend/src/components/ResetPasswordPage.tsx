"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  PackageCheck,
} from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import { resetPassword } from "@/lib/auth";

function BrandLink() {
  return (
    <a href={localizeHref("/")} className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
        <PackageCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="font-display text-2xl font-semibold text-foreground">OuraPix</span>
    </a>
  );
}

function RecoveryAside({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:block">
      <div className="proof-strip absolute inset-x-0 top-0 h-2" />
      <div className="bench-grid absolute inset-0 opacity-40" />
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-12 xl:px-20">
        <BrandLink />
        <p className="page-kicker mt-12">Credential proof</p>
        <h2 className="font-display mt-4 max-w-xl text-5xl font-semibold leading-none text-foreground">
          {title}
        </h2>
        <p className="mt-6 max-w-md text-lg text-foreground-muted">{description}</p>
        <div className="card mt-10 overflow-hidden">
          <div className="proof-strip h-2" />
          <div className="space-y-4 p-5">
            {["新密码至少 8 位", "重置完成后回到登录台", "商品与团队数据保持不变"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PasswordInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        className={`input h-11 pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        className="absolute right-0 top-0 flex h-full items-center px-3 text-foreground-muted transition-colors hover:text-foreground"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
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
    setIsValidToken(Boolean(token));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 8) {
      setError("密码长度至少8位");
      return;
    }

    if (!token) {
      setError("无效的重置链接");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);
      if (!result.success) {
        setError(result.error || "重置失败");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = localizeHref("/login");
        }, 3000);
      }
    } catch {
      setError("重置失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <RecoveryAside
          title="Expired links stay outside the listing bench."
          description="链接失效时不再接受密码改写，避免过期邮件继续打开账户入口。"
        />
        <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLink />
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--color-error-light))] text-[hsl(var(--color-error))]">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="page-kicker">Invalid reset link</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">
              链接已失效
            </h1>
            <p className="mt-3 text-foreground-muted">该密码重置链接已过期或无效。</p>
            <a href={localizeHref("/forgot-password")} className="btn-primary mt-8 h-11 px-6">
              重新申请
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <RecoveryAside
          title="The account is cleared back onto the workbench."
          description="新密码已生效，几秒后会带您回到登录入口继续处理商品图。"
        />
        <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLink />
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--color-success-light))] text-[hsl(var(--color-success))]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="page-kicker">Password updated</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">
              重置成功
            </h1>
            <p className="mt-3 text-foreground-muted">您的密码已重置，即将跳转到登录页面。</p>
            <a href={localizeHref("/login")} className="btn-primary mt-8 h-11 px-6">
              立即登录
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <RecoveryAside
        title="Set a fresh key before returning to production work."
        description="用新密码恢复账户访问，再继续生成、导出和复用商品详情页素材。"
      />

      <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--background))] px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLink />
          </div>

          <div className="mb-8">
            <p className="page-kicker">Set password</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">
              设置新密码
            </h1>
            <p className="mt-2 text-foreground-muted">请输入您的新密码。</p>
          </div>

          {error && (
            <div className="error-banner mb-6">
              <p>{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                新密码
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入新密码"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                确认密码
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary h-11 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {isLoading ? "重置中..." : "重置密码"}
            </button>
          </form>

          <div className="mt-8 border-t border-[hsl(var(--border))] pt-6 text-center">
            <a
              href={localizeHref("/login")}
              className="text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary-hover))]"
            >
              返回登录
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
