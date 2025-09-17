## Security & Secret Management

- **Never** commit real secrets to the repo. Set them in **Netlify → Site settings → Environment**.
- Use `SESSION_SECRETS` (comma-separated). The **first** value is active for signing; older ones verify existing cookies (supports rotation without logout).
- Netlify stores environment variables **encrypted at rest** and injects them only at build/runtime. They are **not** exposed to the browser.
- Cookies are **HttpOnly**, **Secure** (in production), and **SameSite** (default Lax). Token TTL defaults to 1 hour — tune via `SESSION_TTL_SEC`.
- For extra hardening, rotate secrets regularly and scope env vars per deploy context (Preview vs Production) in `netlify.toml`.
