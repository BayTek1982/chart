// Service Worker für Benachrichtigungen (Alarme) und „App installieren“
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
// Startseite bei jedem Öffnen frisch beim Server nachfragen (sonst hält der Browser sie bis zu 10 Minuten zwischen und neue Versionen kommen verspätet an).
// Ohne Netz oder bei Fehlern läuft der normale Abruf wie bisher.
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||r.mode!=="navigate")return;
  e.respondWith(fetch(r.url,{cache:"no-cache",credentials:"same-origin"}).catch(()=>fetch(r)))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{for(const c of cs){if("focus"in c)return c.focus()}return self.clients.openWindow("/")}))});
