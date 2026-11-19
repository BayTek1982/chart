// Watchlist wie in TradingView: mehrere Listen, Abschnitte (###), farbige Fähnchen, Kurse + Tagesänderung, Import/Export im TradingView-Format
(function(){
const FL0=[null,["#f23645","Rot"],["#2962ff","Blau"],["#089981","Grün"],["#ff9800","Orange"],["#9c27b0","Lila"],["#00bcd4","Türkis"],["#e91e63","Rosa"]];
// Eigene Fähnchen (über ＋): Farben hinter den 7 festen; ein gelöschtes bleibt als Lücke (null) stehen, damit die Nummern der anderen gleich bleiben
const okFlx=a=>(Array.isArray(a)?a:[]).slice(0,20).map(c=>typeof c==="string"&&/^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():null);
let FLX=[],FL=FL0;const mkFL=()=>{FL=FL0.concat(FLX.map(c=>c?[c,"Eigen"]:null))};
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// Listen und Fähnchen prüfen (aus dem Speicher oder aus einem Übertragungs-Link): nur Text-Symbole, Fähnchen nur 1–7 – sonst kann ein kaputter Link die Seite lahmlegen
const okLists=a=>(Array.isArray(a)?a:[]).filter(l=>l&&typeof l==="object"&&Array.isArray(l.items)).slice(0,50).map(l=>{const o={name:String(l.name||"Liste").slice(0,60),items:l.items.filter(s=>typeof s==="string"&&s).map(s=>s.startsWith("###")?"###"+s.slice(3,63):s.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20)).filter(Boolean).slice(0,1000)};
  if(l.sort&&typeof l.sort==="object"&&typeof l.sort.k==="string")o.sort={k:l.sort.k.replace(/[^a-z]/g,""),d:l.sort.d<0?-1:1};return o});
const okFlags=f=>{const o={};if(f&&typeof f==="object")for(const s of Object.keys(f)){const v=f[s];if(Number.isInteger(v)&&v>=1&&FL[v]&&/^[A-Z0-9]{1,20}$/.test(s))o[s]=v}return o};
try{FLX=okFlx(JSON.parse(localStorage.getItem("blcFlagX")))}catch(e){}mkFL();
const W=ld("blcWl",null)||{cur:0,lists:[]};W.lists=okLists(W.lists);if(!W.lists.length)W.lists=[{name:"A Krypto OKX",items:["BTC","ETH","SOL","XRP","BNB","DOGE"]}];W.cur=W.lists[+W.cur]?+W.cur:0;
const SORTS=[["eigen","Benutzerdefinierte Reihenfolge"],["sym","Nach Symbol"],["preis","Nach letztem Preis"],["ver","Nach Veränderung"],["verp","Nach Veränderung (%)"],["flag","Nach Fähnchen"],["vol","Nach Volumen"]];
let impTxt="",impName="",sortOpen=false,FLAG=okFlags(ld("blcFlag",{})),filt=+ld("blcWlFilt",0)||0,edit=false,imp=false,pop=null,Q={},qT=0,qBusy=false;
const saveW=()=>sv("blcWl",W),saveF=()=>sv("blcFlag",FLAG),L=()=>W.lists[W.cur]||W.lists[0];
if(!FL[filt])filt=0; // gewählter Fähnchen-Filter bleibt über den Neustart erhalten
const setFilt=f=>{filt=FL[f]?f:0;sv("blcWlFilt",filt)};
// Farbwähler für eigene Fähnchen (liegt außerhalb der Liste, damit er beim Neuzeichnen nicht verschwindet)
const colIn=document.createElement("input");colIn.type="color";colIn.value="#ffd600";colIn.style.cssText="position:fixed;left:50%;top:40%;width:1px;height:1px;opacity:0;pointer-events:none";document.body.appendChild(colIn);
colIn.addEventListener("change",()=>{const c=colIn.value.toLowerCase();if(FL.some(x=>x&&x[0]===c)){toast("Diese Farbe gibt es schon");return}if(FLX.filter(Boolean).length>=12){toast("Höchstens 12 eigene Fähnchen");return}
  const i=FLX.indexOf(null);if(i>=0)FLX[i]=c;else FLX.push(c);sv("blcFlagX",FLX);mkFL();toast("Neues Fähnchen angelegt");if(open())draw();if(typeof legend==="function")legend()});
// Kurse: OKX = alle Perps in einem Abruf (Änderung seit 0 Uhr UTC wie TradingView), Binance = 24h
async function quotes(){if(qBusy)return;qBusy=true;try{
  if(S.ex==="okx"){const j=await getJSON("https://www.okx.com/api/v5/market/tickers?instType=SWAP",10000);const q={};
    for(const x of j.data||[])if(/-USDT-SWAP$/.test(x.instId)){const o=+x.sodUtc0||+x.open24h;q[x.instId.slice(0,-10)]={p:+x.last,ch:o?(+x.last/o-1)*100:null,d:o?+x.last-o:null,v:+x.volCcy24h*+x.last}}Q=q}
  else{const syms=[...new Set(W.lists.flatMap(l=>l.items).filter(s=>!s.startsWith("###")))];if(syms.length){
    const j=await getJSON(`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(syms.map(s=>s+"USDT")))}`,10000).catch(async()=>{
      const a=await getJSON("https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI",15000);return a.map(x=>({symbol:x.symbol,lastPrice:x.lastPrice,priceChange:x.lastPrice-x.openPrice,quoteVolume:x.quoteVolume,priceChangePercent:x.openPrice>0?((x.lastPrice/x.openPrice-1)*100):null}))});
    const q={};for(const x of j||[])if(/USDT$/.test(x.symbol))q[x.symbol.slice(0,-4)]={p:+x.lastPrice,ch:x.priceChangePercent==null?null:+x.priceChangePercent,d:x.priceChange==null?null:+x.priceChange,v:+x.quoteVolume||0};Q=q}}
  }catch(e){}finally{qBusy=false}if(open()&&!imp)draw()}
const open=()=>!$("side").hidden&&!$("wlBody").hidden;
const pct=v=>v==null||!isFinite(v)?"–":(v>=0?"+":"")+v.toFixed(2).replace(".",",")+" %";
function draw(){const b=$("wlBody");if(!b)return;const l=L(),cur=S.sym;
  let h=`<div class="wlTop"><select id="wlSel" aria-label="Liste">${W.lists.map((x,i)=>`<option value="${i}" ${i===W.cur?"selected":""}>${esc(x.name)}</option>`).join("")}</select>
    <button class="btn ghost" data-a="add" title="Aktuelles Symbol hinzufügen">＋ ${esc(cur)}</button><button class="btn ghost${sortOpen||(l.sort&&l.sort.k!=="eigen")?" on":""}" data-a="sortm" title="Sortieren">⇅</button><button class="btn ghost${edit?" on":""}" data-a="edit" title="Bearbeiten">✎</button><button class="btn ghost${imp?" on":""}" data-a="more" title="Listen, Import, Börse">⋯</button></div>
    <div class="wlEx">Börse: <button data-ex="okx" class="${S.ex==="okx"?"on":""}">OKX Perpetual</button><button data-ex="binance" class="${S.ex==="binance"?"on":""}">Binance Spot</button>
    <span class="wlSrc">${S.src?"Chart: "+esc(S.src):""}</span></div>
    <div class="wlFl"><button data-f="0" class="${filt===0?"on":""}">Alle</button>${FL.map((f,i)=>i&&f?`<button data-f="${i}" class="dot${filt===i?" on":""}${edit&&i>=FL0.length?" del":""}" style="--c:${f[0]}" title="${edit&&i>=FL0.length?"Eigenes Fähnchen löschen":"Nur "+f[1]}">${edit&&i>=FL0.length?"✕":""}</button>`:"").join("")}<button data-a="flAdd" class="flAdd" title="Eigenes Fähnchen (Farbe) hinzufügen">＋</button></div>`;
  if(sortOpen){const so=l.sort||{k:"eigen",d:1};h+=`<div class="wlSort">${SORTS.map(([k,t])=>`<button data-sort="${k}" class="${so.k===k?"on":""}">${t}${so.k===k&&k!=="eigen"?(so.d>0?" ↑":" ↓"):""}</button>`).join("")}</div>`}
  if(imp)h+=`<div class="wlImp"><b>Listen</b><div class="row"><button class="btn ghost" data-a="new">Neue Liste</button><button class="btn ghost" data-a="ren">Umbenennen</button><button class="btn ghost" data-a="del">Liste löschen</button></div>
    <b>Import aus TradingView</b><p>In TradingView: Watchlist-Menü → „Liste exportieren“. Die Datei hier auswählen oder den Inhalt einfügen (z. B. <code>###KRYPTO,OKX:BTCUSDT.P,OKX:ETHUSDT.P</code>).</p>
    <textarea id="wlTxt" rows="3" placeholder="OKX:BTCUSDT.P, OKX:ETHUSDT.P …">${esc(impTxt)}</textarea><div class="row"><input type="file" id="wlFile" accept=".txt,.csv,text/plain,text/csv"><button class="btn" data-a="imp">In neue Liste importieren</button><button class="btn ghost" data-a="impAdd">Zur aktuellen Liste</button></div>
    <b>Export</b><div class="row"><button class="btn ghost" data-a="exp">Im TradingView-Format kopieren</button></div>
    <b>Auf Handy / PC übertragen</b><p>Erstellt einen Link mit allen Listen und Fähnchen. Öffne ihn auf dem anderen Gerät, dann wird alles übernommen.</p><div class="row"><button class="btn" data-a="sync">Übertragungs-Link erstellen</button></div></div>`;
  const so=l.sort||{k:"eigen",d:1},sorted=so.k!=="eigen";
  // Kopfzeile wie in TradingView: Spalte antippen = sortieren, noch einmal = umdrehen, drittes Mal = eigene Reihenfolge
  h+=`<div class="wlHd">${[["sym","Symbol"],["preis","Kurs"],["ver","Änd"],["verp","Änd %"]].map(([k,t])=>`<button data-hs="${k}" class="${so.k===k?"on":""}" title="Nach ${t} sortieren">${t}${so.k===k?(so.d>0?" ▲":" ▼"):""}</button>`).join("")}</div><div class="wlRows">`;let n=0;
  const rows0=filt?[...new Set(W.lists.flatMap(x=>x.items).concat(Object.keys(FLAG)))].filter(s=>!s.startsWith("###")&&FLAG[s]===filt).sort():l.items;
  const val=s=>{const q=Q[s]||{};return so.k==="sym"?s:so.k==="preis"?q.p:so.k==="ver"?q.d:so.k==="verp"?q.ch:so.k==="flag"?(FLAG[s]||99):so.k==="vol"?q.v:0};
  const rows=sorted?rows0.filter(s=>!s.startsWith("###")).slice().sort((a,b)=>{const x=val(a),y=val(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return-1;return(typeof x==="string"?x.localeCompare(y):x-y)*so.d}):rows0;
  if(filt)h+=`<div class="wlSec">Alle mit ${FL[filt][1].toLowerCase()}em Fähnchen</div>`;
  rows.forEach((s,i)=>{if(s.startsWith("###")){if(!filt)h+=`<div class="wlSec" data-i="${i}">${esc(s.slice(3))}${edit?`<button data-rm="${i}" title="Entfernen">✕</button>`:""}</div>`;return}
    const f=FLAG[s]||0;if(filt&&f!==filt)return;n++;const q=Q[s]||{};
    h+=`<div class="wlRow${s===cur?" cur":""}" data-s="${esc(s)}" data-i="${filt||sorted?-1:l.items.indexOf(s)}" ${edit&&!filt&&!sorted?'draggable="true"':""}><button class="fl${f?" set":""}" data-fl="${esc(s)}" style="--c:${f?FL[f][0]:"transparent"}" title="Fähnchen"></button>
      <span class="sy">${esc(s)}<small>${S.ex==="okx"?".P":""}</small></span><span class="px">${q.p?CC.fmt(q.p):"–"}</span><span class="ch ab ${q.ch>0?"up":q.ch<0?"dn":""}">${q.d==null||!isFinite(q.d)?"–":(q.d>=0?"+":"−")+CC.fmt(Math.abs(q.d))}</span><span class="ch ${q.ch>0?"up":q.ch<0?"dn":""}">${pct(q.ch)}</span>
      ${edit&&!filt&&!sorted?`<span class="ed"><button data-mv="${i}" data-d="-1" title="Nach oben">▲</button><button data-mv="${i}" data-d="1" title="Nach unten">▼</button><button data-rm="${i}" title="Entfernen">✕</button></span>`:""}</div>`;
    if(pop===s)h+=`<div class="wlPop">${FL.map((x,k)=>k&&!x?"":`<button data-setf="${k}" data-s="${esc(s)}" class="dot" style="--c:${x?x[0]:"transparent"}" title="${x?x[1]:"Kein Fähnchen"}">${x?"":"✕"}</button>`).join("")}</div>`});
  h+=`</div>`;if(!n)h+=`<p class="wlE">${filt?"Keine Symbole mit diesem Fähnchen.":"Noch leer – oben mit ＋ das aktuelle Symbol hinzufügen oder unter ⋯ importieren."}</p>`;
  h+=`<p class="wlE">Tipp: Antippen öffnet den Chart · Punkt links = Fähnchen · ↑/↓ wechselt das Symbol (Tastatur) · Änderung ${S.ex==="okx"?"seit 0 Uhr UTC":"24 Std."}</p>`;
  b.innerHTML=h;
  const sel=$("wlSel");if(sel)sel.onchange=()=>{W.cur=+sel.value;saveW();draw()};
  const ta=$("wlTxt");if(ta)ta.oninput=()=>{impTxt=ta.value};
  // Datei gewählt → sofort als neue Liste importieren (Name = Dateiname)
  const fi=$("wlFile");if(fi)fi.onchange=async()=>{const f=fi.files[0];if(!f)return;impTxt=await f.text();impName=f.name.replace(/\.(txt|csv)$/i,"");act("imp")}}
function parse(t){const out=[];for(let x of String(t).split(/[,\n\r;]+/)){x=x.trim();if(!x)continue;if(x.startsWith("###")){out.push("###"+x.slice(3).trim());continue}
    x=x.replace(/^[A-Z0-9_]+:/i,"").replace(/\.P$/i,"").toUpperCase().replace(/(USDT|USDC|USD|PERP)$/,"").replace(/[^A-Z0-9]/g,"");if(x&&!out.includes(x))out.push(x)}return out}
function act(a){const l=L();
  if(a==="add"){if(!l.items.includes(S.sym)){l.items.push(S.sym);saveW();quotes()}else toast(S.sym+" ist schon in der Liste")}
  if(a==="flAdd"){colIn.click();return}
  if(a==="sortm")sortOpen=!sortOpen;
  if(a==="edit")edit=!edit;if(a==="more")imp=!imp;
  if(a==="new"){const n=prompt("Name der neuen Liste:","Neue Liste");if(n){W.lists.push({name:n.trim()||"Liste",items:[]});W.cur=W.lists.length-1;saveW()}}
  if(a==="ren"){const n=prompt("Neuer Name:",l.name);if(n){l.name=n.trim()||l.name;saveW()}}
  if(a==="del"){if(W.lists.length<2){toast("Die letzte Liste bleibt stehen");return}if(confirm(`Liste „${l.name}“ löschen?`)){W.lists.splice(W.cur,1);W.cur=0;saveW()}}
  if(a==="imp"||a==="impAdd"){const it=parse(impTxt||($("wlTxt")||{}).value||"");if(!it.length){toast("Nichts zum Importieren gefunden");return}
    if(a==="imp"){W.lists.push({name:impName||"Import "+new Date().toLocaleDateString("de-DE"),items:it});W.cur=W.lists.length-1}else it.forEach(s=>{if(!l.items.includes(s))l.items.push(s)});
    saveW();imp=false;impTxt="";impName="";toast(it.filter(s=>!s.startsWith("###")).length+" Symbole importiert");quotes()}
  if(a==="sync"){const pl=btoa(unescape(encodeURIComponent(JSON.stringify({l:W.lists,f:FLAG,x:FLX})))),url=location.origin+location.pathname+"#wl="+pl;
    if(navigator.share)navigator.share({title:"Meine Watchlist",url}).catch(()=>{});else(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast("Link kopiert – auf dem anderen Gerät öffnen")).catch(()=>prompt("Diesen Link auf dem anderen Gerät öffnen:",url))}
  if(a==="exp"){const t=l.items.map(s=>s.startsWith("###")?s:(S.ex==="okx"?"OKX:"+s+"USDT.P":"BINANCE:"+s+"USDT")).join(",");
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Liste kopiert – in TradingView unter „Liste importieren“ einfügen")).catch(()=>prompt("Zum Kopieren:",t))}
  draw()}
function setup(){const b=$("wlBody");
  b.addEventListener("click",e=>{const t=e.target.closest("button,[data-s]");if(!t)return;const d=t.dataset;
    if(d.a)return act(d.a);
    if(d.sort){const l=L(),o=l.sort||{k:"eigen",d:1};l.sort=o.k===d.sort&&d.sort!=="eigen"?{k:d.sort,d:-o.d}:{k:d.sort,d:d.sort==="sym"||d.sort==="flag"?1:-1};saveW();return draw()}
    if(d.ex){if(d.ex!==S.ex){S.ex=d.ex;save();Q={};S.list.k=[];loadList();load();quotes()}return draw()}
    if(d.hs){const l=L(),o=l.sort||{k:"eigen",d:1},d0=d.hs==="sym"?1:-1;l.sort=o.k!==d.hs?{k:d.hs,d:d0}:o.d===d0?{k:d.hs,d:-d0}:{k:"eigen",d:1};saveW();return draw()}
    if(d.f!=null){const f=+d.f;
      if(edit&&f>=FL0.length){const n=Object.values(FLAG).filter(v=>v===f).length;if(confirm(`Dieses eigene Fähnchen löschen?${n?` Es ist bei ${n} Symbol(en) gesetzt und wird dort entfernt.`:""}`)){FLX[f-FL0.length]=null;while(FLX.length&&FLX[FLX.length-1]==null)FLX.pop();sv("blcFlagX",FLX);mkFL();for(const s of Object.keys(FLAG))if(FLAG[s]===f)delete FLAG[s];saveF();if(filt===f)setFilt(0);if(typeof legend==="function")legend()}return draw()}
      setFilt(f);return draw()}
    if(d.fl!=null){e.stopPropagation();pop=pop===d.fl?null:d.fl;return draw()}
    if(d.setf!=null){const k=+d.setf;if(k)FLAG[d.s]=k;else delete FLAG[d.s];saveF();pop=null;return draw()}
    if(d.rm!=null){L().items.splice(+d.rm,1);saveW();return draw()}
    if(d.mv!=null){const it=L().items,i=+d.mv,j=i+ +d.d;if(j>=0&&j<it.length){[it[i],it[j]]=[it[j],it[i]];saveW()}return draw()}
    if(d.s&&!edit&&t.classList.contains("wlRow")){pick(d.s,"k");setTimeout(draw,50)}});
  // Ziehen zum Sortieren (Maus, im Bearbeiten-Modus)
  let dragI=-1;b.addEventListener("dragstart",e=>{const r=e.target.closest(".wlRow");if(r)dragI=+r.dataset.i});
  b.addEventListener("dragover",e=>{if(dragI>=0)e.preventDefault()});
  b.addEventListener("drop",e=>{const r=e.target.closest("[data-i]");if(dragI<0||!r)return;e.preventDefault();const it=L().items,[x]=it.splice(dragI,1);it.splice(+r.dataset.i,0,x);dragI=-1;saveW();draw()});
  // ↑/↓ wechselt das Symbol wie in TradingView
  document.addEventListener("keydown",e=>{if(e.defaultPrevented||S.sel||!open()||e.target.closest("input,textarea,select"))return;if(e.key!=="ArrowDown"&&e.key!=="ArrowUp")return;
    const it=[...document.querySelectorAll("#wlBody .wlRow")].map(r=>r.dataset.s);if(!it.length)return;e.preventDefault();
    let i=it.indexOf(S.sym);i=i<0?0:(i+(e.key==="ArrowDown"?1:-1)+it.length)%it.length;pick(it[i],"k");setTimeout(draw,50)})}
window.wlShow=()=>{draw();quotes()};
window.wlFlagBtn=()=>{if(S.mkt!=="k")return"";const f=FLAG[S.sym]||0;return`<button class="ovFl${f?" set":""}" id="ovFl" style="--c:${f?FL[f][0]:"transparent"}" title="Fähnchen setzen"></button>`};
document.addEventListener("click",e=>{const old=document.querySelector(".flPop");
  const b=e.target.closest("#ovFl");if(b){e.stopPropagation();if(old){old.remove();return}const r=b.getBoundingClientRect(),p=document.createElement("div");p.className="flPop";
    p.innerHTML=FL.map((x,k)=>k&&!x?"":`<button data-k="${k}" style="--c:${x?x[0]:"transparent"}" title="${x?x[1]:"Kein Fähnchen"}">${x?"":"✕"}</button>`).join("");p.style.left=(r.left+scrollX)+"px";p.style.top=(r.bottom+scrollY+6)+"px";document.body.appendChild(p);return}
  const c=e.target.closest(".flPop [data-k]");if(c){const k=+c.dataset.k;if(k)FLAG[S.sym]=k;else delete FLAG[S.sym];saveF();if(typeof legend==="function")legend();if(open())draw()}
  if(old)old.remove()},true);
// Übertragungs-Link öffnen (#wl=…)
(()=>{const m=location.hash.match(/[#&]wl=([^&]+)/);if(!m)return;try{const o=JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  const nl=o&&okLists(o.l);if(nl&&nl.length&&confirm(`Watchlist übernehmen? (${nl.length} Liste(n), ${Object.keys(okFlags(o.f)).length} Fähnchen)\nOK = ersetzt die Listen auf diesem Gerät.`)){W.lists=nl;W.cur=0;FLX=okFlx(o.x);while(FLX.length&&FLX[FLX.length-1]==null)FLX.pop();sv("blcFlagX",FLX);mkFL();FLAG=okFlags(o.f);setFilt(0);saveW();saveF();toast("Watchlist übernommen")}}catch(e){toast("Link ungültig")}
  history.replaceState(null,"",location.pathname+location.search)})();window.wlFlag=s=>FLAG[s]?FL[FLAG[s]][0]:null;
setup();setInterval(()=>{if(open()&&document.visibilityState==="visible")quotes()},5000);
})();
if(typeof legend==="function")try{legend()}catch(e){}
