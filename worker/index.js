export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "*";
    const allowOrigin = (env.ALLOWED_ORIGINS && env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).includes(origin)) ? origin : "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type,x-acl-auth-key",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
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
    const url = new URL(request.url);
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
