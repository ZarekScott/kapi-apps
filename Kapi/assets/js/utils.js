
export const fmt = new Intl.NumberFormat(undefined,{maximumFractionDigits:0});
export const money = v => (v==null||isNaN(v))?'—': new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
export const pct = v => (v==null||isNaN(v))?'—': (v*100).toFixed(2)+'%';
export const toNum = (el) => parseFloat((el.value||'').replace(/[,\s]/g,''))||0;
export function pmti(rate, nper, pv){ if(rate===0) return -(pv/nper); const r=rate, rn=Math.pow(1+r,nper); return -(pv*r*rn/(rn-1)); }
export const saveLS = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
export const loadLS = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
