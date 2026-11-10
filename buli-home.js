(function(root){
 'use strict';
 const W=432,H=540,R=13,SPEED=102,STEP=1/120;
 const pt=(x,y)=>({x,y}),box=(x,y,w,h,kind='sofa')=>({x,y,w,h,kind});
 const robot=(ax,ay,bx,by,period=4)=>({type:'robot',a:pt(ax,ay),b:pt(bx,by),period,r:17});
 const spray=(x,y,w,h,period=4,on=1.3,offset=0)=>({type:'spray',x,y,w,h,period,on,offset});
 function level(name,hint,ink,gold,obstacles,fish,hazards=[]){return {name,hint,ink,gold,start:pt(60,465),home:pt(372,72),obstacles,fish:fish.map(([x,y])=>pt(x,y)),hazards};}
 const levels=[
  level('先带上晚餐','先经过①，再经过②。沿墙绕远路会漏掉鱼干。',760,650,[box(170,225,85,90)],[[140,390],[300,160]]),
  level('长沙发的两边','①在沙发右下，②在左上；绕过右端，再回头。',1110,990,[box(20,270,280,70)],[[365,385],[150,180]]),
  level('书架上方的缺口','先拿左边①，再从书架上方去拿②。',820,710,[box(190,110,70,320,'shelf')],[[120,230],[300,65]]),
  level('左右折返','右边①、左边②：在两排家具之间折返，别绕大圈。',1420,1320,[box(20,350,285,45,'shelf'),box(135,185,277,45)],[[370,300],[60,270]]),
  level('扫地机器人来了','去右边拿①要横穿巡逻线，等待半秒可能就不同。',1180,1060,[box(160,320,100,50),box(160,165,100,70)],[[300,285],[120,115]],[robot(75,300,357,300,4)]),
  level('唯一的窄门','两排柜子只留中间通道；看准机器人，再穿过去。',740,640,[box(13,300,170,50,'shelf'),box(255,300,164,50,'shelf')],[[219,390],[300,200]],[robot(145,270,290,270,3.5)]),
  level('三排家具','左→右→左的三次转弯，中间的水会间歇开启。',1310,1200,[box(135,365,277,40,'shelf'),box(20,230,190,40),box(205,105,207,40,'shelf')],[[60,285],[370,200]],[spray(230,275,60,35,4,1.3,1)]),
  level('鱼干在巡逻线上','①就在机器人轨道旁；先拿它，再向左穿过走廊。',1280,1160,[box(170,210,90,125),box(20,385,190,40,'shelf')],[[310,390],[120,175]],[robot(310,160,310,410,4)]),
  level('等水停再过门','喷水盖住唯一的门。相同路线，错峰出发才能过去。',720,640,[box(13,300,170,50),box(255,300,164,50,'shelf'),box(65,150,65,55,'plant')],[[219,390],[219,210]],[spray(185,315,68,35,4,2.2)]),
  level('双重巡逻','一台横走，一台竖走；到②之后也不能掉以轻心。',1450,1310,[box(135,350,277,40,'shelf'),box(20,190,70,40)],[[60,280],[370,160]],[robot(110,280,325,280,5),robot(300,70,300,250,4)]),
  level('潮汐折返','先等水停拿①，折返时还要避开机器人。',1500,1370,[box(20,350,285,45,'shelf'),box(135,185,277,45),box(20,75,60,40,'plant')],[[370,300],[60,270]],[robot(100,270,320,270,5),spray(320,290,80,35)]),
  level('最后一条小路','①藏在水边，②在巡逻线旁；省下线量，把晚餐带回家。',970,840,[box(190,100,70,330,'shelf'),box(20,320,60,45,'plant')],[[120,280],[300,65]],[robot(220,65,355,65,4),spray(90,240,80,55)])
 ];
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const inside=p=>finite(p)&&p.x>=R&&p.x<=W-R&&p.y>=R&&p.y<=H-R;
 // Slab intersection checks the whole input segment, including cat clearance.
 function segmentBox(a,b,o,r=R){let low=0,high=1;for(const [axis,min,max]of [['x',o.x-r,o.x+o.w+r],['y',o.y-r,o.y+o.h+r]]){const d=b[axis]-a[axis];if(Math.abs(d)<1e-10){if(a[axis]<min||a[axis]>max)return false;}else{let u=(min-a[axis])/d,v=(max-a[axis])/d;if(u>v)[u,v]=[v,u];low=Math.max(low,u);high=Math.min(high,v);if(low>high)return false;}}return true;}
 function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
 function clearSegment(g,a,b){return inside(b)&&!g.level.obstacles.some(o=>segmentBox(a,b,o));}
 function pathLength(g){let total=0;for(let i=1;i<g.path.length;i++)total+=dist(g.path[i-1],g.path[i]);return total;}
 // Earliest intersection with a fish circle, so sparse lines preserve pickup order.
 function contactAt(f,a,b){const dx=b.x-a.x,dy=b.y-a.y,ox=a.x-f.x,oy=a.y-f.y,c=ox*ox+oy*oy-23*23;if(c<=0)return 0;const aa=dx*dx+dy*dy;if(!aa)return Infinity;const bb=2*(ox*dx+oy*dy),disc=bb*bb-4*aa*c;if(disc<0)return Infinity;const t=(-bb-Math.sqrt(disc))/(2*aa);return t>=0&&t<=1?t:Infinity;}
 function plan(g){let fish=g.collected;for(let i=1;i<g.path.length;i++){let after=0;while(fish<g.level.fish.length){const t=contactAt(g.level.fish[fish],g.path[i-1],g.path[i]);if(t===Infinity||t<after)break;after=t;fish++;}}return {fish,length:pathLength(g)};}
 function create(index=0){index=Number.isInteger(index)?Math.max(0,Math.min(11,index)):0;const l=levels[index];return {index,level:l,cat:{...l.start},path:[],phase:'drawing',time:0,remainder:0,segment:1,wait:0,collected:0,picked:[],stars:0,reason:'',revivals:0,checkpoint:{cat:{...l.start},segment:1},revivePass:null,lethal:null};}
 function begin(g,p){if(g.phase!=='drawing'||!inside(p))return false;const tail=g.path.at(-1)||g.level.start;if(dist(p,tail)>32)return false;if(!g.path.length)g.path.push({...g.level.start});return true;}
 function append(g,p){if(g.phase!=='drawing'||!g.path.length||g.path.length>=2400||!inside(p))return false;const a=g.path.at(-1);if(dist(a,p)<.5)return true;if(!clearSegment(g,a,p)||pathLength(g)+dist(a,p)>g.level.ink+1e-8)return false;g.path.push({x:p.x,y:p.y});return true;}
 function undo(g){if(g.phase==='drawing')g.path.pop();}
 function clear(g){if(g.phase==='drawing')g.path=[];}
 function start(g,delay=0){if(g.phase!=='drawing'||g.path.length<2||dist(g.path.at(-1),g.level.home)>24||pathLength(g)>g.level.ink+1e-8)return false;g.phase='running';g.wait=g.time+(Number.isFinite(delay)?Math.max(0,Math.min(3,delay)):0);return true;}
 function pause(g){if(g.phase==='running')g.phase='paused';}
 function resume(g){if(g.phase==='paused')g.phase='running';}
 function hazardAt(h,t){if(h.type==='robot'){const f=(1-Math.cos(2*Math.PI*t/h.period))/2;return {x:h.a.x+(h.b.x-h.a.x)*f,y:h.a.y+(h.b.y-h.a.y)*f,r:h.r};}return {...h,active:((t+h.offset)%h.period+h.period)%h.period<h.on};}
 function collision(g,a,b,t0,t1){
  for(const o of g.level.obstacles){if(segmentBox(a,b,o)&&g.revivePass!==o){g.lethal=o;return 'furniture';}}
  for(const h of g.level.hazards){if(g.revivePass===h)continue;const u=hazardAt(h,t0),v=hazardAt(h,t1);
   if(h.type==='robot'){const ra=pt(a.x-u.x,a.y-u.y),rb=pt(b.x-v.x,b.y-v.y);if(segmentDistance(pt(0,0),ra,rb)<=R+h.r){g.lethal=h;return 'robot';}}
   else if((u.active||v.active)&&segmentBox(a,b,h)){g.lethal=h;return 'water';}}
  return '';
 }
 function clearPass(g,a,b){const h=g.revivePass;if(!h)return;
  let contact;if(h.type==='robot'){const p=hazardAt(h,g.time);contact=segmentDistance(p,a,b)<=R+h.r+2;}
  else contact=segmentBox(a,b,h,R+2);
  if(contact)g.passEntered=true;else if(g.passEntered){g.revivePass=null;g.passEntered=false;}
 }
 function revive(g){
  if(g.phase!=='lost')return false;
  if(g.reason==='fish'){g.cat={...g.level.start};g.path=[];g.segment=1;g.remainder=0;g.checkpoint={cat:{...g.cat},segment:1};g.revivePass=null;g.lethal=null;g.reason='';g.revivals++;g.phase='drawing';return true;}
  if(!g.lethal)return false;
  const c=g.checkpoint||{cat:g.level.start,segment:1};g.cat={...c.cat};g.segment=c.segment;
  g.revivePass=g.lethal;g.passEntered=false;g.lethal=null;g.reason='';g.remainder=0;g.revivals++;g.phase='running';return true;
 }
 function tick(g){const t0=g.time;g.time+=STEP;let remaining=g.time<=g.wait?0:SPEED*Math.min(STEP,g.time-g.wait);let a={...g.cat};
  // Check stationary waiting too: choosing to wait is not invulnerability.
  if(!remaining){const reason=collision(g,a,a,t0,g.time);if(reason){g.phase='lost';g.reason=reason;}return;}
  while(remaining>1e-9&&g.segment<g.path.length){const target=g.path[g.segment],d=dist(a,target),travel=Math.min(d,remaining),b=d?pt(a.x+(target.x-a.x)*travel/d,a.y+(target.y-a.y)*travel/d):{...target};const reason=collision(g,a,b,t0,g.time);if(reason){g.phase='lost';g.reason=reason;return;}
   let after=0;while(g.collected<g.level.fish.length){const i=g.collected,t=contactAt(g.level.fish[i],a,b);if(t===Infinity||t<after)break;g.picked.push(i);g.collected++;after=t;}clearPass(g,a,b);g.cat=b;a=b;remaining-=travel;if(d<=travel+1e-8)g.segment++;else break;
  }
  g.checkpoint={cat:{...g.cat},segment:g.segment};
  if(g.segment>=g.path.length){if(g.collected<g.level.fish.length){g.phase='lost';g.reason='fish';return;}g.phase='won';const length=pathLength(g);g.stars=g.revivals?1:length<=g.level.gold?3:length<=g.level.gold+(g.level.ink-g.level.gold)/2?2:1;}
 }
 function advance(g,dt){if(g.phase!=='running'||!Number.isFinite(dt)||dt<=0)return;g.remainder+=Math.min(dt,30);while(g.remainder+1e-10>=STEP&&g.phase==='running'){g.remainder-=STEP;tick(g);}}
 function normalizeSave(value){const best=Array.from({length:12},(_,i)=>{const v=value&&Array.isArray(value.best)?value.best[i]:0;return Number.isInteger(v)&&v>=0&&v<=3?v:0;});let unlocked=1;while(unlocked<12&&best[unlocked-1]>0)unlocked++;return {best,unlocked};}
 function record(value,index,stars){const s=normalizeSave(value);if(Number.isInteger(index)&&index>=0&&index<s.unlocked&&Number.isInteger(stars)&&stars>=1&&stars<=3)s.best[index]=Math.max(s.best[index],stars);return normalizeSave(s);}
 const api={revive,pathLength,plan,W,H,R,SPEED,levels,create,begin,append,undo,clear,start,pause,resume,advance,hazardAt,normalizeSave,record};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BuliHome=api;
})(typeof window==='undefined'?globalThis:window);
