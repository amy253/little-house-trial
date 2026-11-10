(function(root){
 const R=18,D=38,DY=Math.sqrt(3)*19,ORIGIN={x:216,y:488};
 function random(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
 function difficulty(shots){return {interval:Math.max(3,6-Math.floor(shots/12)),colors:Math.min(5,4+Math.floor(shots/30))};}
 function position(g,o){return {x:45+o.col*D+((o.row+g.phase)%2)*19,y:30+o.row*DY};}
 function rowLength(g,row){return (row+g.phase)%2?9:10;}
 function exists(g,row,col){return row>=0&&row<=12&&col>=0&&col<rowLength(g,row);}
 function addRow(g,row){let previous;for(let col=0;col<rowLength(g,row);col++){const color=col&&random(g)<.2?previous:Math.floor(random(g)*difficulty(g.shots).colors);g.board.push({row,col,color});previous=color;}}
 function fill(g,rows){g.board=[];for(let row=0;row<rows;row++)addRow(g,row);}
 function pick(g){const colors=[...new Set(g.board.map(o=>o.color))];return colors[Math.floor(random(g)*colors.length)];}
 function create(seed){const g={seed:(seed===undefined?Math.random()*0xffffffff:seed)>>>0||1,phase:0,shots:0,sincePush:0,score:0,clears:0,status:'playing',projectile:null,board:[]};fill(g,5);g.current=g.board.find(o=>o.row===4&&o.col===4).color;g.board.find(o=>o.row===4&&o.col===5).color=g.current;for(const o of g.board)if((o.row===3&&o.col>=3&&o.col<=5||o.row===4&&(o.col===3||o.col===6))&&o.color===g.current)o.color=(o.color+1+Math.floor(random(g)*3))%4;g.next=pick(g);return g;}
 // Adapted from straker's CC0 Puzzle Bobble example: neighboring circles,
 // breadth-first same-color matching, and connectivity to the ceiling.
 // https://gist.github.com/M33p5t3r/4ce0732fa4591beb4d400b9165439122
 function neighbors(g,o){const p=position(g,o);return g.board.filter(b=>b!==o&&Math.abs(b.row-o.row)<=1&&Math.hypot(position(g,b).x-p.x,position(g,b).y-p.y)<D+1);}
 function connected(g,seeds,color){const seen=new Set(seeds),queue=[...seeds];for(let i=0;i<queue.length;i++)for(const n of neighbors(g,queue[i]))if(!seen.has(n)&&(color===undefined||n.color===color)){seen.add(n);queue.push(n);}return [...seen];}
 function loseCheck(g){if(g.board.some(o=>position(g,o).y+R>=424))g.status='lost';}
 function pushRow(g){g.board.forEach(o=>o.row++);g.phase=1-g.phase;addRow(g,0);loseCheck(g);}
 function attach(g,row,col,color){if(g.status!=='playing'||!exists(g,row,col)||g.board.some(o=>o.row===row&&o.col===col))return null;const o={row,col,color};g.board.push(o);const matches=connected(g,[o],color),popped=matches.length>=3?matches.map(b=>({...b,...position(g,b)})):[];g.board=g.board.filter(b=>!matches.includes(b)||!popped.length);const anchored=new Set(connected(g,g.board.filter(b=>b.row===0)));const fallen=g.board.filter(b=>!anchored.has(b)).map(b=>({...b,...position(g,b)}));g.board=g.board.filter(b=>anchored.has(b));g.score+=popped.length*10+fallen.length*20;g.shots++;g.sincePush++;g.projectile=null;let pushed=false,cleared=false;
  if(!g.board.length){g.clears++;g.score+=100;g.sincePush=0;fill(g,5);cleared=true;}
  else if(g.sincePush>=difficulty(g.shots).interval){g.sincePush=0;pushRow(g);pushed=true;}
  loseCheck(g);g.current=g.board.some(b=>b.color===g.next)?g.next:pick(g);g.next=pick(g);return {row,col,popped,fallen,pushed,cleared};
 }
 function projectile(g,angle){const a=Math.max(-1.22,Math.min(1.22,angle));return {...ORIGIN,vx:Math.sin(a)*820,vy:-Math.cos(a)*820,color:g.current,accumulator:0};}
 function fire(g,angle){if(g.status!=='playing'||g.projectile)return false;g.projectile=projectile(g,angle);return true;}
 function snap(g,p,hit){const options=[];for(let row=hit?Math.max(0,hit.row-1):0;row<=(hit?hit.row+1:0);row++)for(let col=0;col<rowLength(g,row);col++){const o={row,col};if(!exists(g,row,col)||g.board.some(b=>b.row===row&&b.col===col))continue;const q=position(g,o);if(hit){const h=position(g,hit);if(Math.hypot(q.x-h.x,q.y-h.y)>D+1)continue;}options.push({...o,distance:Math.hypot(q.x-p.x,q.y-p.y)});}options.sort((a,b)=>a.distance-b.distance);return options[0];}
 function advance(g,p,dt){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<42){p.x=84-p.x;p.vx=Math.abs(p.vx);}if(p.x>390){p.x=780-p.x;p.vx=-Math.abs(p.vx);}let hit=null;for(const o of g.board){const q=position(g,o);if(Math.hypot(p.x-q.x,p.y-q.y)<=R*2){hit=o;break;}}if(hit||p.y<=30)return {cell:snap(g,p,hit)};return null;}
 function step(g,dt){if(g.status!=='playing'||!g.projectile)return null;g.projectile.accumulator+=dt;while(g.projectile.accumulator>=.004-1e-9){g.projectile.accumulator-=.004;const event=advance(g,g.projectile,.004);if(event){if(!event.cell){g.projectile=null;g.status='lost';return null;}return attach(g,event.cell.row,event.cell.col,g.projectile.color);}}return null;}
 function preview(g,angle){const p=projectile(g,angle),points=[{x:p.x,y:p.y}];for(let i=0;i<700;i++){const event=advance(g,p,.004);if(i%8===0)points.push({x:p.x,y:p.y});if(event){if(event.cell)points.push({...position(g,event.cell),row:event.cell.row,col:event.cell.col});break;}}return points;}
 function revive(g){
  if(g.status!=='lost')return false;
  const maxRow=Math.max(0,...g.board.map(o=>o.row)),cutoff=Math.max(1,maxRow-2);
  g.board=g.board.filter(o=>o.row<cutoff);
  if(!g.board.length)addRow(g,0);
  const anchored=new Set(connected(g,g.board.filter(o=>o.row===0)));g.board=g.board.filter(o=>anchored.has(o));
  if(!g.board.length)addRow(g,0);
  if(!g.board.some(o=>o.color===g.current))g.current=pick(g);
  if(!g.board.some(o=>o.color===g.next))g.next=pick(g);
  g.projectile=null;g.sincePush=0;g.status='playing';return true;
 }
const api={revive,R,D,DY,ORIGIN,create,difficulty,position,pushRow,attach,fire,step,preview};if(typeof module!=='undefined')module.exports=api;else root.BuliBubbles=api;
})(typeof window==='undefined'?globalThis:window);
