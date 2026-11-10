(function(root){
 function random(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
 function difficulty(time){return {interval:Math.max(.55,1.5-time*.011),count:Math.min(5,1+Math.floor(time/12)),bombChance:time<12?0:Math.min(.55,.12+(time-12)*.005),speed:Math.min(110,time*.9)};}
 function create(seed){return {seed:(seed===undefined?Math.random()*0xffffffff:seed)>>>0||1,elapsed:0,nextWave:.6,nextId:1,items:[],score:0,misses:0,combo:0,lastCut:-1,status:'playing',reason:''};}
 function spawn(g){const d=difficulty(g.elapsed),count=1+Math.floor(random(g)*d.count);for(let i=0;i<count;i++)g.items.push({id:g.nextId++,x:65+random(g)*302,y:580,r:28,vx:(random(g)-.5)*145,vy:-680-random(g)*80-d.speed,angle:random(g)*6.28,spin:(random(g)-.5)*3,kind:Math.floor(random(g)*5),bomb:false});if(random(g)<d.bombChance)g.items.push({id:g.nextId++,x:65+random(g)*302,y:580,r:27,vx:(random(g)-.5)*120,vy:-690-random(g)*60-d.speed,angle:0,spin:0,kind:0,bomb:true});g.nextWave=d.interval;}
 function step(g,dt){if(g.status!=='playing')return;g.elapsed+=dt;g.nextWave-=dt;if(g.nextWave<=0)spawn(g);for(const o of g.items){o.x+=o.vx*dt;o.y+=o.vy*dt+450*dt*dt;o.vy+=900*dt;o.angle+=o.spin*dt;if(o.x<o.r){o.x=o.r;o.vx=Math.abs(o.vx);}if(o.x>432-o.r){o.x=432-o.r;o.vx=-Math.abs(o.vx);}if(o.y>600&&o.vy>0&&!o.bomb)g.misses++;}g.items=g.items.filter(o=>o.y<=600||o.vy<0);if(g.misses>=5){g.status='lost';g.reason='miss';}}
 function crossed(o,a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(length<4)return false;const t=Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.y-a.y)*dy)/length));return Math.hypot(o.x-a.x-t*dx,o.y-a.y-t*dy)<=o.r+5;}
 function slice(g,a,b){if(g.status!=='playing')return [];const hits=g.items.filter(o=>crossed(o,a,b));if(hits.some(o=>o.bomb)){g.status='lost';g.reason='bomb';return hits.filter(o=>o.bomb);}for(const o of hits){g.combo=g.elapsed-g.lastCut<=.35?g.combo+1:1;g.lastCut=g.elapsed;g.score+=10+(g.combo>=3?5:0);}g.items=g.items.filter(o=>!hits.includes(o));return hits;}
 function revive(g){
  if(g.status!=='lost')return false;
  g.misses=0;g.items=[];g.nextWave=.6;g.reason='';g.combo=0;g.lastCut=-1;g.status='playing';return true;
 }
const api={revive,create,difficulty,step,slice};if(typeof module!=='undefined')module.exports=api;else root.JiajiaSlice=api;
})(typeof window==='undefined'?globalThis:window);
