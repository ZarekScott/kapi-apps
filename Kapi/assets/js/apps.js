// assets/js/apps.js

async function fetchEntitlementsWithIdentity() {
  const status = document.getElementById("status");
  status.textContent = "Checking your purchases…";
  try {
    const user = netlifyIdentity.currentUser();
    if (!user) { netlifyIdentity.open('login'); return; }
    const token = await user.jwt();
    const res = await fetch('/.netlify/functions/entitlements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Lookup failed");
    const data = await res.json();
    status.textContent = data.products?.length
      ? `Hello ${user.email}. We found your apps.`
      : `Hello ${user.email}. No active purchases yet.`;
    render(data.products || []);
  } catch (e) {
    status.textContent = "Could not verify purchases.";
    render([]);
  }
}

// call this on page load or on button click:
document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.getElementById("fetchBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  fetchBtn.addEventListener('click', fetchEntitlementsWithIdentity);
  refreshBtn.addEventListener('click', fetchEntitlementsWithIdentity);
});

// 1) Your catalog (edit links to your real pages)
const APP_CATALOG = [
  {
    slug: "deal-calculator",
    name: "Deal Calculator",
    desc: "Analyze any deal with flexible inputs and a cash-flow signal.",
    link: "calculator_investor_grid.html" // or your deployed URL
  },
  {
    slug: "underwriting-pro",
    name: "Underwriting Pro",
    desc: "Deeper metrics, tenant/rent-roll inputs, export ready.",
    link: "underwriting.html"
  },
  {
    slug: "investor-tools",
    name: "Investor Tools Pack",
    desc: "Checklists, templates, guides",
    link: "investor_tools.html"
  },
  {
    slug: "community",
    name: "Community (Discord)",
    desc: "Private Kapi investor community & resources.",
    link: "community.html"
  }
];

function chip(text, active) {
  return `<span class="btn" style="pointer-events:none; ${active ? 'background:var(--accent);color:#fff;border-color:transparent' : ''}">${text}</span>`;
}

function card(app, unlocked) {
  return `
  <div class="kapi-card p-6">
    <h3 class="m-0" style="margin-bottom:6px">${app.name}</h3>
    <p class="muted" style="min-height:40px">${app.desc}</p>
    <div style="display:flex; gap:8px; align-items:center; margin-top:8px">
      ${unlocked ? chip('Active', true) : chip('Locked', false)}
      ${unlocked
        ? `<a class="btn primary" href="${app.link}">Open</a>`
        : `<a class="btn" href="/pricing">Get access</a>`}
    </div>
  </div>`;
}

function render(entitlements) {
  const appsGrid = document.getElementById("appsGrid");
  const unlocked = new Set(entitlements || []);
  appsGrid.innerHTML = APP_CATALOG.map(a => card(a, unlocked.has(a.slug))).join("");
}

async function fetchEntitlements(email) {
  const status = document.getElementById("status");
  status.textContent = "Checking your purchases…";
  try {
    const res = await fetch(`/.netlify/functions/entitlements?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Lookup failed");
    const data = await res.json();
    status.textContent = data.products?.length
      ? `Hello ${data.email}. We found your apps.`
      : `Hello ${data.email}. No active purchases yet.`;
    render(data.products || []);
    localStorage.setItem("kapi.lastEmail", email);
  } catch (e) {
    status.textContent = "Could not verify purchases. Double-check your email.";
    render([]);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const email = document.getElementById("email");
  const fetchBtn = document.getElementById("fetchBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const last = localStorage.getItem("kapi.lastEmail");
  if (last) email.value = last;

  fetchBtn.addEventListener('click', () => {
    if (email.value) fetchEntitlements(email.value);
  });
  refreshBtn.addEventListener('click', () => {
    if (email.value) fetchEntitlements(email.value);
  });

  if (email.value) fetchEntitlements(email.value);
});
