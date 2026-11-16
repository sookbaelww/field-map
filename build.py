# 독립 앱 빌드: Claude 버전(index.html)에서 독립 앱용 index.html을 만든다
import re,time
s=open('/home/claude/inspect-app/index.html').read()
s=re.sub(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/[^"]*/(pdf\.min\.js|pdf\.worker\.min\.js|xlsx\.full\.min\.js|jszip\.min\.js|jspdf\.umd\.min\.js)"></script>',lambda m:f'<script src="lib/{m.group(1)}"></script>',s)
assert 'cdnjs' not in s
v=time.strftime('%Y%m%d%H%M')
head='''<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="외관조사망도">
<meta name="theme-color" content="#2563eb">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-192.png">
<script src="gate.js"></script>
<script>window.STANDALONE=true;window.APP_VERSION="'''+v+'''";
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));</script>
'''
s=s.replace('<title>외관조사 망도</title>','<title>외관조사 망도</title>\n'+head,1)
open('index.html','w').write(s)
sw=open('sw.template.js').read().replace('__VER__',v)
open('sw.js','w').write(sw)
print('built',v)
