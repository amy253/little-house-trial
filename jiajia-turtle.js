(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JiajiaTurtle=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const SAVE_KEY='little-house-jiajia-turtle-v1',COLORS=[
  {name:'青苹果',hex:'#71ad69',hue:70,mark:'A'},{name:'蜜桃粉',hex:'#e89ba9',hue:300,mark:'B'},
  {name:'天空蓝',hex:'#73b5d4',hue:170,mark:'C'},{name:'柠檬黄',hex:'#d3b847',hue:10,mark:'D'},
  {name:'葡萄紫',hex:'#a69bd5',hue:240,mark:'E'},{name:'橘子橙',hex:'#db9b65',hue:350,mark:'F'},
  {name:'薄荷青',hex:'#72bfae',hue:120,mark:'G'},{name:'莓果红',hex:'#c77786',hue:320,mark:'H'}
 ];
 const integer=(n,max=1e9)=>Number.isInteger(n)&&n>=0&&n<=max;
 const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 function create(lucky=0,progress=null,seed=((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0)||1){
  if(!integer(lucky,7))throw new RangeError('请选择一种许愿色');
  const collection=COLORS.map((_,i)=>integer(progress?.collection?.[i])?progress.collection[i]:0);
  return {version:2,lucky,seed:(seed>>>0)||1,bags:9,board:Array(9).fill(null),opened:0,pairs:0,triples:0,luckyHits:0,clears:0,revives:0,collection,best:integer(progress?.best)?progress.best:0,status:'playing',stage:'deal'};
 }
 function selection(g,indices){
  if(!Array.isArray(indices)||![2,3].includes(indices.length)||new Set(indices).size!==indices.length||!indices.every(i=>integer(i,8)))return null;
  const color=g.board[indices[0]];if(color===null||!indices.every(i=>g.board[i]===color))return null;
  if(indices.length===3&&!LINES.some(line=>line.every(i=>indices.includes(i))))return null;
  return {indices:[...indices].sort((a,b)=>a-b),kind:indices.length===3?'triple':'pair',reward:indices.length===3?3:1};
 }
 function moves(g){
  const found=LINES.map(line=>selection(g,line)).filter(Boolean);
  for(let a=0;a<8;a++)for(let b=a+1;b<9;b++){const pair=selection(g,[a,b]);if(pair)found.push(pair);}
  return found;
 }
 function settle(g){
  if(g.stage==='deal'&&g.bags>0&&g.board.includes(null)){g.status='playing';return;}
  if(moves(g).length){g.stage='match';g.status='playing';}
  else{g.stage='deal';g.status=g.bags>0?'playing':'lost';}
 }
 function open(g){
  if(g.status!=='playing'||g.stage!=='deal'||g.bags<1||!g.board.includes(null))return null;
  let seed=g.seed;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;g.seed=seed>>>0;
  const color=Math.floor(g.seed/4294967296*COLORS.length),slot=g.board.indexOf(null);
  g.bags--;g.opened++;g.collection[color]++;g.board[slot]=color;
  const lucky=color===g.lucky,reward=lucky?1:0;
  if(lucky)g.luckyHits++;
  g.bags+=reward;settle(g);
  return {color,slot,lucky,reward};
 }
 function match(g,indices){
  if(g.status!=='playing'||g.stage!=='match')return null;
  const event=selection(g,indices);if(!event)return null;
  event.color=g.board[event.indices[0]];for(const i of event.indices)g.board[i]=null;
  if(event.kind==='triple')g.triples++;else g.pairs++;
  event.cleared=g.board.every(c=>c===null);if(event.cleared){g.clears++;event.reward+=5;}
  g.bags+=event.reward;g.best=Math.max(g.best,g.pairs+g.triples);settle(g);return event;
 }
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.bags+=5;g.stage='deal';g.status='playing';return true;}
 function save(g){return JSON.stringify(g);}
 function restore(raw){
  try{
   if(typeof raw!=='string'||raw.length>20000)return null;
   const g=JSON.parse(raw);
   if(!g||![1,2].includes(g.version)||!integer(g.lucky,7)||!integer(g.seed,0xffffffff)||!g.seed)return null;
   const legacy=g.version===1;
   if(!['bags','opened','pairs','luckyHits','clears','best'].every(k=>integer(g[k]))||!integer(g.revives,2))return null;
   if(!Array.isArray(g.board)||g.board.length!==9||!g.board.every(c=>c===null||integer(c,7)))return null;
   if(legacy){if(g.triples!==undefined)return null;g.triples=0;g.stage='deal';}
   if(!integer(g.triples)||!['deal','match'].includes(g.stage))return null;
   const present=g.board.filter(c=>c!==null);
   if(legacy&&new Set(present).size!==present.length||present.length!==g.opened-g.pairs*2-g.triples*3)return null;
   if(g.luckyHits>g.opened||g.clears>g.pairs+g.triples||g.best<g.pairs+g.triples)return null;
   if(g.bags!==9-g.opened+g.pairs+g.triples*3+g.luckyHits+g.clears*5+g.revives*5)return null;
   const stage=g.stage,status=g.status;settle(g);if(g.status!==status||!legacy&&g.stage!==stage)return null;
   if(!Array.isArray(g.collection)||g.collection.length!==8||!g.collection.every(n=>integer(n))||g.collection.reduce((a,b)=>a+b,0)<g.opened)return null;
   g.version=2;return g;
  }catch(_){return null;}
 }
 return {SAVE_KEY,COLORS,LINES,create,open,moves,selection,match,revive,save,restore};
});
