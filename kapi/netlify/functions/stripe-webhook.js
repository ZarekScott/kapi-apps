import Stripe from "stripe";
import { SignJWT } from "jose";
export const config = { path: "/api/stripe/webhook" };
const mapEntitlements = (plinkId) => {
  const map = {
    [process.env.STRIPE_LINK_ID_UNDERWRITING_PRO || ""]: ["underwriting-pro"],
    [process.env.STRIPE_LINK_ID_UNDERWRITING_PRO_MONTHLY || ""]: ["underwriting-pro"],
    [process.env.STRIPE_LINK_ID_DEAL_CALCULATOR || ""]: ["deal-calculator"],
    [process.env.STRIPE_LINK_ID_INVESTOR_TOOLS_PACK || ""]: ["underwriting-pro", "deal-calculator"],
    [process.env.STRIPE_LINK_ID_INVESTOR_DISCORD || ""]: ["investor-discord"],
  };
  return map[plinkId] || [];
};
async function signToken(entitlements, email) {
  const secrets = (process.env.DOWNLOAD_SECRETS || process.env.DOWNLOAD_SECRET || "").split(",").map(s=>s.trim()).filter(Boolean);
  const ttl = parseInt(process.env.DOWNLOAD_TOKEN_TTL || "1800", 10);
  const exp = Math.floor(Date.now()/1000) + ttl;
  return await new SignJWT({ entitlements, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secrets[0]));
}
export default async (req, context) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = req.headers.get("stripe-signature");
  const body = await req.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(body), sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
    const plink = session.payment_link || "";
    const ent = mapEntitlements(plink);
    if (email && ent.length) {
      const token = await signToken(ent, email);
      const origin = process.env.PUBLIC_ORIGIN || "https://example.com";
      const redeem = `${origin}/.netlify/functions/redeem?token=${encodeURIComponent(token)}`;
      const downloadables = ent.filter(e => e === "underwriting-pro" || e === "deal-calculator");
      const links = downloadables.map(e => `${origin}/.netlify/functions/download?product=${encodeURIComponent(e)}&token=${encodeURIComponent(token)}`).join("<br>");
      const hasDiscord = ent.includes("investor-discord");
      const discordSection = hasDiscord ? `<p>Community: <a href="${process.env.DISCORD_INVITE_URL || '#'}">Join the Investor Discord</a></p>` : "";
      const html = `
        <div style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif">
          <h2>You're in! Access Kapi</h2>
          <p><a href="${redeem}" style="display:inline-block;padding:10px 16px;border:1px solid #222;border-radius:8px;text-decoration:none">Open Kapi</a></p>
          ${links ? `<p>Direct downloads:<br>${links}</p>` : ''}
          ${discordSection}
          <p>This link expires soon for security. You can always re-request your link on the Get Access page.</p>
        </div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.FROM_EMAIL || "downloads@kapi.app", to: [email], subject: "Your Kapi access", html })
      });
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
