/**
 * AccountSettings Component (P1 #91 T3)
 *
 * Account settings: avatar / nickname / email (read-only) / password change.
 */

"use client";

import * as m from "@/paraglide/messages.js";

import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Loader2, Lock, Save, Trash2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "../ui/Toast";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { SettingSection, SettingCard, SettingField, SettingActions } from "./ui";
import { StateMessage } from "@/components/StateMessage";

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
      toast.error(m.account_avatarTooLarge());
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(m.account_selectImageFile());
      return;
    }
    setPendingAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const onSaveProfile = async () => {
    if (!user) return;
    if (form.nickname.trim().length === 0) {
      toast.error(m.account_nicknameRequired());
      return;
    }
    setSavingProfile(true);
    try {
      const profileRes = await api.put("/api/user/profile", { name: form.nickname.trim() });
      if (!profileRes.data?.success) {
        throw new Error(profileRes.data?.error?.message ?? m.account_saveFailed());
      }

      if (pendingAvatar) {
        const fd = new FormData();
        fd.append("avatar", pendingAvatar);
        const avatarRes = await api.put("/api/user/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (!avatarRes.data?.success) {
          throw new Error(avatarRes.data?.error?.message ?? m.account_avatarUploadFailed());
        }
      }

      setUser({
        ...user,
        name: form.nickname.trim(),
        image: avatarPreview ?? user.image,
      });

      setDirty(false);
      setPendingAvatar(null);
      toast.success(m.account_profileSaved());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.account_saveFailed());
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (form.currentPassword.length === 0) {
      toast.error(m.account_currentPasswordRequired());
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error(m.account_passwordMinLength());
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error(m.account_passwordMismatch());
      return;
    }
    setSavingPassword(true);
    try {
      const res = await api.post("/api/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (!res.data?.success && res.status >= 400) {
        throw new Error(res.data?.error?.message ?? m.account_passwordChangeFailed());
      }
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success(m.account_passwordChanged());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.account_passwordChangeFailed());
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return <StateMessage variant="empty" title="请先登录" />;
  }

  return (
    <div className="space-y-6">
      <SettingSection title="账号设置" description="管理你的头像、昵称和密码" icon={<UserIcon className="h-5 w-5" />} />

      {/* Profile */}
      <SettingCard title="基本信息" icon={<Camera className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[hsl(var(--secondary))] flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-foreground-muted" />
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-1"
              >
                <Camera className="h-3.5 w-3.5" />
                更换头像
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-foreground-muted mt-1">支持 JPG/PNG，最大 2MB</p>
            </div>
          </div>

          <SettingField label="昵称">
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => onChangeNickname(e.target.value)}
              className="input"
              maxLength={NICKNAME_MAX}
            />
          </SettingField>

          <SettingField label="邮箱" hint="邮箱修改需要重新验证，暂不支持">
            <input
              type="email"
              value={user.email ?? ""}
              readOnly
              className="input opacity-70 cursor-not-allowed"
              title="邮箱修改需要重新验证"
            />
          </SettingField>
        </div>

        <SettingActions>
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
        </SettingActions>
      </SettingCard>

      {/* Password */}
      <SettingCard title="修改密码" icon={<Lock className="h-4 w-4" />}>
        <SettingField label="当前密码">
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
        </SettingField>

        <SettingField label="新密码（至少 8 位）">
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
        </SettingField>

        <SettingField label="确认新密码">
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="input"
            autoComplete="new-password"
          />
        </SettingField>

        <SettingActions>
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
        </SettingActions>
      </SettingCard>

      {/* Danger Zone */}
      <SettingCard title="危险操作" icon={<Trash2 className="h-4 w-4" />} danger>
        <p className="text-sm text-foreground-muted">
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
      </SettingCard>
    </div>
  );
}
