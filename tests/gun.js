const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);await p.screenshot({path:'shots/menu2.png'});await p.click('#bDiff');await p.click('#bPlay');
 await p.evaluate(()=>{const G=DBG.G;G.enemies.length=0;spawnE('gun',200,250,{x0:200,ty:250});spawnE('gun',380,330,{x0:380,ty:330});G.invul=99;});
 await p.waitForTimeout(700);const bb=await p.locator('#stage').boundingBox();
 await p.screenshot({path:'shots/gun.png',clip:{x:bb.x,y:bb.y+bb.height*.1,width:bb.width,height:bb.height*.45}});console.log(errs,await p.textContent('#bDiff').catch(()=>''));await b.close();})();
