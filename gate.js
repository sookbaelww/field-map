// 접속 코드 확인: 관리자가 access.json에서 코드를 빼거나 막으면 다음 인터넷 연결 때 앱이 잠긴다.
// 인터넷 없이 쓸 수 있는 기간은 마지막 확인 후 7일.
(function(){
  var KEY="fm.access", DAYS=7, DAY=864e5;
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
  function norm(c){return String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"")}
  function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return("0"+b.toString(16)).slice(-2)}).join("")}
  function hash(code,salt,iter){
    var enc=new TextEncoder();
    return crypto.subtle.importKey("raw",enc.encode(code),"PBKDF2",false,["deriveBits"]).then(function(k){
      return crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(salt),iterations:iter},k,256)}).then(hex)}
  function fetchList(){
    return fetch("access.json?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("list");return r.json()})}
  function find(code,L){
    var us=(L&&L.users)||[],i=0;
    function next(){if(i>=us.length)return Promise.resolve(null);var u=us[i++];
      return hash(code,u.salt,L.iter||100000).then(function(h){return h===u.h?u:next()})}
    return next()}

  // 가림막
  var cover=null;
  function css(){var s=document.createElement("style");s.textContent=
    "#fmGate{position:fixed;inset:0;z-index:2147483647;background:#eceff2;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1b2430}"+
    "#fmGate .bx{background:#fff;border:1px solid #d4d9df;border-radius:16px;padding:28px;max-width:400px;width:100%}"+
    "#fmGate h1{font-size:22px;margin:0 0 6px}#fmGate p{margin:0 0 16px;color:#5a6574;line-height:1.55;font-size:15px}"+
    "#fmGate input{width:100%;box-sizing:border-box;font-size:22px;letter-spacing:.12em;text-transform:uppercase;padding:12px 14px;border:1.5px solid #c6ccd3;border-radius:10px;text-align:center}"+
    "#fmGate button{margin-top:12px;width:100%;font-size:17px;font-weight:700;padding:12px;border:0;border-radius:10px;background:#2563eb;color:#fff}"+
    "#fmGate .er{color:#dc2626;font-size:14px;margin:10px 0 0;min-height:1em}";document.head.appendChild(s)}
  function show(title,msg,withInput){
    if(!cover){css();cover=document.createElement("div");cover.id="fmGate";document.body.appendChild(cover)}
    cover.innerHTML='<div class="bx"><h1></h1><p></p>'+(withInput?'<input id="fmCode" autocomplete="off" autocapitalize="characters" placeholder="접속 코드"><button id="fmGo">확인</button><div class="er" id="fmEr"></div>':'<button id="fmRetry">다시 확인</button>')+'</div>';
    cover.querySelector("h1").textContent=title;cover.querySelector("p").textContent=msg;
    if(withInput){var inp=cover.querySelector("#fmCode"),go=cover.querySelector("#fmGo"),er=cover.querySelector("#fmEr");
      function tryIt(){var c=norm(inp.value);if(c.length<6){er.textContent="코드를 확인해 주세요";return}
        go.disabled=true;go.textContent="확인 중…";er.textContent="";
        fetchList().then(function(L){return find(c,L)}).then(function(u){
          if(u&&u.active!==false){save({code:c,ok:Date.now()});hide()}
          else{er.textContent=u?"사용이 중지된 코드예요. 관리자에게 문의하세요":"맞지 않는 코드예요"}
        }).catch(function(){er.textContent="인터넷에 연결된 곳에서 처음 한 번 확인해야 해요"})
        .then(function(){go.disabled=false;go.textContent="확인"})}
      go.onclick=tryIt;inp.onkeydown=function(e){if(e.key==="Enter")tryIt()};setTimeout(function(){inp.focus()},50)}
    else cover.querySelector("#fmRetry").onclick=start;
  }
  function hide(){if(cover){cover.remove();cover=null}}
  function ask(msg){show("외관조사 망도",msg||"관리자에게 받은 접속 코드를 넣어 주세요.",true)}

  function start(){
    var st=load();
    if(!st||!st.code){ask();return}
    var fresh=Date.now()-(st.ok||0)<DAYS*DAY;
    if(!fresh)show("인터넷 연결이 필요해요","마지막 확인 후 "+DAYS+"일이 지났어요. 인터넷에 연결된 곳에서 앱을 열면 다시 쓸 수 있어요. 조사 자료는 그대로 있어요.",false);
    else hide();
    fetchList().then(function(L){return find(st.code,L)}).then(function(u){
      if(u&&u.active!==false){save({code:st.code,ok:Date.now()});hide()}
      else{save({code:"",ok:0});ask(u?"이 코드는 사용이 중지됐어요. 관리자에게 문의하세요. 조사 자료는 기기에 그대로 있어요.":"접속 코드가 바뀌었어요. 관리자에게 새 코드를 받아 넣어 주세요.")}
    }).catch(function(){/* 오프라인: 7일 안이면 그대로 사용 */});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&!cover)start()});
})();
