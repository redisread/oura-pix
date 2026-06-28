/**
 * TeamDetailPage Component
 *
 * Team detail with member management
 */

"use client";

import { useState } from "react";
import { localizeHref } from "@/paraglide/runtime.js";
import * as m from "@/paraglide/messages.js";
import { useTeam, type TeamMember, type TeamRole } from "@/hooks/useTeams";
import { formatLocaleDate } from "@/lib/locale";

function formatDate(dateString: string): string {
  return formatLocaleDate(dateString, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getRoleLabel(role: TeamRole): string {
  switch (role) {
    case "owner":
      return m.teams_role_owner();
    case "admin":
      return m.teams_role_admin();
    case "member":
      return m.teams_role_member();
  }
}

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
    return <div className="text-center py-12 text-slate-500">{m.common_loading()}</div>;
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
    if (ok) window.location.href = localizeHref("/teams");
  };

  const handleLeave = async () => {
    const ok = await leaveTeam();
    if (ok) window.location.href = localizeHref("/teams");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <a href={localizeHref("/teams")} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          {m.teams_backToList()}
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
                  {m.common_save()}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded"
                >
                  {m.common_cancel()}
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
                    {m.common_edit()}
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-slate-500 mt-1">
              {m.teams_memberCountCreated({
                count: team.memberCount.toString(),
                date: formatDate(team.createdAt),
              })}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm rounded ${ROLE_COLORS[team.role]}`}>
            {m.teams_youAreRole({ role: getRoleLabel(team.role) })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded">
          <span className="text-slate-500">{m.teams_inviteCode()}</span>
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
            {m.common_copy()}
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {!isOwner && (
            <button
              onClick={() => setConfirmAction("leave")}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {m.teams_leaveTeam()}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setConfirmAction("delete")}
              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {m.teams_deleteTeam()}
            </button>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{m.teams_membersTitle()}</h2>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">{m.teams_columnUser()}</th>
              <th className="px-4 py-3 text-left">{m.teams_columnRole()}</th>
              <th className="px-4 py-3 text-left">{m.teams_columnJoinedAt()}</th>
              <th className="px-4 py-3 text-right w-32">{m.teams_columnActions()}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {team.members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <div className="text-slate-900 dark:text-slate-100">
                    {member.user?.name ?? m.teams_unnamedUser()}
                  </div>
                  <div className="text-xs text-slate-500">{member.user?.email}</div>
                </td>
                <td className="px-4 py-3">
                  {isOwner && member.role !== "owner" ? (
                    <select
                      value={member.role}
                      onChange={async (e) => {
                        await updateMemberRole(member.userId, e.target.value as "admin" | "member");
                      }}
                      className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[member.role]}`}
                    >
                      <option value="admin">{m.teams_role_admin()}</option>
                      <option value="member">{m.teams_role_member()}</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[member.role]}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(member.joinedAt)}</td>
                <td className="px-4 py-3 text-right">
                  {canManageMember(member) && (
                    <button
                      onClick={async () => {
                        if (confirm(m.teams_removeMemberConfirm({ name: member.user?.name ?? member.user?.email ?? "" }))) {
                          await removeMember(member.userId);
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-red-500"
                    >
                      {m.teams_removeMember()}
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
          {m.teams_viewGenerations()}
        </a>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {confirmAction === "delete" ? m.teams_deleteConfirmTitle() : m.teams_leaveConfirmTitle()}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {confirmAction === "delete"
                ? m.teams_deleteConfirmDescription()
                : m.teams_leaveConfirmDescription()}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                {m.common_cancel()}
              </button>
              <button
                onClick={confirmAction === "delete" ? handleDelete : handleLeave}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                {m.common_confirm()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
