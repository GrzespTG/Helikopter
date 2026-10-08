const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(400);
 for(const skill of [1,.5,0]){
 const r=await p.evaluate((skill)=>{
  DBG.play();DBG.state='sim';const G=DBG.G,P=DBG.P;
  const out=[];let g=0;
  function bot(){
    let tgt=null,best=1e9;for(const it of G.items){const d=Math.hypot(it.x-P.x,it.y-P.y);if(d<best){best=d;tgt=it;}}
    let tx=P.x;
    if(tgt&&best<260*(skill||.3)){tx=tgt.x;P.ty=Math.min(870,Math.max(500,tgt.y));}
    else{let e2=null,bd=1e9;for(const e of G.enemies){if(e.y<0)continue;const d=Math.abs(e.x-P.x)+(P.y-e.y)*.2;if(e.y<P.y&&d<bd){bd=d;e2=e;}}
      if(e2)tx=e2.x;P.ty=860;
      if(skill>0)for(const q of G.eb){if(q.y<P.y&&q.y>P.y-160*skill&&Math.abs(q.x-P.x)<40){tx=P.x+(q.x<P.x?60:-60);}}}
    P.tx=Math.max(30,Math.min(510,tx));}
  for(let st=1;st<=7;st++){
    if(st>1)DBG.nextStage();DBG.state='sim';
    const t0=G.time;let bT=null,minhp=999;
    while(g++<400000){bot();DBG.update(1/60);minhp=Math.min(minhp,P.hp/P.maxhp);if(G.boss&&bT==null)bT=G.time;
      if(DBG.state==='over'||DBG.state==='clear')break;}
    out.push({st,res:DBG.state,t:Math.round(G.time-t0),boss:bT&&Math.round(G.time-bT),minhp:+minhp.toFixed(2),wl:G.wl,pl:G.plvl});
    if(DBG.state==='over')break;}
  return out;},skill);
 console.log('skill',skill);for(const x of r)console.log(JSON.stringify(x));}
 console.log(errs);await b.close();})();
