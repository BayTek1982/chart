// Bayazit Pattern Scanner V2.5 – Nachbau aus Tekins Pine-Code (ohne Alarme)
// Bereiche: 0/0b Schalter+Beschriftung, 1–5 Kerzenmuster, 6–8 Chart-Pattern + SFP, 9–10a Trendlinien,
// 11 S/R-Zonen, 12 Seitwärtskasten, 13 HTF-Level, 14 MTF-Trendlinien, 15 MTF-Tabelle, 16 VP-Level, 17 VP-Tabelle
var BP={R:null,hit:[],sim:null,key:"",need:[]};
(function(){
const DASH={s:[],d:[6,4],p:[2,3]},FS={winzig:9.5,klein:10.5,normal:12,gross:14};
const sec=tf=>BWSEC[tf]||0;
const fmtTF=tf=>{const s=sec(tf);return s>=604800?Math.round(s/604800)+"W":s>=86400?Math.round(s/86400)+"D":s>=3600?Math.round(s/3600)+"h":Math.round(s/60)+"m"};
function rma(src,len){const n=src.length,o=new Array(n).fill(null);let s=0,c=0,p=null;for(let i=0;i<n;i++){const v=src[i];if(v==null)continue;if(p==null){s+=v;c++;if(c===len){p=s/len;o[i]=p}}else{p=(p*(len-1)+v)/len;o[i]=p}}return o}
function ema(src,len){const n=src.length,o=new Array(n).fill(null),al=2/(len+1);let s=0,c=0,p=null;for(let i=0;i<n;i++){const v=src[i];if(p==null){s+=v;c++;if(c===len){p=s/len;o[i]=p}}else{p=al*v+(1-al)*p;o[i]=p}}return o}
function sma(src,len){const n=src.length,o=new Array(n).fill(null);let s=0;for(let i=0;i<n;i++){s+=src[i];if(i>=len)s-=src[i-len];if(i>=len-1)o[i]=s/len}return o}
function trArr(k){return k.map((q,i)=>i?Math.max(q.h-q.l,Math.abs(q.h-k[i-1].c),Math.abs(q.l-k[i-1].c)):q.h-q.l)}
function hiest(a,len){const n=a.length,o=new Array(n).fill(null);for(let i=len-1;i<n;i++){let m=-Infinity;for(let j=i-len+1;j<=i;j++)if(a[j]>m)m=a[j];o[i]=m}return o}
function loest(a,len){const n=a.length,o=new Array(n).fill(null);for(let i=len-1;i<n;i++){let m=Infinity;for(let j=i-len+1;j<=i;j++)if(a[j]<m)m=a[j];o[i]=m}return o}
// Pivot wie ta.pivothigh/-low: links darf nichts höher (tiefer) sein, rechts nichts gleich oder höher (tiefer)
function isPH(a,c,Lf,Rt){if(c-Lf<0||c+Rt>=a.length)return false;const v=a[c];for(let j=c-Lf;j<=c+Rt;j++){if(j===c)continue;if(j<c?a[j]>v:a[j]>=v)return false}return true}
function isPL(a,c,Lf,Rt){if(c-Lf<0||c+Rt>=a.length)return false;const v=a[c];for(let j=c-Lf;j<=c+Rt;j++){if(j===c)continue;if(j<c?a[j]<v:a[j]<=v)return false}return true}
function dmi(k,len){const n=k.length,tr=trArr(k),pd=new Array(n).fill(0),md=new Array(n).fill(0);
  for(let i=1;i<n;i++){const up=k[i].h-k[i-1].h,dn=k[i-1].l-k[i].l;pd[i]=up>dn&&up>0?up:0;md[i]=dn>up&&dn>0?dn:0}
  const t=rma(tr,len),p=rma(pd,len),m=rma(md,len),dx=new Array(n).fill(null);
  for(let i=0;i<n;i++){if(t[i]==null||!t[i])continue;const P=100*p[i]/t[i],M=100*m[i]/t[i],s=P+M;dx[i]=Math.abs(P-M)/(s===0?1:s)}
  const a=rma(dx,len);return a.map(v=>v==null?null:v*100)}
// Kerzen eines höheren Timeframes aus den Chart-Kerzen bauen (Ersatz, wenn nichts geladen ist)
function agg(tf){const k=S.k,s=sec(tf)*1e3,key=t=>tf==="1w"?Math.floor((Math.floor(t/864e5)+3)/7):tf==="1M"?(()=>{const d=new Date(t);return d.getUTCFullYear()*12+d.getUTCMonth()})():Math.floor(t/s);
  const o=[];let pk=null;for(const q of k){const kk=key(q.t);if(kk!==pk){o.push({t:tf==="1w"?(kk*7-3)*864e5:kk*s,o:q.o,h:q.h,l:q.l,c:q.c,v:q.v});pk=kk}else{const b=o[o.length-1];b.h=Math.max(b.h,q.h);b.l=Math.min(b.l,q.l);b.c=q.c;b.v+=q.v}}return o}
function htf(tf,need){if(tf===S.tf)return S.k;const h=typeof bfHK==="function"?bfHK(tf):null;if(h&&h.length)return h;if(SRCOK())need.push(tf);return sec(tf)>sec(S.tf)?agg(tf):null}
const tIdx=t=>bfIdx(t);

// ---------- Beschriftung (0b) ----------
function mk(c){const F=v=>CC.fmt(v);
  const gTxt=(gm,gp,kurz,voll,tf,p)=>{const m=gm==="0b"?c.lbMode:gm,pr=gp==="0b"?c.lbPr:gp==="an",t=m==="tf"?(tf||kurz):m==="kurz"?kurz:voll;return m==="aus"?"":(pr&&p!=null?t+" "+F(p):t)};
  const gSz=gs=>gs==="0b"?c.lbSz:gs;
  const gLabel=(txt,pos,x1,y1,x2,y2,col,sz,tip)=>{if(!txt)return null;const mid=pos==="m",lft=pos==="l";
    return{x:lft?x1:mid?(x1+x2)/2:x2,y:lft?y1:mid?(y1+y2)/2:y2,t:txt,col,sz,tip,pos:pos==="r"?"r":pos==="ao"?"ar":pos==="uo"?"br":mid?"a":"l"}};
  return{gTxt,gSz,gLabel,F}}

// ---------- Simulation über die abgeschlossenen Kerzen (1–12) ----------
function simulate(c,k,nc,A){const out={K:[],cp:{lns:[],lbs:[]},tl:[],tlLbs:[],tl2:[],zones:[],rng:null};const M=mk(c);
  const {atr14,volRat,adx}=A,tfOk=A.tfOk;
  const info=i=>"\nVolumen: "+(volRat[i]==null?"–":volRat[i].toFixed(1).replace(".",",")+"x Durchschnitt")+"  |  ADX: "+(adx[i]==null?"–":Math.round(adx[i]));
  const cl=i=>k[i].c,op=i=>k[i].o,hi=i=>k[i].h,lo=i=>k[i].l;
  // ===== 1–5 Kerzenmuster =====
  if(c.mK&&tfOk){const n=nc,bd=[],rg=[],uw=[],dw=[],up=[],dn=[],dj=[],big=[];
    for(let i=0;i<n;i++){const q=k[i];bd[i]=Math.abs(q.c-q.o);rg[i]=q.h-q.l;uw[i]=q.h-Math.max(q.o,q.c);dw[i]=Math.min(q.o,q.c)-q.l;up[i]=q.c>q.o;dn[i]=q.c<q.o;
      dj[i]=rg[i]>0&&bd[i]<=rg[i]*c.kDoji/100;big[i]=rg[i]>0&&atr14[i]!=null&&rg[i]>=c.kMinAtr*atr14[i]}
    const emaT=ema(k.map(q=>q.c),Math.max(2,+c.kTrLen||20)),loZ=loest(k.map(q=>q.l),+c.kZoneLen||10),hiZ=hiest(k.map(q=>q.h),+c.kZoneLen||10),wR=c.kWick/100,anyZ=c.kZone==="ueberall";
    const dCtx=(i,j)=>c.kTrend==="aus"||(emaT[i-j]!=null&&cl(i-j)<emaT[i-j]),uCtx=(i,j)=>c.kTrend==="aus"||(emaT[i-j]!=null&&cl(i-j)>emaT[i-j]);
    const strong=j=>rg[j]>0&&bd[j]>=rg[j]*.5,top=c.kPre==="top",sel=(u,t)=>top?t:u;
    const wickLo=j=>rg[j]>0&&dw[j]>=rg[j]*c.wkMin/100,wickHi=j=>rg[j]>0&&uw[j]>=rg[j]*c.wkMin/100,wDiff=(a,b)=>Math.max(a,b)>0?Math.abs(a-b)/Math.max(a,b)*100:100;
    const raw=new Array(n).fill(null);
    for(let i=4;i<n;i++){const a=atr14[i];if(a==null)continue;
      const pMin=m=>{let v=Infinity;for(let j=0;j<m;j++)v=Math.min(v,lo(i-j));return v},pMax=m=>{let v=-Infinity;for(let j=0;j<m;j++)v=Math.max(v,hi(i-j));return v};
      const zL=m=>anyZ||(loZ[i]!=null&&pMin(m)<=loZ[i]),zH=m=>anyZ||(hiZ[i]!=null&&pMax(m)>=hiZ[i]);
      const hamS=big[i]&&!dj[i]&&dw[i]>=c.kWickX*bd[i]&&uw[i]<=rg[i]*c.kTail/100,invS=big[i]&&!dj[i]&&uw[i]>=c.kWickX*bd[i]&&dw[i]<=rg[i]*c.kTail/100,spin=big[i]&&!dj[i]&&bd[i]<=rg[i]*.3&&uw[i]>=rg[i]*.25&&dw[i]>=rg[i]*.25;
      const P={};
      P.H=hamS&&dCtx(i,1)&&zL(1);P.HM=hamS&&uCtx(i,1)&&zH(1);P.IH=invS&&dCtx(i,1)&&zL(1);P.SS=invS&&uCtx(i,1)&&zH(1);
      P.DD=big[i]&&dj[i]&&uw[i]<=rg[i]*.1&&dw[i]>=rg[i]*.6&&dCtx(i,1)&&zL(1);P.GD=big[i]&&dj[i]&&dw[i]<=rg[i]*.1&&uw[i]>=rg[i]*.6&&uCtx(i,1)&&zH(1);
      P.STu=spin&&dCtx(i,1)&&zL(1);P.STd=spin&&uCtx(i,1)&&zH(1);P.MBu=up[i]&&big[i]&&bd[i]>=rg[i]*.95&&dCtx(i,1)&&zL(1);P.MBd=dn[i]&&big[i]&&bd[i]>=rg[i]*.95&&uCtx(i,1)&&zH(1);
      const eBu=!c.kRules||dw[i]>=rg[i]*wR,eBe=!c.kRules||uw[i]>=rg[i]*wR;
      P.ENu=dn[i-1]&&up[i]&&op(i)<=cl(i-1)&&cl(i)>=op(i-1)&&bd[i]>bd[i-1]&&big[i]&&eBu&&dCtx(i,2)&&zL(2);
      P.ENd=up[i-1]&&dn[i]&&op(i)>=cl(i-1)&&cl(i)<=op(i-1)&&bd[i]>bd[i-1]&&big[i]&&eBe&&uCtx(i,2)&&zH(2);
      const big1=rg[i-1]>=c.kMinAtr*a&&bd[i-1]>=rg[i-1]*.5,mid1=(op(i-1)+cl(i-1))/2;
      P.PL=dn[i-1]&&big1&&up[i]&&op(i)<=cl(i-1)+bd[i-1]*.1&&cl(i)>mid1&&cl(i)<op(i-1)&&dCtx(i,2)&&zL(2);
      P.DC=up[i-1]&&big1&&dn[i]&&op(i)>=cl(i-1)-bd[i-1]*.1&&cl(i)<mid1&&cl(i)>op(i-1)&&uCtx(i,2)&&zH(2);
      P.HAu=dn[i-1]&&big1&&up[i]&&Math.max(op(i),cl(i))<=op(i-1)&&Math.min(op(i),cl(i))>=cl(i-1)&&bd[i]<=bd[i-1]*.5&&dCtx(i,2)&&zL(2);
      P.HAd=up[i-1]&&big1&&dn[i]&&Math.max(op(i),cl(i))<=cl(i-1)&&Math.min(op(i),cl(i))>=op(i-1)&&bd[i]<=bd[i-1]*.5&&uCtx(i,2)&&zH(2);
      P.KIu=dn[i-1]&&strong(i-1)&&up[i]&&strong(i)&&op(i)>op(i-1)&&lo(i)>=op(i-1)&&big[i]&&dCtx(i,2)&&zL(2);
      P.KId=up[i-1]&&strong(i-1)&&dn[i]&&strong(i)&&op(i)<op(i-1)&&hi(i)<=op(i-1)&&big[i]&&uCtx(i,2)&&zH(2);
      const size2=Math.max(rg[i],rg[i-1])>=c.kMinAtr*a,dLo=wDiff(dw[i],dw[i-1]),dHi=wDiff(uw[i],uw[i-1]);
      P.TB=dn[i-1]&&up[i]&&Math.abs(lo(i)-lo(i-1))<=c.twTol*a&&wickLo(i-1)&&wickLo(i)&&dw[i]<=dw[i-1]*1.05&&size2&&dCtx(i,2)&&zL(2);
      P.TT=up[i-1]&&dn[i]&&Math.abs(hi(i)-hi(i-1))<=c.twTol*a&&wickHi(i-1)&&wickHi(i)&&uw[i]<=uw[i-1]*1.05&&size2&&uCtx(i,2)&&zH(2);
      P.AW=!P.TB&&dn[i-1]&&up[i]&&lo(i)>lo(i-1)&&wickLo(i-1)&&wickLo(i)&&dLo>=c.awMin&&dLo<=c.awMax&&size2&&dCtx(i,2)&&zL(2);
      P.RW=!P.TT&&up[i-1]&&dn[i]&&hi(i)<hi(i-1)&&wickHi(i-1)&&wickHi(i)&&dHi>=c.awMin&&dHi<=c.awMax&&size2&&uCtx(i,2)&&zH(2);
      const starR=!c.kRules||((uw[i]>=rg[i]*wR||dw[i]>=rg[i]*wR)&&Math.abs(cl(i)-op(i-2))>bd[i-2]*.05),big2=bd[i-2]>=rg[i-2]*.5&&rg[i-2]>=c.kMinAtr*a,small1=bd[i-1]<=bd[i-2]*.3;
      const msB=dn[i-2]&&big2&&small1&&Math.max(op(i-1),cl(i-1))<=cl(i-2)+bd[i-2]*.1&&up[i]&&cl(i)>(op(i-2)+cl(i-2))/2&&starR;
      const esB=up[i-2]&&big2&&small1&&Math.min(op(i-1),cl(i-1))>=cl(i-2)-bd[i-2]*.1&&dn[i]&&cl(i)<(op(i-2)+cl(i-2))/2&&starR;
      P.MS=msB&&!dj[i-1]&&dCtx(i,3)&&zL(3);P.MDS=msB&&dj[i-1]&&dCtx(i,3)&&zL(3);P.ES=esB&&!dj[i-1]&&uCtx(i,3)&&zH(3);P.EDS=esB&&dj[i-1]&&uCtx(i,3)&&zH(3);
      P.W3=up[i]&&up[i-1]&&up[i-2]&&cl(i)>cl(i-1)&&cl(i-1)>cl(i-2)&&op(i)>op(i-1)&&op(i)<=cl(i-1)&&op(i-1)>op(i-2)&&op(i-1)<=cl(i-2)&&strong(i)&&strong(i-1)&&strong(i-2)&&uw[i]<=rg[i]*.3&&dCtx(i,3)&&zL(3);
      P.B3=dn[i]&&dn[i-1]&&dn[i-2]&&cl(i)<cl(i-1)&&cl(i-1)<cl(i-2)&&op(i)<op(i-1)&&op(i)>=cl(i-1)&&op(i-1)<op(i-2)&&op(i-1)>=cl(i-2)&&strong(i)&&strong(i-1)&&strong(i-2)&&dw[i]<=rg[i]*.3&&uCtx(i,3)&&zH(3);
      P.L3u=dn[i-3]&&dn[i-2]&&dn[i-1]&&cl(i-1)<cl(i-2)&&cl(i-2)<cl(i-3)&&up[i]&&cl(i)>op(i-3)&&op(i)<=cl(i-1)&&zL(4);
      P.L3d=up[i-3]&&up[i-2]&&up[i-1]&&cl(i-1)>cl(i-2)&&cl(i-2)>cl(i-3)&&dn[i]&&cl(i)<op(i-3)&&op(i)>=cl(i-1)&&zH(4);
      const ls3=bd[i-1]<bd[i-2]&&bd[i-2]<bd[i-3],kz=c.kTxt==="kurz";
      const BU=[[sel(c.bAW,1),"AW","Advancing Wicks",P.AW,"Top-Setup Nr. 2"],[sel(c.bMS,1),"MS","Morning Star",P.MS,"Top-Setup Nr. 4"],[sel(c.bMDS,1),"MDS","Morning Doji Star",P.MDS,"Top-Setup Nr. 4 (Doji-Variante)"],[sel(c.bTB,1),"TB","Tweezer Bottom",P.TB,"Top-Setup Nr. 6"],
        [sel(c.bH,1),"H","Hammer",P.H,"stärkstes Einzelkerzen-Signal"],[sel(c.bDD,1),"DD","Dragonfly Doji",P.DD,"zweitstärkstes Einzelkerzen-Signal"],[sel(c.bIH,1),"IH","Inv. Hammer",P.IH,"drittstärkstes Einzelkerzen-Signal"],[sel(c.bEN,1),"BE","Bull. Engulfing",P.ENu,"starkes Umkehrsignal"],
        [sel(c.b3L,1),ls3?"3LS★":"3LS",ls3?"3 Line Strike★":"3 Line Strike",P.L3u,ls3?"stark, Kerzen werden kleiner ★":"stark"],[sel(c.bST,0),"ST","Spinning Top",P.STu,"schwach, nur Unentschlossenheit"],[sel(c.b3W,0),"3WS","3 White Soldiers",P.W3,"schwach, später Einstieg"],
        [sel(c.bPL,0),"PL","Piercing Line",P.PL,"für Krypto wenig relevant"],[sel(c.bHA,0),"HA","Harami",P.HAu,"für Krypto wenig relevant"],[sel(c.bKI,0),"KI","Kicker",P.KIu,"für Krypto wenig relevant (braucht Lücke)"],[sel(c.bMB,0),"MB","Marubozu",P.MBu,"schwach, später Einstieg"]];
      const BE=[[sel(c.sRW,1),"RW","Retracing Wicks",P.RW,"Top-Setup Nr. 1"],[sel(c.sES,1),"ES","Evening Star",P.ES,"Top-Setup Nr. 3"],[sel(c.sEDS,1),"EDS","Evening Doji Star",P.EDS,"Top-Setup Nr. 3 (Doji-Variante)"],[sel(c.sTT,1),"TT","Tweezer Top",P.TT,"Top-Setup Nr. 5"],
        [sel(c.sSS,1),"SS","Shooting Star",P.SS,"stärkstes Einzelkerzen-Signal"],[sel(c.sGD,1),"GD","Gravestone Doji",P.GD,"zweitstärkstes Einzelkerzen-Signal"],[sel(c.sHM,1),"HM","Hanging Man",P.HM,"drittstärkstes Signal, Achtung: oft bullisch, Kontext entscheidet"],[sel(c.sEN,1),"BE","Bear. Engulfing",P.ENd,"starkes Umkehrsignal"],
        [sel(c.s3L,1),ls3?"3LS★":"3LS",ls3?"3 Line Strike★":"3 Line Strike",P.L3d,ls3?"stark, Kerzen werden kleiner ★":"stark"],[sel(c.sST,0),"ST","Spinning Top",P.STd,"schwach, nur Unentschlossenheit"],[sel(c.s3B,0),"3BC","3 Black Crows",P.B3,"schwach, später Einstieg"],
        [sel(c.sDC,0),"DC","Dark Cloud Cover",P.DC,"für Krypto wenig relevant"],[sel(c.sHA,0),"HA","Harami",P.HAd,"für Krypto wenig relevant"],[sel(c.sKI,0),"KI","Kicker",P.KId,"für Krypto wenig relevant (braucht Lücke)"],[sel(c.sMB,0),"MB","Marubozu",P.MBd,"schwach, später Einstieg"]];
      const tx=L=>L.filter(x=>x[0]&&x[3]).map(x=>(kz?x[1]:x[2])+" ").join(""),tp=L=>L.filter(x=>x[0]&&x[3]).map(x=>"• "+x[2]+" – "+x[4]+"\n").join("");
      const sideOk=!c.kSide||(adx[i]!=null&&adx[i]>=c.kAdx),volOk=!c.kVolF||(volRat[i]!=null&&volRat[i]>=c.kVolX);
      raw[i]={bt:tx(BU),bp:tp(BU),st:tx(BE),sp:tp(BE),ok:sideOk&&volOk}}
    const conf=c.kConf==="best",col=(cc)=>bwA(cc,.85);
    for(let i=5;i<n;i++){
      if(conf){const r=raw[i-1];if(!r||!r.ok)continue;
        if(r.bt&&cl(i)>hi(i-1))out.K.push({x:i-1,y:lo(i-1),pos:"b",box:col(c.kBull),col:"#fff",t:r.bt.trim()+"✓",sz:c.kSz,tip:"Bullisches Kerzenmuster (bestätigt):\n"+r.bp+info(i-1).slice(1)});
        if(r.st&&cl(i)<lo(i-1))out.K.push({x:i-1,y:hi(i-1),pos:"a",box:col(c.kBear),col:"#fff",t:r.st.trim()+"✓",sz:c.kSz,tip:"Bärisches Kerzenmuster (bestätigt):\n"+r.sp+info(i-1).slice(1)})}
      else{const r=raw[i];if(!r||!r.ok)continue;
        if(r.bt)out.K.push({x:i,y:lo(i),pos:"b",box:col(c.kBull),col:"#fff",t:r.bt.trim(),sz:c.kSz,tip:"Bullisches Kerzenmuster:\n"+r.bp+info(i).slice(1)});
        if(r.st)out.K.push({x:i,y:hi(i),pos:"a",box:col(c.kBear),col:"#fff",t:r.st.trim(),sz:c.kSz,tip:"Bärisches Kerzenmuster:\n"+r.sp+info(i).slice(1)})}}
    if(out.K.length>c.kMax)out.K=out.K.slice(-c.kMax)}

  // ===== 6–8 Chart-Pattern =====
  if(c.mC&&tfOk){const P=out.cp,cPiv=+c.cPiv||8,H=k.map(q=>q.h),Lw=k.map(q=>q.l),emaF=ema(k.map(q=>q.c),+c.cTrLen||200),kz=c.cTxt==="kurz";
    const trendOk=(i,up)=>!c.cTrF||(emaF[i]!=null&&(up?cl(i)>emaF[i]:cl(i)<emaF[i]));
    const CODE={"Aufst. Dreieck":"AD","Abst. Dreieck":"ABD","Symm. Dreieck":"SD","Steigender Keil":"SK","Fallender Keil":"FK","Bull-Keilflagge":"KF","Bär-Keilflagge":"KF","Bull-Flagge":"FL","Bär-Flagge":"FL","Bull-Wimpel":"WI","Bär-Wimpel":"WI","Rechteck":"RE","Bull-Rechteck":"RE","Bär-Rechteck":"RE","Double Top":"DT","Double Bottom":"DB","Triple Top":"TT","Triple Bottom":"TB","Kopf-Schulter":"KS","Inv. Kopf-Schulter":"iKS"};
    const DESC={"Aufst. Dreieck":"Flache Oberkante, steigende Tiefs. Käufer werden aggressiver – meist Ausbruch nach OBEN.","Abst. Dreieck":"Flache Unterkante, fallende Hochs. Verkäufer drücken – meist Ausbruch nach UNTEN.","Symm. Dreieck":"Hochs fallen, Tiefs steigen. Neutral – die Richtung zeigt erst der Ausbruch.",
      "Steigender Keil":"Beide Linien steigen und laufen zusammen. Der Trend verliert Kraft – meist Ausbruch nach UNTEN.","Fallender Keil":"Beide Linien fallen und laufen zusammen. Der Abwärtsdruck lässt nach – meist Ausbruch nach OBEN.",
      "Bull-Keilflagge":"Fallender Keil nach starker Aufwärtsbewegung. Fortsetzung nach OBEN erwartet, Ziel = Fahnenstange.","Bär-Keilflagge":"Steigender Keil nach starker Abwärtsbewegung. Fortsetzung nach UNTEN erwartet, Ziel = Fahnenstange.",
      "Bull-Flagge":"Leicht fallender Kanal nach starker Aufwärtsbewegung. Fortsetzung nach OBEN erwartet.","Bär-Flagge":"Leicht steigender Kanal nach starker Abwärtsbewegung. Fortsetzung nach UNTEN erwartet.",
      "Bull-Wimpel":"Kleines Dreieck nach starker Aufwärtsbewegung. Fortsetzung nach OBEN erwartet.","Bär-Wimpel":"Kleines Dreieck nach starker Abwärtsbewegung. Fortsetzung nach UNTEN erwartet.",
      "Rechteck":"Seitwärtsphase zwischen zwei waagerechten Linien. Neutral – die Richtung zeigt erst der Ausbruch.","Bull-Rechteck":"Seitwärtsphase nach starker Aufwärtsbewegung. Fortsetzung nach OBEN wahrscheinlicher.","Bär-Rechteck":"Seitwärtsphase nach starker Abwärtsbewegung. Fortsetzung nach UNTEN wahrscheinlicher."};
    const pTxt=(nm,ar)=>(kz?CODE[nm]||nm:nm)+ar,FST=c.cFSt,BST=c.cBSt;
    const zx=[],zy=[],zt=[];const addZ=(x,y,t)=>{const m=zt.length;if(m&&zt[m-1]===t){if((t===1&&y>zy[m-1])||(t===-1&&y<zy[m-1])){zx[m-1]=x;zy[m-1]=y}}else{zx.push(x);zy.push(y);zt.push(t);if(zt.length>12){zx.shift();zy.shift();zt.shift()}}};
    const gx=j=>zx[zx.length-1-j],gy=j=>zy[zy.length-1-j],gt=j=>zt[zt.length-1-j];
    const pds=[];let tri=null,dtc=null,hsc=null,lastEnd=-1,lastPH=null,lastPHx=0,phUsed=true,lastPL=null,lastPLx=0,plUsed=true;
    const keep=()=>{while(P.lns.length>c.cKeep*8)P.lns.shift();while(P.lbs.length>c.cKeep*3)P.lbs.shift()};
    const addPD=(i,lns,lb,tgt,up,col)=>{for(const p of pds){p.tl=null;p.tlb=null}let tl=null,tlb=null;
      if(c.cTgt){tl={x1:i,y1:tgt,x2:i+(+c.cTExt||20),y2:tgt,col,w:1,dash:DASH[c.cTSt]};tlb=M.gLabel(M.gTxt(c.gzM,c.gzP,"Ziel","Kursziel","",tgt),c.gzO,i,tgt,i+(+c.cTExt||20),tgt,col,M.gSz(c.gzS))}
      if(!c.cLbl)lb.hide=true;pds.push({lns,lb,tl,tlb,tgt,up,brk:i});while(pds.length>c.cKeep)pds.shift()};
    const poleExt=(i,sx,wantLow)=>{const off=Math.max(i-sx,0);let e=wantLow?lo(i-off):hi(i-off);for(let j=off;j<=off+c.cPoleLen&&i-j>=0;j++)e=wantLow?Math.min(e,lo(i-j)):Math.max(e,hi(i-j));return e};
    for(let i=0;i<nc;i++){const a=atr14[i]||0,volC=!c.cVolF||(volRat[i]!=null&&volRat[i]>=c.cVolX);
      // Kursziel erreicht / Linien ausblenden
      for(const p of pds){if(p.tl&&(p.up?hi(i)>=p.tgt:lo(i)<=p.tgt)){p.tl=null;p.tlb=null;p.lb.t+="✓"}if(c.cFade>0&&p.lns.length&&i-p.brk>c.cFade)p.lns=[]}
      const cc=i-cPiv,ph=isPH(H,cc,cPiv,cPiv)?H[cc]:null,pl=isPL(Lw,cc,cPiv,cPiv)?Lw[cc]:null;let newPiv=false;
      if(ph!=null){addZ(cc,ph,1);newPiv=true;lastPH=ph;lastPHx=cc;phUsed=false}
      if(pl!=null){addZ(cc,pl,-1);newPiv=true;lastPL=pl;lastPLx=cc;plUsed=false}
      // SFP
      if(c.pSFP){if(!plUsed&&lastPL!=null&&i>lastPLx+cPiv){if(lo(i)<lastPL-c.sfpMin*a&&cl(i)>lastPL){plUsed=true;P.lns.push({x1:lastPLx,y1:lastPL,x2:i,y2:lastPL,col:c.cBull,w:1,dash:DASH.d});P.lbs.push({x:i,y:lo(i),pos:"b",box:bwA(c.cBull,.8),col:"#fff",t:"SFP",sz:c.cSz,tip:"SFP / Liquiditäts-Sweep (bullisch): Docht unter das letzte Swing-Tief, Schluss wieder darüber."+info(i)});keep()}else if(cl(i)<lastPL)plUsed=true}
        if(!phUsed&&lastPH!=null&&i>lastPHx+cPiv){if(hi(i)>lastPH+c.sfpMin*a&&cl(i)<lastPH){phUsed=true;P.lns.push({x1:lastPHx,y1:lastPH,x2:i,y2:lastPH,col:c.cBear,w:1,dash:DASH.d});P.lbs.push({x:i,y:hi(i),pos:"a",box:bwA(c.cBear,.8),col:"#fff",t:"SFP",sz:c.cSz,tip:"SFP / Liquiditäts-Sweep (bärisch): Docht über das letzte Swing-Hoch, Schluss wieder darunter."+info(i)});keep()}else if(cl(i)>lastPH)phUsed=true}}
      // Dreiecke / Keile / Flaggen / Wimpel / Rechtecke
      if(newPiv&&zt.length>=4&&(c.pTri||c.pWed||c.pFlag||c.pPen||c.pRect)){const hf=gt(0)===1;
        const hx2=hf?gx(0):gx(1),hy2=hf?gy(0):gy(1),hx1=hf?gx(2):gx(3),hy1=hf?gy(2):gy(3),lx2=hf?gx(1):gx(0),ly2=hf?gy(1):gy(0),lx1=hf?gx(3):gx(2),ly1=hf?gy(3):gy(2);
        if(hx2!==hx1&&lx2!==lx1&&a>0){const sH=(hy2-hy1)/(hx2-hx1),sL=(ly2-ly1)/(lx2-lx1),nH=sH/a,nL=sL/a,sx=Math.min(hx1,lx1),upS=hy1+sH*(sx-hx1),loS=ly1+sL*(sx-lx1),hgt=upS-loS;
          const flatH=Math.abs(nH)<c.cFlat,flatL=Math.abs(nL)<c.cFlat,para=Math.abs(nH-nL)<c.cPar,poleUpH=hy1-poleExt(i,sx,true),poleDnH=poleExt(i,sx,false)-ly1,poleUp=poleUpH>=c.cPole*a,poleDn=poleDnH>=c.cPole*a;
          let nm="",bias=0,fl=false;
          if(hgt>=c.cMinH*a){
            if(flatH&&flatL){if(c.pRect){if(poleUp){nm="Bull-Rechteck";bias=1}else if(poleDn){nm="Bär-Rechteck";bias=-1}else nm="Rechteck"}}
            else if(flatH&&nL>c.cFlat){if(c.pTri){nm="Aufst. Dreieck";bias=1}}
            else if(flatL&&nH<-c.cFlat){if(c.pTri){nm="Abst. Dreieck";bias=-1}}
            else if(nH<-c.cFlat&&nL>c.cFlat){if(poleUp&&c.pPen){nm="Bull-Wimpel";bias=1;fl=true}else if(poleDn&&c.pPen){nm="Bär-Wimpel";bias=-1;fl=true}else if(c.pTri)nm="Symm. Dreieck"}
            else if(nH>c.cFlat&&nL>c.cFlat){if(para){if(poleDn&&c.pFlag){nm="Bär-Flagge";bias=-1;fl=true}}else if(nL>nH&&c.pWed){nm=poleDn?"Bär-Keilflagge":"Steigender Keil";bias=-1;fl=poleDn}}
            else if(nH<-c.cFlat&&nL<-c.cFlat){if(para){if(poleUp&&c.pFlag){nm="Bull-Flagge";bias=1;fl=true}}else if(nH<nL&&c.pWed){nm=poleUp?"Bull-Keilflagge":"Fallender Keil";bias=1;fl=poleUp}}}
          const upNow=hy1+sH*(i-hx1),loNow=ly1+sL*(i-lx1),late=c.cLate&&(cl(i)>upNow||cl(i)<loNow);
          if(nm&&!late&&(!c.cNoOv||sx>lastEnd)){const col=bias===1?c.cBull:bias===-1?c.cBear:c.cNeu,vis=c.cForm;
            tri={up:{x1:sx,y1:upS,x2:i,y2:upNow,col,w:1,dash:DASH[FST],hide:!vis},lo:{x1:sx,y1:loS,x2:i,y2:loNow,col,w:1,dash:DASH[FST],hide:!vis},
              lb:{x:sx,y:upS,pos:"a",box:bwA(col,.8),col:"#fff",t:c.cLbl?pTxt(nm,""):"",sz:c.cSz,hide:!(vis&&c.cLbl),tip:nm+" (in Entstehung):\n"+DESC[nm]},
              hx1,hy1,sH,lx1,ly1,sL,bias,pole:fl?(bias===1?poleUpH:poleDnH):hgt,name:nm,born:i}}}}
      if(tri&&i>tri.born){const upNow=tri.hy1+tri.sH*(i-tri.hx1),loNow=tri.ly1+tri.sL*(i-tri.lx1);tri.up.x2=i;tri.up.y2=upNow;tri.lo.x2=i;tri.lo.y2=loNow;
        const br=cl(i)>upNow||cl(i)<loNow;
        if(br&&volC&&!trendOk(i,cl(i)>upNow))tri=null;
        else if(br&&volC){const isUp=cl(i)>upNow,col=isUp?c.cBull:c.cBear;for(const l of[tri.up,tri.lo]){l.col=col;l.dash=DASH[BST];l.hide=false}
          Object.assign(tri.lb,{box:bwA(col,.8),hide:false,t:pTxt(tri.name,isUp?"▲":"▼"),tip:tri.name+(isUp?" – Ausbruch nach OBEN":" – Ausbruch nach UNTEN")+":\n"+DESC[tri.name]+info(i)});
          addPD(i,[tri.up,tri.lo],tri.lb,isUp?cl(i)+tri.pole:cl(i)-tri.pole,isUp,col);lastEnd=i;tri=null}
        else if(upNow<=loNow||i-tri.born>c.cMaxAge)tri=null}
      // Double / Triple Top & Bottom
      if((c.pDT||c.pTT)&&newPiv&&zt.length>=3){const t0=gt(0);let made=false;
        if(c.pTT&&zt.length>=5){const ya=gy(0),yb=gy(2),yc=gy(4),mx=Math.max(ya,yb,yc),mn=Math.min(ya,yb,yc);
          if(mx-mn<=c.cEq*a){const ex=t0===1?mx:mn,nk=t0===1?Math.min(gy(1),gy(3)):Math.max(gy(1),gy(3)),lt=c.cLate&&(t0===1?cl(i)<nk:cl(i)>nk);
            if(Math.abs(ex-nk)>=c.cMinH*a&&!lt&&(!c.cNoOv||gx(4)>lastEnd)){dtc={t:t0,n:3,xs:[gx(4),gx(3),gx(2),gx(1),gx(0)],ys:[gy(4),gy(3),gy(2),gy(1),gy(0)],neck:nk,ext:ex,born:i};made=true}}}
        if(!made&&c.pDT){if(Math.abs(gy(0)-gy(2))<=c.cEq*a){const ex=t0===1?Math.max(gy(0),gy(2)):Math.min(gy(0),gy(2)),nk=gy(1),lt=c.cLate&&(t0===1?cl(i)<nk:cl(i)>nk);
            if(Math.abs(ex-nk)>=c.cMinH*a&&!lt&&(!c.cNoOv||gx(2)>lastEnd))dtc={t:t0,n:2,xs:[gx(2),gx(1),gx(0)],ys:[gy(2),gy(1),gy(0)],neck:nk,ext:ex,born:i}}}}
      if(dtc&&i>dtc.born){const top=dtc.t===1,conf=top?cl(i)<dtc.neck:cl(i)>dtc.neck,inval=(top?hi(i)>dtc.ext+c.cEq*a:lo(i)<dtc.ext-c.cEq*a)||i-dtc.born>c.cMaxAge;
        if(conf&&!trendOk(i,!top))dtc=null;
        else if(conf){const col=top?c.cBear:c.cBull,np=dtc.xs.length,dl=[];for(let j=0;j<np-1;j++)dl.push({x1:dtc.xs[j],y1:dtc.ys[j],x2:dtc.xs[j+1],y2:dtc.ys[j+1],col,w:2,dash:DASH[BST]});
          dl.push({x1:dtc.xs[0],y1:dtc.neck,x2:i,y2:dtc.neck,col,w:1,dash:DASH.d});const nm=(dtc.n===3?"Triple ":"Double ")+(top?"Top":"Bottom");
          const lb={x:dtc.xs[np-1],y:dtc.ys[np-1],pos:top?"a":"b",box:bwA(col,.8),col:"#fff",t:pTxt(nm,top?"▼":"▲"),sz:c.cSz,tip:nm+":\n"+(top?"Mehrfach am gleichen Hoch gescheitert, Nackenlinie nach unten gebrochen – Umkehr nach UNTEN.":"Mehrfach am gleichen Tief gehalten, Nackenlinie nach oben gebrochen – Umkehr nach OBEN.")+info(i)};
          const hg=Math.abs(dtc.ext-dtc.neck);addPD(i,dl,lb,top?dtc.neck-hg:dtc.neck+hg,!top,col);lastEnd=i;dtc=null}
        else if(inval)dtc=null}
      // Kopf-Schulter
      if(c.pHS&&newPiv&&zt.length>=5){const t0=gt(0),s1=gy(4),hd=gy(2),s2=gy(0),shapeOk=t0===1?hd-Math.max(s1,s2)>=.5*a:Math.min(s1,s2)-hd>=.5*a;
        if(shapeOk&&Math.abs(s1-s2)<=c.cHs*a&&gx(1)!==gx(3)){const sN=(gy(1)-gy(3))/(gx(1)-gx(3)),nAtH=gy(3)+sN*(gx(2)-gx(3)),hg=Math.abs(hd-nAtH),nN=gy(3)+sN*(i-gx(3)),lt=c.cLate&&(t0===1?cl(i)<nN:cl(i)>nN);
          if(hg>=c.cMinH*a&&!lt&&(!c.cNoOv||gx(4)>lastEnd))hsc={t:t0,x:[gx(4),gx(3),gx(2),gx(1),gx(0)],y:[gy(4),gy(3),gy(2),gy(1),gy(0)],sN,hgt:hg,born:i}}}
      if(hsc&&i>hsc.born){const top=hsc.t===1,nN=hsc.y[1]+hsc.sN*(i-hsc.x[1]),conf=top?cl(i)<nN:cl(i)>nN,inval=(top?hi(i)>hsc.y[2]:lo(i)<hsc.y[2])||i-hsc.born>c.cMaxAge;
        if(conf&&!trendOk(i,!top))hsc=null;
        else if(conf){const col=top?c.cBear:c.cBull,hl=[];for(let j=0;j<4;j++)hl.push({x1:hsc.x[j],y1:hsc.y[j],x2:hsc.x[j+1],y2:hsc.y[j+1],col,w:2,dash:DASH[BST]});hl.push({x1:hsc.x[1],y1:hsc.y[1],x2:i,y2:nN,col,w:1,dash:DASH.d});
          const nm=top?"Kopf-Schulter":"Inv. Kopf-Schulter",lb={x:hsc.x[2],y:hsc.y[2],pos:top?"a":"b",box:bwA(col,.8),col:"#fff",t:pTxt(nm,top?"▼":"▲"),sz:c.cSz,tip:(top?"Kopf-Schulter: Nackenlinie nach unten gebrochen – Umkehr nach UNTEN.":"Inverse Kopf-Schulter: Nackenlinie nach oben gebrochen – Umkehr nach OBEN.")+info(i)};
          addPD(i,hl,lb,top?nN-hsc.hgt:nN+hsc.hgt,!top,col);lastEnd=i;hsc=null}
        else if(inval)hsc=null}}
    P.pds=pds;P.tri=tri}

  // ===== 9–10 Trendlinien =====
  if(c.mT&&tfOk){const body=c.tSrc==="koerper",HS=k.map(q=>body?Math.max(q.o,q.c):q.h),LS=k.map(q=>body?Math.min(q.o,q.c):q.l),tPiv=+c.tPiv||8;
    const tls=[],Lx=[],Ly=[],Hx=[],Hy=[];const addTP=(xs,ys,x,y)=>{xs.push(x);ys.push(y);if(xs.length>25){xs.shift();ys.shift()}};
    const findTL=(i,xs,ys,dir,maxLen,minT)=>{const n=xs.length,a=atr14[i];let bx=null,bY=null,bs=null,bt=0;if(n<minT||!a)return null;const x2=xs[n-1],y2=ys[n-1];
      for(let j=n-2;j>=0;j--){const xa=xs[j],ya=ys[j];if(i-xa>maxLen)break;if((dir===1?y2>ya:y2<ya)&&x2>xa){const s=(y2-ya)/(x2-xa);let cnt=0;for(let q=j;q<n;q++)if(Math.abs(ys[q]-(ya+s*(xs[q]-xa)))<=c.tTouch*a)cnt++;
        if(cnt>=minT&&(cnt>bt||(cnt===bt&&xa<bx))){let ok=true;for(let b=xa;b<=i;b++){const li=ya+s*(b-xa);if(dir===1?cl(b)<li-c.tClose*a:cl(b)>li+c.tClose*a){ok=false;break}}if(ok){bx=xa;bY=ya;bs=s;bt=cnt}}}}
      return bx==null?null:{x:bx,y:bY,s:bs,t:bt}};
    const newTL=(i,dir,r)=>{for(let q=tls.length-1;q>=0;q--)if(tls[q].state===0&&tls[q].dir===dir)tls.splice(q,1);tls.push({x1:r.x,y1:r.y,s:r.s,dir,touches:r.t,state:0,brk:0,lastSfp:0,end:i,gray:false})};
    const showL=c.tLbl,sz=c.tLSz,TL=out.tlLbs;
    for(let i=0;i<nc;i++){const cc=i-tPiv;
      if(c.tSup&&isPL(LS,cc,tPiv,tPiv)){addTP(Lx,Ly,cc,LS[cc]);const r=findTL(i,Lx,Ly,1,c.tMaxLen,c.tMinT);if(r)newTL(i,1,r)}
      if(c.tRes&&isPH(HS,cc,tPiv,tPiv)){addTP(Hx,Hy,cc,HS[cc]);const r=findTL(i,Hx,Hy,-1,c.tMaxLen,c.tMinT);if(r)newTL(i,-1,r)}
      const a=atr14[i];if(!tls.length||!a)continue;const volT=!c.tVolF||(volRat[i]!=null&&volRat[i]>=c.tVolX);
      for(const l of tls){if(l.state>=2)continue;const v=l.y1+l.s*(i-l.x1),sup=l.dir===1,tch=l.touches+" Berührungen";l.end=i;
        if(l.state===0){const brk=sup?cl(i)<v-c.tBrk*a:cl(i)>v+c.tBrk*a;
          if(brk){if(volT){l.state=1;l.brk=i;const cB=sup?c.tResC:c.tSupC;if(showL)TL.push({x:i,y:sup?hi(i):lo(i),pos:sup?"a":"b",box:bwA(cB,.85),col:txtOn(cB),t:sup?"TL▼":"TL▲",sz,tip:sup?"Trendlinien-Ausbruch nach UNTEN:\nSteigende Unterstützung ("+tch+") per Kerzenschluss gebrochen.\nAuf einen Retest von unten achten – alte Unterstützung wird oft zum Widerstand."+info(i):"Trendlinien-Ausbruch nach OBEN:\nFallender Widerstand ("+tch+") per Kerzenschluss gebrochen.\nAuf einen Retest von oben achten – alter Widerstand wird oft zur Unterstützung."+info(i)})}
            else{l.state=2;l.gray=true}}
          else if(c.tSfp&&!l.lastSfp){const sf=sup?(lo(i)<v-c.tSfpMin*a&&cl(i)>v):(hi(i)>v+c.tSfpMin*a&&cl(i)<v);if(sf){l.lastSfp=i;const cS=sup?c.tSupC:c.tResC;if(showL)TL.push({x:i,y:sup?lo(i):hi(i),pos:sup?"b":"a",box:bwA(cS,.85),col:txtOn(cS),t:"SFP",sz,tip:(sup?"Trendlinien-SFP (bullisch):\nDocht stach unter die Unterstützung ("+tch+"), Schluss wieder darüber. Stops wurden abgeholt – die Linie hält.\nStop-Idee: unter dem Docht.":"Trendlinien-SFP (bärisch):\nDocht stach über den Widerstand ("+tch+"), Schluss wieder darunter. Stops wurden abgeholt – die Linie hält.\nStop-Idee: über dem Docht.")+info(i)})}}}
        else if(i>l.brk){const ret=sup?(hi(i)>=v-c.tRetTol*a&&cl(i)<v):(lo(i)<=v+c.tRetTol*a&&cl(i)>v),back=sup?cl(i)>v:cl(i)<v;
          if(ret){l.state=2;const cR=sup?c.tResC:c.tSupC;if(showL)TL.push({x:i,y:sup?hi(i):lo(i),pos:sup?"a":"b",box:bwA(cR,.85),col:txtOn(cR),t:"RT",sz,tip:(sup?"Retest nach Ausbruch (bärisch):\nKurs kam von unten an die gebrochene Unterstützung zurück und prallte ab. Alte Unterstützung = neuer Widerstand.\nStop-Idee: über dem Retest-Hoch.":"Retest nach Ausbruch (bullisch):\nKurs kam von oben an den gebrochenen Widerstand zurück und prallte ab. Alter Widerstand = neue Unterstützung.\nStop-Idee: unter dem Retest-Tief.")+info(i)})}
          else if(back||i-l.brk>c.tRetB)l.state=2}}
      if(c.tHide)for(let q=tls.length-1;q>=0;q--)if(tls[q].state===2)tls.splice(q,1);
      let nD=tls.filter(o=>o.state>0).length;while(nD>c.tKeep&&tls.length){const q=tls.findIndex(o=>o.state>0);if(q<0)break;tls.splice(q,1);nD--}
      while(TL.length>Math.max(c.tKeep,2)*3)TL.shift()}
    out.tl=tls;
    // 10a langfristige Ebene
    if(c.t2On){const p2=+c.t2Piv||20,lx=[],ly=[],hx=[],hy=[];let sup2=null,res2=null;
      for(let i=0;i<nc;i++){const cc=i-p2;
        if(c.tSup&&isPL(LS,cc,p2,p2)){addTP(lx,ly,cc,LS[cc]);const r=findTL(i,lx,ly,1,450,c.t2MinT);if(r)sup2={x1:r.x,y1:r.y,s:r.s,live:true,end:i,sup:true}}
        if(c.tRes&&isPH(HS,cc,p2,p2)){addTP(hx,hy,cc,HS[cc]);const r=findTL(i,hx,hy,-1,450,c.t2MinT);if(r)res2={x1:r.x,y1:r.y,s:r.s,live:true,end:i,sup:false}}
        const a=atr14[i];if(!a)continue;for(const t of[sup2,res2]){if(!t||!t.live)continue;t.end=i;const v=t.y1+t.s*(i-t.x1);if(t.sup?cl(i)<v-c.tBrk*a:cl(i)>v+c.tBrk*a)t.live=false}}
      out.tl2=[sup2,res2].filter(Boolean)}}

  // ===== 11 S/R-Zonen =====
  if(c.mS&&tfOk){const zp=+c.zPiv||10,px=[],py=[];let snap=null;
    for(let i=0;i<nc;i++){const cc=i-zp;let nw=false;if(isPH(A.H,cc,zp,zp)){px.push(cc);py.push(A.H[cc]);nw=true}if(isPL(A.L,cc,zp,zp)){px.push(cc);py.push(A.L[cc]);nw=true}
      while(px.length&&(i-px[0]>c.zLook||px.length>80)){px.shift();py.shift()}
      if(nw&&atr14[i]>0){const a=atr14[i],n=py.length,used=new Array(n).fill(false),w=c.zWid*a,Z=[];
        for(let z=0;z<c.zMax;z++){let bi=-1,bc=0;for(let q=0;q<n;q++){if(used[q])continue;let cnt=0;for(let j=0;j<n;j++)if(!used[j]&&Math.abs(py[j]-py[q])<=w)cnt++;if(cnt>bc){bc=cnt;bi=q}}
          if(bi<0||bc<c.zMinT)break;const yc=py[bi];let t=yc,b=yc,lx=i;for(let j=0;j<n;j++)if(!used[j]&&Math.abs(py[j]-yc)<=w){used[j]=true;t=Math.max(t,py[j]);b=Math.min(b,py[j]);lx=Math.min(lx,px[j])}
          if(t-b<.2*a){const m=(t+b)/2;t=m+.1*a;b=m-.1*a}Z.push({x1:lx,t,b,n:bc})}snap=Z}}
    out.zones=snap||[]}

  // ===== 12 Seitwärtskasten =====
  if(c.mR&&tfOk){const atrL=A.atr100,rLen=+c.rLen||20,hiR=hiest(A.H,rLen),loR=loest(A.L,rLen);let box=null,top=null,bot=null,st=0,brk=0,end=-1,dir=0,gone=false,fa=false;
    for(let i=0;i<nc;i++){if(atrL[i]==null)continue;const a14=atr14[i]||0,C=cl(i);
      if(c.rFa&&(st===2||st===3)&&!gone&&box&&i>brk&&i-brk<=c.rFaB&&C<top&&C>bot){fa=true;st=1;box.fa=true}
      if(st===1){let u=C>top,d=C<bot;
        if((u||d)&&c.rGrow){const nt=Math.max(top,C),nb=Math.min(bot,C);if(nt-nb<=c.rMult*atrL[i]&&(u?C-top:bot-C)<=c.rGrowTol*a14){top=nt;bot=nb;box.t=top;box.b=bot;u=d=false}}
        if(u||d){st=2;brk=i;end=i;dir=C>top?1:-1;box.x2=i;if(c.rMode==="weg"){box=null;gone=true;st=3}else if(c.rMode==="stehen")st=3}else box.x2=i}
      else if(st===2){const goOn=c.rMode==="akt"||(c.rMode==="x"&&i-brk<=c.rKeep)||c.rMode==="retest";if(goOn&&box)box.x2=i;
        if(c.rMode==="retest"&&(dir===1?lo(i)<=top:hi(i)>=bot))st=3;else if(!goOn)st=3}
      if(st!==1&&hiR[i]!=null&&hiR[i]-loR[i]<=c.rMult*atrL[i]&&i-rLen+1>end){top=hiR[i];bot=loR[i];let s0=i-rLen+1;
        if(c.rBack){const maxB=Math.min(c.rBackMax,i-1);if(maxB>=rLen)for(let q=rLen;q<=maxB;q++){const b=i-q;if(b<=end)break;if(Math.abs(cl(b)-op(b))>c.rImp*(atr14[b]||Infinity))break;
          const nt=Math.max(top,op(b),cl(b)),nb=Math.min(bot,op(b),cl(b));if(nt-nb>c.rMult*atrL[i])break;top=nt;bot=nb;s0=b}}
        fa=false;gone=false;box={x1:s0,x2:i,t:top,b:bot,fa:false};st=1}}
    out.rng=box&&!gone?box:null}
  return out}
function txtOn(c){const h=String(c).replace("#","");const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return .299*r+.587*g+.114*b>150?"#000":"#fff"}

// ---------- 14 MTF-Trendlinien: Parameter je Timeframe (tlParams) ----------
function tlParams(hk,p,cnt,body,mEnd){const lo=hk.map(q=>body?Math.min(q.o,q.c):q.l),hi=hk.map(q=>body?Math.max(q.o,q.c):q.h),lx=[],ly=[],hx=[],hy=[];
  let Sv=null,Rv=null,sS=0,rS=0;const tNext=j=>j+1<hk.length?hk[j+1].t:hk[j].t+(hk[j].t-(hk[j-1]?hk[j-1].t:hk[j].t));
  const best=(xs,ys,sup)=>{const m=ys.length;if(m<2)return null;let ia=0;for(let q=1;q<m;q++)if(sup?ys[q]<ys[ia]:ys[q]>ys[ia])ia=q;if(ia>=m-1)return null;let b=null;
    for(let j=ia+1;j<m;j++){const s=(ys[j]-ys[ia])/(xs[j]-xs[ia]);if(b==null||(sup?s<b:s>b))b=s}return{t1:xs[ia],y1:ys[ia],s:b}};
  const same=(a,b)=>(!a&&!b)||(a&&b&&a.t1===b.t1&&a.s===b.s);
  for(let j=2*p;j<=mEnd;j++){const c=j-p;
    if(isPL(lo,c,p,p)){lx.push(hk[c].t);ly.push(lo[c]);if(lx.length>cnt){lx.shift();ly.shift()}const nv=best(lx,ly,true);if(!same(nv,Sv)){Sv=nv;sS=tNext(j)}}
    if(isPH(hi,c,p,p)){hx.push(hk[c].t);hy.push(hi[c]);if(hx.length>cnt){hx.shift();hy.shift()}const nv=best(hx,hy,false);if(!same(nv,Rv)){Rv=nv;rS=tNext(j)}}}
  return{s:Sv&&{...Sv,since:sS},r:Rv&&{...Rv,since:rS}}}

// ---------- Hauptberechnung ----------
function bpsCalc(){const c=S.cfg.bps;BP.R=null;if(!c||!c.on||S.k.length<30)return;const k=S.k,n=k.length,nc=n-1,last=n-1,cs=sec(S.tf),need=[],M=mk(c),F=M.F;
  const tfOk=!c.tfMin||cs>=sec(c.tfMin);
  // Grundreihen
  const key=[S.sym,S.tf,n,k[0].t,k[nc-1].t,k[nc-1].c,S.F||1,JSON.stringify(c)].join("|");
  let A=BP.A;if(BP.key!==key||!A){const tr=trArr(k),vol=k.map(q=>q.v||0),va=sma(vol,20);
    A={H:k.map(q=>q.h),L:k.map(q=>q.l),atr14:rma(tr,14),atr100:rma(tr,100),volRat:vol.map((v,i)=>va[i]>0?v/va[i]:null),adx:dmi(k,14),tfOk};
    BP.A=A;BP.sim=simulate(c,k,nc,A);BP.key=key}
  const sim=BP.sim,a14=A.atr14[last]||A.atr14[nc-1]||0,R={Ls:[],Ts:[],Xs:[],K:sim.K,tbl:null,vt:null},C=k[last].c,tNow=k[last].t,tfMs=cs*1e3;
  // Chart-Pattern
  if(sim.cp){for(const l of sim.cp.lns)R.Ls.push(l);for(const t of sim.cp.lbs)R.Ts.push(t);for(const p of sim.cp.pds||[]){for(const l of p.lns)if(!l.hide)R.Ls.push(l);if(!p.lb.hide&&p.lb.t)R.Ts.push(p.lb);if(p.tl)R.Ls.push(p.tl);if(p.tlb)R.Ts.push(p.tlb)}
    const t=sim.cp.tri;if(t){for(const l of[t.up,t.lo])if(!l.hide)R.Ls.push({...l,x2:last,y2:l.y1+(l===t.up?t.sH:t.sL)*(last-l.x1)});if(!t.lb.hide&&t.lb.t)R.Ts.push(t.lb)}}
  // 14 MTF-Trendlinien (zuerst, weil 9 „deckungsgleich“ prüft)
  const mtf=[];const mOn=c.mM&&tfOk;
  if(mOn){const body=c.mSrc==="koerper",slots=[[c.m1On,"",c.m1St,c.m1W,c.m1Ext],[c.m2On,c.m2Tf,c.m2St,c.m2W,c.m2Ext],[c.m3On,c.m3Tf,c.m3St,c.m3W,c.m3Ext],[c.m4On,c.m4Tf,c.m4St,c.m4W,c.m4Ext],[c.m5On,c.m5Tf,c.m5St,c.m5W,c.m5Ext]];
    for(const[on,tfIn,st,w,ext]of slots){const tf=tfIn||S.tf;if(!on||(tfIn&&sec(tf)<=cs))continue;const hk=htf(tf,need);if(!hk||hk.length<2*c.mPiv+3)continue;
      const P=tlParams(hk,+c.mPiv||8,+c.mCnt||12,body,hk.length-2),nm=fmtTF(tf);
      for(const[o,dir]of[[P.s,1],[P.r,-1]]){if(!o||(dir===1?!c.mSup:!c.mRes))continue;const vNow=o.y1+o.s*(tNow-o.t1);if(!(vNow>0))continue;const sup=dir===1,col=sup?c.mSupC:c.mResC;
        const tEnd=tNow+(+ext||0)*tfMs,yEnd=o.y1+o.s*(tEnd-o.t1),x1=tIdx(o.t1),xE=last+(+ext||0);mtf.push({dir,o,tf});
        R.Ls.push({x1,y1:o.y1,x2:xE,y2:yEnd,col,w:+w||1,dash:DASH[st]});
        const lb=M.gLabel(M.gTxt(c.gmM,c.gmP,(sup?"HU ":"HW ")+nm,(sup?"Haupt-Unterstützung ":"Haupt-Widerstand ")+nm,nm,vNow),c.gmO,x1,o.y1,xE,yEnd,col,M.gSz(c.gmS),(sup?"Haupt-Unterstützung ":"Haupt-Widerstand ")+nm+": "+F(vNow));if(lb)R.Ts.push(lb);
        // Bruch / Retest für Schilder
        if(c.mLbl){let s0=0,bI=0;for(let i=0;i<nc;i++){if(k[i].t<o.since)continue;const a=A.atr14[i];if(!a)continue;const v=o.y1+o.s*(k[i].t-o.t1);
          if(s0===0&&(sup?k[i].c<v-c.tBrk*a:k[i].c>v+c.tBrk*a)){s0=1;bI=i;const cB=sup?c.mResC:c.mSupC;R.Ts.push({x:i,y:sup?k[i].h:k[i].l,pos:sup?"a":"b",box:bwA(cB,.85),col:txtOn(cB),t:nm+(sup?"▼":"▲"),sz:c.tLSz,tip:(sup?"Haupt-Unterstützung ":"Haupt-Widerstand ")+nm+(sup?" nach UNTEN gebrochen.\nDie Linie bleibt stehen – alte Unterstützung ist jetzt Widerstand. Auf einen Retest von unten achten.":" nach OBEN gebrochen.\nDie Linie bleibt stehen – alter Widerstand ist jetzt Unterstützung. Auf einen Retest von oben achten.")})}
          else if(s0===1&&i>bI){if(sup?(k[i].h>=v-c.tRetTol*a&&k[i].c<v):(k[i].l<=v+c.tRetTol*a&&k[i].c>v)){s0=2;const cR=sup?c.mResC:c.mSupC;R.Ts.push({x:i,y:sup?k[i].h:k[i].l,pos:sup?"a":"b",box:bwA(cR,.85),col:txtOn(cR),t:"RT "+nm,sz:c.tLSz,tip:"Retest der "+nm+"-Linie: Kurs kam zurück und prallte ab.\n"+(sup?"Alte Unterstützung hält jetzt als Widerstand. Stop-Idee: über dem Retest-Hoch.":"Alter Widerstand hält jetzt als Unterstützung. Stop-Idee: unter dem Retest-Tief.")})}
            else if((sup?k[i].c>v:k[i].c<v)||i-bI>c.tRetB)s0=2}}}}}}
  // 9/10 Trendlinien des Chart-TF
  for(const l of sim.tl||[]){const sup=l.dir===1,col=l.gray?"rgba(128,128,128,.6)":sup?c.tSupC:c.tResC,xe=(l.state<2?last:l.end)+(+c.tExt||0),ye=l.y1+l.s*(xe-l.x1),vNow=l.y1+l.s*((l.state<2?last:l.end)-l.x1);
    let dup=false;if(c.tDup&&mOn&&l.state<2&&last-l.x1>=0&&last-l.x1<=450){const tA=k[Math.max(0,l.x1)].t;dup=mtf.some(m=>m.dir===l.dir&&Math.abs(m.o.y1+m.o.s*(tA-m.o.t1)-l.y1)<=.5*a14&&Math.abs(m.o.y1+m.o.s*(tNow-m.o.t1)-vNow)<=.5*a14)}
    if(dup)continue;R.Ls.push({x1:l.x1,y1:l.y1,x2:xe,y2:ye,col,w:+c.tW||1,dash:DASH[l.state===0?c.tSt:c.tBSt]});
    if(l.state<2){const lb=M.gLabel(M.gTxt(c.gtM,c.gtP,"TL",sup?"Trendlinie Unterstützung":"Trendlinie Widerstand",fmtTF(S.tf),vNow),c.gtO,l.x1,l.y1,xe,ye,sup?c.tSupC:c.tResC,M.gSz(c.gtS),(sup?"Steigende Unterstützung":"Fallender Widerstand")+" ("+l.touches+" Berührungen)"+(l.state===1?" – gebrochen, Retest abwarten":""));if(lb)R.Ts.push(lb)}}
  for(const t of sim.tlLbs||[])R.Ts.push(t);
  for(const t of sim.tl2||[]){const xe=(t.live?last:t.end)+(+c.t2Ext||0),ye=t.y1+t.s*(xe-t.x1),vNow=t.y1+t.s*((t.live?last:t.end)-t.x1);
    R.Ls.push({x1:t.x1,y1:t.y1,x2:xe,y2:ye,col:c.t2C,w:+c.t2W||1,dash:DASH[t.live?c.t2St:c.t2BSt]});
    const lb=M.gLabel(M.gTxt(c.g2M,c.g2P,"LT",t.sup?"Langfristige Unterstützung":"Langfristiger Widerstand",fmtTF(S.tf),vNow),c.g2O,t.x1,t.y1,xe,ye,c.t2C,M.gSz(c.g2S));if(lb)R.Ts.push(lb)}
  // 11 Zonen
  if(sim.zones&&sim.zones.length){let iA=-1,iB=-1;sim.zones.forEach((z,i)=>{if(z.b>C&&(iA<0||z.b<sim.zones[iA].b))iA=i;if(z.t<C&&(iB<0||z.t>sim.zones[iB].t))iB=i});
    sim.zones.forEach((z,i)=>{const inZ=C<=z.t&&C>=z.b;if(!(c.zNear==="alle"||inZ||i===iA||i===iB))return;const base=C>z.t?c.zSupC:C<z.b?c.zResC:c.zInC,tr=Math.max(55,85-(z.n-c.zMinT)*8);
      R.Xs.push({x1:z.x1,x2:last+10,y1:z.t,y2:z.b,bg:bwA(base,(100-tr)/100),bc:c.zBord==="kein"?null:bwA(c.zInC,.7),dash:DASH[c.zBord]||[],txt:c.zTxt?z.n+"×":"",tcol:"#9598a1"})})}
  // 12 Seitwärtskasten
  if(sim.rng){const b=sim.rng,md=(b.t+b.b)/2,x2=b.x2===nc-1&&c.rMode!=="stehen"?last:b.x2;R.Xs.push({x1:b.x1,x2,y1:b.t,y2:b.b,bg:bwA(c.rCol,(100-c.rTr)/100),bc:b.fa?c.rFaC:bwA(c.rMidC,.4),bw:b.fa?2:1,dash:DASH[c.rBSt]});
    R.Ls.push({x1:b.x1,y1:md,x2,y2:md,col:c.rMidC,w:1,dash:DASH[c.rMSt]});const lb=M.gLabel(M.gTxt(c.grM,c.grP,b.fa?"FA Mitte":"Mitte",b.fa?"Fehlausbruch – Seitwärts-Mitte":"Seitwärts-Mitte","",md),c.grO,b.x1,md,x2,md,b.fa?c.rFaC:c.rMidC,M.gSz(c.grS));if(lb)R.Ts.push(lb)}
  // 13 HTF-Level
  if(c.mH&&tfOk&&cs<sec(c.hTf)){const hk=htf(c.hTf,need);if(hk&&hk.length>=2){let j=hk.length-1;while(j>0&&hk[j].t>tNow)j--;const pv=hk[j-1];if(pv){const x1=Math.max(0,tIdx(hk[j].t)),xe=last+(+c.hExt||0),nm=fmtTF(c.hTf);
    for(const[y,kz,vl]of[[pv.h,nm+"-H",nm+"-Hoch (Vorkerze)"],[pv.l,nm+"-T",nm+"-Tief (Vorkerze)"]]){R.Ls.push({x1,y1:y,x2:xe,y2:y,col:c.hCol,w:+c.hW||1,dash:DASH[c.hSt]});const lb=M.gLabel(M.gTxt(c.ghM,c.ghP,kz,vl,nm,y),c.ghO,x1,y,xe,y,c.hCol,M.gSz(c.ghS),vl+": "+F(y));if(lb)R.Ts.push(lb)}}}}
  // 15 MTF-Tabelle
  if(mOn&&c.tbOn){const body=c.mSrc==="koerper",rows=[];for(const tf of["5m","15m","1h","4h","1d","1w"]){const ok=sec(tf)>=cs;let sv=null,rv=null;
      if(ok){const hk=htf(tf,need);if(hk&&hk.length>2*c.mPiv+3){const P=tlParams(hk,+c.mPiv||8,+c.mCnt||12,body,hk.length-2);if(P.s)sv=P.s.y1+P.s.s*(tNow-P.s.t1);if(P.r)rv=P.r.y1+P.r.s*(tNow-P.r.t1)}
        if(sv!=null&&(sv<=0||Math.abs(sv-C)/C*100>c.tbMax))sv=null;if(rv!=null&&(rv<=0||Math.abs(rv-C)/C*100>c.tbMax))rv=null}rows.push({tf,ok,sv,rv})}R.tbl=rows}
  // 16 VP-Level
  if(c.mV&&tfOk){const P=bpVP(c,need,tNow,cs);if(P){const lv=P.lv;
      for(const s of P.sl){if(s.fill)R.Xs.push({x1:tIdx(s.st),x2:last+(+c.vpExt||0),y1:s.h,y2:s.l,bg:bwA(s.col,(100-c.vpFillT)/100)})}
      lv.forEach((L0,i)=>{if(!L0||L0.y==null)return;const x1=tIdx(L0.st),xe=last+(+c.vpExt||0);R.Ls.push({x1,y1:L0.y,x2:xe,y2:L0.y,col:L0.col,w:L0.w,dash:DASH[L0.dash]});
        if(L0.kz){const t=M.gTxt(L0.gm,L0.gp,L0.kz,L0.vz,L0.tf,L0.y);const lb=M.gLabel(t,L0.go,x1,L0.y,L0.go==="r"?xe+L0.k*(+c.vpStep||0):xe,L0.y,L0.col,M.gSz(L0.gs),L0.vz+": "+F(L0.y));if(lb)R.Ts.push(lb)}});
      R.vt=P.rows}}
  BP.need=[...new Set(need)];if(BP.need.length&&typeof bfHtfLoad==="function")bfHtfLoad(BP.need);
  BP.R=R}

// ---------- 16 Volumenprofil-Level ----------
const PNAME={tag:"laufender Tag",vtag:"Vortag",woche:"laufende Woche",vwoche:"Vorwoche","2w":"letzte 2 Wochen",monat:"laufender Monat",vmonat:"Vormonat"};
function bpVP(c,need,tNow,cs){const day=864e5,d0=Math.floor(tNow/day)*day,wk=Math.floor((Math.floor(tNow/day)+3)/7),w0=(wk*7-3)*day,dt=new Date(tNow),m0=Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth(),1),pm0=Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()-1,1);
  const X=+c.vpX||30,rng=p=>p==="tag"?[d0,Infinity]:p==="vtag"?[d0-day,d0]:p==="woche"?[w0,Infinity]:p==="vwoche"?[w0-7*day,w0]:p==="2w"?[w0-14*day,w0]:p==="monat"?[m0,Infinity]:p==="vmonat"?[pm0,m0]:[tNow-X*day,Infinity];
  const pre=p=>p==="tag"||p==="vtag"?"T":p==="woche"||p==="vwoche"?"W":p==="2w"?"2W":p==="monat"||p==="vmonat"?"M":X+"T",nm=p=>PNAME[p]||("letzte "+X+" Tage");
  const vis=p=>p==="tag"||p==="vtag"||p==="xt"?cs<86400:p==="woche"||p==="vwoche"||p==="2w"?cs<604800:cs<2592000;
  const auto=cs<=900?60:cs<=3600?300:cs<=14400?900:3600,LT=[["1m",60],["5m",300],["15m",900],["1h",3600],["4h",14400]];
  const calc=p=>{const[a,b]=rng(p),span=(tNow-a)/1e3+cs;let tf="4h";for(const[t,s]of LT)if(s>=auto&&s*990>=span){tf=t;break}
    let hk=htf(tf,need);if(!hk||!hk.length||(hk[0].t>a&&S.k[0].t<=a))hk=S.k;
    const H=[],Lw=[],V=[];let st=null;for(const q of hk){if(q.t<a||q.t>=b)continue;if(st==null)st=q.t;H.push(q.h);Lw.push(q.l);V.push(q.v||0)}
    if(!H.length)return null;const top=Math.max(...H),bot=Math.min(...Lw);if(!(top>bot))return null;const rows=+c.vpRows||60,stp=(top-bot)/rows,bins=new Array(rows).fill(0);
    for(let i=0;i<H.length;i++){const b0=Math.max(0,Math.min(rows-1,Math.floor((Lw[i]-bot)/stp))),b1=Math.max(0,Math.min(rows-1,Math.floor((H[i]-bot)/stp))),per=V[i]/(b1-b0+1);for(let q=b0;q<=b1;q++)bins[q]+=per}
    const tot=bins.reduce((x,y)=>x+y,0);if(!(tot>0))return null;let pi=0;for(let q=1;q<rows;q++)if(bins[q]>bins[pi])pi=q;let acc=bins[pi],l=pi,h=pi;
    while(acc<tot*c.vpVA/100&&(l>0||h<rows-1)){const u=h<rows-1?bins[h+1]:-1,d=l>0?bins[l-1]:-1;if(u>=d){h++;acc+=u}else{l--;acc+=d}}
    return{h:bot+(h+1)*stp,l:bot+l*stp,c:bot+(pi+.5)*stp,st:Math.max(a,st)}};
  const SL=[1,2,3,4].map(n=>({on:c["v"+n+"On"],per:c["v"+n+"Per"],fill:c["v"+n+"Fill"],col:c["v"+n+"Col"],w:+c["v"+n+"W"]||1,dash:c["v"+n+"St"],gm:c["v"+n+"M"],gs:c["v"+n+"S"],gp:c["v"+n+"P"],go:c["v"+n+"O"]}));
  const PC={on:c.vcOn,per:c.vcPer,col:c.vcCol,w:+c.vcW||1,dash:c.vcSt,gm:c.vcM,gs:c.vcS,gp:c.vcP,go:c.vcO};
  const lv=new Array(9).fill(null),sl=[],rows=[],C=S.k[S.k.length-1].c;
  SL.forEach((s,n)=>{if(!s.on||!vis(s.per))return;const r=calc(s.per);if(!r){rows.push({nm:nm(s.per),col:s.col});return}const p=pre(s.per);
    lv[n*2]={y:r.h,st:r.st,col:s.col,w:s.w,dash:s.dash,gm:s.gm,gs:s.gs,gp:s.gp,go:s.go,kz:p+"-VAH",vz:"VAH "+nm(s.per),tf:p,k:n};
    lv[n*2+1]={y:r.l,st:r.st,col:s.col,w:s.w,dash:s.dash,gm:s.gm,gs:s.gs,gp:s.gp,go:s.go,kz:p+"-VAL",vz:"VAL "+nm(s.per),tf:p,k:n};
    if(s.fill)sl.push({st:r.st,h:r.h,l:r.l,col:s.col});rows.push({nm:nm(s.per),col:s.col,h:r.h,c:r.c,l:r.l})});
  if(PC.on&&vis(PC.per)){const r=calc(PC.per);if(r){const p=pre(PC.per);lv[8]={y:r.c,st:r.st,col:PC.col,w:PC.w,dash:PC.dash,gm:PC.gm,gs:PC.gs,gp:PC.gp,go:PC.go,kz:p+"-POC",vz:"POC "+nm(PC.per),tf:p,k:4}}rows.push({nm:"POC "+nm(PC.per),col:PC.col,c:r?r.c:null,poc:true})}
  if(c.vpConf){const K=lv.map(x=>x&&x.kz),V=lv.map(x=>x&&x.vz);for(let i=0;i<8;i++){if(!lv[i]||!lv[i].kz)continue;for(let j=i+1;j<9;j++){if(!lv[j]||!lv[j].kz)continue;if(Math.abs(lv[j].y-lv[i].y)<=c.vpConfTol/100*C){lv[i].kz+="+"+K[j];lv[i].vz+=" + "+V[j];lv[j].kz="";lv[j].vz=""}}}}
  return{lv,sl,rows}}

// ---------- Zeichnen ----------
function bpsPaint(th){const c=S.cfg.bps,R=BP.R,mt=$("bpMt"),vt=$("bpVt");BP.hit=[];if(!c||!c.on||!R||!L){if(mt)mt.hidden=true;if(vt)vt.hidden=true;return}
  const X=L.X,Y=L.Y,cw=L.cw,last=S.k.length-1;
  ctx.save();ctx.beginPath();ctx.rect(0,0,L.pw,L.mainH);ctx.clip();
  for(const b of R.Xs){const x1=X(b.x1)-cw/2,x2=X(b.x2)+cw/2,y1=Y(Math.max(b.y1,b.y2)),y2=Y(Math.min(b.y1,b.y2));if(x2<0||x1>L.pw)continue;
    if(b.bg){ctx.fillStyle=b.bg;ctx.fillRect(x1,y1,x2-x1,y2-y1)}if(b.bc){ctx.strokeStyle=b.bc;ctx.lineWidth=b.bw||1;ctx.setLineDash(b.dash||[]);ctx.strokeRect(x1,y1,x2-x1,y2-y1);ctx.setLineDash([])}
    if(b.txt){ctx.font=`600 9.5px "JetBrains Mono",ui-monospace,monospace`;ctx.fillStyle=b.tcol||"#9598a1";ctx.textAlign="right";ctx.textBaseline="middle";ctx.fillText(b.txt,Math.min(x2,L.pw)-4,(y1+y2)/2)}
    if(b.tip)BP.hit.push({x:Math.max(0,x1),y:y1,w:Math.min(x2,L.pw)-Math.max(0,x1),h:Math.max(4,y2-y1),tip:b.tip,box:1})}
  for(const l of R.Ls){ctx.strokeStyle=l.col;ctx.lineWidth=l.w||1;ctx.setLineDash(l.dash||[]);ctx.beginPath();ctx.moveTo(X(l.x1),Y(l.y1));ctx.lineTo(X(l.x2),Y(l.y2));ctx.stroke()}ctx.setLineDash([]);
  ctx.textBaseline="middle";
  const edge=liveEdge(),all=R.K.concat(R.Ts).filter(t=>t&&t.t&&t.x>=L.i0-30&&t.x<=L.i1+400&&(edge||t.pos!=="r"||X(t.x)<=L.pw)),pl=[],H=L.mainH;
  // Belegte Flächen anderer Indikatoren (Beschriftungen), damit sich nichts überlagert
  const ext=(L.lbR||[]).concat(BS.hit||[],BF.hit||[],BW.hit||[]).filter(r=>r.w<L.pw*.6&&r.h<80);
  {const cr=cv.getBoundingClientRect();document.querySelectorAll("#box .ov .t,#box .ov .o,#box .ov .lg,#box .bwt:not([hidden]),#heatTab:not([hidden])").forEach(o=>{const r=o.getBoundingClientRect();if(r.width&&r.height)ext.push({x:r.left-cr.left,y:r.top-cr.top,w:r.width,h:r.height})})}
  const hitAt=(x,y,w,h)=>{for(const r of pl.concat(ext))if(x<r.x+r.w&&x+w>r.x&&y-h/2<r.y+r.h&&y+h/2>r.y)return r;return null};
  const items=all.map(t=>{const fs=FS[t.sz]||10.5;ctx.font=`600 ${fs}px "JetBrains Mono",ui-monospace,monospace`;const lines=String(t.t).split("\n"),w=Math.max(...lines.map(s=>ctx.measureText(s).width)),h=(fs+2)*lines.length,px=X(t.x),py=Y(t.y);let x,y,cl=false;
    if(t.pos==="a"){x=px-w/2;y=py-(t.box?8:5)-h/2}else if(t.pos==="b"){x=px-w/2;y=py+(t.box?8:5)+h/2}else if(t.pos==="r"){x=px+5;if(x+w>L.pw-6){x=L.pw-w-6;cl=true}y=py}else if(t.pos==="ar"){x=px-w;y=py-3-h/2}else if(t.pos==="br"){x=px-w;y=py+3+h/2}else{x=px-6-w;y=py}
    return{t,fs,lines,w,h,x,y,py,cl}}).sort((a,b)=>(a.t.box?0:1)-(b.t.box?0:1)||a.y-b.y);
  for(const it of items){const{t,fs,lines,w,h,py}=it;let y=it.y;
    let x=it.x;
    if(!t.box){const pad=2,maxD=h*3.2,find=(xx,dir)=>{let yy=it.y;for(let g=0;g<20;g++){const r=hitAt(xx-pad,yy,w+2*pad,h+pad);if(!r)return yy;yy=dir>0?r.y+r.h+h/2+pad+1:r.y-h/2-pad-1;if(Math.abs(yy-it.y)>maxD)return null}return null};
      // erst knapp über/unter der Linie, sonst entlang der Linie nach links rücken (nie weit weg vom Preis)
      let done=false;for(let sh=0;sh<1&&!done;sh++){const xx=it.x;const dn=find(xx,1),up=find(xx,-1),okD=dn!=null&&dn+h/2<H,okU=up!=null&&up-h/2>0;
        if(okD||okU){y=okD&&okU?(Math.abs(dn-it.y)<=Math.abs(up-it.y)?dn:up):okD?dn:up;x=xx;done=true}}
      if(!done){x=it.x;y=it.y}}
    pl.push({x:x-2,y:y-h/2-1,w:w+4,h:h+2});
    if(t.box){ctx.fillStyle=t.box;ctx.beginPath();ctx.roundRect?ctx.roundRect(x-4,y-h/2-2,w+8,h+4,3):ctx.rect(x-4,y-h/2-2,w+8,h+4);ctx.fill()}
    else if(it.cl||x<it.x||Math.abs(y-py)>h*.6){ctx.fillStyle=th.bg;ctx.globalAlpha=.8;ctx.fillRect(x-3,y-h/2-1,w+6,h+2);ctx.globalAlpha=1}
    lines.forEach((s,q)=>{const yy=y-h/2+(fs+2)*(q+.5);ctx.textAlign="left";if(!t.box){ctx.lineWidth=3;ctx.strokeStyle=th.bg;ctx.strokeText(s,x,yy)}ctx.fillStyle=t.col;ctx.fillText(s,x,yy)});
    if(t.tip)BP.hit.push({x:x-4,y:y-h/2-3,w:w+8,h:h+6,tip:t.tip})}
  ctx.restore();
  // Tabellen
  const cell=(t,col,bg)=>`<span style="color:${col};background:${bg||"rgba(19,23,34,.9)"};padding:1px 5px">${esc(t)}</span>`,hb="#1f3a5f",F=v=>CC.fmt(v),C=S.k[last].c,pct=v=>(v>=C?"+":"")+((v-C)/C*100).toFixed(1).replace(".",",")+" %";
  if(R.tbl&&mt){let h=["TF","Unterst.","Abst.","Widerst.","Abst."].map(t=>cell(t,"#fff",hb)).join("");
    for(const r of R.tbl){h+=cell(bwTF(r.tf),"#fff");if(!r.ok){h+=cell("–","#888")+cell("–","#888")+cell("–","#888")+cell("–","#888");continue}
      const cS=r.sv==null?"#888":r.sv<=C?"#26a69a":"#ff9800",cR=r.rv==null?"#888":r.rv>=C?"#ef5350":"#ff9800";
      h+=cell(r.sv==null?"–":F(r.sv),cS)+cell(r.sv==null?"–":pct(r.sv),cS)+cell(r.rv==null?"–":F(r.rv),cR)+cell(r.rv==null?"–":pct(r.rv),cR)}
    mt.style.gridTemplateColumns="repeat(5,auto)";mt.innerHTML=h;mt.hidden=false;bwPlace(mt,c.tbPos,0,0,c.tbSz)}else if(mt)mt.hidden=true;
  if(R.vt&&R.vt.length&&c.vtOn&&vt){const cols=["Periode","VAH","Abst."].concat(c.vtPoc?["POC","Abst."]:[],["VAL","Abst."],c.vtLage?["Lage"]:[]);let h=cols.map(t=>cell(t,"#fff",hb)).join("");
    const co=v=>v==null?"#888":v<=C?"#26a69a":"#ef5350";
    for(const r of R.vt){const H=r.poc?null:r.h,Lo=r.poc?null:r.l;h+=cell(r.nm,r.col)+cell(H==null?"–":F(H),co(H))+cell(H==null?"–":pct(H),co(H));
      if(c.vtPoc)h+=cell(r.c==null?"–":F(r.c),co(r.c))+cell(r.c==null?"–":pct(r.c),co(r.c));h+=cell(Lo==null?"–":F(Lo),co(Lo))+cell(Lo==null?"–":pct(Lo),co(Lo));
      if(c.vtLage){const lg=r.poc||H==null||Lo==null?"–":C>H?"über VA":C<Lo?"unter VA":"in VA";h+=cell(lg,lg==="über VA"?"#26a69a":lg==="unter VA"?"#ef5350":lg==="in VA"?"#fff":"#888")}}
    vt.style.gridTemplateColumns=`repeat(${cols.length},auto)`;vt.innerHTML=h;vt.hidden=false;bwPlace(vt,c.vtPos,0,0,c.vtSz)}else if(vt)vt.hidden=true}
window.bpsCalc=bpsCalc;window.bpsPaint=bpsPaint;
if(S.k&&S.k.length&&S.cfg.bps&&S.cfg.bps.on)recompute();
setInterval(()=>{if(document.visibilityState==="visible"&&S.cfg.bps&&S.cfg.bps.on&&BP.need.length)bfHtfLoad(BP.need)},60000);
})();
