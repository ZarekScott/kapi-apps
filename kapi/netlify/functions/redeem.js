import { jwtVerify } from "jose";
export const config = { path: "/.netlify/functions/redeem" };
export default async (req, context) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return new Response("Missing token", { status: 400 });
  const secrets = (process.env.DOWNLOAD_SECRETS || process.env.DOWNLOAD_SECRET || "").split(",").map(s=>s.trim()).filter(Boolean);
  let ok = false;
  for (const s of secrets) {
    try { await jwtVerify(token, new TextEncoder().encode(s)); ok = true; break; } catch(e){}
  }
  if (!ok) return new Response("Invalid/expired link", { status: 401 });
  const headers = new Headers();
  headers.append("Set-Cookie", `kapi_ent=${token}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV==='production'?'Secure;':''} Max-Age=604800`);
  headers.append("Location", "/apps.html");
  return new Response(null, { status: 302, headers });
};
