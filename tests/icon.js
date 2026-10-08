const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(400);
 const d=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d');
  g.fillStyle=lg(g,0,0,192,192,['#1b3a66','#0b1424']);g.fillRect(0,0,192,192);
  g.fillStyle=rg(g,96,96,10,110,['rgba(255,176,46,.35)','rgba(255,176,46,0)']);g.fillRect(0,0,192,192);
  g.save();g.translate(96,100);g.scale(.82,.82);drawHeli(g,0,0,.3,8,false);g.restore();return c.toDataURL('image/png');});
 fs.writeFileSync('android/icon.png',Buffer.from(d.split(',')[1],'base64'));await b.close();})();
