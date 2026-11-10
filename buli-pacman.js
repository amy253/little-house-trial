(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliPacman=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DIR={left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}},OPP={left:'right',right:'left',up:'down',down:'up'};
 const BASE=[
 '###################',
 '#o.......#.......o#',
 '#.##.###.#.###.##.#',
 '#.................#',
 '#.##.#.#####.#.##.#',
 '#....#...#...#....#',
 '####.###.#.###.####',
 '#....#.......#....#',
 '#.##.#.##.##.#.##.#',
 '#......     ......#',
 '###.##.#...#.##.###',
 '.......#   #.......',
 '###.##.#####.##.###',
 '#........#........#',
 '#.##.###.#.###.##.#',
 '#o.#..... .....#.o#',
 '##.#.#.#####.#.#.##',
 '#....#...#...#....#',
 '#.######.#.######.#',
 '#.................#',
 '###################'];
 function mapFor(level){const grid=BASE.map(r=>r.split(''));if(level%2===0){for(const [x,y] of [[5,4],[13,4],[5,17],[13,17]])grid[y][x]='.';for(const [x,y] of [[9,7],[9,17]])grid[y][x]='#';}return grid.map(r=>r.join(''));}
 function actor(x,y,dir='left'){return {x,y,tx:x,ty:y,t:0,moving:false,dir};}
 function config(level){return {playerSpeed:5.1+Math.min(10,level-1)*.07,ghostSpeed:3.65+Math.min(12,level-1)*.145,powerDuration:Math.max(4,8-(level-1)*.45),scatter:Math.max(3,7-level*.3),chase:12+Math.min(10,level)*.8};}
 function resetActors(s){s.player=actor(9,15,'left');s.wanted='left';s.ghosts=Array.from({length:Math.min(4,s.level+1)},(_,i)=>Object.assign(actor(8+(i%3),9),{id:i,mode:'normal',release:i*2.1+1.4,recover:0,home:{x:9,y:9}}));s.elapsed=0;s.power=0;s.chain=0;s.invulnerable=2.2;}
 function create(level=1){level=Number.isFinite(level)?Math.max(1,Math.floor(level)):1;const map=mapFor(level),s={level,map,width:19,height:21,tunnel:11,food:new Map(),score:0,lives:3,time:0,elapsed:0,phase:'intro',timer:0,power:0,chain:0,events:[],config:config(level)};map.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='.'||ch==='o')s.food.set(y*19+x,ch==='o'?2:1);}));s.total=s.food.size;resetActors(s);return s;}
 function neighbor(s,x,y,dir){const d=DIR[dir];if(!d)return null;let nx=x+d.x,ny=y+d.y;if(ny===s.tunnel&&d.x)nx=(nx+s.width)%s.width;if(nx<0||nx>=s.width||ny<0||ny>=s.height||s.map[ny][nx]==='#')return null;return {x:nx,y:ny};}
 function position(a){let dx=a.tx-a.x;if(Math.abs(dx)>1)dx=dx>0?-1:1;return {x:a.x+dx*a.t,y:a.y+(a.ty-a.y)*a.t};}
 function start(s){if(s.phase!=='intro')return false;s.phase='ready';s.timer=1.8;return true;}
 function turn(s,dir){if(!DIR[dir]||!['playing','ready'].includes(s.phase))return false;s.wanted=dir;const p=s.player;if(p.moving&&dir===OPP[p.dir]){[p.x,p.tx]=[p.tx,p.x];[p.y,p.ty]=[p.ty,p.y];p.t=1-p.t;p.dir=dir;}return true;}
 function emit(s,type,x,y,value){s.events.push({type,x,y,value});if(s.events.length>80)s.events.shift();}
 function eat(s){const p=s.player,key=p.y*s.width+p.x,v=s.food.get(key);if(!v)return;s.food.delete(key);s.score+=v===2?50:10;emit(s,v===2?'power':'food',p.x,p.y,v===2?50:10);if(v===2){s.power=s.config.powerDuration;s.chain=0;for(const g of s.ghosts){if(g.mode==='normal'&&g.moving)reverse(g);}}if(!s.food.size){s.score+=500;s.phase='clear';emit(s,'clear',p.x,p.y,500);}}
 function reverse(a){if(!a.moving)return;[a.x,a.tx]=[a.tx,a.x];[a.y,a.ty]=[a.ty,a.y];a.t=1-a.t;a.dir=OPP[a.dir];}
 function move(s,a,distance,choose,onCell){let budget=distance;while(budget>1e-8){if(!a.moving){const dir=choose(),n=neighbor(s,a.x,a.y,dir);if(!n)break;a.dir=dir;a.tx=n.x;a.ty=n.y;a.t=0;a.moving=true;}const amount=Math.min(budget,1-a.t);a.t+=amount;budget-=amount;if(a.t>=1-1e-8){a.x=a.tx;a.y=a.ty;a.t=0;a.moving=false;const stop=onCell()===false;if(s.phase!=='playing'||stop)break;}}}
 function distances(s,target){let tx=Math.max(0,Math.min(s.width-1,Math.round(target.x))),ty=Math.max(0,Math.min(s.height-1,Math.round(target.y)));if(s.map[ty][tx]==='#'){let best=Infinity;for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const dist=Math.abs(tx-x)+Math.abs(ty-y);if(s.map[y][x]!=='#'&&dist<best){best=dist;target={x,y};}}tx=target.x;ty=target.y;}const out=new Map([[ty*s.width+tx,0]]),q=[{x:tx,y:ty}];for(let i=0;i<q.length;i++){const p=q[i],n=out.get(p.y*s.width+p.x);for(const d of Object.keys(DIR)){const next=neighbor(s,p.x,p.y,d);if(next&&!out.has(next.y*s.width+next.x)){out.set(next.y*s.width+next.x,n+1);q.push(next);}}}return out;}
 function target(s,g){if(g.mode==='eyes')return g.home;const corner=[{x:17,y:1},{x:1,y:1},{x:17,y:19},{x:1,y:19}][g.id];const cycle=s.config.scatter+s.config.chase;if(s.elapsed%cycle<s.config.scatter)return corner;const p=s.player,d=DIR[p.dir]||DIR.left;if(g.id===0)return p;if(g.id===1)return {x:p.x+d.x*3,y:p.y+d.y*3};if(g.id===2)return {x:p.x-d.y*3,y:p.y+d.x*3};return Math.abs(p.x-g.x)+Math.abs(p.y-g.y)<5?corner:p;}
 function ghostDir(s,g){let dirs=Object.keys(DIR).filter(d=>neighbor(s,g.x,g.y,d));if(dirs.length>1&&g.mode!=='eyes')dirs=dirs.filter(d=>d!==OPP[g.dir]);const flee=s.power>0&&g.mode==='normal',dist=distances(s,flee?s.player:target(s,g));let best=dirs[0],value=flee?-Infinity:Infinity;for(const d of dirs){const n=neighbor(s,g.x,g.y,d),v=dist.get(n.y*s.width+n.x)??999;if(flee?v>value:v<value){value=v;best=d;}}return best;}
 function collide(s){const p=position(s.player);for(const g of s.ghosts){if(g.release>s.elapsed||g.mode==='eyes'||g.recover>0)continue;const a=position(g);let dx=Math.abs(a.x-p.x);if(Math.abs(a.y-s.tunnel)<.1&&Math.abs(p.y-s.tunnel)<.1)dx=Math.min(dx,s.width-dx);if(Math.hypot(dx,a.y-p.y)>.62)continue;if(s.power>0){g.mode='eyes';s.chain=Math.min(4,s.chain+1);const points=100*2**s.chain;s.score+=points;emit(s,'catch',a.x,a.y,points);}else if(s.invulnerable<=0){s.lives--;s.phase=s.lives>0?'hit':'over';s.timer=1.35;emit(s,'hit',p.x,p.y,s.lives);return;}}}
 function tick(s,dt){if(s.phase==='paused'||s.phase==='intro'||s.phase==='clear'||s.phase==='over')return;
 if(s.phase==='ready'){s.timer-=dt;if(s.timer<=0)s.phase='playing';return;}
 if(s.phase==='hit'){s.timer-=dt;if(s.timer<=0){resetActors(s);s.phase='ready';s.timer=1.8;}return;}
 s.time+=dt;s.elapsed+=dt;s.power=Math.max(0,s.power-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);
 if(!s.player.moving)eat(s);if(s.phase!=='playing')return;
 move(s,s.player,dt*s.config.playerSpeed,()=>neighbor(s,s.player.x,s.player.y,s.wanted)?s.wanted:s.player.dir,()=>eat(s));if(s.phase!=='playing')return;
 for(const g of s.ghosts){if(g.release>s.elapsed)continue;if(g.recover>0){g.recover=Math.max(0,g.recover-dt);continue;}const speed=g.mode==='eyes'?8.2:s.power>0?s.config.ghostSpeed*.63:s.config.ghostSpeed;move(s,g,dt*speed,()=>ghostDir(s,g),()=>{if(g.mode==='eyes'&&g.x===g.home.x&&g.y===g.home.y){g.mode='normal';g.recover=1.8;}return g.recover<=0;});}
 collide(s);
 }
 function step(s,dt){if(!Number.isFinite(dt)||dt<=0)return;let remain=Math.min(dt,3);while(remain>1e-8){const t=Math.min(.008,remain);tick(s,t);remain-=t;}}
 function pause(s){if(['playing','ready','hit'].includes(s.phase)){s.beforePause=s.phase;s.phase='paused';return true;}return false;}
 function resume(s){if(s.phase!=='paused')return false;s.phase=s.beforePause||'ready';delete s.beforePause;return true;}
 function next(s){if(s.phase!=='clear')return false;const n=create(s.level+1);n.score=s.score;n.lives=s.lives;n.time=s.time;Object.assign(s,n);start(s);return true;}
 function revive(s){
  if(s.phase!=='over')return false;
  s.lives=1;resetActors(s);s.phase='ready';s.timer=1.8;s.events=[];delete s.beforePause;return true;
 }
 function readBest(raw){try{const n=JSON.parse(raw);return Number.isSafeInteger(n)&&n>=0&&n<=1e9?n:0;}catch{return 0;}}
 return {revive,create,actor,neighbor,position,start,turn,step,pause,resume,next,readBest};
});
