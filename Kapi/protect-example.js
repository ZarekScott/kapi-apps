// protect-example.js — example usage on a protected page (e.g., apps.html)
document.addEventListener('DOMContentLoaded', async () => {
  await kapiRequireAuth("login.html");
  // Now you're authenticated. You can call your secured Functions with a Bearer token:
  // const token = await kapiAuth.getToken();
  // await fetch('/.netlify/functions/entitlements', {
  //   headers: { Authorization: `Bearer ${token}` }
  // });
});
