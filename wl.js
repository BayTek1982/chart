// Watchlist wie in TradingView: mehrere Listen, Abschnitte (###), farbige Fähnchen, Kurse + Tagesänderung, Import/Export im TradingView-Format
(function(){
const FL=[null,["#f23645","Rot"],["#2962ff","Blau"],["#089981","Grün"],["#ff9800","Orange"],["#9c27b0","Lila"],["#00bcd4","Türkis"],["#e91e63","Rosa"]];
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const W=ld("blcWl",null)||{cur:0,lists:[{name:"A Krypto OKX",items:["BTC","ETH","SOL","XRP","BNB","DOGE"]}]};
const SORTS=[["eigen","Benutzerdefinierte Reihenfolge"],["sym","Nach Symbol"],["preis","Nach letztem Preis"],["ver","Nach Veränderung"],["verp","Nach Veränderung (%)"],["flag","Nach Fähnchen"],["vol","Nach Volumen"]];
let impTxt="",impName="",sortOpen=false,FLAG=ld("blcFlag",{}),filt=0,edit=false,imp=false,pop=null,Q={},qT=0,qBusy=false;
const saveW=()=>sv("blcWl",W),saveF=()=>sv("blcFlag",FLAG),L=()=>W.lists[W.cur]||W.lists[0];
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
    <div class="wlFl"><button data-f="0" class="${filt===0?"on":""}">Alle</button>${FL.slice(1).map((f,i)=>`<button data-f="${i+1}" class="dot${filt===i+1?" on":""}" style="--c:${f[0]}" title="Nur ${f[1]}"></button>`).join("")}</div>`;
  if(sortOpen){const so=l.sort||{k:"eigen",d:1};h+=`<div class="wlSort">${SORTS.map(([k,t])=>`<button data-sort="${k}" class="${so.k===k?"on":""}">${t}${so.k===k&&k!=="eigen"?(so.d>0?" ↑":" ↓"):""}</button>`).join("")}</div>`}
  if(imp)h+=`<div class="wlImp"><b>Listen</b><div class="row"><button class="btn ghost" data-a="new">Neue Liste</button><button class="btn ghost" data-a="ren">Umbenennen</button><button class="btn ghost" data-a="del">Liste löschen</button></div>
    <b>Import aus TradingView</b><p>In TradingView: Watchlist-Menü → „Liste exportieren“. Die Datei hier auswählen oder den Inhalt einfügen (z. B. <code>###KRYPTO,OKX:BTCUSDT.P,OKX:ETHUSDT.P</code>).</p>
    <textarea id="wlTxt" rows="3" placeholder="OKX:BTCUSDT.P, OKX:ETHUSDT.P …">${esc(impTxt)}</textarea><div class="row"><input type="file" id="wlFile" accept=".txt,.csv,text/plain,text/csv"><button class="btn" data-a="imp">In neue Liste importieren</button><button class="btn ghost" data-a="impAdd">Zur aktuellen Liste</button></div>
    <b>Export</b><div class="row"><button class="btn ghost" data-a="exp">Im TradingView-Format kopieren</button></div>
    <b>Auf Handy / PC übertragen</b><p>Erstellt einen Link mit allen Listen und Fähnchen. Öffne ihn auf dem anderen Gerät, dann wird alles übernommen.</p><div class="row"><button class="btn" data-a="sync">Übertragungs-Link erstellen</button></div></div>`;
  h+=`<div class="wlHd"><span>Symbol</span><span>Kurs</span><span>Tag</span></div><div class="wlRows">`;let n=0;
  const so=l.sort||{k:"eigen",d:1},sorted=so.k!=="eigen";
  const rows0=filt?[...new Set(W.lists.flatMap(x=>x.items).concat(Object.keys(FLAG)))].filter(s=>!s.startsWith("###")&&FLAG[s]===filt).sort():l.items;
  const val=s=>{const q=Q[s]||{};return so.k==="sym"?s:so.k==="preis"?q.p:so.k==="ver"?q.d:so.k==="verp"?q.ch:so.k==="flag"?(FLAG[s]||99):so.k==="vol"?q.v:0};
  const rows=sorted?rows0.filter(s=>!s.startsWith("###")).slice().sort((a,b)=>{const x=val(a),y=val(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return-1;return(typeof x==="string"?x.localeCompare(y):x-y)*so.d}):rows0;
  if(filt)h+=`<div class="wlSec">Alle mit ${FL[filt][1].toLowerCase()}em Fähnchen</div>`;
  rows.forEach((s,i)=>{if(s.startsWith("###")){if(!filt)h+=`<div class="wlSec" data-i="${i}">${esc(s.slice(3))}${edit?`<button data-rm="${i}" title="Entfernen">✕</button>`:""}</div>`;return}
    const f=FLAG[s]||0;if(filt&&f!==filt)return;n++;const q=Q[s]||{};
    h+=`<div class="wlRow${s===cur?" cur":""}" data-s="${esc(s)}" data-i="${filt||sorted?-1:l.items.indexOf(s)}" ${edit&&!filt&&!sorted?'draggable="true"':""}><button class="fl${f?" set":""}" data-fl="${esc(s)}" style="--c:${f?FL[f][0]:"transparent"}" title="Fähnchen"></button>
      <span class="sy">${esc(s)}<small>${S.ex==="okx"?".P":""}</small></span><span class="px">${q.p?CC.fmt(q.p):"–"}</span><span class="ch ${q.ch>0?"up":q.ch<0?"dn":""}">${pct(q.ch)}</span>
      ${edit&&!filt&&!sorted?`<span class="ed"><button data-mv="${i}" data-d="-1" title="Nach oben">▲</button><button data-mv="${i}" data-d="1" title="Nach unten">▼</button><button data-rm="${i}" title="Entfernen">✕</button></span>`:""}</div>`;
    if(pop===s)h+=`<div class="wlPop">${FL.map((x,k)=>`<button data-setf="${k}" data-s="${esc(s)}" class="dot" style="--c:${x?x[0]:"transparent"}" title="${x?x[1]:"Kein Fähnchen"}">${x?"":"✕"}</button>`).join("")}</div>`});
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
  if(a==="sortm")sortOpen=!sortOpen;
  if(a==="edit")edit=!edit;if(a==="more")imp=!imp;
  if(a==="new"){const n=prompt("Name der neuen Liste:","Neue Liste");if(n){W.lists.push({name:n.trim()||"Liste",items:[]});W.cur=W.lists.length-1;saveW()}}
  if(a==="ren"){const n=prompt("Neuer Name:",l.name);if(n){l.name=n.trim()||l.name;saveW()}}
  if(a==="del"){if(W.lists.length<2){toast("Die letzte Liste bleibt stehen");return}if(confirm(`Liste „${l.name}“ löschen?`)){W.lists.splice(W.cur,1);W.cur=0;saveW()}}
  if(a==="imp"||a==="impAdd"){const it=parse(impTxt||($("wlTxt")||{}).value||"");if(!it.length){toast("Nichts zum Importieren gefunden");return}
    if(a==="imp"){W.lists.push({name:impName||"Import "+new Date().toLocaleDateString("de-DE"),items:it});W.cur=W.lists.length-1}else it.forEach(s=>{if(!l.items.includes(s))l.items.push(s)});
    saveW();imp=false;impTxt="";impName="";toast(it.filter(s=>!s.startsWith("###")).length+" Symbole importiert");quotes()}
  if(a==="sync"){const pl=btoa(unescape(encodeURIComponent(JSON.stringify({l:W.lists,f:FLAG})))),url=location.origin+location.pathname+"#wl="+pl;
    if(navigator.share)navigator.share({title:"Meine Watchlist",url}).catch(()=>{});else(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast("Link kopiert – auf dem anderen Gerät öffnen")).catch(()=>prompt("Diesen Link auf dem anderen Gerät öffnen:",url))}
  if(a==="exp"){const t=l.items.map(s=>s.startsWith("###")?s:(S.ex==="okx"?"OKX:"+s+"USDT.P":"BINANCE:"+s+"USDT")).join(",");
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Liste kopiert – in TradingView unter „Liste importieren“ einfügen")).catch(()=>prompt("Zum Kopieren:",t))}
  draw()}
function setup(){const b=$("wlBody");
  b.addEventListener("click",e=>{const t=e.target.closest("button,[data-s]");if(!t)return;const d=t.dataset;
    if(d.a)return act(d.a);
    if(d.sort){const l=L(),o=l.sort||{k:"eigen",d:1};l.sort=o.k===d.sort&&d.sort!=="eigen"?{k:d.sort,d:-o.d}:{k:d.sort,d:d.sort==="sym"||d.sort==="flag"?1:-1};saveW();return draw()}
    if(d.ex){if(d.ex!==S.ex){S.ex=d.ex;save();Q={};S.list.k=[];loadList();load();quotes()}return draw()}
    if(d.f!=null){filt=+d.f;return draw()}
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
    p.innerHTML=FL.map((x,k)=>`<button data-k="${k}" style="--c:${x?x[0]:"transparent"}" title="${x?x[1]:"Kein Fähnchen"}">${x?"":"✕"}</button>`).join("");p.style.left=(r.left+scrollX)+"px";p.style.top=(r.bottom+scrollY+6)+"px";document.body.appendChild(p);return}
  const c=e.target.closest(".flPop [data-k]");if(c){const k=+c.dataset.k;if(k)FLAG[S.sym]=k;else delete FLAG[S.sym];saveF();if(typeof legend==="function")legend();if(open())draw()}
  if(old)old.remove()},true);
// Übertragungs-Link öffnen (#wl=…)
(()=>{const m=location.hash.match(/[#&]wl=([^&]+)/);if(!m)return;try{const o=JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  if(o&&Array.isArray(o.l)&&o.l.length&&confirm(`Watchlist übernehmen? (${o.l.length} Liste(n), ${Object.keys(o.f||{}).length} Fähnchen)\nOK = ersetzt die Listen auf diesem Gerät.`)){W.lists=o.l;W.cur=0;FLAG=o.f||{};saveW();saveF();toast("Watchlist übernommen")}}catch(e){toast("Link ungültig")}
  history.replaceState(null,"",location.pathname+location.search)})();window.wlFlag=s=>FLAG[s]?FL[FLAG[s]][0]:null;
setup();setInterval(()=>{if(open()&&document.visibilityState==="visible")quotes()},5000);
})();
if(typeof legend==="function")try{legend()}catch(e){}
