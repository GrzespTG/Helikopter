const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(700);await p.click('#bPlay');
 for(const wl of [2,4,5,6,8]){
  await p.evaluate(w=>{const G=DBG.G;G.wl=w;G.mode='play';DBG.state='sim';G.enemies.length=0;G.eb.length=0;G.t=1;DBG.P.hp=100;G.invul=99;DBG.P.tx=270;DBG.P.ty=700;for(let i=0;i<60;i++)DBG.update(1/60);DBG.state='run';G.enemies.length=0;G.eb.length=0;},wl);
  await p.waitForTimeout(150);
  const bb=await p.locator('#stage').boundingBox();
  await p.screenshot({path:'shots/heli'+wl+'.png',clip:{x:bb.x+bb.width*.2,y:bb.y+bb.height*.62,width:bb.width*.6,height:bb.height*.26}});}
 console.log(errs);await b.close();})();
