// auth0-config.sample.js
// ⬇️ Rename this file to auth0-config.js and fill in your real tenant values.
// Keep this file out of version control if you prefer (e.g., add to .gitignore).
window.AUTH0_CONFIG = {
  domain:       "dev-0xptczovvh1pxg3t.us.auth0.com", // e.g. kapi-tenant.us.auth0.com
  clientId:     "l5iKfxD9nIDGtNqlStK0E1OB5wMv3m6S",           // Applications → Your SPA → Client ID
  audience:     "https://kapi-apps.api",    // APIs → Identifier (create an API if needed)
  redirect_uri: window.location.origin + "/callback.html",
  logout_uri:   window.location.origin + "/"
};
