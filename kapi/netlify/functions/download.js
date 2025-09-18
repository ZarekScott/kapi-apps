import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { jwtVerify } from "jose";
export const config = { path: "/.netlify/functions/download" };
async function verify(token) {
  const secrets = (process.env.DOWNLOAD_SECRETS || process.env.DOWNLOAD_SECRET || "").split(",").map(s=>s.trim()).filter(Boolean);
  for (const s of secrets) {
    try { const r = await jwtVerify(token, new TextEncoder().encode(s)); return r.payload; } catch(e){}
  }
  throw new Error("bad");
}
async function signedUrlFor(product) {
  const region = process.env.AWS_REGION || "us-east-1";
  const ttl = parseInt(process.env.DOWNLOAD_URL_TTL || "300", 10);
  const filename = product === "underwriting-pro" ? (process.env.DL_UWPRO_FILENAME || "UnderwritingPro.zip") :
                   product === "deal-calculator" ? (process.env.DL_DEALCALC_FILENAME || "DealCalculator.zip") :
                   (process.env.DOWNLOAD_FILENAME || "KapiApp.zip");
  const bucket = product === "underwriting-pro" ? (process.env.DL_UWPRO_BUCKET || process.env.DOWNLOAD_BUCKET) :
                 product === "deal-calculator" ? (process.env.DL_DEALCALC_BUCKET || process.env.DOWNLOAD_BUCKET) :
                 process.env.DOWNLOAD_BUCKET;
  const key = product === "underwriting-pro" ? process.env.DL_UWPRO_KEY :
              product === "deal-calculator" ? process.env.DL_DEALCALC_KEY :
              process.env.DOWNLOAD_KEY;
  if (bucket && key) {
    const s3 = new S3Client({ region });
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: `attachment; filename="${filename}"` });
    return await getSignedUrl(s3, cmd, { expiresIn: ttl });
  }
  const fallback = product === "underwriting-pro" ? process.env.FALLBACK_UWPRO_URL :
                   product === "deal-calculator" ? process.env.FALLBACK_DEALCALC_URL :
                   process.env.FALLBACK_DOWNLOAD_URL;
  return fallback || "/KapiApp.zip";
}
export default async (req, context) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const product = url.searchParams.get("product") || "";
  if (!token || !product) return new Response("Missing params", { status: 400 });
  try {
    const payload = await verify(token);
    const ent = Array.isArray(payload.entitlements) ? payload.entitlements : [];
    if (!ent.includes(product)) return new Response("Not entitled", { status: 403 });
    if (product === "investor-discord") return new Response("No download for this product", { status: 400 });
    const location = await signedUrlFor(product);
    return new Response(null, { status: 302, headers: { Location: location } });
  } catch (e) {
    return new Response("Invalid/expired link", { status: 401 });
  }
};
