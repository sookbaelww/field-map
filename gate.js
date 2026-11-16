// 접속 계정 확인: 관리자가 access.json에서 계정을 막거나 비밀번호를 바꾸면 다음 인터넷 연결 때 앱이 잠긴다.
// 인터넷 없이 쓸 수 있는 기간은 마지막 확인 후 7일.
(function(){
  var KEY="fm.access", DAYS=7, DAY=864e5;
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
  function norm(c){return String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"")}
  function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return("0"+b.toString(16)).slice(-2)}).join("")}
  function hash(pw,salt,iter){
    var enc=new TextEncoder();
    return crypto.subtle.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveBits"]).then(function(k){
      return crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(salt),iterations:iter},k,256)}).then(hex)}
  function fetchList(){
    return fetch("access.json?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("list");return r.json()})}
  function uid(u){return u.id||u.name}
  // 아이디+비밀번호로 계정 찾기 (예전 코드 방식 계정은 대소문자·하이픈 무시)
  function login(id,pw,L){
    var u=((L&&L.users)||[]).filter(function(x){return uid(x)===id})[0];if(!u)return Promise.resolve(null);
    return hash(u.legacy?norm(pw):pw,u.salt,L.iter||100000).then(function(h){return h===u.h?u:null})}
  // 예전 코드 방식으로 저장된 기기: 코드로 계정 찾기
  function byCode(code,L){var us=((L&&L.users)||[]).filter(function(x){return x.legacy}),i=0;
    function next(){if(i>=us.length)return Promise.resolve(null);var u=us[i++];
      return hash(code,u.salt,L.iter||100000).then(function(h){return h===u.h?u:next()})}return next()}
  function setAuthor(id){try{if(!localStorage.getItem("ins.author"))localStorage.setItem("ins.author",id)}catch(e){}}

  var cover=null;
  function css(){var s=document.createElement("style");s.textContent=
    "#fmGate{position:fixed;inset:0;z-index:2147483647;background:#eceff2;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1b2430}"+
    "#fmGate .bx{background:#fff;border:1px solid #d4d9df;border-radius:16px;padding:28px;max-width:400px;width:100%}"+
    "#fmGate h1{font-size:22px;margin:0 0 6px}#fmGate p{margin:0 0 18px;color:#5a6574;line-height:1.55;font-size:15px}"+
    "#fmGate label{display:block;font-size:14px;color:#5a6574;margin:10px 0 4px}"+
    "#fmGate input{width:100%;box-sizing:border-box;font-size:18px;padding:12px 14px;border:1.5px solid #c6ccd3;border-radius:10px}"+
    "#fmGate button{margin-top:16px;width:100%;font-size:17px;font-weight:700;padding:12px;border:0;border-radius:10px;background:#2563eb;color:#fff}"+
    "#fmGate .er{color:#dc2626;font-size:14px;margin:10px 0 0;min-height:1em}";document.head.appendChild(s)}
  function show(title,msg,withInput){
    if(!cover){css();cover=document.createElement("div");cover.id="fmGate";document.body.appendChild(cover)}
    cover.innerHTML='<div class="bx"><h1></h1><p></p>'+(withInput?
      '<label for="fmId">아이디</label><input id="fmId" autocomplete="username" autocapitalize="off" spellcheck="false">'+
      '<label for="fmPw">비밀번호</label><input id="fmPw" type="password" autocomplete="current-password">'+
      '<button id="fmGo">로그인</button><div class="er" id="fmEr"></div>':'<button id="fmRetry">다시 확인</button>')+'</div>';
    cover.querySelector("h1").textContent=title;cover.querySelector("p").textContent=msg;
    if(withInput){var fi=cover.querySelector("#fmId"),fp=cover.querySelector("#fmPw"),go=cover.querySelector("#fmGo"),er=cover.querySelector("#fmEr");
      var st=load();if(st&&st.id)fi.value=st.id;
      function tryIt(){var id=fi.value.trim(),pw=fp.value.trim();if(!id||!pw){er.textContent="아이디와 비밀번호를 넣어 주세요";return}
        go.disabled=true;go.textContent="확인 중…";er.textContent="";
        fetchList().then(function(L){return login(id,pw,L)}).then(function(u){
          if(u&&u.active!==false){save({id:uid(u),h:u.h,ok:Date.now()});setAuthor(uid(u));hide()}
          else{er.textContent=u?"사용이 중지된 계정이에요. 관리자에게 문의하세요":"아이디 또는 비밀번호가 맞지 않아요"}
        }).catch(function(){er.textContent="인터넷에 연결된 곳에서 처음 한 번 로그인해야 해요"})
        .then(function(){go.disabled=false;go.textContent="로그인"})}
      go.onclick=tryIt;fp.onkeydown=function(e){if(e.key==="Enter")tryIt()};fi.onkeydown=function(e){if(e.key==="Enter")fp.focus()};
      setTimeout(function(){(fi.value?fp:fi).focus()},50)}
    else cover.querySelector("#fmRetry").onclick=start;
  }
  function hide(){if(cover){cover.remove();cover=null}}
  function ask(msg){show("외관조사 망도",msg||"관리자에게 받은 아이디와 비밀번호로 로그인하세요.",true)}

  function start(){
    var st=load();
    if(!st||!(st.id||st.code)){ask();return}
    var fresh=Date.now()-(st.ok||0)<DAYS*DAY;
    if(!fresh)show("인터넷 연결이 필요해요","마지막 확인 후 "+DAYS+"일이 지났어요. 인터넷에 연결된 곳에서 앱을 열면 다시 쓸 수 있어요. 조사 자료는 그대로 있어요.",false);
    else hide();
    fetchList().then(function(L){
      if(st.code&&!st.id)return byCode(st.code,L);
      var u=(L.users||[]).filter(function(x){return uid(x)===st.id})[0];
      if(u&&u.h!==st.h)return {changed:true};return u||null;
    }).then(function(u){
      if(u&&u.changed){save({id:st.id,h:"",ok:0});ask("비밀번호가 바뀌었어요. 관리자에게 받은 새 비밀번호로 로그인하세요.");return}
      if(u&&u.active!==false){save({id:uid(u),h:u.h,ok:Date.now()});setAuthor(uid(u));hide()}
      else{save({id:st.id||"",h:"",ok:0});ask(u?"이 계정은 사용이 중지됐어요. 관리자에게 문의하세요. 조사 자료는 기기에 그대로 있어요.":"계정이 없어졌어요. 관리자에게 문의하세요.")}
    }).catch(function(){/* 오프라인: 7일 안이면 그대로 사용 */});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&!cover)start()});
})();
