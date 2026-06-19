/**
 * useTeams Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<Team[]>("/api/teams");
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = useCallback(
    async (name: string): Promise<Team | null> => {
      try {
        const team = await apiJson<Team>("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        await fetchTeams();
        return team;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create team");
        return null;
      }
    },
    [fetchTeams]
  );

  const joinTeam = useCallback(
    async (inviteCode: string): Promise<boolean> => {
      try {
        await apiJson(`/api/teams/any/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode }),
        });
        await fetchTeams();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join team");
        return false;
      }
    },
    [fetchTeams]
  );

  return { teams, loading, error, refetch: fetchTeams, createTeam, joinTeam };
}

export function useTeam(teamId: string | null) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<TeamDetail>(`/api/teams/${teamId}`);
      setTeam(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

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
        setError(err instanceof Error ? err.message : "Failed to update");
        return false;
      }
    },
    [teamId, fetchTeam]
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
        setError(err instanceof Error ? err.message : "Failed to update role");
        return false;
      }
    },
    [teamId, fetchTeam]
  );

  const removeMember = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!teamId) return false;
      try {
        await apiJson(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
        await fetchTeam();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove");
        return false;
      }
    },
    [teamId, fetchTeam]
  );

  const leaveTeam = useCallback(async (): Promise<boolean> => {
    if (!teamId) return false;
    try {
      await apiJson(`/api/teams/${teamId}/leave`, { method: "POST" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave");
      return false;
    }
  }, [teamId]);

  const deleteTeam = useCallback(async (): Promise<boolean> => {
    if (!teamId) return false;
    try {
      await apiJson(`/api/teams/${teamId}`, { method: "DELETE" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      return false;
    }
  }, [teamId]);

  return { team, loading, error, refetch: fetchTeam, updateName, updateMemberRole, removeMember, leaveTeam, deleteTeam };
}
