/**
 * Teams Routes
 *
 * Team management: create, list, detail, members, generations
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb, schema } from "@oura-pix/database";
import { desc, eq, sql } from "drizzle-orm";
import { getUser } from "../middleware/auth";
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
import { apiMessage } from "../lib/i18n";

const teams = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

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
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const { name } = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const team = await createTeam(db, user.id, name);
    return c.json({ success: true, data: team }, 201);
  } catch (error) {
    console.error("Failed to create team:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * GET /api/teams — List user's teams
 */
teams.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  try {
    const db = createDb(c.env.DB);
    const teams = await listUserTeams(db, user.id);
    return c.json({ success: true, data: teams });
  } catch (error) {
    console.error("Failed to list teams:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * GET /api/teams/:id — Get team details with members
 */
teams.get("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const teamId = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const team = await getTeamForUser(db, teamId, user.id);
    if (!team) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);

    const members = await listTeamMembers(db, teamId);
    return c.json({
      success: true,
      data: { ...team, members },
    });
  } catch (error) {
    console.error("Failed to get team:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * PUT /api/teams/:id — Update team name (owner only)
 */
teams.put("/:id", zValidator("json", updateSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const teamId = c.req.param("id");
  const { name } = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const team = await getTeamForUser(db, teamId, user.id);
    if (!team) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    if (team.role !== "owner") return c.json({ success: false, error: { code: "FORBIDDEN", message: apiMessage(c, "forbidden") } }, 403);

    const updated = await updateTeam(db, teamId, name);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update team:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/teams/:id — Delete team (owner only)
 */
teams.delete("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const teamId = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const team = await getTeamForUser(db, teamId, user.id);
    if (!team) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    if (team.role !== "owner") return c.json({ success: false, error: { code: "FORBIDDEN", message: apiMessage(c, "forbidden") } }, 403);

    await deleteTeam(db, teamId);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * POST /api/teams/:id/join — Join a team via invite code
 */
teams.post("/:id/join", zValidator("json", joinSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const { inviteCode } = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const member = await joinTeamByInviteCode(db, user.id, inviteCode);
    if (!member) return c.json({ success: false, error: { code: "BAD_REQUEST", message: apiMessage(c, "badRequest") } }, 400);
    return c.json({ success: true, data: member });
  } catch (error) {
    console.error("Failed to join team:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * POST /api/teams/:id/leave — Leave a team
 */
teams.post("/:id/leave", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const teamId = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const success = await leaveTeam(db, teamId, user.id);
    if (!success) return c.json({ success: false, error: { code: "BAD_REQUEST", message: apiMessage(c, "badRequest") } }, 400);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to leave team:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
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
    const user = await getUser(c);
    if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

    const teamId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    const { role } = c.req.valid("json");

    try {
      const db = createDb(c.env.DB);
      const team = await getTeamForUser(db, teamId, user.id);
      if (!team) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);

      // Authorization: owner can do anything; admin can only set role to 'member'
      if (team.role === "owner") {
        // OK
      } else if (team.role === "admin" && role === "member") {
        // OK
      } else {
        return c.json({ success: false, error: { code: "FORBIDDEN", message: apiMessage(c, "forbidden") } }, 403);
      }

      const updated = await updateMemberRole(db, teamId, targetUserId, role);
      if (!updated) return c.json({ success: false, error: { code: "BAD_REQUEST", message: apiMessage(c, "badRequest") } }, 400);
      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error("Failed to update role:", error);
      return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
    }
  }
);

/**
 * DELETE /api/teams/:id/members/:userId — Remove a member
 *  - owner can remove anyone (except self/owner)
 *  - admin can remove members only
 */
teams.delete("/:id/members/:userId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const teamId = c.req.param("id");
  const targetUserId = c.req.param("userId");

  try {
    const db = createDb(c.env.DB);
    const team = await getTeamForUser(db, teamId, user.id);
    if (!team) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);

    if (!isRoleAtLeast(team.role, "admin")) {
      return c.json({ success: false, error: { code: "FORBIDDEN", message: apiMessage(c, "forbidden") } }, 403);
    }

    const success = await removeMember(db, teamId, targetUserId);
    if (!success) return c.json({ success: false, error: { code: "BAD_REQUEST", message: apiMessage(c, "badRequest") } }, 400);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * GET /api/teams/:id/generations — List team's generations
 */
teams.get("/:id/generations", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const teamId = c.req.param("id");
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize")) || 20));

  try {
    const db = createDb(c.env.DB);
    const team = await getTeamForUser(db, teamId, user.id);
    if (!team) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);

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
  } catch (error) {
    console.error("Failed to list team generations:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

export default teams;
