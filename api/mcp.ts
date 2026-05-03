import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function buildServer() {
  const server = new McpServer({ name: "tsa-admin", version: "1.0.0" });
  const sb = getSupabase();

  // ── tsa_get_stats ──────────────────────────────────────────────────────────
  server.tool(
    "tsa_get_stats",
    "Returns TSA platform stats: total users, reports, chat sessions, signups today/this week, reports today.",
    {},
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        { count: totalUsers },
        { count: totalReports },
        { count: totalChats },
        { count: signupsToday },
        { count: signupsWeek },
        { count: reportsToday },
      ] = await Promise.all([
        sb.from("profiles").select("*", { count: "exact", head: true }),
        sb.from("reports").select("*", { count: "exact", head: true }),
        sb.from("chats").select("session_id", { count: "exact", head: true }),
        sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        sb.from("reports").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      ]);

      return ok({
        total_users: totalUsers ?? 0,
        total_reports: totalReports ?? 0,
        total_chat_sessions: totalChats ?? 0,
        signups_today: signupsToday ?? 0,
        signups_this_week: signupsWeek ?? 0,
        reports_today: reportsToday ?? 0,
      });
    },
  );

  // ── tsa_list_users ─────────────────────────────────────────────────────────
  server.tool(
    "tsa_list_users",
    "Returns all users from admin_user_overview: id, email, name, tier, industry, domain, report_count, created_at.",
    {},
    async () => {
      const { data, error } = await sb
        .from("admin_user_overview")
        .select("id, email, name, tier, industry, domain, report_count, created_at")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return ok(data);
    },
  );

  // ── tsa_get_user ───────────────────────────────────────────────────────────
  server.tool(
    "tsa_get_user",
    "Returns full profile, all reports, and chat sessions (grouped by session_id) for a user by email.",
    { email: z.string().email().describe("User email address") },
    async ({ email }) => {
      const { data: profile, error: pErr } = await sb
        .from("admin_user_overview")
        .select("*")
        .eq("email", email)
        .single();

      if (pErr || !profile) throw new Error(pErr?.message ?? "User not found");

      const [{ data: reports, error: rErr }, { data: chatRows, error: cErr }] = await Promise.all([
        sb.from("reports").select("id, title, content, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }),
        sb.from("chats").select("id, session_id, role, message, created_at").eq("user_id", profile.id).order("created_at", { ascending: true }),
      ]);

      if (rErr) throw new Error(rErr.message);
      if (cErr) throw new Error(cErr.message);

      // Group chat rows into sessions
      const sessionMap: Record<string, typeof chatRows> = {};
      for (const row of chatRows ?? []) {
        const key = row.session_id ?? row.id;
        if (!sessionMap[key]) sessionMap[key] = [];
        sessionMap[key]!.push(row);
      }
      const chat_sessions = Object.entries(sessionMap).map(([sid, rows]) => {
        const firstUser = rows!.find((r) => r.role === "user");
        return {
          session_id: sid,
          message_count: rows!.length,
          preview: (firstUser?.message ?? "").slice(0, 100),
          started_at: rows![0]?.created_at,
        };
      });

      return ok({ profile, reports: reports ?? [], chat_sessions });
    },
  );

  // ── tsa_get_report ─────────────────────────────────────────────────────────
  server.tool(
    "tsa_get_report",
    "Returns a full report row including content by report UUID.",
    { report_id: z.string().describe("Report UUID") },
    async ({ report_id }) => {
      const { data, error } = await sb.from("reports").select("*").eq("id", report_id).single();
      if (error || !data) throw new Error(error?.message ?? "Report not found");
      return ok(data);
    },
  );

  // ── tsa_update_user_tier ───────────────────────────────────────────────────
  server.tool(
    "tsa_update_user_tier",
    "Updates a user's subscription tier.",
    {
      email: z.string().email().describe("User email address"),
      tier: z.enum(["essential", "business", "portfolio"]).describe("New tier"),
    },
    async ({ email, tier }) => {
      const { data: profile, error: pErr } = await sb
        .from("admin_user_overview")
        .select("id")
        .eq("email", email)
        .single();

      if (pErr || !profile) throw new Error(pErr?.message ?? "User not found");

      const { error } = await sb.from("profiles").update({ tier }).eq("id", profile.id);
      if (error) throw new Error(error.message);

      return ok({ success: true, email, tier, message: `Updated ${email} to tier: ${tier}` });
    },
  );

  // ── tsa_delete_user ────────────────────────────────────────────────────────
  server.tool(
    "tsa_delete_user",
    "Permanently deletes a user and all their data (reports, chats, profile). Cascades via FK. Requires confirm: true.",
    {
      email: z.string().email().describe("User email address"),
      confirm: z.literal(true).describe("Must be exactly true to execute deletion"),
    },
    async ({ email }) => {
      const { data: profile, error: pErr } = await sb
        .from("admin_user_overview")
        .select("id")
        .eq("email", email)
        .single();

      if (pErr || !profile) throw new Error(pErr?.message ?? "User not found");

      const { error } = await sb.auth.admin.deleteUser(profile.id);
      if (error) throw new Error(error.message);

      return ok({ success: true, message: `User ${email} deleted. All associated data removed.` });
    },
  );

  return server;
}

// ── Vercel handler ─────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any): Promise<void> {
  // Auth
  const adminKey = req.headers["x-tsa-admin-key"];
  if (!process.env.TSA_ADMIN_KEY || adminKey !== process.env.TSA_ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized: missing or invalid x-tsa-admin-key" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed — use POST" });
    return;
  }

  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless — no sessions
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message ?? "Internal server error" });
    }
  }
}
