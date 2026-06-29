/**
 * TeamSettings Component (P2 #94 T6)
 *
 * Team management: my teams cards, invite link, member roles, remove.
 */

"use client";

import { useState } from "react";
import { Copy, LogOut, Plus, Trash2, Users } from "lucide-react";
import { useTeams, type TeamRole } from "@/hooks/useTeams";
import { useToast } from "../ui/Toast";

interface TeamSettingsProps {
  onTeamSelect?: (teamId: string) => void;
}

export default function TeamSettings({ onTeamSelect }: TeamSettingsProps) {
  const { teams, loading, error, createTeam, joinTeam, leaveTeam, deleteTeam } = useTeams();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showLeave, setShowLeave] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState<{ code: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (name.trim().length === 0) return;
    setSubmitting(true);
    try {
      const result = await createTeam(name.trim());
      if (result) {
        setShowCreate(false);
        setName("");
        setShowInvite({ code: result.inviteCode, name: result.name });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length === 0) return;
    setSubmitting(true);
    try {
      const ok = await joinTeam(inviteCode.trim());
      if (ok) {
        setShowJoin(false);
        setInviteCode("");
        toast.success("加入团队成功");
      } else {
        toast.error("邀请码无效");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!showLeave) return;
    setSubmitting(true);
    try {
      const ok = await leaveTeam(showLeave);
      if (ok) {
        setShowLeave(null);
        toast.success("已退出团队");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      const ok = await deleteTeam(showDelete);
      if (ok) {
        setShowDelete(null);
        toast.success("团队已删除");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvite = async (code: string) => {
    const link = `${window.location.origin}/teams/join?code=${code}`;
    await navigator.clipboard.writeText(link);
    toast.success("邀请链接已复制");
  };

  const canDelete = (role: TeamRole) => role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" /> 团队管理
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">创建或加入团队，协作处理生成任务</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowJoin(true)}
            className="btn-secondary px-4 py-2"
          >
            加入团队
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary px-4 py-2 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            创建团队
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-foreground-muted text-sm">加载中...</div>
      ) : error ? (
        <div className="card p-8 text-center text-red-600 dark:text-red-400 text-sm">{error}</div>
      ) : teams.length === 0 ? (
        <div className="card p-8 text-center text-foreground-muted text-sm">
          还没有团队。创建或加入一个团队开始协作。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground line-clamp-1">{team.name}</h3>
                  <p className="text-xs text-foreground-muted mt-1">
                    你的角色：<span className="font-medium text-foreground">{roleLabel(team.role)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopyInvite(team.inviteCode)}
                  className="text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  复制邀请链接
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-[hsl(var(--border))]">
                <button
                  type="button"
                  onClick={() => onTeamSelect?.(team.id)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  查看详情
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeave(team.id)}
                  className="px-3 py-1.5 text-xs rounded-md bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  退出
                </button>
                {canDelete(team.role) && (
                  <button
                    type="button"
                    onClick={() => setShowDelete(team.id)}
                    className="px-3 py-1.5 text-xs rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowCreate(false)}
        >
          <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">创建团队</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="团队名称"
              className="input"
              maxLength={50}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowCreate(false)} disabled={submitting} className="btn-secondary px-4 py-2">
                取消
              </button>
              <button type="button" onClick={handleCreate} disabled={submitting} className="btn-primary px-4 py-2">
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowJoin(false)}
        >
          <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">加入团队</h3>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="邀请码"
              className="input"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowJoin(false)} disabled={submitting} className="btn-secondary px-4 py-2">
                取消
              </button>
              <button type="button" onClick={handleJoin} disabled={submitting} className="btn-primary px-4 py-2">
                加入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Banner after create */}
      {showInvite && (
        <div className="card p-4 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
            团队「{showInvite.name}」已创建
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded bg-[hsl(var(--background))] border border-emerald-200 dark:border-emerald-900 text-xs font-mono break-all">
              {window.location.origin}/teams/join?code={showInvite.code}
            </code>
            <button
              type="button"
              onClick={() => handleCopyInvite(showInvite.code)}
              className="btn-primary px-3 py-2 inline-flex items-center gap-1 text-xs"
            >
              <Copy className="h-3 w-3" />
              复制
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      {showLeave && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowLeave(null)}
        >
          <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">退出团队</h3>
            <p className="text-sm text-foreground-muted">确定要退出此团队吗？</p>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowLeave(null)} disabled={submitting} className="btn-secondary px-4 py-2">
                取消
              </button>
              <button type="button" onClick={handleLeave} disabled={submitting} className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium">
                退出
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowDelete(null)}
        >
          <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">删除团队</h3>
            <p className="text-sm text-foreground-muted">
              此操作不可恢复，团队所有数据将永久删除。
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowDelete(null)} disabled={submitting} className="btn-secondary px-4 py-2">
                取消
              </button>
              <button type="button" onClick={handleDelete} disabled={submitting} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium">
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roleLabel(role: TeamRole): string {
  switch (role) {
    case "owner":
      return "所有者";
    case "admin":
      return "管理员";
    case "member":
      return "成员";
  }
}