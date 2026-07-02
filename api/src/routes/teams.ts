/**
 * Teams Routes
 *
 * Team management: create, list, detail, members, generations
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { schema } from "@oura-pix/database";
import { desc, eq, sql } from "drizzle-orm";
import {
  createTeam,
  listUserTeams,
  getTeamForUser,
  updateTeam,
  deleteTeam,
  joinTeamByInviteCode,
  listTeamMembers,
  updateMemberRole,
  removeMember,
  leaveTeam,
  isRoleAtLeast,
} from "../services/teamService";
import { createRouter, useCtx } from "../lib/route";
import { badRequest, forbidden, notFound } from "../lib/http";

const teams = createRouter();

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

const joinSchema = z.object({
  inviteCode: z.string().min(4).max(50),
});

const roleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

/**
 * POST /api/teams — Create a new team
 */
teams.post("/", zValidator("json", createSchema), async (c) => {
  const { user, db } = useCtx(c);

  const { name } = c.req.valid("json");
  const team = await createTeam(db, user.id, name);
  return c.json({ success: true, data: team }, 201);
});

/**
 * GET /api/teams — List user's teams
 */
teams.get("/", async (c) => {
  const { user, db } = useCtx(c);

  const teams = await listUserTeams(db, user.id);
  return c.json({ success: true, data: teams });
});

/**
 * GET /api/teams/:id — Get team details with members
 */
teams.get("/:id", async (c) => {
  const { user, db } = useCtx(c);

  const teamId = c.req.param("id");
  const team = await getTeamForUser(db, teamId, user.id);
  if (!team) return notFound(c);

  const members = await listTeamMembers(db, teamId);
  return c.json({
    success: true,
    data: { ...team, members },
  });
});

/**
 * PUT /api/teams/:id — Update team name (owner only)
 */
teams.put("/:id", zValidator("json", updateSchema), async (c) => {
  const { user, db } = useCtx(c);

  const teamId = c.req.param("id");
  const { name } = c.req.valid("json");

  const team = await getTeamForUser(db, teamId, user.id);
  if (!team) return notFound(c);
  if (team.role !== "owner") return forbidden(c);

  const updated = await updateTeam(db, teamId, name);
  return c.json({ success: true, data: updated });
});

/**
 * DELETE /api/teams/:id — Delete team (owner only)
 */
teams.delete("/:id", async (c) => {
  const { user, db } = useCtx(c);

  const teamId = c.req.param("id");

  const team = await getTeamForUser(db, teamId, user.id);
  if (!team) return notFound(c);
  if (team.role !== "owner") return forbidden(c);

  await deleteTeam(db, teamId);
  return c.json({ success: true });
});

/**
 * POST /api/teams/join — Join a team via invite code
 */
teams.post("/join", zValidator("json", joinSchema), async (c) => {
  const { user, db } = useCtx(c);

  const { inviteCode } = c.req.valid("json");

  const result = await joinTeamByInviteCode(db, user.id, inviteCode);
  if (!result) return notFound(c);
  return c.json({ success: true, data: result });
});

/**
 * POST /api/teams/:id/leave — Leave a team
 */
teams.post("/:id/leave", async (c) => {
  const { user, db } = useCtx(c);

  const teamId = c.req.param("id");

  const success = await leaveTeam(db, teamId, user.id);
  if (!success) return badRequest(c);
  return c.json({ success: true });
});

/**
 * PUT /api/teams/:id/members/:userId/role — Update member role
 *  - owner can promote/demote anyone
 *  - admin can promote/demote members
 */
teams.put(
  "/:id/members/:userId/role",
  zValidator("json", roleSchema),
  async (c) => {
    const { user, db } = useCtx(c);

    const teamId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    const { role } = c.req.valid("json");

    const team = await getTeamForUser(db, teamId, user.id);
    if (!team) return notFound(c);

    // Authorization: owner can do anything; admin can only set role to 'member'
    if (team.role === "owner") {
      // OK
    } else if (team.role === "admin" && role === "member") {
      // OK
    } else {
      return forbidden(c);
    }

    const updated = await updateMemberRole(db, teamId, targetUserId, role);
    if (!updated) return badRequest(c);
    return c.json({ success: true, data: updated });
  }
);

/**
 * DELETE /api/teams/:id/members/:userId — Remove a member
 *  - owner can remove anyone (except self/owner)
 *  - admin can remove members only
 */
teams.delete("/:id/members/:userId", async (c) => {
  const { user, db } = useCtx(c);

  const teamId = c.req.param("id");
  const targetUserId = c.req.param("userId");

  const team = await getTeamForUser(db, teamId, user.id);
  if (!team) return notFound(c);

  if (!isRoleAtLeast(team.role, "admin")) {
    return forbidden(c);
  }

  const success = await removeMember(db, teamId, targetUserId);
  if (!success) return badRequest(c);
  return c.json({ success: true });
});

/**
 * GET /api/teams/:id/generations — List team's generations
 */
teams.get("/:id/generations", async (c) => {
  const { user, db } = useCtx(c);

  const teamId = c.req.param("id");
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize")) || 20));

  const team = await getTeamForUser(db, teamId, user.id);
  if (!team) return notFound(c);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.generations)
    .where(eq(schema.generations.teamId, teamId));
  const total = totalResult[0]?.count ?? 0;

  const data = await db
    .select()
    .from(schema.generations)
    .where(eq(schema.generations.teamId, teamId))
    .orderBy(desc(schema.generations.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json({
    success: true,
    data: {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  });
});

export default teams;
