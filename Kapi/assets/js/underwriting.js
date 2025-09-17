
import {fmt, money, pct, toNum, pmti, saveLS, loadLS} from './utils.js';
const rollKey = 'kapi.roll.v1';
let rows = loadLS(rollKey, []);

function recalc(){
  let annualBase = 0, units = 0;
  rows.forEach(r=>{ const monthly = parseFloat(r.base||0); annualBase += monthly * 12; units += 1; });
  const vacancyPct = toNum(document.getElementById('vacancy'))/100;
  const otherInc = toNum(document.getElementById('otherIncome'));
  const opex = toNum(document.getElementById('opex'));
  const reserves = toNum(document.getElementById('reserves'));
  const egi = (annualBase + otherInc) * (1 - vacancyPct);
  const noi = egi - opex - reserves;
  const price = toNum(document.getElementById('price'));
  const down = toNum(document.getElementById('down'));
  const cap = price>0 ? noi/price : 0;
  const rate = toNum(document.getElementById('rate'))/100/12;
  const amort = parseInt(document.getElementById('amort').value||'30',10)*12;
  const loanAmt = Math.max(price - down, 0);
  const pmt = Math.abs(pmti(rate, amort, loanAmt));
  const annualDebt = pmt*12;
  const dscr = annualDebt>0 ? noi/annualDebt : 0;
  const coc = down>0 ? (noi-annualDebt)/down : 0;
  setText('sumUnits', units); setText('sumBase', money(annualBase)); setText('sumEGI', money(egi)); setText('sumNOI', money(noi));
  setText('sumCap', pct(cap)); setText('sumDebt', money(annualDebt)); setText('sumDSCR', dscr.toFixed(2)); setText('sumCoC', pct(coc));
  saveLS(rollKey, rows);
}
function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent = v; }
function renderTable(){
  const tbody = document.querySelector('#roll tbody'); tbody.innerHTML = '';
  rows.forEach((r,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="input small" value="${r.tenant||''}" data-i="${i}" data-k="tenant"></td>
      <td><input class="input small" value="${r.unit||''}" data-i="${i}" data-k="unit" style="max-width:80px"></td>
      <td><select class="input small" data-i="${i}" data-k="lease">
            <option ${r.lease==='NNN'?'selected':''}>NNN</option>
            <option ${r.lease==='MG'?'selected':''}>MG</option>
            <option ${r.lease==='Gross'?'selected':''}>Gross</option>
          </select></td>
      <td><input class="input small" value="${r.sqft||''}" data-i="${i}" data-k="sqft" style="max-width:90px"></td>
      <td><input class="input small" value="${r.base||''}" data-i="${i}" data-k="base" style="max-width:110px"></td>
      <td><input class="input small" value="${r.start||''}" data-i="${i}" data-k="start" placeholder="YYYY-MM-DD" style="max-width:130px"></td>
      <td><input class="input small" value="${r.end||''}" data-i="${i}" data-k="end" placeholder="YYYY-MM-DD" style="max-width:130px"></td>
      <td><button class="btn" data-del="${i}">✕</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('input,select').forEach(el=>{
    el.addEventListener('input', ()=>{ const i=parseInt(el.dataset.i,10), k=el.dataset.k; rows[i][k] = el.value; recalc(); });
  });
  tbody.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const i=parseInt(btn.getAttribute('data-del'),10); rows.splice(i,1); renderTable(); recalc(); });
  });
}
function addRow(){ rows.push({tenant:'', unit:'', lease:'NNN', sqft:'', base:'', start:'', end:''}); renderTable(); recalc(); }
function exportCSV(){
  const headers = ['Tenant','Unit','Lease','SqFt','BaseRent(Mo)','Start','End'];
  const lines = [headers.join(',')];
  rows.forEach(r=>{ const vals=[r.tenant,r.unit,r.lease,r.sqft,r.base,r.start,r.end].map(v=>`"${String(v??'').replace(/"/g,'""')}"`); lines.push(vals.join(',')); });
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='kapi_rent_roll.csv'; a.click();
}
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('addRow').addEventListener('click', addRow);
  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.querySelectorAll('#inputs input, #inputs select').forEach(el=> el.addEventListener('input', recalc));
  renderTable(); recalc();
});
