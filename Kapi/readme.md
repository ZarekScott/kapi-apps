
# Kapi (Auth0 + Netlify) — Fresh Scaffold

## 1) Put your Auth0 config in the site root
Copy `auth0-config.sample.js` to `auth0-config.js` and fill real values:
```js
window.AUTH0_CONFIG = {
  domain:       "YOUR_TENANT.us.auth0.com",
  clientId:     "YOUR_CLIENT_ID",
  audience:     "https://kapi-apps.api",
  redirect_uri: window.location.origin + "/callback.html",
  logout_uri:   window.location.origin + "/"
};
```
Verify it loads at: `https://YOUR-SITE/auth0-config.js`

## 2) Auth0 Application settings
Allowed Callback URLs: `https://YOUR-SITE/callback.html`  
Allowed Logout URLs:   `https://YOUR-SITE/`  
Allowed Web Origins:   `https://YOUR-SITE`  

Create an API in Auth0 with Identifier `https://kapi-apps.api` (or your choice) and use RS256.

## 3) Pages
- `index.html` — landing with auth buttons
- `signup.html` — signup screen → Auth0 Universal Login
- `login.html` — login screen → Auth0 Universal Login
- `callback.html` — PKCE redirect handler
- `apps.html` — protected page (uses `kapiRequireAuth`)

## 4) Netlify Functions (secured by Auth0)
- `netlify/functions/_auth0_verify.js` — verifies JWT from Auth0 using JWKS
- `netlify/functions/entitlements.js` — example secured endpoint (returns stub)
- `netlify/functions/package.json` — bundles jwt + jwks-rsa

Call from the browser with a Bearer token:
```js
const token = await kapiAuth.getToken();
fetch('/.netlify/functions/entitlements', { headers: { Authorization: `Bearer ${token}` } });
```

## 5) Remove Netlify Identity (if present)
Delete all `<script src="https://identity.netlify.com/...">` and `window.netlifyIdentitySettings` blocks.

## 6) Theming
- `assets/js/theme.js` toggles light/dark (persists to localStorage)
- `assets/css/brand.css` contains shared styles/variables
