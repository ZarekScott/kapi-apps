
(function(){
  function apply(t){
    if(t==='light') document.body.setAttribute('data-theme','light');
    else document.body.removeAttribute('data-theme');
    try{ localStorage.setItem('kapi.theme', t);}catch(e){}
    var el = document.getElementById('themeLabel'); if(el) el.textContent = (t==='light'?'🌞':'🌙');
  }
  window.toggleTheme = function(){
    var light = !document.body.hasAttribute('data-theme'); apply(light?'light':'dark');
  };
  var t = (localStorage.getItem('kapi.theme') || 'dark'); apply(t);
})();
