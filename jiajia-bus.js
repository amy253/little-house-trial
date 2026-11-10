(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BusCatch=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const SAVE_KEY='little-house-bus-save-v1',MIN_INTERVAL=.13;
 function levelOf(n){return Number.isInteger(n)?Math.max(1,Math.min(100000,n)):1;}
 function difficulty(level){const n=Math.min(9,levelOf(level)-1);return {time:10-n*.22,distance:5.8+n*.08};}
 function create(level=1){level=levelOf(level);const d=difficulty(level);return {level,status:'ready',paused:false,remaining:d.time,distance:d.distance,elapsed:0,steps:0,lastFoot:null,lastTap:-1,stumble:0,boarding:0,revives:0,reason:null};}
 function start(g){if(g.status!=='ready')return false;g.status='playing';return true;}
 function foot(g,side){
  if(g.status!=='playing'||g.paused||g.stumble>0||!['left','right'].includes(side))return {kind:'ignored'};
  if(g.lastTap>=0&&g.elapsed-g.lastTap<MIN_INTERVAL-1e-8)return {kind:'rushed'};
  g.lastTap=g.elapsed;
  if(g.lastFoot===side){g.stumble=.65;g.distance=Math.min(difficulty(g.level).distance+.6,g.distance+.28);return {kind:'stumble'};}
  const rhythm=g.lastFoot!==null&&g.elapsed-g.lastStep<=.55;
  g.lastFoot=side;g.lastStep=g.elapsed;g.steps++;g.distance=Math.max(0,g.distance-(rhythm?.46:.42));
  if(g.distance===0){g.status='boarding';g.boarding=.7;}
  return {kind:'step',side,rhythm};
 }
 function tick(g,dt){
  if(g.paused||!Number.isFinite(dt)||dt<=0)return;
  if(g.status==='boarding'){g.boarding=Math.max(0,g.boarding-dt);if(g.boarding<=1e-8)g.status='won';return;}
  if(g.status!=='playing')return;
  const delta=Math.min(dt,g.remaining);g.elapsed+=delta;g.remaining=Math.max(0,g.remaining-delta);g.stumble=Math.max(0,g.stumble-delta);
  if(g.remaining<=1e-8){g.remaining=0;g.status='lost';g.reason='timeout';}
 }
 function revive(g){
  if(g.status!=='lost'||g.revives>=2)return false;
  g.revives++;g.status='playing';g.paused=false;g.reason=null;g.stumble=0;g.lastFoot=null;g.lastTap=-1;g.remaining=Math.max(4,difficulty(g.level).time*.6);return true;
 }
 function readSave(raw){
  try{const d=typeof raw==='string'?JSON.parse(raw):raw;if(d?.version===1&&Number.isInteger(d.completed)&&d.completed>=0&&d.completed<=100000)return {version:1,completed:d.completed};}catch(_){}
  return {version:1,completed:0};
 }
 function record(save,g){const current=readSave(save);return g.status==='won'?{version:1,completed:Math.max(current.completed,g.level)}:current;}
 return {SAVE_KEY,MIN_INTERVAL,create,difficulty,start,foot,tick,revive,readSave,record};
});
