// Alarme: Preis-Alarme (beliebige Coins) und Alarme auf gezeichneten Linien – laufen, solange die Seite offen ist
(function(){
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// Bedingungen: Ereignis (kreuzt …) oder Zustand (größer/kleiner, Bewegung in %, Tagesänderung bei Listen-Alarmen)
const COND={x:"kreuzt",up:"steigt über",dn:"fällt unter",gt:"ist größer als",lt:"ist kleiner als",mv:"bewegt sich um … %"};
const LCOND={chgU:"Tagesänderung steigt über … %",chgD:"Tagesänderung fällt unter −… %",mv:"bewegt sich um … %"};
const TRIG={once:"Nur einmal",every:"Jedes Mal",bar:"Einmal pro Kerze",close:"Bei Kerzenschluss"};
const ATF={"1m":6e4,"5m":3e5,"15m":9e5,"1h":36e5,"4h":144e5,"1d":864e5},ATFL={"1m":"1m","5m":"5m","15m":"15m","1h":"1H","4h":"4H","1d":"1D"},DIR={any:"egal wohin",up:"nach oben",dn:"nach unten"};
// gespeicherte Alarme prüfen (auch aus einer Sicherung): nur bekannte Felder mit gültigen Werten
function okA(a){if(!a||typeof a!=="object")return null;const n=v=>typeof v==="number"&&isFinite(v),o={id:n(a.id)?a.id:Date.now()+Math.random(),on:a.on!==false&&a.on!==0,note:typeof a.note==="string"?a.note.slice(0,80):"",hits:n(a.hits)?a.hits:0};
  if(typeof a.lst==="string"&&a.lst.trim())o.lst=a.lst.slice(0,60);else if(typeof a.sym==="string"&&/^[A-Z0-9]{1,20}$/.test(a.sym))o.sym=a.sym;else return null;
  o.c=(o.lst?LCOND:COND)[a.c]?a.c:(o.lst?"chgU":"x");o.p=n(+a.p)?+a.p:0;
  o.trig=TRIG[a.trig]?a.trig:(a.once===false?"every":"once");o.once=o.trig==="once";o.tf=ATF[a.tf]?a.tf:"15m";
  if(n(a.exp)&&a.exp>0)o.exp=a.exp;o.min=n(+a.min)&&+a.min>0?Math.min(1440,+a.min):15;o.dir=DIR[a.dir]?a.dir:"any";
  if(Array.isArray(a.more)){const m=a.more.filter(m=>m&&(m.c==="gt"||m.c==="lt")&&n(+m.p)&&+m.p>0).slice(0,3).map(m=>({c:m.c,p:+m.p}));if(m.length)o.more=m}
  if(n(a.lb))o.lb=a.lb;return o}
let A=ld("blcAlarms",[]),LOG=ld("blcAlarmLog",[]),last={},lastD={},form=null,reg=null;
A=(Array.isArray(A)?A:[]).map(okA).filter(Boolean);if(!Array.isArray(LOG))LOG=[];
const hist={},st={},cb={}; // Kursverlauf je Coin (für „bewegt sich um“), letzter Zustand je Alarm, Kerzenschluss-Merker
// Geteilte Ansicht: Preis-Alarme prüft nur die Hauptseite (sonst meldet jedes Fenster denselben Alarm); die Fenster prüfen nur die Linien ihres eigenen Charts
const EMB=typeof SLOT!=="undefined"&&!!SLOT,split=()=>document.documentElement.classList.contains("split");
// Formular-Eingaben merken, bevor die Liste neu gezeichnet wird (sonst gehen Tippen und Häkchen verloren)
function sync(){if(!form||!$("alC"))return;const v=id=>$(id)?$(id).value:undefined;if($("alSym"))form.sym=v("alSym");form.c=v("alC");form.p=v("alP");form.note=v("alN");form.trig=v("alT");
  if($("alTf"))form.tf=v("alTf");if($("alMin"))form.min=v("alMin");if($("alDir"))form.dir=v("alDir");form.exp=v("alExp")?new Date(v("alExp")).getTime()||"":"";
  form.more=(form.more||[]).map((m,i)=>({c:v("alMc"+i)||m.c,p:v("alMp"+i)!=null?v("alMp"+i):m.p}))}
const saveA=()=>sv("blcAlarms",A),saveL=()=>sv("blcAlarmLog",LOG.slice(0,50));
const F=v=>CC.fmt(v);
// Service Worker: nötig für Benachrichtigungen am Handy (Android) und für „App installieren“
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").then(r=>{reg=r}).catch(()=>{});
async function perm(){if(!("Notification"in window))return false;if(Notification.permission==="granted")return true;if(Notification.permission==="denied")return false;try{return(await Notification.requestPermission())==="granted"}catch(e){return false}}
function beep(){try{const c=new(window.AudioContext||window.webkitAudioContext)();[0,.18,.36].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=[880,1175,1568][i];o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.0001,c.currentTime+t);g.gain.exponentialRampToValueAtTime(.25,c.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+.16);o.start(c.currentTime+t);o.stop(c.currentTime+t+.18)})}catch(e){}}
function fire(title,body,sym){if(EMB){const l=ld("blcAlarmLog",[]);if(Array.isArray(l))LOG=l}LOG.unshift({t:Date.now(),title,body});saveL();beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
  toast("🔔 "+title+" – "+body);
  if("Notification"in window&&Notification.permission==="granted"){const o={body,icon:"icons/chart-192.png",badge:"icons/chart-192.png",tag:"al"+Date.now(),data:{sym}};
    if(reg&&reg.showNotification)reg.showNotification(title,o).catch(()=>{});else try{new Notification(title,o)}catch(e){}}
  if(open()){sync();draw()}}
const hit=(c,p0,p1,lv)=>p0!=null&&(c==="up"?p0<lv&&p1>=lv:c==="dn"?p0>lv&&p1<=lv:(p0<lv&&p1>=lv)||(p0>lv&&p1<=lv));
const pz=v=>String(v).replace(".",",");
// Text eines Alarms (für Liste und Meldung)
function desc(a,sym){const who=a.lst?`Liste „${a.lst}“`:a.sym;let t;
  if(a.c==="mv")t=`${sym||who} bewegt sich um ${pz(a.p)} % in ${a.min} Min${a.dir!=="any"?" "+DIR[a.dir]:""}`;
  else if(a.c==="chgU")t=`${sym||who}: Tagesänderung über +${pz(a.p)} %`;else if(a.c==="chgD")t=`${sym||who}: Tagesänderung unter −${pz(Math.abs(a.p))} %`;
  else t=`${sym||who} ${COND[a.c]} ${F(a.p)}`;
  if(a.more)t+=a.more.map(m=>` und Kurs ${m.c==="gt"?">":"<"} ${F(m.p)}`).join("");return t}
function histAdd(sym,p){const h=hist[sym]||(hist[sym]=[]),now=Date.now();if(!h.length||now-h[h.length-1].t>=5000)h.push({t:now,p});while(h.length&&now-h[0].t>864e5+6e4)h.shift()}
function mvPct(sym,p,min){const h=hist[sym];if(!h||!h.length)return null;const t0=Date.now()-min*6e4;let q=h[0];for(const x of h){if(x.t<=t0)q=x;else break}return(p/q.p-1)*100}
// Zustand einer Zustands-Bedingung (größer/kleiner, Bewegung, Tagesänderung)
function state(a,sym,p,ch){if(a.c==="gt")return p>a.p;if(a.c==="lt")return p<a.p;if(a.c==="chgU")return ch!=null&&ch>=a.p;if(a.c==="chgD")return ch!=null&&ch<=-Math.abs(a.p);
  if(a.c==="mv"){const pc=mvPct(sym,p,a.min);if(pc==null)return false;return a.dir==="up"?pc>=a.p:a.dir==="dn"?pc<=-a.p:Math.abs(pc)>=a.p}return false}
const EVT=c=>c==="x"||c==="up"||c==="dn";
function trigger(a,sym,p){fire(desc(a,sym),`Kurs ${F(p)} $${a.note?" · "+a.note:""}`,sym);if(a.trig==="once"){a.on=false}a.hits=(a.hits||0)+1;saveA()}
// Einen Alarm für einen Coin prüfen (p0 = Kurs der vorigen Prüfung, ch = Tagesänderung in %)
function evalA(a,sym,p,p0,ch){const now=Date.now(),key=a.id+"|"+sym;
  if(a.exp&&now>a.exp){a.on=false;saveA();return}
  const extra=()=>(a.more||[]).every(m=>m.c==="gt"?p>m.p:p<m.p);
  if(a.trig==="close"){ // nur am Schluss einer Kerze des gewählten Zeitrahmens (Schlusskurs = letzter Kurs vor dem Wechsel)
    const b=Math.floor(now/(ATF[a.tf]||9e5)),c0=cb[key];if(!c0){cb[key]={b,last:p,prev:null};return}if(b===c0.b){c0.last=p;return}
    const close=c0.last,prev=c0.prev;c0.b=b;c0.prev=close;c0.last=p;
    if((EVT(a.c)?hit(a.c,prev,close,a.p):state(a,sym,close,ch))&&extra())trigger(a,sym,close);return}
  let ev;if(EVT(a.c))ev=hit(a.c,p0,p,a.p);
  else{const s=state(a,sym,p,ch),was=st[key];st[key]=s;ev=s&&(was===false||(was===undefined&&a.trig==="once"))} // Zustand: melden, wenn er neu eintritt
  if(!ev||!extra())return;
  if(a.trig==="bar"){const b=Math.floor(now/(ATF[a.tf]||9e5));if(a.lb===b)return;a.lb=b}
  trigger(a,sym,p)}
function check(sym,p){if(!(p>0))return;const p0=last[sym];last[sym]=p;histAdd(sym,p);
  for(const a of A){if(!a.on||a.lst||a.sym!==sym)continue;evalA(a,sym,p,p0,null)}}
// Listen-Alarme: eine Bedingung gilt für alle Coins einer Watchlist
const listSyms=a=>{const l=(window.wlLists?wlLists():[]).find(x=>x.name===a.lst);return l?l.items.filter(s=>!s.startsWith("###")):[]};
function checkList(sym,p,ch){if(!(p>0))return;histAdd(sym,p);for(const a of A){if(!a.on||!a.lst)continue;if(listSyms(a).includes(sym))evalA(a,sym,p,null,ch)}}
// Linien-Alarme (Trendlinie, horizontale Linie, Strahl) des geöffneten Coins
function lineVal(d,t){const p=d.pts;if(d.type==="hl"||d.type==="ray")return p[0].p;if(d.type==="tl"&&p[1]&&p[1].t!==p[0].t)return p[0].p+(p[1].p-p[0].p)*(t-p[0].t)/(p[1].t-p[0].t);return null}
function checkLines(p,t){for(const d of S.dw||[]){if(!d.alarm)continue;const v=lineVal(d,t);if(v==null)continue;const k=S.sym+d.id,p0=lastD[k];lastD[k]=p;
  if(p0!=null&&hit("x",p0,p,v)&&!(d._alT&&Date.now()-d._alT<60000)){d._alT=Date.now();const nm={tl:"Trendlinie",hl:"Horizontale Linie",ray:"Strahl"}[d.type];fire(`${S.sym}: ${nm} gekreuzt`,`Kurs ${F(p)} $ · Linie ${F(v)} $`,S.sym);if(d.alarmOnce){d.alarm=false;try{saveDw()}catch(e){}}}}}
// Kurse: aktueller Coin jede Sekunde (Live-Verbindung), alle anderen Alarm-Coins alle 10 Sekunden
// S.kSym = Coin, zu dem die geladenen Kerzen gehören: direkt nach einem Coin-Wechsel sind noch die alten Kerzen da → nicht prüfen (sonst Fehlalarm)
setInterval(()=>{if(!S.kO||!S.kO.length||S.kSym!==S.sym)return;const q=S.kO[S.kO.length-1];if(S.mkt!=="k"||split())return;if(!EMB)check(S.sym,q.c);checkLines(q.c,Date.now())},1000);
async function poll(){if(EMB)return;const own=!split()&&S.mkt==="k"&&S.kSym===S.sym?S.sym:null,syms=[...new Set(A.filter(a=>a.on&&a.sym&&a.sym!==own).map(a=>a.sym))],lsy=[...new Set(A.filter(a=>a.on&&a.lst).flatMap(listSyms))];if(!syms.length&&!lsy.length)return;
  try{if(S.ex==="okx"){const j=await getJSON("https://www.okx.com/api/v5/market/tickers?instType=SWAP",10000);for(const x of j.data||[]){const s=x.instId.replace(/-USDT-SWAP$/,""),p=+x.last,o=+x.sodUtc0||+x.open24h;if(syms.includes(s))check(s,p);if(lsy.includes(s))checkList(s,p,o?(p/o-1)*100:null)}}
    else{const all=[...new Set(syms.concat(lsy))],j=await getJSON(`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(all.map(s=>s+"USDT")))}`,10000);for(const x of j||[]){const s=x.symbol.replace(/USDT$/,""),p=+x.lastPrice;if(syms.includes(s))check(s,p);if(lsy.includes(s))checkList(s,p,+x.priceChangePercent)}}}catch(e){}}
// abgelaufene Alarme ausschalten
setInterval(()=>{let ch=false;for(const a of A)if(a.on&&a.exp&&Date.now()>a.exp){a.on=false;ch=true}if(ch){saveA();if(open()){sync();draw()}}},30000);
setInterval(poll,10000);
// ---------- Fenster ----------
const open=()=>!$("side").hidden&&!$("alBody").hidden;
function draw(){const b=$("alBody");if(!b)return;const cur=S.kO&&S.kO.length?S.kO[S.kO.length-1].c:0,np="Notification"in window?Notification.permission:"x";
  let h=`<div class="alTop"><button class="btn" data-a="neu">＋ Neuer Alarm</button><span class="alSt">${A.filter(a=>a.on).length} aktiv</span></div>`;
  if(np!=="granted")h+=`<div class="alHint">${np==="denied"?"Benachrichtigungen sind für diese Seite blockiert. In den Browser-Einstellungen für chart.kompassapps.de erlauben – bis dahin kommen Alarme nur als Ton und Hinweis auf der Seite.":`<button class="btn ghost" data-a="perm">🔔 Benachrichtigungen erlauben</button>`}</div>`;
  if(form){const f=form,CL=f.lst?LCOND:COND,isMv=f.c==="mv",isChg=f.c==="chgU"||f.c==="chgD",pLab=isMv||isChg?"Prozent":"Preis (USDT)",tOut=t=>{const d=new Date(t-new Date(t).getTimezoneOffset()*6e4);return isFinite(d.getTime())?d.toISOString().slice(0,16):""};
    h+=`<div class="alForm">${f.lst?`<label>Liste <input value="${esc(f.lst)}" disabled></label>`:`<label>Coin <input id="alSym" value="${esc(f.sym)}" autocomplete="off"></label>`}
    <label>Bedingung <select id="alC" data-re="1">${Object.entries(CL).map(([k,t])=>`<option value="${k}" ${f.c===k?"selected":""}>${t}</option>`).join("")}</select></label>
    <label>${pLab} <input id="alP" type="number" step="any" inputmode="decimal" value="${esc(f.p)}"></label>
    ${isMv?`<label>innerhalb von (Minuten) <input id="alMin" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${esc(f.min||15)}"></label><label>Richtung <select id="alDir">${Object.entries(DIR).map(([k,t])=>`<option value="${k}" ${f.dir===k?"selected":""}>${t}</option>`).join("")}</select></label>`:""}
    ${(f.more||[]).map((m,i)=>`<label class="alM">und Kurs <select id="alMc${i}"><option value="gt" ${m.c==="gt"?"selected":""}>größer als</option><option value="lt" ${m.c==="lt"?"selected":""}>kleiner als</option></select><input id="alMp${i}" type="number" step="any" inputmode="decimal" value="${esc(m.p)}"><button type="button" data-mrm="${i}" title="Bedingung entfernen">✕</button></label>`).join("")}
    ${(f.more||[]).length<3?`<button type="button" class="btn ghost alAdd" data-a="madd">＋ Bedingung hinzufügen</button>`:""}
    <label>Auslöser <select id="alT" data-re="1">${Object.entries(TRIG).map(([k,t])=>`<option value="${k}" ${f.trig===k?"selected":""}>${t}</option>`).join("")}</select></label>
    ${f.trig==="bar"||f.trig==="close"?`<label>Kerze (Zeitrahmen) <select id="alTf">${Object.keys(ATF).map(k=>`<option value="${k}" ${f.tf===k?"selected":""}>${ATFL[k]}</option>`).join("")}</select></label>`:""}
    <label>Ablauf (leer = läuft unbegrenzt) <input id="alExp" type="datetime-local" value="${f.exp?tOut(+f.exp):""}"></label>
    <label>Nachricht <input id="alN" value="${esc(f.note||"")}" placeholder="optional" maxlength="80"></label>
    ${isMv?`<p class="wlE">Gemessen wird ab dem Öffnen der Seite; für ein Zeitfenster von ${esc(f.min||15)} Minuten muss sie so lange offen sein.</p>`:""}
    <div class="row"><button class="btn" data-a="save">Speichern</button><button class="btn ghost" data-a="abbr">Abbrechen</button></div></div>`}
  h+=`<div class="alL">`;if(!A.length)h+=`<p class="wlE">Noch keine Preis-Alarme. Tipp: Auch auf eine gezeichnete Linie kannst du einen Alarm legen – Linie antippen, dann „🔔 Alarm“.</p>`;
  A.forEach((a,i)=>{const pr=!a.lst&&a.c!=="mv",dist=pr&&a.sym===S.sym&&cur?((a.p/cur-1)*100):null,exp=a.exp?` · bis ${new Date(a.exp).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}`:"";h+=`<div class="alR${a.on?"":" off"}"><label class="sw"><input type="checkbox" data-on="${i}" ${a.on?"checked":""}></label>
    <div class="tx"><b>${esc(desc(a))}</b>${dist!=null?` <small>(${dist>=0?"+":""}${dist.toFixed(2).replace(".",",")} %)</small>`:""}${a.note?`<small> · ${esc(a.note)}</small>`:""}<small> · ${TRIG[a.trig]}${a.trig==="bar"||a.trig==="close"?" "+ATFL[a.tf]:""}${exp}${a.hits?` · ${a.hits}× ausgelöst`:""}</small></div>
    <button data-ed="${i}" title="Bearbeiten">✎</button><button data-rm="${i}" title="Löschen">✕</button></div>`});
  const dl=(S.dw||[]).filter(d=>d.alarm);if(dl.length)h+=`<div class="wlSec">Linien-Alarme ${esc(S.sym)}</div>`+dl.map(d=>`<div class="alR"><div class="tx">${{tl:"Trendlinie",hl:"Horizontale Linie",ray:"Strahl"}[d.type]} bei <b>${F(lineVal(d,Date.now()))}</b></div><button data-dl="${d.id}" title="Alarm entfernen">✕</button></div>`).join("");
  h+=`</div>`;
  if(LOG.length)h+=`<div class="wlSec">Zuletzt ausgelöst</div>`+LOG.slice(0,8).map(l=>`<div class="alLog"><small>${new Date(l.t).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</small> ${esc(l.title)} <small>${esc(l.body)}</small></div>`).join("")+`<button class="btn ghost" data-a="logdel" style="margin-top:6px">Verlauf leeren</button>`;
  h+=`<p class="wlE">Alarme laufen, solange die Seite (oder die App) geöffnet ist – auch im Hintergrund-Tab. Ganz geschlossen gibt es keine Meldung; dafür bräuchte es einen Server.</p>`;
  b.innerHTML=h}
function setup(){const b=$("alBody");
  b.addEventListener("click",async e=>{const t=e.target.closest("button,input[type=checkbox]");if(!t)return;sync();const d=t.dataset,cur=S.kO&&S.kO.length?S.kO[S.kO.length-1].c:0;
    if(d.a==="neu"){form={sym:S.sym,c:"x",p:cur?+cur.toPrecision(6):"",trig:"once",tf:"15m",min:15,dir:"any",exp:"",note:"",more:[]};perm()}
    if(d.a==="madd"){(form.more=form.more||[]).push({c:"gt",p:cur?+cur.toPrecision(6):""})}
    if(d.mrm!=null){form.more.splice(+d.mrm,1)}
    if(d.a==="perm"){await perm()}
    if(d.a==="abbr")form=null;
    if(d.a==="save"){const o=okA({...form,id:form.id||Date.now(),sym:form.lst?undefined:String(form.sym||"").trim().toUpperCase().replace(/^[A-Z]+:/,"").replace(/(USDT)?(\.P)?$/,""),p:parseFloat(String(form.p).replace(",",".")),min:parseFloat(form.min),on:true,
        more:(form.more||[]).map(m=>({c:m.c,p:parseFloat(String(m.p).replace(",","."))})),lb:undefined});
      if(!o||!(o.p>0)){toast(form.lst?"Bitte einen Wert angeben":"Bitte Coin und Wert angeben");return}if(o.exp&&o.exp<Date.now()){toast("Das Ablaufdatum liegt in der Vergangenheit");return}
      if(form.i!=null&&A[form.i]){o.hits=A[form.i].hits||0;A[form.i]=o}else A.push(o);Object.keys(st).forEach(k=>{if(k.startsWith(o.id+"|"))delete st[k]});saveA();form=null;toast("Alarm gespeichert")}
    if(d.a==="logdel"){LOG=[];saveL()}
    if(d.on!=null){A[+d.on].on=t.checked;saveA()}
    if(d.rm!=null){A.splice(+d.rm,1);saveA()}
    if(d.ed!=null){const a=A[+d.ed];form={...a,more:(a.more||[]).map(m=>({...m})),exp:a.exp||"",i:+d.ed}}
    if(d.dl!=null){const x=(S.dw||[]).find(z=>String(z.id)===d.dl);if(x){x.alarm=false;try{saveDw()}catch(_){}}}
    draw()});
  // Bedingung oder Auslöser gewechselt → Formular passt seine Felder an
  b.addEventListener("change",e=>{if(e.target.dataset&&e.target.dataset.re&&form){sync();const CL=form.lst?LCOND:COND;if(!CL[form.c])form.c=Object.keys(CL)[0];if(form.c==="mv"||form.c==="chgU"||form.c==="chgD"){if(!(parseFloat(form.p)<=100))form.p=form.c==="mv"?2:5}draw()}})}
window.alShow=()=>{draw()};window.alPerm=perm;
// Alarm direkt am Preis anlegen (aus der Linien-Leiste)
window.alNew=p=>{form={sym:S.sym,c:"x",p:+(+p).toPrecision(6),trig:"once",tf:"15m",min:15,dir:"any",exp:"",note:"",more:[]};if(open())draw();else showSide("al");perm()};
// Alarm auf eine ganze Watchlist (aus dem Listen-Menü)
window.alNewList=name=>{form={lst:String(name),c:"chgU",p:5,trig:"every",tf:"15m",min:15,dir:"any",exp:"",note:"",more:[]};if(open())draw();else showSide("al");perm()};
setup();
})();
