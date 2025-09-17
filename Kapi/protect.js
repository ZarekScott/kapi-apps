// Netlify Edge Function: requires a valid Netlify Identity session cookie (nf_jwt).
// If missing or expired, redirect to /login.html (with a return param).

export default async (req, context) => {
  const cookies = req.headers.get('cookie') || '';
  const m = cookies.match(/(?:^|;\s*)nf_jwt=([^;]+)/);
  if (!m) return redirectToLogin(req);

  const token = m[1];
  // Basic JWT payload check (no signature verification; Netlify sets this cookie)
  try {
    const [_, payload] = token.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    if (json && json.exp && now > json.exp) {
      return redirectToLogin(req);
    }
  } catch {
    return redirectToLogin(req);
  }
  return context.next();
};

function redirectToLogin(req) {
  const url = new URL('/login.html', req.url);
  // optional: pass original path so you can redirect back post-login
  url.searchParams.set('r', new URL(req.url).pathname);
  return Response.redirect(url, 302);
}
