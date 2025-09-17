import { jwtVerify, createRemoteJWKSet } from 'jose';

const sameSite = process.env.SESSION_SAMESITE || 'Lax'; // 'None' if cross-site
const secure = (process.env.SESSION_SECURE || 'true') === 'true'; // true on HTTPS
const cookieName = process.env.SESSION_COOKIE_NAME || 'kapi_session';
const cookieTtlSec = parseInt(process.env.SESSION_TTL_SEC || '3600', 10); // 1h
const sessionSecrets = (process.env.SESSION_SECRETS || process.env.SESSION_SECRET || '').split(',').map(s=>s.trim()).filter(Boolean); // first is active
const auth0Domain = process.env.AUTH0_DOMAIN;     // e.g. dev-xxxx.us.auth0.com
const auth0Audience = process.env.AUTH0_AUDIENCE; // optional

if (!sessionSecrets.length) console.warn('SESSION_SECRETS/SESSION_SECRET is not set');
if (!auth0Domain) console.warn('AUTH0_DOMAIN is not set');

function b64url(data) {
  return Buffer.from(data).toString('base64url');
}

async function signHmacSHA256(data, secret) {
  const crypto = await import('node:crypto');
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

async function setCookieForSub(sub, email) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + cookieTtlSec;
  const kid = 0; const payload = { sub, email, exp, kid };
  const body = b64url(JSON.stringify(payload));
  const secret = sessionSecrets[0];
  const sig = await signHmacSHA256(body, secret);
  const value = `${body}.${sig}`;

  const parts = [`${cookieName}=${value}`, `Path=/`, `HttpOnly`, `SameSite=${sameSite}`];
  if (secure) parts.push('Secure');
  // Cookie expiration
  const expires = new Date(exp * 1000).toUTCString();
  parts.push(`Expires=${expires}`);
  parts.push(`Max-Age=${cookieTtlSec}`);
  return parts.join('; ');
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return new Response('Missing bearer token', { status: 401 });
    }

    const issuer = `https://${auth0Domain}/`;
    const JWKS = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: auth0Audience || undefined
    });

    const cookie = await setCookieForSub(payload.sub, payload.email || payload['https://example.com/email']);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': cookie
      }
    });
  } catch (e) {
    console.error(e);
    return new Response('Unauthorized', { status: 401 });
  }
};

export const config = { path: ['/api/session/login'] };
