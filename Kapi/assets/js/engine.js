
export function pmti(rate, nper, pv){ if(rate===0) return -(pv/nper); const r=rate, rn=Math.pow(1+r,nper); return -(pv*r*rn/(rn-1)); }
const isNum = v => typeof v==='number' && isFinite(v);

export function infer(x0){
  const x = {...x0};
  // normalize
  ['vacancy','rate','capRate','ltv','taxesPct','insPct','mgmtPct'].forEach(k=>{
    if(isNum(x[k]) && x[k]>1) x[k]/=100;
  });

  for(let k=0;k<16;k++){
    // Helpers
    const other = x.otherInc||0;
    const opexFixed = x.opexFixed||0;
    const taxes = isNum(x.taxes) ? x.taxes : (isNum(x.taxesPct) && isNum(x.egi) ? x.egi * x.taxesPct : undefined);
    const ins   = isNum(x.ins)   ? x.ins   : (isNum(x.insPct)   && isNum(x.egi) ? x.egi * x.insPct   : undefined);
    const mgmt  = isNum(x.mgmt)  ? x.mgmt  : (isNum(x.mgmtPct)  && isNum(x.egi) ? x.egi * x.mgmtPct  : undefined);
    const parts = [opexFixed, taxes, ins, mgmt].filter(isNum);

    // Income
    if(isNum(x.gpr) && isNum(x.vacancy) && !isNum(x.vacancyLoss)) x.vacancyLoss = x.gpr * x.vacancy;
    if(isNum(x.gpr) && isNum(x.vacancyLoss) && !isNum(x.egi)) x.egi = x.gpr - x.vacancyLoss + other;

    // Expenses & NOI (NOI excludes reserves, as lenders do)
    if(parts.length && !isNum(x.opex)) x.opex = parts.reduce((a,b)=>a+b,0);
    if(isNum(x.egi) && isNum(x.opex) && !isNum(x.noi)) x.noi = x.egi - x.opex;

    // Price / NOI / Cap (two-of-three)
    if(isNum(x.noi) && isNum(x.capRate) && !isNum(x.price) && x.capRate>0) x.price = x.noi / x.capRate;
    if(isNum(x.noi) && isNum(x.price) && !isNum(x.capRate) && x.price>0) x.capRate = x.noi / x.price;

    // LTV / Loan / Down (any one)
    if(isNum(x.price) && isNum(x.ltv) && !isNum(x.loanAmt)) x.loanAmt = x.price * x.ltv;
    if(isNum(x.price) && isNum(x.loanAmt) && !isNum(x.ltv) && x.price>0) x.ltv = x.loanAmt / x.price;
    if(isNum(x.price) && isNum(x.loanAmt) && !isNum(x.down)) x.down = Math.max(x.price - x.loanAmt, 0);
    if(isNum(x.price) && isNum(x.down) && !isNum(x.loanAmt)) x.loanAmt = Math.max(x.price - x.down, 0);

    // Debt
    if(isNum(x.loanAmt) && isNum(x.rate)){
      let mRate = x.rate/12, nper = 0, pmt = 0;
      if(x.loanType==='IO Only'){
        pmt = x.loanAmt * mRate;
      } else {
        const amortYears = x.amortY || 30;
        nper = Math.round(amortYears*12);
        pmt = Math.abs(pmti(mRate, nper, x.loanAmt));
        if(isNum(x.ioY) && x.ioY>0) { // show first-year IO effect in annual debt
          const ioMonths = Math.min(x.ioY*12, 12);
          const mix = (ioMonths/12)*(x.loanAmt*mRate) + ((12-ioMonths)/12)*pmt;
          pmt = mix;
        }
      }
      x.annualDebt = pmt*12;
      if(isNum(x.price) && x.price>0) x.debtConst = x.annualDebt / x.price;
    }

    // Returns
    if(isNum(x.noi) && isNum(x.annualDebt) && !isNum(x.dscr) && x.annualDebt>0) x.dscr = x.noi / x.annualDebt;
    const reserves = x.reserves||0;
    if(isNum(x.noi) && isNum(x.annualDebt)) x.cfadr = x.noi - x.annualDebt - reserves;
    if(isNum(x.down) && isNum(x.cfadr) && !isNum(x.coc) && x.down>0) x.coc = x.cfadr / x.down;

    // Debt yield
    if(isNum(x.noi) && isNum(x.loanAmt) && !isNum(x.debtYield) && x.loanAmt>0) x.debtYield = x.noi / x.loanAmt;

    // Break-even occupancy (approx)
    if(isNum(x.gpr) && x.gpr>0 && isNum(x.annualDebt)){
      const opexAll = isNum(x.opex) ? x.opex : parts.reduce((a,b)=>a+b,0);
      x.breakevenOcc = Math.min(1, Math.max(0, (opexAll + reserves + x.annualDebt - other) / x.gpr));
    }

    // Per-unit / per-sf metrics
    if(isNum(x.price) && isNum(x.units) && x.units>0) x.pricePerUnit = x.price / x.units;
    if(isNum(x.price) && isNum(x.nra) && x.nra>0) x.pricePerSF = x.price / x.nra;
    if(isNum(x.gpr) && isNum(x.nra) && x.nra>0) x.rentPerSFYear = x.gpr / x.nra;
    if(isNum(x.noi) && isNum(x.nra) && x.nra>0) x.noiPerSFYear = x.noi / x.nra;
  }
  return x;
}

export const fmtMoney = v => (v==null||isNaN(v))?'—': new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
export const fmtPct = v => (v==null||isNaN(v))?'—': (v*100).toFixed(2)+'%';
export const fmtRaw = (v,d=2)=> (v==null||isNaN(v))?'—': Number(v).toFixed(d);
