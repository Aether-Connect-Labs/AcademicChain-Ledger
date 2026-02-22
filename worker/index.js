export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "*";
    const allowOrigin = (env.ALLOWED_ORIGINS && env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).includes(origin)) ? origin : "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type,x-acl-auth-key",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, corsHeaders, url);
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400, headers: corsHeaders });
    }
    const endpoint = url.pathname.replace(/^\/+/, "");
    const base = deriveBase(env);
    const target = `${base}/${endpoint || "submit-document"}`;
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ACL-AUTH-KEY": env.ACL_AUTH_KEY || ""
        },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      return new Response(text, { status: res.status, headers: { ...corsHeaders, "Content-Type": res.headers.get("content-type") || "application/json" } });
    } catch {
      return new Response("Upstream Error", { status: 502, headers: corsHeaders });
    }
  }
};

async function handleApi(request, env, corsHeaders, url) {
  const path = url.pathname;
  if (path === "/api/auth/login" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Bad Request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const email = String(body.email || "").trim() || "admin@academicchain.com";
    const role = String(body.role || "admin");
    const token = "acl-" + btoa(email + "|" + role);
    const user = { id: "user-" + email, name: body.name || "Admin AcademicChain", email, role };
    return new Response(JSON.stringify({ success: true, token, user }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (path === "/api/auth/me" && request.method === "GET") {
    const auth = request.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = auth.slice("Bearer ".length).trim();
    let email = "admin@academicchain.com";
    let role = "admin";
    try {
      const decoded = atob(token.replace(/^acl-/, ""));
      const parts = decoded.split("|");
      if (parts[0]) email = parts[0];
      if (parts[1]) role = parts[1];
    } catch {}
    const user = { id: "user-" + email, name: "Admin AcademicChain", email, role };
    return new Response(JSON.stringify({ success: true, data: user }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (path === "/api/universities/statistics" && request.method === "GET") {
    const base = deriveBase(env);
    const statsUrl = `${base}/stats-credentials${url.search}`;
    try {
      const res = await fetch(statsUrl, {
        method: "GET",
        headers: {
          "X-ACL-AUTH-KEY": env.ACL_AUTH_KEY || ""
        }
      });
      const text = await res.text();
      const contentType = res.headers.get("content-type") || "application/json";
      return new Response(text, { status: res.status, headers: { ...corsHeaders, "Content-Type": contentType } });
    } catch {
      const fallback = { success: true, revoked: 0, deleted: 0, verified: 0, pending: 0, simulated: true };
      return new Response(JSON.stringify(fallback), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
  if (request.method === "GET") {
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }
  if (path === "/api/v1/ai/validate-batch" && request.method === "POST") {
    const batch = Array.isArray(body.batch) ? body.batch : [];
    const total = batch.length;
    const issues = [];
    return new Response(JSON.stringify({ success: true, data: { total, issues } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return new Response("Not Found", { status: 404, headers: corsHeaders });
}

function deriveBase(env) {
  const u = env.N8N_WEBHOOK_URL || "";
  if (!u) {
    const b = env.N8N_BASE_URL || "";
    if (b) return `${b.replace(/\/+$/, "")}/webhook`;
    return "";
  }
  try {
    const url = new URL(u);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const i = parts.indexOf("webhook");
      if (i >= 0) {
        const basePath = parts.slice(0, i + 1).join("/");
        return `${url.origin}/${basePath}`;
      }
    }
    if (url.pathname.endsWith("/webhook")) return `${url.origin}${url.pathname}`;
    return `${url.origin}/webhook`;
  } catch {
    return u.replace(/\/submit-document$/, "");
  }
}
