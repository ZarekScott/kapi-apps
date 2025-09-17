
import {infer, fmtMoney, fmtPct, fmtRaw} from './engine.js';

const KEY='kapi.calc.investor.v1';
let model = load();

function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch{return{}} }
function save(){ localStorage.setItem(KEY, JSON.stringify(model)); }
function num(v){ const s = typeof v==='string'? v : (v?.value??''); const n=parseFloat(String(s).replace(/[\s,]/g,'')); return isFinite(n)?n:undefined; }

function bind(id, key, isPct=false){
  const el = document.getElementById(id);
  if(model[key]!=null){ el.value = isPct ? (model[key]*100) : model[key]; }
  el.addEventListener('input', ()=>{
    const v = num(el);
    model[key] = isPct ? (v!=null? v/100 : undefined) : v;
    run();
  });
}

// Loan presets
const PRESETS = {
  'Conventional Fixed': { rate: 6.5, amortY: 30, ioY: 0, loanType: 'Amortizing' },
  'Bridge / Value-Add': { rate: 8.5, amortY: 30, ioY: 24/12, loanType: 'Amortizing' },
  'IO Only':            { rate: 8.0, amortY: 30, ioY: 12/12, loanType: 'IO Only' },
  'SBA 7(a)':           { rate: 9.0, amortY: 25, ioY: 0, loanType: 'Amortizing' },
  'SBA 504':            { rate: 7.5, amortY: 25, ioY: 0, loanType: 'Amortizing' }
};
function applyPreset(name){
  const p = PRESETS[name]; if(!p) return;
  // Keep existing price/down/ltv; set debt structure fields
  model.rate = p.rate/100; model.amortY = p.amortY; model.ioY = p.ioY; model.loanType = p.loanType;
  // Reflect in UI
  document.getElementById('rate').value = (p.rate).toFixed(2);
  document.getElementById('amortY').value = p.amortY;
  document.getElementById('ioY').value = (p.ioY*12).toFixed(0);
  document.getElementById('loanType').value = p.loanType;
  run();
}

function run(){
  const out = infer({...model});
  // lights
  const light = document.getElementById('cashLight');
  light.classList.remove('green','red','warn');
  if(out.cfadr!=null){
    if(out.cfadr>0) light.classList.add('green'); else if(out.cfadr<0) light.classList.add('red'); else light.classList.add('warn');
  }

  // Outputs
  set('oCap', out.capRate, 'pct');
  set('oNOI', out.noi, 'money');
  set('oEGI', out.egi, 'money');
  set('oVacLoss', out.vacancyLoss, 'money');
  set('oDebt', out.annualDebt, 'money');
  set('oLoan', out.loanAmt, 'money');
  set('oLTV', out.ltv, 'pct');
  set('oDSCR', out.dscr, 'raw', 2);
  set('oCoC', out.coc, 'pct');
  set('oCFADR', out.cfadr, 'money');
  set('oDebtYield', out.debtYield, 'pct');
  set('oBreakeven', out.breakevenOcc, 'pct');
  set('oDebtConst', out.debtConst, 'pct');
  set('oPPU', out.pricePerUnit, 'money');
  set('oPPSF', out.pricePerSF, 'money');
  set('oRPSF', out.rentPerSFYear, 'money');
  set('oNOISF', out.noiPerSFYear, 'money');

  save();
}

function set(id, val, kind='raw', digits=2){
  const el = document.getElementById(id); if(!el) return;
  let s='—';
  if(val!=null && isFinite(val)){
    if(kind==='money') s = fmtMoney(val);
    else if(kind==='pct') s = fmtPct(val);
    else if(kind==='raw') s = (typeof val==='number' ? val.toFixed(digits) : String(val));
    else s = String(val);
  }
  el.textContent = s;
}

window.addEventListener('DOMContentLoaded', ()=>{
  // Property context
  bind('propType','propType'); bind('leaseType','leaseType'); bind('units','units'); bind('nra','nra');

  // Income
  bind('gpr','gpr'); bind('vacancy','vacancy',true); bind('otherInc','otherInc');

  // Expenses
  bind('opexFixed','opexFixed'); bind('reserves','reserves');
  bind('taxes','taxes'); bind('ins','ins'); bind('mgmt','mgmt');
  bind('taxesPct','taxesPct',true); bind('insPct','insPct',true); bind('mgmtPct','mgmtPct',true);

  // Price & NOI
  bind('price','price'); bind('noi','noi'); bind('capRate','capRate',true);

  // Leverage
  bind('ltv','ltv',true); bind('down','down'); bind('loanAmt','loanAmt');

  // Debt
  bind('rate','rate',true); bind('amortY','amortY'); bind('ioY','ioY'); bind('loanType','loanType');

  document.getElementById('preset').addEventListener('change', (e)=> applyPreset(e.target.value));
  run();
});
