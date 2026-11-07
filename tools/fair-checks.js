// node tools/fair-checks.js $PWD/www/index.html [shotDir] : checks the fairness pass (needs Playwright)
// Supply drop before the Tank, gate numbers, Quartermaster, Threat 7 to 10, the message under the boss, and the loss screen.
const {chromium}=require(process.env.PW||'playwright');
const [,,html,shots]=process.argv;const R=[];const ok=(n,c,x)=>R.push((c?'PASS ':'FAIL ')+n+(x!==undefined?' '+x:''));
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:402,height:874},deviceScaleFactor:1,hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+html);await p.waitForTimeout(150);
 const E=f=>p.evaluate(f);
 // 1. no truck destroyed: a supply drop (pick 1 of 2) comes before the Tank
 let r=await E(()=>{const M=window.__mu;M.startRun(77);const g=M.g;g.phase='clear';g.phaseT=2;g.enemies=[];g.trucksKilled=0;M.step(1/60);
   return {mode:M.mode,why:g.draft&&g.draft.why,n:g.draft&&g.draft.cards.length,boss:!!g.boss};});
 ok('supply drop opens when no truck was destroyed',r.mode==='draft'&&r.why==='SUPPLY DROP'&&r.n===2&&!r.boss,JSON.stringify(r));
 r=await E(()=>{const M=window.__mu;M.pickCard(0);const g=M.g;return {mode:M.mode,phase:g.phase,boss:g.boss&&g.boss.kind,cards:g.cards.length};});
 ok('after the supply drop the Tank arrives',r.mode==='play'&&r.phase==='bossIn'&&r.boss===1&&r.cards===1,JSON.stringify(r));
 r=await E(()=>{const M=window.__mu;M.startRun(78);const g=M.g;g.phase='clear';g.phaseT=2;g.enemies=[];g.trucksKilled=1;M.step(1/60);return {mode:M.mode,phase:g.phase};});
 ok('no supply drop when a truck was destroyed',r.mode==='play'&&r.phase==='bossIn',JSON.stringify(r));
 // 2. gate numbers still round up (a fair-rounding try shrank crowds too much in the bot check), and Swamp gates print +35%
 r=await E(()=>{const M=window.__mu;M.startRun(79);const g=M.g;g.gateBonus=1;const a=kindPrinted('shield',3);g.gateBonus=1.35;const b=kindPrinted('rifle',10);g.gateBonus=1;return {a,b};});
 ok('gates round up; Swamp +35%',r.a===2&&r.b===14,JSON.stringify(r));
 r=await E(()=>{const g=window.__mu.g;g.cards=['quarter'];const a=kindPrinted('rifle',10),b=kindPrinted('rifle',2);g.cards=[];return {a,b};});
 ok('Quartermaster adds 20%, at least 1',r.a===12&&r.b===3,JSON.stringify(r));
 // 3. Threat 7 to 10
 r=await E(()=>{const M=window.__mu;const out={};for(const th of [6,7,8,9,10]){M.startRun(80);const g=M.g;g.threat=th;
   startBoss(1);out[th]={bite:+(biteOf('a Tank shell')*100).toFixed(2),bmax:bMax(),boss:Math.round(g.boss.maxhp),enr:enrT(),cards:maxCards(),rifle:g.K.rifle};}
   return {out,text:THREATS.slice(7)};});
 const o=r.out;
 ok('Threat 7: enemies hit 15% harder',Math.abs(o[7].bite/o[6].bite-1.15)<0.01,o[6].bite+' -> '+o[7].bite);
 ok('Threat 8: BREACH holds 3 less',o[8].bmax===o[7].bmax-3,o[7].bmax+' -> '+o[8].bmax);
 ok('Threat 9: bosses get another 25% health',Math.abs(o[9].boss/o[8].boss-1.25)<0.01,o[8].boss+' -> '+o[9].boss);
 ok('Threat 10: 3 cards and enrage 7 s sooner',o[10].cards===3&&o[9].cards===4&&o[10].enr===o[9].enr-7,JSON.stringify([o[9].enr,o[10].enr,o[10].cards]));
 ok('Threat 8 keeps 5 Riflemen and 4 card slots below 10',o[8].rifle===o[6].rifle&&o[9].cards===4,JSON.stringify(o[8]));
 ok('Threat texts match',/15% harder/.test(r.text[0])&&/3 less/.test(r.text[1])&&/25%/.test(r.text[2])&&/3 cards/.test(r.text[3]),JSON.stringify(r.text));
 // 4. promotions and paths
 r=await E(()=>{const P=window.__mu.PROMOS;return {bat:P.battery.need,inf:P.inferno.need,fire:/fourteen/.test(P.firing.desc)};});
 ok('Battery needs 14, Inferno 10',r.bat===14&&r.inf===10,JSON.stringify(r));
 // 5. the message sits under the boss while one is on screen
 r=await E(()=>{const M=window.__mu;M.startRun(81);const g=M.g;g.threat=0;startBoss(1);for(let i=0;i<150;i++)M.step(1/60);setMsg('HATCH OPEN: x2 damage',3);
   const B=g.boss;return {phase:g.phase,bottom:Math.round(B.y+B.h/2)};});
 ok('Tank is in the fight for the message check',r.phase==='boss',JSON.stringify(r));
 // record where the message text is drawn on screen and compare it with the bottom of the boss
 const box=await E(()=>{const o=CanvasRenderingContext2D.prototype.fillText;let y=null;CanvasRenderingContext2D.prototype.fillText=function(s,x,yy,...a){if(/HATCH OPEN/.test(s)){const m=this.getTransform();y=Math.round(m.d*yy+m.f);}return o.call(this,s,x,yy,...a);};
   render();CanvasRenderingContext2D.prototype.fillText=o;const b=window.__mu.g.boss;return {topPx:y,bossBottomPx:Math.round((b.y+b.h/2-CT)*dpr*scale)};});
 ok('message text is below the boss',box.topPx>box.bossBottomPx,JSON.stringify(box));
 if(shots)await p.screenshot({path:shots+'/boss-message.png'});
 // 6. the loss screen says how close the boss was
 r=await E(()=>{const M=window.__mu;const g=M.g;g.boss.hp=g.boss.maxhp*0.18;finishRun(false);g.resT=5;render();return {mode:M.mode};});
 if(shots)await p.screenshot({path:shots+'/loss-boss.png'});
 const said=await E(()=>{const t=[];const o=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(s,...a){t.push(String(s));return o.call(this,s,...a);};render();CanvasRenderingContext2D.prototype.fillText=o;return t.filter(s=>/health left/.test(s));});
 ok('loss screen shows the boss health left',r.mode==='results'&&said.length===1&&/18% health left/.test(said[0]),JSON.stringify(said));
 ok('no page errors',errs.length===0,JSON.stringify(errs.slice(0,3)));
 console.log(R.join('\n'));console.log(R.filter(s=>s.startsWith('PASS')).length+'/'+R.length+' passed');await b.close();
})();
