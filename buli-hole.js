(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BuliHole=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const SAVE_KEY='little-house:buli-hole:v1',BOUND=26;
 const TYPES={
  cone:{asset:'construction-cone',radius:.25,mass:4,label:'路锥'},box:{asset:'box',radius:.32,mass:6,label:'箱子'},planter:{asset:'planter',radius:.46,mass:10,label:'花盆'},
  tree:{asset:'tree-small',radius:.64,mass:16,label:'小树'},lamp:{asset:'light-square',radius:.48,mass:12,label:'路灯'},dumpster:{asset:'dumpster',radius:.78,mass:24,label:'垃圾箱'},
  sedan:{asset:'sedan',radius:1.05,mass:38,label:'汽车'},taxi:{asset:'taxi',radius:1.05,mass:38,label:'出租车'},truck:{asset:'truck',radius:1.35,mass:56,label:'货车'},
  'tree-large':{asset:'tree-large',radius:1.22,mass:48,label:'大树'},
  'building-a':{asset:'building-type-a',radius:1.6,mass:80,label:'小房子'},'building-b':{asset:'building-type-b',radius:2,mass:110,label:'住宅'},
  'building-d':{asset:'building-type-d',radius:2.25,mass:135,label:'大房子'},'building-g':{asset:'building-type-g',radius:2.65,mass:170,label:'大楼'}
 };
 function random(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
 function generate(seed){
  const rng=random(seed),items=[];
  function add(kind,x,z,angle=0){const t=TYPES[kind];items.push({id:items.length,kind,x,z,angle,...t});}
  for(let ring=0;ring<3;ring++)for(let i=0;i<8;i++){const a=i*Math.PI/4,r=1.7+ring*1.55;add(['cone','box','planter'][ring],Math.cos(a)*r,Math.sin(a)*r,a);}
  for(const x of [-18,-8,8,18])for(const z of [-18,-8,8,18]){
   add(['building-a','building-b','building-d','building-g'][Math.floor(rng()*4)],x+(rng()-.5)*.5,z+(rng()-.5)*.5,Math.floor(rng()*4)*Math.PI/2);
   add(rng()<.7?'tree':'tree-large',x+2.8,z+2.8,rng()*Math.PI*2);
   add(rng()<.5?'cone':'box',x-2.7,z-2.7,rng()*Math.PI*2);
   add(rng()<.6?'planter':'dumpster',x-2.9,z+2.5,Math.PI/2);
   add('lamp',x+3.1,z-2.6);
   add(['sedan','taxi','truck'][Math.floor(rng()*3)],x,z-3.6,Math.PI/2);
  }
  return items;
 }
 function create(level=1,seed=1){const items=generate(seed);return{version:1,level,seed:seed>>>0,x:0,z:0,items,eaten:[],mass:0,target:Math.ceil(items.reduce((sum,i)=>sum+i.mass,0)*Math.min(.85,.65+(level-1)*.015)),remainingMs:150000+Math.min(60000,(level-1)*6000),elapsedMs:0,revives:0,status:'playing',paused:false};}
 const radius=g=>.62+Math.sqrt(g.mass)*.115;
 function distanceToSegment(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/l)):0;return Math.hypot(px-ax-t*dx,pz-az-t*dz);}
 function step(g,input,ms){
  if(g.paused||g.status!=='playing'||!Number.isFinite(ms)||ms<=0)return[];
  const time=Math.min(ms,g.remainingMs);g.remainingMs-=time;g.elapsedMs+=time;
  let x=Number.isFinite(input?.x)?input.x:0,z=Number.isFinite(input?.z)?input.z:0;const magnitude=Math.max(1,Math.hypot(x,z));x/=magnitude;z/=magnitude;
  const dt=Math.min(time,250)/1000,speed=Math.min(8,6+radius(g)*.22),oldX=g.x,oldZ=g.z;
  g.x=Math.max(-BOUND,Math.min(BOUND,g.x+x*speed*dt));g.z=Math.max(-BOUND,Math.min(BOUND,g.z+z*speed*dt));
  const consumed=[],eaten=new Set(g.eaten);
  for(const item of g.items){if(eaten.has(item.id)||radius(g)<item.radius*1.06)continue;
   if(distanceToSegment(item.x,item.z,oldX,oldZ,g.x,g.z)>Math.max(.15,radius(g)-item.radius*.85))continue;
   g.eaten.push(item.id);eaten.add(item.id);g.mass+=item.mass;consumed.push(item);
   if(g.mass>=g.target){g.status='won';break;}
  }
  if(g.status==='playing'&&g.remainingMs<=0)g.status='lost';return consumed;
 }
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.remainingMs=45000;g.status='playing';g.paused=true;return true;}
 function save(g){const {version,level,seed,x,z,eaten,remainingMs,elapsedMs,revives,status}=g;return JSON.stringify({version,level,seed,x,z,eaten,remainingMs,elapsedMs,revives,status});}
 function restore(text){
  if(typeof text!=='string'||text.length>50000)return null;
  try{const s=JSON.parse(text);
   if(!s||s.version!==1||!Number.isInteger(s.level)||s.level<1||s.level>1000000000||!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||![s.x,s.z].every(v=>Number.isFinite(v)&&Math.abs(v)<=BOUND)||!Number.isInteger(s.revives)||s.revives<0||s.revives>2||!['playing','won','lost'].includes(s.status)||![s.remainingMs,s.elapsedMs].every(v=>Number.isFinite(v)&&v>=0&&v<=1000000000)||!Array.isArray(s.eaten)||s.eaten.length>160||new Set(s.eaten).size!==s.eaten.length)return null;
   const g=create(s.level,s.seed);if(s.eaten.some(id=>!Number.isInteger(id)||!g.items[id]))return null;
   for(const key of ['x','z','eaten','remainingMs','elapsedMs','revives','status'])g[key]=s[key];g.mass=g.eaten.reduce((sum,id)=>sum+g.items[id].mass,0);
   if((g.status==='won')!==(g.mass>=g.target)||g.status==='lost'&&g.remainingMs!==0||g.status==='playing'&&g.remainingMs===0)return null;
   g.paused=true;return g;
  }catch(_){return null;}
 }
 return{SAVE_KEY,BOUND,TYPES,create,radius,step,revive,save,restore};
});
