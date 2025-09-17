
(function(){
  const KEY='kapi.theme';
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const stored = localStorage.getItem(KEY);
  const initial = stored || (prefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', initial);
  function label(t){ const el=document.getElementById('themeLabel'); if(el){ el.textContent = t==='dark' ? '🌙' : '☀️'; } }
  label(initial);
  window.kapiToggleTheme = function(){ const cur=document.documentElement.getAttribute('data-theme')||'dark'; const next=cur==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme', next); localStorage.setItem(KEY, next); label(next); };
})();
