import Stripe from "stripe";
export const config = { path: "/.netlify/functions/pay" };
const slugToEnv = {
  "underwriting-pro": "STRIPE_LINK_ID_UNDERWRITING_PRO",
  "underwriting-pro-monthly": "STRIPE_LINK_ID_UNDERWRITING_PRO_MONTHLY",
  "deal-calculator": "STRIPE_LINK_ID_DEAL_CALCULATOR",
  "investor-tools-pack": "STRIPE_LINK_ID_INVESTOR_TOOLS_PACK",
  "investor-discord": "STRIPE_LINK_ID_INVESTOR_DISCORD",
};
export default async (req, ctx) => {
  const url = new URL(req.url);
  const product = url.searchParams.get("product") || "";
  const envKey = slugToEnv[product];
  if (!envKey) return new Response("Unknown product", { status: 400 });
  const plinkId = process.env[envKey] || "";
  if (!plinkId) return new Response("Payment Link not configured", { status: 500 });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const pl = await stripe.paymentLinks.retrieve(plinkId);
    if (!pl?.url) return new Response("Payment Link URL not found", { status: 500 });
    return new Response(null, { status: 302, headers: { Location: pl.url } });
  } catch (e) {
    return new Response("Stripe error", { status: 500 });
  }
};
