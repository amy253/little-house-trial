(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.SandGame);if(typeof module==='object'&&module.exports)module.exports=api;else root.SandSlide=api;})(typeof globalThis==='object'?globalThis:this,function(Sand){
 'use strict';
 const COLS=7,ROWS=6,SAVE_KEY='little-house-sand-slide-v1',DIRS=[[0,-1],[-1,0],[1,0],[0,1]];
 const COLORS=['#000000','#ffe29a','#ba7832','#9c45e7','#ef3340','#00bfd4','#325cf4','#322c3f','#34c759'];
 const SHAPES={s:[[0,0]],h:[[0,0],[1,0]],v:[[0,0],[0,1]],t:[[0,0],[0,1],[0,2],[0,3]],l:[[0,0],[1,0],[2,0],[0,1]],r:[[0,0],[1,0],[1,1]]};
 const SIMPLE=[['v',0,3],['h',2,3],['s',5,4]];
 const EARLY=[['h',0,1],['s',2,3],['h',4,3],['v',0,4],['s',5,5]];
 const INTERLOCK=[['s',0,2],['s',1,2],['l',0,3],['s',1,4],['s',2,4],['t',3,1],['s',4,3],['s',4,4],['h',5,4],['h',0,5],['s',5,3],['s',6,3],['s',4,2],['h',5,1],['h',0,1],['s',2,2],['s',5,2],['s',6,2],['s',3,5],['s',5,5]];
 const levelOf=n=>Number.isInteger(n)?Math.max(1,Math.min(10000,n)):1;
 function settings(level){
  level=levelOf(level);const stage=Math.min(3,level-1),boxCount=level<5?[3,5,13,13][stage]:Math.min(20,18+level-5),colors=level<5?[3,4,5,5][stage]:8;
  return {boxCount,palette:[1,6,7,4,2,8,5,3].slice(0,colors),time:level<5?300:Math.max(180,240-(level-5)*10)};
 }
 function create(level,pixels){
  level=levelOf(level);
  if(!Array.isArray(pixels)||!pixels.length||pixels.length>128||!Array.isArray(pixels[0])||!pixels[0].length||pixels[0].length>128||pixels.some(r=>r.length!==pixels[0].length||r.some(v=>!Number.isInteger(v)||v<0||v>8)))throw Error('Invalid sand picture');
  const grid=pixels.map(r=>r.slice()),counts=new Map();for(const c of grid.flat())if(c)counts.set(c,(counts.get(c)||0)+1);if(!counts.size)throw Error('Empty sand picture');
  const colors=[...counts.keys()].sort((a,b)=>a-b),difficulty=settings(level),layout=(level===1?SIMPLE:level===2?EARLY:INTERLOCK.slice(0,difficulty.boxCount)).map(b=>b.slice());
  if(level>=4)layout[4][0]='v';if(level>=5){layout[8][0]='r';layout[7][0]='v';}
  const boxes=layout.map(([shape,x,y],id)=>({id,color:colors[id%colors.length],x,y,cells:SHAPES[shape].map(c=>c.slice()),fill:0,capacity:0}));
  if(level>=3){const gate=boxes.find(b=>b.id!==5&&b.color===colors[colors.length-1]);if(gate)[gate.color,boxes[5].color]=[boxes[5].color,gate.color];}
  // Guarantee a receiver for every color even when the tutorial picture uses more colors.
  for(let i=boxes.length;i<colors.length;i++){
   const extra={id:i,color:colors[i],x:0,y:0,cells:[[0,0]],fill:0,capacity:0};
   find:for(let y=ROWS-1;y>=0;y--)for(let x=0;x<COLS;x++)if(canPlace({boxes},extra,x,y)){extra.x=x;extra.y=y;break find;}
   boxes.push(extra);
  }
  for(const color of colors){const group=boxes.filter(b=>b.color===color);let left=counts.get(color);for(let i=0;i<group.length;i++){group[i].capacity=Math.ceil(left/(group.length-i));left-=group[i].capacity;}}
  const total=[...counts.values()].reduce((a,b)=>a+b,0);
  return {level,grid,boxes:boxes.filter(b=>b.capacity>0),total,collected:0,status:'ready',paused:false,remaining:difficulty.time,moves:0,revives:0,tick:0,accumulator:0,effects:[],departed:[]};
 }
 function start(g){if(g.status!=='ready')return false;g.status='playing';return true;}
 function canPlace(g,box,x,y){
  return box.cells.every(([cx,cy])=>x+cx>=0&&x+cx<COLS&&y+cy>=0&&y+cy<ROWS&&!g.boxes.some(other=>other.id!==box.id&&other.cells.some(([ox,oy])=>other.x+ox===x+cx&&other.y+oy===y+cy)));
 }
 function move(g,id,dx,dy){
  if(g.status!=='playing'||g.paused||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)return false;
  const box=g.boxes.find(b=>b.id===id);if(!box||!canPlace(g,box,box.x+dx,box.y+dy))return false;
  box.x+=dx;box.y+=dy;g.moves++;return true;
 }
 function hit(g,x,y){const box=g.boxes.find(b=>b.cells.some(([cx,cy])=>Math.floor(x)===b.x+cx&&Math.floor(y)===b.y+cy));return box?.id??null;}
 function exposed(g){const found=new Set();for(let x=0;x<g.grid[0].length;x++)for(let y=g.grid.length-1;y>=0;y--)if(g.grid[y][x]){found.add(g.grid[y][x]);break;}return found;}
 function step(g){
  if(g.status!=='playing'||g.paused)return;g.tick++;g.effects=[];g.departed=[];
  for(let pass=0;pass<3;pass++)Sand.gravity(g.grid,g.tick+pass);
  const w=g.grid[0].length,y=g.grid.length-1,quota=Math.max(1,Math.ceil(w/18));
  for(const box of g.boxes){
   if(box.y!==0)continue;let taken=0;
   for(let i=0;i<w&&taken<quota&&box.fill<box.capacity;i++){
    const x=(i+g.tick*7)%w;
    if(g.grid[y][x]===box.color){g.grid[y][x]=0;box.fill++;g.collected++;taken++;g.effects.push({x,y,color:box.color,to:box.id});}
   }
  }
  g.boxes=g.boxes.filter(b=>{if(b.fill<b.capacity)return true;g.departed.push(b.id);return false;});
  if(g.collected===g.total)g.status='won';
 }
 function tick(g,dt){
  if(g.status!=='playing'||g.paused||!Number.isFinite(dt)||dt<=0)return;
  g.remaining=Math.max(0,g.remaining-dt);if(g.remaining<=1e-8){g.remaining=0;g.status='lost';return;}
  g.accumulator+=dt;let steps=0;while(g.accumulator>=1/60-1e-9&&g.status==='playing'&&steps++<120){g.accumulator=Math.max(0,g.accumulator-1/60);step(g);}
 }
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.status='playing';g.paused=false;g.remaining=120;g.accumulator=0;return true;}
 function hint(g){
  const colors=exposed(g);for(const box of g.boxes.filter(b=>colors.has(b.color)).sort((a,b)=>a.y-b.y)){
   const queue=[{x:box.x,y:box.y,path:[]}],seen=new Set([box.x+','+box.y]);
   for(let i=0;i<queue.length;i++){const node=queue[i];if(node.y===0)return {id:box.id,path:node.path};
    for(const [dx,dy] of DIRS){const x=node.x+dx,y=node.y+dy,key=x+','+y;if(!seen.has(key)&&canPlace(g,box,x,y)){seen.add(key);queue.push({x,y,path:[...node.path,[dx,dy]]});}}
   }
  }return null;
 }
 function readSave(raw){try{const d=typeof raw==='string'?JSON.parse(raw):raw;if(d?.version===1&&Number.isInteger(d.completed)&&d.completed>=0&&d.completed<=10000)return {version:1,completed:d.completed};}catch(_){}return {version:1,completed:0};}
 function record(save,g){const old=readSave(save);return g.status==='won'?{version:1,completed:Math.max(old.completed,g.level)}:old;}
 return {COLS,ROWS,COLORS,SAVE_KEY,settings,create,start,move,hit,canPlace,exposed,step,tick,revive,hint,readSave,record};
});
