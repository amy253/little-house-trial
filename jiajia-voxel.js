(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VoxelPop=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const COLORS={lime:'#e8f117',gold:'#f4c72b',brown:'#94703e',red:'#e83737',green:'#38c748',mint:'#45df9e',teal:'#42d3ca',gray:'#a8b2bc',ivory:'#fff4ca',blue:'#4e9bf1',pink:'#f591bb',purple:'#9558c4'};
 const DIRS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 const key=(x,y,z)=>`${x},${y},${z}`;
 const sq=x=>x*x;
 const stages=[
  {name:'香蕉',icon:'🍌',shape:'banana',lanes:[
   [['lime',105],['brown',28],['red',106]],
   [['lime',106],['lime',106],['gold',85]],
   [['gold',86],['lime',105],['gold',85]]
  ]},
  {name:'西瓜',icon:'🍉',shape:'melon',lanes:[
   [['green',70],['red',70],['teal',50],['green',70]],
   [['red',70],['green',70],['red',70],['red',70]],
   [['green',70],['mint',90],['gray',51],['red',77]],
   [['green',80],['red',70],['gold',50],['ivory',50]]
  ]},
  {name:'蓝莓冰晶',icon:'💎',shape:'gem',palette:['blue','teal','purple','ivory','pink']},
  {name:'卟哩积木',icon:'🐱',shape:'cat',palette:['gold','brown','ivory','pink','gray','red']},
  {name:'草莓糖',icon:'🍓',shape:'berry',palette:['red','pink','green','lime','ivory','gold']},
  {name:'家家的花',icon:'🌸',shape:'flower',palette:['pink','purple','gold','green','teal','ivory','red']}
 ];
 function shapeScore(shape,x,y,z){
  if(shape==='banana'){
   const center=y>=10?2.5+(y-10)*.92:.055*sq(y+1)-4.1;
   const size=y>=10?1.65:4.6*(1-.38*Math.pow(Math.abs((y+1)/13),1.8));
   return Math.max(Math.abs(y-.2)/16,Math.hypot(x-center,z*1.12)/size);
  }
  if(shape==='melon'){
   const yy=5.7-y;
   const rind=Math.hypot(x,yy*1.38)/14.5;
   return yy<0?2+Math.abs(yy):Math.max(rind,Math.abs(z)/(2.5+yy*.42));
  }
  if(shape==='gem')return Math.max((Math.abs(x)+Math.abs(y)*.68+Math.abs(z)*.88)/14.8,Math.abs(y)/13);
  if(shape==='cat'){
   const face=Math.hypot(x/11,(y+1)/8.7,z/5);
   const ear=Math.max(Math.abs(y-7)/5,(Math.abs(Math.abs(x)-7.2)+Math.abs(y-4)*.43)/4,Math.abs(z)/3.8);
   return Math.min(face,ear);
  }
  if(shape==='berry'){
   const body=Math.hypot(x/(8.8+y*.24),(y+1)/12,z/(7+y*.20));
   return Math.min(body,Math.max(Math.abs(y-9)/3,Math.hypot(x,z)/6));
  }
  const angle=Math.atan2(y,x);
  return Math.max(Math.hypot(x,y)/(9.5+2.6*Math.cos(angle*6)),Math.abs(z)/(3.2+.1*Math.hypot(x,y)));
 }
 function makeShape(shape,count){
  const points=[];
  for(let y=-15;y<=16;y++)for(let x=-17;x<=17;x++)for(let z=-12;z<=12;z++){
   const score=shapeScore(shape,x,y,z);
   if(score<1.35)points.push({x,y,z,score,key:key(x,y,z)});
  }
  points.sort((a,b)=>a.score-b.score||a.y-b.y||a.z-b.z||a.x-b.x);
  return points.slice(0,count);
 }
 function surfaceDepth(points){
  const cells=new Map(points.map(p=>[p.key,p]));
  const depth=new Map(),front=[];
  for(const p of points){
   if(!DIRS.some(([x,y,z])=>!cells.has(key(p.x+x,p.y+y,p.z+z))))continue;
   depth.set(p.key,0);front.push(p);
  }
  for(const p of front)for(const [x,y,z] of DIRS){
   const next=key(p.x+x,p.y+y,p.z+z);
   if(!cells.has(next)||depth.has(next))continue;
   depth.set(next,depth.get(p.key)+1);front.push(cells.get(next));
  }
  return depth;
 }
 function paint(points,shape,amounts){
  let remaining=points.slice();
  const paintColor=(color,score)=>{
   remaining.sort((a,b)=>score(a)-score(b));
   for(const point of remaining.splice(0,amounts[color]||0))point.color=color;
  };
  if(shape==='banana'){
   paintColor('brown',p=>-p.y+Math.abs(p.z)*.12);
   paintColor('red',p=>p.score+Math.abs(p.y)*.011);
   paintColor('gold',p=>p.z+.16*p.x+.09*p.y);
   paintColor('lime',p=>p.score);
  }else if(shape==='melon'){
   const rind=p=>Math.hypot(p.x,(5.7-p.y)*1.38);
   const depth=surfaceDepth(points);
   paintColor('ivory',p=>-depth.get(p.key)+Math.abs(p.x+2)*.02);
   paintColor('gold',p=>-depth.get(p.key)+Math.abs(p.x-3)*.02);
   paintColor('green',p=>-rind(p));
   paintColor('mint',p=>-rind(p));
   paintColor('teal',p=>-rind(p));
   paintColor('gray',p=>Math.abs(p.x%4)+Math.abs(p.y%3)+Math.abs(Math.abs(p.z)-(2+(5.7-p.y)*.42))*.2);
   paintColor('red',p=>p.score);
  }else{
   const palette=Object.keys(amounts);
   palette.forEach((color,i)=>paintColor(color,p=>{
    if(shape==='cat'&&color==='pink')return -p.y+Math.abs(p.z-1);
    if(shape==='berry'&&color==='green')return -p.y;
    if(shape==='flower'&&color==='gold')return Math.hypot(p.x,p.y);
    return Math.sin((p.x+i*2.1)*.24)+Math.cos((p.y-i)*.21)+Math.sin((p.z+i)*.24);
   }));
  }
 }
 function laterStage(stage,level){
  const columns=level>=5?5:4,rounds=4;
  return Array.from({length:columns},(_,col)=>Array.from({length:rounds},(_,row)=>[
   stage.palette[(col+row*2+Math.floor((level-3)/stages.length))%stage.palette.length],
   43+((col*13+row*7+level*3)%19)
  ]));
 }
 function create(level=1){
  level=Number.isInteger(level)&&level>0?level:1;
  const stage=stages[level<=stages.length?level-1:2+(level-3)%(stages.length-2)];
  const lanes=stage.lanes||laterStage(stage,level);
  let nextId=0;
  const queue=lanes.map(lane=>lane.map(([color,ammo])=>({id:++nextId,color,ammo,tier:1})));
  const amounts={};
  for(const cannon of queue.flat())amounts[cannon.color]=(amounts[cannon.color]||0)+cannon.ammo;
  const total=Object.values(amounts).reduce((sum,n)=>sum+n,0);
  const points=makeShape(stage.shape,total);
  paint(points,stage.shape,amounts);
  return {level,stage,total,queue,board:new Map(points.map(p=>[p.key,p])),slots:Array(6).fill(null),
   status:'playing',revives:0,boosts:{choose:1,shuffle:1,vacuum:1}};
 }
 function merge(game,color){
  const ids=game.slots.map((c,i)=>c?.color===color?i:-1).filter(i=>i>=0);
  if(ids.length<3)return null;
  const first=game.slots[ids[0]],parts=ids.slice(0,3).map(i=>game.slots[i]);
  for(const i of ids.slice(1,3))game.slots[i]=null;
  first.ammo=parts.reduce((sum,c)=>sum+c.ammo,0);
  first.tier=Math.min(3,Math.max(...parts.map(c=>c.tier))+1);
  return first;
 }
 function launch(game,col,row=0,any=false){
  const cannon=game.queue[col]?.[row],slot=game.slots.indexOf(null);
  if(game.status!=='playing'||!cannon||slot<0||(!any&&row!==0))return null;
  game.queue[col].splice(row,1);
  game.slots[slot]=cannon;
  return {cannon,slot,merged:merge(game,cannon.color)};
 }
 function shell(game,point,view){
  return DIRS.some(([x,y,z],i)=>(!view||view[i>>1]*(i%2?-1:1)>.12)&&!game.board.has(key(point.x+x,point.y+y,point.z+z)));
 }
 function hit(game,cannon,point){
  const slot=game.slots.indexOf(cannon);
  if(game.status!=='playing'||slot<0||!cannon||cannon.ammo<=0||!point||point.color!==cannon.color||!game.board.delete(point.key))return false;
  cannon.ammo--;
  if(cannon.ammo===0)game.slots[slot]=null;
  if(!game.board.size)game.status='won';
  return true;
 }
 function blocked(game){
  if(game.status!=='playing'||game.slots.includes(null))return false;
  const colors=new Set(game.slots.map(c=>c.color));
  if([...game.board.values()].some(p=>colors.has(p.color)&&shell(game,p)))return false;
  game.status='lost';return true;
 }
 function addSlot(game){
  if(game.status!=='playing'||game.slots.length>=8)return false;
  game.slots.push(null);return true;
 }
 function revive(game){
  if(game.status!=='lost'||game.revives>=2)return false;
  game.status='playing';game.revives++;
  if(!addSlot(game)){const cannon=game.slots.find(Boolean);game.slots[game.slots.indexOf(cannon)]=null;game.queue[0].unshift(cannon);}
  return true;
 }
 function shuffle(game,random=Math.random){
  const pool=game.queue.flat();
  if(game.status!=='playing'||!game.boosts.shuffle||pool.length<2)return false;
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  for(const lane of game.queue)lane.splice(0,lane.length,...pool.splice(0,lane.length));
  game.boosts.shuffle--;return true;
 }
 return {COLORS,stages,create,launch,shell,hit,blocked,addSlot,revive,shuffle};
});
