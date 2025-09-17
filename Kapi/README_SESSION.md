# Kapi Session Add-on (Auth0 → Secure Cookie)

This add-on lets you convert a valid Auth0 Access Token into a signed, HttpOnly session cookie (`kapi_session`) and enforces it at the Edge.

## Files
- `netlify/functions/session-login.js` — POST with `Authorization: Bearer <access_token>` to set cookie
- `netlify/functions/session-logout.js` — POST to clear cookie
- `netlify/edge-functions/protect.js` — verifies HMAC + expiry on `kapi_session`

## Required env vars (Netlify → Site settings → Environment)
- `AUTH0_DOMAIN` (e.g. `dev-xxxx.us.auth0.com`)
- `AUTH0_AUDIENCE` (optional; only if your SPA requests an API audience)
- `SESSION_SECRET` (a long random string for HMAC, e.g. 32+ bytes)
- `SESSION_COOKIE_NAME` (optional, default `kapi_session`)
- `SESSION_TTL_SEC` (optional, default `3600`)
- `SESSION_SECURE` (`true` for HTTPS sites; `false` for local dev over http)
- `SESSION_SAMESITE` (`Lax` or `None`; use `None` if cross-site)

## Frontend changes
After a successful Auth0 login in the browser, call:

```js
const token = await kapiAuth.getToken();
await fetch('/api/session/login', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
// Now you have a secure cookie; navigating to /apps.html and /account.html will be allowed at the edge.
```

On logout, call:
```js
await fetch('/api/session/logout', { method: 'POST' });
await kapiAuth.logout();
```

## Edge protection
The provided `netlify/edge-functions/protect.js` checks the cookie signature + expiry before serving protected pages. Map the paths you want protected via the exported config or netlify.toml.
