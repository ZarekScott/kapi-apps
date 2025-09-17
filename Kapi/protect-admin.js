// Netlify Edge Function: admin-only gate for /admin/*
// Allows access if user has role "admin" OR their email matches ADMIN_EMAILS (comma-separated).

export default async (req, context) => {
  const cookies = req.headers.get('cookie') || '';
  const m = cookies.match(/(?:^|;\s*)nf_jwt=([^;]+)/);
  if (!m) return redirectToLogin(req);

  const token = m[1];
  try {
    const [_, payload] = token.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    if (!json || (json.exp && now > json.exp)) return redirectToLogin(req);

    const email = (json.email || json.e || '').toLowerCase();
    const roles = (json.app_metadata && json.app_metadata.roles) || json.roles || [];
    const adminEnv = (Deno.env.get('ADMIN_EMAILS') || '').toLowerCase();
    const adminEmails = adminEnv.split(',').map(s => s.trim()).filter(Boolean);

    const isAdmin = roles.includes('admin') || adminEmails.includes(email);
    if (!isAdmin) return Response.redirect(new URL('/login.html', req.url), 302);

    return context.next();
  } catch {
    return redirectToLogin(req);
  }
};

function redirectToLogin(req) {
  const url = new URL('/login.html', req.url);
  url.searchParams.set('r', new URL(req.url).pathname);
  return Response.redirect(url, 302);
}
