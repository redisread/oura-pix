/**
 * AccountSettings Component (P1 #91 T3)
 *
 * Account settings: avatar / nickname / email (read-only) / password change.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Loader2, Lock, Save, Trash2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "../ui/Toast";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

interface FormState {
  nickname: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const NICKNAME_MAX = 50;

export default function AccountSettings() {
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    nickname: user?.name ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.image ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, nickname: user.name ?? prev.nickname }));
      setAvatarPreview(user.image ?? null);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChangeNickname = (v: string) => {
    const truncated = v.slice(0, NICKNAME_MAX);
    setForm((f) => ({ ...f, nickname: truncated }));
    setDirty(true);
  };

  const onPickAvatar = (file: File | null) => {
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("头像文件不能超过 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    setPendingAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const onSaveProfile = async () => {
    if (!user) return;
    if (form.nickname.trim().length === 0) {
      toast.error("昵称不能为空");
      return;
    }
    setSavingProfile(true);
    try {
      // Update nickname via existing /api/user/profile
      const profileRes = await api.put("/api/user/profile", { name: form.nickname.trim() });
      if (!profileRes.data?.success) {
        throw new Error(profileRes.data?.error?.message ?? "保存失败");
      }

      // Upload avatar if pending
      if (pendingAvatar) {
        const fd = new FormData();
        fd.append("avatar", pendingAvatar);
        const avatarRes = await api.put("/api/user/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (!avatarRes.data?.success) {
          throw new Error(avatarRes.data?.error?.message ?? "头像上传失败");
        }
      }

      // Refresh user in store
      setUser({
        ...user,
        name: form.nickname.trim(),
        image: avatarPreview ?? user.image,
      });

      setDirty(false);
      setPendingAvatar(null);
      toast.success("账号信息已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (form.currentPassword.length === 0) {
      toast.error("请输入当前密码");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("新密码至少 8 位");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    setSavingPassword(true);
    try {
      // Use Better Auth change-password endpoint via /api/auth
      const res = await api.post("/api/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (!res.data?.success && res.status >= 400) {
        throw new Error(res.data?.error?.message ?? "密码修改失败");
      }
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success("密码修改成功");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "密码修改失败");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="card p-8 text-center text-foreground-muted">请先登录</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">账号设置</h2>
        <p className="mt-1 text-sm text-foreground-muted">管理你的头像、昵称和密码</p>
      </div>

      {/* Avatar + Nickname */}
      <div className="card p-6 space-y-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UserIcon className="h-4 w-4" /> 基本资料
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[hsl(var(--secondary))] flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="头像预览" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-12 w-12 text-foreground-muted" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                aria-label="更换头像"
              >
                <Camera className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[hsl(var(--primary))] hover:underline"
            >
              更换头像
            </button>
            <span className="text-xs text-foreground-muted">最大 2MB</span>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">
                昵称（{form.nickname.length}/{NICKNAME_MAX}）
              </label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => onChangeNickname(e.target.value)}
                maxLength={NICKNAME_MAX}
                className="input"
                placeholder="输入昵称"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">邮箱</label>
              <input
                type="email"
                value={user.email ?? ""}
                readOnly
                className="input opacity-70 cursor-not-allowed"
                title="邮箱修改需要重新验证"
              />
              <p className="text-xs text-foreground-muted mt-1">
                邮箱修改需要重新验证，暂不支持
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[hsl(var(--border))] pt-4">
          <button
            type="button"
            onClick={onSaveProfile}
            disabled={!dirty || savingProfile}
            className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" /> 修改密码
        </h3>

        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">当前密码</label>
          <div className="relative">
            <input
              type={showCurrentPwd ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className="input pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted"
              aria-label={showCurrentPwd ? "隐藏密码" : "显示密码"}
            >
              {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">新密码（至少 8 位）</label>
          <div className="relative">
            <input
              type={showNewPwd ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="input pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted"
              aria-label={showNewPwd ? "隐藏密码" : "显示密码"}
            >
              {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">确认新密码</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="input"
            autoComplete="new-password"
          />
        </div>

        <div className="flex justify-end border-t border-[hsl(var(--border))] pt-4">
          <button
            type="button"
            onClick={onChangePassword}
            disabled={
              savingPassword ||
              form.currentPassword.length === 0 ||
              form.newPassword.length === 0 ||
              form.confirmPassword.length === 0
            }
            className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            修改密码
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200 dark:border-red-900">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
          <Trash2 className="h-4 w-4" /> 危险操作
        </h3>
        <p className="text-sm text-foreground-muted mb-4">
          删除账号将永久清除所有数据，无法恢复。
        </p>
        <button
          type="button"
          disabled
          className="px-4 py-2 rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-medium opacity-50 cursor-not-allowed"
          title="联系客服删除账号"
        >
          删除账号（请联系客服）
        </button>
      </div>
    </div>
  );
}