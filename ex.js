// Weitere Börsen (zusätzlich zu OKX Perpetual und Binance Spot, die in index.html fest eingebaut sind).
// Jede Börse ist ein kleiner Baustein mit denselben vier Aufgaben:
//   kl(sym,tf,limit,endTime) → Kerzen [{t,o,h,l,c,v,b?}] aufsteigend (b = Käufer-Volumen, falls die Börse es liefert)
//   tick()                   → alle Märkte mit Kurs und Tagesänderung [{s,p,o,ch,d,v,h,l,g?,n?}]
//   ws                       → Live-Kerzen: url(sym,tf), sub(sock,sym,tf), ping(sock), msg(daten,sym,tf) → Kerze oder null
//   tv(sym)                  → Symbol für den TradingView-Link
// Die Datei hat keine Abhängigkeiten und wird auch von boersen-test.html benutzt (prüft im eigenen Browser, welche Börse erreichbar ist).
"use strict";
const EX=(()=>{
async function gj(u,ms=15000,opt){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(u,Object.assign({signal:c.signal},opt||{}));if(!r.ok){const e=new Error("HTTP "+r.status);e.status=r.status;throw e}return await r.json()}finally{clearTimeout(t)}}
const pj=(u,body,ms)=>gj(u,ms,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const MS={"1m":6e4,"3m":18e4,"5m":3e5,"15m":9e5,"30m":18e5,"1h":36e5,"2h":72e5,"4h":144e5,"12h":432e5,"1d":864e5,"1w":6048e5,"1M":2592e6};
const num=v=>{const n=+v;return isFinite(n)?n:null};
const asc=a=>{const m=new Map();a.forEach(x=>{if(x&&x.t>0&&x.c>0)m.set(x.t,x)});return[...m.values()].sort((a,b)=>a.t-b.t)};
// Märkte, die keine Kryptowährung sind, an bekannten Kürzeln erkennen (nur für die Beschriftung in der Suche)
const FX=/^(EUR|GBP|AUD|NZD|CAD|CHF|JPY|USDJPY|USDCHF|USDCAD|EURUSD|GBPUSD|AUDUSD|NZDUSD|EURJPY|GBPJPY|EURGBP)$/,MET=/^(XAU|XAUT|PAXG|XAG|XPT|XPD|GOLD|SILVER|COPPER|WTI|BRENT|OIL|USOIL|UKOIL|NATGAS|CL)$/,IDX=/^(SPX|SPX500|SP500|US500|NDX|NAS100|NASDAQ100|US100|US30|DJI|DAX|GER40|DE40|UK100|JP225|NIKKEI|HK50|VIX|DXY|USDX)$/;
const grp=s=>FX.test(s)?"Forex":MET.test(s)?"Rohstoff":IDX.test(s)?"Index":"";
const chg=(p,o)=>({ch:o>0?(p/o-1)*100:null,d:o>0?p-o:null});

// ---------- Bybit (USDT-Perpetuals) ----------
const BYI={"1m":"1","3m":"3","5m":"5","15m":"15","30m":"30","1h":"60","2h":"120","4h":"240","12h":"720","1d":"D","1w":"W","1M":"M"};
const bybit={id:"bybit",name:"Bybit Perp",short:"Bybit",perp:true,tfs:Object.keys(BYI),tv:s=>"BYBIT:"+s+"USDT.P",
  async kl(sym,tf,limit,end){const j=await gj(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${sym}USDT&interval=${BYI[tf]}&limit=${Math.min(1000,limit||1000)}${end?"&end="+end:""}`);
    if(j.retCode!==0||!j.result||!Array.isArray(j.result.list))return[];return asc(j.result.list.map(r=>({t:+r[0],o:+r[1],h:+r[2],l:+r[3],c:+r[4],v:+r[5]})))},
  async tick(){const j=await gj("https://api.bybit.com/v5/market/tickers?category=linear");return((j.result&&j.result.list)||[]).filter(x=>/USDT$/.test(x.symbol)).map(x=>{const s=x.symbol.slice(0,-4),p=+x.lastPrice,o=+x.prevPrice24h;return{s,p,o,...chg(p,o),v:+x.turnover24h||0,h:num(x.highPrice24h),l:num(x.lowPrice24h),g:grp(s)}})},
  ws:{url:()=>"wss://stream.bybit.com/v5/public/linear",sub:(k,sym,tf)=>k.send(JSON.stringify({op:"subscribe",args:[`kline.${BYI[tf]}.${sym}USDT`]})),ping:k=>k.send(JSON.stringify({op:"ping"})),
    msg(d){const m=JSON.parse(d);if(!m.topic||!m.topic.startsWith("kline.")||!Array.isArray(m.data))return null;const r=m.data[m.data.length-1];return r?{t:+r.start,o:+r.open,h:+r.high,l:+r.low,c:+r.close,v:+r.volume}:null}}};

// ---------- Binance Futures (USDT-Perpetuals) – liefert auch das Käufer-Volumen ----------
const binf={id:"binf",name:"Binance Futures",short:"Binance Fut.",perp:true,tfs:Object.keys(MS),tv:s=>"BINANCE:"+s+"USDT.P",
  async kl(sym,tf,limit,end){const j=await gj(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}USDT&interval=${tf}&limit=${Math.min(1000,limit||1000)}${end?"&endTime="+end:""}`);
    return Array.isArray(j)?asc(j.map(r=>({t:+r[0],o:+r[1],h:+r[2],l:+r[3],c:+r[4],v:+r[5],b:+r[9]}))):[]},
  async tick(){const j=await gj("https://fapi.binance.com/fapi/v1/ticker/24hr");return(Array.isArray(j)?j:[]).filter(x=>/USDT$/.test(x.symbol)&&+x.closeTime>Date.now()-2*864e5).map(x=>{const s=x.symbol.slice(0,-4),p=+x.lastPrice,o=+x.openPrice;return{s,p,o,...chg(p,o),v:+x.quoteVolume||0,h:num(x.highPrice),l:num(x.lowPrice),g:grp(s)}})},
  ws:{url:(sym,tf)=>`wss://fstream.binance.com/ws/${sym.toLowerCase()}usdt@kline_${tf}`,quiet:true,sub(){},ping(){},
    msg(d){const m=JSON.parse(d),k=m&&m.k;return k?{t:+k.t,o:+k.o,h:+k.h,l:+k.l,c:+k.c,v:+k.v,b:+k.V}:null}}};

// ---------- Bitget (USDT-Futures) ----------
const BGI={"1m":"1m","3m":"3m","5m":"5m","15m":"15m","30m":"30m","1h":"1H","2h":"2H","4h":"4H","12h":"12Hutc","1d":"1Dutc","1w":"1Wutc","1M":"1Mutc"};
const bitget={id:"bitget",name:"Bitget Perp",short:"Bitget",perp:true,tfs:Object.keys(BGI),tv:s=>"BITGET:"+s+"USDT.P",
  async kl(sym,tf,limit,end){const q=`symbol=${sym}USDT&productType=USDT-FUTURES&granularity=${BGI[tf]}`,row=r=>({t:+r[0],o:+r[1],h:+r[2],l:+r[3],c:+r[4],v:+r[5]});
    // aktuelle Kerzen: bis 1000 je Abruf; ältere über die Historie (200 je Abruf)
    if(!end){const j=await gj(`https://api.bitget.com/api/v2/mix/market/candles?${q}&limit=${Math.min(1000,limit||1000)}`);return j.code==="00000"&&Array.isArray(j.data)?asc(j.data.map(row)):[]}
    let out=[],e=end;for(let i=0;i<Math.ceil(Math.min(1000,limit||200)/200);i++){const j=await gj(`https://api.bitget.com/api/v2/mix/market/history-candles?${q}&limit=200&endTime=${e}`);const a=j.code==="00000"&&Array.isArray(j.data)?j.data.map(row):[];if(!a.length)break;out=out.concat(a);e=Math.min(...a.map(x=>x.t))-1}
    return asc(out)},
  async tick(){const j=await gj("https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES");return(Array.isArray(j.data)?j.data:[]).filter(x=>/USDT$/.test(x.symbol)).map(x=>{const s=x.symbol.slice(0,-4),p=+x.lastPr,o=+x.openUtc||+x.open24h;return{s,p,o,...chg(p,o),v:+x.usdtVolume||+x.quoteVolume||0,h:num(x.high24h),l:num(x.low24h),g:grp(s)}})},
  ws:{url:()=>"wss://ws.bitget.com/v2/ws/public",sub:(k,sym,tf)=>k.send(JSON.stringify({op:"subscribe",args:[{instType:"USDT-FUTURES",channel:"candle"+BGI[tf],instId:sym+"USDT"}]})),ping:k=>k.send("ping"),
    msg(d){if(d==="pong")return null;const m=JSON.parse(d);if(!m.arg||!Array.isArray(m.data)||!m.data.length)return null;const r=m.data[m.data.length-1];return{t:+r[0],o:+r[1],h:+r[2],l:+r[3],c:+r[4],v:+r[5]}}}};

// ---------- Hyperliquid (Perpetuals; Coin-Namen mit Groß-/Kleinschreibung wie „kPEPE“) ----------
const HLN={};let hlT=0;
async function hlMeta(){if(Date.now()-hlT<6e5&&Object.keys(HLN).length)return null;const j=await pj("https://api.hyperliquid.xyz/info",{type:"metaAndAssetCtxs"});hlT=Date.now();const u=(j&&j[0]&&j[0].universe)||[];u.forEach(x=>{if(x&&x.name)HLN[String(x.name).toUpperCase()]=x.name});return j}
const hlName=s=>HLN[s]||s;
const hl={id:"hl",name:"Hyperliquid",short:"Hyperliquid",perp:true,tfs:Object.keys(MS),tv:s=>"HYPERLIQUID:"+s+"USD",
  async kl(sym,tf,limit,end){if(!Object.keys(HLN).length)try{await hlMeta()}catch(e){}const n=Math.min(1000,limit||1000),e=end||Date.now(),j=await pj("https://api.hyperliquid.xyz/info",{type:"candleSnapshot",req:{coin:hlName(sym),interval:tf,startTime:e-(n+1)*MS[tf],endTime:e}});
    return Array.isArray(j)?asc(j.map(r=>({t:+r.t,o:+r.o,h:+r.h,l:+r.l,c:+r.c,v:+r.v}))).slice(-n):[]},
  async tick(){hlT=0;const j=await hlMeta(),u=(j&&j[0]&&j[0].universe)||[],c=(j&&j[1])||[];return u.map((x,i)=>{const q=c[i]||{},s=String(x.name).toUpperCase(),p=+q.markPx||+q.midPx,o=+q.prevDayPx;return x.isDelisted||!(p>0)?null:{s,p,o,...chg(p,o),v:+q.dayNtlVlm||0,h:null,l:null,g:grp(s)}}).filter(Boolean)},
  ws:{url:()=>"wss://api.hyperliquid.xyz/ws",sub:(k,sym,tf)=>k.send(JSON.stringify({method:"subscribe",subscription:{type:"candle",coin:hlName(sym),interval:tf}})),ping:k=>k.send(JSON.stringify({method:"ping"})),
    msg(d){const m=JSON.parse(d),r=m&&m.channel==="candle"&&m.data;return r?{t:+r.t,o:+r.o,h:+r.h,l:+r.l,c:+r.c,v:+r.v}:null}}};

// ---------- BingX (Perpetuals; auch Forex, Indizes, Rohstoffe, Aktien mit den Vorsilben NCFX / NCSI / NCCO / NCSK) ----------
const BXG={NCFX:"Forex",NCSI:"Index",NCCO:"Rohstoff",NCSK:"Aktie"};
const bingx={id:"bingx",name:"BingX Perp",short:"BingX",perp:true,test:true,off:true,tfs:Object.keys(MS),tv:s=>"BINGX:"+s.replace(/^NC(FX|SI|CO|SK)/,"").replace("2USD","USD")+(/^NC/.test(s)?"":"USDT.P"),
  async kl(sym,tf,limit,end){const j=await gj(`https://open-api.bingx.com/openApi/swap/v3/quote/klines?symbol=${sym}-USDT&interval=${tf}&limit=${Math.min(1000,limit||1000)}${end?"&endTime="+end:""}`);
    return j.code===0&&Array.isArray(j.data)?asc(j.data.map(r=>({t:+r.time,o:+r.open,h:+r.high,l:+r.low,c:+r.close,v:+r.volume}))):[]},
  async tick(){const j=await gj("https://open-api.bingx.com/openApi/swap/v2/quote/ticker");return(Array.isArray(j.data)?j.data:[]).filter(x=>/-USDT$/.test(x.symbol)).map(x=>{const s=x.symbol.slice(0,-5).replace(/[^A-Za-z0-9]/g,"").toUpperCase(),p=+x.lastPrice,o=+x.openPrice,pre=s.slice(0,4);
      return{s,p,o,...chg(p,o),v:+x.quoteVolume||0,h:num(x.highPrice),l:num(x.lowPrice),g:BXG[pre]||grp(s),n:BXG[pre]?s.slice(4).replace("2USD","/USD"):""}})},
  // Live-Daten kommen gepackt (gzip) an und werden hier entpackt
  ws:{url:()=>"wss://open-api-swap.bingx.com/swap-market",binary:true,sub:(k,sym,tf)=>k.send(JSON.stringify({id:"k"+Date.now(),reqType:"sub",dataType:`${sym}-USDT@kline_${tf}`})),ping(){},
    async msg(d,sym,tf,sock){let t=d;if(typeof d!=="string"){if(typeof DecompressionStream==="undefined")return null;t=await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream("gzip"))).text()}
      if(t==="Ping"||/"ping"/i.test(t.slice(0,20))){try{sock.send("Pong")}catch(e){}return null}const m=JSON.parse(t),a=m&&m.data;const r=Array.isArray(a)?a[a.length-1]:a;if(!r||r.c==null)return null;
      return{t:+(r.T||r.t||r.time),o:+(r.o||r.open),h:+(r.h||r.high),l:+(r.l||r.low),c:+(r.c||r.close),v:+(r.v||r.volume)}}}};

const all={bybit,binf,bitget,hl,bingx},byName={};Object.values(all).forEach(a=>{byName[a.name]=a});
return{all,byName,MS,get:id=>all[id]||null,src:name=>byName[name]||null};
})();
if(typeof module!=="undefined")module.exports=EX;
