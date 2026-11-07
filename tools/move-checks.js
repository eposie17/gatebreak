// node tools/move-checks.js $PWD/www/index.html : checks free movement with real touch drags (needs Playwright)
// A drag moves the army sideways and up together, from anywhere on the screen (also the strips by the notch and home bar),
// can turn back mid-drag, and the menus still take their own taps and scrolling.
const {chromium}=require(process.env.PW||'playwright');
const [,,html]=process.argv;const R=[];const ok=(n,c,x)=>R.push((c?'PASS ':'FAIL ')+n+(x?' '+x:''));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function touch(cdp,type,pts){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((p,i)=>({x:p[0],y:p[1],id:p[2]??i,radiusX:4,radiusY:4,force:1}))});}
async function drag(cdp,path,id=1){await touch(cdp,'touchStart',[[...path[0],id]]);for(const q of path.slice(1)){await touch(cdp,'touchMove',[[...q,id]]);await sleep(8);}}
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [name,w,h,ins] of [['iphone17',402,874,[62,0,34,0]],['ipad',820,1180,[24,0,20,0]],['safari',393,659,[0,0,0,0]]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(name+': '+e.message));
  await p.addInitScript(i=>{document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent=`#safe{padding:${i[0]}px ${i[1]}px ${i[2]}px ${i[3]}px!important}#wrap{top:${i[0]}px!important;right:${i[1]}px!important;bottom:${i[2]}px!important;left:${i[3]}px!important}`;document.head.appendChild(st);});},ins);
  await p.goto('file://'+html);await sleep(150);await p.evaluate(()=>resize());
  const cdp=await ctx.newCDPSession(p);
  // the title screen still scrolls and its button still works
  const sc=await p.evaluate(()=>{window.__dp=[];window.addEventListener('touchmove',e=>__dp.push(e.defaultPrevented));const r=document.getElementById('start').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height*0.7};});
  await drag(cdp,[[sc.x,sc.y],[sc.x,sc.y-40],[sc.x,sc.y-80]]);await touch(cdp,'touchEnd',[]);
  const dp=await p.evaluate(()=>__dp);ok(name+' title screen can still scroll',dp.length>0&&dp.every(v=>!v),JSON.stringify(dp));
  const bt=await p.evaluate(()=>{const e=[...document.querySelectorAll('#start button,#start .btn,#start [id]')].find(x=>/TAP TO START/i.test(x.textContent||''));if(!e)return null;e.scrollIntoView();const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
  if(bt){await touch(cdp,'touchStart',[[bt.x,bt.y,9]]);await touch(cdp,'touchEnd',[]);await sleep(150);}
  ok(name+' TAP TO START works by touch',(await p.evaluate(()=>window.__mu.mode))==='play',String(!!bt));
  await p.evaluate(()=>{const M=window.__mu;M.startRun(4242);S.autoRally=false;const g=M.g;g.cx=g.tx=195;g.cy=g.ty=PITY1;});
  const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++)window.__mu.step(1/60);},n);
  const st=()=>p.evaluate(()=>{const g=window.__mu.g;return {tx:+g.tx.toFixed(1),ty:+g.ty.toFixed(1),cy:+g.cy.toFixed(1),ret:g.retT,mode:window.__mu.mode};});
  const c=await p.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {l:r.left,t:r.top,w:r.width,h:r.height};});
  // 1. one diagonal drag moves both ways at once
  const x0=c.l+c.w*0.5,y0=c.t+c.h*0.85;
  await drag(cdp,[[x0,y0],[x0+10,y0-10],[x0+25,y0-25],[x0+40,y0-40]]);let s1=await st();
  ok(name+' diagonal drag moves sideways and up together',s1.tx>220&&s1.ty<PITY1(),JSON.stringify(s1));
  // 2. turn back mid-drag without lifting
  await drag(cdp,[[x0+40,y0-40],[x0+10,y0-30],[x0-30,y0-20]],1);let s2=await st();
  ok(name+' turning back mid-drag follows the finger',s2.tx<s1.tx-40,JSON.stringify([s1.tx,s2.tx]));
  // 3. lifting the finger: it slides back down, as before
  await touch(cdp,'touchEnd',[]);await sleep(20);await step(90);let s3=await st();
  ok(name+' let go and it slides back down',s3.cy>PITY1()-1,JSON.stringify(s3));
  // 4. a drag that starts in the strip below the game (home bar) or beside it still steers
  if(ins[2]>0){const before=(await st()).tx;await drag(cdp,[[c.l+c.w*0.5,h-8],[c.l+c.w*0.5-20,h-12],[c.l+c.w*0.5-60,h-14]],2);await touch(cdp,'touchEnd',[]);
    const after=(await st()).tx;ok(name+' drag from the home-bar strip steers',after<before-40,JSON.stringify([before,after]));}
  if(ins[0]>0){const before=(await st()).tx;await drag(cdp,[[c.l+c.w*0.3,20],[c.l+c.w*0.3+20,22],[c.l+c.w*0.3+60,24]],3);await touch(cdp,'touchEnd',[]);
    const after=(await st()).tx;ok(name+' drag from the notch strip steers',after>before+40,JSON.stringify([before,after]));}
  // 5. Rally button, second finger Rally, pause button
  const rb=await p.evaluate(()=>{const c=document.getElementById('c').getBoundingClientRect();window.__mu.g.rallyCD=0;return {x:c.left+(RALLYB.x+GX)*scale,y:c.top+(RALLYB.y-CT)*scale};});
  await touch(cdp,'touchStart',[[rb.x,rb.y,4]]);await touch(cdp,'touchEnd',[]);ok(name+' Rally button',(await p.evaluate(()=>window.__mu.g.rallyCD))>15);
  await p.evaluate(()=>{window.__mu.g.rallyCD=0;});
  await touch(cdp,'touchStart',[[x0,y0,5]]);await touch(cdp,'touchMove',[[x0+20,y0,5]]);await touch(cdp,'touchStart',[[x0+20,y0,5],[x0-80,y0-200,6]]);
  ok(name+' second finger is a Rally',(await p.evaluate(()=>window.__mu.g.rallyCD))>15);await touch(cdp,'touchEnd',[]);
  const pb=await p.evaluate(()=>{const c=document.getElementById('c').getBoundingClientRect();return {x:c.left+(W-34+GX)*scale,y:c.top+30*scale};});
  await touch(cdp,'touchStart',[[pb.x,pb.y,7]]);await touch(cdp,'touchEnd',[]);await sleep(30);ok(name+' pause button',(await p.evaluate(()=>window.__mu.mode))==='pause');
  // 6. the pause menu's buttons still work (Resume)
  const rs=await p.evaluate(()=>{const r=document.getElementById('resume').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
  await touch(cdp,'touchStart',[[rs.x,rs.y,8]]);await touch(cdp,'touchEnd',[]);await sleep(80);ok(name+' Resume works by touch',(await p.evaluate(()=>window.__mu.mode))==='play');
  await ctx.close();}
 R.forEach(x=>console.log(x));console.log('page errors',JSON.stringify(errs));await b.close();})();
function PITY1(){return 618;}
