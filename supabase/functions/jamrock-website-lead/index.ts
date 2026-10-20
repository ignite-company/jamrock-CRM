import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const ALLOWED_ORIGINS = new Set([
  "https://www.jamrockjunk.com",
  "https://jamrockjunk.com",
  "https://jamrock-junk-removal.vercel.app",
  "https://jamrock-junk-removal-contact-32903528s-projects.vercel.app",
]);
const MAX_BODY_BYTES = 12000;
const json = (payload: Record<string, unknown>, status=200, origin="") =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Vary": "Origin",
    },
  });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ ok: false, error: "This source is not permitted" }, 403, origin);
  }
  if (req.method === "OPTIONS") return json({ ok: true }, 200, origin);
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, origin);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return json({ ok: false, error: "Submission too large" }, 413, origin);

  try {
    const body = await req.text();
    if (body.length > MAX_BODY_BYTES) return json({ ok: false, error: "Submission too large" }, 413, origin);
    let data: Record<string, unknown>;
    try { data = JSON.parse(body); }
    catch { return json({ ok: false, error: "Invalid request" }, 400, origin); }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return json({ ok: false, error: "Invalid request" }, 400, origin);
    }
    // A hidden form field traps unsophisticated spam bots without rejecting human submissions.
    if (data.website_fax) return json({ ok: true }, 200, origin);
    const uuid = String(data.submission_id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
      return json({ ok: false, error: "Submission ID required" }, 400, origin);
    }
    const first = String(data.first_name || "").trim();
    const last = String(data.last_name || "").trim();
    const email = String(data.email || "").trim();
    const phone = String(data.phone || "").trim();
    const zip = String(data.zip || "").trim();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!first || !last || first.length > 90 || last.length > 90 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 ||
        phoneDigits.length < 10 || phoneDigits.length > 15 ||
        !/^\d{5}(?:-\d{4})?$/.test(zip)) {
      return json({ ok: false, error: "Please check your contact details" }, 400, origin);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Jamrock intake missing Supabase runtime credentials");
      return json({ ok: false, error: "Service temporarily unavailable" }, 503, origin);
    }
    // Only server runtime holds the privileged key. Never share it with public website code.
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const forwarded = req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unavailable";
    const buffer = new TextEncoder().encode("jamrock-intake-v1:" + serviceRoleKey.slice(0, 20) + ":" + forwarded);
    const hashBytes = await crypto.subtle.digest("SHA-256", buffer);
    const ipHash = Array.from(new Uint8Array(hashBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
    const { error } = await client.rpc("ingest_jamrock_website_lead", {
      p_data: data,
      p_submission_id: uuid,
      p_ip_hash: ipHash,
    });
    if (error) {
      const throttled = error.message.includes("Too many submissions");
      console.error("Jamrock intake rejected submission", { code: error.code, throttled });
      return json({ ok: false, error: throttled ? "Please try again later" : "Could not save request" }, throttled ? 429 : 500, origin);
    }
    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Jamrock intake request error", String(error));
    return json({ ok: false, error: "Unable to save request" }, 500, origin);
  }
});
