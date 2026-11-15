// 오프라인용: 앱 파일을 기기에 저장해 두고, 인터넷이 되면 새 버전을 받아온다
const CACHE="insmap-__VER__";
const FILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","lib/pdf.min.js","lib/pdf.worker.min.js","lib/xlsx.full.min.js","lib/jszip.min.js","lib/jspdf.umd.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
 // 화면(index.html)은 인터넷 우선 → 안 되면 저장본, 나머지는 저장본 우선
 if(e.request.mode==="navigate"){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put("index.html",c));return r}).catch(()=>caches.match("index.html")));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
