(function(root){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function create(random=Math.random){return {random,player:{x:216,y:450,r:14},hp:3,score:0,kills:0,elapsed:0,status:'playing',invincible:0,shield:false,triple:0,spawnIn:1.5,fireIn:0,id:0,enemies:[],bullets:[],hazards:[],pickups:[],events:[]};}
 function difficulty(t){return {interval:Math.max(.48,1.7-t*.023),speed:Math.min(260,55+t*2.5),count:Math.min(4,1+Math.floor(t/18)),shoot:t>=26};}
 function move(g,x,y){if(g.status==='playing'){g.player.x=clamp(x,28,404);g.player.y=clamp(y,80,502);}}
 function damage(g){if(g.status!=='playing'||g.invincible>0)return;if(g.shield){g.shield=false;g.events.push({kind:'shield',x:g.player.x,y:g.player.y,text:'保护罩挡住啦'});}else{g.hp--;g.events.push({kind:'hurt',x:g.player.x,y:g.player.y,text:'小心躲避！'});}g.invincible=1.4;if(g.hp<=0)g.status='lost';}
 function collect(g,kind){if(kind==='shield')g.shield=true;else if(kind==='triple')g.triple=8;else if(kind==='heart')g.hp=Math.min(3,g.hp+1);g.events.push({kind:'pickup',x:g.player.x,y:g.player.y,text:kind==='shield'?'保护罩 · 挡一次':kind==='triple'?'三连光 · 8 秒':'爱心 ＋1'});}
 function segmentHit(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return (ax+dx*t-x)**2+(ay+dy*t-y)**2<=r*r;}
 function spawn(g){const d=difficulty(g.elapsed);for(let i=0;i<d.count;i++){const tank=g.elapsed>=25&&g.random()<.23;g.enemies.push({id:++g.id,x:30+g.random()*372,y:-32-i*46,r:tank?25:19,hp:tank?3:1,tank,vx:g.elapsed<8?0:(g.random()-.5)*Math.min(130,g.elapsed*2.2),vy:d.speed*(.85+g.random()*.3),fireIn:d.shoot?.8+g.random()*1.8:99});}g.spawnIn+=d.interval;}
 function tick(g,dt){
  g.elapsed+=dt;g.invincible=Math.max(0,g.invincible-dt);g.triple=Math.max(0,g.triple-dt);
  g.spawnIn-=dt;if(g.spawnIn<=0)spawn(g);
  g.fireIn-=dt;if(g.fireIn<=0){for(const vx of g.triple>0?[-160,0,160]:[0])g.bullets.push({x:g.player.x,y:g.player.y-29,r:3,vx,vy:-610});g.fireIn+=.22;}
  for(const e of g.enemies){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.x<e.r||e.x>432-e.r){e.x=clamp(e.x,e.r,432-e.r);e.vx=-e.vx;}e.fireIn-=dt;if(e.fireIn<=0&&e.y>20&&e.y<350){const dx=g.player.x-e.x,dy=g.player.y-e.y,len=Math.hypot(dx,dy)||1,speed=Math.min(200,110+g.elapsed*.7);g.hazards.push({x:e.x,y:e.y,r:7,vx:dx/len*speed,vy:dy/len*speed});e.fireIn=2.8+g.random()*1.8;}}
  for(const b of g.bullets){const x=b.x,y=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;for(const e of g.enemies){if(e.hp>0&&segmentHit(x,y,b.x,b.y,e.x,e.y,e.r+b.r)){e.hp--;b.dead=true;g.events.push({kind:'hit',x:e.x,y:e.y});if(!e.hp){g.kills++;const points=e.tank?30:10;g.score+=points;g.events.push({kind:'burst',x:e.x,y:e.y,text:'＋'+points});if(g.kills%8===0)g.pickups.push({x:e.x,y:e.y,r:14,kind:['shield','triple','heart'][Math.floor(g.random()*3)],vy:85});}break;}}}
  g.bullets=g.bullets.filter(b=>!b.dead&&b.y>-20&&b.x>-20&&b.x<452);
  g.enemies=g.enemies.filter(e=>{if(e.hp<=0||e.y>585)return false;if(Math.hypot(e.x-g.player.x,e.y-g.player.y)<e.r+g.player.r){damage(g);return false;}return true;});
  g.hazards=g.hazards.filter(b=>{const x=b.x,y=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;if(segmentHit(x,y,b.x,b.y,g.player.x,g.player.y,g.player.r+b.r)){damage(g);return false;}return b.y<570&&b.y>-40&&b.x>-30&&b.x<462;});
  g.pickups=g.pickups.filter(p=>{p.y+=p.vy*dt;if(Math.hypot(p.x-g.player.x,p.y-g.player.y)<p.r+g.player.r+7){collect(g,p.kind);return false;}return p.y<570;});
 }
 function step(g,dt){g.events=[];if(g.status!=='playing')return;let left=dt;while(left>1e-8&&g.status==='playing'){const slice=Math.min(.02,left);tick(g,slice);left-=slice;}}
 function revive(g){if(g.status!=='lost')return false;g.status='playing';g.hp=3;g.invincible=2;g.enemies=g.enemies.filter(e=>Math.hypot(e.x-g.player.x,e.y-g.player.y)>e.r+g.player.r+80);g.hazards=[];g.events=[];return true;}
 const api={create,difficulty,move,damage,collect,step,revive};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.JiajiaGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this);
