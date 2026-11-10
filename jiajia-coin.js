(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JiajiaCoin=factory();})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const MAX_COINS=160,SAVE_KEY='little-house-jiajia-coin-v1';
 // Combo thresholds adapted from JonathanAlphonso/coin-pusher-world (README: MIT).
 const TIERS=[[30,7],[20,5],[15,4],[10,3],[6,2],[3,1.5],[0,1]];
 function create(seed,best=0){return{version:1,seed:seed>>>0,wallet:40,score:0,best:Math.max(0,Math.floor(best)||0),spent:0,returned:0,missed:0,combo:0,comboMs:0,bestCombo:0,elapsedMs:0,emptyMs:0,cooldownMs:0,revives:0,status:'playing',paused:false,nextId:90,coins:Array.from({length:90},(_,id)=>({id,kind:id%17===16?'silver':'gold'}))};}
 const live=g=>g.status==='playing'&&!g.paused;
 function drop(g){if(!live(g)||g.wallet<=0||g.cooldownMs>0||g.coins.length>=MAX_COINS)return null;const id=g.nextId++,c={id,kind:id%17===16?'silver':'gold'};g.wallet--;g.spent++;g.cooldownMs=180;g.coins.push(c);return c;}
 function multiplier(g){return TIERS.find(t=>g.combo>=t[0])[1];}
 function collect(g,id,front){if(!live(g))return false;const i=g.coins.findIndex(c=>c.id===id);if(i<0)return false;const [c]=g.coins.splice(i,1);if(front){g.combo++;g.comboMs=1500;g.bestCombo=Math.max(g.bestCombo,g.combo);g.wallet+=c.kind==='silver'?3:1;g.returned++;g.emptyMs=0;g.score+=(c.kind==='silver'?50:10)*multiplier(g);g.best=Math.max(g.best,g.score);}else g.missed++;return true;}
 function tick(g,ms){if(!live(g)||!Number.isFinite(ms)||ms<=0)return;g.elapsedMs+=ms;g.cooldownMs=Math.max(0,g.cooldownMs-ms);g.comboMs=Math.max(0,g.comboMs-ms);if(!g.comboMs)g.combo=0;g.emptyMs=g.wallet?0:Math.min(20000,g.emptyMs+ms);if(g.emptyMs>=20000)g.status='lost';}
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.wallet=25;g.emptyMs=0;g.cooldownMs=0;g.status='playing';g.paused=true;return true;}
 function save(game,snapshot){return JSON.stringify({version:1,game,snapshot});}
 const integer=(n,max=1e12)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const vector=(a,n,max)=>Array.isArray(a)&&a.length===n&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<=max);
 function restore(raw){try{
  if(typeof raw!=='string'||raw.length>200000)return null;const d=JSON.parse(raw),g=d?.game,s=d?.snapshot;if(d.version!==1||g?.version!==1||!s)return null;
  for(const k of ['seed','wallet','score','best','spent','returned','missed','combo','bestCombo','nextId'])if(!integer(g[k]))return null;
  if(!integer(g.seed,4294967295)||!integer(g.revives,2)||!['playing','lost'].includes(g.status)||typeof g.paused!=='boolean')return null;
  for(const k of ['comboMs','elapsedMs','emptyMs','cooldownMs'])if(!Number.isFinite(g[k])||g[k]<0||g[k]>1e12)return null;
  if(g.comboMs>1500||g.emptyMs>20000||g.cooldownMs>180||g.best<g.score||g.bestCombo<g.combo)return null;
  if(g.status==='lost'&&(g.wallet!==0||g.emptyMs!==20000))return null;
  if(!Array.isArray(g.coins)||g.coins.length>MAX_COINS||!Number.isFinite(s.phase)||s.phase<0||s.phase>=4.8||!Number.isFinite(s.accumulator)||s.accumulator<0||s.accumulator>=1/60+1e-8||!Array.isArray(s.bodies)||s.bodies.length!==g.coins.length)return null;
  const ids=new Set();for(const c of g.coins){if(!integer(c.id)||c.id>=g.nextId||ids.has(c.id)||!['gold','silver'].includes(c.kind))return null;ids.add(c.id);}
  const seen=new Set();for(const b of s.bodies){if(!ids.has(b.id)||seen.has(b.id)||!vector(b.p,3,100)||!vector(b.q,4,1.01)||!vector(b.v,3,200)||!vector(b.w,3,500)||!integer(b.sleep,2))return null;const norm=b.q.reduce((v,q)=>v+q*q,0);if(Math.abs(norm-1)>.02)return null;seen.add(b.id);}
  g.paused=true;return{game:g,snapshot:s};
 }catch(_){return null;}}
 return{MAX_COINS,SAVE_KEY,create,drop,collect,tick,revive,multiplier,level:g=>1+Math.floor(g.score/500),save,restore};
});
