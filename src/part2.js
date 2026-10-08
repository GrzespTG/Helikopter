'use strict';
/* ================= NARZĘDZIA ================= */
const W=540,H=960;
const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let RND=Math.random;
const rr=(a,b)=>a+RND()*(b-a), ri=(a,b)=>Math.floor(rr(a,b+1)), pick=a=>a[Math.floor(RND()*a.length)];
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let K=1;
function resize(){
  const vw=innerWidth,vh=innerHeight,s=Math.min(vw/W,vh/H),cw=Math.floor(W*s),ch=Math.floor(H*s);
  const st=$('#stage');st.style.width=cw+'px';st.style.height=ch+'px';
  document.documentElement.style.setProperty('--u',(cw/W)+'px');
  K=clamp(cw*(window.devicePixelRatio||1)/W,.75,2);
  cv.width=Math.round(W*K);cv.height=Math.round(H*K);
}

/* ================= MOTYWY TERENU ================= */
const THEMES=[
 {n:'Pola',base:['#6aa83f','#559335'],alt:'#8fbd4a',field:['#cdb94f','#a9c653','#8aa83f'],forest:'#2c6a2e',forest2:'#3f8a3c',water:'#3b8fd0',bank:'#9fd0ee',road:'#7a7c7a',house:'#c9573f',cloud:.55},
 {n:'Pustynia',base:['#dcb56d','#cba35c'],alt:'#e8c985',field:['#c99a52','#d8ab62','#b98a48'],forest:'#8d6b42',forest2:'#a58052',water:'#34a3b4',bank:'#cfe8dc',road:'#6f5f52',house:'#9c6f4a',cloud:.35},
 {n:'Śnieg',base:['#e8f0f7','#d2e0ec'],alt:'#f8fbff',field:['#dbe7f1','#c9dae8','#eff6fc'],forest:'#2f6b5e',forest2:'#438777',water:'#6fa6c8',bank:'#f2f9ff',road:'#8e9aa6',house:'#b3503f',cloud:.5},
 {n:'Miasto nocą',base:['#1b2436','#151d2d'],alt:'#222d44',field:['#2a3550','#323f5e','#26304a'],forest:'#14301f',forest2:'#1d4a2c',water:'#1d4f86',bank:'#2c6fb0',road:'#0f141f',house:'#3d4a6a',cloud:.0,night:1},
 {n:'Wulkan',base:['#3b2a2a','#2c2020'],alt:'#4a3535',field:['#523838','#452e2e','#5b3f3f'],forest:'#2a1d1d',forest2:'#3b2828',water:'#ff6a1a',bank:'#ffb347',road:'#1e1717',house:'#6a3b30',cloud:.25,lava:1}
];
const themeOf=st=>THEMES[(st-1)%THEMES.length];
const CH=512;
let chunkCache=new Map(),curTheme=THEMES[0],themeSeed=1;
const riverX=b=>W/2+Math.sin(b*.0031+themeSeed)*150+Math.sin(b*.0087+themeSeed*2)*50;
const roadX=b=>W/2+Math.sin(b*.0042+themeSeed*3)*170+Math.cos(b*.0021+themeSeed)*40;
function genChunk(n){
  const th=curTheme,c=document.createElement('canvas');c.width=W;c.height=CH;const g=c.getContext('2d');
  const R=mulberry(n*7919+themeSeed*131+17),rn=(a,b)=>a+R()*(b-a);
  const gr=g.createLinearGradient(0,0,0,CH);gr.addColorStop(0,th.base[0]);gr.addColorStop(1,th.base[1]);g.fillStyle=gr;g.fillRect(0,0,W,CH);
  // plamy koloru
  for(let i=0;i<22;i++){g.fillStyle=th.alt;g.globalAlpha=rn(.12,.3);g.beginPath();g.ellipse(rn(0,W),rn(0,CH),rn(30,110),rn(20,70),rn(0,3),0,7);g.fill();}
  g.globalAlpha=1;
  const top=(n+1)*CH,bOf=y=>top-y;
  if(th.night){ // kwartały miasta
    for(let gy=0;gy<CH;gy+=64)for(let gx=0;gx<W;gx+=72){if(R()<.18)continue;
      const w=rn(34,56),h=rn(34,50),x=gx+rn(2,12),y=gy+rn(2,12);
      g.fillStyle='#10161f';g.fillRect(x+4,y+5,w,h);
      g.fillStyle=pick2(R,['#2b3652','#323f60','#38476b']);g.fillRect(x,y,w,h);
      g.fillStyle='#46567e';g.fillRect(x,y,w,4);
      for(let wy=y+9;wy<y+h-4;wy+=7)for(let wx=x+5;wx<x+w-4;wx+=8){if(R()<.55){g.fillStyle=R()<.5?'#ffd98a':'#9fd3ff';g.globalAlpha=rn(.5,1);g.fillRect(wx,wy,4,3);}}
      g.globalAlpha=1;}
  } else {
    // pola uprawne / skały
    for(let i=0;i<6;i++){const x=rn(10,W-130),y=rn(10,CH-110),w=rn(60,130),h=rn(50,100);
      const col=pick2(R,th.field);g.fillStyle=col;g.globalAlpha=.9;g.fillRect(x,y,w,h);g.globalAlpha=.25;g.fillStyle='#000';
      for(let k=0;k<w;k+=9)g.fillRect(x+k,y,3,h);g.globalAlpha=1;g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1.5;g.strokeRect(x,y,w,h);}
    // lasy
    for(let i=0;i<10;i++){const cx=rn(0,W),cy=rn(0,CH),n2=ri(5,10);
      for(let k=0;k<n2;k++){const x=cx+rn(-34,34),y=cy+rn(-28,28),r=rn(11,20);
        g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.arc(x+4,y+6,r,0,7);g.fill();
        g.fillStyle=th.forest;g.beginPath();g.arc(x,y,r,0,7);g.fill();
        g.fillStyle=th.forest2;g.beginPath();g.arc(x-r*.25,y-r*.3,r*.6,0,7);g.fill();}}
  }
  // droga
  g.lineCap='round';g.lineJoin='round';
  const path=(fx)=>{g.beginPath();for(let y=-8;y<=CH+8;y+=8){const x=fx(bOf(y));y<=-8?g.moveTo(x,y):g.lineTo(x,y);}};
  if(!th.lava){path(roadX);g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=30;g.stroke();g.strokeStyle=th.road;g.lineWidth=24;g.stroke();
    g.setLineDash([16,18]);g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2;g.stroke();g.setLineDash([]);}
  // rzeka
  path(riverX);g.strokeStyle=th.bank;g.lineWidth=th.lava?66:58;g.stroke();
  g.strokeStyle=th.water;g.lineWidth=th.lava?52:46;g.stroke();
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=10;g.stroke();
  if(th.lava){g.globalCompositeOperation='lighter';g.strokeStyle='rgba(255,120,30,.35)';g.lineWidth=64;g.stroke();g.globalCompositeOperation='source-over';}
  // mosty tam, gdzie droga przecina rzekę
  if(!th.lava)for(let y=0;y<CH;y+=6){const b=bOf(y);if(Math.abs(roadX(b)-riverX(b))<9){g.fillStyle='#8a8f93';g.fillRect(roadX(b)-17,y-26,34,52);g.fillStyle='#b9bec2';g.fillRect(roadX(b)-14,y-26,5,52);g.fillRect(roadX(b)+9,y-26,5,52);g.fillStyle=th.road;g.fillRect(roadX(b)-9,y-26,18,52);break;}}
  // domki
  if(!th.night)for(let i=0;i<5;i++){const x=rn(20,W-40),y=rn(20,CH-40);const b=bOf(y);
    if(Math.abs(x-riverX(b))<48||Math.abs(x-roadX(b))<26)continue;
    g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+4,y+5,26,20);g.fillStyle='#e8dfd0';g.fillRect(x,y,24,18);g.fillStyle=th.house;g.fillRect(x-2,y-3,28,10);}
  // kratery / pęknięcia lawy
  if(th.lava){g.strokeStyle='rgba(255,100,20,.6)';g.lineWidth=2;for(let i=0;i<8;i++){g.beginPath();let x=rn(0,W),y=rn(0,CH);g.moveTo(x,y);for(let k=0;k<5;k++){x+=rn(-20,20);y+=rn(8,24);g.lineTo(x,y);}g.stroke();}}
  return c;
}
function pick2(R,a){return a[Math.floor(R()*a.length)];}
function setTheme(stage){curTheme=themeOf(stage);themeSeed=stage*1.7+3;chunkCache.clear();}
function drawTerrain(g,scroll){
  const n0=Math.floor(scroll/CH),n1=Math.floor((scroll+H)/CH);
  for(let n=n0;n<=n1;n++){let c=chunkCache.get(n);if(!c){c=genChunk(n);chunkCache.set(n,c);
      if(chunkCache.size>6)for(const k of chunkCache.keys())if(k<n0-1){chunkCache.delete(k);}}
    const sy=H-((n+1)*CH-scroll);g.drawImage(c,0,Math.round(sy));}
}

/* ================= SPRITY ================= */
const SPR={};
function spr(key,w,h,fn,sc){sc=sc||2;let c=SPR[key];if(c)return c;
  c=document.createElement('canvas');c.width=w*sc;c.height=h*sc;const g=c.getContext('2d');g.scale(sc,sc);g.translate(w/2,h/2);fn(g);SPR[key]=c;c._w=w;c._h=h;return c;}
function blit(g,c,x,y,rot,a,s){g.save();g.translate(x,y);if(rot)g.rotate(rot);if(a!=null&&a<1)g.globalAlpha=a;s=s||1;g.drawImage(c,-c._w/2*s,-c._h/2*s,c._w*s,c._h*s);g.restore();}
function lg(g,x0,y0,x1,y1,stops){const r=g.createLinearGradient(x0,y0,x1,y1);stops.forEach((s,i)=>r.addColorStop(i/(stops.length-1),s));return r;}
function rg(g,x,y,r0,r1,stops){const r=g.createRadialGradient(x,y,r0,x,y,r1);stops.forEach((s,i)=>r.addColorStop(i/(stops.length-1),s));return r;}
function rrect(g,x,y,w,h,r){g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);}

/* --- helikopter gracza (nos w górę) --- */
const SPAN=[0,0,0,0,34,42,42,50,56],NMIS=[0,0,0,0,1,2,2,3,4];
function heliBody(wl){
  return spr('heli'+wl,190,190,g=>{
    const gold=wl>=8;
    // płozy
    g.strokeStyle='#23282a';g.lineCap='round';
    for(const sx of[-17,17]){g.lineWidth=3.2;g.beginPath();g.moveTo(sx,-24);g.quadraticCurveTo(sx*1.05,-30,sx,-32);g.moveTo(sx,-24);g.lineTo(sx,26);g.stroke();
      g.lineWidth=2;g.beginPath();g.moveTo(sx,-12);g.lineTo(sx*.55,-8);g.moveTo(sx,14);g.lineTo(sx*.55,10);g.stroke();}
    // skrzydła i zawiesia na rakiety
    if(wl>=4){const sp=SPAN[wl],n=NMIS[wl];
      for(const s of[-1,1]){
        g.save();g.scale(s,1);
        g.fillStyle='rgba(0,0,0,.28)';rrect(g,12,-2,sp-6,14,4);g.fill();
        g.fillStyle=lg(g,0,-6,0,8,[gold?'#ffe08a':'#8f9a92','#59635d']);rrect(g,10,-6,sp-8,13,4);g.fill();
        g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1;g.beginPath();g.moveTo(12,-5);g.lineTo(sp-6,-5);g.stroke();
        g.fillStyle='#ff9a2e';g.fillRect(sp-10,-6,4,13);
        for(let i=0;i<n;i++){const mx=22+i*10;
          g.fillStyle='#394039';g.fillRect(mx-1.5,6,3,5);                       // zawieszenie
          g.fillStyle=lg(g,mx-3,0,mx+3,0,['#f4f4f0','#b9bdb6']);rrect(g,mx-3,8,6,22,3);g.fill();   // rakieta
          g.fillStyle='#e8412f';g.beginPath();g.moveTo(mx-3,9);g.lineTo(mx,3);g.lineTo(mx+3,9);g.fill();  // czub
          g.fillStyle='#2a2f2c';g.fillRect(mx-4,24,8,2.5);g.fillRect(mx-1,28,2,5);}                  // stateczniki
        g.restore();}
    }
    // belka ogonowa
    g.fillStyle=lg(g,-5,0,5,0,[gold?'#d9b24e':'#5c6a52','#3a4535']);g.beginPath();g.moveTo(-5.5,16);g.lineTo(5.5,16);g.lineTo(2.6,68);g.lineTo(-2.6,68);g.closePath();g.fill();
    g.fillStyle=gold?'#c79a2a':'#3e4a38';g.fillRect(-13,60,26,5);g.fillRect(-1.6,52,3.2,17);
    g.fillStyle='#ff9a2e';g.fillRect(-13,60,4,5);g.fillRect(9,60,4,5);
    // kadłub
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(2,3,16,33,0,0,7);g.fill();
    g.fillStyle=lg(g,-16,0,16,0,gold?['#a8812a','#f3d36a','#a8812a']:['#3f4d37','#76885f','#3f4d37']);
    g.beginPath();g.moveTo(0,-34);g.bezierCurveTo(18,-30,19,-6,13,12);g.bezierCurveTo(10,26,5,30,0,30);g.bezierCurveTo(-5,30,-10,26,-13,12);g.bezierCurveTo(-19,-6,-18,-30,0,-34);g.fill();
    // panele
    g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=1;g.beginPath();g.moveTo(-11,-2);g.lineTo(11,-2);g.moveTo(-10,10);g.lineTo(10,10);g.moveTo(0,-2);g.lineTo(0,28);g.stroke();
    g.fillStyle='#ff9a2e';g.fillRect(-14,-16,3,16);g.fillRect(11,-16,3,16);
    // silnik
    g.fillStyle=lg(g,0,2,0,26,['#2f372c','#4a5640']);rrect(g,-8,3,16,24,5);g.fill();
    g.fillStyle='#161a15';g.fillRect(-5,25,10,3);
    g.fillStyle=rg(g,0,29,1,8,['rgba(255,170,60,.9)','rgba(255,120,30,0)']);g.beginPath();g.arc(0,29,8,0,7);g.fill();
    // kokpit
    g.fillStyle=lg(g,0,-30,0,-6,['#d6f0ff','#3f86c4','#1d4c80']);g.beginPath();g.moveTo(0,-31);g.bezierCurveTo(10,-28,11,-14,8,-6);g.lineTo(-8,-6);g.bezierCurveTo(-11,-14,-10,-28,0,-31);g.fill();
    g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(-3.5,-21,2.2,7,.15,0,7);g.fill();
    // karabiny
    g.fillStyle='#1d211f';
    if(wl>=1)g.fillRect(-1.5,-40,3,10);
    if(wl>=2){g.fillRect(-9.5,-37,3,9);g.fillRect(6.5,-37,3,9);}
    if(wl>=3){g.fillRect(-19,-30,3,9);g.fillRect(16,-30,3,9);}
  },2);
}
function drawHeli(g,x,y,t,wl,flash){
  g.save();g.translate(x,y);
  // cień
  g.save();g.translate(16,26);g.scale(1,1);g.globalAlpha=.28;g.fillStyle='#000';g.beginPath();g.ellipse(0,6,18,38,0,0,7);g.fill();
  if(wl>=4){const sp=SPAN[wl];g.fillRect(-sp,-4,sp*2,12);}
  g.restore();
  if(flash){g.globalAlpha=.6+.4*Math.sin(t*50);}
  const b=heliBody(wl);g.drawImage(b,-b._w/2,-b._h/2,b._w,b._h);
  // wirnik ogonowy
  g.save();g.translate(7,63);g.rotate(t*50);g.strokeStyle='rgba(30,30,30,.9)';g.lineWidth=2;g.beginPath();g.moveTo(-9,0);g.lineTo(9,0);g.moveTo(0,-9);g.lineTo(0,9);g.stroke();g.restore();
  // wirnik główny
  g.save();g.translate(0,1);
  g.fillStyle=rg(g,0,0,6,66,['rgba(210,225,235,.0)','rgba(210,225,235,.16)','rgba(210,225,235,.04)']);g.beginPath();g.arc(0,0,66,0,7);g.fill();
  g.rotate(t*26);
  for(let i=0;i<4;i++){g.rotate(Math.PI/2);g.fillStyle=lg(g,0,0,64,0,['#272b2d','rgba(40,44,46,.55)']);g.beginPath();g.moveTo(3,-2.4);g.lineTo(64,-1.6);g.lineTo(64,1.6);g.lineTo(3,2.4);g.fill();
    g.fillStyle='#ff9a2e';g.fillRect(56,-1.7,8,3.4);}
  g.fillStyle='#14171a';g.beginPath();g.arc(0,0,6,0,7);g.fill();g.fillStyle='#8f9a92';g.beginPath();g.arc(0,0,3,0,7);g.fill();
  g.restore();g.restore();
}

/* --- pociski --- */
function glowDot(col,r){return spr('gd'+col+r,r*6,r*6,g=>{g.fillStyle=rg(g,0,0,0,r*3,[col,col.replace(/[\d.]+\)$/,'0.0)')]);g.beginPath();g.arc(0,0,r*3,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(0,0,r*.55,0,7);g.fill();},2);}
const GLOW={orange:'rgba(255,150,40,1)',red:'rgba(255,60,70,1)',yel:'rgba(255,230,90,1)',cyan:'rgba(80,220,255,1)',vio:'rgba(190,120,255,1)',grn:'rgba(110,255,150,1)'};

/* --- wrogowie: powietrze (nos w dół) --- */
function pal(st){const t=(st-1)%5;return[['#7f8f9f','#4e5c6a','#e04646'],['#b79a6a','#7c6642','#e07a2a'],['#c8d4de','#7b8a98','#3a7fd0'],['#4a5572','#262c40','#d0a020'],['#7a4b4b','#3a2424','#ff7a1a']][t];}
function sDrone(st){const p=pal(st);return spr('dr'+st,50,50,g=>{
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(2,4,12,12,0,0,7);g.fill();
  g.strokeStyle=p[1];g.lineWidth=3;for(const a of[.78,2.36,3.93,5.5]){g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*16,Math.sin(a)*16);g.stroke();
    g.fillStyle='rgba(200,215,230,.35)';g.beginPath();g.arc(Math.cos(a)*16,Math.sin(a)*16,8.5,0,7);g.fill();g.fillStyle=p[1];g.beginPath();g.arc(Math.cos(a)*16,Math.sin(a)*16,2.2,0,7);g.fill();}
  g.fillStyle=lg(g,-9,-9,9,9,[p[0],p[1]]);g.beginPath();g.arc(0,0,10,0,7);g.fill();
  g.fillStyle=p[2];g.beginPath();g.arc(0,3,4,0,7);g.fill();g.fillStyle='#fff';g.globalAlpha=.7;g.beginPath();g.arc(-3,-4,2.2,0,7);g.fill();g.globalAlpha=1;});}
function sJet(st){const p=pal(st);return spr('jt'+st,70,80,g=>{
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.moveTo(8,-30);g.lineTo(34,16);g.lineTo(8,10);g.lineTo(-18,16);g.closePath();g.fill();
  g.fillStyle=lg(g,-30,0,30,0,[p[1],p[0],p[1]]);g.beginPath();g.moveTo(0,32);g.lineTo(5,10);g.lineTo(32,-10);g.lineTo(32,-18);g.lineTo(6,-14);g.lineTo(4,-30);g.lineTo(-4,-30);g.lineTo(-6,-14);g.lineTo(-32,-18);g.lineTo(-32,-10);g.lineTo(-5,10);g.closePath();g.fill();
  g.fillStyle=p[2];g.fillRect(-32,-18,6,5);g.fillRect(26,-18,6,5);
  g.fillStyle=lg(g,0,10,0,28,['#bfe8ff','#2f6fa8']);g.beginPath();g.ellipse(0,16,3.4,9,0,0,7);g.fill();
  g.fillStyle=rg(g,0,-32,0,9,['rgba(255,190,80,.95)','rgba(255,120,30,0)']);g.beginPath();g.arc(0,-32,9,0,7);g.fill();});}
function sGun(st){const p=pal(st);return spr('gs'+st,120,130,g=>{
  g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(6,8,16,34,0,0,7);g.fill();
  g.fillStyle=lg(g,-7,0,7,0,[p[1],p[0]]);g.beginPath();g.moveTo(-5,-12);g.lineTo(5,-12);g.lineTo(3,-52);g.lineTo(-3,-52);g.fill();     // belka ogonowa (do góry)
  g.fillStyle=p[1];g.fillRect(-12,-52,24,5);
  g.fillStyle=lg(g,-18,0,18,0,[p[1],p[0],p[1]]);g.beginPath();g.moveTo(0,32);g.bezierCurveTo(22,24,22,-4,14,-16);g.lineTo(-14,-16);g.bezierCurveTo(-22,-4,-22,24,0,32);g.fill();
  g.fillStyle=p[2];g.fillRect(-16,-2,3,12);g.fillRect(13,-2,3,12);
  g.fillStyle=lg(g,0,12,0,30,['#cfeaff','#2f6fa8']);g.beginPath();g.moveTo(0,31);g.bezierCurveTo(10,26,11,18,8,12);g.lineTo(-8,12);g.bezierCurveTo(-11,18,-10,26,0,31);g.fill();
  g.fillStyle='#1d2225';g.fillRect(-14,14,3,16);g.fillRect(11,14,3,16);g.fillRect(-1.5,28,3,10);
  for(const s of[-1,1]){g.fillStyle='#3a4046';rrect(g,s*22-5,-4,10,24,3);g.fill();g.fillStyle='#e8e8e0';g.fillRect(s*22-2,16,4,10);}});}
function sBomber(st){const p=pal(st);return spr('bb'+st,190,170,g=>{
  g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.moveTo(10,-40);g.lineTo(88,18);g.lineTo(10,12);g.lineTo(-76,20);g.fill();
  g.fillStyle=lg(g,-86,0,86,0,[p[1],p[0],p[1]]);g.beginPath();g.moveTo(0,70);g.lineTo(11,36);g.lineTo(84,10);g.lineTo(88,-6);g.lineTo(12,-12);g.lineTo(9,-56);g.lineTo(26,-66);g.lineTo(26,-72);g.lineTo(-26,-72);g.lineTo(-26,-66);g.lineTo(-9,-56);g.lineTo(-12,-12);g.lineTo(-88,-6);g.lineTo(-84,10);g.lineTo(-11,36);g.closePath();g.fill();
  g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=1.5;g.beginPath();g.moveTo(-60,4);g.lineTo(-12,10);g.moveTo(60,4);g.lineTo(12,10);g.moveTo(0,-50);g.lineTo(0,60);g.stroke();
  for(const x of[-62,-34,34,62]){g.fillStyle='#2a3036';rrect(g,x-7,4,14,30,5);g.fill();g.fillStyle=p[2];g.fillRect(x-7,4,14,5);g.fillStyle='rgba(255,170,60,.9)';g.beginPath();g.arc(x,-2,5,0,7);g.fill();}
  g.fillStyle=lg(g,0,32,0,62,['#cfeaff','#2f6fa8']);g.beginPath();g.ellipse(0,46,6,15,0,0,7);g.fill();
  g.fillStyle='#1c2024';for(const x of[-22,22]){g.beginPath();g.arc(x,18,5,0,7);g.fill();}});}
/* --- wrogowie naziemni (patrzymy z góry) --- */
function sTurretBase(st){return spr('tb'+st,70,70,g=>{
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(4,6,22,22,0,0,7);g.fill();
  g.fillStyle='#8a8f88';g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+.39;g.lineTo(Math.cos(a)*24,Math.sin(a)*24);}g.fill();
  g.fillStyle='#6a7068';g.beginPath();g.arc(0,0,17,0,7);g.fill();g.fillStyle=lg(g,-10,-10,10,10,['#bfc4bc','#707770']);g.beginPath();g.arc(0,0,13,0,7);g.fill();
  g.fillStyle=pal(st)[2];g.beginPath();g.arc(0,0,4,0,7);g.fill();});}
function sBarrel(){return spr('barrel',16,44,g=>{g.fillStyle='#1d2124';rrect(g,-3.2,-2,6.4,30,2);g.fill();g.fillStyle='#4a5258';g.fillRect(-4.5,-4,9,10);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(-1,0,1.2,26);});}
function sTank(st){const p=pal(st);return spr('tk'+st,70,90,g=>{
  g.fillStyle='rgba(0,0,0,.28)';rrect(g,-23,-30,56,70,8);g.fill();
  for(const s of[-1,1]){g.fillStyle='#2a2d2c';rrect(g,s*22-8,-34,16,70,6);g.fill();g.fillStyle='#4b504d';for(let y=-30;y<32;y+=7)g.fillRect(s*22-8,y,16,2);}
  g.fillStyle=lg(g,-18,0,18,0,[p[1],p[0],p[1]]);rrect(g,-19,-30,38,64,7);g.fill();
  g.fillStyle='rgba(0,0,0,.2)';g.fillRect(-19,-2,38,2);g.fillStyle=p[2];g.fillRect(-19,22,38,4);});}
function sTankTur(st){const p=pal(st);return spr('tt'+st,50,70,g=>{
  g.fillStyle='#1d2124';rrect(g,-3,-2,6,40,2);g.fill();g.fillStyle='#4a5258';g.fillRect(-4.6,26,9.2,7);
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(3,3,17,19,0,0,7);g.fill();
  g.fillStyle=lg(g,-14,-14,14,14,[p[0],p[1]]);g.beginPath();g.ellipse(0,-2,16,18,0,0,7);g.fill();g.fillStyle='#1d2124';g.beginPath();g.arc(-4,-4,4,0,7);g.fill();});}
function sAA(st){return spr('aa'+st,70,70,g=>{
  g.fillStyle='rgba(0,0,0,.28)';rrect(g,-23,-21,52,52,8);g.fill();
  g.fillStyle=lg(g,0,-26,0,26,['#707a70','#4a544a']);rrect(g,-26,-26,52,52,8);g.fill();
  g.fillStyle='#2a2f2a';rrect(g,-18,-18,36,36,6);g.fill();
  for(const x of[-9,0,9]){g.fillStyle='#d9dcd4';rrect(g,x-3.6,-30,7.2,26,3);g.fill();g.fillStyle='#d83a2a';g.beginPath();g.moveTo(x-3.6,-30);g.lineTo(x,-37);g.lineTo(x+3.6,-30);g.fill();}
  g.fillStyle=pal(st)[2];g.fillRect(-18,10,36,4);});}
function sBunker(st){return spr('bk'+st,110,110,g=>{
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.arc(6,8,44,0,7);g.fill();
  g.fillStyle=lg(g,-40,-40,40,40,['#a7aca4','#5f655e']);g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+.39;g.lineTo(Math.cos(a)*46,Math.sin(a)*46);}g.fill();
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.stroke();
  g.fillStyle='#4a4f49';g.beginPath();g.arc(0,0,28,0,7);g.fill();g.fillStyle=lg(g,-20,-20,20,20,['#c8ccc3','#7c827a']);g.beginPath();g.arc(0,0,22,0,7);g.fill();
  g.fillStyle=pal(st)[2];g.beginPath();g.arc(0,0,7,0,7);g.fill();
  for(const[a]of[[0],[1.57],[3.14],[4.71]]){g.save();g.rotate(a);g.fillStyle='#1d2124';g.fillRect(-4,-46,8,22);g.restore();}});}
/* --- boss: cztery projekty (nos w dół), kolor zależy od poziomu --- */
function sBoss(kind,st){const p=pal(st);const SZ=360;return spr('boss'+kind+'_'+((st-1)%5),SZ,SZ,g=>{
  g.save();
  const hull=(x0,x1)=>lg(g,x0,0,x1,0,[p[1],p[0],p[1]]);
  g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(12,16,150,100,0,0,7);g.fill();
  if(kind===0){ // opancerzony okręt powietrzny z dwoma wirnikami
    g.fillStyle=hull(-80,80);g.beginPath();g.moveTo(0,140);g.bezierCurveTo(70,120,86,40,70,-40);g.lineTo(46,-110);g.lineTo(-46,-110);g.lineTo(-70,-40);g.bezierCurveTo(-86,40,-70,120,0,140);g.fill();
    g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=2;for(let y=-90;y<120;y+=34){g.beginPath();g.moveTo(-60,y);g.lineTo(60,y);g.stroke();}
    for(const s of[-1,1]){g.fillStyle=hull(-60,60);rrect(g,s*86-26,-30,52,100,14);g.fill();g.fillStyle=p[2];g.fillRect(s*86-26,-30,52,8);g.fillStyle='#1d2124';g.fillRect(s*86-4,60,8,36);
      g.fillStyle='rgba(215,230,240,.22)';g.beginPath();g.arc(s*86,20,60,0,7);g.fill();}
    g.fillStyle=lg(g,0,70,0,140,['#cfeaff','#2f6fa8']);g.beginPath();g.moveTo(0,134);g.bezierCurveTo(30,122,34,92,26,72);g.lineTo(-26,72);g.bezierCurveTo(-34,92,-30,122,0,134);g.fill();
    g.fillStyle=p[2];g.fillRect(-56,-96,112,10);
  } else if(kind===1){ // ciężki bombowiec
    g.fillStyle=hull(-170,170);g.beginPath();g.moveTo(0,150);g.lineTo(18,100);g.lineTo(168,52);g.lineTo(172,22);g.lineTo(26,10);g.lineTo(20,-100);g.lineTo(60,-130);g.lineTo(60,-146);g.lineTo(-60,-146);g.lineTo(-60,-130);g.lineTo(-20,-100);g.lineTo(-26,10);g.lineTo(-172,22);g.lineTo(-168,52);g.lineTo(-18,100);g.closePath();g.fill();
    g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=2;g.beginPath();g.moveTo(-140,30);g.lineTo(-26,40);g.moveTo(140,30);g.lineTo(26,40);g.moveTo(0,-110);g.lineTo(0,130);g.stroke();
    for(const x of[-130,-84,84,130]){g.fillStyle='#262c32';rrect(g,x-14,10,28,70,10);g.fill();g.fillStyle=p[2];g.fillRect(x-14,10,28,10);g.fillStyle='rgba(255,170,60,.95)';g.beginPath();g.arc(x,2,10,0,7);g.fill();}
    g.fillStyle=lg(g,0,90,0,138,['#cfeaff','#2f6fa8']);g.beginPath();g.ellipse(0,112,14,28,0,0,7);g.fill();
  } else if(kind===2){ // latająca forteca
    g.fillStyle=hull(-140,140);g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+.39;g.lineTo(Math.cos(a)*140,Math.sin(a)*130);}g.fill();
    g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=3;g.stroke();
    g.fillStyle='#4a4f49';g.beginPath();g.arc(0,0,86,0,7);g.fill();g.fillStyle=lg(g,-60,-60,60,60,['#c8ccc3','#6f756d']);g.beginPath();g.arc(0,0,72,0,7);g.fill();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;g.save();g.rotate(a);g.fillStyle='#1d2124';g.fillRect(-7,-128,14,46);g.fillStyle=p[2];g.fillRect(-9,-86,18,6);g.restore();}
    g.fillStyle=p[2];g.beginPath();g.arc(0,0,26,0,7);g.fill();g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.arc(-8,-8,8,0,7);g.fill();
    for(const s of[-1,1])for(const y of[-60,60]){g.fillStyle='rgba(255,170,60,.9)';g.beginPath();g.arc(s*132,y,10,0,7);g.fill();}
  } else { // pancerny sterowiec
    g.fillStyle=lg(g,-90,0,90,0,[p[1],p[0],p[1]]);g.beginPath();g.ellipse(0,0,96,160,0,0,7);g.fill();
    g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=3;for(let y=-130;y<=130;y+=36){const w=Math.sqrt(Math.max(0,1-(y/160)**2))*96;g.beginPath();g.moveTo(-w,y);g.lineTo(w,y);g.stroke();}
    g.fillStyle=p[2];g.fillRect(-14,-150,28,300);g.globalAlpha=.4;g.fillStyle='#fff';g.fillRect(-14,-150,6,300);g.globalAlpha=1;
    for(const s of[-1,1]){g.fillStyle='#262c32';rrect(g,s*118-18,-20,36,76,12);g.fill();g.fillStyle='rgba(215,230,240,.25)';g.beginPath();g.arc(s*118,-24,28,0,7);g.fill();
      g.fillStyle='#2a2f2c';g.fillRect(s*96-3,0,s*22,6);}
    g.fillStyle='#262c32';rrect(g,-40,100,80,60,14);g.fill();g.fillStyle=lg(g,0,106,0,150,['#cfeaff','#2f6fa8']);g.fillRect(-28,110,56,20);
    for(const x of[-50,50]){g.fillStyle='#1d2124';g.fillRect(x-6,40,12,48);}
  }
  // rysy po uszkodzeniach rysowane osobno; tu tylko lampy ostrzegawcze
  g.restore();},2);}
const BOSSN=['Strażnik','Bombowiec „Żelazny”','Forteca „Mur”','Sterowiec „Lewiatan”'];

/* --- przedmioty --- */
function sToken(){return spr('token',64,64,g=>{
  g.fillStyle=rg(g,0,0,6,30,['rgba(255,210,80,.9)','rgba(255,150,30,0)']);g.beginPath();g.arc(0,0,30,0,7);g.fill();
  g.fillStyle=lg(g,0,-18,0,18,['#ffe9a0','#f29a1c']);g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;g.lineTo(Math.cos(a)*19,Math.sin(a)*19);}g.fill();
  g.strokeStyle='#fff7d6';g.lineWidth=2;g.stroke();
  g.fillStyle='#6a3a00';g.beginPath();g.moveTo(0,-11);g.lineTo(9,0);g.lineTo(4,0);g.lineTo(4,10);g.lineTo(-4,10);g.lineTo(-4,0);g.lineTo(-9,0);g.closePath();g.fill();});}
function sRepair(){return spr('repair',64,64,g=>{
  g.fillStyle=rg(g,0,0,6,30,['rgba(110,255,150,.85)','rgba(110,255,150,0)']);g.beginPath();g.arc(0,0,30,0,7);g.fill();
  g.fillStyle='#effff3';rrect(g,-16,-16,32,32,8);g.fill();g.fillStyle='#22b45c';g.fillRect(-4,-11,8,22);g.fillRect(-11,-4,22,8);});}
const WNAME=['','Karabin','Podwójny karabin','Potrójny karabin','Rakiety','Rakiety samonaprowadzające','Laser','Laser i rakiety','Plazma'];
