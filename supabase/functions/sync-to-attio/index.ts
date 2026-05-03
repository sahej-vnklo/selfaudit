// @ts-ignore Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface UserPayload {
  id: string;
  email: string;
  name: string;
  industry?: string;
  domain?: string;
  tier?: string;
  created_at: string;
}

// deno-lint-ignore no-explicit-any
async function attioPost(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  const apiKey = Deno.env.get("ATTIO_API_KEY");
  if (!apiKey) throw new Error("ATTIO_API_KEY not set");

  const res = await fetch(`https://api.attio.com/v2${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ") || "";
  return { first, last };
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let user: UserPayload;
  try {
    user = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { id, email, name, industry, domain, tier, created_at } = user;

  if (!email || !name) {
    return new Response("Missing required fields: email, name", { status: 400 });
  }

  const { first, last } = splitName(name);

  // --- Create/upsert Person record ---
  const personPayload = {
    data: {
      values: {
        email_addresses: [{ email_address: email }],
        name: { first_name: first, last_name: last, full_name: name },
      },
    },
    matching_attribute: "email_addresses",
  };

  const personRes = await attioPost("/objects/people/records", personPayload).catch((err) => {
    console.error("[sync-to-attio] Person upsert error:", err);
    return null;
  });

  if (!personRes) {
    return new Response(JSON.stringify({ error: "Failed to reach Attio API" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!personRes.ok) {
    console.error("[sync-to-attio] Attio person error:", personRes.status, JSON.stringify(personRes.data));
    return new Response(
      JSON.stringify({ error: "Attio API error", details: personRes.data }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`[sync-to-attio] Person synced: ${email} (user ${id})`);

  // --- Create/upsert Company record if domain present ---
  if (domain) {
    const companyPayload = {
      data: {
        values: {
          domains: [{ domain }],
          ...(industry ? { industry: [{ value: industry }] } : {}),
        },
      },
      matching_attribute: "domains",
    };

    const companyRes = await attioPost("/objects/companies/records", companyPayload).catch((err) => {
      console.error("[sync-to-attio] Company upsert error:", err);
      return null;
    });

    if (companyRes && !companyRes.ok) {
      console.error("[sync-to-attio] Attio company error:", companyRes.status, JSON.stringify(companyRes.data));
    } else if (companyRes) {
      console.log(`[sync-to-attio] Company synced: ${domain}`);
    }
  }

  return new Response(
    JSON.stringify({ success: true, email, id }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
