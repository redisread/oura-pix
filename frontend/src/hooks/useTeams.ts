/**
 * useTeams Hook
 */

import { useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useCrud } from "@/hooks/useCrud";
import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export type TeamRole = "owner" | "admin" | "member";

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  role: TeamRole;
  memberCount: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export function useTeams() {
  const { items, loading, error, setError, refetch, createItem, deleteItem } = useCrud<
    Team,
    { name: string }
  >({ endpoint: "/api/teams" });

  const joinTeam = useCallback(
    async (inviteCode: string): Promise<boolean> => {
      try {
        await apiJson("/api/teams/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode }),
        });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_requestFailed()));
        return false;
      }
    },
    [refetch, setError]
  );

  const leaveTeam = useCallback(
    async (teamId: string): Promise<boolean> => {
      try {
        await apiJson(`/api/teams/${teamId}/leave`, { method: "POST" });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_requestFailed()));
        return false;
      }
    },
    [refetch, setError]
  );

  return {
    teams: items,
    loading,
    error,
    refetch,
    createTeam: createItem,
    joinTeam,
    leaveTeam,
    deleteTeam: deleteItem,
  };
}

export function useTeam(teamId: string | null) {
  const { data: team, loading, error, setError, refetch: fetchTeam } = useResource<TeamDetail>(
    teamId ? `/api/teams/${teamId}` : null,
    m.common_loadFailed()
  );

  const updateName = useCallback(
    async (name: string): Promise<boolean> => {
      if (!teamId) return false;
      try {
        await apiJson(`/api/teams/${teamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        await fetchTeam();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_updateFailed()));
        return false;
      }
    },
    [teamId, fetchTeam, setError]
  );

  const updateMemberRole = useCallback(
    async (userId: string, role: "admin" | "member"): Promise<boolean> => {
      if (!teamId) return false;
      try {
        await apiJson(`/api/teams/${teamId}/members/${userId}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        await fetchTeam();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_updateFailed()));
        return false;
      }
    },
    [teamId, fetchTeam, setError]
  );

  const removeMember = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!teamId) return false;
      try {
        await apiJson(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
        await fetchTeam();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_deleteFailed()));
        return false;
      }
    },
    [teamId, fetchTeam, setError]
  );

  const leaveTeam = useCallback(
    async (): Promise<boolean> => {
      if (!teamId) return false;
      try {
        await apiJson(`/api/teams/${teamId}/leave`, { method: "POST" });
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_requestFailed()));
        return false;
      }
    },
    [teamId, setError]
  );

  const deleteTeam = useCallback(
    async (): Promise<boolean> => {
      if (!teamId) return false;
      try {
        await apiJson(`/api/teams/${teamId}`, { method: "DELETE" });
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_deleteFailed()));
        return false;
      }
    },
    [teamId, setError]
  );

  return { team, loading, error, refetch: fetchTeam, updateName, updateMemberRole, removeMember, leaveTeam, deleteTeam };
}
