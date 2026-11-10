// Gameplay reference: MaximilianBuegler/laser-simulator (MIT, 2017).
// Independent vector ray tracer; see jiajia-light-source.md.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JiajiaLight=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const COLS=7,ROWS=8,SAVE_KEY='little-house-jiajia-light-v1',DELTA=[[1,0],[0,1],[-1,0],[0,-1]],COLORS={1:{name:'红',hex:'#d34841'},2:{name:'绿',hex:'#168957'},3:{name:'黄',hex:'#b57b08'},4:{name:'蓝',hex:'#296bce'},5:{name:'紫',hex:'#8855b8'},6:{name:'青',hex:'#158b99'},7:{name:'白',hex:'#e8b14c'}};
 const editable=c=>c&&['mirror','splitter','filter'].includes(c.type),reflect=(d,turn)=>turn?[1,0,3,2][d]:[3,2,1,0][d];
 function random(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
 function legacyTrace(board){
  const map=new Map(board.cells.map(c=>[c.x+','+c.y,c])),queue=board.cells.filter(c=>c.type==='source').map(c=>({x:c.x,y:c.y,d:c.dir,color:c.color})),seen=new Set(),visited=new Set(),segments=[],hits={};let steps=0;
  for(let i=0;i<queue.length;i++){
   const ray=queue[i],[dx,dy]=DELTA[ray.d],x=ray.x+dx,y=ray.y+dy;
   if(x<0||y<0||x>=board.cols||y>=board.rows){segments.push({x1:ray.x+.5,y1:ray.y+.5,x2:ray.x+.5+dx*.5,y2:ray.y+.5+dy*.5,color:ray.color});continue;}
   const key=`${x},${y},${ray.d},${ray.color}`;if(seen.has(key))continue;seen.add(key);steps++;visited.add(x+','+y);
   segments.push({x1:ray.x+.5,y1:ray.y+.5,x2:x+.5,y2:y+.5,color:ray.color});const c=map.get(x+','+y);
   if(c?.type==='wall'||c?.type==='source')continue;
   if(c?.type==='target'){hits[x+','+y]=(hits[x+','+y]||0)|ray.color;continue;}
   let color=ray.color;if(c?.type==='filter')color&=c.choices[c.turn];if(!color)continue;
   const d=c?.type==='mirror'||c?.type==='splitter'?reflect(ray.d,c.turn):ray.d;
   queue.push({x,y,d,color});if(c?.type==='splitter')queue.push({x,y,d:ray.d,color});
  }
  const targets=board.cells.filter(c=>c.type==='target'),lit=targets.filter(c=>hits[c.x+','+c.y]===c.color).length;
  return{segments,hits,lit,total:targets.length,solved:targets.length>0&&lit===targets.length,visited:[...visited],steps};
 }
 const angled=c=>c&&['mirror','splitter'].includes(c.type);
 const angle=c=>Number.isFinite(c.angle)?c.angle:c.turn?45:135;
 function setAngle(g,index,value){
  const c=g.board.cells[index];if(g.paused||g.status!=='playing'||!angled(c)||!Number.isFinite(value))return false;
  const n=((Math.round(value*10)%1800)+1800)%1800/10;
  c.turn=n===45?1:0;if(n===45||n===135)delete c.angle;else c.angle=n;return true;
 }
 function trace(board){
  const aspect=board.aspect||1,width=board.cols*aspect,half=(14*Math.SQRT2/56*.78)*Math.min(aspect,1);
  const queue=board.cells.filter(c=>c.type==='source').map(c=>({x:(c.x+.5)*aspect,y:c.y+.5,dx:DELTA[c.dir][0],dy:DELTA[c.dir][1],color:c.color,from:c})),segments=[],hits={},seen=new Set(),visited=new Set();let steps=0;
  const cross=(x,y,u,v)=>x*v-y*u,eps=1e-7;
  function intersect(r,ax,ay,bx,by){const sx=bx-ax,sy=by-ay,den=cross(r.dx,r.dy,sx,sy);if(Math.abs(den)<eps)return Infinity;const qx=ax-r.x,qy=ay-r.y,t=cross(qx,qy,sx,sy)/den,u=cross(qx,qy,r.dx,r.dy)/den;return t>eps&&u>=-eps&&u<=1+eps?t:Infinity;}
  for(let n=0;n<queue.length&&steps<512;n++,steps++){
   const r=queue[n],key=[r.x,r.y,r.dx,r.dy].map(v=>v.toFixed(5)).join(',')+','+r.color;if(seen.has(key))continue;seen.add(key);
   let distance=Math.min(r.dx>eps?(width-r.x)/r.dx:r.dx<-eps?-r.x/r.dx:Infinity,r.dy>eps?(board.rows-r.y)/r.dy:r.dy<-eps?-r.y/r.dy:Infinity),hit=null;
   for(const c of board.cells){if(c===r.from)continue;const x=(c.x+.5)*aspect,y=c.y+.5;let d=Infinity;
    if(angled(c)){const a=angle(c)*Math.PI/180,dx=Math.cos(a)*half,dy=Math.sin(a)*half;d=intersect(r,x-dx,y-dy,x+dx,y+dy);}
    else{const h=c.type==='wall'?.28:.22,w=h*aspect;d=Math.min(intersect(r,x-w,y-h,x+w,y-h),intersect(r,x+w,y-h,x+w,y+h),intersect(r,x+w,y+h,x-w,y+h),intersect(r,x-w,y+h,x-w,y-h));}
    if(d<distance){distance=d;hit=c;}
   }
   if(!Number.isFinite(distance)||distance<eps)continue;const x=r.x+r.dx*distance,y=r.y+r.dy*distance;
   segments.push({x1:r.x/aspect,y1:r.y,x2:x/aspect,y2:y,color:r.color});if(!hit)continue;visited.add(hit.x+','+hit.y);
   if(hit.type==='target'){const k=hit.x+','+hit.y;hits[k]=(hits[k]||0)|r.color;continue;}
   if(hit.type==='wall'||hit.type==='source')continue;
   let color=r.color;if(hit.type==='filter')color&=hit.choices[hit.turn];if(!color)continue;
   const base={x,y,color,from:hit};
   if(angled(hit)){const a=angle(hit)*Math.PI/180,ux=Math.cos(a),uy=Math.sin(a),dot=r.dx*ux+r.dy*uy;queue.push({...base,dx:2*dot*ux-r.dx,dy:2*dot*uy-r.dy});if(hit.type==='splitter')queue.push({...base,dx:r.dx,dy:r.dy});}
   else queue.push({...base,dx:r.dx,dy:r.dy});
  }
  const targets=board.cells.filter(c=>c.type==='target'),lit=targets.filter(c=>hits[c.x+','+c.y]===c.color).length;
  return{segments,hits,lit,total:targets.length,solved:targets.length>0&&lit===targets.length&&steps<512,visited:[...visited],steps};
 }
 function signature(board){const controls=board.cells.filter(editable),turns=controls.map(c=>c.turn).join('');return controls.some(c=>angled(c)&&Number.isFinite(c.angle))?turns+'@'+controls.map(c=>angled(c)?angle(c):'-').join(',')+'@'+(board.aspect||1):turns;}
 function generate(seed,level,layout){
  const rng=random((seed^Math.imul(level,2654435761))>>>0),pick=a=>a[Math.floor(rng()*a.length)],cells=[],palette=level<9?[1,2,4]:[1,2,4,3,5,6];
  const put=(type,x,y,extra={})=>{const c={type,x,y,...extra};cells.push(c);return c;},src=(x,y,dir=0,color=7)=>put('source',x,y,{dir,color}),m=(x,y,turn=0)=>put('mirror',x,y,{turn,solution:turn}),s=(x,y,turn=0)=>put('splitter',x,y,{turn,solution:turn}),t=(x,y,color=7)=>put('target',x,y,{color});
  const filtered=(fx,fy,tx,ty)=>{const color=level<4?7:pick(palette);if(level>=4){const turn=palette.indexOf(color);put('filter',fx,fy,{turn,solution:turn,choices:[...palette]});}t(tx,ty,color);};
  let template=level<=6?level-1:layout===2&&level===7?8:layout===2&&level===10?9:pick(layout===2&&level>10?[1,2,3,4,5,6,7,8,9]:[1,2,3,4,5,6,7]);
  if(template===0){src(0,6);m(4,6);t(4,1);}
  if(template===1){src(0,6);m(5,6);m(5,2,1);m(2,2);filtered(2,4,2,5);}
  if(template===2){src(0,5);s(3,5);filtered(5,5,6,5);m(3,2,1);filtered(1,2,0,2);}
  if(template===3){src(0,6);m(5,6);s(5,3,1);filtered(5,1,5,0);s(2,3);filtered(1,3,0,3);m(2,5,1);filtered(4,5,6,5);}
  if(template===4){src(0,6);s(2,6);m(2,1,1);filtered(1,1,0,1);s(4,6);m(4,3,1);filtered(1,3,0,3);filtered(5,6,6,6);}
  if(template===5){src(0,6,0,4);m(2,6);m(2,4,1);t(0,4,5);src(6,1,2,1);m(0,1);}
  if(template===6){src(6,7,2);m(5,7,1);m(5,1,1);m(1,1);s(1,5,1);filtered(3,5,6,5);filtered(1,6,1,7);}
  if(template===7){src(0,6);m(6,6);m(6,1,1);m(1,1);m(1,4,1);m(4,4);filtered(4,2,4,0);}
  if(template===8){src(0,1,0,1);m(2,1,1);m(2,6);t(0,6,1);src(6,6,2,4);m(4,6,1);m(4,1);t(6,1,4);}
  if(template===9){src(0,5);s(2,5);s(2,2,1);s(4,5,1);for(const [fx,fy,tx,ty,color]of [[1,2,0,2,1],[2,1,2,0,4],[4,6,4,7,2],[5,5,6,5,3]]){const turn=palette.indexOf(color);put('filter',fx,fy,{turn,solution:turn,choices:[...palette]});t(tx,ty,color);}}
  // Increasing coordinate remaps preserve every straight route while varying spacing.
  function coordinates(max,axis){const used=[...new Set(cells.map(c=>c[axis]))].filter(n=>n>0&&n<max).sort((a,b)=>a-b),pool=Array.from({length:max-1},(_,i)=>i+1);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}const values=pool.slice(0,used.length).sort((a,b)=>a-b);return new Map([[0,0],[max,max],...used.map((v,i)=>[v,values[i]])]);}
  if(level>1){const xs=coordinates(6,'x'),ys=coordinates(7,'y'),flipX=rng()<.5,flipY=rng()<.5;for(const c of cells){c.x=xs.get(c.x);c.y=ys.get(c.y);if(flipX)c.x=6-c.x;if(flipY)c.y=7-c.y;if(c.type==='source'){if(flipX&&(c.dir===0||c.dir===2))c.dir=(c.dir+2)%4;if(flipY&&(c.dir===1||c.dir===3))c.dir=(c.dir+2)%4;}if((c.type==='mirror'||c.type==='splitter')&&flipX!==flipY)c.turn=c.solution=c.turn^1;}}
  // Remove unused spacer coordinates: a three-piece tutorial needs a 2x2 table,
  // not the full 7x8 generation envelope. Ordering and all ray crossings survive.
  const xs=[...new Set(cells.map(c=>c.x))].sort((a,b)=>a-b),ys=[...new Set(cells.map(c=>c.y))].sort((a,b)=>a-b);
  for(const c of cells){c.x=xs.indexOf(c.x);c.y=ys.indexOf(c.y);}
  const board={cols:xs.length,rows:ys.length,template,cells},solved=legacyTrace(board);if(!solved.solved)throw new Error('Generated optical path must be solvable: '+template);
  const occupied=new Set(cells.map(c=>c.x+','+c.y)),route=new Set(solved.visited);for(const c of cells)if(c.type==='source')route.add(c.x+','+c.y);
  const free=[];for(let y=0;y<board.rows;y++)for(let x=0;x<board.cols;x++)if(!occupied.has(x+','+y)&&!route.has(x+','+y))free.push([x,y]);
  for(let n=0;n<(level<3?0:Math.min(6,2+Math.floor(level/5)))&&free.length;n++){const at=Math.floor(rng()*free.length),[x,y]=free.splice(at,1)[0];if(rng()<.65)put('wall',x,y);else m(x,y,pick([0,1]));}
  for(const c of cells)if(editable(c))c.turn=Math.floor(rng()*(c.type==='filter'?c.choices.length:2));
  if(legacyTrace(board).solved){const first=cells.find(c=>c.type==='mirror'||c.type==='splitter');first.turn^=1;}
  return board;
 }
 function create(seed=1,level=1,totalStars=0,layout=2){return{seed:seed>>>0,level,totalStars,layout,board:generate(seed>>>0,level,layout),left:6,shots:0,revives:0,status:'playing',paused:true,tested:null,tried:[],awarded:0};}
 function rotate(g,index,back=false){if(g.paused||g.status!=='playing'||!Number.isInteger(index)||!editable(g.board.cells[index]))return false;const c=g.board.cells[index];if(angled(c)&&Number.isFinite(c.angle))return setAngle(g,index,angle(c)+(back?-1:1));const count=c.type==='filter'?c.choices.length:2;c.turn=(c.turn+(back?count-1:1))%count;return true;}
 function shoot(g){if(g.paused||g.status!=='playing')return{kind:'blocked'};const key=signature(g.board);if(g.tried.includes(key)){g.tested=key;return{kind:'repeat',trace:trace(g.board)};}g.tested=key;g.tried.push(key);const result=trace(g.board);if(result.solved){g.status='won';g.paused=true;g.awarded=g.revives?1:g.shots<=1?3:2;g.totalStars=Math.min(1e9,g.totalStars+g.awarded);return{kind:'won',trace:result};}g.shots++;g.left--;if(g.left===0){g.status='lost';g.paused=true;}return{kind:g.status==='lost'?'lost':'miss',trace:result};}
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.left=3;g.status='playing';g.paused=true;return true;}
 function next(g){return g.status==='won'&&g.level<1000000?create(g.seed,g.level+1,g.totalStars):null;}
 function retry(g){return create(g.seed,g.level,Math.max(0,g.totalStars-g.awarded),g.layout);}
 function save(g){return JSON.stringify({version:g.layout===1?2:3,game:{aspect:g.board.aspect??null,seed:g.seed,level:g.level,totalStars:g.totalStars,left:g.left,shots:g.shots,revives:g.revives,status:g.status,tested:g.tested,tried:g.tried,awarded:g.awarded,turns:g.board.cells.filter(editable).map(c=>c.turn),angles:g.board.cells.filter(editable).map(c=>Number.isFinite(c.angle)?c.angle:null)}});}
 function restore(json){try{
  if(typeof json!=='string'||json.length>22000)return null;const d=JSON.parse(json),s=d?.game;if(![1,2,3].includes(d?.version)||!s)return null;const int=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
  if(!int(s.seed,0,4294967295)||!int(s.level,1,1000000)||!int(s.totalStars,0,1e9)||!int(s.shots,0,12)||!int(s.left,0,6)||!int(s.revives,0,2)||!int(s.awarded,0,3)||!['playing','lost','won'].includes(s.status)||s.left!==6+3*s.revives-s.shots)return null;
  const g=create(s.seed,s.level,s.totalStars,d.version===3?2:1),controls=g.board.cells.filter(editable);if(!Array.isArray(s.turns)||s.turns.length!==controls.length||!s.turns.every((v,i)=>int(v,0,controls[i].type==='filter'?controls[i].choices.length-1:1)))return null;
  const validTurns=key=>typeof key==='string'&&key.length===controls.length&&[...key].every((v,i)=>/^[0-5]$/.test(v)&&+v<(controls[i].type==='filter'?controls[i].choices.length:2));
  const validAngle=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<180&&Math.abs(v*10-Math.round(v*10))<1e-8;
  const validAspect=v=>typeof v==='number'&&Number.isFinite(v)&&v>=.01&&v<=100;
  if(d.version>=2&&s.aspect!==null&&!validAspect(s.aspect))return null;
  const validKey=key=>{if(typeof key!=='string'||key.length>2000)return false;const parts=key.split('@');if(!validTurns(parts[0])||parts.length>3)return false;if(parts.length===1)return true;if(parts.length!==3||!validAspect(+parts[2])||String(+parts[2])!==parts[2])return false;const values=parts[1].split(',');return values.length===controls.length&&values.every((v,i)=>angled(controls[i])?v!==''&&validAngle(+v)&&String(+v)===v:v==='-');};
  if(d.version>=2&&(!Array.isArray(s.angles)||s.angles.length!==controls.length||!s.angles.every((v,i)=>v===null||angled(controls[i])&&validAngle(v))))return null;
  if(!Array.isArray(s.tried)||s.tried.length>13||!s.tried.every(validKey)||new Set(s.tried).size!==s.tried.length||s.tried.length!==s.shots+(s.status==='won'?1:0)||s.tested!==null&&(!validKey(s.tested)||!s.tried.includes(s.tested))||s.tested===null&&s.tried.length)return null;
  if(d.version>=2&&s.aspect!==null)g.board.aspect=s.aspect;for(let i=0;i<controls.length;i++){controls[i].turn=s.turns[i];if(d.version>=2&&s.angles[i]!==null){if(s.turns[i]!==0||s.angles[i]===45||s.angles[i]===135)return null;controls[i].angle=s.angles[i];}}for(const k of ['left','shots','revives','status','tested','tried','awarded'])g[k]=s[k];
  if(g.status==='lost'&&(g.left!==0||g.tested!==signature(g.board)||trace(g.board).solved)||g.status==='playing'&&g.left===0||g.status==='won'&&(g.tested!==signature(g.board)||!trace(g.board).solved)||g.status!=='won'&&g.awarded!==0||g.status==='won'&&(g.awarded!==(g.revives?1:g.shots<=1?3:2)||g.totalStars<g.awarded)||g.shots>0&&g.tested===null||g.revives>0&&g.shots<6+3*(g.revives-1))return null;
  return g;
 }catch(_){return null;}}
 return{COLS,ROWS,SAVE_KEY,COLORS,editable,reflect,angle,setAngle,trace,signature,create,rotate,shoot,revive,next,retry,save,restore};
});
