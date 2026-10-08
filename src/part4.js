
/* ================= RYSOWANIE ================= */
let state='menu',lastT=0,hudT=0,T=0;
function flashSpr(g,c,x,y,rot,s){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.55;blit(g,c,x,y,rot,1,s);g.restore();}
function drawEnemy(g,e){
  const h=e.hit>0;let c,k;
  switch(e.t){
   case 'drone':c=sDrone();k='drone';break;case 'jet':c=sJet();k='jet';break;case 'gun':c=sGun();k='gunship';break;case 'bomber':c=sBomber();k='bomber';break;
   case 'turret':c=sTurretBase();k='turret';break;case 'tank':c=sTank();k='tank';break;case 'aa':c=sAA();k='aa';break;case 'bunker':c=sBunker();k='bunker';break;
   case 'boss':c=sBoss(e.kind);k='boss'+(e.kind+1);break;
  }
  if(!c)return;
  const s=e.t==='boss'?e.s:1;
  shad(g,k,e.x,e.y,0,s,e.air?18:5,e.air?30:8,e.air?.2:.28);
  blit(g,c,e.x,e.y,0,1,s);
  if(e.t==='turret'){const bi=sBarrel();g.save();g.translate(e.x+1,e.y-5);g.rotate(e.ang+Math.PI/2);g.drawImage(bi,-bi._w*.1,-bi._h/2,bi._w,bi._h);g.restore();}
  if(h)flashSpr(g,c,e.x,e.y,0,s);
  if(e.t!=='boss'&&e.hp<e.mhp&&ET[e.t].hp>100){const w=e.r*1.6;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(e.x-w/2,e.y-e.r-12,w,4);g.fillStyle='#ff5a4a';g.fillRect(e.x-w/2,e.y-e.r-12,w*clamp(e.hp/e.mhp,0,1),4);}
}
function render(){
  const g=ctx;g.setTransform(K,0,0,K,0,0);
  let sx=0,sy=0;if(G.shake>0){sx=rr(-1,1)*G.shake*.6;sy=rr(-1,1)*G.shake*.6;}
  g.save();g.translate(sx,sy);
  drawTerrain(g,G.scroll);
  const th=themeOf(G.stage);
  // cienie chmur
  if(th.cloud>0){const cs=sCloud();for(const c of G.cloud){g.save();g.globalAlpha=.12*th.cloud;g.fillStyle='#000';blit(g,cs,c.x+40,c.y+60,0,.14,c.s);g.restore();}}
  // przedmioty
  for(const it of G.items){const c=it.type==='tok'?sToken():sRepair();blit(g,c,it.x,it.y,0,1,1+.1*Math.sin(it.t*6));}
  // wrogowie (ziemia pod powietrzem)
  for(const e of G.enemies)if(!e.air)drawEnemy(g,e);
  for(const e of G.enemies)if(e.air&&e.t!=='boss')drawEnemy(g,e);
  for(const e of G.enemies)if(e.t==='boss')drawEnemy(g,e);
  // laser
  if(G.laserOn&&G.mode==='play'){
    let top=0;for(const e of G.laserHit)top=Math.max(top,e.y+(e.ey||e.r)*.5);
    const L=LASER[G.wl];
    for(const lx of G.laserX){const x=P.x+lx,y1=P.y-58,w=L.w*(.9+.15*Math.sin(T*60));
      g.save();g.globalCompositeOperation='lighter';
      g.fillStyle=lg(g,x-w,0,x+w,0,['rgba(60,200,255,0)','rgba(90,220,255,.55)','rgba(60,200,255,0)']);g.fillRect(x-w*1.6,top,w*3.2,y1-top);
      g.fillStyle='rgba(235,252,255,.95)';g.fillRect(x-w*.18,top,w*.36,y1-top);g.restore();
      if(top>0){g.save();g.globalCompositeOperation='lighter';blit(g,glowDot(GLOW.cyan,10),x,top,0,.9);g.restore();}}}
  // pociski gracza
  for(const b of G.pb){const c=glowDot(b.gold?GLOW.vio:GLOW.yel,b.gold?3:3);g.save();g.globalCompositeOperation='lighter';blit(g,c,b.x,b.y,0,1,1);g.restore();
    g.fillStyle=b.gold?'#f0d4ff':'#fff7c0';g.fillRect(b.x-1.5,b.y-8,3,14);}
  // rakiety gracza
  for(const m of G.mis){const a=Math.atan2(m.vy,m.vx)+Math.PI/2;g.save();g.translate(m.x,m.y);g.rotate(a);
    g.fillStyle='rgba(255,170,60,.9)';g.beginPath();g.moveTo(-2.5,6);g.lineTo(0,6+9+Math.random()*5);g.lineTo(2.5,6);g.fill();
    g.fillStyle='#eceee8';rrect(g,-2.6,-7,5.2,14,2);g.fill();g.fillStyle='#e8412f';g.beginPath();g.moveTo(-2.6,-6);g.lineTo(0,-11);g.lineTo(2.6,-6);g.fill();g.restore();}
  // helikopter
  if(G.mode==='play'||G.mode==='bossdie'||state==='menu')drawHeli(g,P.x,P.y,T,G.wl,G.invul>0&&G.mode==='play');
  // pociski wroga
  g.save();g.globalCompositeOperation='lighter';
  for(const b of G.eb){if(b.kind==='rocket'){blit(g,glowDot(GLOW.orange,6),b.x,b.y,0,.9);}else blit(g,glowDot(GLOW.red,b.r>6?6:5),b.x,b.y,0,1);}
  g.restore();
  for(const b of G.eb)if(b.kind==='rocket'){g.save();g.translate(b.x,b.y);g.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);g.fillStyle='#d9ddd5';rrect(g,-3,-8,6,16,2);g.fill();g.fillStyle='#e03a2c';g.beginPath();g.moveTo(-3,-7);g.lineTo(0,-13);g.lineTo(3,-7);g.fill();g.restore();}
  else{g.fillStyle='#fff';g.beginPath();g.arc(b.x,b.y,2.2,0,7);g.fill();}
  // cząstki
  for(const p of G.parts){const u=p.t/p.max;
    if(p.k==='fl'){g.save();g.globalCompositeOperation='lighter';g.fillStyle=rg(g,p.x,p.y,0,p.r*(.7+u),['rgba(255,255,230,'+(1-u)+')','rgba('+p.col+','+(.8*(1-u))+')','rgba('+p.col+',0)']);g.beginPath();g.arc(p.x,p.y,p.r*(.7+u),0,7);g.fill();g.restore();}
    else if(p.k==='ring'){g.strokeStyle='rgba(255,230,180,'+(.7*(1-u))+')';g.lineWidth=3*(1-u)+.5;g.beginPath();g.arc(p.x,p.y,p.r*u,0,7);g.stroke();}
    else if(p.k==='sp'){g.fillStyle='rgba(255,'+Math.round(220-120*u)+',80,'+(1-u)+')';g.beginPath();g.arc(p.x,p.y,p.r*(1-u*.5),0,7);g.fill();}
    else if(p.k==='sm'){g.fillStyle=p.fire?'rgba(255,200,120,'+(.5*(1-u))+')':'rgba(40,40,45,'+(.4*(1-u))+')';g.beginPath();g.arc(p.x,p.y,p.r*(.6+u*.8),0,7);g.fill();}}
  // chmury na wierzchu
  if(th.cloud>0){const cs=sCloud();for(const c of G.cloud)blit(g,cs,c.x,c.y,0,c.a*th.cloud*.6,c.s);}
  g.restore();
  if(G.flash>0){g.fillStyle='rgba(255,40,30,'+clamp(G.flash*1.6,0,.35)+')';g.fillRect(0,0,W,H);}
  if(G.mode==='bossdie'&&G.bdT<.5){g.fillStyle='rgba(255,255,255,'+(1-G.bdT*2)*.7+')';g.fillRect(0,0,W,H);}
  // winieta
  if(P.hp<P.maxhp*.3&&G.mode==='play'){g.fillStyle=rg(g,W/2,H/2,H*.3,H*.7,['rgba(255,0,0,0)','rgba(255,0,0,'+(.25+.1*Math.sin(T*8))+')']);g.fillRect(0,0,W,H);}
}

/* ================= HUD ================= */
function hud(){
  $('#hpb i').style.width=(clamp(P.hp/P.maxhp,0,1)*100)+'%';
  $('#xpb i').style.width=(clamp(G.exp/expNeed(G.plvl),0,1)*100)+'%';
  $('#hpb').classList.toggle('low',P.hp<P.maxhp*.3);
  $('#lv').textContent='Pilot '+G.plvl;
  $('#score').textContent=Math.round(G.score).toLocaleString('pl-PL');
  $('#stg').textContent='Poziom '+G.stage;
  $('#wname').textContent=WNAME[G.wl];
  const pp=$('#pips');if(pp.children.length!==8){pp.innerHTML='<span></span>'.repeat(8);}
  for(let i=0;i<8;i++)pp.children[i].classList.toggle('on',i<G.wl);
}

/* ================= EKRANY ================= */
const OV=['menu','how','scores','pausep','clear','over'];
function show(id){for(const o of OV)$('#'+o).classList.toggle('on',o===id);}
function inGameUI(on){$('#hud').classList.toggle('on',on);$('#wpn').classList.toggle('on',on);if(!on){$('#boss').classList.remove('on');$('#warn').classList.remove('on');}}
function scoresGet(){return LS.get('hk_scores',[]);}
function scoreSave(){if(G.score<=0||G.saved)return;G.saved=true;const a=scoresGet();a.push({s:Math.round(G.score),st:G.stage,d:new Date().toLocaleDateString('pl-PL')});a.sort((x,y)=>y.s-x.s);LS.set('hk_scores',a.slice(0,8));}
function fillBest(){const a=scoresGet();$('#best').textContent=a.length?'Rekord: '+a[0].s.toLocaleString('pl-PL')+' (poziom '+a[0].st+')':'Jeszcze nie ma rekordów';}
function kvHtml(rows){return rows.map(r=>'<span>'+r[0]+'</span><b>'+r[1]+'</b>').join('');}
function toMenu(){state='menu';newRun();G.wl=3;G.mode='demo';inGameUI(false);fillBest();show('menu');}
function play(){SND.init();newRun();state='run';inGameUI(true);show(null);startStage();hud();}
function gameOver(){
  state='over';scoreSave();inGameUI(false);
  $('#ovS').textContent=Math.round(G.score).toLocaleString('pl-PL');
  $('#ovK').innerHTML=kvHtml([['Poziom',G.stage],['Poziom pilota',G.plvl],['Zestrzelone cele',G.stats.kills],['Pokonane bossy',G.stats.bosses],['Zebrane żetony',G.stats.tokens]]);
  show('over');
}
function stageClear(){
  state='clear';
  $('#clT').textContent='Poziom '+G.stage+' ukończony';
  $('#clS').textContent=Math.round(G.score).toLocaleString('pl-PL');
  $('#clK').innerHTML=kvHtml([['Boss','pokonany'],['Poziom pilota',G.plvl],['Broń',WNAME[G.wl]],['Zestrzelone cele',G.stats.kills]]);
  SND.p('win');inGameUI(false);show('clear');
}
function nextStage(){G.stage++;P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.4);state='run';inGameUI(true);show(null);startStage();hud();}
function pauseGame(){if(state!=='run'||G.mode!=='play'&&G.mode!=='bossdie')return;state='pause';show('pausep');}
function resumeGame(){if(state!=='pause')return;state='run';show(null);lastT=0;}
$('#bPlay').onclick=play;
$('#bHow').onclick=()=>show('how');
$('#bScores').onclick=()=>{const a=scoresGet();$('#slist').innerHTML=a.length?a.map((r,i)=>'<div class="hs"><div class="p">'+(i+1)+'</div><div class="n"><b>'+r.s.toLocaleString('pl-PL')+'</b><small>poziom '+r.st+' · '+r.d+'</small></div></div>').join(''):'<p>Jeszcze nie ma rekordów. Zagraj pierwszą partię.</p>';show('scores');};
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show('menu'));
$('#bSound').onclick=()=>{SND.on=!SND.on;LS.set('hk_snd',SND.on);SND.init();sndLbl();};
function sndLbl(){$('#bSound').textContent='Dźwięk: '+(SND.on?'włączony':'wyłączony');}
$('#pause').onclick=pauseGame;
$('#bResume').onclick=resumeGame;
$('#bRestart').onclick=()=>{scoreSave();play();};
$('#bQuit').onclick=()=>{scoreSave();toMenu();};
$('#bNext').onclick=nextStage;
$('#bAgain').onclick=play;
$('#bMenu').onclick=toMenu;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});

/* ================= STEROWANIE ================= */
let drag=null;
const stg=$('#stage');
stg.addEventListener('pointerdown',e=>{if(state!=='run'||e.target.closest('button'))return;SND.init();const r=stg.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:P.tx,py:P.ty,k:W/r.width};try{stg.setPointerCapture(e.pointerId);}catch(_){}});
stg.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;P.tx=clamp(drag.px+(e.clientX-drag.x)*drag.k*1.15,30,W-30);P.ty=clamp(drag.py+(e.clientY-drag.y)*drag.k*1.15,60,H-40);});
const endDrag=e=>{if(drag&&e.pointerId===drag.id)drag=null;};
stg.addEventListener('pointerup',endDrag);stg.addEventListener('pointercancel',endDrag);
addEventListener('keydown',e=>{keys[e.key]=true;if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(state==='run')pauseGame();else if(state==='pause')resumeGame();}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.key]=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('resize',resize);

/* ================= PĘTLA ================= */
function loop(ts){
  requestAnimationFrame(loop);
  if(!lastT){lastT=ts;return;}
  let dt=Math.min(.05,(ts-lastT)/1000);lastT=ts;T+=dt;
  if(state==='run'){
    let n=dt>.034?2:1;for(let i=0;i<n;i++)update(dt/n);
    if(state==='run'||state==='over'||state==='clear'){hudT-=dt;if(hudT<=0){hudT=.08;hud();}}
  } else if(state==='menu'){G.scroll+=70*dt;for(const c of G.cloud){c.y+=70*c.v*dt;if(c.y>H+120){c.y=-120;c.x=rr(0,W);}}P.x=W/2+Math.sin(T*.6)*70;P.y=H*.38+Math.sin(T*.9)*20;}
  else if(state==='pause'){}
  render();
}
window.DBG={get G(){return G;},P,update,render,play,nextStage,get state(){return state;},set state(v){state=v;},hud,keys};
DBG.ready=false;
loadAssets().then(()=>{DBG.ready=true;resize();sndLbl();toMenu();requestAnimationFrame(loop);});
