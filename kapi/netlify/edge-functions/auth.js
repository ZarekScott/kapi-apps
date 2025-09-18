export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const needs = [
    { test: p => p === "/apps.html", check: () => true },
    { test: p => p.startsWith("/calculators/underwriting-pro"), check: ent => ent.includes("underwriting-pro") },
    { test: p => p.startsWith("/calculators/deal-calculator"), check: ent => ent.includes("deal-calculator") },
    { test: p => p === "/community.html", check: ent => ent.includes("investor-discord") },
  ];
  const must = needs.find(n => n.test(path));
  if (!must) return;
  const cookie = request.headers.get("cookie") || "";
  const token = (cookie.match(/kapi_ent=([^;]+)/) || [])[1] || "";
  if (!token) return Response.redirect(new URL("/funnel.html", url), 302);
  try {
    const payload = await verifyJWT(token, Deno.env.get("DOWNLOAD_SECRETS") || Deno.env.get("DOWNLOAD_SECRET") || "");
    const ents = Array.isArray(payload.entitlements) ? payload.entitlements : [];
    if (must.check(ents)) return;
  } catch (e) {}
  return Response.redirect(new URL("/funnel.html", url), 302);
}
async function verifyJWT(token, secretsCsv) {
  const secrets = secretsCsv.split(",").map(s => s.trim()).filter(Boolean);
  const [h, p, s] = token.split(".");
  for (const secret of secrets) {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]),
      base64urlToUint8Array(s),
      new TextEncoder().encode(`${h}.${p}`)
    );
    if (ok) {
      const payload = JSON.parse(new TextDecoder().decode(base64urlToUint8Array(p)));
      if (payload.exp && Date.now()/1000 > payload.exp) throw new Error("expired");
      return payload;
    }
  }
  throw new Error("invalid");
}
function base64urlToUint8Array(b64url) {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i=0;i<str.length;i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}
