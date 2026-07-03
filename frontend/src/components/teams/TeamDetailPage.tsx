/**
 * TeamDetailPage Component
 *
 * Team detail with member management
 */

"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/Modal";
import { ArrowLeft, Check, Copy, LogOut, Save, Trash2, Users } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import * as m from "@/paraglide/messages.js";
import { useTeam, type TeamMember, type TeamRole } from "@/hooks/useTeams";
import { formatShortDate } from "@/lib/locale";
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";
import { ErrorBanner } from "@/components/ui";

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

const ROLE_BADGES: Record<TeamRole, string> = {
  owner: "status-badge-info",
  admin: "status-badge-warning",
  member: "status-badge-neutral",
};

export default function TeamDetailPage({ teamId }: { teamId: string }) {
  const { team, loading, error, updateName, updateMemberRole, removeMember, leaveTeam, deleteTeam } =
    useTeam(teamId);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<"leave" | "delete" | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (loading && !team) {
    return (
      <WorkbenchPageLayout>
        <div className="py-12 text-center text-foreground-muted">{m.common_loading()}</div>
      </WorkbenchPageLayout>
    );
  }

  if (error && !team) {
    return (
      <WorkbenchPageLayout maxWidth="max-w-3xl">
        <ErrorBanner message={error} />
      </WorkbenchPageLayout>
    );
  }

  if (!team) return null;

  const isOwner = team.role === "owner";
  const isAdmin = team.role === "admin" || isOwner;
  const canManageMember = (member: TeamMember) => {
    if (member.role === "owner") return false;
    if (isOwner) return true;
    if (isAdmin && member.role === "member") return true;
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

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <WorkbenchPageLayout maxWidth="max-w-5xl">
      <div className="mb-6">
          <a href={localizeHref("/teams")} className="btn-ghost h-9 gap-2 px-3">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {m.teams_backToListShort()}
          </a>
        </div>

      <section className="panel mb-4 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="input flex-1 text-lg font-semibold"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="btn-primary h-10 gap-2 px-3">
                    <Save className="h-4 w-4" aria-hidden="true" />{m.common_save()}</button>
                  <button onClick={() => setEditingName(false)} className="btn-secondary h-10 px-3">{m.common_cancel()}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-[hsl(var(--primary))]" aria-hidden="true" />
                  <h1 className="font-display text-3xl font-semibold text-foreground">{team.name}</h1>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setNameInput(team.name);
                        setEditingName(true);
                      }}
                      className="btn-ghost h-8 px-2 text-xs"
                    >{m.common_edit()}</button>
                  )}
                </div>
              )}
              <p className="mt-2 text-sm text-foreground-muted">
                {m.teams_memberCountCreated({ count: team.memberCount.toString(), date: formatShortDate(team.createdAt) })}
              </p>
            </div>
            <span className={`status-badge ${ROLE_BADGES[team.role]}`}>
              {m.teams_youAreRole({ role: getRoleLabel(team.role) })}
            </span>
          </div>

          <div className="panel-muted flex items-center gap-2 p-3 text-sm">
            <span className="text-foreground-muted">{m.teams_inviteCode()}</span>
            <code className="font-utility text-foreground">{team.inviteCode}</code>
            <button onClick={copyInvite} className="icon-button h-8 w-8" aria-label={m.teams_copyInviteAria()}>
              {copied ? <Check className="h-4 w-4 text-[hsl(var(--color-success))]" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {!isOwner && (
              <button onClick={() => setConfirmAction("leave")} className="btn-secondary h-9 gap-2 px-3">
                <LogOut className="h-4 w-4" aria-hidden="true" />{m.teams_leaveTeam()}</button>
            )}
            {isOwner && (
              <button
                onClick={() => setConfirmAction("delete")}
                className="btn-secondary h-9 gap-2 px-3 text-[hsl(var(--color-error))]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />{m.teams_deleteTeam()}</button>
            )}
          </div>
        </section>

        <h2 className="mb-3 text-lg font-semibold text-foreground">{m.teams_membersTitle()}</h2>
        <div className="table-shell">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--secondary)/0.72)] text-xs uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-3 text-left">{m.teams_columnUser()}</th>
                <th className="px-4 py-3 text-left">{m.teams_columnRole()}</th>
                <th className="px-4 py-3 text-left">{m.teams_columnJoinedAt()}</th>
                <th className="w-32 px-4 py-3 text-right">{m.teams_columnActions()}</th>
              </tr>
            </thead>
            <tbody>
              {team.members.map((member) => (
                <tr key={member.id} className="data-row">
                  <td className="px-4 py-3">
                    <div className="text-foreground">{member.user?.name ?? m.teams_unnamedUser()}</div>
                    <div className="text-xs text-foreground-muted">{member.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {isOwner && member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={async (e) => {
                          await updateMemberRole(member.userId, e.target.value as "admin" | "member");
                        }}
                        className="input w-auto py-1 text-xs"
                      >
                        <option value="admin">{m.teams_role_admin()}</option>
                        <option value="member">{m.teams_role_member()}</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${ROLE_BADGES[member.role]}`}>
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                  </td>
                  <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatShortDate(member.joinedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {canManageMember(member) && (
                      <button
                        onClick={() => setConfirmRemoveMember(member.userId)}
                        className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
                        aria-label={m.teams_removeMember()}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <a href={localizeHref(`/teams/${teamId}/generations`)} className="text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]">
            {m.teams_viewGenerations()}
          </a>
        </div>

        {confirmAction && (
          <ConfirmModal
            open={true}
            onClose={() => setConfirmAction(null)}
            onConfirm={confirmAction === "delete" ? handleDelete : handleLeave}
            title={confirmAction === "delete" ? m.teams_deleteTeam() : m.teams_leaveTeam()}
            description={confirmAction === "delete" ? m.teams_deleteConfirmDescription() : m.teams_leaveConfirmDescription()}
            confirmLabel={m.common_confirm()}
          />
        )}

        {confirmRemoveMember && (
          <ConfirmModal
            open={true}
            onClose={() => setConfirmRemoveMember(null)}
            onConfirm={async () => {
              await removeMember(confirmRemoveMember);
              setConfirmRemoveMember(null);
            }}
            title={m.teams_removeMemberTitle()}
            description={m.teams_removeMemberConfirm({
              name: team?.members.find((mb: TeamMember) => mb.userId === confirmRemoveMember)?.user?.name
                ?? team?.members.find((mb: TeamMember) => mb.userId === confirmRemoveMember)?.user?.email
                ?? "",
            })}
            confirmLabel={m.common_confirm()}
          />
        )}
    </WorkbenchPageLayout>
  );
}
