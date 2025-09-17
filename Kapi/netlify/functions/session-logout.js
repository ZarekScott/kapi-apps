const cookieName = process.env.SESSION_COOKIE_NAME || 'kapi_session';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  // Expire the cookie
  const parts = [
    `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  ];
  // If you set Secure in login, set here too
  if ((process.env.SESSION_SECURE || 'true') === 'true') {
    parts[0] += '; Secure';
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': parts[0]
    }
  });
};

export const config = { path: ['/api/session/logout'] };
