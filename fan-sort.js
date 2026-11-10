(function(root){
 const LANES=[190,295],BINS=[{x:78,y:435,w:114,h:112},{x:216,y:435,w:114,h:112},{x:354,y:435,w:114,h:112}];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function create(random=Math.random){return {random,id:0,elapsed:0,travel:0,score:0,combo:0,sorted:0,mistakes:0,status:'playing',items:[],held:null,spawnIn:.45,events:[]};}
 function difficulty(t){return {speed:Math.min(150,34+t*1.1),interval:Math.max(.6,2.4-t*.028),lanes:t>=25?2:1};}
 function grab(g,id){if(g.status!=='playing'||g.held)return false;const o=g.items.find(o=>o.id===id);if(!o||o.x<0||o.x>432)return false;g.held={id,x:o.x,y:o.y};return true;}
 function drag(g,x,y){if(g.held&&g.status==='playing'){g.held.x=clamp(x,28,404);g.held.y=clamp(y,28,512);}}
 function cancel(g){g.held=null;}
 function mistake(g){g.mistakes++;g.combo=0;if(g.mistakes>=5){g.status='lost';g.held=null;}}
 function drop(g){if(!g.held||g.status!=='playing')return null;const held=g.held,o=g.items.find(o=>o.id===held.id);g.held=null;if(!o)return null;const bin=BINS.findIndex(b=>Math.abs(b.x-held.x)<=b.w/2&&Math.abs(b.y-held.y)<=b.h/2);if(bin<0)return {kind:'returned',id:o.id,x:held.x,y:held.y,toX:o.x,toY:o.y,item:o.kind};g.items=g.items.filter(item=>item!==o);if(bin!==o.kind){mistake(g);return {kind:'wrong',x:held.x,y:held.y,bin,item:o.kind};}g.sorted++;g.combo++;const points=10+(g.combo%5===0?Math.min(25,g.combo):0);g.score+=points;return {kind:'sorted',x:held.x,y:held.y,bin,item:o.kind,points,combo:g.combo};}
 function step(g,dt){g.events=[];if(g.status!=='playing')return;let left=dt;while(left>1e-8&&g.status==='playing'){const delta=Math.min(.02,left),before=g.elapsed;g.elapsed+=delta;const d=difficulty(g.elapsed);g.travel+=d.speed*delta;if(before<25&&g.elapsed>=25)g.events.push({kind:'lanes',text:'第二条传送带开启！'});g.spawnIn-=delta;if(g.spawnIn<=0){for(let lane=0;lane<d.lanes;lane++)g.items.push({id:++g.id,kind:Math.floor(g.random()*3),x:lane?404:28,y:LANES[lane],lane});g.spawnIn+=d.interval;}for(const o of [...g.items]){o.x+=(o.lane?-1:1)*d.speed*delta;if(o.x>464||o.x<-32){g.items=g.items.filter(item=>item!==o);if(g.held?.id===o.id)g.held=null;mistake(g);g.events.push({kind:'miss',x:o.lane?28:404,y:o.y,text:'漏掉了一个'});if(g.status==='lost')break;}}left-=delta;}}
 function revive(g){if(g.status!=='lost')return false;g.status='playing';g.mistakes=0;g.held=null;g.items=[];g.events=[];g.spawnIn=.55;return true;}
 const api={LANES,BINS,create,difficulty,grab,drag,cancel,drop,step,revive};if(typeof module!=='undefined')module.exports=api;else root.FanSort=api;
})(typeof globalThis!=='undefined'?globalThis:this);
