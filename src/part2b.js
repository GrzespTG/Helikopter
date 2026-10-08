
/* ================= GRAFIKI (wczytywane z assets.js) ================= */
const IMG={},SIL={};
function loadAssets(){
  return Promise.all(Object.keys(ASSETS).map(k=>new Promise(res=>{
    const im=new Image();
    im.onload=()=>{const m=ASSET_META[k];im._w=m[0]/2;im._h=m[1]/2;IMG[k]=im;res();};
    im.onerror=()=>res();im.src=ASSETS[k];}))); }
function sil(k){let c=SIL[k];if(c)return c;const im=IMG[k];c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);c._w=im._w;c._h=im._h;SIL[k]=c;return c;}
function shad(g,k,x,y,rot,s,dx,dy,a){blit(g,sil(k),x+dx,y+dy,rot,a,s);}

/* teren: pionowe kafle, co drugi odbity w pionie, żeby szwy się łączyły */
function drawTerrain(g,scroll){
  const t=IMG['tile'+curTile];if(!t){g.fillStyle='#4a7a3a';g.fillRect(0,0,W,H);return;}
  const th=Math.round(W*t.naturalHeight/t.naturalWidth);
  const n0=Math.floor(scroll/th),n1=Math.floor((scroll+H)/th);
  for(let n=n0;n<=n1;n++){
    const sy=Math.round(H-((n+1)*th-scroll));
    if(n&1){g.save();g.translate(0,sy+th);g.scale(1,-1);g.drawImage(t,0,0,W,th+1);g.restore();}
    else g.drawImage(t,0,sy,W,th+1);}
}

/* helikopter gracza: kadłub (nos w górę) + skrzydła od poziomu broni 4 + wirnik */
const PODS=[null,null,null,null,[34],[26,42],[26,44],[26,44],[24,42]];
const MAST=.337; // położenie masztu wirnika w kadłubie (ułamek wysokości)
function drawHeli(g,x,y,t,wl,flash){
  const b=IMG.heli,r=IMG.rotor;if(!b)return;
  const S=1.2,RD=118; // skala kadłuba i średnica wirnika
  g.save();g.translate(x,y);
  const wk=wl>=4?'wing'+Math.min(4,wl-3):null,w=wk?IMG[wk]:null;
  g.save();g.scale(S,S);
  if(w)blit(g,sil(wk),14,31,0,.25);
  blit(g,sil('heli'),14,28+(.5-MAST)*b._h,0,.25);g.restore();
  g.save();g.scale(S,S);
  if(flash)g.globalAlpha=.55+.4*Math.sin(t*50);
  if(w)blit(g,w,0,3);
  g.drawImage(b,-b._w/2,-MAST*b._h,b._w,b._h);g.restore();
  // wirnik: półprzezroczysty dysk i obracające się łopaty
  g.save();if(flash)g.globalAlpha=.55+.4*Math.sin(t*50);
  g.fillStyle=rg(g,0,0,6,RD/2,['rgba(210,225,235,.0)','rgba(210,225,235,.14)','rgba(210,225,235,.02)']);g.beginPath();g.arc(0,0,RD/2,0,7);g.fill();
  g.rotate(t*24);g.globalAlpha*=.8;const k=RD/r._w;g.drawImage(r,-r._w*k/2,-r._h*k/2,r._w*k,r._h*k);g.restore();
  g.restore();
}

/* przedmioty i wrogowie: gotowe obrazy (nos wrogów powietrznych w dół) */
const sToken=()=>IMG.token,sRepair=()=>IMG.repair;
const sDrone=()=>IMG.drone,sJet=()=>IMG.jet,sGun=()=>IMG.gunship,sBomber=()=>IMG.bomber;
const sTurretBase=()=>IMG.turret,sBarrel=()=>IMG.barrel,sTank=()=>IMG.tank,sAA=()=>IMG.aa,sBunker=()=>IMG.bunker;
const sBoss=kind=>IMG['boss'+(kind+1)];
