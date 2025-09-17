# Kapi — Auth0-only Starter

This zip is a cleaned Auth0-only version of your Kapi auth flow. It removes Netlify Identity artifacts and standardizes pages.

## What’s inside
- `index.html` — public landing
- `login.html` / `signup.html` — start auth
- `callback.html` — handles Auth0 redirect
- `account.html` — protected; shows the user, includes sign out
- `apps.html` — example protected page that fetches a token and prints a preview
- `auth0-config.js` — **fill in your Auth0 domain/clientId (and optional audience)**
- `auth0-client.js` — small helper wrapper for Auth0 SPA SDK
- `netlify.toml` — publish the `Kapi_clean_auth0` folder by default
- `netlify/edge-functions/protect.js` — (optional) example edge guard (no real verification yet)

## Set up
1. In the Auth0 Dashboard → Applications → Single Page App
   - Allowed Callback URLs: `https://YOUR_SITE/callback.html` (and local dev)
   - Allowed Logout URLs: `https://YOUR_SITE/`
   - Allowed Web Origins: `https://YOUR_SITE`
   - Ensure your Database Connection enables signups and is enabled for this application.
2. Edit `auth0-config.js` with your real values.
3. Deploy to Netlify.
4. Ensure your site publishes this folder (`Kapi_clean_auth0`) or move contents into your site root.

## Protecting real content
The sample uses client-side guards. For true protection, create a Netlify Function that verifies the Auth0 token and issues a short-lived session cookie; have the edge function check the cookie before serving protected pages.
