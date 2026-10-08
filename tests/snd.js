const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:390,height:844}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(600);await p.click('#bPlay');await p.waitForTimeout(2500);
 console.log(await p.evaluate(()=>({st:SND.ac&&SND.ac.state,loop:!!SND.lp,mus:!!SND.mid,t:SND.ac&&SND.ac.currentTime.toFixed(1),notes:SND.mi})));
 await p.click('#pause');await p.waitForTimeout(300);console.log(await p.evaluate(()=>({loop:!!SND.lp,mus:!!SND.mid})));
 await p.click('#bResume');await p.waitForTimeout(500);console.log(await p.evaluate(()=>({loop:!!SND.lp,mus:!!SND.mid})));
 console.log(errs);await b.close();})();
