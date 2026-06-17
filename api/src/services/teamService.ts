/**
 * Team Service
 *
 * Handles team CRUD, membership management, and role-based access control
 */

import { createDb, schema } from "@oura-pix/database";
import { eq, and, desc, sql, inArray, ne } from "drizzle-orm";
import type { TeamRoleType } from "@oura-pix/database";

export interface TeamRecord {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: Date;
}

export interface TeamMemberRecord {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRoleType;
  joinedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface TeamWithRole extends TeamRecord {
  role: TeamRoleType;
  memberCount: number;
}

const ROLE_PRIORITY: Record<TeamRoleType, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function isRoleAtLeast(actual: TeamRoleType, required: TeamRoleType): boolean {
  return ROLE_PRIORITY[actual] >= ROLE_PRIORITY[required];
}

function generateInviteCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  return `TEAM-${hex}`;
}

export async function createTeam(
  db: ReturnType<typeof createDb>,
  ownerId: string,
  name: string
): Promise<TeamRecord> {
  let team: TeamRecord | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();
    try {
      const [created] = await db
        .insert(schema.teams)
        .values({
          id: crypto.randomUUID(),
          name,
          ownerId,
          inviteCode,
          createdAt: new Date(),
        })
        .returning();
      team = created;
      break;
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }

  if (!team) throw new Error("Failed to create team");

  await db.insert(schema.teamMembers).values({
    id: crypto.randomUUID(),
    teamId: team.id,
    userId: ownerId,
    role: "owner",
    joinedAt: new Date(),
  });

  return team;
}

export async function listUserTeams(
  db: ReturnType<typeof createDb>,
  userId: string
): Promise<TeamWithRole[]> {
  const rows = await db
    .select({
      id: schema.teams.id,
      name: schema.teams.name,
      ownerId: schema.teams.ownerId,
      inviteCode: schema.teams.inviteCode,
      createdAt: schema.teams.createdAt,
      role: schema.teamMembers.role,
    })
    .from(schema.teamMembers)
    .innerJoin(schema.teams, eq(schema.teams.id, schema.teamMembers.teamId))
    .where(eq(schema.teamMembers.userId, userId))
    .orderBy(desc(schema.teams.createdAt));

  const teamIds = rows.map((r) => r.id);
  const counts = teamIds.length
    ? await db
        .select({
          teamId: schema.teamMembers.teamId,
          count: sql<number>`count(*)`,
        })
        .from(schema.teamMembers)
        .where(inArray(schema.teamMembers.teamId, teamIds))
        .groupBy(schema.teamMembers.teamId)
    : [];

  const countMap = new Map(counts.map((c) => [c.teamId, c.count]));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    ownerId: r.ownerId,
    inviteCode: r.inviteCode,
    createdAt: r.createdAt,
    role: r.role,
    memberCount: countMap.get(r.id) ?? 0,
  }));
}

export async function getTeamForUser(
  db: ReturnType<typeof createDb>,
  teamId: string,
  userId: string
): Promise<TeamWithRole | null> {
  const rows = await db
    .select({
      id: schema.teams.id,
      name: schema.teams.name,
      ownerId: schema.teams.ownerId,
      inviteCode: schema.teams.inviteCode,
      createdAt: schema.teams.createdAt,
      role: schema.teamMembers.role,
    })
    .from(schema.teamMembers)
    .innerJoin(schema.teams, eq(schema.teams.id, schema.teamMembers.teamId))
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)))
    .limit(1);

  if (rows.length === 0) return null;

  const [count] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.teamId, teamId));

  return {
    ...rows[0],
    memberCount: count?.count ?? 0,
  };
}

export async function updateTeam(
  db: ReturnType<typeof createDb>,
  teamId: string,
  name: string
): Promise<TeamRecord | null> {
  const [updated] = await db
    .update(schema.teams)
    .set({ name })
    .where(eq(schema.teams.id, teamId))
    .returning();
  return updated ?? null;
}

export async function deleteTeam(
  db: ReturnType<typeof createDb>,
  teamId: string
): Promise<boolean> {
  const result = await db
    .delete(schema.teams)
    .where(eq(schema.teams.id, teamId))
    .returning();
  return result.length > 0;
}

export async function joinTeamByInviteCode(
  db: ReturnType<typeof createDb>,
  userId: string,
  inviteCode: string
): Promise<TeamMemberRecord | null> {
  const teams = await db
    .select()
    .from(schema.teams)
    .where(eq(schema.teams.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (teams.length === 0) return null;
  const team = teams[0];

  const existing = await db
    .select()
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, team.id), eq(schema.teamMembers.userId, userId)))
    .limit(1);

  if (existing.length > 0) return null;

  const [created] = await db
    .insert(schema.teamMembers)
    .values({
      id: crypto.randomUUID(),
      teamId: team.id,
      userId,
      role: "member",
      joinedAt: new Date(),
    })
    .returning();
  return created;
}

export async function listTeamMembers(
  db: ReturnType<typeof createDb>,
  teamId: string
): Promise<TeamMemberRecord[]> {
  const rows = await db
    .select({
      id: schema.teamMembers.id,
      teamId: schema.teamMembers.teamId,
      userId: schema.teamMembers.userId,
      role: schema.teamMembers.role,
      joinedAt: schema.teamMembers.joinedAt,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
    .from(schema.teamMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.teamMembers.userId))
    .where(eq(schema.teamMembers.teamId, teamId))
    .orderBy(desc(schema.teamMembers.joinedAt));

  return rows.map((r) => ({
    id: r.id,
    teamId: r.teamId,
    userId: r.userId,
    role: r.role,
    joinedAt: r.joinedAt,
    user: {
      id: r.userId,
      name: r.userName,
      email: r.userEmail,
    },
  }));
}

export async function updateMemberRole(
  db: ReturnType<typeof createDb>,
  teamId: string,
  targetUserId: string,
  role: TeamRoleType
): Promise<TeamMemberRecord | null> {
  if (role !== "owner") {
    const target = await db
      .select()
      .from(schema.teamMembers)
      .where(
        and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, targetUserId))
      )
      .limit(1);
    if (target.length > 0 && target[0].role === "owner") {
      return null;
    }
  }

  const [updated] = await db
    .update(schema.teamMembers)
    .set({ role })
    .where(
      and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, targetUserId))
    )
    .returning();
  return updated ?? null;
}

export async function removeMember(
  db: ReturnType<typeof createDb>,
  teamId: string,
  targetUserId: string
): Promise<boolean> {
  const target = await db
    .select()
    .from(schema.teamMembers)
    .where(
      and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, targetUserId))
    )
    .limit(1);
  if (target.length === 0) return false;
  if (target[0].role === "owner") return false;

  const result = await db
    .delete(schema.teamMembers)
    .where(
      and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, targetUserId),
        ne(schema.teamMembers.role, "owner")
      )
    )
    .returning();
  return result.length > 0;
}

export async function leaveTeam(
  db: ReturnType<typeof createDb>,
  teamId: string,
  userId: string
): Promise<boolean> {
  const member = await db
    .select()
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)))
    .limit(1);
  if (member.length === 0) return false;
  if (member[0].role === "owner") return false;

  await db
    .delete(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)));
  return true;
}

export async function getTeamMemberIds(
  db: ReturnType<typeof createDb>,
  teamId: string
): Promise<string[]> {
  const rows = await db
    .select({ userId: schema.teamMembers.userId })
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.teamId, teamId));
  return rows.map((r) => r.userId);
}
