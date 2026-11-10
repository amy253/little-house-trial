(function(root,factory){const E=typeof module==='object'&&module.exports?require('./vendor/water-decanta.js'):root.WaterDecanta;const api=factory(E);if(typeof module==='object'&&module.exports)module.exports=api;root.JiajiaWater=api;})(typeof window==='object'?window:globalThis,function(E){
 'use strict';
 const SAVE_KEY='little-house:jiajia-water:v1',copy=b=>({capacity:4,tubes:b.tubes.map(t=>t.slice())});
 const colorsFor=level=>Math.min(8,3+Math.floor((level-1)/3));
 // mulberry32 and Fisher-Yates adapted from Decanta's MIT generator.ts.
 function rng(seed){let a=seed>>>0;return()=>{a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
 function generate(level,seed,options={}){
  const n=colorsFor(level),random=rng(seed),attempts=options.attempts??8;
  for(let k=0;k<attempts;k++){
   const pool=Array.from({length:n*4},(_,i)=>Math.floor(i/4));for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   const board={capacity:4,tubes:[...Array.from({length:n},(_,i)=>pool.slice(i*4,i*4+4)),[],[]]};
   if(board.tubes.some(t=>t.length===4&&E.isSingleColor(t)))continue;
   const result=E.solve(board,6000);if(result.solved&&result.moves.length>=n)return{board,solution:result.moves};
  }
  // Bounded fallback: accept an unpour ONLY when a real forward pour exactly
  // reconstructs its parent. Unlike naive backward shuffling, runs cannot merge
  // irreversibly. The reversed witness is replayable under the actual rules.
  let board={capacity:4,tubes:[...Array.from({length:n},(_,c)=>[c,c,c,c]),[],[]]},solution=[],seen=new Set([JSON.stringify(board.tubes)]);
  for(let step=0;step<35+n*6;step++){
   const candidates=[];
   for(let from=0;from<board.tubes.length;from++)for(let to=0;to<board.tubes.length;to++){
    if(from===to)continue;for(let amount=1;amount<=Math.min(E.topRun(board.tubes[from]),4-board.tubes[to].length);amount++){
     const b=copy(board),liquid=b.tubes[from].splice(-amount);b.tubes[to].push(...liquid);
     const key=JSON.stringify(b.tubes);if(seen.has(key))continue;
     if(E.canPour(b,to,from)&&JSON.stringify(E.applyMove(b,to,from).tubes)===JSON.stringify(board.tubes))candidates.push({b,key,from:to,to:from});
    }
   }
   if(!candidates.length)break;const choice=candidates[Math.floor(random()*candidates.length)];board=choice.b;seen.add(choice.key);solution.unshift({from:choice.from,to:choice.to});
  }
  return{board,solution};
 }
 function create(level,puzzle){return{version:1,level,initial:copy(puzzle.board),board:copy(puzzle.board),moves:0,history:[],remainingMs:180000+(colorsFor(level)-3)*30000,elapsedMs:0,revives:0,status:'playing',reason:'',paused:false};}
 function check(g){if(g.status!=='playing')return;if(E.isWin(g.board)){g.status='won';g.reason='';}else if(E.legalMoves(g.board).length===0){g.status='lost';g.reason='blocked';}}
 function pour(g,from,to){
  if(g.paused||g.status!=='playing'||![from,to].every(i=>Number.isInteger(i)&&i>=0&&i<g.board.tubes.length))return 0;
  const amount=E.pourAmount(g.board,from,to);if(!amount)return 0;
  g.history.push(copy(g.board));if(g.history.length>300)g.history.shift();g.board=E.applyMove(g.board,from,to);g.moves++;check(g);return amount;
 }
 function undo(g){if(g.status!=='playing'||!g.history.length)return false;g.board=g.history.pop();g.moves=Math.max(0,g.moves-1);return true;}
 function tick(g,dt){if(g.status!=='playing'||g.paused||!Number.isFinite(dt)||dt<=0)return;const used=Math.min(g.remainingMs,dt);g.remainingMs-=used;g.elapsedMs+=used;if(!g.remainingMs){g.status='lost';g.reason='time';}}
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.board.tubes.push([]);g.remainingMs=Math.max(60000,g.remainingMs);g.status='playing';g.reason='';g.paused=true;g.history=[];return true;}
 function save(g){return JSON.stringify(g);}
 function restore(text){
  if(typeof text!=='string'||text.length>500000)return null;
  try{
   const g=JSON.parse(text);if(!g||g.version!==1||!Number.isInteger(g.level)||g.level<1||g.level>1000000000||!Number.isInteger(g.revives)||g.revives<0||g.revives>2||!Number.isInteger(g.moves)||g.moves<0||g.moves>10000000||!['playing','lost','won'].includes(g.status)||!['','time','blocked'].includes(g.reason)||![g.remainingMs,g.elapsedMs].every(v=>Number.isFinite(v)&&v>=0&&v<=1000000000)||!Array.isArray(g.history)||g.history.length>300)return null;
   const colors=colorsFor(g.level),base=colors+2;
   function valid(b,length){if(!b||b.capacity!==4||!Array.isArray(b.tubes)||b.tubes.length!==length)return false;const tally=new Array(colors).fill(0);for(const t of b.tubes){if(!Array.isArray(t)||t.length>4)return false;for(const c of t){if(!Number.isInteger(c)||c<0||c>=colors)return false;tally[c]++;}}return tally.every(v=>v===4);}
   if(!valid(g.initial,base)||!valid(g.board,base+g.revives)||g.history.some(b=>!valid(b,base+g.revives)))return null;
   if((g.status==='won')!==E.isWin(g.board)||g.status==='playing'&&g.remainingMs===0||g.status==='lost'&&!(g.reason==='time'&&g.remainingMs===0||g.reason==='blocked'&&E.legalMoves(g.board).length===0))return null;
   g.paused=true;return g;
  }catch(_){return null;}
 }
 return{SAVE_KEY,colorsFor,generate,create,check,pour,undo,tick,revive,save,restore};
});
