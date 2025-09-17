export default async (req, context) => {
  const cookieName = (process.env.SESSION_COOKIE_NAME || 'kapi_session');
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
  const value = match && match[1];
  if (!value) {
    return Response.redirect(new URL('/login.html', req.url), 302);
  }
  const [body, sig] = value.split('.');
  const sessionSecrets = (process.env.SESSION_SECRETS || process.env.SESSION_SECRET || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (!sessionSecret || !body || !sig) {
    return Response.redirect(new URL('/login.html', req.url), 302);
  }
  // Verify expiration and HMAC
  try {
    const crypto = await import('node:crypto');
    let ok = false;
    for (const secret of sessionSecrets) {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
      if (expected === sig) { ok = true; break; }
    }
    if (!ok) throw new Error('Bad signature');
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || (payload.exp * 1000) < Date.now()) throw new Error('Expired');
    return context.next();
  } catch (e) {
    return Response.redirect(new URL('/login.html', req.url), 302);
  }
};

export const config = { path: ['/apps.html', '/account.html'] };
