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
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatShortDate } from "@/lib/locale";
import { Modal } from "@/components/ui/Modal";
import * as m from "@/paraglide/messages.js";

function getRoleLabel(role: Team["role"]): string {
  switch (role) {
    case "owner":
      return m.teams_role_owner();
    case "admin":
      return m.teams_role_admin();
    case "member":
      return m.teams_role_member();
  }
}

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
      aria-label={m.teams_copyInviteAria()}
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
    const team = await createTeam({ name: name.trim() });
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
    <WorkbenchPageLayout maxWidth="max-w-6xl">
      <PageHeader
        kicker={m.teams_kicker()}
        title={m.teams_title()}
        description={m.teams_subtitle()}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowJoin(true)} className="btn-secondary h-10 gap-2 px-4">
              <UserPlus className="h-4 w-4" aria-hidden="true" />{m.teams_joinTeam()}</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary h-10 gap-2 px-4">
              <Plus className="h-4 w-4" aria-hidden="true" />{m.teams_createTitle()}</button>
          </div>
        }
      />

      {error && <StateMessage variant="error" message={error} className="mb-4" />}

      {loading && teams.length === 0 ? (
        <StateMessage variant="loading" message={m.teams_loading()} />
      ) : teams.length === 0 ? (
        <StateMessage
          variant="empty"
          title={m.teams_emptyTitle()}
          description={m.teams_emptyDescription()}
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
                  {getRoleLabel(team.role)}
                </span>
              </div>
              <p className="mb-3 text-xs text-foreground-muted">
                {m.teams_memberCountCreated({ count: team.memberCount.toString(), date: formatShortDate(team.createdAt) })}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-foreground-muted">{m.teams_inviteCode()}</span>
                <CopyableCode code={team.inviteCode} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-foreground">{m.teams_createTitle()}</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="icon-button h-9 w-9" aria-label={m.common_close()}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="panel-label mb-1 block">{m.teams_teamName()}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.teams_teamNamePlaceholder()}
              className="input"
              maxLength={100}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary h-10 px-4">{m.common_cancel()}</button>
              <button type="submit" disabled={!name.trim()} className="btn-primary h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50">{m.teams_create()}</button>
            </div>
          </form>
        </Modal>
      )}

      {showJoin && (
        <Modal open={showJoin} onClose={() => setShowJoin(false)}>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-foreground">{m.teams_joinTeam()}</h2>
              <button type="button" onClick={() => setShowJoin(false)} className="icon-button h-9 w-9" aria-label={m.common_close()}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="panel-label mb-1 block">{m.teams_inviteCodeLabel()}</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="TEAM-XXXXXXXX"
              className="input font-utility"
              required
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary h-10 px-4">{m.common_cancel()}</button>
              <button type="submit" disabled={!inviteCode.trim()} className="btn-primary h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50">{m.teams_join()}</button>
            </div>
          </form>
        </Modal>
      )}
    </WorkbenchPageLayout>
  );
}
