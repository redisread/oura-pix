/**
 * TeamsPage Component
 *
 * List user's teams and create / join new ones
 */

"use client";

import { useState } from "react";
import { useTeams, type Team } from "@/hooks/useTeams";
import { StateMessage } from "@/components/StateMessage";
import { formatLocaleDate } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

function formatDate(dateString: string): string {
  return formatLocaleDate(dateString, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

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

const ROLE_COLORS: Record<Team["role"], string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  member: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
    >
      <code>{code}</code>
      <span className="text-slate-500">{copied ? "✓" : "📋"}</span>
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.teams_title()}</h1>
          <p className="text-sm text-slate-500 mt-1">{m.teams_subtitle()}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {m.teams_joinTeam()}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
          >
            {m.teams_createTeam()}
          </button>
        </div>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <a
              key={team.id}
              href={`/teams/${team.id}`}
              className="block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {team.name}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[team.role]}`}>
                  {getRoleLabel(team.role)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {m.teams_memberCountCreated({
                  count: team.memberCount.toString(),
                  date: formatDate(team.createdAt),
                })}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">{m.teams_inviteCode()}</span>
                <CopyableCode code={team.inviteCode} />
              </div>
            </a>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {m.teams_createTitle()}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {m.teams_teamName()}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={m.teams_teamNamePlaceholder()}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                {m.common_cancel()}
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {m.teams_create()}
              </button>
            </div>
          </form>
        </div>
      )}

      {showJoin && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowJoin(false)}
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleJoin}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {m.teams_joinTitle()}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {m.teams_inviteCodeLabel()}
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="TEAM-XXXXXXXX"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-mono"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowJoin(false)}
                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                {m.common_cancel()}
              </button>
              <button
                type="submit"
                disabled={!inviteCode.trim()}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {m.teams_join()}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
