(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliFly=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const W=432,H=640,GROUND=584,STEP=1/120;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function difficulty(index){
  const n=clamp(index,0,60);
  if(n<=5){const t=n/30;return {gap:184-42*t,speed:132+64*t,spacing:252-26*t};}
  const stages=[
   {at:5,gap:177,speed:132+64*5/30,spacing:252-26*5/30},
   {at:15,gap:158,speed:178,spacing:232},
   {at:30,gap:140,speed:208,spacing:224},
   {at:60,gap:134,speed:220,spacing:222}
  ];
  const end=stages.findIndex(stage=>stage.at>=n),a=stages[end-1],b=stages[end],t=(n-a.at)/(b.at-a.at);
  return {gap:a.gap+(b.gap-a.gap)*t,speed:a.speed+(b.speed-a.speed)*t,spacing:a.spacing+(b.spacing-a.spacing)*t};
 }
 function addGate(s){const index=s.generated++,d=difficulty(index),prev=s.gates.at(-1),r=clamp(Number(s.random())||0,0,1);const center=index===0?300:clamp((prev?.center??300)+(r-.5)*120,80+d.gap/2,526-d.gap/2);s.gates.push({index,x:prev?prev.x+d.spacing:480,center,gap:d.gap,width:68,passed:false});}
 function create(options={}){const s={phase:'ready',paused:false,score:0,best:Number.isSafeInteger(options.best)&&options.best>=0?options.best:0,cat:{x:110,y:300,vy:0,rx:18,ry:26},gates:[],generated:0,elapsed:0,lostTime:0,accumulator:0,flapTime:0,reason:null,random:typeof options.random==='function'?options.random:Math.random};addGate(s);addGate(s);return s;}
 function tap(s){if(s.paused)return false;if(s.phase==='lost'){if(s.lostTime<.65)return false;const fresh=create({random:s.random,best:s.best});Object.assign(s,fresh);}if(s.phase==='ready')s.phase='playing';if(s.phase!=='playing')return false;s.cat.vy=-285;s.flapTime=.18;return true;}
 function lose(s,reason){s.phase='lost';s.reason=reason;s.lostTime=0;s.best=Math.max(s.best,s.score);}
 function step(s){if(s.phase==='lost'){s.lostTime+=STEP;return;}if(s.phase!=='playing')return;s.elapsed+=STEP;s.flapTime=Math.max(0,s.flapTime-STEP);const c=s.cat;c.vy=Math.min(420,c.vy+860*STEP);c.y+=c.vy*STEP;const speed=difficulty(s.score).speed;for(const g of s.gates)g.x-=speed*STEP;
  if(c.y-c.ry<=0){lose(s,'ceiling');return;}if(c.y+c.ry>=GROUND){lose(s,'ground');return;}
  for(const g of s.gates){if(c.x+c.rx>g.x&&c.x-c.rx<g.x+g.width&&(c.y-c.ry<g.center-g.gap/2||c.y+c.ry>g.center+g.gap/2)){lose(s,'gate');return;}}
  for(const g of s.gates){if(!g.passed&&g.x+g.width<c.x-c.rx){g.passed=true;s.score++;}}
  s.gates=s.gates.filter(g=>g.x+g.width>-20);if(s.gates.at(-1).x< W+80)addGate(s);
 }
 function tick(s,dt){if(s.paused||!Number.isFinite(dt)||dt<=0)return;s.accumulator+=Math.min(dt,.1);while(s.accumulator+1e-9>=STEP){s.accumulator-=STEP;if(s.accumulator<1e-9)s.accumulator=0;step(s);}}
 function revive(s){
  if(s.phase!=='lost')return false;
  const upcoming=s.gates.filter(g=>!g.passed),first=upcoming[0]||s.gates.at(-1);
  s.cat.y=clamp(first?.center??300,s.cat.ry+40,GROUND-s.cat.ry-40);s.cat.vy=0;
  // Shift upcoming gates together: no skipped gates, points or RNG draws.
  const shift=Math.max(0,s.cat.x+300-(first?.x??0));for(const g of upcoming)g.x+=shift;
  s.phase='playing';s.paused=false;s.reason=null;s.lostTime=0;s.accumulator=0;s.flapTime=0;return true;
 }
 function setPaused(s,value){s.paused=Boolean(value);s.accumulator=0;}
 function readSave(raw){let v={};try{v=JSON.parse(raw)||{};}catch(_){}return {best:Number.isSafeInteger(v.best)&&v.best>=0&&v.best<=999999?v.best:0,sound:v.sound===true};}
 return {revive,W,H,GROUND,create,tap,tick,setPaused,readSave,difficulty};
});
