/**
 * TeamsPage Component
 *
 * List user's teams and create / join new ones
 */

"use client";

import { useState } from "react";
import { Check, Copy, Plus, UserPlus, Users, X } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import { useTeams, type Team } from "@/hooks/useTeams";
import { StateMessage } from "@/components/StateMessage";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const ROLE_LABELS: Record<Team["role"], string> = {
  owner: "所有者",
  admin: "管理员",
  member: "成员",
};

const ROLE_BADGES: Record<Team["role"], string> = {
  owner: "status-badge-info",
  admin: "status-badge-warning",
  member: "status-badge-neutral",
};

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="panel-muted inline-flex items-center gap-1 px-2 py-0.5 text-xs"
      aria-label="复制邀请码"
    >
      <code>{code}</code>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[hsl(var(--color-success))]" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-foreground-muted" aria-hidden="true" />
      )}
    </button>
  );
}

export default function TeamsPage() {
  const { teams, loading, error, createTeam, joinTeam } = useTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const team = await createTeam(name.trim());
    if (team) {
      setShowCreate(false);
      setName("");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    const ok = await joinTeam(inviteCode.trim());
    if (ok) {
      setShowJoin(false);
      setInviteCode("");
    }
  };

  return (
    <div className="workbench-page">
      <div className="workbench-container max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Team / Collaboration</p>
            <h1 className="page-title mt-2">团队</h1>
            <p className="page-description mt-3">协作共享生成历史</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowJoin(true)} className="btn-secondary h-10 gap-2 px-4">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              加入团队
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary h-10 gap-2 px-4">
              <Plus className="h-4 w-4" aria-hidden="true" />
              创建团队
            </button>
          </div>
        </header>

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        {loading && teams.length === 0 ? (
          <StateMessage variant="loading" message="加载团队..." />
        ) : teams.length === 0 ? (
          <StateMessage
            variant="empty"
            title="还没有加入任何团队"
            description="创建或加入团队开始协作"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div key={team.id} className="card card-hover p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <a
                    href={localizeHref(`/teams/${team.id}`)}
                    className="flex min-w-0 items-center gap-2 rounded-sm focus-ring"
                  >
                    <Users className="h-5 w-5 shrink-0 text-[hsl(var(--primary))]" aria-hidden="true" />
                    <h2 className="truncate font-semibold text-foreground">{team.name}</h2>
                  </a>
                  <span className={`status-badge ${ROLE_BADGES[team.role]}`}>
                    {ROLE_LABELS[team.role]}
                  </span>
                </div>
                <p className="mb-3 text-xs text-foreground-muted">
                  {team.memberCount} 成员 · 创建于 {formatDate(team.createdAt)}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-foreground-muted">邀请码:</span>
                  <CopyableCode code={team.inviteCode} />
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <TeamModal title="创建团队" onClose={() => setShowCreate(false)} onSubmit={handleCreate}>
            <label className="panel-label mb-1 block">团队名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：电商产品组"
              className="input"
              maxLength={100}
              required
              autoFocus
            />
            <button type="submit" disabled={!name.trim()} className="btn-primary h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50">
              创建
            </button>
          </TeamModal>
        )}

        {showJoin && (
          <TeamModal title="加入团队" onClose={() => setShowJoin(false)} onSubmit={handleJoin}>
            <label className="panel-label mb-1 block">邀请码</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="TEAM-XXXXXXXX"
              className="input font-utility"
              required
              autoFocus
            />
            <button type="submit" disabled={!inviteCode.trim()} className="btn-primary h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50">
              加入
            </button>
          </TeamModal>
        )}
      </div>
    </div>
  );
}

function TeamModal({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.42)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        className="panel w-full max-w-md space-y-4 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="icon-button h-9 w-9" aria-label="关闭">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
