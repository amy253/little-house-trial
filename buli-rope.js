(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliRope=factory();})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const WIDTH=432,HEIGHT=600,DT=1/120,SAVE_KEY='buli-rope-save';
  const levels=[
    {title:'第一口小鱼',hint:'划过上方的绳子，让小鱼落到卟哩面前。',fish:{x:216,y:200},anchors:[{x:216,y:70}],mouth:{x:216,y:482},stars:[{x:216,y:270},{x:216,y:345},{x:216,y:410}]},
    {title:'左边的摇摇篮',hint:'让小鱼向左摆；经过中间那颗星时割绳。',fish:{x:240,y:220},anchors:[{x:130,y:80}],mouth:{x:130,y:482},stars:[{x:200,y:246},{x:156,y:310},{x:132,y:405}]},
    {title:'右边也来一口',hint:'小鱼向右荡过来时，把绳子剪断。',fish:{x:192,y:220},anchors:[{x:300,y:80}],mouth:{x:300,y:482},stars:[{x:230,y:246},{x:275,y:310},{x:300,y:405}]},
    {title:'两根绳的秘密',hint:'先剪左绳，向右摆一小段，再剪右绳。',fish:{x:216,y:220},anchors:[{x:132,y:70},{x:300,y:70}],mouth:{x:315,y:482},stars:[{x:230,y:248},{x:264,y:320},{x:285,y:400}]},
    {title:'乘气泡去摘星',hint:'剪绳，等气泡升到第二颗星附近，点气泡让它落下。',fish:{x:216,y:350},anchors:[{x:216,y:70}],mouth:{x:216,y:482},bubble:true,stars:[{x:216,y:300},{x:216,y:230},{x:216,y:410}]},
    {title:'风送来的一口',hint:'剪绳后，薄荷色的风会把小鱼吹向右边。',fish:{x:120,y:200},anchors:[{x:120,y:70}],mouth:{x:205,y:482},fan:{x:50,y:210,w:280,h:180,force:250},stars:[{x:125,y:258},{x:156,y:340},{x:193,y:420}]},
    {title:'换一阵风',hint:'这一次，风从右边吹来。剪绳，接住小鱼。',fish:{x:312,y:200},anchors:[{x:312,y:70}],mouth:{x:227,y:482},fan:{x:102,y:210,w:280,h:180,force:-250},stars:[{x:307,y:258},{x:276,y:340},{x:239,y:420}]},
    {title:'绕过刺刺木板',hint:'先剪右绳，让鱼向左摆，再剪左绳绕过刺板。',fish:{x:175,y:200},anchors:[{x:100,y:70},{x:250,y:70}],mouth:{x:80,y:482},hazards:[{x:155,y:300,w:150,h:24}],stars:[{x:161,y:220},{x:120,y:310},{x:100,y:410}]},
    {title:'气泡遇上微风',hint:'剪绳后乘气泡向右上方漂，到上方星星附近点破。',fish:{x:100,y:360},anchors:[{x:100,y:70}],mouth:{x:300,y:482},bubble:true,fan:{x:30,y:180,w:350,h:180,force:80},stars:[{x:115,y:322},{x:150,y:250},{x:265,y:380}]},
    {title:'一起放手',hint:'一次划过两根绳子，再借风把小鱼送到卟哩面前。',fish:{x:200,y:220},anchors:[{x:100,y:70},{x:300,y:70}],mouth:{x:255,y:482},fan:{x:40,y:225,w:340,h:160,force:160},stars:[{x:206,y:275},{x:225,y:340},{x:250,y:418}]},
    {title:'从刺板上方飞过',hint:'剪绳让气泡升高，借左风绕过木板，再点破气泡。',fish:{x:310,y:360},anchors:[{x:310,y:70}],mouth:{x:111,y:482},bubble:true,fan:{x:20,y:170,w:380,h:210,force:-80},hazards:[{x:270,y:410,w:115,h:24}],stars:[{x:286,y:315},{x:270,y:250},{x:165,y:350}]},
    {title:'最后的鱼鱼快递',hint:'剪断三根绳，让气泡随风升到星星处，再点破。',fish:{x:216,y:350},anchors:[{x:120,y:70},{x:216,y:60},{x:312,y:70}],mouth:{x:334,y:482},bubble:true,fan:{x:20,y:160,w:380,h:240,force:60},hazards:[{x:75,y:410,w:110,h:24}],stars:[{x:230,y:310},{x:247,y:265},{x:318,y:380}]}
  ];
  // Light paper fish in the four timing lessons: wider observable swing windows.
  for(const index of [1,2,3,7])levels[index].gravity=180;
  function normalizeSave(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    const best=Array.from({length:12},(_,i)=>Number.isInteger(raw.best?.[i])&&raw.best[i]>=0&&raw.best[i]<=3?raw.best[i]:0);
    const cleared=Array.from({length:12},(_,i)=>raw.cleared?.[i]===true||best[i]>0);
    let unlocked=1; while(unlocked<12&&cleared[unlocked-1])unlocked++;
    return {version:1,best,cleared,unlocked,sound:raw.sound!==false};
  }
  function create(index,raw){
    const save=normalizeSave(raw); index=Number.isInteger(index)?index:0;
    if(index<0||index>=levels.length)throw new RangeError('unknown level');
    if(index>=save.unlocked)throw new RangeError('level locked');
    const level=levels[index], fish={...level.fish,vx:level.fish.vx||0,vy:level.fish.vy||0,r:12};
    return {index,level,save,fish,ropes:level.anchors.map((a,id)=>({...a,id,length:Math.hypot(a.x-fish.x,a.y-fish.y),cut:false})),stars:level.stars.map(s=>({...s,taken:false})),status:'playing',paused:false,collected:0,elapsed:0,accumulator:0,gesture:null,events:[],bubble:!!level.bubble,fanOn:true};
  }
  function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
  function intersects(a,b,c,d){
    const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
    if(ab1*ab2<0&&cd1*cd2<0)return true;
    return Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))<=8;
  }
  function pointValid(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y);}
  function hits(g,a,b){return g.ropes.filter(r=>!r.cut&&intersects(a,b,r,g.fish)).map(r=>r.id);}
  function cut(g,ids){ids.forEach(id=>{const r=g.ropes[id];if(r&&!r.cut){r.cut=true;g.events.push({type:'cut',x:(r.x+g.fish.x)/2,y:(r.y+g.fish.y)/2});}});}
  function tap(g,p){if(g.bubble&&Math.hypot(p.x-g.fish.x,p.y-g.fish.y)<=34){g.bubble=false;g.events.push({type:'pop',x:g.fish.x,y:g.fish.y});return;}cut(g,hits(g,p,p));}
  function action(g,a){
    if(a.type==='pause'){g.paused=!!a.value;g.gesture=null;return;}
    if(a.type==='cancel'){if(!g.gesture||a.id==null||g.gesture.id===a.id)g.gesture=null;return;}
    if(g.status!=='playing'||g.paused)return;
    if(a.type==='tap'&&pointValid(a))tap(g,a);
    if(a.type==='swipe'&&Array.isArray(a.points)){const points=a.points.filter(pointValid);for(let i=1;i<points.length;i++)cut(g,hits(g,points[i-1],points[i]));}
    if(a.type==='down'&&pointValid(a)&&!g.gesture)g.gesture={id:a.id,start:{x:a.x,y:a.y},last:{x:a.x,y:a.y},ids:new Set(),travel:0};
    if((a.type==='move'||a.type==='up')&&pointValid(a)&&g.gesture?.id===a.id){
      const gesture=g.gesture,p={x:a.x,y:a.y}; hits(g,gesture.last,p).forEach(id=>gesture.ids.add(id));gesture.travel+=Math.hypot(p.x-gesture.last.x,p.y-gesture.last.y);gesture.last=p;
      if(a.type==='up'){if(gesture.travel<8)tap(g,p);else cut(g,gesture.ids);g.gesture=null;}
    }
    if(a.type==='fan')g.fanOn=!g.fanOn;
  }
  function finish(g,status,reason){
    if(g.status!=='playing')return;
    g.status=status;g.gesture=null;g.events.push({type:status,reason});
    if(status==='won'){g.save.cleared[g.index]=true;g.save.best[g.index]=Math.max(g.save.best[g.index],g.collected);g.save=normalizeSave(g.save);}
  }
  function integrate(g){
    const f=g.fish;const before={x:f.x,y:f.y};g.elapsed+=DT;
    let ax=0,ay=g.bubble?-200:(g.level.gravity||580);
    const fan=g.level.fan;
    if(fan&&g.fanOn&&f.x>=fan.x&&f.x<=fan.x+fan.w&&f.y>=fan.y&&f.y<=fan.y+fan.h)ax=fan.force;
    const damping=g.bubble?.992:.9994;
    f.vx=(f.vx+ax*DT)*damping;f.vy=(f.vy+ay*DT)*damping;f.x+=f.vx*DT;f.y+=f.vy*DT;
    for(let pass=0;pass<8;pass++)for(const r of g.ropes){
      if(r.cut)continue;
      const dx=f.x-r.x,dy=f.y-r.y,length=Math.hypot(dx,dy);
      if(length>r.length){const nx=dx/length,ny=dy/length;f.x=r.x+nx*r.length;f.y=r.y+ny*r.length;const out=f.vx*nx+f.vy*ny;if(out>0){f.vx-=out*nx;f.vy-=out*ny;}}
    }
    for(const star of g.stars)if(!star.taken&&distance(star,before,f)<25){star.taken=true;g.collected++;g.events.push({type:'star',x:star.x,y:star.y});}
    for(const h of g.level.hazards||[]){const nearest={x:Math.max(h.x,Math.min(f.x,h.x+h.w)),y:Math.max(h.y,Math.min(f.y,h.y+h.h))};if(Math.hypot(f.x-nearest.x,f.y-nearest.y)<f.r){finish(g,'lost','spikes');return;}}
    if(!g.bubble&&distance(g.level.mouth,before,f)<=26){finish(g,'won','mouth');return;}
    if(f.y>HEIGHT+35||f.y<-60||f.x<-50||f.x>WIDTH+50||g.elapsed>25)finish(g,'lost',g.elapsed>25?'timeout':'outside');
  }
  function step(g,seconds){
    if(g.status!=='playing'||g.paused||!Number.isFinite(seconds)||seconds<=0)return;
    g.accumulator+=Math.min(seconds,.25);
    while(g.accumulator+1e-10>=DT&&g.status==='playing'){g.accumulator-=DT;integrate(g);}
  }
  function getSave(g){return normalizeSave(g.save);}
  function revive(g){if(g.status!=='lost')return false;const f=g.level.fish;g.fish={...f,vx:f.vx||0,vy:f.vy||0,r:12};g.ropes=g.level.anchors.map((a,id)=>({...a,id,length:Math.hypot(a.x-g.fish.x,a.y-g.fish.y),cut:false}));g.bubble=!!g.level.bubble;g.fanOn=true;g.status='playing';g.paused=false;g.elapsed=0;g.accumulator=0;g.gesture=null;g.events=[];g.lossReason=null;return true;}
  return {revive,WIDTH,HEIGHT,DT,SAVE_KEY,levels,create,action,step,getSave,normalizeSave,distance,intersects};
});
