/**
 * TeamSettings Component (P2 #94 T6)
 *
 * Team management: my teams cards, invite link, member roles, remove.
 */

"use client";

import { useState } from "react";
import { Copy, LogOut, Plus, Trash2, Users, X } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { useTeams, type TeamRole } from "@/hooks/useTeams";
import { StateMessage } from "@/components/StateMessage";
import { useToast } from "../ui/Toast";
import {
  SettingSection,
  SettingModal,
  ConfirmModal,
} from "./ui";

interface TeamSettingsProps {
  onTeamSelect?: (teamId: string) => void;
}

export default function TeamSettings({ onTeamSelect: _onTeamSelect }: TeamSettingsProps) {
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
      const result = await createTeam({ name: name.trim() });
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
        toast.success(m.teams_settings_toast_joinSuccess());
      } else {
        toast.error(m.teams_settings_toast_inviteInvalid());
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
        toast.success(m.teams_settings_toast_leftTeam());
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
        toast.success(m.teams_settings_toast_teamDeleted());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvite = async (code: string) => {
    const link = `${window.location.origin}/teams/join?code=${code}`;
    await navigator.clipboard.writeText(link);
    toast.success(m.teams_settings_toast_inviteCopied());
  };

  const canDelete = (role: TeamRole) => role === "owner";

  return (
    <div className="space-y-6">
      <SettingSection
        title={m.teams_settings_title()}
        description={m.teams_settings_description()}
        icon={<Users className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowJoin(true)}
              className="btn-secondary px-4 py-2"
            >
              {m.teams_joinTeam()}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-primary px-4 py-2 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {m.teams_createTitle()}
            </button>
          </>
        }
      />

      {loading ? (
        <StateMessage variant="loading" />
      ) : error ? (
        <StateMessage variant="error" message={error} />
      ) : teams.length === 0 ? (
        <StateMessage
          variant="empty"
          title={m.teams_settings_emptyTitle()}
          description={m.teams_settings_emptyDesc()}
        />
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
                    {m.teams_settings_yourRole()}{" "}
                    <span className="font-medium text-foreground">{roleLabel(team.role)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => setShowLeave(team.id)}
                  className="text-[hsl(var(--foreground-muted))] hover:text-amber-600 inline-flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  {m.teams_settings_leave()}
                </button>
                {canDelete(team.role) && (
                  <button
                    type="button"
                    onClick={() => setShowDelete(team.id)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {m.teams_settings_delete()}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCopyInvite(team.inviteCode)}
                className="w-full btn-secondary px-3 py-1.5 text-xs inline-flex items-center justify-center gap-1"
              >
                <Copy className="h-3 w-3" />
                {m.teams_settings_copyInvite()}
              </button>
            </div>
          ))}
        </div>
      )}

      <SettingModal open={showCreate} onClose={() => !submitting && setShowCreate(false)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{m.teams_createTitle()}</h3>
          <button type="button" onClick={() => setShowCreate(false)} className="text-foreground-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={m.teams_settings_teamName()}
          className="input"
          maxLength={50}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setShowCreate(false)} disabled={submitting} className="btn-secondary px-4 py-2">
            {m.teams_settings_cancel()}
          </button>
          <button type="button" onClick={handleCreate} disabled={submitting} className="btn-primary px-4 py-2">
            {m.teams_settings_create()}
          </button>
        </div>
      </SettingModal>

      <SettingModal open={showJoin} onClose={() => !submitting && setShowJoin(false)}>
        <h3 className="text-lg font-semibold text-foreground mb-4">{m.teams_joinTitle()}</h3>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder={m.teams_settings_inviteCode()}
          className="input"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setShowJoin(false)} disabled={submitting} className="btn-secondary px-4 py-2">
            {m.teams_settings_cancel()}
          </button>
          <button type="button" onClick={handleJoin} disabled={submitting} className="btn-primary px-4 py-2">
            {m.teams_settings_joinBtn()}
          </button>
        </div>
      </SettingModal>

      {showInvite && (
        <div className="card p-4 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
            {m.teams_settings_inviteCreated({ name: showInvite.name })}
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
              {m.teams_settings_copy()}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(showLeave)}
        onClose={() => !submitting && setShowLeave(null)}
        onConfirm={handleLeave}
        title={m.teams_leaveConfirmTitle()}
        description={m.teams_leaveConfirmDescription()}
        confirmLabel={m.teams_settings_leave()}
        cancelLabel={m.teams_settings_cancel()}
        variant="warning"
        loading={submitting}
      />

      <ConfirmModal
        open={Boolean(showDelete)}
        onClose={() => !submitting && setShowDelete(null)}
        onConfirm={handleDelete}
        title={m.teams_deleteConfirmTitle()}
        description={m.teams_deleteConfirmDescription()}
        confirmLabel={m.teams_settings_delete()}
        cancelLabel={m.teams_settings_cancel()}
        loading={submitting}
      />
    </div>
  );
}

function roleLabel(role: TeamRole): string {
  switch (role) {
    case "owner":
      return m.teams_role_owner();
    case "admin":
      return m.teams_role_admin();
    case "member":
      return m.teams_role_member();
  }
}
