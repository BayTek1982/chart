// Watchlist wie in TradingView: mehrere Listen, Abschnitte (###), farbige Fähnchen, Kurse + Tagesänderung, Import/Export im TradingView-Format
(function(){
const FL0=[null,["#f23645","Rot"],["#2962ff","Blau"],["#089981","Grün"],["#ff9800","Orange"],["#9c27b0","Lila"],["#00bcd4","Türkis"],["#e91e63","Rosa"]];
// Eigene Fähnchen (über ＋): Farben hinter den 7 festen; ein gelöschtes bleibt als Lücke (null) stehen, damit die Nummern der anderen gleich bleiben
const okFlx=a=>(Array.isArray(a)?a:[]).slice(0,20).map(c=>typeof c==="string"&&/^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():null);
let FLX=[],FL=FL0;const mkFL=()=>{FL=FL0.concat(FLX.map(c=>c?[c,"Eigen"]:null))};
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// Listen und Fähnchen prüfen (aus dem Speicher oder aus einem Übertragungs-Link): nur Text-Symbole, Fähnchen nur 1–7 – sonst kann ein kaputter Link die Seite lahmlegen
const okLists=a=>(Array.isArray(a)?a:[]).filter(l=>l&&typeof l==="object"&&Array.isArray(l.items)).slice(0,50).map(l=>{const o={name:String(l.name||"Liste").slice(0,60),items:l.items.filter(s=>typeof s==="string"&&s).map(s=>s.startsWith("###")?"###"+s.slice(3,63):s.toUpperCase().replace(/[^A-Z0-9.]/g,"").replace(/^\.+|\.+$/g,"").slice(0,20)).filter(Boolean).slice(0,1000)};
  if(l.sort&&typeof l.sort==="object"&&typeof l.sort.k==="string")o.sort={k:l.sort.k.replace(/[^a-z]/g,""),d:l.sort.d<0?-1:1};if(l.fav===true)o.fav=true;if(typeof l.used==="number"&&isFinite(l.used))o.used=l.used;return o});
const okFlags=f=>{const o={};if(f&&typeof f==="object")for(const s of Object.keys(f)){const v=f[s];if(Number.isInteger(v)&&v>=1&&FL[v]&&/^[A-Z0-9.]{1,20}$/.test(s))o[s]=v}return o};
try{FLX=okFlx(JSON.parse(localStorage.getItem("blcFlagX")))}catch(e){}mkFL();
const W=ld("blcWl",null)||{cur:0,lists:[]};W.lists=okLists(W.lists);if(!W.lists.length)W.lists=[{name:"A Krypto OKX",items:["BTC","ETH","SOL","XRP","BNB","DOGE"]}];W.cur=W.lists[+W.cur]?+W.cur:0;
const SORTS=[["eigen","Benutzerdefinierte Reihenfolge"],["sym","Nach Symbol"],["preis","Nach letztem Preis"],["ver","Nach Veränderung"],["verp","Nach Veränderung (%)"],["flag","Nach Fähnchen"],["vol","Nach Volumen"]];
// Ansicht (Menü ⋯): Tabellenansicht, Gruppierung, Spalten, Logo, Symbol oder Name – je Gerät gespeichert
const COLS=[{k:"last",t:"Kurs",w:92,s:"preis"},{k:"chg",t:"Änd",w:78,s:"ver"},{k:"chgp",t:"Änd %",w:74,s:"verp"},{k:"vol",t:"Volumen",w:76,s:"vol"},{k:"hl",t:"24h H/T",w:92},{k:"ald",t:"Alarm",w:66,s:"ald"}];
const V=(()=>{const a=ld("blcWlView",{})||{},c=a.cols&&typeof a.cols==="object"?a.cols:{},o={tab:a.tab!==false,grp:["none","sec","flag","typ"].includes(a.grp)?a.grp:"sec",logo:a.logo2!==false,sub:a.sub!==false,hide0:a.hide0===true,nm:a.nm==="name"?"name":"sym",cols:{}};
  const def={last:1,chg:innerWidth>430?1:0,chgp:1,vol:0,hl:0,ald:0};COLS.forEach(x=>o.cols[x.k]=c[x.k]==null?!!def[x.k]:!!c[x.k]);return o})();
const saveV=()=>sv("blcWlView",{...V,logo2:V.logo});
// Logos: Bild-Adressen der 500 größten Coins von CoinGecko (dieselbe Quelle wie die Namenssuche), einmal am Tag geholt und gespeichert
let LG=(()=>{const a=ld("blcLogo",null);return a&&a.m&&typeof a.m==="object"?a:{t:0,m:{}}})(),lgBusy=false;
const lgUrl=s=>{const u=LG.m[s.replace(/^\d+/,"")]||LG.m[s];return typeof u==="string"&&/^https:\/\/[a-z0-9.-]+\//i.test(u)?u:""};
async function lgLoad(){if(lgBusy||(Date.now()-LG.t<864e5&&LG.n))return;lgBusy=true;try{const m={},nmap={};for(const pg of[1,2]){const j=await getJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${pg}&sparkline=false`,15000);
      for(const c of Array.isArray(j)?j:[]){const sy=String(c.symbol||"").toUpperCase();if(/^[A-Z0-9]{1,20}$/.test(sy)&&!m[sy]&&typeof c.image==="string"&&c.image.startsWith("https://")){m[sy]=c.image.replace("/large/","/small/");if(typeof c.name==="string")nmap[sy]=c.name.replace(/[<>"'`&]/g,"").slice(0,40)}}}
    if(Object.keys(m).length){LG={t:Date.now(),m,n:nmap};sv("blcLogo",LG);BADLG.clear();if(open()&&!menu)draw()}}catch(e){LG.t=Date.now()-864e5+6e5}finally{lgBusy=false}}
const BADLG=new Set(); // Coins ohne ladbares Logo (dann bleibt der Buchstaben-Kreis)
const fmtVol=v=>!(v>0)?"–":v>=1e9?(v/1e9).toFixed(v>=1e10?1:2).replace(".",",")+" Mrd":v>=1e6?(v/1e6).toFixed(v>=1e8?0:1).replace(".",",")+" Mio":v>=1e3?Math.round(v/1e3)+" Tsd":String(Math.round(v));
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
// Name zu einem Kürzel: Coin (feste Liste, CoinGecko) oder – wenn kein Coin bekannt ist – die Aktie aus dem Coin-Scanner
const stk=s=>typeof stockOf!=="function"?null:stockOf(s)||(/\.KS$/.test(s)?stockOf(s.slice(0,-2)+"KQ"):null);
// Aktien mit Heimatbörse: „MRK.DE“ = Merck an der deutschen Börse (nicht das gleichnamige US-Perp). Endung ↔ TradingView-Börse
const SFX={".DE":["XETR","Deutschland"],".KS":["KRX","Korea"],".KQ":["KRX","Korea"],".HK":["HKEX","Hongkong"],".T":["TSE","Japan"],".L":["LSE","London"],".SW":["SIX","Schweiz"],".MI":["MIL","Mailand"],".MC":["BME","Madrid"],".PA":["EURONEXT","Paris"],".AS":["EURONEXT","Amsterdam"]};
const TVX={XETR:".DE",FWB:".DE",GETTEX:".DE",TRADEGATE:".DE",SWB:".DE",KRX:".KS",HKEX:".HK",TSE:".T",LSE:".L",SIX:".SW",MIL:".MI",BME:".MC"};
const sfxOf=s=>{const i=s.lastIndexOf(".");return i>0&&SFX[s.slice(i)]?s.slice(i):""},baseOf=s=>s.replace(/\..*$/,"");
const tvOf=s=>{const x=sfxOf(s);return x?SFX[x][0]+":"+(x===".HK"?baseOf(s).replace(/^0+(?=.)/,""):baseOf(s)):""};
// Andere Schreibweisen desselben Kürzels: die Aktie an einer Heimatbörse bzw. zurück zum einfachen Kürzel (Perp / US-Aktie)
const alts=s=>{const b=baseOf(s),o=[];if(s.includes("."))o.push(b);for(const x of(typeof S!=="undefined"&&S.list&&S.list.a)||[]){const y=String(x.s).toUpperCase();if(y!==s&&sfxOf(y)&&baseOf(y)===b&&/^[A-Z0-9.]{1,20}$/.test(y)&&!o.includes(y))o.push(y)}return o.slice(0,4)};
// Ein Kürzel in den Listen ersetzen; Fähnchen und Notiz gehen mit
function swapSym(l,a,b){const i=l.items.indexOf(a);if(i<0)return;if(l.items.includes(b))l.items.splice(i,1);else l.items[i]=b;if(FLAG[a]&&!FLAG[b])FLAG[b]=FLAG[a];if(NOTE[a]&&!NOTE[b])NOTE[b]=NOTE[a]}
const coinName=s=>(typeof CNAME!=="undefined"&&CNAME[s])||(typeof GECKO!=="undefined"&&GECKO[s])||(LG.n&&LG.n[s.replace(/^\d+(?=[A-Z])/,"")])||(stk(s)||{}).n||"";
// Abstand zum nächsten aktiven Preis-Alarm je Coin (in %)
function alarmDist(){const o={};let A=[];try{A=JSON.parse(localStorage.getItem("blcAlarms"))||[]}catch(e){}for(const a of Array.isArray(A)?A:[]){if(!a||!a.on||!a.sym||a.c==="mv"||!(a.p>0))continue;const q=Q[a.sym];if(!q||!q.p)continue;const d=(a.p/q.p-1)*100;if(o[a.sym]==null||Math.abs(d)<Math.abs(o[a.sym]))o[a.sym]=d}return o}
let menu=null,impTxt="",impName="",sortOpen=false,FLAG=okFlags(ld("blcFlag",{})),filt=+ld("blcWlFilt",0)||0,edit=false,imp=false,pop=null,Q={},qT=0,qBusy=false;
// Notiz je Coin (z. B. „wartet auf 0,618“): steht klein unter dem Symbol
const okNotes=n=>{const o={};if(n&&typeof n==="object")for(const s of Object.keys(n))if(/^[A-Z0-9.]{1,20}$/.test(s)&&typeof n[s]==="string"&&n[s].trim())o[s]=n[s].trim().slice(0,80);return o};
let NOTE=okNotes(ld("blcNote",{}));
const saveW=()=>sv("blcWl",W),saveF=()=>sv("blcFlag",FLAG),L=()=>W.lists[W.cur]||W.lists[0];
if(!FL[filt])filt=0; // gewählter Fähnchen-Filter bleibt über den Neustart erhalten
const setFilt=f=>{filt=FL[f]?f:0;sv("blcWlFilt",filt)};
// Farbwähler für eigene Fähnchen (liegt außerhalb der Liste, damit er beim Neuzeichnen nicht verschwindet)
const colIn=document.createElement("input");colIn.type="color";colIn.value="#ffd600";colIn.style.cssText="position:fixed;left:50%;top:40%;width:1px;height:1px;opacity:0;pointer-events:none";document.body.appendChild(colIn);
colIn.addEventListener("change",()=>{const c=colIn.value.toLowerCase();if(FL.some(x=>x&&x[0]===c)){toast("Diese Farbe gibt es schon");return}if(FLX.filter(Boolean).length>=12){toast("Höchstens 12 eigene Fähnchen");return}
  const i=FLX.indexOf(null);if(i>=0)FLX[i]=c;else FLX.push(c);sv("blcFlagX",FLX);mkFL();toast("Neues Fähnchen angelegt");if(open())draw();if(typeof legend==="function")legend()});
// Kurse: OKX = alle Perps in einem Abruf (Änderung seit 0 Uhr UTC wie TradingView), Binance = 24h
async function quotes(){if(qBusy)return;qBusy=true;try{
  const A=typeof EX!=="undefined"&&EX.get(S.ex);
  if(A){const q={};(await A.tick()).forEach(x=>{q[x.s]={p:x.p,ch:x.ch,d:x.d,v:x.v,h:x.h,l:x.l}});Q=q}
  else if(S.ex==="okx"){const j=await getJSON("https://www.okx.com/api/v5/market/tickers?instType=SWAP",10000);const q={};
    for(const x of j.data||[])if(/-USDT-SWAP$/.test(x.instId)){const o=+x.sodUtc0||+x.open24h;q[x.instId.slice(0,-10)]={p:+x.last,ch:o?(+x.last/o-1)*100:null,d:o?+x.last-o:null,v:+x.volCcy24h*+x.last,h:+x.high24h||null,l:+x.low24h||null}}Q=q}
  else{const syms=[...new Set(W.lists.flatMap(l=>l.items).filter(s=>!s.startsWith("###")))];if(syms.length){
    const j=await getJSON(`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(syms.map(s=>s+"USDT")))}`,10000).catch(async()=>{
      const a=await getJSON("https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI",15000);return a.map(x=>({symbol:x.symbol,lastPrice:x.lastPrice,highPrice:x.highPrice,lowPrice:x.lowPrice,priceChange:x.lastPrice-x.openPrice,quoteVolume:x.quoteVolume,priceChangePercent:x.openPrice>0?((x.lastPrice/x.openPrice-1)*100):null}))});
    const q={};for(const x of j||[])if(/USDT$/.test(x.symbol))q[x.symbol.slice(0,-4)]={p:+x.lastPrice,ch:x.priceChangePercent==null?null:+x.priceChangePercent,d:x.priceChange==null?null:+x.priceChange,v:+x.quoteVolume||0,h:+x.highPrice||null,l:+x.lowPrice||null};Q=q}}
  }catch(e){}finally{qBusy=false}if(open()&&!imp&&!menu)draw()}
const open=()=>!$("side").hidden&&!$("wlBody").hidden;
const pct=v=>v==null||!isFinite(v)?"–":(v>=0?"+":"")+v.toFixed(2).replace(".",",")+" %";
function draw(){const b=$("wlBody");if(!b)return;const l=L(),cur=S.sym;
  const mi=(a,ic,t,x)=>`<button data-a="${a}"${x||""}><span class="mi">${ic}</span>${t}</button>`,ck=on=>`<span class="mi">${on?"✓":""}</span>`;
  let h=`<div class="wlTop"><button class="btn ghost wlName${menu==="list"?" on":""}" data-a="lmenu" title="Listen-Menü (Umschalt+W)"><span>${esc(l.name)}</span> ▾</button>
    <button class="btn ghost" data-a="add" title="Aktuelles Symbol hinzufügen">＋ ${esc(cur)}</button><button class="btn ghost${sortOpen||(l.sort&&l.sort.k!=="eigen")?" on":""}" data-a="sortm" title="Sortieren">⇅</button><button class="btn ghost${edit?" on":""}" data-a="edit" title="Bearbeiten">✎</button><button class="btn ghost${menu==="view"?" on":""}" data-a="vmenu" title="Ansicht: Spalten, Gruppieren, Logo, Symbol oder Name">⋯</button></div>`;
  if(menu==="list"){const ord=W.lists.map((x,i)=>i).sort((a,b)=>(W.lists[b].fav?1:0)-(W.lists[a].fav?1:0)||(W.lists[b].used||0)-(W.lists[a].used||0));
    h+=`<div class="wlMenu">${mi("lalarm","⏰","Alarm auf der Liste hinzufügen …")}${mi("copy","⧉","Kopie erstellen …")}${mi("ren","✎","Umbenennen")}${mi("sec","☰","Abschnitt hinzufügen")}${mi("stock","🏛","Auf Aktien einer Börse umstellen …")}${mi("del","🗑","Liste löschen")}<hr>
      ${mi("new","＋","Neue Liste erstellen …")}${mi("imp0","⇪","Liste hochladen / aus TradingView importieren …")}${mi("exp","⧉","Im TradingView-Format kopieren")}${mi("share1","🔗","Link nur für diese Liste")}${mi("sync","🔗","Übertragungs-Link (alle Listen, Fähnchen, Notizen)")}<hr>
      <div class="mh">Listen · ★ = Favorit: steht oben und als runder Schnellwahl-Knopf</div>${ord.map(i=>`<div class="ml1${i===W.cur?" cur":""}"><button data-ls="${i}">${esc(W.lists[i].name)} <small>${W.lists[i].items.filter(s=>!s.startsWith("###")).length}</small></button><button class="st${W.lists[i].fav?" on":""}" data-fav="${i}" title="Favorit">${W.lists[i].fav?"★":"☆"}</button></div>`).join("")}</div>`}
  if(menu==="view")h+=`<div class="wlMenu"><button data-v="tab">${ck(V.tab)}Tabellenansicht (aus = kompakt: nur Symbol und Änd %)</button><hr>
      <div class="mh">Gruppieren nach</div>${[["none","Keine Gruppe"],["sec","Benutzerdefinierte Abschnitte"],["flag","Fähnchen"],["typ","Art (Krypto / Aktie)"]].map(([k,t])=>`<button data-vg="${k}">${ck(V.grp===k)}${t}</button>`).join("")}<hr>
      <div class="mh">Spalten anpassen</div>${COLS.map(c=>`<button data-vc="${c.k}">${ck(V.cols[c.k])}${{last:"Zuletzt (Kurs)",chg:"Veränderung",chgp:"Veränderung %",vol:"Volumen (24 Std., in USDT)",hl:"24-Stunden-Hoch und -Tief",ald:"Abstand zum nächsten Alarm"}[c.k]}</button>`).join("")}<hr>
      <div class="mh">Symbolanzeige</div><button data-v="logo">${ck(V.logo)}Logo</button><button data-vn="sym">${ck(V.nm==="sym")}Symbol</button><button data-vn="name">${ck(V.nm==="name")}Name</button><button data-v="sub">${ck(V.sub)}Name klein hinter dem Symbol (welches Unternehmen / welcher Coin)</button><hr>
      <div class="mh">Ohne Daten</div><button data-v="hide0">${ck(V.hide0)}Symbole ohne Kurs ausblenden</button></div>`;
  // Schnellwahl der Listen (runde Knöpfe wie in TradingView): die Favoriten ★, sonst alle Listen
  if(W.lists.length>1){const all=W.lists.map((x,i)=>i),fv=all.filter(i=>W.lists[i].fav),ab=n=>{const w=n.trim().split(/[\s_\-]+/).filter(Boolean);return(w.length>1?w[0][0]+w[1][0]:n.trim().slice(0,2)).toUpperCase()};
    h+=`<div class="wlQ">${(fv.length?fv:all).slice(0,14).map(i=>`<button data-ls="${i}" class="${i===W.cur?"on":""}" title="${esc(W.lists[i].name)}">${esc(ab(W.lists[i].name))}</button>`).join("")}</div>`}
  h+=`
    <div class="wlEx">Börse: <select id="wlExSel" aria-label="Börse">${[["okx","OKX Perpetual"],["binance","Binance Spot"]].concat(typeof EX!=="undefined"?Object.values(EX.all).map(a=>[a.id,a.name+(a.test?" (Test)":"")]):[]).map(([k,t])=>`<option value="${k}" ${S.ex===k?"selected":""}>${esc(t)}</option>`).join("")}</select>
    <span class="wlSrc">${S.src?"Chart: "+esc(S.src):""}</span></div>
    <div class="wlFl"><button data-f="0" class="${filt===0?"on":""}">Alle</button>${FL.map((f,i)=>i&&f?`<button data-f="${i}" class="dot${filt===i?" on":""}${edit&&i>=FL0.length?" del":""}" style="--c:${f[0]}" title="${edit&&i>=FL0.length?"Eigenes Fähnchen löschen":"Nur "+f[1]}">${edit&&i>=FL0.length?"✕":""}</button>`:"").join("")}<button data-a="flAdd" class="flAdd" title="Eigenes Fähnchen (Farbe) hinzufügen">＋</button></div>`;
  if(sortOpen){const so=l.sort||{k:"eigen",d:1};h+=`<div class="wlSort">${SORTS.map(([k,t])=>`<button data-sort="${k}" class="${so.k===k?"on":""}">${t}${so.k===k&&k!=="eigen"?(so.d>0?" ↑":" ↓"):""}</button>`).join("")}</div>`}
  if(imp)h+=`<div class="wlImp"><b>Import aus TradingView</b><p>In TradingView: Watchlist-Menü → „Liste exportieren“. Die Datei hier auswählen oder den Inhalt einfügen (z. B. <code>###KRYPTO,OKX:BTCUSDT.P,OKX:ETHUSDT.P</code>).</p>
    <textarea id="wlTxt" rows="3" placeholder="OKX:BTCUSDT.P, OKX:ETHUSDT.P …">${esc(impTxt)}</textarea><div class="row"><input type="file" id="wlFile" accept=".txt,.csv,text/plain,text/csv"><button class="btn" data-a="imp">In neue Liste importieren</button><button class="btn ghost" data-a="impAdd">Zur aktuellen Liste</button></div>
    <div class="row"><button class="btn ghost" data-a="imp0">Schließen</button></div></div>`;
  const so=l.sort||{k:"eigen",d:1},sorted=so.k!=="eigen";
  const C=V.tab?COLS.filter(c=>V.cols[c.k]):COLS.filter(c=>c.k==="chgp"),sumW=C.reduce((a,c)=>a+c.w,0),gaps=6*(C.length+2)+18+8;
  // Kein seitliches Scrollen: am PC wird das Panel so breit wie nötig (höchstens 55 % des Fensters); reicht der Platz trotzdem nicht (Handy), werden die Spalten schmaler
  if(innerWidth>=1000)document.documentElement.style.setProperty("--sideW",Math.max(390,Math.min(Math.round(innerWidth*.55),sumW+gaps+96+30))+"px");
  const fW=Math.max(.5,Math.min(1,(b.clientWidth-gaps-(C.length>3?84:100))/Math.max(1,sumW))),gw=C.map(c=>Math.floor(c.w*fW)+"px").join(" "),AD=C.some(c=>c.k==="ald")||so.k==="ald"?alarmDist():{};
  // Kopfzeile wie in TradingView: Spalte antippen = sortieren, noch einmal = umdrehen, drittes Mal = eigene Reihenfolge
  h+=`<div class="wlTbl${fW<1?" eng":""}"><div style="min-width:${fW<=.5?Math.round(84+sumW*.5+gaps):0}px"><div class="wlHd" style="grid-template-columns:minmax(0,1fr) ${gw}">${[{s:"sym",t:"Symbol"}].concat(C).map(c=>c.s?`<button data-hs="${c.s}" class="${so.k===c.s?"on":""}" title="Nach ${c.t} sortieren">${c.t}${so.k===c.s?(so.d>0?" ▲":" ▼"):""}</button>`:`<span>${c.t}</span>`).join("")}</div><div class="wlRows">`;let n=0;
  // Kurs einer Zeile: Perp der gewählten Börse, sonst die echte Aktie aus dem Coin-Scanner (stündlich, nicht live) – gilt auch für das Sortieren
  const qOf=s=>{const dot=s.includes("."),q=dot?null:Q[s];if(q&&q.p)return q;const x=stk(s);return x&&x.p?{p:x.p,ch:x.ch,d:x.ch!=null?x.p-x.p/(1+x.ch/100):null,v:null,h:null,l:null,a:x.s}:dot?{a:x?x.s:s}:{}};
  const val=s=>{const q=qOf(s);return so.k==="sym"?s:so.k==="preis"?q.p:so.k==="ver"?q.d:so.k==="verp"?q.ch:so.k==="flag"?(FLAG[s]||99):so.k==="vol"?q.v:so.k==="ald"?(AD[s]==null?null:Math.abs(AD[s])):0};
  const srt=a=>sorted?a.slice().sort((a,b)=>{const x=val(a),y=val(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return-1;return(typeof x==="string"?x.localeCompare(y):x-y)*so.d}):a;
  const isS=s=>s.startsWith("###"),canEd=edit&&!filt&&!sorted&&V.grp==="sec";
  // Zeilen: Texte = Symbole, Objekte = Überschriften
  let rows;if(filt)rows=[{t:`Alle mit ${FL[filt][1].toLowerCase()}em Fähnchen`,c:FL[filt][0]}].concat(srt([...new Set(W.lists.flatMap(x=>x.items).concat(Object.keys(FLAG)))].filter(s=>!isS(s)&&FLAG[s]===filt).sort()));
  else if(V.grp==="flag"){const it=l.items.filter(s=>!isS(s));rows=[];FL.forEach((f,i)=>{if(!i||!f)return;const g=it.filter(s=>FLAG[s]===i);if(g.length)rows.push({t:f[1]+" · "+g.length,c:f[0]},...srt(g))});const g0=it.filter(s=>!FLAG[s]);if(g0.length)rows.push({t:"Ohne Fähnchen · "+g0.length},...srt(g0))}
  else if(V.grp==="typ"){const it=l.items.filter(s=>!isS(s)),a=it.filter(s=>qOf(s).a),kr=it.filter(s=>!qOf(s).a);rows=[];if(kr.length)rows.push({t:"Krypto / Perpetuals · "+kr.length},...srt(kr));if(a.length)rows.push({t:"Aktien · "+a.length},...srt(a))}
  else if(V.grp==="none"||sorted)rows=srt(l.items.filter(s=>!isS(s)));
  else rows=l.items.map((s,i)=>isS(s)?{t:s.slice(3),i}:s);
  // Zeilen ohne Perp-Kurs: Kurs der echten Aktie aus dem Coin-Scanner zeigen (stündlich, nicht live); auf Wunsch Zeilen ganz ohne Kurs ausblenden
  if(V.hide0&&Object.keys(Q).length){rows=rows.filter(s=>typeof s!=="string"||qOf(s).p);rows=rows.filter((s,i)=>typeof s==="string"||(typeof rows[i+1]==="string"))}
  rows.forEach(s=>{if(typeof s!=="string"){h+=`<div class="wlSec"${s.i!=null?` data-i="${s.i}"`:""}>${s.c?`<i class="sd" style="--c:${s.c}"></i>`:""}${esc(s.t)}${canEd&&s.i!=null?`<button data-rm="${s.i}" title="Entfernen">✕</button>`:""}</div>`;return}
    const f=FLAG[s]||0,i=l.items.indexOf(s);n++;const q=qOf(s),up=q.ch>0?"up":q.ch<0?"dn":"",cn=q.a?((stk(s)||{}).n||""):coinName(s),nm=V.nm==="name"?cn:"",isCur=q.a?S.mkt==="a"&&S.sym===q.a:S.mkt==="k"&&s===cur;
    const lg=V.logo?`<i class="lgo" style="--h:${hue(s)}">${esc(baseOf(s).replace(/^\d+/,"")[0]||s[0])}${BADLG.has(s)||q.a?"":`<img loading="lazy" alt="" data-lg="${esc(s)}"${lgUrl(s)?"":' data-t2="1"'} src="${esc(lgUrl(s)||`https://assets.coincap.io/assets/icons/${encodeURIComponent(s.replace(/^\d+/,"").toLowerCase())}@2x.png`)}">`}</i>`:"";
    const cell=c=>c.k==="last"?`<span class="px">${q.p?CC.fmt(q.p):"–"}</span>`:c.k==="chg"?`<span class="ch ${up}">${q.d==null||!isFinite(q.d)?"–":(q.d>=0?"+":"−")+CC.fmt(Math.abs(q.d))}</span>`:c.k==="chgp"?`<span class="ch ${up}">${pct(q.ch)}</span>`
      :c.k==="vol"?`<span class="px vo">${fmtVol(q.v)}</span>`:c.k==="hl"?`<span class="px hl">${q.h?CC.fmt(q.h):"–"}<br>${q.l?CC.fmt(q.l):"–"}</span>`:`<span class="px vo">${AD[s]==null?"–":(AD[s]>=0?"+":"")+AD[s].toFixed(1).replace(".",",")+" %"}</span>`;
    h+=`<div class="wlRow${isCur?" cur":""}" style="grid-template-columns:18px minmax(0,1fr) ${gw} auto" data-s="${esc(s)}"${q.a?` data-y="${esc(q.a)}" title="Echte Aktie aus dem Coin-Scanner – stündlich aktualisiert, nicht live"`:cn?` title="${esc(cn)}"`:""} data-i="${canEd?i:-1}" ${canEd?'draggable="true"':""}><button class="fl${f?" set":""}" data-fl="${esc(s)}" style="--c:${f?FL[f][0]:"transparent"}" title="Fähnchen"></button>
      <span class="sy">${lg}${nm?`${esc(nm)}<small> ${esc(s)}</small>`:`${esc(baseOf(s))}<small>${q.a?esc(sfxOf(s)):S.ex!=="binance"?".P":""}</small>`}${q.a?`<span class="tg">Aktie</span>`:""}${!nm&&V.sub&&cn?`<span class="cn">${esc(cn)}</span>`:""}${NOTE[s]?`<span class="nt">${esc(NOTE[s])}</span>`:""}</span>${C.map(cell).join("")}
      ${canEd?`<span class="ed"><button data-mv="${i}" data-d="-1" title="Nach oben">▲</button><button data-mv="${i}" data-d="1" title="Nach unten">▼</button><button data-rm="${i}" title="Entfernen">✕</button></span>`:""}</div>`;
    if(pop===s)h+=`<div class="wlPop">${FL.map((x,k)=>k&&!x?"":`<button data-setf="${k}" data-s="${esc(s)}" class="dot" style="--c:${x?x[0]:"transparent"}" title="${x?x[1]:"Kein Fähnchen"}">${x?"":"✕"}</button>`).join("")}<button class="ntB" data-note="${esc(s)}">✎ Notiz</button>${alts(s).map(y=>`<button class="ntB" data-alt="${esc(y)}" data-s="${esc(s)}" title="${sfxOf(y)?"Als Aktie an der Börse "+SFX[sfxOf(y)][1]+" führen":"Als Perp bzw. US-Aktie führen"}">⇄ ${esc(y)}${sfxOf(y)?"":" (Perp/US)"}</button>`).join("")}</div>`});
  h+=`</div></div></div>`;if(!n)h+=`<p class="wlE">${filt?"Keine Symbole mit diesem Fähnchen.":"Noch leer – oben mit ＋ das aktuelle Symbol hinzufügen oder unter ⋯ importieren."}</p>`;
  h+=`<p class="wlE">Tipp: Antippen öffnet den Chart · Punkt links = Fähnchen · ↑/↓ wechselt das Symbol (Tastatur) · Änderung ${S.ex==="okx"||S.ex==="bitget"?"seit 0 Uhr UTC":"24 Std."}</p>`;
  b.innerHTML=h;
  const exs=$("wlExSel");if(exs)exs.onchange=()=>{if(exs.value!==S.ex){S.ex=exs.value;save();Q={};S.list.k=[];loadList();load();quotes()}draw()};
  const ta=$("wlTxt");if(ta)ta.oninput=()=>{impTxt=ta.value};
  // Datei gewählt → sofort als neue Liste importieren (Name = Dateiname)
  const fi=$("wlFile");if(fi)fi.onchange=async()=>{const f=fi.files[0];if(!f)return;impTxt=await f.text();impName=f.name.replace(/\.(txt|csv)$/i,"");act("imp")}}
function parse(t){const out=[];for(let x of String(t).split(/[,\n\r;]+/)){x=x.trim();if(!x)continue;if(x.startsWith("###")){out.push("###"+x.slice(3).trim());continue}
    // Börse aus TradingView behalten: XETR:MRK → MRK.DE, KRX:005930 → 005930.KS; „MRK.DE“ direkt geht auch
    const m=/^([A-Z0-9_]+):(.+)$/i.exec(x),sf=m&&TVX[m[1].toUpperCase()],dy=x.toUpperCase();
    if(sf||(!m&&/^[A-Z0-9]{1,12}\.[A-Z]{1,2}$/.test(dy)&&sfxOf(dy))){let y=dy;if(sf){const b=m[2].toUpperCase().replace(/[^A-Z0-9]/g,"");y=b?(sf===".HK"?b.padStart(4,"0"):b)+sf:""}if(y&&!out.includes(y))out.push(y);continue}
    x=x.replace(/^[A-Z0-9_]+:/i,"").replace(/\.P$/i,"").toUpperCase().replace(/(USDT|USDC|USD|PERP)$/,"").replace(/[^A-Z0-9]/g,"");if(x&&!out.includes(x))out.push(x)}return out}
function act(a){const l=L();
  if(a==="add"){const y0=S.sym.toUpperCase(),ns=S.mkt==="a"&&/^[A-Z0-9]{1,12}\.[A-Z]{1,2}$/.test(y0)&&sfxOf(y0)?y0:S.sym.replace(/\..*$/,"").replace(/[^A-Za-z0-9]/g,"").toUpperCase();if(ns&&!l.items.includes(ns)){l.items.push(ns);saveW();quotes()}else toast(S.sym+" ist schon in der Liste")}
  // Ganze Liste auf die Aktien einer Börse umstellen (z. B. eine DAX-Liste, die ohne Börse importiert wurde)
  if(a==="stock"){menu=null;const cnt={};for(const s of l.items){if(s.startsWith("###")||s.includes("."))continue;for(const y of alts(s)){const x=sfxOf(y);(cnt[x]=cnt[x]||[]).push([s,y])}}
    const ks=Object.keys(cnt).sort((a,b)=>cnt[b].length-cnt[a].length);if(!ks.length){toast("Für diese Liste wurden keine passenden Aktien an anderen Börsen gefunden");draw();return}
    let k=ks[0];if(ks.length>1){const n=prompt("Welche Börse?\n"+ks.map((x,i)=>`${i+1} = ${SFX[x][1]} (${x}) – ${cnt[x].length} Treffer`).join("\n"),"1");if(n==null){draw();return}k=ks[+n-1];if(!k){toast("Nichts geändert");draw();return}}
    if(confirm(`${cnt[k].length} Kürzel dieser Liste gibt es als Aktie an der Börse ${SFX[k][1]} (${k}).\nUmstellen? Sie zeigen dann immer diese Aktie – auch wenn es ein gleichnamiges Perpetual gibt.`)){cnt[k].forEach(([s,y])=>swapSym(l,s,y));saveW();saveF();sv("blcNote",NOTE);toast(cnt[k].length+" Kürzel umgestellt")}}
  if(a==="flAdd"){colIn.click();return}
  if(a==="sortm")sortOpen=!sortOpen;
  if(a==="edit")edit=!edit;if(a==="lmenu")menu=menu==="list"?null:"list";if(a==="vmenu")menu=menu==="view"?null:"view";if(a==="imp0"){imp=!imp;menu=null}
  const uniq=n=>{let x=n,k=2;while(W.lists.some(q=>q.name===x))x=n+" "+k++;return x};
  if(a==="lalarm"){menu=null;if(window.alNewList){alNewList(l.name);return}toast("Alarme sind hier nicht verfügbar")}
  if(a==="copy"){const n=prompt("Name der Kopie:",l.name+" Kopie");if(n){W.lists.push({name:uniq(n.trim().slice(0,60)||"Kopie"),items:l.items.slice(),used:Date.now()});W.cur=W.lists.length-1;menu=null;saveW()}}
  if(a==="sec"){const n=prompt("Name des Abschnitts:","");if(n&&n.trim()){l.items.push("###"+n.trim().slice(0,60));V.grp="sec";saveV();menu=null;saveW();toast("Abschnitt angelegt – mit ✎ an die gewünschte Stelle schieben")}}
  if(a==="share1"){const fl={},nt={};l.items.forEach(s=>{if(FLAG[s])fl[s]=FLAG[s];if(NOTE[s])nt[s]=NOTE[s]});const pl=btoa(unescape(encodeURIComponent(JSON.stringify({one:1,l:[{name:l.name,items:l.items}],f:fl,x:FLX,n:nt})))),url=location.origin+location.pathname+"#wl="+pl;menu=null;
    if(navigator.share)navigator.share({title:"Watchlist "+l.name,url}).catch(()=>{});else(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast("Link für diese Liste kopiert")).catch(()=>prompt("Link für diese Liste:",url))}
  if(a==="new"){const n=prompt("Name der neuen Liste:","Neue Liste");if(n){W.lists.push({name:uniq(n.trim().slice(0,60)||"Liste"),items:[],used:Date.now()});W.cur=W.lists.length-1;menu=null;saveW()}}
  if(a==="ren"){const n=prompt("Neuer Name:",l.name);if(n&&n.trim()&&n.trim()!==l.name){const old=l.name;l.name=uniq(n.trim().slice(0,60));menu=null;saveW();
      try{const A=JSON.parse(localStorage.getItem("blcAlarms"))||[];if(A.some(x=>x&&x.lst===old))toast("Hinweis: Alarme auf dieser Liste hängen am alten Namen – bitte neu anlegen")}catch(e){}}}
  if(a==="del"){if(W.lists.length<2){toast("Die letzte Liste bleibt stehen");return}if(confirm(`Liste „${l.name}“ löschen?`)){W.lists.splice(W.cur,1);W.cur=0;menu=null;saveW()}}
  if(a==="imp"||a==="impAdd"){const it=parse(impTxt||($("wlTxt")||{}).value||"");if(!it.length){toast("Nichts zum Importieren gefunden");return}
    if(a==="imp"){W.lists.push({name:uniq(impName||"Import "+new Date().toLocaleDateString("de-DE")),items:it,used:Date.now()});W.cur=W.lists.length-1}else it.forEach(s=>{if(!l.items.includes(s))l.items.push(s)});
    saveW();imp=false;impTxt="";impName="";toast(it.filter(s=>!s.startsWith("###")).length+" Symbole importiert");quotes()}
  if(a==="sync"){menu=null;const pl=btoa(unescape(encodeURIComponent(JSON.stringify({l:W.lists,f:FLAG,x:FLX,n:NOTE})))),url=location.origin+location.pathname+"#wl="+pl;
    if(navigator.share)navigator.share({title:"Meine Watchlist",url}).catch(()=>{});else(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast("Link kopiert – auf dem anderen Gerät öffnen")).catch(()=>prompt("Diesen Link auf dem anderen Gerät öffnen:",url))}
  if(a==="exp"){menu=null;const t=l.items.map(s=>s.startsWith("###")?s:tvOf(s)||(typeof EX!=="undefined"&&EX.get(S.ex)?EX.get(S.ex).tv(s):S.ex==="okx"?"OKX:"+s+"USDT.P":"BINANCE:"+s+"USDT")).join(",");
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Liste kopiert – in TradingView unter „Liste importieren“ einfügen")).catch(()=>prompt("Zum Kopieren:",t))}
  draw()}
function setup(){const b=$("wlBody");
  b.addEventListener("click",e=>{const t=e.target.closest("button,[data-s]");if(!t)return;const d=t.dataset;
    if(d.a)return act(d.a);
    if(d.ls!=null){W.cur=+d.ls;L().used=Date.now();menu=null;saveW();return draw()}
    if(d.fav!=null){const x=W.lists[+d.fav];if(x){if(x.fav)delete x.fav;else x.fav=true;saveW()}return draw()}
    if(d.v){V[d.v]=!V[d.v];saveV();if(V.logo)lgLoad();return draw()}
    if(d.vg){V.grp=d.vg;saveV();return draw()}
    if(d.vc){V.cols[d.vc]=!V.cols[d.vc];saveV();return draw()}
    if(d.vn){V.nm=d.vn;saveV();return draw()}
    if(d.sort){const l=L(),o=l.sort||{k:"eigen",d:1};l.sort=o.k===d.sort&&d.sort!=="eigen"?{k:d.sort,d:-o.d}:{k:d.sort,d:d.sort==="sym"||d.sort==="flag"?1:-1};saveW();return draw()}
    if(d.ex){if(d.ex!==S.ex){S.ex=d.ex;save();Q={};S.list.k=[];loadList();load();quotes()}return draw()}
    if(d.hs){const l=L(),o=l.sort||{k:"eigen",d:1},d0=d.hs==="sym"?1:-1;l.sort=o.k!==d.hs?{k:d.hs,d:d0}:o.d===d0?{k:d.hs,d:-d0}:{k:"eigen",d:1};saveW();return draw()}
    if(d.f!=null){const f=+d.f;
      if(edit&&f>=FL0.length){const n=Object.values(FLAG).filter(v=>v===f).length;if(confirm(`Dieses eigene Fähnchen löschen?${n?` Es ist bei ${n} Symbol(en) gesetzt und wird dort entfernt.`:""}`)){FLX[f-FL0.length]=null;while(FLX.length&&FLX[FLX.length-1]==null)FLX.pop();sv("blcFlagX",FLX);mkFL();for(const s of Object.keys(FLAG))if(FLAG[s]===f)delete FLAG[s];saveF();if(filt===f)setFilt(0);if(typeof legend==="function")legend()}return draw()}
      setFilt(f);return draw()}
    if(d.fl!=null){e.stopPropagation();pop=pop===d.fl?null:d.fl;return draw()}
    if(d.note!=null){const s=d.note,t=prompt(`Notiz zu ${s} (leer = löschen):`,NOTE[s]||"");if(t!=null){if(t.trim())NOTE[s]=t.trim().slice(0,80);else delete NOTE[s];sv("blcNote",NOTE);pop=null}return draw()}
    if(d.alt!=null){const l=L(),ls=l.items.includes(d.s)?[l]:W.lists;ls.forEach(x=>swapSym(x,d.s,d.alt));saveW();saveF();sv("blcNote",NOTE);pop=null;return draw()}
    if(d.setf!=null){const k=+d.setf;if(k)FLAG[d.s]=k;else delete FLAG[d.s];saveF();pop=null;return draw()}
    if(d.rm!=null){L().items.splice(+d.rm,1);saveW();return draw()}
    if(d.mv!=null){const it=L().items,i=+d.mv,j=i+ +d.d;if(j>=0&&j<it.length){[it[i],it[j]]=[it[j],it[i]];saveW()}return draw()}
    if(d.s&&!edit&&t.classList.contains("wlRow")){if(d.y)pick(d.y,"a");else pick(d.s,"k");setTimeout(draw,50)}});
  // Logo nicht ladbar: zweite Quelle versuchen, sonst bleibt der Buchstaben-Kreis
  b.addEventListener("error",e=>{const im=e.target;if(!im||im.tagName!=="IMG"||!im.dataset.lg)return;const s=im.dataset.lg;if(!im.dataset.t2){im.dataset.t2="1";im.src=`https://assets.coincap.io/assets/icons/${encodeURIComponent(s.replace(/^\d+/,"").toLowerCase())}@2x.png`}else{BADLG.add(s);im.remove()}},true);
  // Umschalt+W öffnet das Listen-Menü
  document.addEventListener("keydown",e=>{if(e.shiftKey&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==="w"&&open()&&!e.target.closest("input,textarea,select")){e.preventDefault();menu=menu==="list"?null:"list";draw()}});
  // Ziehen zum Sortieren (Maus, im Bearbeiten-Modus)
  let dragI=-1;b.addEventListener("dragstart",e=>{const r=e.target.closest(".wlRow");if(r)dragI=+r.dataset.i});
  b.addEventListener("dragover",e=>{if(dragI>=0)e.preventDefault()});
  b.addEventListener("drop",e=>{const r=e.target.closest("[data-i]");if(dragI<0||!r)return;e.preventDefault();const it=L().items,[x]=it.splice(dragI,1);it.splice(+r.dataset.i,0,x);dragI=-1;saveW();draw()});
  // ↑/↓ wechselt das Symbol wie in TradingView
  document.addEventListener("keydown",e=>{if(e.defaultPrevented||S.sel||!open()||e.target.closest("input,textarea,select"))return;if(e.key!=="ArrowDown"&&e.key!=="ArrowUp")return;
    const rw=[...document.querySelectorAll("#wlBody .wlRow")],it=rw.map(r=>r.dataset.y||r.dataset.s);if(!it.length)return;e.preventDefault();
    let i=it.indexOf(S.sym);i=i<0?0:(i+(e.key==="ArrowDown"?1:-1)+it.length)%it.length;pick(it[i],rw[i].dataset.y?"a":"k");setTimeout(draw,50)})}
window.wlShow=()=>{draw();quotes();if(V.logo||V.sub)lgLoad()};window.wlCoinName=s=>(LG.n&&LG.n[s])||"";window.wlLists=()=>W.lists;
window.wlFlagBtn=()=>{if(S.mkt!=="k")return"";const f=FLAG[S.sym]||0;return`<button class="ovFl${f?" set":""}" id="ovFl" style="--c:${f?FL[f][0]:"transparent"}" title="Fähnchen setzen"></button>`};
document.addEventListener("click",e=>{const old=document.querySelector(".flPop");
  const b=e.target.closest("#ovFl");if(b){e.stopPropagation();if(old){old.remove();return}const r=b.getBoundingClientRect(),p=document.createElement("div");p.className="flPop";
    p.innerHTML=FL.map((x,k)=>k&&!x?"":`<button data-k="${k}" style="--c:${x?x[0]:"transparent"}" title="${x?x[1]:"Kein Fähnchen"}">${x?"":"✕"}</button>`).join("");p.style.left=(r.left+scrollX)+"px";p.style.top=(r.bottom+scrollY+6)+"px";document.body.appendChild(p);return}
  const c=e.target.closest(".flPop [data-k]");if(c){const k=+c.dataset.k;if(k)FLAG[S.sym]=k;else delete FLAG[S.sym];saveF();if(typeof legend==="function")legend();if(open())draw()}
  if(old)old.remove()},true);
// Übertragungs-Link öffnen (#wl=…)
(()=>{const m=location.hash.match(/[#&]wl=([^&]+)/);if(!m)return;try{let b64=m[1];try{b64=decodeURIComponent(b64)}catch(e){}const o=JSON.parse(decodeURIComponent(escape(atob(b64))));
  const nl=o&&okLists(o.l);
  if(nl&&nl.length&&o.one){if(confirm(`Liste „${nl[0].name}“ (${nl[0].items.filter(s=>!s.startsWith("###")).length} Symbole) zu deinen Listen hinzufügen?`)){let nm=nl[0].name,k=2;while(W.lists.some(q=>q.name===nm))nm=nl[0].name+" "+k++;nl[0].name=nm;nl[0].used=Date.now();W.lists.push(nl[0]);W.cur=W.lists.length-1;
      const f=okFlags(o.f),nt=okNotes(o.n);for(const s of Object.keys(f))if(!FLAG[s])FLAG[s]=f[s];for(const s of Object.keys(nt))if(!NOTE[s])NOTE[s]=nt[s];sv("blcNote",NOTE);saveW();saveF();toast("Liste hinzugefügt")}}
  else if(nl&&nl.length&&confirm(`Watchlist übernehmen? (${nl.length} Liste(n), ${Object.keys(okFlags(o.f)).length} Fähnchen)\nOK = ersetzt die Listen auf diesem Gerät.`)){W.lists=nl;W.cur=0;FLX=okFlx(o.x);while(FLX.length&&FLX[FLX.length-1]==null)FLX.pop();sv("blcFlagX",FLX);mkFL();FLAG=okFlags(o.f);if(o.n){NOTE=okNotes(o.n);sv("blcNote",NOTE)}setFilt(0);saveW();saveF();toast("Watchlist übernommen")}}catch(e){toast("Link ungültig")}
  history.replaceState(null,"",location.pathname+location.search)})();window.wlFlag=s=>FLAG[s]?FL[FLAG[s]][0]:null;
setup();setInterval(()=>{if(open()&&document.visibilityState==="visible")quotes()},5000);
})();
if(typeof legend==="function")try{legend()}catch(e){}
