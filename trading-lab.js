/* Fixed teaching examples only: no market connection, signals, or price forecasts. */
(() => {
  'use strict';
  function intrinsic(spot,strike){return {call:Math.max(spot-strike,0),put:Math.max(strike-spot,0)};}
  function moneyness(spot,strike){return {call:spot===strike?'At the money':spot>strike?'In the money':'Out of the money',put:spot===strike?'At the money':spot<strike?'In the money':'Out of the money'};}
  const patterns={
    range:{title:'Range & breakout',tag:'01 / RANGE & BREAKOUT',desc:'Illustrative price swings between support and resistance. A dashed extension shows one possible outcome, not a forecast.',price:'M55 200 100 105 145 250 195 108 245 252 295 102 345 240 390 108 440 240 490 140',future:'M490 140 530 85 565 100 605 60',guide:'M55 100H565M55 255H565',zone:'M55 100H555V255H55Z',dot:[490,140],label:'RESISTANCE ZONE',labelTwo:'SUPPORT ZONE',copy:'Price has repeatedly turned near an upper resistance area and a lower support area. A move beyond the range may continue, or quickly return inside it.',context:'Compare several touches, closing prices, volume and the broader trend. Support and resistance are areas, not exact barriers.',failure:'A brief move above resistance can reverse into the range. A breakout alone is not confirmation of a lasting trend.'},
    double:{title:'Double top',tag:'02 / DOUBLE TOP',desc:'Two similar peaks, separated by a trough, form an M-like shape after a rise. A dashed path illustrates a possible neckline break, not a prediction.',price:'M55 280 95 230 140 180 185 100 215 125 260 210 290 183 345 103 380 125 420 185 460 207',future:'M460 207 490 250 535 215 605 285',guide:'M150 100H415M160 210H575',zone:'M160 96H405V110H160ZM160 206H575V217H160Z',dot:[460,207],label:'TWO SIMILAR HIGHS',labelTwo:'NECKLINE = INTERVENING LOW',copy:'Two peaks near a similar level can suggest a potential reversal after an advance. The low between the peaks is often called the neckline.',context:'A potential double top is incomplete without a meaningful break below the neckline. Study the preceding trend and volume; the shape alone is insufficient.',failure:'Price may hold above the neckline or break upward through the peaks. Even a neckline break can reverse; no downside target is assured.'},
    triangle:{title:'Ascending triangle',tag:'03 / ASCENDING TRIANGLE',desc:'Rising lows approach a broadly horizontal resistance area. The dashed extension is one possible upside break, but a downside break is also possible.',price:'M55 277 100 105 155 249 205 103 265 213 315 106 360 182 400 105 440 154 470 115',future:'M470 115 515 68 550 101 605 55',guide:'M75 100H575M55 280 530 113',zone:'M55 280 530 100H55Z',dot:[470,115],label:'BROADLY FLAT RESISTANCE',labelTwo:'RISING LOWS / COMPRESSION',copy:'Rising lows approach a broadly horizontal resistance area. The narrowing space shows compression, not certainty about the next move.',context:'Compare the number and quality of touches, the surrounding trend and whether a break holds. An upside resolution is only one possibility.',failure:'Price can break below the rising support line or return after a brief upside break. Compression is not a guarantee of bullish continuation.'}
  };
  // Export pure learning calculations for regression tests without browser globals.
  if(typeof module!=='undefined'&&module.exports)module.exports={intrinsic,moneyness,patterns};
  if(typeof document==='undefined')return;
  function init(scope=document){
  const $=selector=>scope.querySelector(selector),all=selector=>[...scope.querySelectorAll(selector)];
  const panel=$('.candle-panel');if(panel?.dataset.initialized)return;if(panel)panel.dataset.initialized='true';
  const select=(buttons,active)=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button===active)));
  const candleButtons=all('[data-candle]');
  candleButtons.forEach(button=>button.addEventListener('click',()=>{
    const up=button.dataset.candle==='up';select(candleButtons,button);$('.candle-panel').dataset.candleKind=up?'up':'down';
    $('[data-upper-label]').textContent=up?'CLOSE':'OPEN';$('[data-lower-label]').textContent=up?'OPEN':'CLOSE';
    $('[data-open-value]').textContent=up?'100':'106';$('[data-close-value]').textContent=up?'106':'100';
    $('#candle-svg-title').textContent=up?'Up candle: open 100, high 110, low 96, close 106':'Down candle: open 106, high 110, low 96, close 100';
    $('[data-candle-summary]').textContent=up?'Close 106 is above open 100: the price rose during this interval. This says nothing certain about the next interval.':'Close 100 is below open 106: the price fell during this interval. This says nothing certain about the next interval.';
  }));
  const patternButtons=all('[data-pattern]');let drawFrame=0;
  patternButtons.forEach(button=>button.addEventListener('click',()=>{
    const p=patterns[button.dataset.pattern];if(!p)return;select(patternButtons,button);
    for(const key of ['title','tag','copy','context','failure'])$('[data-pattern-'+key+']').textContent=p[key];
    for(const key of ['price','future','guide','zone'])$('[data-pattern-'+key+']').setAttribute('d',p[key]);
    $('[data-pattern-dot]').setAttribute('cx',p.dot[0]);$('[data-pattern-dot]').setAttribute('cy',p.dot[1]);
    $('[data-pattern-label]').textContent=p.label;$('[data-pattern-label-two]').textContent=p.labelTwo;
    $('[data-pattern-label-two]').setAttribute('y',button.dataset.pattern==='double'?'233':'295');
    $('#pattern-svg-title').textContent=p.title+' — illustrative example';$('#pattern-svg-desc').textContent=p.desc;
    const path=$('[data-pattern-price]');path.classList.remove('is-drawing');cancelAnimationFrame(drawFrame);
    drawFrame=requestAnimationFrame(()=>{drawFrame=requestAnimationFrame(()=>{if(document.documentElement.dataset.motion!=='off')path.classList.add('is-drawing');});});
  }));
  const number=new Intl.NumberFormat('en-IN'),strikeButtons=all('[data-strike]');
  strikeButtons.forEach(button=>button.addEventListener('click',()=>{
    const strike=Number(button.dataset.strike);if(![23900,23950,24000,24050,24100].includes(strike))return;
    select(strikeButtons,button);all('[data-strike-row]').forEach(row=>row.classList.toggle('selected-strike',Number(row.dataset.strikeRow)===strike));
    const value=intrinsic(24000,strike),money=moneyness(24000,strike);$('[data-selected-strike]').textContent=number.format(strike);
    for(const side of ['call','put']){$('[data-'+side+'-money]').textContent=money[side];$('[data-'+side+'-intrinsic]').textContent='Intrinsic value: '+number.format(value[side])+' points';}
  }));
  const fields={
    strike:{title:'Strike & expiry: identify the contract.',copy:'The strike is the contract’s reference price. Expiry is when it ends. Compare calls and puts for the same expiry. At a 24,000 index level, the 24,000 strike is at the money; lower strikes have positive call intrinsic value, and higher strikes have positive put intrinsic value.'},
    premium:{title:'Premium: the option’s price, not the index level.',copy:'Premium includes intrinsic value and time value. Call intrinsic value is max(index − strike, 0); put intrinsic value is max(strike − index, 0). An in-the-money option is not automatically profitable. Actual cash outlay also depends on lot size and costs. A last-traded price may differ from the current bid and ask.'},
    oi:{title:'Open interest: participation, not a directional verdict.',copy:'OI counts outstanding contracts; each has a buyer and a seller. Volume counts contracts traded during a period. High call OI does not prove the index will fall, and high put OI does not guarantee support. Read changes alongside price, liquidity and the broader context—not as a standalone signal.'},
    iv:{title:'Implied volatility: uncertainty priced into options.',copy:'IV is inferred from an option’s market price through a pricing model. It reflects priced-in variability, not the direction of the next move. Higher IV generally increases a bought option’s theoretical value, all else equal; falling IV can hurt it. The fixed 18% figures here are teaching placeholders, not market observations.'}
  };
  const fieldButtons=all('[data-chain]');fieldButtons.forEach(button=>button.addEventListener('click',()=>{
    const field=fields[button.dataset.chain];if(!field)return;select(fieldButtons,button);$('.option-lab').dataset.chainField=button.dataset.chain;
    $('[data-field-title]').textContent=field.title;$('[data-field-copy]').textContent=field.copy;
  }));
  }
  window.TradeLab={init};init();
})();
