// Einstellfenster für Zeichnungen (wie in TradingView): Reiter Stil, Koordinaten, Sichtbarkeit + Vorlagen.
// Öffnen: Doppelklick auf eine Zeichnung oder ⚙ in der Leiste der Zeichnung. Änderungen wirken sofort; „Abbrechen“ stellt den alten Stand wieder her.
(function(){
const NAMES={tl:"Trendlinie",hl:"Horizontale Linie",ray:"Strahl",vl:"Vertikale Linie",xl:"Kreuzlinie",rect:"Rechteck",text:"Text",fib:"Fib-Retracement",pos:"Position",measure:"Messen",chan:"Kanal",arrow:"Pfeil",ell:"Ellipse",brush:"Pinsel",fibx:"Fib-Erweiterung",prange:"Preisbereich",drange:"Datumsbereich",abc:"Wellen 0-A-B-C",w5:"Impulswelle 1-5",info:"Info-Linie",note:"Sprechblase",vpr:"Volumenprofil (Bereich)",plabel:"Preis-Label",aup:"Pfeil nach oben",adn:"Pfeil nach unten",tri:"Dreieck"};
const HEX=/^#[0-9a-f]{6}$/i,NOCOL=["pos","measure","prange","drange"],NODASH=["pos","measure","prange","drange","text","vl","note","vpr","brush","plabel","aup","adn"],AREA=["rect","ell","chan","tri"];
// weitere gängige Level, die im Fenster zum Anhaken angeboten werden
const FIBALL=[0,0.236,0.382,0.5,0.559,0.618,0.667,0.705,0.786,0.882,0.886,1,1.272,1.414,1.618,2,2.272,2.618,3.618,4.236];
const VDEF={m:[1,59],h:[1,24],d:[1,366],w:[1,52],M:[1,12]},VNAM={m:"Minuten",h:"Stunden",d:"Tage",w:"Wochen",M:"Monate"};
let cur=null,orig=null,tab="stil";
// Fenster verschieben: an der Titelzeile ziehen; die Position bleibt, solange die Seite offen ist (Doppelklick auf den Titel = zurück in die Mitte)
const POS={set:false,l:0,t:0};let mv=null;
const posCss=()=>POS.set?`position:absolute;margin:0;left:${POS.l}px;top:${POS.t}px;max-height:${Math.max(220,innerHeight-POS.t-12)}px`:"";
const el=()=>document.getElementById("dwDlg"),E=s=>esc(s);
const ld=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// benannte Vorlagen je Werkzeug
let TN=(()=>{const o={},a=ld("blcDwTN");if(a&&typeof a==="object")for(const t of Object.keys(a)){if(!/^[a-z0-9]{1,10}$/.test(t)||!a[t]||typeof a[t]!=="object")continue;o[t]={};for(const n of Object.keys(a[t]).slice(0,20))o[t][String(n).replace(/[<>"'`&]/g,"").slice(0,30)]=dwStyle(a[t][n])}return o})();
const STYLEKEYS=["col","fill","cTp","cSl","w","ds","extL","extR","lbl","bg","nolab","fpx","ftl","fext","fop","amt","lev","fs","vr","vva","lv","vis"];
const styleOf=d=>JSON.parse(JSON.stringify(dwStyle(d)));
function applyStyle(d,st){STYLEKEYS.forEach(k=>delete d[k]);delete d.ext;Object.assign(d,JSON.parse(JSON.stringify(st)));if(!HEX.test(d.col))d.col="#f0a33a";if(!d.w)d.w=2}

// ---------- Sichtbarkeit ----------
// Zeitrahmen → Einheit und Anzahl (15m → m/15, 4h → h/4, 1w → w/1, 1M → M/1)
function tfUnit(tf){if(tf==="1M")return["M",1];const ms=KSTEP[tf]||0;if(!ms)return null;if(ms<36e5)return["m",ms/6e4];if(ms<864e5)return["h",ms/36e5];if(ms<6048e5)return["d",ms/864e5];return["w",ms/6048e5]}
window.dwVis=d=>{if(!d||!d.vis)return true;const u=tfUnit(S.tf);if(!u)return true;const r=d.vis[u[0]];return!!r&&u[1]>=r[0]&&u[1]<=r[1]};

// ---------- Hilfen ----------
const num=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:null};
const pOut=p=>p==null?"":+(p*S.F).toPrecision(9),pIn=v=>{const n=num(v);return n==null?null:n/S.F};
const tOut=t=>{const d=new Date(t-new Date(t).getTimezoneOffset()*6e4);return isFinite(d.getTime())?d.toISOString().slice(0,16):""},tIn=v=>{const t=new Date(v).getTime();return isFinite(t)?t:null};
const fibDef=d=>d.type==="fibx"?CC.FIBX:CC.DFIB;
function fibRows(d){if(d.lv&&d.lv.length)return d.lv;const def=fibDef(d),all=[...new Set(def.concat(d.type==="fib"?FIBALL:FIBALL.filter(v=>v>=0)))].sort((a,b)=>a-b);return all.map(v=>({v,on:def.includes(v)}))}
const row=(t,h)=>`<div class="rw"><span>${t}</span><div>${h}</div></div>`;
const chk=(k,t,on)=>`<label class="ck"><input type="checkbox" data-k="${k}" ${on?"checked":""}> ${t}</label>`;
const colIn=(k,v,def)=>`<input type="color" data-k="${k}" value="${HEX.test(v)?v:def}">`;

// ---------- Reiter ----------
function tabStil(d){const t=d.type;let h="";
  if(!NOCOL.includes(t))h+=row(AREA.includes(t)?"Rand / Linie":"Farbe",`<div class="two">${colIn("col",d.col,"#f0a33a")}<select data-k="w" data-n="1" title="Stärke">${[1,2,3,4].map(n=>`<option value="${n}" ${+d.w===n?"selected":""}>Stärke ${n}</option>`).join("")}</select></div>`);
  if(!NODASH.includes(t))h+=row("Linienart",`<select data-k="ds"><option value="s" ${!d.ds||d.ds==="s"?"selected":""}>━ durchgezogen</option><option value="d" ${d.ds==="d"?"selected":""}>╍ gestrichelt</option><option value="p" ${d.ds==="p"?"selected":""}>┈ gepunktet</option></select>`);
  if(t==="tl"){const old=d.ext&&d.extL==null&&d.extR==null,l=d.pts[1]&&d.pts[1].t<d.pts[0].t;
    h+=row("Verlängern",`<div class="two">${chk("extL","nach links",d.extL||(old&&l))}${chk("extR","nach rechts",d.extR||(old&&!l))}</div>`)+row("Beschriftung",chk("lbl","Preis am rechten Ende",d.lbl))+row("Text an der Linie",`<input type="text" data-k="text" maxlength="80" value="${E(d.text||"")}" placeholder="optional">`)}
  if(AREA.includes(t))h+=row("Füllung",`<div class="two">${colIn("fill",d.fill,d.col||"#5b9bff")}<input type="number" data-k="fop" min="0" max="100" step="1" value="${d.fop!=null?d.fop:(t==="rect"||t==="tri"?15:t==="ell"?13:8)}" title="Deckkraft in %"></div>`)+`<div class="hint">Deckkraft der Füllung in Prozent (0 = durchsichtig).</div>`;
  if(t==="fib"||t==="fibx"){h+=row("Trendlinie",chk("ftl","gestrichelte Verbindung zeigen",d.ftl!==false))
    +row("Verlängern",`<select data-k="fext"><option value="">Nicht erweitern</option><option value="l" ${d.fext==="l"?"selected":""}>Nach links</option><option value="r" ${d.fext==="r"?"selected":""}>Nach rechts</option><option value="b" ${d.fext==="b"?"selected":""}>Beide Seiten</option></select>`)
    +row("Preise",chk("fpx","Preis hinter dem Level zeigen",d.fpx!==false));
    h+=`<div class="hint">Level: Häkchen = sichtbar · Wert als Zahl (0,618 = 61,8 %) · Farbe je Level (ohne eigene Farbe gilt die Linienfarbe)</div><div class="lvg">${fibRows(d).map((l,i)=>`<div class="lvr${l.on===false?" off":""}"><input type="checkbox" data-lv="${i}" data-f="on" ${l.on!==false?"checked":""}><input type="number" step="any" data-lv="${i}" data-f="v" value="${l.v}"><input type="color" data-lv="${i}" data-f="c" value="${HEX.test(l.c)?l.c:(HEX.test(d.col)?d.col:"#26c6da")}"></div>`).join("")}</div>
      <div class="two"><button type="button" class="btn ghost" data-a="lvAdd">＋ Level</button><button type="button" class="btn ghost" data-a="lvStd">↺ Standard-Level</button></div>`}
  if(t==="pos"){h+=row("Farbe Ziel / Stop",`<div class="two">${colIn("cTp",d.cTp,"#3ccf8a")}${colIn("cSl",d.cSl,"#ff6b5e")}</div>`)
    +row("Einsatz",`<input type="number" data-k="amt" data-n="1" min="0" step="any" value="${d.amt||""}" placeholder="z. B. 50">`)+row("Hebel",`<input type="number" data-k="lev" data-n="1" min="1" max="500" step="1" value="${d.lev||""}" placeholder="z. B. 25">`)
    +`<div class="hint">Mit Einsatz (und Hebel) zeigt die Position Gewinn am Ziel und Verlust am Stop in der Kurswährung. Leer lassen = nur Prozent und CRV.</div>`}
  if(t==="aup"||t==="adn")h+=row("Text am Pfeil",`<input type="text" data-k="text" maxlength="40" value="${E(d.text||"")}" placeholder="optional">`);
  if(t==="plabel")h+=row("Text vor dem Preis",`<input type="text" data-k="text" maxlength="40" value="${E(d.text||"")}" placeholder="optional, z. B. Einstieg">`)+row("Schriftgröße",`<input type="number" data-k="fs" data-n="1" min="8" max="40" step="1" value="${d.fs||12}">`);
  if(t==="text"||t==="note")h+=row("Text",`<input type="text" data-k="text" maxlength="80" value="${E(d.text||"")}">`)+row("Schriftgröße",`<input type="number" data-k="fs" data-n="1" min="8" max="40" step="1" value="${d.fs||(t==="note"?12:13)}">`)+(t==="text"?row("Hintergrund",chk("bg","Text hinterlegen",d.bg)):"");
  if(t==="abc"||t==="w5")h+=row("Beschriftung",chk("nolab!","Punkte beschriften (0, A, B … / 1–5)",!d.nolab));
  if(t==="vpr")h+=row("Zeilen",`<input type="number" data-k="vr" data-n="1" min="10" max="300" step="1" value="${d.vr||40}">`)+row("Value Area %",`<input type="number" data-k="vva" data-n="1" min="10" max="100" step="1" value="${d.vva||70}">`);
  if(NOCOL.includes(t)&&t!=="pos")h+=`<div class="hint">Dieses Werkzeug färbt sich selbst (blau = steigend, rot = fallend). Einstellbar sind Koordinaten und Sichtbarkeit.</div>`;
  return h}
// Kerzen-Nummer wie in TradingView: 0 = letzte Kerze, 20 = zwanzig Kerzen zurück, negative Zahl = in der Zukunft. Pfeil hoch/runter verschiebt um eine Kerze.
const bOut=t=>Math.round(S.k.length-1-CC.tIdx(S.k,t,S.tf)),bIn=v=>{const n=num(v);return n==null?null:CC.idxT(S.k,S.k.length-1-Math.round(n),S.tf)};
const dTxt=t=>{const d=new Date(t);return isFinite(d.getTime())?d.toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"–"};
function tabKoord(d){let h=`<div class="hint">Preis in ${E(typeof shownCcy==="function"?shownCcy():"$")} (verschiebt senkrecht) und Kerze (verschiebt waagerecht): 0 = letzte Kerze, 20 = zwanzig Kerzen zurück. Darunter steht der Zeitpunkt in deiner Ortszeit.</div>`;
  const pt=(lab,i,noB,noP)=>row(lab,`<div class="two">${noP?"<span></span>":`<input type="number" step="any" data-pt="${i}" data-f="p" value="${pOut(d.pts[i].p)}" title="Preis">`}${noB?"<span></span>":`<input type="number" step="1" data-pt="${i}" data-f="b" value="${bOut(d.pts[i].t)}" title="Kerze (0 = letzte)">`}</div>${noB?"":`<div class="dt" data-dt="p${i}">${dTxt(d.pts[i].t)}</div>`}`);
  if(d.type==="pos"){h+=pt("Einstieg (Preis, Kerze)",0)+row("Ziel (Preis)",`<input type="number" step="any" data-x="tp" value="${pOut(d.tp)}">`)+row("Stop (Preis)",`<input type="number" step="any" data-x="sl" value="${pOut(d.sl)}">`)+row("Ende (Kerze)",`<input type="number" step="1" data-x="t2" value="${bOut(d.t2)}" title="Kerze (0 = letzte)"><div class="dt" data-dt="t2">${dTxt(d.t2)}</div>`)}
  else if(d.type==="brush")h+=`<div class="hint">Der Pinsel hat ${d.pts.length} Punkte – verschieben geht direkt im Chart oder mit den Pfeiltasten.</div>`;
  else{const lab=d.type==="abc"?["0","A","B","C"]:d.type==="w5"?["0","1","2","3","4","5"]:d.type==="note"?["Zeiger","Textfeld"]:d.type==="vpr"?["Anfang","Ende"]:null,noP=d.type==="vl"||d.type==="vpr",noB=d.type==="hl";
    d.pts.forEach((q,i)=>{h+=pt((lab?lab[i]||"#"+(i+1):"#"+(i+1))+(noP?" (Kerze)":noB?" (Preis)":" (Preis, Kerze)"),i,noB,noP)});
    if(d.type==="chan")h+=row("Kanalbreite (Preis)",`<input type="number" step="any" data-x="off" value="${pOut(d.off)}" title="Abstand der zweiten Linie">`)}
  return h}
function tabSicht(d){const v=d.vis||VDEF,u=tfUnit(S.tf);
  return`<div class="hint">Auf welchen Zeitrahmen die Zeichnung erscheint. Beispiel: Stunden 1–4 = nur auf 1H, 2H und 4H. Aktuell: ${E(TFLAB[S.tf]||S.tf)}${u?` (${VNAM[u[0]]} ${u[1]})`:""} → ${dwVis(d)?"sichtbar":"ausgeblendet"}.</div>`
    +Object.keys(VDEF).map(k=>{const r=v[k];return`<div class="vsr${r?"":" off"}"><input type="checkbox" data-vs="${k}" data-f="on" ${r?"checked":""}><span>${VNAM[k]}</span><input type="number" min="1" step="1" data-vs="${k}" data-f="a" value="${(r||VDEF[k])[0]}"><span>–</span><input type="number" min="1" step="1" data-vs="${k}" data-f="b" value="${(r||VDEF[k])[1]}"></div>`}).join("")
    +`<button type="button" class="btn ghost" data-a="visAll">Auf allen Zeitrahmen zeigen</button>`}
function render(){const d=cur;if(!d)return;const names=Object.keys(TN[d.type]||{}),hasStd=!!DWT[d.type];
  el().innerHTML=`<div class="dd" style="${posCss()}" role="dialog" aria-label="Einstellungen der Zeichnung"><div class="dhd" title="Ziehen = Fenster verschieben · Doppelklick = zurück in die Mitte"><span>⠿ ${E(NAMES[d.type]||"Zeichnung")}</span><button type="button" data-a="x" title="Schließen (Abbrechen)">✕</button></div>
    <div class="dtab">${[["stil","Stil"],["koord","Koordinaten"],["sicht","Sichtbarkeit"]].map(([k,t])=>`<button type="button" data-tab="${k}" class="${tab===k?"on":""}">${t}</button>`).join("")}</div>
    <div class="dbd">${tab==="stil"?tabStil(d):tab==="koord"?tabKoord(d):tabSicht(d)}</div>
    <div class="dft"><select data-a="tpl" title="Vorlagen für dieses Werkzeug"><option value="">Vorlage …</option>${names.map(n=>`<option value="use:${E(n)}">▸ ${E(n)}</option>`).join("")}<option value="save">＋ Als Vorlage speichern …</option><option value="std">★ Als Standard für neue ${E(NAMES[d.type]||"")}</option>${hasStd?`<option value="std0">↺ Standard zurücksetzen</option>`:""}${names.map(n=>`<option value="del:${E(n)}">✕ „${E(n)}“ löschen</option>`).join("")}</select>
      <span class="sp"></span><button type="button" class="btn ghost" data-a="x">Abbrechen</button><button type="button" class="btn" data-a="ok">Ok</button></div></div>`}

// ---------- Öffnen / Schließen ----------
function close(save){const d=cur;if(!d)return;if(save){saveDw()}else{Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,JSON.parse(orig))}cur=null;orig=null;el().hidden=true;const b=$("ebar");if(b)b.dataset.id="";paint()}
window.dwDlgOpen=d=>{if(!d||cur)return;cur=d;orig=JSON.stringify(d);tab="stil";el().hidden=false;render()};
function upd(soft){paint();if(!soft)render()}
function onInput(e){const t=e.target,d=cur;if(!d)return;const ds=t.dataset;
  if(ds.k){let k=ds.k,inv=false;if(k.endsWith("!")){k=k.slice(0,-1);inv=true}
    if(t.type==="checkbox"){const on=inv?!t.checked:t.checked;
      if(k==="extL"||k==="extR"){const o=d.ext&&d.extL==null&&d.extR==null,l=d.pts[1]&&d.pts[1].t<d.pts[0].t;if(o){d.extL=!!l;d.extR=!l}delete d.ext;d[k]=on;if(!d.extL)delete d.extL;if(!d.extR)delete d.extR;if(d.extL==null&&d.extR==null)d.extL=false}
      else if(k==="fpx"||k==="ftl"){if(on)delete d[k];else d[k]=false}
      else{if(on)d[k]=true;else delete d[k]}}
    else if(t.type==="color"){if(HEX.test(t.value))d[k]=t.value}
    else if(ds.n){const n=num(t.value);if(n==null||(k!=="w"&&n<=0&&k!=="fop"))delete d[k];else d[k]=k==="w"?Math.max(1,Math.min(4,Math.round(n))):n;if(k==="w"&&!d.w)d.w=2}
    else if(k==="fop"){const n=num(t.value);d.fop=n==null?15:Math.max(0,Math.min(100,n))}
    else if(k==="text"){d.text=t.value.slice(0,80);if(!d.text&&(d.type==="tl"||d.type==="plabel"||d.type==="aup"||d.type==="adn"))delete d.text}
    else if(k==="ds"){if(t.value==="s")delete d.ds;else d.ds=t.value}
    else if(k==="fext"){if(t.value)d.fext=t.value;else delete d.fext}
    return upd(true)}
  if(ds.lv!=null){if(!d.lv||!d.lv.length)d.lv=fibRows(d).map(l=>({...l}));const l=d.lv[+ds.lv];if(!l)return;
    if(ds.f==="on"){l.on=t.checked;t.closest(".lvr").classList.toggle("off",!l.on)}else if(ds.f==="v"){const n=num(t.value);if(n!=null&&n>=-20&&n<=50)l.v=n}else if(ds.f==="c"&&HEX.test(t.value))l.c=t.value;
    return upd(true)}
  if(ds.pt!=null){const q=d.pts[+ds.pt];if(!q)return;if(ds.f==="p"){const n=pIn(t.value);if(n!=null)q.p=n}else{const n=bIn(t.value);if(n!=null){q.t=n;const o=el().querySelector(`[data-dt="p${+ds.pt}"]`);if(o)o.textContent=dTxt(n)}}return upd(true)}
  if(ds.x){if(ds.x==="t2"){const n=bIn(t.value);if(n!=null){d.t2=n;const o=el().querySelector('[data-dt="t2"]');if(o)o.textContent=dTxt(n)}}else{const n=pIn(t.value);if(n!=null)d[ds.x]=n}return upd(true)}
  if(ds.vs){const rows=[...el().querySelectorAll(".vsr")],v={};let all=true;rows.forEach(r=>{const k=r.querySelector("[data-f=on]").dataset.vs,on=r.querySelector("[data-f=on]").checked,a=Math.max(1,Math.round(num(r.querySelector("[data-f=a]").value)||1)),b=Math.max(a,Math.round(num(r.querySelector("[data-f=b]").value)||a));
      r.classList.toggle("off",!on);if(on)v[k]=[a,b];if(!on||a>VDEF[k][0]||b<VDEF[k][1])all=false});
    if(all)delete d.vis;else d.vis=v;return upd(true)}}
function onClick(e){const d=cur;if(!d)return;if(e.target===el()){return} // Klick neben das Fenster schließt nicht (schützt vor Versehen)
  const b=e.target.closest("[data-a],[data-tab]");if(!b)return;const a=b.dataset.a;
  if(b.dataset.tab){tab=b.dataset.tab;return render()}
  if(a==="x")return close(false);if(a==="ok")return close(true);
  if(a==="lvAdd"){if(!d.lv||!d.lv.length)d.lv=fibRows(d).map(l=>({...l}));if(d.lv.length<40)d.lv.push({v:1.618,on:true});return upd()}
  if(a==="lvStd"){delete d.lv;return upd()}
  if(a==="visAll"){delete d.vis;return upd()}}
function onChange(e){const t=e.target,d=cur;if(!d||t.dataset.a!=="tpl")return;const v=t.value;t.value="";if(!v)return;const ty=d.type;
  if(v==="save"){const n=(prompt("Name der Vorlage:","")||"").replace(/[<>"'`&]/g,"").trim().slice(0,30);if(!n)return;(TN[ty]=TN[ty]||{})[n]=styleOf(d);sv("blcDwTN",TN);toast(`Vorlage „${n}“ gespeichert`)}
  else if(v==="std"){DWT[ty]=styleOf(d);delete DWT[ty].vis;LS("blcDwT",DWT);toast("Gilt ab jetzt für neue Zeichnungen dieses Werkzeugs")}
  else if(v==="std0"){delete DWT[ty];LS("blcDwT",DWT);toast("Standard zurückgesetzt")}
  else if(v.startsWith("use:")){const st=(TN[ty]||{})[v.slice(4)];if(st){applyStyle(d,st);toast("Vorlage angewendet")}}
  else if(v.startsWith("del:")){const n=v.slice(4);if(TN[ty]&&confirm(`Vorlage „${n}“ löschen?`)){delete TN[ty][n];sv("blcDwTN",TN)}}
  upd()}
// Ziehen an der Titelzeile (Maus und Finger); das Fenster bleibt mit mindestens 60 Pixel im Bild
function clampPos(){const dd=el().querySelector(".dd");if(!dd)return;if(POS.set){const w=dd.offsetWidth;POS.l=Math.max(60-w,Math.min(innerWidth-60,POS.l));POS.t=Math.max(0,Math.min(innerHeight-50,POS.t))}dd.style.cssText=posCss()}
function mvDown(e){const hd=e.target.closest(".dhd");if(!hd||e.target.closest("button"))return;const r=el().querySelector(".dd").getBoundingClientRect();mv={x:e.clientX-r.left,y:e.clientY-r.top,id:e.pointerId};try{hd.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()}
function mvMove(e){if(!mv||e.pointerId!==mv.id)return;if(e.pointerType==="mouse"&&e.buttons===0){mv=null;return} // Maustaste außerhalb des Fensters losgelassen
  POS.set=true;POS.l=e.clientX-mv.x;POS.t=e.clientY-mv.y;clampPos()}
function mvUp(e){if(mv&&e.pointerId===mv.id)mv=null}
const box=el();if(box){box.addEventListener("pointerdown",mvDown);box.addEventListener("pointermove",mvMove);box.addEventListener("pointerup",mvUp);box.addEventListener("pointercancel",mvUp);
  box.addEventListener("dblclick",e=>{if(e.target.closest(".dhd")&&!e.target.closest("button")){POS.set=false;clampPos()}});addEventListener("resize",()=>{if(cur)clampPos()});
  box.addEventListener("input",onInput);box.addEventListener("click",onClick);box.addEventListener("change",onChange)}
addEventListener("keydown",e=>{if(!cur)return;if(e.key==="Escape"){e.stopImmediatePropagation();e.preventDefault();close(false)}else if(e.key==="Enter"&&!e.target.matches("select,button")){e.preventDefault();close(true)}else if(!e.target.closest("#dwDlg"))e.stopImmediatePropagation()},true);
})();
