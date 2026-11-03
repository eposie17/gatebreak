// node tools/app-checks.js $PWD/www/index.html /tmp/shots : checks the game with a pretend notch and home bar, fake app buzzes and saves (needs Playwright)
const {chromium}=require('playwright');
const [,,html,out]=process.argv;const R=[];const ok=(n,c,x)=>R.push((c?'PASS ':'FAIL ')+n+(x?' '+x:''));
async function tap(cdp,x,y){const tp=[{x,y,id:1,radiusX:4,radiusY:4,force:1}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
const FAKE=`window.__hap=[];window.__pref={};window.Capacitor={isNativePlatform:()=>true,Plugins:{Haptics:{impact:o=>{window.__hap.push(o.style);return Promise.resolve();}},
 Preferences:{set:o=>{window.__pref[o.key]=o.value;return Promise.resolve();},get:o=>Promise.resolve({value:window.__pref[o.key]??null})}}};`;
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [name,w,h,ins] of [['iphone17',402,874,[62,0,34,0]],['iphoneSE',375,667,[20,0,0,0]],['ipad',820,1180,[24,0,20,0]],['ipadland',1180,820,[24,0,20,0]]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(name+': '+e.message));
  await p.addInitScript(FAKE);
  await p.addInitScript(i=>{document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent=`#safe{padding:${i[0]}px ${i[1]}px ${i[2]}px ${i[3]}px!important}#wrap{top:${i[0]}px!important;right:${i[1]}px!important;bottom:${i[2]}px!important;left:${i[3]}px!important}`;document.head.appendChild(st);});},ins);
  await p.goto('file://'+html);await p.waitForTimeout(150);await p.evaluate(()=>resize());await p.waitForTimeout(50);
  const L=await p.evaluate(()=>{const r=cv.getBoundingClientRect();return{CT,CB,scale:+scale.toFixed(3),top:r.top,bottom:Math.round(r.bottom),left:r.left,right:Math.round(r.right),offY,offX};});
  ok(name+' game sits inside the safe area',L.top>=ins[0]-0.5&&L.bottom<=h-ins[2]+0.5&&Math.abs(L.top-L.offY)<1&&Math.abs(L.left-L.offX)<1,JSON.stringify(L));
  const cdp=await ctx.newCDPSession(p);
  const d=await p.evaluate(()=>{const M=window.__mu;M.startRun(777);let t=0;while(t<120&&M.mode!=='draft'){const g=M.g;if(M.mode==='fork')M.pickRoute(0);g.tx=195+80*Math.sin(t/3);if(g.K.rifle<40)g.K.rifle=40;g.breach=0;M.step(1/60);t+=1/60;}
    const g=M.g;g.draft.t=1;const r=cardRect(0),c=document.getElementById('c').getBoundingClientRect();return {mode:M.mode,cx:c.left+oX+(r.x+r.w/2)*so,cy:c.top+oY+(r.y+r.h/2)*so};});
  await tap(cdp,d.cx,d.cy);await p.waitForTimeout(80);
  const d2=await p.evaluate(()=>window.__mu.mode);ok(name+' tap a card',d.mode==='draft'&&d2!=='draft',d.mode+' -> '+d2);
  await p.evaluate(()=>{const M=window.__mu;let t=0;while(t<40){const g=M.g;if(M.mode==='draft')M.pickCard(0);else if(M.mode==='fork')M.pickRoute(0);if(M.mode==='results')break;g.tx=195+80*Math.sin(t/3);if(g.K.rifle<40)g.K.rifle=40;g.breach=0;M.step(1/60);t+=1/60;}});
  await p.waitForTimeout(60);await p.screenshot({path:`${out}/${name}-play.png`});
  const pb=await p.evaluate(()=>{const c=document.getElementById('c').getBoundingClientRect();return {x:c.left+(W-34+GX)*scale,y:c.top+30*scale};});
  await tap(cdp,pb.x,pb.y);await p.waitForTimeout(60);ok(name+' tap pause',(await p.evaluate(()=>window.__mu.mode))==='pause');
  await p.screenshot({path:`${out}/${name}-pause.png`});
  await p.evaluate(()=>document.getElementById('resume').click());await p.waitForTimeout(60);
  const rb=await p.evaluate(()=>{const c=document.getElementById('c').getBoundingClientRect();window.__mu.g.rallyCD=0;S.autoRally=false;return {x:c.left+(RALLYB.x+GX)*scale,y:c.top+(RALLYB.y-CT)*scale};});
  await tap(cdp,rb.x,rb.y);await p.waitForTimeout(40);ok(name+' tap Rally',(await p.evaluate(()=>window.__mu.g.rallyCD))>15);
  // app 'pause' event (sent when the app goes to the background) pauses the game
  await p.evaluate(()=>{document.dispatchEvent(new Event('pause'));});
  ok(name+' app background pauses',(await p.evaluate(()=>mode))==='pause');
  // haptics: a gate buzz and a Rally triple buzz reach the app plugin
  const hp=await p.evaluate(async()=>{S.haptics=true;vib(10);vib([20,20,20]);await new Promise(r=>setTimeout(r,200));return __hap;});
  ok(name+' buzzes go to the phone',hp.length>=4&&hp[0]==='LIGHT'&&hp.includes('MEDIUM'),JSON.stringify(hp));
  // saves: copy kept in app storage
  const pr=await p.evaluate(()=>{saveP();saveS();return Object.keys(__pref);});ok(name+' saves copied to app storage',pr.includes('mu_prog')&&pr.includes('mu_set'),JSON.stringify(pr));
  await ctx.close();
 }
 // restore: web storage wiped, app storage still has the save -> comes back after one reload
 {const ctx=await b.newContext({viewport:{width:402,height:874},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('restore: '+e.message));
  await p.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');window.__seed=1;}});
  await p.addInitScript(`window.__hap=[];window.Capacitor={isNativePlatform:()=>true,Plugins:{Haptics:{impact:()=>Promise.resolve()},Preferences:{set:()=>Promise.resolve(),get:o=>Promise.resolve({value:o.key==='mu_prog'?JSON.stringify({threat:2,max:3,kills:999,unl:{tesla:1},tips:{},testAll:false}):null})}}};`);
  await p.goto('file://'+html);await p.waitForTimeout(600);
  const st=await p.evaluate(()=>({kills:PROG.kills,max:PROG.max,ver:PROG.ver,testAll:PROG.testAll}));
  ok('save comes back from app storage',st.kills===999&&st.max===3&&st.ver===1,JSON.stringify(st));await ctx.close();}
 // release switch
 {const s=require('fs').readFileSync(html,'utf8').replace('const RELEASE=false;','const RELEASE=true;');require('fs').writeFileSync(out+'/rel.html',s);
  const ctx=await b.newContext({viewport:{width:402,height:874}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('release: '+e.message));
  await p.addInitScript(()=>localStorage.setItem('mu_prog',JSON.stringify({testAll:true,max:0})));await p.goto('file://'+out+'/rel.html');await p.waitForTimeout(200);
  const r=await p.evaluate(()=>({testAll:PROG.testAll,hidden:getComputedStyle(document.getElementById('tall')).display==='none',tesla:baseUnlocked('tesla')}));
  ok('release build: testing switch gone, kinds locked',!r.testAll&&r.hidden&&!r.tesla,JSON.stringify(r));await ctx.close();}
 R.forEach(x=>console.log(x));console.log('page errors',JSON.stringify(errs));await b.close();})();
