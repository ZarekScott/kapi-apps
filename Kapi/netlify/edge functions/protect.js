 // netlify/edge-functions/protect.js
export default async (req, context) => {
  const cookie = req.headers.get('cookie') || '';
  const token = (cookie.match(/kapi_session=([^;]+)/) || [])[1];

  // TODO: verify JWT (issued at login) with your secret/public key
  // If invalid or missing, bounce to sign-in:
  if (!token /* || !verify(token) */) {
    return Response.redirect(new URL('/signin.html', req.url), 302);
  }
  return context.next();
};

// Protect these pages:
export const config = { path: [
  '/calculator_investor_grid*.html',
  '/underwriting*.html',
  '/investor_tools*.html',
  '/apps.html'
] };
