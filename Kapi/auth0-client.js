/* auth0-client.js — Kapi Auth0 bootstrap (vanilla JS) */
(function () {
  const ready = new Promise((resolve) => {
    const tick = () => (window.createAuth0Client ? resolve() : setTimeout(tick, 25));
    tick();
  });

  async function init() {
    await ready;
    if (!window.AUTH0_CONFIG) {
      console.error("AUTH0_CONFIG not found. Include auth0-config.js before this file.");
      return;
    }
    const cfg = window.AUTH0_CONFIG;

    const client = await createAuth0Client({
      domain: cfg.domain,
      clientId: cfg.clientId,
      authorizationParams: {
        audience: cfg.audience,
        redirect_uri: cfg.redirect_uri
      },
      cacheLocation: "localstorage",
      useRefreshTokens: true
    });
    window.auth0Client = client;

    function mergeAuthParams(base, options) {
      const merged = Object.assign({}, base || {});
      if (options && options.authorizationParams) {
        Object.assign(merged, options.authorizationParams);
      }
      return merged;
    }

    async function login(options = {}) {
      const current = window.location.pathname + window.location.search + window.location.hash;
      try { sessionStorage.setItem("kapi.postLoginRedirect", current); } catch(e){}
      return client.loginWithRedirect({
        authorizationParams: mergeAuthParams({}, options)
      });
    }
    async function signup(options = {}) {
      const current = window.location.pathname + window.location.search + window.location.hash;
      try { sessionStorage.setItem("kapi.postLoginRedirect", current); } catch(e){}
      return client.loginWithRedirect({
        authorizationParams: mergeAuthParams({ screen_hint: "signup" }, options)
      });
    }
    async function logout() {
      return client.logout({ logoutParams: { returnTo: cfg.logout_uri || window.location.origin } });
    }
    async function isAuthenticated() { return client.isAuthenticated(); }
    async function getUser() { return client.getUser(); }
    async function getToken() { return client.getTokenSilently(); }

    window.kapiAuth = { login, signup, logout, isAuthenticated, getUser, getToken };

    // Handle Auth0 redirect on callback.html
    if (location.pathname.endsWith("/callback.html") &&
        (location.search.includes("code=") && location.search.includes("state="))) {
      try { await client.handleRedirectCallback(); } catch (e) {
        console.error("Auth0 handleRedirectCallback failed:", e);
      }
      const target = sessionStorage.getItem("kapi.postLoginRedirect") || "apps.html";
      try { sessionStorage.removeItem("kapi.postLoginRedirect"); } catch(e){}
      try { history.replaceState({}, document.title, "/"); } catch(e){}
      location.replace(target);
    }
  }

  init();
})();

async function kapiRequireAuth(redirectTo = "login.html") {
  const wait = () => new Promise((r) => setTimeout(r, 25));
  for (let i = 0; i < 200; i++) {
    if (window.auth0Client) break; else await wait();
  }
  if (!window.auth0Client) return location.replace(redirectTo);
  const ok = await window.auth0Client.isAuthenticated();
  if (!ok) return location.replace(redirectTo);
  return true;
}
