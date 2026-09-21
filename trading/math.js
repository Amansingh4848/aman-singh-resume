(function(root){
'use strict';
const call=(s,k)=>Math.max(s-k,0),put=(s,k)=>Math.max(k-s,0);
const strategies=[
{id:'long-call',name:'Long call',legs:'Buy call 1,000 · premium 30',fn:s=>call(s,1000)-30,loss:30,gain:'Uncapped upside',breakeven:'1,030'},
{id:'long-put',name:'Long put',legs:'Buy put 1,000 · premium 30',fn:s=>put(s,1000)-30,loss:30,gain:'970 at underlying zero',breakeven:'970'},
{id:'bull-call',name:'Bull call spread',legs:'Buy call 1,000 / sell call 1,100 · net debit 30',fn:s=>call(s,1000)-call(s,1100)-30,loss:30,gain:'70',breakeven:'1,030'},
{id:'bear-put',name:'Bear put spread',legs:'Buy put 1,000 / sell put 900 · net debit 30',fn:s=>put(s,1000)-put(s,900)-30,loss:30,gain:'70',breakeven:'970'},
{id:'bull-put',name:'Bull put spread',legs:'Sell put 1,000 / buy put 900 · net credit 30',fn:s=>30-put(s,1000)+put(s,900),loss:70,gain:'30',breakeven:'970'},
{id:'bear-call',name:'Bear call spread',legs:'Sell call 1,000 / buy call 1,100 · net credit 30',fn:s=>30-call(s,1000)+call(s,1100),loss:70,gain:'30',breakeven:'1,030'},
{id:'straddle',name:'Long straddle',legs:'Buy call + put 1,000 · total premium 60',fn:s=>Math.abs(s-1000)-60,loss:60,gain:'Uncapped upside',breakeven:'940 / 1,060'},
{id:'condor',name:'Iron condor',legs:'Put wings 800 / 900 · call wings 1,100 / 1,200 · credit 30',fn:s=>30-put(s,900)+put(s,800)-call(s,1100)+call(s,1200),loss:70,gain:'30',breakeven:'870 / 1,130'},
{id:'butterfly',name:'Iron butterfly',legs:'Short call + put 1,000 · long wings 900 / 1,100 · credit 50',fn:s=>50-put(s,1000)+put(s,900)-call(s,1000)+call(s,1100),loss:50,gain:'50',breakeven:'950 / 1,050'},
{id:'covered-call',name:'Covered call',legs:'Own underlying at 1,000 / sell call 1,050 · credit 20',fn:s=>s-1000-call(s,1050)+20,loss:980,gain:'70',breakeven:'980'},
{id:'protective-put',name:'Protective put',legs:'Own underlying at 1,000 / buy put 950 · debit 20',fn:s=>s-1000+put(s,950)-20,loss:70,gain:'Uncapped upside',breakeven:'1,020'}
];
function size({capital,budget,entry,stop,friction}){if(![capital,budget,entry,stop,friction].every(Number.isFinite)||capital<=0||budget<=0||budget>capital||entry<=0||stop<0||stop>=entry||friction<0)throw Error('Use positive capital and budget, a stop below entry, and non-negative costs. Budget must not exceed capital.');const risk=entry-stop+friction,quantity=Math.min(Math.floor(budget/risk),Math.floor(capital/entry));return{risk,quantity,planned:quantity*risk,notional:quantity*entry};}
function expectancy(winRate,win,loss,cost){if(![winRate,win,loss,cost].every(Number.isFinite)||winRate<0||winRate>100||win<0||loss<0||cost<0)throw Error('Use a win rate from 0 to 100 and non-negative amounts.');return winRate/100*win-(1-winRate/100)*loss-cost;}
const api={strategies,size,expectancy};if(typeof module==='object'&&module.exports)module.exports=api;else root.TradeMath=api;
})(typeof window==='undefined'?{}:window);
