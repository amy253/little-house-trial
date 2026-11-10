(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BuliHop=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const MIN_DISTANCE=12,MAX_DISTANCE=440,CHARGE_SPEED=240,FLIGHT_TIME=.56,HEIGHT=40;
 const BONUSES=Object.freeze({drain:5,cube:10,shop:15,music:30});
 function jumpDistance(seconds){return Math.round(Math.min(MAX_DISTANCE,MIN_DISTANCE+Math.max(0,seconds)*CHARGE_SPEED)*1e8)/1e8;}
 function nextPlatform(g){
  const size=Math.max(58,86-g.jumps*.35)*( .9+g.random()*.1),axis=g.random()<.5?'x':'z';
  const distance=g.current.size/2+size/2+38+g.random()*128;
  const id=g.current.id+1,kinds=['plain','round','parcel','plain','drain','plain','cube','round','shop','plain','music'];
  return {id,x:g.current.x+(axis==='x'?distance:0),z:g.current.z-(axis==='z'?distance:0),size,height:HEIGHT,kind:kinds[id%kinds.length],bonusClaimed:false};
 }
 function create(random=Math.random){
  const current={id:0,x:0,z:0,size:92,height:HEIGHT,kind:'plain',bonusClaimed:true};
  const g={random,current,next:null,platforms:[current],cat:{x:0,y:HEIGHT,z:0},phase:'ready',paused:false,charge:0,score:0,streak:0,jumps:0,idle:0,bonusEligible:false,flight:null,fall:0,event:0,lastEvent:null};
  g.next={id:1,x:180,z:0,size:84,height:HEIGHT,kind:'round',bonusClaimed:false};g.platforms.push(g.next);return g;
 }
 function event(g,kind,points=0){g.event++;g.lastEvent={id:g.event,kind,points};}
 function beginCharge(g){if(g.paused||g.phase!=='ready')return false;g.phase='charging';g.charge=0;g.idle=0;g.bonusEligible=false;return true;}
 function cancelCharge(g){if(g.phase!=='charging')return false;g.phase='ready';g.charge=0;return true;}
 function release(g){
  if(g.paused||g.phase!=='charging')return false;
  const from={...g.cat},dx=g.next.x-from.x,dz=g.next.z-from.z,length=Math.hypot(dx,dz),distance=jumpDistance(g.charge);
  g.flight={from,to:{x:from.x+dx/length*distance,y:HEIGHT,z:from.z+dz/length*distance},t:0,height:65+Math.min(30,g.charge*20)};
  g.phase='jumping';event(g,'jump');return true;
 }
 function contains(p,cat){const dx=cat.x-p.x,dz=cat.z-p.z;return p.kind==='round'||p.kind==='drain'?Math.hypot(dx,dz)<=p.size/2:Math.abs(dx)<=p.size/2&&Math.abs(dz)<=p.size/2;}
 function settle(g){
  g.cat={...g.flight.to};
  if(contains(g.next,g.cat)){
   const center=Math.hypot(g.cat.x-g.next.x,g.cat.z-g.next.z)<=9;
   g.streak=center?g.streak+1:0;const points=center?Math.min(32,g.streak*2):1;g.score+=points;g.jumps++;
   g.current=g.next;g.next=nextPlatform(g);g.platforms.push(g.next);if(g.platforms.length>7)g.platforms.shift();
   g.phase='ready';g.charge=0;g.idle=0;g.bonusEligible=true;event(g,center?'center':'land',points);
  }else if(contains(g.current,g.cat)){g.phase='ready';g.charge=0;g.idle=0;event(g,'stay');}
  else{g.phase='falling';g.fall=0;event(g,'miss');}
 }
 function update(g,dt){
  if(g.paused||!Number.isFinite(dt)||dt<=0||g.phase==='lost')return;
  dt=Math.min(dt,5);
  if(g.phase==='charging')g.charge=Math.min((MAX_DISTANCE-MIN_DISTANCE)/CHARGE_SPEED,g.charge+dt);
  else if(g.phase==='jumping'){
   const f=g.flight;f.t=Math.min(FLIGHT_TIME,f.t+dt);const p=f.t/FLIGHT_TIME;
   g.cat={x:f.from.x+(f.to.x-f.from.x)*p,z:f.from.z+(f.to.z-f.from.z)*p,y:HEIGHT+4*f.height*p*(1-p)};
   if(f.t>=FLIGHT_TIME)settle(g);
  }else if(g.phase==='falling'){
   g.fall+=dt;g.cat.y=HEIGHT-300*g.fall*g.fall;
   if(g.fall>=.65){g.phase='lost';event(g,'lost');}
  }else if(g.phase==='ready'&&g.bonusEligible&&!g.current.bonusClaimed){
   g.idle+=dt;
   if(g.idle>=2&&BONUSES[g.current.kind]){const points=BONUSES[g.current.kind];g.current.bonusClaimed=true;g.score+=points;event(g,'bonus',points);}
  }
 }
 function setPaused(g,value){if(value)cancelCharge(g);g.paused=!!value;}
 function revive(g){if(g.phase!=='lost')return false;g.cat={x:g.current.x,y:HEIGHT,z:g.current.z};g.phase='ready';g.paused=false;g.charge=0;g.flight=null;g.fall=0;g.idle=0;return true;}
 return {revive,create,beginCharge,cancelCharge,release,update,setPaused,jumpDistance,contains,MIN_DISTANCE,MAX_DISTANCE,CHARGE_SPEED,FLIGHT_TIME,BONUSES};
});
