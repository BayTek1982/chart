// Alarme: Preis-Alarme (beliebige Coins) und Alarme auf gezeichneten Linien – laufen, solange die Seite offen ist
(function(){
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let A=ld("blcAlarms",[]),LOG=ld("blcAlarmLog",[]),last={},lastD={},form=null,reg=null;
const saveA=()=>sv("blcAlarms",A),saveL=()=>sv("blcAlarmLog",LOG.slice(0,50));
const COND={x:"kreuzt",up:"steigt über",dn:"fällt unter"};
const F=v=>CC.fmt(v);
// Service Worker: nötig für Benachrichtigungen am Handy (Android) und für „App installieren“
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").then(r=>{reg=r}).catch(()=>{});
async function perm(){if(!("Notification"in window))return false;if(Notification.permission==="granted")return true;if(Notification.permission==="denied")return false;try{return(await Notification.requestPermission())==="granted"}catch(e){return false}}
function beep(){try{const c=new(window.AudioContext||window.webkitAudioContext)();[0,.18,.36].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=[880,1175,1568][i];o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.0001,c.currentTime+t);g.gain.exponentialRampToValueAtTime(.25,c.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+.16);o.start(c.currentTime+t);o.stop(c.currentTime+t+.18)})}catch(e){}}
function fire(title,body,sym){LOG.unshift({t:Date.now(),title,body});saveL();beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
  toast("🔔 "+title+" – "+body);
  if("Notification"in window&&Notification.permission==="granted"){const o={body,icon:"icons/chart-192.png",badge:"icons/chart-192.png",tag:"al"+Date.now(),data:{sym}};
    if(reg&&reg.showNotification)reg.showNotification(title,o).catch(()=>{});else try{new Notification(title,o)}catch(e){}}
  if(open())draw()}
const hit=(c,p0,p1,lv)=>p0!=null&&(c==="up"?p0<lv&&p1>=lv:c==="dn"?p0>lv&&p1<=lv:(p0<lv&&p1>=lv)||(p0>lv&&p1<=lv));
function check(sym,p){if(!(p>0))return;const p0=last[sym];last[sym]=p;
  for(const a of A){if(!a.on||a.sym!==sym)continue;if(hit(a.c,p0,p,a.p)){fire(`${sym} ${COND[a.c]} ${F(a.p)}`,`Kurs ${F(p)} $${a.note?" · "+a.note:""}`,sym);if(a.once)a.on=false;a.hits=(a.hits||0)+1;saveA()}}}
// Linien-Alarme (Trendlinie, horizontale Linie, Strahl) des geöffneten Coins
function lineVal(d,t){const p=d.pts;if(d.type==="hl"||d.type==="ray")return p[0].p;if(d.type==="tl"&&p[1]&&p[1].t!==p[0].t)return p[0].p+(p[1].p-p[0].p)*(t-p[0].t)/(p[1].t-p[0].t);return null}
function checkLines(p,t){for(const d of S.dw||[]){if(!d.alarm)continue;const v=lineVal(d,t);if(v==null)continue;const k=S.sym+d.id,p0=lastD[k];lastD[k]=p;
  if(p0!=null&&hit("x",p0,p,v)&&!(d._alT&&Date.now()-d._alT<60000)){d._alT=Date.now();const nm={tl:"Trendlinie",hl:"Horizontale Linie",ray:"Strahl"}[d.type];fire(`${S.sym}: ${nm} gekreuzt`,`Kurs ${F(p)} $ · Linie ${F(v)} $`,S.sym);if(d.alarmOnce){d.alarm=false;try{saveDw()}catch(e){}}}}}
// Kurse: aktueller Coin jede Sekunde (Live-Verbindung), alle anderen Alarm-Coins alle 10 Sekunden
setInterval(()=>{if(!S.kO||!S.kO.length)return;const q=S.kO[S.kO.length-1];if(S.mkt!=="k")return;check(S.sym,q.c);checkLines(q.c,Date.now())},1000);
async function poll(){const syms=[...new Set(A.filter(a=>a.on&&a.sym!==S.sym).map(a=>a.sym))];if(!syms.length)return;
  try{if(S.ex==="okx"){const j=await getJSON("https://www.okx.com/api/v5/market/tickers?instType=SWAP",10000);for(const x of j.data||[]){const s=x.instId.replace(/-USDT-SWAP$/,"");if(syms.includes(s))check(s,+x.last)}}
    else{const j=await getJSON(`https://data-api.binance.vision/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(syms.map(s=>s+"USDT")))}`,10000);for(const x of j||[])check(x.symbol.replace(/USDT$/,""),+x.price)}}catch(e){}}
setInterval(poll,10000);
// ---------- Fenster ----------
const open=()=>!$("side").hidden&&!$("alBody").hidden;
function draw(){const b=$("alBody");if(!b)return;const cur=S.kO&&S.kO.length?S.kO[S.kO.length-1].c:0,np="Notification"in window?Notification.permission:"x";
  let h=`<div class="alTop"><button class="btn" data-a="neu">＋ Neuer Alarm</button><span class="alSt">${A.filter(a=>a.on).length} aktiv</span></div>`;
  if(np!=="granted")h+=`<div class="alHint">${np==="denied"?"Benachrichtigungen sind für diese Seite blockiert. In den Browser-Einstellungen für chart.kompassapps.de erlauben – bis dahin kommen Alarme nur als Ton und Hinweis auf der Seite.":`<button class="btn ghost" data-a="perm">🔔 Benachrichtigungen erlauben</button>`}</div>`;
  if(form){h+=`<div class="alForm"><label>Coin <input id="alSym" value="${esc(form.sym)}" autocomplete="off"></label>
    <label>Bedingung <select id="alC">${Object.entries(COND).map(([k,t])=>`<option value="${k}" ${form.c===k?"selected":""}>${t}</option>`).join("")}</select></label>
    <label>Preis (USDT) <input id="alP" type="number" step="any" inputmode="decimal" value="${form.p}"></label>
    <label>Notiz <input id="alN" value="${esc(form.note||"")}" placeholder="optional"></label>
    <label class="chk"><input type="checkbox" id="alO" ${form.once?"checked":""}> nur einmal auslösen</label>
    <div class="row"><button class="btn" data-a="save">Speichern</button><button class="btn ghost" data-a="abbr">Abbrechen</button></div></div>`}
  h+=`<div class="alL">`;if(!A.length)h+=`<p class="wlE">Noch keine Preis-Alarme. Tipp: Auch auf eine gezeichnete Linie kannst du einen Alarm legen – Linie antippen, dann „🔔 Alarm“.</p>`;
  A.forEach((a,i)=>{const dist=a.sym===S.sym&&cur?((a.p/cur-1)*100):null;h+=`<div class="alR${a.on?"":" off"}"><label class="sw"><input type="checkbox" data-on="${i}" ${a.on?"checked":""}></label>
    <div class="tx"><b>${esc(a.sym)}</b> ${COND[a.c]} <b>${F(a.p)}</b>${dist!=null?` <small>(${dist>=0?"+":""}${dist.toFixed(2).replace(".",",")} %)</small>`:""}${a.note?`<small> · ${esc(a.note)}</small>`:""}<small>${a.once?" · einmal":" · jedes Mal"}${a.hits?` · ${a.hits}× ausgelöst`:""}</small></div>
    <button data-ed="${i}" title="Bearbeiten">✎</button><button data-rm="${i}" title="Löschen">✕</button></div>`});
  const dl=(S.dw||[]).filter(d=>d.alarm);if(dl.length)h+=`<div class="wlSec">Linien-Alarme ${esc(S.sym)}</div>`+dl.map(d=>`<div class="alR"><div class="tx">${{tl:"Trendlinie",hl:"Horizontale Linie",ray:"Strahl"}[d.type]} bei <b>${F(lineVal(d,Date.now()))}</b></div><button data-dl="${d.id}" title="Alarm entfernen">✕</button></div>`).join("");
  h+=`</div>`;
  if(LOG.length)h+=`<div class="wlSec">Zuletzt ausgelöst</div>`+LOG.slice(0,8).map(l=>`<div class="alLog"><small>${new Date(l.t).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</small> ${esc(l.title)} <small>${esc(l.body)}</small></div>`).join("")+`<button class="btn ghost" data-a="logdel" style="margin-top:6px">Verlauf leeren</button>`;
  h+=`<p class="wlE">Alarme laufen, solange die Seite (oder die App) geöffnet ist – auch im Hintergrund-Tab. Ganz geschlossen gibt es keine Meldung; dafür bräuchte es einen Server.</p>`;
  b.innerHTML=h}
function setup(){const b=$("alBody");
  b.addEventListener("click",async e=>{const t=e.target.closest("button,input[type=checkbox]");if(!t)return;const d=t.dataset,cur=S.kO&&S.kO.length?S.kO[S.kO.length-1].c:0;
    if(d.a==="neu"){form={sym:S.sym,c:"x",p:cur?+cur.toPrecision(6):"",once:true,note:""};perm()}
    if(d.a==="perm"){await perm()}
    if(d.a==="abbr")form=null;
    if(d.a==="save"){const sym=$("alSym").value.trim().toUpperCase().replace(/^[A-Z]+:/,"").replace(/(USDT)?(\.P)?$/,""),p=parseFloat(String($("alP").value).replace(",","."));
      if(!sym||!(p>0)){toast("Bitte Coin und Preis angeben");return}const o={id:form.id||Date.now(),sym,c:$("alC").value,p,note:$("alN").value.trim(),once:$("alO").checked,on:true};
      if(form.i!=null)A[form.i]=Object.assign(A[form.i],o);else A.push(o);saveA();form=null;toast("Alarm gespeichert")}
    if(d.a==="logdel"){LOG=[];saveL()}
    if(d.on!=null){A[+d.on].on=t.checked;saveA()}
    if(d.rm!=null){A.splice(+d.rm,1);saveA()}
    if(d.ed!=null){const a=A[+d.ed];form={...a,i:+d.ed}}
    if(d.dl!=null){const x=(S.dw||[]).find(z=>String(z.id)===d.dl);if(x){x.alarm=false;try{saveDw()}catch(_){}}}
    draw()})}
window.alShow=()=>{draw()};window.alPerm=perm;
// Alarm direkt am Preis anlegen (aus der Linien-Leiste)
window.alNew=p=>{form={sym:S.sym,c:"x",p:+(+p).toPrecision(6),once:true,note:""};if(open())draw();else showSide("al");perm()};
setup();
})();
