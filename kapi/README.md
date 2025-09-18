# Kapi (Static HTML + Netlify) — Wired Funnel
All five product buttons on `/funnel.html` use `/.netlify/functions/pay?product=<slug>` to fetch the live Stripe Payment Link URL by ID and redirect.

Product slugs:
- underwriting-pro
- underwriting-pro-monthly
- deal-calculator
- investor-tools-pack
- investor-discord

Set your env in Netlify (see `.env.example`). Webhook, redeem, resend-link, download, and Discord invite functions are included.
