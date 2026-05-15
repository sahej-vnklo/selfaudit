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

      const [
        { data: reports, error: rErr },
        { data: chatRows, error: cErr },
        { data: bsData },
        { data: intelData },
      ] = await Promise.all([
        sb.from("reports").select("id, title, content, created_at, conversation_mode").eq("user_id", profile.id).order("created_at", { ascending: false }),
        sb.from("chats").select("id, session_id, role, message, created_at").eq("user_id", profile.id).order("created_at", { ascending: true }),
        sb.from("business_state").select("core_offer, target_customer, active_goal, goal_score, operational_blockers, assumptions_unverified, funnel_stages, revenue_streams, last_audit_headline, conversion_bottlenecks, current_constraints, pricing_structure").eq("user_id", profile.id).single(),
        sb.from("intelligence_profiles").select("summary, top_priorities, watchouts, repeated_blockers, opportunities, domains_audited, confidence").eq("user_id", profile.id).single(),
      ]);

      if (rErr) throw new Error(rErr.message);
      if (cErr) throw new Error(cErr.message);

      // Group chat rows into sessions — include full messages for replay
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
          messages: rows!.map((r) => ({ id: r.id, role: r.role, message: r.message })),
        };
      });

      // Live brain state — what the AI actually knows about this user right now
      const brain = {
        core_offer:             bsData?.core_offer             ?? null,
        target_customer:        bsData?.target_customer        ?? null,
        active_goal:            bsData?.active_goal            ?? null,
        goal_score:             bsData?.goal_score             ?? 0,
        operational_blockers:   bsData?.operational_blockers   ?? [],
        assumptions_unverified: bsData?.assumptions_unverified ?? [],
        funnel_stages:          bsData?.funnel_stages          ?? [],
        revenue_streams:        bsData?.revenue_streams        ?? [],
        last_audit_headline:    bsData?.last_audit_headline    ?? null,
        conversion_bottlenecks: bsData?.conversion_bottlenecks ?? [],
        current_constraints:    bsData?.current_constraints    ?? [],
        pricing_structure:      bsData?.pricing_structure      ?? null,
        top_priorities:         intelData?.top_priorities      ?? [],
        watchouts:              intelData?.watchouts           ?? [],
        repeated_blockers:      intelData?.repeated_blockers   ?? [],
        opportunities:          intelData?.opportunities       ?? [],
        domains_audited:        intelData?.domains_audited     ?? [],
        intelligence_summary:   intelData?.summary             ?? null,
        confidence:             intelData?.confidence          ?? null,
      };

      return ok({ profile, reports: reports ?? [], chat_sessions, brain });
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
      tier: z.enum(["foundation", "intelligence"]).describe("New tier"),
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

const ADMIN_EMAIL = 'sahej@vnklo.com'

export default async function handler(req: any, res: any): Promise<void> {
  // Auth — accept server-side admin key (header only) or a Supabase session JWT
  const keyFromHeader = (req.headers?.['x-tsa-admin-key'] as string) || ''
  const authHeader = (req.headers?.['authorization'] as string) || ''

  let isAuthorized = false

  if (process.env.TSA_ADMIN_KEY && keyFromHeader === process.env.TSA_ADMIN_KEY) {
    isAuthorized = true
  } else if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data, error } = await getSupabase().auth.getUser(token)
    if (!error && data?.user?.email === ADMIN_EMAIL) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    res.status(401).json({ error: "Unauthorized" });
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
