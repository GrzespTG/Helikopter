const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
 await p.screenshot({path:'shots/menu.png'});
 await p.click('#bPlay');await p.waitForTimeout(2500);
 await p.screenshot({path:'shots/play1.png'});
 for(const wl of [4,6,8]){await p.evaluate(w=>{DBG.G.wl=w},wl);await p.waitForTimeout(1500);await p.screenshot({path:'shots/wl'+wl+'.png'});}
 // bot: fast-forward
 const r=await p.evaluate(()=>{
  const G=DBG.G,P=DBG.P;const log=[];let guard=0;
  DBG.state='sim';
  function bot(dt){
    let tgt=null,best=1e9;
    for(const it of G.items){const d=Math.hypot(it.x-P.x,it.y-P.y);if(d<best){best=d;tgt=it;}}
    let tx=P.x;
    if(tgt&&best<260){tx=tgt.x;P.ty=Math.min(870,Math.max(500,tgt.y));}
    else{ let e2=null,bd=1e9;for(const e of G.enemies){if(e.y<0)continue;const d=Math.abs(e.x-P.x)+(P.y-e.y)*.2;if(e.y<P.y&&d<bd){bd=d;e2=e;}}
      if(e2)tx=e2.x; P.ty=860;
      // dodge
      for(const q of G.eb){if(q.y<P.y&&q.y>P.y-160&&Math.abs(q.x-P.x)<40){tx=P.x+(q.x<P.x?60:-60);}}}
    P.tx=Math.max(30,Math.min(510,tx));
  }
  const res={};
  for(let st=1;st<=3;st++){
    if(st>1)DBG.nextStage();
    DBG.state='sim';
    let t0=G.time,bossT=null;
    while(guard++<200000){
      bot(1/60);DBG.update(1/60);
      if(G.boss&&bossT==null)bossT=G.time;
      if(G.mode==='clear'||G.mode==='over'||DBG.state==='over'||DBG.state==='clear')break;
    }
    res['s'+st]={mode:G.mode,state:DBG.state,time:+(G.time-t0).toFixed(0),boss:bossT&&+(G.time-bossT).toFixed(0),hp:Math.round(P.hp),wl:G.wl,plvl:G.plvl,score:G.score};
    if(DBG.state==='over')break;
  }
  return res;});
 console.log(JSON.stringify(r,null,1));
 await p.evaluate(()=>{DBG.state='run'});
 await p.waitForTimeout(500);await p.screenshot({path:'shots/after.png'});
 console.log('errors',errs);await b.close();})();
