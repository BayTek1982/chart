// Geteilte Ansicht: 1, 2, 3, 4 oder 6 Charts gleichzeitig (jedes Fenster eigener Coin + Zeitrahmen)
(function(){
if(SLOT)return;
const LAY=[["1","1 Chart",[[0,0,2,2]]],["2v","2 nebeneinander",[[0,0,1,2],[1,0,1,2]]],["2h","2 übereinander",[[0,0,2,1],[0,1,2,1]]],
  ["3","3 Charts",[[0,0,1,2],[1,0,1,1],[1,1,1,1]]],["4","4 Charts",[[0,0,1,1],[1,0,1,1],[0,1,1,1],[1,1,1,1]]],["6","6 Charts",null]];
let cur=LS("blcLayout")||"1";
const icon=k=>{const L=LAY.find(x=>x[0]===k);let r="";
  if(k==="6"){for(let y=0;y<2;y++)for(let x=0;x<3;x++)r+=`<rect x="${1+x*11}" y="${1+y*11}" width="10" height="10" rx="1.5"/>`}
  else for(const[x,y,w,h]of L[2])r+=`<rect x="${1+x*16.5}" y="${1+y*11}" width="${w*16.5-1.5}" height="${h*11-1.5}" rx="1.5"/>`;
  return`<svg viewBox="0 0 34 24" fill="currentColor" opacity=".8">${r}</svg>`};
function apply(){const sp=$("split"),n=cur==="1"?0:cur==="6"?6:cur==="4"?4:cur==="3"?3:2;
  document.documentElement.classList.toggle("split",n>0);
  if(!n){sp.hidden=true;sp.innerHTML="";const b=$("splitBar");if(b)b.remove();try{paint()}catch(e){}return}
  const cols=cur==="2h"?"1fr":cur==="6"?"1fr 1fr 1fr":"1fr 1fr",rows=cur==="2v"?"1fr":"1fr 1fr";
  sp.style.gridTemplateColumns=cols;sp.style.gridTemplateRows=rows;
  const have=[...sp.querySelectorAll("iframe")];
  if(have.length!==n){sp.innerHTML="";for(let i=1;i<=n;i++){const f=document.createElement("iframe");f.src=location.pathname+"?slot="+i;f.title="Chart "+i;sp.appendChild(f)}}
  const fr=[...sp.querySelectorAll("iframe")];fr.forEach(f=>{f.style.gridRow="";f.style.gridColumn=""});
  if(cur==="3"&&fr[0])fr[0].style.gridRow="1 / span 2";
  sp.hidden=false;
  if(!$("splitBar")){const b=document.createElement("div");b.id="splitBar";b.innerHTML=`<button class="btn" id="splitLay" title="Layout ändern">▦ Layout</button>`;document.body.appendChild(b);$("splitLay").onclick=e=>menu(e.currentTarget)}
  // Hauptseite braucht im geteilten Modus keine eigene Live-Verbindung
  try{wsStop()}catch(e){}}
function menu(btn){const m=$("layMenu");if(!m.hidden){m.hidden=true;return}
  m.innerHTML=LAY.map(([k,t])=>`<button data-lay="${k}" class="${cur===k?"on":""}">${icon(k)}<span>${t}</span></button>`).join("");
  const r=btn.getBoundingClientRect();m.hidden=false;const mw=m.offsetWidth,mh=m.offsetHeight;
  m.style.left=Math.max(6,Math.min(innerWidth-mw-6,r.right-mw))+"px";m.style.top=(r.bottom+mh+6>innerHeight?Math.max(6,r.top-mh-6):r.bottom+6)+"px"}
$("layMenu").addEventListener("click",e=>{const b=e.target.closest("[data-lay]");if(!b)return;cur=b.dataset.lay;LS("blcLayout",cur);$("layMenu").hidden=true;
  const was=document.documentElement.classList.contains("split");apply();if(was&&cur==="1"){try{load()}catch(e){}}
  toast(cur==="1"?"Ein Chart":"Geteilte Ansicht – jedes Fenster hat eigenen Coin und Zeitrahmen")});
document.addEventListener("pointerdown",e=>{const m=$("layMenu");if(!m.hidden&&!e.target.closest("#layMenu,#layBtn,#splitLay"))m.hidden=true});
$("layBtn").onclick=e=>menu(e.currentTarget);
apply();
})();
