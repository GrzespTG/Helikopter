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
let curTheme=THEMES[0],curTile=0;
function setTheme(stage){curTheme=themeOf(stage);curTile=(stage-1)%5;}

/* ================= SPRITY ================= */
const SPR={};
function spr(key,w,h,fn,sc){sc=sc||2;let c=SPR[key];if(c)return c;
  c=document.createElement('canvas');c.width=w*sc;c.height=h*sc;const g=c.getContext('2d');g.scale(sc,sc);g.translate(w/2,h/2);fn(g);SPR[key]=c;c._w=w;c._h=h;return c;}
function blit(g,c,x,y,rot,a,s){g.save();g.translate(x,y);if(rot)g.rotate(rot);if(a!=null&&a<1)g.globalAlpha=a;s=s||1;g.drawImage(c,-c._w/2*s,-c._h/2*s,c._w*s,c._h*s);g.restore();}
function lg(g,x0,y0,x1,y1,stops){const r=g.createLinearGradient(x0,y0,x1,y1);stops.forEach((s,i)=>r.addColorStop(i/(stops.length-1),s));return r;}
function rg(g,x,y,r0,r1,stops){const r=g.createRadialGradient(x,y,r0,x,y,r1);stops.forEach((s,i)=>r.addColorStop(i/(stops.length-1),s));return r;}
function rrect(g,x,y,w,h,r){g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);}


/* --- pociski --- */
function glowDot(col,r){return spr('gd'+col+r,r*6,r*6,g=>{g.fillStyle=rg(g,0,0,0,r*3,[col,col.replace(/[\d.]+\)$/,'0.0)')]);g.beginPath();g.arc(0,0,r*3,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(0,0,r*.55,0,7);g.fill();},2);}
const GLOW={orange:'rgba(255,150,40,1)',red:'rgba(255,60,70,1)',yel:'rgba(255,230,90,1)',cyan:'rgba(80,220,255,1)',vio:'rgba(190,120,255,1)',grn:'rgba(110,255,150,1)'};


const BOSSN=['Strażnik','Bombowiec „Żelazny”','Forteca „Mur”','Sterowiec „Lewiatan”'];
const WNAME=['','Karabin','Podwójny karabin','Potrójny karabin','Rakiety','Rakiety samonaprowadzające','Laser','Laser i rakiety','Plazma'];