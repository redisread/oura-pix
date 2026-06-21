/**
 * TeamDetailPage Component
 *
 * Team detail with member management
 */

"use client";

import { useState } from "react";
import { useTeam, type TeamMember, type TeamRole } from "@/hooks/useTeams";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "所有者",
  admin: "管理员",
  member: "成员",
};

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  member: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function TeamDetailPage({ teamId }: { teamId: string }) {
  const { team, loading, error, updateName, updateMemberRole, removeMember, leaveTeam, deleteTeam } =
    useTeam(teamId);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<"leave" | "delete" | null>(null);

  if (loading && !team) {
    return <div className="text-center py-12 text-slate-500">加载中...</div>;
  }

  if (error && !team) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  const isOwner = team.role === "owner";
  const isAdmin = team.role === "admin" || isOwner;
  const canManageMember = (m: TeamMember) => {
    if (m.role === "owner") return false;
    if (isOwner) return true;
    if (isAdmin && m.role === "member") return true;
    return false;
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput === team.name) {
      setEditingName(false);
      return;
    }
    const ok = await updateName(nameInput.trim());
    if (ok) setEditingName(false);
  };

  const handleDelete = async () => {
    const ok = await deleteTeam();
    if (ok) window.location.href = "/teams";
  };

  const handleLeave = async () => {
    const ok = await leaveTeam();
    if (ok) window.location.href = "/teams";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <a href="/teams" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          ← 返回团队列表
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-lg font-semibold border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{team.name}</h1>
                {isOwner && (
                  <button
                    onClick={() => {
                      setNameInput(team.name);
                      setEditingName(true);
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    编辑
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-slate-500 mt-1">
              {team.memberCount} 成员 · 创建于 {formatDate(team.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm rounded ${ROLE_COLORS[team.role]}`}>
            你是 {ROLE_LABELS[team.role]}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded">
          <span className="text-slate-500">邀请码:</span>
          <code className="font-mono text-slate-900 dark:text-slate-100">{team.inviteCode}</code>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(team.inviteCode);
              } catch {
                /* ignore */
              }
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            复制
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {!isOwner && (
            <button
              onClick={() => setConfirmAction("leave")}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              退出团队
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setConfirmAction("delete")}
              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              解散团队
            </button>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">成员</h2>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">用户</th>
              <th className="px-4 py-3 text-left">角色</th>
              <th className="px-4 py-3 text-left">加入时间</th>
              <th className="px-4 py-3 text-right w-32">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {team.members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <div className="text-slate-900 dark:text-slate-100">
                    {m.user?.name ?? "(未命名)"}
                  </div>
                  <div className="text-xs text-slate-500">{m.user?.email}</div>
                </td>
                <td className="px-4 py-3">
                  {isOwner && m.role !== "owner" ? (
                    <select
                      value={m.role}
                      onChange={async (e) => {
                        await updateMemberRole(m.userId, e.target.value as "admin" | "member");
                      }}
                      className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[m.role]}`}
                    >
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(m.joinedAt)}</td>
                <td className="px-4 py-3 text-right">
                  {canManageMember(m) && (
                    <button
                      onClick={async () => {
                        if (confirm(`确定移除 ${m.user?.name ?? m.user?.email}?`)) {
                          await removeMember(m.userId);
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-red-500"
                    >
                      移除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <a
          href={`/teams/${teamId}/generations`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          查看团队生成历史 →
        </a>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {confirmAction === "delete" ? "解散团队" : "退出团队"}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {confirmAction === "delete"
                ? "解散后所有成员将失去访问权限，且无法恢复。确定继续？"
                : "退出后将无法访问该团队的生成历史。确定继续？"}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                取消
              </button>
              <button
                onClick={confirmAction === "delete" ? handleDelete : handleLeave}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
