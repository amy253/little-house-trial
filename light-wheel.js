(function(root){
 const TAU=Math.PI*2;
 function distance(a,b){return Math.abs(((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI);}
 function setup(g){g.speed=Math.min(3.6,.65+(g.round-1)*.4);g.direction=g.round<3?1:g.round%2?-1:1;g.target=Math.min(16,7+g.round);g.hits=0;const count=g.round===1?0:Math.min(6,g.round);g.pins=Array.from({length:count},(_,i)=>i*TAU/count);g.shots=[];}
 function create(){const g={round:1,score:0,angle:0,status:'playing'};setup(g);return g;}
 function fire(g){if(g.status!=='playing')return false;g.shots.push({remaining:.18});return true;}
 function step(g,dt){
  if(g.status!=='playing')return;
  while(dt>1e-8){
   const slice=g.shots.length?Math.min(dt,Math.max(0,g.shots[0].remaining)):dt;
   g.angle=(g.angle+g.speed*g.direction*slice)%TAU;g.shots.forEach(s=>s.remaining-=slice);dt-=slice;
   if(!g.shots.length||g.shots[0].remaining>1e-8)return;
   g.shots.shift();const a=Math.PI/2-g.angle;
   if(g.pins.some(p=>distance(p,a)<.2)){g.status='lost';g.shots=[];return;}
   g.pins.push(a);g.hits++;g.score++;
   if(g.hits===g.target){g.round++;setup(g);return;}
  }
 }
 function revive(g){
  if(g.status!=='lost')return false;
  const pins=g.pins.map(a=>(a%TAU+TAU)%TAU).sort((a,b)=>a-b);
  let gap=0,mid=0,obstruction=0;
  for(let i=0;i<pins.length;i++){const end=i+1<pins.length?pins[i+1]:pins[0]+TAU;if(end-pins[i]>gap){gap=end-pins[i];mid=(pins[i]+end)/2;obstruction=pins[i];}}
  // A shot needs .2 radians of clearance on both sides. Open a gap only
  // when rotation cannot help; earned hits and score remain unchanged.
  if(pins.length&&gap<=.4){g.pins.splice(g.pins.findIndex(a=>distance(a,obstruction)<1e-8),1);return revive(g);}
  g.angle=Math.PI/2-mid-g.speed*g.direction*.18;g.shots=[];g.status='playing';return true;
 }
const api={revive,create,setup,fire,step,distance};if(typeof module!=='undefined')module.exports=api;else root.LightWheel=api;
})(typeof window!=='undefined'?window:globalThis);
