
(function(){
  // --- ENGINE ---
  function pmti(rate, nper, pv){ if(rate===0) return -(pv/nper); const r=rate, rn=Math.pow(1+r,nper); return -(pv*r*rn/(rn-1)); }
  const isNum = v => typeof v==='number' && isFinite(v);
  function infer(x0){
    const x = {...x0};
    ['vacancy','rate','capRate','ltv','taxesPct','insPct','mgmtPct'].forEach(k=>{
      if(isNum(x[k]) && x[k]>1) x[k]/=100;
    });
    for(let k=0;k<16;k++){
      const other = x.otherInc||0;
      const opexFixed = x.opexFixed||0;
      const taxes = isNum(x.taxes) ? x.taxes : (isNum(x.taxesPct) && isNum(x.egi) ? x.egi * x.taxesPct : undefined);
      const ins   = isNum(x.ins)   ? x.ins   : (isNum(x.insPct)   && isNum(x.egi) ? x.egi * x.insPct   : undefined);
      const mgmt  = isNum(x.mgmt)  ? x.mgmt  : (isNum(x.mgmtPct)  && isNum(x.egi) ? x.egi * x.mgmtPct  : undefined);
      const parts = [opexFixed, taxes, ins, mgmt].filter(isNum);
      if(isNum(x.gpr) && isNum(x.vacancy) && !isNum(x.vacancyLoss)) x.vacancyLoss = x.gpr * x.vacancy;
      if(isNum(x.gpr) && isNum(x.vacancyLoss) && !isNum(x.egi)) x.egi = x.gpr - x.vacancyLoss + other;
      if(parts.length && !isNum(x.opex)) x.opex = parts.reduce((a,b)=>a+b,0);
      if(isNum(x.egi) && isNum(x.opex) && !isNum(x.noi)) x.noi = x.egi - x.opex;
      if(isNum(x.noi) && isNum(x.capRate) && !isNum(x.price) && x.capRate>0) x.price = x.noi / x.capRate;
      if(isNum(x.noi) && isNum(x.price) && !isNum(x.capRate) && x.price>0) x.capRate = x.noi / x.price;
      if(isNum(x.price) && isNum(x.ltv) && !isNum(x.loanAmt)) x.loanAmt = x.price * x.ltv;
      if(isNum(x.price) && isNum(x.loanAmt) && !isNum(x.ltv) && x.price>0) x.ltv = x.loanAmt / x.price;
      if(isNum(x.price) && isNum(x.loanAmt) && !isNum(x.down)) x.down = Math.max(x.price - x.loanAmt, 0);
      if(isNum(x.price) && isNum(x.down) && !isNum(x.loanAmt)) x.loanAmt = Math.max(x.price - x.down, 0);
      if(isNum(x.loanAmt) && isNum(x.rate)){
        let mRate = x.rate/12, nper = 0, pmt = 0;
        if(x.loanType==='IO Only'){ pmt = x.loanAmt * mRate; }
        else {
          const amortYears = x.amortY || 30;
          nper = Math.round(amortYears*12);
          pmt = Math.abs(pmti(mRate, nper, x.loanAmt));
          if(isNum(x.ioY) && x.ioY>0) {
            const ioMonths = Math.min(x.ioY*12, 12);
            const mix = (ioMonths/12)*(x.loanAmt*mRate) + ((12-ioMonths)/12)*pmt;
            pmt = mix;
          }
        }
        x.annualDebt = pmt*12;
        if(isNum(x.price) && x.price>0) x.debtConst = x.annualDebt / x.price;
      }
      if(isNum(x.noi) && isNum(x.annualDebt) && !isNum(x.dscr) && x.annualDebt>0) x.dscr = x.noi / x.annualDebt;
      const reserves = x.reserves||0;
      if(isNum(x.noi) && isNum(x.annualDebt)) x.cfadr = x.noi - x.annualDebt - reserves;
      if(isNum(x.down) && isNum(x.cfadr) && !isNum(x.coc) && x.down>0) x.coc = x.cfadr / x.down;
      if(isNum(x.noi) && isNum(x.loanAmt) && !isNum(x.debtYield) && x.loanAmt>0) x.debtYield = x.noi / x.loanAmt;
      if(isNum(x.gpr) && x.gpr>0 && isNum(x.annualDebt)){
        const opexAll = isNum(x.opex) ? x.opex : parts.reduce((a,b)=>a+b,0);
        x.breakevenOcc = Math.min(1, Math.max(0, (opexAll + reserves + x.annualDebt - other) / x.gpr));
      }
      if(isNum(x.price) && isNum(x.units) && x.units>0) x.pricePerUnit = x.price / x.units;
      if(isNum(x.price) && isNum(x.nra) && x.nra>0) x.pricePerSF = x.price / x.nra;
      if(isNum(x.gpr) && isNum(x.nra) && x.nra>0) x.rentPerSFYear = x.gpr / x.nra;
      if(isNum(x.noi) && isNum(x.nra) && x.nra>0) x.noiPerSFYear = x.noi / x.nra;
    }
    return x;
  }

  // --- APP ---
  const KEY='kapi.calc.investor.bundle.v1';
  let model = load();
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch{return{}} }
  function save(){ localStorage.setItem(KEY, JSON.stringify(model)); }
  function num(v){ const s = typeof v==='string'? v : (v?.value??''); const n=parseFloat(String(s).replace(/[\s,]/g,'')); return isFinite(n)?n:undefined; }
  function bind(id, key, isPct=false){
    const el = document.getElementById(id);
    if(!el) return;
    if(model[key]!=null){ el.value = isPct ? (model[key]*100) : model[key]; }
    el.addEventListener('input', ()=>{
      const v = num(el);
      model[key] = isPct ? (v!=null? v/100 : undefined) : v;
      run(false);
    });
  }
  const PRESETS = {
    'Conventional Fixed': { rate: 6.5, amortY: 30, ioY: 0, loanType: 'Amortizing' },
    'Bridge / Value-Add': { rate: 8.5, amortY: 30, ioY: 24/12, loanType: 'Amortizing' },
    'IO Only':            { rate: 8.0, amortY: 30, ioY: 12/12, loanType: 'IO Only' },
    'SBA 7(a)':           { rate: 9.0, amortY: 25, ioY: 0, loanType: 'Amortizing' },
    'SBA 504':            { rate: 7.5, amortY: 25, ioY: 0, loanType: 'Amortizing' }
  };
  function applyPreset(name){
    const p = PRESETS[name]; if(!p) return;
    model.rate = p.rate/100; model.amortY = p.amortY; model.ioY = p.ioY; model.loanType = p.loanType;
    document.getElementById('rate').value = (p.rate).toFixed(2);
    document.getElementById('amortY').value = p.amortY;
    document.getElementById('ioY').value = (p.ioY*12).toFixed(0);
    document.getElementById('loanType').value = p.loanType;
    run(false);
  }
  function set(id, val, kind='raw', digits=2){
    const el = document.getElementById(id); if(!el) return;
    let s='—';
    if(val!=null && isFinite(val)){
      if(kind==='money') s = (new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0})).format(val);
      else if(kind==='pct') s = (val*100).toFixed(2)+'%';
      else if(kind==='raw') s = (typeof val==='number' ? val.toFixed(digits) : String(val));
      else s = String(val);
    }
    el.textContent = s;
  }
  function run(showToast=true){
    const out = infer({...model});
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
    const light = document.getElementById('cashLight');
    if(light){
      light.classList.remove('green','red','warn');
      const toast = document.getElementById('toast');
      if(out.cfadr!=null){
        let good = out.cfadr > 0, bad = out.cfadr < 0;
        light.classList.add(good?'green':(bad?'red':'warn'));
        if(showToast && toast){
          toast.textContent = good ? '✅ Cash-flow positive after debt & reserves.' :
                              (bad ? '❌ Not cash-flowing after debt & reserves.' : '⚠️ Break-even cash flow.');
          toast.classList.toggle('bad', bad);
          toast.classList.add('show');
          setTimeout(()=> toast.classList.remove('show'), 2500);
        }
      }
    }
    save();
  }
  window.addEventListener('DOMContentLoaded', ()=>{
    ['propType','leaseType','units','nra','gpr','vacancy','otherInc','opexFixed','reserves','taxes','ins','mgmt','taxesPct','insPct','mgmtPct','price','noi','capRate','ltv','down','loanAmt','rate','amortY','ioY','loanType'].forEach(id=>{
      const isPct = ['vacancy','capRate','ltv','taxesPct','insPct','mgmtPct','rate'].includes(id);
      bind(id,id,isPct);
    });
    const presetSel = document.getElementById('preset');
    if(presetSel) presetSel.addEventListener('change', (e)=> applyPreset(e.target.value));
    const btn = document.getElementById('checkCF');
    if(btn) btn.addEventListener('click', ()=> run(true));
    run(false);
  });
})();
