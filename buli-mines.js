(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliMines=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const levels=Object.freeze({easy:Object.freeze({name:'入门',cols:9,rows:9,mines:10}),medium:Object.freeze({name:'进阶',cols:12,rows:12,mines:25}),hard:Object.freeze({name:'高手',cols:16,rows:16,mines:50})});
 function create(difficulty='easy',rng=Math.random){
  const level=levels[difficulty]?difficulty:'easy',cfg=levels[level];
  return {level,...cfg,phase:'ready',beforePause:null,generated:false,flags:0,opened:0,elapsed:0,exploded:-1,last:null,rng,
   cells:Array.from({length:cfg.cols*cfg.rows},()=>({mine:false,number:0,open:false,flag:false}))};
 }
 function valid(s,i){return Number.isInteger(i)&&i>=0&&i<s.cells.length;}
 function active(s){return s.phase==='ready'||s.phase==='playing';}
 function neighbors(s,i){
  if(!valid(s,i))return [];
  const x=i%s.cols,y=Math.floor(i/s.cols),out=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<s.cols&&ny>=0&&ny<s.rows)out.push(ny*s.cols+nx);}
  return out;
 }
 function generate(s,first){
  const safe=new Set([first,...neighbors(s,first)]),pool=[];
  s.cells.forEach((_,i)=>{if(!safe.has(i))pool.push(i);});
  // Partial Fisher-Yates: choose exactly the mine count without retry bias.
  for(let n=0;n<s.mines;n++){const r=s.rng(),sample=Number.isFinite(r)?Math.max(0,Math.min(.999999999,r)):0,j=n+Math.floor(sample*(pool.length-n));[pool[n],pool[j]]=[pool[j],pool[n]];s.cells[pool[n]].mine=true;}
  s.cells.forEach((c,i)=>c.number=neighbors(s,i).filter(n=>s.cells[n].mine).length);
  s.generated=true;s.phase='playing';
 }
 function lose(s,i){s.phase='lost';s.exploded=i;s.cells[i].open=true;s.last={type:'lost',indices:[i]};}
 function openRegion(s,seeds){
  const queue=[...seeds],seen=new Set(),opened=[];
  for(let p=0;p<queue.length;p++){
   const i=queue[p];if(seen.has(i))continue;seen.add(i);const c=s.cells[i];
   if(c.open||c.flag||c.mine)continue;
   c.open=true;s.opened++;opened.push(i);if(c.number===0)queue.push(...neighbors(s,i));
  }
  if(!opened.length)return false;
  s.last={type:'open',indices:opened};
  if(s.opened===s.cells.length-s.mines){s.phase='won';s.last.type='won';}
  return true;
 }
 function reveal(s,i){
  if(!active(s)||!valid(s,i)||s.cells[i].flag)return false;
  if(s.cells[i].open)return chord(s,i);
  if(!s.generated)generate(s,i);
  if(s.cells[i].mine){lose(s,i);return true;}
  return openRegion(s,[i]);
 }
 function flag(s,i){
  if(!active(s)||!valid(s,i)||s.cells[i].open)return false;
  const c=s.cells[i];if(!c.flag&&s.flags>=s.mines)return false;
  c.flag=!c.flag;s.flags+=c.flag?1:-1;s.last={type:'flag',indices:[i]};return true;
 }
 function chord(s,i){
  if(s.phase!=='playing'||!valid(s,i))return false;
  const c=s.cells[i],near=neighbors(s,i);if(!c.open||!c.number||near.filter(n=>s.cells[n].flag).length!==c.number)return false;
  const targets=near.filter(n=>!s.cells[n].open&&!s.cells[n].flag),mine=targets.find(n=>s.cells[n].mine);
  // Resolve all possible explosions before revealing safe regions or declaring a win.
  if(mine!==undefined){lose(s,mine);return true;}
  return openRegion(s,targets);
 }
 function revive(s){
  if(s.phase!=='lost'||!valid(s,s.exploded)||!s.cells[s.exploded].mine)return false;
  const c=s.cells[s.exploded];c.open=false;
  // Identify the detonated mine without moving it; make room by correcting a wrong flag.
  if(!c.flag){if(s.flags>=s.mines){const wrong=s.cells.find(x=>x.flag&&!x.mine);if(wrong){wrong.flag=false;s.flags--;}}
   c.flag=true;s.flags++;}
  s.phase='playing';s.exploded=-1;s.last=null;s.beforePause=null;return true;
 }
 function tick(s,dt){if(s.phase==='playing'&&Number.isFinite(dt)&&dt>0)s.elapsed+=dt;}
 function pause(s){if(!active(s))return false;s.beforePause=s.phase;s.phase='paused';return true;}
 function resume(s){if(s.phase!=='paused')return false;s.phase=s.beforePause;s.beforePause=null;return true;}
 return {revive,levels,create,neighbors,reveal,flag,chord,tick,pause,resume};
});
