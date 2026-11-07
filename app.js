const DEFAULT_WATCHLIST = ["ADBLCIT","GBIME","HIDCL","ICFC","KBL","MMF1","NBL","NLIC","PRVU","SBL","SFMF"];
const DB_KEY = "nepse_research_desk_v1";
const state = loadState();

function loadState(){
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || {watchlist:DEFAULT_WATCHLIST, rows:[]}; }
  catch { return {watchlist:DEFAULT_WATCHLIST, rows:[]}; }
}
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(state)); render(); }
function fmt(n){ return Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-IN",{maximumFractionDigits:2}) : "—"; }
function symbolRows(symbol){return state.rows.filter(r=>r.symbol===symbol).sort((a,b)=>a.date.localeCompare(b.date));}
function setTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===name));
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));

function render(){
  document.getElementById("watchCount").textContent=state.watchlist.length;
  document.getElementById("rowCount").textContent=state.rows.length.toLocaleString();
  const dates=state.rows.map(r=>r.date).sort();
  document.getElementById("latestDate").textContent=dates.at(-1)||"—";
  document.getElementById("freshness").textContent=dates.length ? "Imported data date (not live status)" : "No data imported";
  document.getElementById("symbolsText").textContent=state.watchlist.join(", ");
  const list=document.getElementById("watchlist"); list.innerHTML="";
  state.watchlist.forEach(sym=>{
    const rows=symbolRows(sym), last=rows.at(-1), prev=rows.at(-2);
    const delta=last&&prev ? ((last.close-prev.close)/prev.close*100) : null;
    const el=document.createElement("div"); el.className="stock";
    el.innerHTML=`<div><span class="symbol">${sym}</span><small>${rows.length} daily records · ${last?.date||"no data"}</small></div><div class="price">${last?fmt(last.close):"—"}<em>${delta===null?"Awaiting history":`${delta>=0?"+":""}${fmt(delta)}% vs prior row`}</em></div>`;
    list.appendChild(el);
  });
  const sel=document.getElementById("symbolSelect"), old=sel.value;
  sel.innerHTML=state.watchlist.map(s=>`<option value="${s}">${s}</option>`).join("");
  if(state.watchlist.includes(old)) sel.value=old;
  renderResearch();
}
function ema(values, period){
  if(values.length<period) return null;
  const k=2/(period+1); let v=values.slice(0,period).reduce((a,b)=>a+b,0)/period;
  for(let i=period;i<values.length;i++) v=values[i]*k+v*(1-k);
  return v;
}
function rsi(values,period=14){
  if(values.length<=period) return null;
  let gains=0,losses=0;
  for(let i=1;i<=period;i++){const d=values[i]-values[i-1]; if(d>0)gains+=d;else losses-=d;}
  let ag=gains/period, al=losses/period;
  for(let i=period+1;i<values.length;i++){const d=values[i]-values[i-1];ag=(ag*(period-1)+Math.max(d,0))/period;al=(al*(period-1)+Math.max(-d,0))/period;}
  return al===0?100:100-100/(1+ag/al);
}
function macd(values){
  const e12=ema(values,12),e26=ema(values,26);
  return e12===null||e26===null?null:e12-e26;
}
function renderResearch(){
  const sym=document.getElementById("symbolSelect").value || state.watchlist[0];
  const rows=symbolRows(sym), closes=rows.map(r=>r.close), volumes=rows.map(r=>r.volume);
  const card=document.getElementById("researchCard");
  drawChart(closes, sym);
  document.getElementById("chartCaption").textContent=rows.length?`${rows.length} imported observations · latest ${rows.at(-1).date}`:"No history available.";
  if(rows.length<50){card.innerHTML=`<strong>${sym}</strong><p class="muted">Only ${rows.length} observations. At least 50 daily closing prices are required for this initial trend screen; 200+ are preferable for long-term analysis.</p>`;return;}
  const e20=ema(closes,20),e50=ema(closes,50),e200=ema(closes,200),rv=rsi(closes),m=macd(closes);
  const avgVol=volumes.slice(-21,-1).reduce((a,b)=>a+b,0)/Math.max(1,volumes.slice(-21,-1).length);
  const vr=avgVol?volumes.at(-1)/avgVol:null;
  const trend=e20>e50&&e50>e200;
  card.innerHTML=`<strong>${sym} · Technical screen</strong>
  <div class="score-row"><span>Latest close (${rows.at(-1).date})</span><b>${fmt(closes.at(-1))}</b></div>
  <div class="score-row"><span>EMA 20 / 50 / 200</span><b>${fmt(e20)} / ${fmt(e50)} / ${e200?fmt(e200):"insufficient"}</b></div>
  <div class="score-row"><span>RSI (14)</span><b>${fmt(rv)}</b></div>
  <div class="score-row"><span>MACD line (12,26)</span><b>${fmt(m)}</b></div>
  <div class="score-row"><span>Latest / 20-day avg volume</span><b>${vr===null?"—":fmt(vr)+"x"}</b></div>
  <p class="muted">${trend?"Bullish EMA alignment detected.": "Bullish EMA alignment not detected."} ${vr!==null&&vr>=1.5?"Volume is at least 1.5x its recent average.":""}</p>
  <p class="muted small">This is a limited technical screen. MACD signal-line crossover, adjusted corporate-action prices, fundamentals, sector score and risk sizing are not yet included.</p>`;
}
document.getElementById("symbolSelect").addEventListener("change",renderResearch);

function drawChart(values,symbol){
  const c=document.getElementById("priceChart"),ctx=c.getContext("2d"),w=c.width=c.clientWidth*devicePixelRatio,h=c.height=190*devicePixelRatio;
  ctx.clearRect(0,0,w,h); if(values.length<2)return;
  const v=values.slice(-90),min=Math.min(...v),max=Math.max(...v),pad=18*devicePixelRatio;
  ctx.strokeStyle="#35516d";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();
  ctx.strokeStyle="#69b7ff";ctx.lineWidth=2*devicePixelRatio;ctx.beginPath();
  v.forEach((x,i)=>{const px=pad+i/(v.length-1)*(w-2*pad),py=h-pad-(x-min)/(max-min||1)*(h-2*pad);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();
}
function parseCSV(text){
  const lines=text.replace(/^\uFEFF/,"").trim().split(/\r?\n/);
  const headers=lines.shift().split(",").map(x=>x.trim().toLowerCase());
  const required=["date","symbol","open","high","low","close","volume"];
  const missing=required.filter(x=>!headers.includes(x)); if(missing.length)throw Error("Missing columns: "+missing.join(", "));
  return lines.filter(Boolean).map((line,i)=>{
    const cols=line.split(",");const o={};headers.forEach((h,j)=>o[h]=(cols[j]||"").trim());
    const r={date:o.date,symbol:o.symbol.toUpperCase(),open:Number(o.open),high:Number(o.high),low:Number(o.low),close:Number(o.close),volume:Number(o.volume),source:o.source||"User-imported CSV"};
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!state.watchlist.includes(r.symbol)||![r.open,r.high,r.low,r.close,r.volume].every(Number.isFinite)||r.close<=0||r.volume<0)throw Error(`Invalid row ${i+2}: check date, watchlist symbol and numeric OHLCV values.`);
    if(r.high<Math.max(r.open,r.close,r.low)||r.low>Math.min(r.open,r.close,r.high))throw Error(`Invalid high/low on row ${i+2}.`);
    return r;
  });
}
document.getElementById("importBtn").addEventListener("click",async()=>{
  const f=document.getElementById("csvFile").files[0],status=document.getElementById("importStatus");
  if(!f){status.textContent="Choose a CSV file first.";return;}
  try{
    const incoming=parseCSV(await f.text()),map=new Map(state.rows.map(r=>[r.symbol+"|"+r.date,r]));
    incoming.forEach(r=>map.set(r.symbol+"|"+r.date,r));
    state.rows=Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date)||a.symbol.localeCompare(b.symbol));
    save();status.textContent=`Imported ${incoming.length} rows. Duplicate symbol/date rows were replaced.`;
  }catch(e){status.textContent="Import failed: "+e.message;}
});
document.getElementById("editWatch").addEventListener("click",()=>{
  const raw=prompt("Enter 10–20 comma-separated NEPSE symbols:",state.watchlist.join(","));
  if(raw===null)return;
  const symbols=[...new Set(raw.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean))];
  if(symbols.length<10||symbols.length>20){alert("Please enter 10–20 unique symbols.");return;}
  state.watchlist=symbols;state.rows=state.rows.filter(r=>symbols.includes(r.symbol));save();
});
document.getElementById("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="nepse-research-backup.json";a.click();URL.revokeObjectURL(url);
});
document.getElementById("clearBtn").addEventListener("click",()=>{
  if(confirm("Permanently delete all locally stored watchlist and price data from this browser?")){localStorage.removeItem(DB_KEY);location.reload();}
});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();