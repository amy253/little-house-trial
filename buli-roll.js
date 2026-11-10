(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliRoll=factory();})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const W=432,H=540,R=14,STEP=1/120,SPEED=130;
 const rect=(x,y,w,h)=>({x,y,w,h});
 const points=list=>list.map(([x,y])=>({x,y}));
 function level(name,hint,walls,fish,holes){return {name,hint,start:{x:62,y:478},goal:{x:370,y:62},walls:walls.map(v=>rect(...v)),fish:points(fish),holes:holes.map(([x,y,r=18])=>({x,y,r}))};}
 // Hand-authored rooms. Openings exceed the full ball diameter; holes never move.
 const levels=[
 level('窗边第一滚','先绕过长木墙，再把鱼干带回窝。',[[112,156,16,274]],[[62,278],[280,62]],[[30,240],[325,350]]),
 level('两道小门','先向右，再从左边绕过第二道墙。',[[16,360,300,16],[116,180,300,16]],[[370,280],[62,100]],[[400,460],[30,270]]),
 level('沿着墙脚','从木墙底下穿过，留意右边的小洞。',[[120,96,16,360],[280,16,16,360]],[[216,478],[370,250]],[[170,200],[400,410],[30,110]]),
 level('三层回廊','一左一右，像走楼梯一样慢慢绕。',[[16,400,280,16],[136,280,280,16],[16,160,280,16]],[[62,340],[370,220]],[[400,475],[30,335],[330,110]]),
 level('长长的曲线','转弯前轻轻刹车，路就会好走一些。',[[96,16,16,370],[216,160,16,364],[336,16,16,370]],[[156,110],[276,478]],[[185,270],[250,450],[400,250]]),
 level('木匣之间','这次有几个小转角，先想好方向。',[[140,430,200,16],[264,220,16,166],[148,150,16,100],[16,340,100,16]],[[200,400],[100,220]],[[30,420],[230,255],[340,170]]),
 level('向上的旅程','从左边出发，在回廊之间来回穿行。',[[100,430,316,16],[16,310,280,16],[136,190,280,16]],[[370,370],[62,140]],[[400,360],[30,230],[265,100]]),
 level('绕个大弯','第一道墙要从上面绕，第二道从下面绕。',[[108,108,16,416],[248,16,16,352]],[[180,240],[370,420]],[[30,330],[210,300],[400,190]]),
 level('鱼干回廊','把速度收小一点，穿过三道宽门。',[[16,380,316,16],[116,250,300,16],[16,120,316,16]],[[62,320],[370,180]],[[400,460],[30,310],[400,170],[210,35]]),
 level('小木桌迷宫','绕过四张木桌，从中间走到窗边。',[[100,400,100,16],[270,300,146,16],[100,220,16,120],[250,96,16,170]],[[62,300],[220,100]],[[30,350],[240,450],[170,165],[400,250]]),
 level('蜿蜒木墙','最后一面墙的门在上方，别急着向右。',[[96,96,16,350],[208,16,16,370],[320,160,16,364]],[[152,478],[264,240]],[[30,420],[180,440],[290,225],[400,120]]),
 level('带着鱼干回家','四道回廊，一步步回到温暖的小窝。',[[16,420,316,16],[116,310,300,16],[16,200,316,16],[116,90,300,16]],[[62,365],[370,255]],[[400,475],[30,355],[400,245],[30,135],[280,35]])
 ];
 function create(index=0){index=Number.isInteger(index)&&index>=0&&index<levels.length?index:0;const l=levels[index];return {index,level:l,phase:'ready',ball:{...l.start,vx:0,vy:0,angle:0},input:{x:0,y:0,brake:false},picked:[],stars:0,accumulator:0,checkpoint:{...l.start}};}
 function clearInput(g){g.input={x:0,y:0,brake:false};}
 function setInput(g,x,y,brake=false){if(g.phase!=='running'){clearInput(g);return;}x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const d=Math.hypot(x,y);g.input={x:d>1?x/d:x,y:d>1?y/d:y,brake:!!brake};}
 function start(g){if(g.phase!=='ready')return false;g.phase='running';g.accumulator=0;clearInput(g);return true;}
 function pause(g){clearInput(g);g.accumulator=0;if(g.phase==='running')g.phase='paused';}
 function resume(g){if(g.phase!=='paused')return false;clearInput(g);g.accumulator=0;g.phase='running';return true;}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function resolve(b,o){const px=clamp(b.x,o.x,o.x+o.w),py=clamp(b.y,o.y,o.y+o.h);let dx=b.x-px,dy=b.y-py,d=Math.hypot(dx,dy);if(d>=R)return;
  if(d<1e-10){const choices=[{d:b.x-o.x,nx:-1,ny:0},{d:o.x+o.w-b.x,nx:1,ny:0},{d:b.y-o.y,nx:0,ny:-1},{d:o.y+o.h-b.y,nx:0,ny:1}].sort((a,z)=>a.d-z.d),n=choices[0];dx=n.nx;dy=n.ny;b.x+=dx*(R+n.d);b.y+=dy*(R+n.d);d=1;}else{dx/=d;dy/=d;b.x+=dx*(R-d);b.y+=dy*(R-d);}
  const into=b.vx*dx+b.vy*dy;if(into<0){b.vx-=into*dx;b.vy-=into*dy;}
 }
 function step(g){const b=g.ball,i=g.input;const damping=Math.exp(-(i.brake?28:i.x===0&&i.y===0?6:3.1)*STEP),force=i.brake?0:400;b.vx=(b.vx+i.x*force*STEP)*damping;b.vy=(b.vy+i.y*force*STEP)*damping;const speed=Math.hypot(b.vx,b.vy);if(speed>SPEED){b.vx*=SPEED/speed;b.vy*=SPEED/speed;}else if(speed<1&&(i.brake||i.x===0&&i.y===0)){b.vx=0;b.vy=0;}
  // Each displacement is at most 1.09 px: thin walls, corners and holes cannot be skipped.
  const oldX=b.x,oldY=b.y;b.x+=b.vx*STEP;b.y+=b.vy*STEP;
  for(let n=0;n<3;n++)for(const o of g.level.walls)resolve(b,o);
  if(b.x<16+R){b.x=16+R;b.vx=Math.max(0,b.vx);}if(b.x>W-16-R){b.x=W-16-R;b.vx=Math.min(0,b.vx);}if(b.y<16+R){b.y=16+R;b.vy=Math.max(0,b.vy);}if(b.y>H-16-R){b.y=H-16-R;b.vy=Math.min(0,b.vy);}
  b.angle+=(b.x-oldX+(b.y-oldY)*.7)/R;
  for(const hole of g.level.holes){if(Math.hypot(b.x-hole.x,b.y-hole.y)<hole.r){g.phase='lost';clearInput(g);return;}}
  if(g.level.holes.every(h=>Math.hypot(b.x-h.x,b.y-h.y)>=h.r+R+6))g.checkpoint={x:b.x,y:b.y};
  g.level.fish.forEach((f,j)=>{if(!g.picked.includes(j)&&Math.hypot(b.x-f.x,b.y-f.y)<R+10)g.picked.push(j);});
  if(Math.hypot(b.x-g.level.goal.x,b.y-g.level.goal.y)<20){g.phase='won';g.stars=1+g.picked.length;clearInput(g);}
 }
 function advance(g,dt){if(g.phase!=='running'||!Number.isFinite(dt)||dt<=0)return;g.accumulator+=Math.min(dt,.5);let n=0;while(g.accumulator+1e-10>=STEP&&g.phase==='running'&&n++<61){g.accumulator-=STEP;step(g);}if(g.phase!=='running')g.accumulator=0;}
 function revive(g){
  if(g.phase!=='lost')return false;
  const p=g.checkpoint||g.level.start;g.ball.x=p.x;g.ball.y=p.y;g.ball.vx=0;g.ball.vy=0;
  clearInput(g);g.accumulator=0;g.phase='running';return true;
 }
 function normalizeSave(raw){const best=Array(12).fill(0);if(raw&&Array.isArray(raw.best))for(let i=0;i<12;i++){const n=raw.best[i];best[i]=Number.isInteger(n)&&n>=1&&n<=3?n:0;}let unlocked=1;while(unlocked<12&&best[unlocked-1]>0)unlocked++;for(let i=unlocked;i<12;i++)best[i]=0;return {unlocked,best};}
 function record(raw,index,stars){const s=normalizeSave(raw);if(!Number.isInteger(index)||index<0||index>=s.unlocked||!Number.isInteger(stars)||stars<1||stars>3)return s;s.best[index]=Math.max(s.best[index],stars);return normalizeSave(s);}
 return {revive,W,H,R,STEP,SPEED,levels,create,start,pause,resume,setInput,clearInput,advance,normalizeSave,record};
});
