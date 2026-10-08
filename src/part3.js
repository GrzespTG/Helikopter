
/* ================= DŹWIĘK ================= */
const SND={on:LS.get('hk_snd',true),ac:null,
  init(){if(this.ac||!this.on)return;try{this.ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}},
  tone(f,d,type,v,w,f2){if(!this.on||!this.ac)return;try{const a=this.ac,t=a.currentTime+(w||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02);}catch(e){}},
  noise(d,v,fc,w){if(!this.on||!this.ac)return;try{const a=this.ac,n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*(1-i/n);
    const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||800;const g=a.createGain();g.gain.value=v||.1;s.connect(f);f.connect(g);g.connect(a.destination);s.start(a.currentTime+(w||0));}catch(e){}},
  last:{},
  p(k){const now=performance.now();if(this.last[k]&&now-this.last[k]<({gun:70,hit:60,boom:50,mis:120}[k]||0))return;this.last[k]=now;
    switch(k){
     case 'gun':this.tone(520,.05,'square',.012,0,260);break;
     case 'mis':this.noise(.25,.05,1800);this.tone(180,.2,'sawtooth',.02,0,500);break;
     case 'boom':this.noise(.35,.12,500);this.tone(90,.25,'sine',.08,0,40);break;
     case 'big':this.noise(.8,.2,350);this.tone(70,.7,'sine',.14,0,30);break;
     case 'hit':this.tone(240,.12,'sawtooth',.05,0,90);break;
     case 'pick':this.tone(660,.08,'triangle',.06);this.tone(880,.08,'triangle',.06,.07);this.tone(1320,.14,'triangle',.06,.14);break;
     case 'lvl':for(let i=0;i<4;i++)this.tone(440*Math.pow(1.26,i),.16,'triangle',.06,i*.09);break;
     case 'warn':for(let i=0;i<6;i++)this.tone(i%2?500:760,.2,'square',.035,i*.22);break;
     case 'win':for(let i=0;i<5;i++)this.tone(330*Math.pow(1.19,i),.2,'triangle',.06,i*.12);break;
     case 'lose':this.tone(300,.8,'sawtooth',.06,0,60);break;
     case 'laser':this.tone(130,.09,'sawtooth',.018,0,150);break;
    }}};

/* ================= DANE GRY ================= */
const ET={
 drone:{r:20,hp:18,sc:50,exp:6,tok:.012,air:1},
 jet:{r:26,hp:46,sc:120,exp:12,tok:.03,air:1},
 gun:{r:34,hp:170,sc:350,exp:30,tok:.14,air:1,ex:26,ey:44},
 bomber:{r:50,hp:420,sc:900,exp:70,tok:.35,air:1,ex:78,ey:52},
 turret:{r:26,hp:60,sc:100,exp:10,tok:.03,gr:1},
 tank:{r:30,hp:150,sc:220,exp:20,tok:.08,gr:1,ex:24,ey:42},
 aa:{r:30,hp:100,sc:260,exp:25,tok:.1,gr:1},
 bunker:{r:42,hp:400,sc:600,exp:50,tok:.25,gr:1}
};
const GUN=[null,[[0,0]],[[-9,0],[9,0]],[[-9,0],[9,0],[-19,-.14],[19,.14]],null,[[-9,0],[9,0],[0,0],[-19,-.14],[19,.14]],null,null,[[-9,0],[9,0],[0,0],[-19,-.14],[19,.14],[-27,-.28],[27,.28]]];
GUN[4]=GUN[3];GUN[6]=GUN[5];GUN[7]=GUN[5];
const MISN=[0,0,0,0,2,4,4,6,8],MISCD=[0,0,0,0,1.15,1.0,1.0,.85,.7];
const LASER=[0,0,0,0,0,0,{w:10,dps:120,n:1},{w:16,dps:190,n:1},{w:13,dps:240,n:2}];
const DIFFS=[
 {n:'Łatwy',exp:1.35,tok:1.4,dmg:.75,hp:.85,sc:.8,pity:.8,rate:.9},
 {n:'Normalny',exp:1,tok:1,dmg:1,hp:1,sc:1,pity:1,rate:1},
 {n:'Trudny',exp:.75,tok:.65,dmg:1.3,hp:1.2,sc:1.3,pity:1.45,rate:1.15},
 {n:'Koszmar',exp:.6,tok:.45,dmg:1.45,hp:1.35,sc:1.6,pity:2,rate:1.3}];
let DIFI=clamp(LS.get('hk_diff',1),0,3),DIF=DIFFS[DIFI];
function setDiff(i){DIFI=((i%4)+4)%4;DIF=DIFFS[DIFI];LS.set('hk_diff',DIFI);}
let G=null;
const P={x:W/2,y:H*.78,tx:W/2,ty:H*.78,vx:0,hp:100,maxhp:100,gcd:0,mcd:0,r:11};
const keys={};
const expNeed=l=>Math.round(60*Math.pow(1.38,l-1));
const dmgMul=()=>1+.08*(G.plvl-1);
const diff=()=>(G.stage-1)*.35+clamp(G.t/G.levelTime,0,1)*.25;
const hpMul=()=>(1+.25*(G.stage-1)+.15*clamp(G.t/G.levelTime,0,1))*DIF.hp;
const scrollSpd=()=>(95+8*Math.min(G.stage,6))*(G.boss?.6:1);

function newRun(){
  G={mode:'play',stage:1,t:0,scroll:0,score:0,exp:0,plvl:1,wl:2,enemies:[],eb:[],pb:[],mis:[],parts:[],items:[],boss:null,bossWarn:0,bossDead:0,
    shake:0,flash:0,invul:0,noTok:0,spawnT:2,levelTime:60+6,time:0,cloud:[],laserOn:false,laserHit:[],stats:{kills:0,tokens:0,bosses:0,hits:0},msgT:0,lastHud:0};
  setTheme(1);initClouds();
  P.x=W/2;P.y=H*.78;P.tx=P.x;P.ty=P.y;P.maxhp=100;P.hp=100;P.gcd=0;P.mcd=0;
}
function startStage(){
  G.t=0;G.boss=null;G.bossWarn=0;G.bossDead=0;G.enemies.length=0;G.eb.length=0;G.items.length=0;G.mis.length=0;G.spawnT=2.2;
  G.levelTime=Math.min(100,60+6*G.stage);G.scroll=0;setTheme(G.stage);initClouds();G.mode='play';
  msg('Poziom '+G.stage,themeOf(G.stage).n);
}
function initClouds(){G.cloud=[];for(let i=0;i<7;i++)G.cloud.push({x:rr(0,W),y:rr(-100,H),s:rr(.9,1.8),v:rr(1.5,2.2),a:rr(.5,.9)});}
function sCloud(){return spr('cloud',200,120,g=>{for(let i=0;i<9;i++){const x=rr(-60,60),y=rr(-20,20),r=rr(22,44);g.fillStyle=rg(g,x,y,0,r,['rgba(255,255,255,.95)','rgba(255,255,255,0)']);g.beginPath();g.arc(x,y,r,0,7);g.fill();}},1);}

/* ================= POCISKI I EFEKTY ================= */
function eShot(x,y,ang,sp,o){G.eb.push(Object.assign({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:6,dmg:dmgE(),kind:'n',life:8},o||{}));}
const dmgE=()=>Math.min(40,10+2.2*G.stage)*DIF.dmg;
const bSpd=()=>Math.min(330,185+11*G.stage);
function aimAng(x,y){return Math.atan2(P.y-y,P.x-x);}
function boom(x,y,s,col){
  G.parts.push({k:'fl',x,y,t:0,max:.35+s*.004,r:s,col:col||'255,190,80'});
  G.parts.push({k:'ring',x,y,t:0,max:.5,r:s*1.5});
  const n=Math.min(18,Math.round(s/4));for(let i=0;i<n;i++){const a=rr(0,6.3),v=rr(60,240)*(s/40+.4);G.parts.push({k:'sp',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,max:rr(.3,.8),r:rr(1.5,3.5)});}
  for(let i=0;i<Math.min(8,s/6);i++)G.parts.push({k:'sm',x:x+rr(-s*.4,s*.4),y:y+rr(-s*.4,s*.4),vx:rr(-20,20),vy:rr(-10,30),t:0,max:rr(.7,1.4),r:rr(s*.25,s*.5)});
  G.shake=Math.max(G.shake,Math.min(14,s/6));
  SND.p(s>70?'big':'boom');
}
function msg(t,s){const m=$('#msg');m.innerHTML=t+(s?'<small>'+s+'</small>':'');m.classList.remove('show');void m.offsetWidth;m.classList.add('show');}

/* ================= WROGOWIE ================= */
function spawnE(type,x,y,o){
  const d=ET[type],hp=d.hp*hpMul();
  const e=Object.assign({t:type,x,y,hp,mhp:hp,r:d.r,ex:d.ex,ey:d.ey,age:0,cd:rr(.4,1.6),hit:0,air:!!d.air,x0:x,ph:rr(0,6.3),ang:Math.PI/2},o||{});
  G.enemies.push(e);return e;
}
function spawnWave(){
  const st=G.stage,d=diff(),lim=12+st;
  if(G.enemies.length>=lim)return;
  const r=RND();
  if(r<.58){ // powietrze
    const opts=['drone','drone','jet'];if(G.t>18)opts.push('gun');if(st>=3&&G.t>25)opts.push('bomber');
    const t=pick(opts);
    if(t==='drone'){const n=4+Math.floor(d*2),x=rr(110,W-110);for(let i=0;i<n;i++)spawnE('drone',x,-30-i*46,{x0:x});}
    else if(t==='jet'){const n=2+Math.floor(d);for(let i=0;i<n;i++)spawnE('jet',rr(60,W-60),-40-i*90);}
    else if(t==='gun')spawnE('gun',rr(120,W-120),-60,{ty:rr(120,260)});
    else spawnE('bomber',rr(150,W-150),-90,{ty:rr(110,170)});
  } else { // ziemia
    const opts=['turret','turret'];if(st>=2)opts.push('tank');if(st>=3)opts.push('aa');if(st>=4)opts.push('bunker');
    const t=pick(opts),n=t==='bunker'?1:ri(1,3),x=rr(70,W-70);
    for(let i=0;i<n;i++)spawnE(t,clamp(x+i*rr(50,80),40,W-40),-40-i*rr(30,90),{gr:true});
  }
}
function updEnemy(e,dt){
  e.age+=dt;if(e.hit>0)e.hit-=dt;const sp=scrollSpd();
  e.cd-=dt;
  switch(e.t){
   case 'drone':e.y+=130*dt;e.x=e.x0+Math.sin(e.age*3+e.ph)*60;e.ang=Math.PI/2;break;
   case 'jet':{e.y+=(200+6*G.stage)*dt;e.x+=Math.sign(P.x-e.x)*Math.min(60,Math.abs(P.x-e.x))*dt;
     if(e.cd<=0&&e.y>40&&e.y<H*.55){e.cd=1.5/(1+.08*diff());const a=aimAng(e.x,e.y);eShot(e.x,e.y+10,a,bSpd());}break;}
   case 'gun':{const ty=e.ty||180;if(e.y<ty)e.y+=90*dt;else e.x=e.x0+Math.sin(e.age*.8+e.ph)*120;
     if(e.age>24)e.y-=80*dt;
     if(e.cd<=0&&e.y>40){e.cd=2.4/(1+.08*diff());for(let i=-1;i<=1;i++)eShot(e.x,e.y+22,aimAng(e.x,e.y)+i*.16,bSpd());}break;}
   case 'bomber':{const ty=e.ty||140;if(e.y<ty)e.y+=50*dt;else e.x=e.x0+Math.sin(e.age*.5+e.ph)*100;
     if(e.age>30)e.y-=60*dt;
     if(e.cd<=0&&e.y>30){e.cd=2.2/(1+.06*diff());for(let i=-3;i<=3;i++)eShot(e.x+i*14,e.y+30,Math.PI/2+i*.17,bSpd()*.85);eShot(e.x,e.y+34,aimAng(e.x,e.y),bSpd());}break;}
   case 'turret':e.y+=sp*dt;e.ang=aimAng(e.x,e.y)-Math.PI/2;
     if(e.cd<=0&&e.y>10&&e.y<H-200){e.cd=2.1/(1+.08*diff());eShot(e.x,e.y,aimAng(e.x,e.y),bSpd());}break;
   case 'tank':e.y+=(sp*.75)*dt;e.x+=Math.sign(P.x-e.x)*18*dt;e.ang=aimAng(e.x,e.y)-Math.PI/2;
     if(e.cd<=0&&e.y>10&&e.y<H-220){e.cd=2.4/(1+.08*diff());const a=aimAng(e.x,e.y);eShot(e.x,e.y,a-.1,bSpd());eShot(e.x,e.y,a+.1,bSpd());}break;
   case 'aa':e.y+=sp*dt;
     if(e.cd<=0&&e.y>10&&e.y<H-240){e.cd=3/(1+.05*diff());eShot(e.x,e.y-14,-Math.PI/2+rr(-.6,.6),150,{kind:'rocket',home:1,r:7,life:4.5,hp:1});}break;
   case 'bunker':e.y+=sp*dt;
     if(e.cd<=0&&e.y>10&&e.y<H-240){e.cd=3.2/(1+.05*diff());const n=8;const a0=rr(0,6.3);for(let i=0;i<n;i++)eShot(e.x,e.y,a0+i*6.283/n,bSpd()*.7);eShot(e.x,e.y,aimAng(e.x,e.y),bSpd());}break;
  }
  const off=e.air&&e.t!=='gun'&&e.t!=='bomber'?H+60:H+90;
  if(e.y>off||(e.y<-140&&e.age>3))e.dead=true;
}
function enemyHit(e,x,y,r){ // trafienie okręgiem
  if(e.ex){const dx=(x-e.x)/(e.ex+r),dy=(y-e.y)/(e.ey+r);return dx*dx+dy*dy<1;}
  return Math.hypot(x-e.x,y-e.y)<e.r+r;
}
function hurtE(e,amt,laser){
  if(e.dead)return;
  if(e.t==='boss'){amt*=e.armor;if(!laser&&e.armor<1&&RND()<.3)G.parts.push({k:'sp',x:e.x+rr(-60,60),y:e.y+rr(20,80),vx:rr(-90,90),vy:rr(-120,-20),t:0,max:.25,r:2});}
  e.hp-=amt;e.hit=.07;
  if(e.hp<=0)killE(e);
}
function killE(e){
  if(e.dead)return;e.dead=true;
  if(e.t==='boss'){bossDown(e);return;}
  const d=ET[e.t];G.score+=Math.round(d.sc*(1+.1*(G.stage-1))*DIF.sc);gainExp(d.exp);G.stats.kills++;
  boom(e.x,e.y,d.r*(e.t==='bomber'?2.4:2.1),e.gr?'255,160,60':'255,200,90');
  // żeton ulepszenia lub naprawa
  let ch=d.tok*DIF.tok;if(G.noTok>(G.wl<4?22:G.wl<6?60:90)*DIF.pity&&d.tok>=.03)ch=1;
  if(RND()<ch){G.items.push({type:'tok',x:e.x,y:e.y,t:0});G.noTok=0;}
  else if(e.gr&&RND()<.07*DIF.tok)G.items.push({type:'rep',x:e.x,y:e.y,t:0});
  else if(!e.gr&&RND()<.03*DIF.tok)G.items.push({type:'rep',x:e.x,y:e.y,t:0});
}
function gainExp(n){
  G.exp+=n*DIF.exp;
  while(G.exp>=expNeed(G.plvl)){G.exp-=expNeed(G.plvl);G.plvl++;const old=P.maxhp;P.maxhp=100+12*(G.plvl-1);P.hp=Math.min(P.maxhp,P.hp+P.maxhp-old+P.maxhp*.2);
    msg('Poziom pilota '+G.plvl,'więcej życia i mocniejsze strzały');SND.p('lvl');}
}
function hurtP(d){
  if(G.invul>0||G.mode!=='play')return;
  P.hp-=d;G.invul=.9;G.flash=.25;G.shake=Math.max(G.shake,9);G.stats.hits++;SND.p('hit');try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}
  if(P.hp<=0){P.hp=0;playerDown();}
}
function playerDown(){
  boom(P.x,P.y,90);boom(P.x,P.y,60,'255,120,40');G.mode='dying';G.dyT=1.4;SND.p('lose');
}
function pickup(it){
  if(it.type==='rep'){P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.3);SND.p('pick');msg('Naprawa','+30% życia');G.score+=100;return;}
  G.stats.tokens++;SND.p('pick');
  if(G.wl>=8){G.score+=3000;P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.2);msg('Pełna moc','+3000 punktów');return;}
  G.wl++;G.score+=500;
  msg(WNAME[G.wl],G.wl===4?'z boków wyjeżdżają skrzydła z rakietami':G.wl===6?'wiązka lasera':G.wl===8?'plazma. Pełna moc':'ulepszenie broni');
}

/* ================= BOSS ================= */
function spawnBoss(){
  const st=G.stage,kind=(st-1)%4,sc=clamp(.62+.05*st,.62,.95),s=sc/.95,im=sBoss(kind);
  const hp=24000*(1+.75*(st-1))*DIF.hp;
  const bw=im?im._w*s:280,bh=im?im._h*s:280;
  const b={t:'boss',kind,x:W/2,y:-bh,hp,mhp:hp,r:.3*bh,ex:.4*bw,ey:.34*bh,sc,s,age:0,hit:0,armor:.5,phase:0,x0:W/2,ph:0,a1:1.5,a2:3,a3:4,a4:6,a5:0,spin:0,air:true,name:BOSSN[kind]+' '+toRoman(st)};
  G.boss=b;G.enemies.push(b);$('#boss').classList.add('on');$('#bossn').textContent=b.name;
}
const toRoman=n=>['','I','II','III','IV','V','VI','VII','VIII','IX','X'][n]||String(n);
function updBoss(b,dt){
  b.age+=dt;if(b.hit>0)b.hit-=dt;
  if(G.mode==='dying'){return;}
  const m=1+.12*(G.stage-1),r=b.hp/b.mhp;
  b.phase=r>.66?0:r>.33?1:2;b.armor=[.5,.72,1][b.phase];
  if(b.y<170)b.y+=110*dt;else{b.x=W/2+Math.sin(b.age*.5)*W*.26;b.y=170+Math.sin(b.age*.9)*18;
    b.a1-=dt;b.a2-=dt;
    const fan=Math.min(13,5+G.stage),sp=bSpd();
    if(b.a1<=0){b.a1=(b.phase===2?.8:1.2)/Math.sqrt(m);const a=aimAng(b.x,b.y+60);for(let i=0;i<fan;i++)eShot(b.x,b.y+70,a+(i-(fan-1)/2)*.15,sp*.9);}
    if(b.a2<=0){b.a2=3.6/Math.sqrt(m);const n=14+G.stage*2,a0=rr(0,6.3);for(let i=0;i<n;i++)eShot(b.x,b.y+30,a0+i*6.283/n,sp*.6,{r:7});}
    if(b.phase>=1){b.a3-=dt;b.a4-=dt;
      if(b.a3<=0){b.a3=3.2/Math.sqrt(m);for(const s of[-1,1])eShot(b.x+s*90*b.sc,b.y+40,Math.PI/2,140,{kind:'rocket',home:1,r:8,life:5,hp:1});}
      if(b.a4<=0){b.a4=8;for(let i=0;i<3;i++)spawnE('drone',clamp(b.x+(i-1)*80,60,W-60),b.y+40,{x0:clamp(b.x+(i-1)*80,60,W-60)});}}
    if(b.phase===2){b.a5-=dt;if(b.a5<=0){b.a5=.11/Math.sqrt(m);b.spin+=.47;for(const s of[0,Math.PI])eShot(b.x,b.y+30,b.spin+s,sp*.65);}}
  }
  $('#bossb i').style.width=(clamp(b.hp/b.mhp,0,1)*100)+'%';
}
function bossDown(b){
  G.mode='bossdie';G.bdT=2.4;G.bx=b.x;G.by=b.y;G.eb.length=0;G.score+=Math.round(4000*G.stage*DIF.sc);gainExp(150*G.stage);G.stats.bosses++;
  G.items.push({type:'tok',x:b.x-30,y:b.y+40,t:0},{type:'rep',x:b.x+30,y:b.y+40,t:0});
  $('#boss').classList.remove('on');
}

/* ================= AKTUALIZACJA ================= */
function updPlayer(dt){
  let kx=(keys.ArrowRight||keys.d||keys.D?1:0)-(keys.ArrowLeft||keys.a||keys.A?1:0),ky=(keys.ArrowDown||keys.s||keys.S?1:0)-(keys.ArrowUp||keys.w||keys.W?1:0);
  if(kx||ky){P.tx=clamp(P.x+kx*400*dt*3,30,W-30);P.ty=clamp(P.y+ky*400*dt*3,60,H-40);}
  const ox=P.x;P.x+=(P.tx-P.x)*Math.min(1,dt*16);P.y+=(P.ty-P.y)*Math.min(1,dt*16);
  P.vx=lerp(P.vx,(P.x-ox)/Math.max(dt,.001),Math.min(1,dt*10));
  if(G.invul>0)G.invul-=dt;
  fire(dt);
}
function fire(dt){
  const wl=G.wl,dm=dmgMul();
  P.gcd-=dt;
  if(P.gcd<=0){P.gcd=wl>=8?.1:wl>=3?.13:.16;
    const dmg=(wl>=8?13:9)*dm;
    for(const[dx,a]of GUN[wl])G.pb.push({x:P.x+dx,y:P.y-58,vx:Math.sin(a)*620,vy:-Math.cos(a)*620,dmg,r:4,gold:wl>=8});
    SND.p('gun');}
  if(wl>=4){P.mcd-=dt;
    if(P.mcd<=0){P.mcd=MISCD[wl];const n=MISN[wl]/2,hom=wl>=5;
      for(const s of[-1,1])for(let i=0;i<n;i++)G.mis.push({x:P.x+s*(PODS[wl][i%PODS[wl].length]*1.2+Math.floor(i/PODS[wl].length)*5),y:P.y-20+Math.floor(i/PODS[wl].length)*10,vx:s*(14+i*6),vy:-120,dmg:34*dm*(wl>=8?1.3:1),hom,t:0,s});
      SND.p('mis');}}
  const L=LASER[wl];G.laserOn=!!L;
  if(L){const xs=L.n===2?[-14,14]:[0];G.laserX=xs;G.laserW=L.w;G.laserHit.length=0;
    for(const lx of xs){const bx=P.x+lx;
      for(const e of G.enemies){if(e.dead||e.y>P.y-58||e.y<-60)continue;
        const hw=(e.ex||e.r)+L.w/2;if(Math.abs(e.x-bx)<hw){hurtE(e,L.dps*dm*dt,true);G.laserHit.push(e);}}}
    SND.p('laser');}
}
function updBullets(dt){
  for(const b of G.pb){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<-20||b.x<-20||b.x>W+20)b.dead=true;
    if(b.dead)continue;
    for(const e of G.enemies){if(e.dead||e.y<-30)continue;if(enemyHit(e,b.x,b.y,b.r)){hurtE(e,b.dmg);b.dead=true;G.parts.push({k:'sp',x:b.x,y:b.y,vx:rr(-60,60),vy:rr(-80,20),t:0,max:.2,r:2});break;}}}
  for(const m of G.mis){m.t+=dt;
    if(m.hom&&m.t>.25){let best=null,bd=1e9;for(const e of G.enemies){if(e.dead||e.y<0)continue;const d=Math.hypot(e.x-m.x,e.y-m.y);if(d<bd&&e.y<m.y+40){bd=d;best=e;}}
      if(best){const a=Math.atan2(best.y-m.y,best.x-m.x),cur=Math.atan2(m.vy,m.vx);let da=a-cur;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;
        const na=cur+clamp(da,-6*dt,6*dt),sp=Math.min(560,Math.hypot(m.vx,m.vy)+500*dt);m.vx=Math.cos(na)*sp;m.vy=Math.sin(na)*sp;}
      else{m.vy-=500*dt;}}
    else{m.vy-=420*dt;m.vx*=.98;}
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    G.parts.push({k:'sm',x:m.x,y:m.y+8,vx:rr(-8,8),vy:30,t:0,max:.4,r:4,fire:1});
    if(m.y<-30||m.x<-30||m.x>W+30){m.dead=true;continue;}
    for(const e of G.enemies){if(e.dead||e.y<-20)continue;if(enemyHit(e,m.x,m.y,6)){m.dead=true;
        boom(m.x,m.y,38,'255,210,120');
        for(const f of G.enemies)if(!f.dead&&Math.hypot(f.x-m.x,f.y-m.y)<56+(f.ex||f.r)*.5)hurtE(f,m.dmg*(f===e?1:.6));
        for(const q of G.eb)if(q.hp&&Math.hypot(q.x-m.x,q.y-m.y)<56)q.dead=true;break;}}}
  for(const b of G.eb){
    if(b.home&&b.life>0){const a=aimAng(b.x,b.y),cur=Math.atan2(b.vy,b.vx);let da=a-cur;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;const na=cur+clamp(da,-1.4*dt,1.4*dt),sp=Math.min(230,Math.hypot(b.vx,b.vy)+60*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    if(b.life<=0||b.x<-30||b.x>W+30||b.y<-30||b.y>H+30){b.dead=true;continue;}
    if(b.hp){for(const q of G.pb)if(!q.dead&&Math.hypot(q.x-b.x,q.y-b.y)<b.r+q.r){b.dead=true;q.dead=true;boom(b.x,b.y,20);break;}if(b.dead)continue;}
    if(G.mode==='play'&&Math.hypot(b.x-P.x,b.y-P.y)<b.r+P.r){b.dead=true;hurtP(b.dmg);}
  }
}
function updItems(dt){
  for(const it of G.items){it.t+=dt;it.y+=(55+scrollSpd()*.4)*dt;it.x+=Math.sin(it.t*2.4)*18*dt;
    const d=Math.hypot(P.x-it.x,P.y-it.y);if(d<130){const k=(1-d/130)*260*dt;it.x+=(P.x-it.x)/d*k*2;it.y+=(P.y-it.y)/d*k*2;}
    if(d<34&&G.mode==='play'){it.dead=true;pickup(it);}
    if(it.y>H+40)it.dead=true;}
}
function updParts(dt){
  for(const p of G.parts){p.t+=dt;if(p.t>=p.max){p.dead=true;continue;}
    if(p.vx!=null){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='sp'){p.vx*=.96;p.vy=p.vy*.96+120*dt;}}
    if(p.k==='sm'&&!p.fire)p.y+=scrollSpd()*.3*dt;}
  if(G.parts.length>420)G.parts.splice(0,G.parts.length-420);
}
function update(dt){
  G.time+=dt;
  if(G.shake>0)G.shake=Math.max(0,G.shake-dt*30);
  if(G.flash>0)G.flash-=dt;
  const sp=scrollSpd();
  if(G.mode==='play'||G.mode==='bossdie'||G.mode==='dying'){G.scroll+=sp*dt;
    for(const c of G.cloud){c.y+=sp*c.v*dt;if(c.y>H+120){c.y=-120;c.x=rr(0,W);c.s=rr(.9,1.8);}}}
  if(G.mode==='play'){
    G.t+=dt;G.noTok+=dt;
    updPlayer(dt);
    // reżyser fal
    if(!G.boss&&G.bossWarn<=0){
      if(G.t>=G.levelTime){G.bossWarn=3.2;$('#warn').classList.add('on');msg('UWAGA','nadlatuje boss');SND.p('warn');}
      else{G.spawnT-=dt;if(G.spawnT<=0){G.spawnT=rr(.9,1.6)/(1+.45*diff())/DIF.rate;spawnWave();}}
    }else if(G.bossWarn>0){G.bossWarn-=dt;if(G.bossWarn<=0){$('#warn').classList.remove('on');spawnBoss();}}
  }
  if(G.mode==='dying'){G.dyT-=dt;if(G.dyT<=0)gameOver();}
  if(G.mode==='bossdie'){G.bdT-=dt;if(RND()<dt*14)boom(G.bx+rr(-110,110),G.by+rr(-70,70),rr(40,80));
    if(G.bdT<=0){G.mode='clear';boom(G.bx,G.by,160);stageClear();}}
  if(G.mode==='play'||G.mode==='bossdie'){
    for(const e of G.enemies){if(e.dead)continue;if(e.t==='boss')updBoss(e,dt);else updEnemy(e,dt);
      // zderzenie z helikopterem
      if(G.mode==='play'&&!e.dead&&e.air&&e.y>-10&&enemyHit(e,P.x,P.y,P.r*.7)){hurtP(e.t==='boss'?30:18);if(e.t!=='boss'&&e.t!=='bomber')hurtE(e,60);}}
    updBullets(dt);updItems(dt);
  }
  updParts(dt);
  G.enemies=G.enemies.filter(e=>!e.dead);G.eb=G.eb.filter(b=>!b.dead);G.pb=G.pb.filter(b=>!b.dead);G.mis=G.mis.filter(b=>!b.dead);G.items=G.items.filter(i=>!i.dead);G.parts=G.parts.filter(p=>!p.dead);
}
