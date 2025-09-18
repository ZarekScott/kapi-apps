import Stripe from "stripe";
import { SignJWT } from "jose";
export const config = { path: "/.netlify/functions/resend-link" };
async function signToken(entitlements, email) {
  const secrets = (process.env.DOWNLOAD_SECRETS || process.env.DOWNLOAD_SECRET || "").split(",").map(s=>s.trim()).filter(Boolean);
  const ttl = parseInt(process.env.DOWNLOAD_TOKEN_TTL || "1800", 10);
  const exp = Math.floor(Date.now()/1000) + ttl;
  return await new SignJWT({ entitlements, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secrets[0]));
}
const mapEntitlements = (plinkId) => {
  const map = {
    [process.env.STRIPE_LINK_ID_UNDERWRITING_PRO || ""]: ["underwriting-pro"],
    [process.env.STRIPE_LINK_ID_UNDERWRITING_PRO_MONTHLY || ""]: ["underwriting-pro"],
    [process.env.STRIPE_LINK_ID_DEAL_CALCULATOR || ""]: ["deal-calculator"],
    [process.env.STRIPE_LINK_ID_INVESTOR_TOOLS_PACK || ""]: ["underwriting-pro","deal-calculator"],
    [process.env.STRIPE_LINK_ID_INVESTOR_DISCORD || ""]: ["investor-discord"],
  };
  return map[plinkId] || [];
};
export default async (req, context) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.json();
  const email = String(body?.email || "").toLowerCase();
  if (!email) return new Response("Bad Request", { status: 400 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const customers = await stripe.customers.search({ query: `email:'${email}'` });
  const ents = new Set();
  for (const c of customers.data) {
    const sessions = await stripe.checkout.sessions.list({ limit: 40, customer: c.id });
    for (const s of sessions.data) {
      if (s.status !== "complete") continue;
      const pl = s.payment_link;
      for (const e of mapEntitlements(pl)) ents.add(e);
    }
  }
  if (!ents.size) return new Response(JSON.stringify({ ok: true }), { status: 200 });
  const token = await signToken(Array.from(ents), email);
  const origin = process.env.PUBLIC_ORIGIN || "https://example.com";
  const redeem = `${origin}/.netlify/functions/redeem?token=${encodeURIComponent(token)}`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || "downloads@kapi.app", to: [email], subject: "Your Kapi access", html: `Access Kapi: <a href="${redeem}">${redeem}</a>` })
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
