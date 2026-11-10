(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BuliBomber=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const SIZE=11,dirs=[[1,0],[0,1],[-1,0],[0,-1]];
 const levels=[
  {name:'小院初试',enemies:1,speed:.9,crates:.22},
  {name:'箱子小巷',enemies:2,speed:.82,crates:.34},
  {name:'花园转角',enemies:2,speed:.7,crates:.4},
  {name:'追逐仓库',enemies:3,speed:.66,crates:.35},
  {name:'猫粮迷宫',enemies:3,speed:.56,crates:.44},
  {name:'小屋大作战',enemies:4,speed:.48,crates:.4}
 ];
 const key=p=>p.x+','+p.y,same=(a,b)=>a.x===b.x&&a.y===b.y;
 function random(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
 function create(index=0,options={}){
  index=Math.max(0,Math.min(levels.length-1,Number.isFinite(index)?Math.floor(index):0));
  const level=levels[index],g={index,phase:'ready',reason:'',seed:(options.seed??(Date.now()+index))>>>0,player:{x:1,y:1},exit:{x:9,y:9},map:[],enemies:[],bombs:[],fires:[],items:[],loot:{},range:1,capacity:1,score:0,time:0,shield:0,revived:false};
  const spawns=[{x:9,y:1},{x:1,y:9},{x:9,y:7},{x:5,y:5}];
  for(let y=0;y<SIZE;y++){const row=[];for(let x=0;x<SIZE;x++)row.push(x===0||y===0||x===SIZE-1||y===SIZE-1||x%2===0&&y%2===0?1:random(g)<level.crates?2:0);g.map.push(row);}
  for(const p of [{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:1,y:2},{x:1,y:3},...spawns])g.map[p.y][p.x]=0;
  g.map[1][4]=2;g.map[4][1]=2;g.map[9][9]=2;
  g.loot['4,1']='range';g.loot['1,4']='bomb';
  for(let y=1;y<10;y++)for(let x=1;x<10;x++)if(g.map[y][x]===2&&!g.loot[x+','+y]&&random(g)<.18)g.loot[x+','+y]=random(g)<.5?'bomb':'range';
  g.enemies=spawns.slice(0,level.enemies).map((p,id)=>({id,...p,spawn:{...p},wait:level.speed+id*.13,dir:id%4}));
  return g;
 }
 function start(g){if(g.phase!=='ready'&&g.phase!=='paused')return false;g.phase='playing';return true;}
 function pause(g){if(g.phase!=='playing')return false;g.phase='paused';return true;}
 function passable(g,x,y){return g.map[y]?.[x]===0&&!g.bombs.some(b=>b.x===x&&b.y===y);}
 function burning(g,p){return g.fires.some(f=>f.cells.some(c=>same(c,p)));}
 function check(g){
  if(g.phase!=='playing')return;
  if(g.shield<=0&&(burning(g,g.player)||g.enemies.some(e=>same(e,g.player)))){g.phase='lost';g.reason=burning(g,g.player)?'fire':'enemy';return;}
  g.items=g.items.filter(p=>{if(!same(p,g.player))return true;if(p.kind==='bomb')g.capacity=Math.min(3,g.capacity+1);else g.range=Math.min(4,g.range+1);return false;});
  if(g.map[g.exit.y][g.exit.x]===0&&g.enemies.length===0&&same(g.player,g.exit)){g.phase='won';g.score+=200;}
 }
 function move(g,dx,dy){
  if(g.phase!=='playing'||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)return false;
  const x=g.player.x+dx,y=g.player.y+dy;if(!passable(g,x,y))return false;
  g.player={x,y};check(g);return true;
 }
 function place(g){
  if(g.phase!=='playing'||g.bombs.length>=g.capacity||g.bombs.some(b=>same(b,g.player)))return false;
  g.bombs.push({...g.player,left:2,range:g.range});return true;
 }
 function explode(g){
  // Keep crates solid through a chain so simultaneous blasts cannot tunnel through them.
  const solid=g.map.map(r=>r.slice()),queue=g.bombs.filter(b=>b.left<=1e-8||burning(g,b)),done=new Set(),broken=new Set();
  for(const bomb of queue){
   if(done.has(bomb))continue;done.add(bomb);const cells=[{x:bomb.x,y:bomb.y}];
   for(const [dx,dy] of dirs)for(let n=1;n<=bomb.range;n++){
    const x=bomb.x+dx*n,y=bomb.y+dy*n,tile=solid[y]?.[x];if(tile===undefined||tile===1)break;
    cells.push({x,y});if(tile===2){broken.add(x+','+y);break;}
   }
   for(const other of g.bombs)if(!done.has(other)&&cells.some(p=>same(p,other)))queue.push(other);
   g.fires.push({left:.55,cells});
  }
  g.bombs=g.bombs.filter(b=>!done.has(b));
  for(const k of broken){const [x,y]=k.split(',').map(Number);g.map[y][x]=0;g.score+=10;if(g.loot[k]){g.items.push({x,y,kind:g.loot[k]});delete g.loot[k];}}
  const count=g.enemies.length;g.enemies=g.enemies.filter(e=>!burning(g,e));g.score+=(count-g.enemies.length)*100;
 }
 function step(g,dt){
  g.time+=dt;g.shield=Math.max(0,g.shield-dt);
  g.fires=g.fires.filter(f=>(f.left-=dt)>0);
  for(const b of g.bombs)b.left-=dt;
  if(g.bombs.some(b=>b.left<=1e-8||burning(g,b)))explode(g);
  check(g);if(g.phase!=='playing')return;
  const speed=levels[g.index].speed;
  for(const e of g.enemies){
   e.wait-=dt;if(e.wait>0)continue;e.wait+=speed;
   let candidates=dirs.map(([dx,dy],dir)=>({x:e.x+dx,y:e.y+dy,dir})).filter(p=>passable(g,p.x,p.y)&&!g.enemies.some(other=>other!==e&&same(other,p)));
   if(!candidates.length)continue;
   const chase=g.index>=3&&Math.abs(e.x-g.player.x)+Math.abs(e.y-g.player.y)<=5;
   if(chase)candidates.sort((a,b)=>(Math.abs(a.x-g.player.x)+Math.abs(a.y-g.player.y))-(Math.abs(b.x-g.player.x)+Math.abs(b.y-g.player.y)));
   const straight=candidates.find(p=>p.dir===e.dir),next=chase?candidates[0]:straight&&random(g)<.65?straight:candidates[Math.floor(random(g)*candidates.length)];
   e.x=next.x;e.y=next.y;e.dir=next.dir;
  }
  const count=g.enemies.length;g.enemies=g.enemies.filter(e=>!burning(g,e));g.score+=(count-g.enemies.length)*100;check(g);
 }
 function tick(g,dt){
  if(g.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  let left=Math.min(dt,10);while(left>1e-8&&g.phase==='playing'){const part=Math.min(left,.025);step(g,part);left-=part;}
 }
 function revive(g){
  if(g.phase!=='lost')return false;
  g.phase='paused';g.reason='';g.player={x:1,y:1};g.bombs=[];g.fires=[];g.shield=2;g.revived=true;return true;
 }
 function normalizeSave(value){return {unlocked:Math.max(1,Math.min(6,Number.isFinite(value?.unlocked)?Math.floor(value.unlocked):1)),best:Math.max(0,Number.isFinite(value?.best)?Math.floor(value.best):0)};}
 return {SIZE,levels,create,start,pause,move,place,tick,revive,normalizeSave};
});
