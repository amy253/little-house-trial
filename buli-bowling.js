(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BuliBowling = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
  const LANES = [
    {name:'猫抓板小岛',hint:'从小岛两侧绕过去，斜着瞄准罐头。',target:6,obstacles:[{x:.02,y:4.5,r:.24}]},
    {name:'双生毛线球',hint:'中间留了一条窄路，直球也能穿过去。',target:7,obstacles:[{x:-.58,y:5,r:.24},{x:.58,y:5,r:.24}]},
    {name:'左边的午睡垫',hint:'把球摆在右边，轻轻往左瞄准。',target:6,obstacles:[{x:-.4,y:4.7,r:.35}]},
    {name:'右边的小花盆',hint:'把球摆在左边，轻轻往右瞄准。',target:6,obstacles:[{x:.4,y:4.7,r:.35}]},
    {name:'曲折猫咪步道',hint:'先试右侧通道；碰到软垫会弹回来。',target:5,obstacles:[{x:-.28,y:3.9,r:.24},{x:.28,y:5.65,r:.24}]}
  ];

  // Parse valid actual throws first; a bonus is resolved only when its throws exist.
  function score(rolls) {
    if (!Array.isArray(rolls) || rolls.some(n => !Number.isInteger(n) || n<0 || n>10)) throw new RangeError('无效投球记录');
    const frames = Array.from({length:10},(_,i)=>({number:i+1,rolls:[],score:null,cumulative:null}));
    let cursor=0, next=null, complete=false;
    for (let f=0; f<10; f++) {
      const frame=frames[f]; frame.index=cursor;
      if (cursor>=rolls.length) { next={frame:f+1,roll:1,remaining:10,reset:true}; break; }
      const a=rolls[cursor++]; frame.rolls.push(a);
      if (f<9 && a===10) continue;
      if (cursor>=rolls.length) { next={frame:f+1,roll:2,remaining:a===10?10:10-a,reset:a===10}; break; }
      const b=rolls[cursor++];
      if (a<10 && a+b>10) throw new RangeError('倒下数量超过剩余罐头');
      frame.rolls.push(b);
      if (f<9) continue;
      if (a===10 || a+b===10) {
        const remaining=a===10 && b<10?10-b:10;
        if (cursor>=rolls.length) { next={frame:10,roll:3,remaining,reset:remaining===10}; break; }
        const c=rolls[cursor++];
        if (c>remaining) throw new RangeError('奖励投球超过剩余罐头');
        frame.rolls.push(c);
      }
      complete=true;
    }
    if (cursor<rolls.length) throw new RangeError('比赛已结束');
    let total=0, pending=false;
    frames.forEach((frame,f)=> {
      const r=frame.rolls, i=frame.index;
      if (!r.length) return;
      if (f===9) { if (complete) frame.score=r.reduce((s,n)=>s+n,0); }
      else if (r[0]===10) { if (rolls.length>i+2) frame.score=10+rolls[i+1]+rolls[i+2]; }
      else if (r.length===2) {
        if (r[0]+r[1]===10) { if (rolls.length>i+2) frame.score=10+rolls[i+2]; }
        else frame.score=r[0]+r[1];
      }
      if (frame.score===null) pending=true;
      else total+=frame.score;
      if (!pending) frame.cumulative=total;
    });
    return {frames,total,complete,next,pinfall:rolls.reduce((s,n)=>s+n,0)};
  }
  function recordRoll(rolls,pins) { const result=rolls.concat(pins); score(result); return result; }

  function rack(standing) {
    const list=[]; let id=0;
    for(let row=0;row<4;row++) for(let j=0;j<=row;j++) {
      if (!standing || standing.includes(id)) list.push({id,x:(j-row/2)*.36,y:7.4+row*.32,r:.105,m:1,vx:0,vy:0,fallen:false,rotation:0});
      id++;
    }
    return list;
  }
  function createShot(options={}) {
    const angle=clamp(finite(options.angle,0),-16,16)*Math.PI/180;
    const speed=3.6+clamp(finite(options.power,.8),0,1)*4.4;
    return {
      ball:{x:clamp(finite(options.position,0),-.82,.82),y:.25,vx:Math.sin(angle)*speed,vy:Math.cos(angle)*speed,r:.145,m:5,gutter:false,rotation:0},
      pins:rack(options.standing),obstacles:Number.isInteger(options.lane)&&LANES[options.lane]?LANES[options.lane].obstacles.map(o=>({...o})):[],
      impacts:[],knocked:[],elapsed:0,accumulator:0,complete:false,paused:false,quiet:0
    };
  }
  function setPaused(shot,paused) { shot.paused=Boolean(paused); }
  function collide(a,b,shot,from,to) {
    let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),radius=a.r+b.r;
    if (d>=radius) return;
    if(d<1e-8){dx=.001;dy=0;d=.001;}
    const nx=dx/d,ny=dy/d;
    const relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(relative<=0) return;
    const ia=1/a.m,ib=1/b.m,impulse=1.5*relative/(ia+ib);
    a.vx-=impulse*nx*ia; a.vy-=impulse*ny*ia;
    b.vx+=impulse*nx*ib; b.vy+=impulse*ny*ib;
    const overlap=radius-d+.0002;
    a.x-=nx*overlap*ia/(ia+ib);a.y-=ny*overlap*ia/(ia+ib);
    b.x+=nx*overlap*ib/(ia+ib);b.y+=ny*overlap*ib/(ia+ib);
    if (impulse>.22) {
      if (from!=='ball') a.fallen=true;
      b.fallen=true;
      if(shot.impacts.length<160) shot.impacts.push({from,to,x:b.x,y:b.y,time:shot.elapsed});
    }
  }
  function step(shot,dt) {
    const ball=shot.ball; shot.elapsed+=dt;
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.rotation+=Math.hypot(ball.vx,ball.vy)*dt*7;
    ball.vx*=.9995;ball.vy*=.9995;
    if(!ball.gutter && Math.abs(ball.x)>1) {ball.gutter=true;ball.x=Math.sign(ball.x)*1.09;ball.vx=0;}
    for(const pin of shot.pins) {
      if(pin.fallen) {
        pin.x+=pin.vx*dt;pin.y+=pin.vy*dt;pin.rotation+=Math.hypot(pin.vx,pin.vy)*dt*5;
        pin.vx*=.981;pin.vy*=.981;
      }
    }
    if(!ball.gutter && ball.y<10.5 && ball.y>0) {
      for(const obstacle of shot.obstacles) {
        const dx=ball.x-obstacle.x,dy=ball.y-obstacle.y,d=Math.hypot(dx,dy),r=ball.r+obstacle.r;
        if(d<r && d>.00001) {
          const nx=dx/d,ny=dy/d,dot=ball.vx*nx+ball.vy*ny;
          if(dot<0) {ball.vx-=1.75*dot*nx;ball.vy-=1.75*dot*ny;shot.impacts.push({from:'ball',to:'obstacle',x:ball.x,y:ball.y,time:shot.elapsed});}
          ball.x=obstacle.x+nx*(r+.001);ball.y=obstacle.y+ny*(r+.001);
        }
      }
      for(const pin of shot.pins) collide(ball,pin,shot,'ball',pin.id);
    }
    for(let i=0;i<shot.pins.length;i++) for(let j=i+1;j<shot.pins.length;j++) {
      const a=shot.pins[i],b=shot.pins[j];
      if(a.fallen || b.fallen) collide(a,b,shot,a.id,b.id);
    }
    shot.knocked=shot.pins.filter(p=>p.fallen).map(p=>p.id).sort((a,b)=>a-b);
    const ballDone=ball.y>10.5 || ball.y<-.3 || Math.hypot(ball.vx,ball.vy)<.12 || shot.elapsed>=5.5;
    const pinSpeed=shot.pins.reduce((m,p)=>Math.max(m,Math.hypot(p.vx,p.vy)),0);
    shot.quiet=ballDone && pinSpeed<.15?shot.quiet+dt:0;
    if(shot.quiet>.28 || shot.elapsed>=7) shot.complete=true;
  }
  function tickShot(shot,seconds) {
    if(shot.complete || shot.paused || !Number.isFinite(seconds) || seconds<=0) return shot;
    shot.accumulator+=Math.min(seconds,.1);
    const dt=1/240;
    while(shot.accumulator+1e-10>=dt && !shot.complete) {step(shot,dt);shot.accumulator-=dt;}
    return shot;
  }
  // Challenge round state lives in the UI; validate and repair it without reracking pins.
  function revive(s){
    if(s.mode!=='challenge'||s.phase!=='ended'||!LANES[s.lane]||10-s.standing.length>=LANES[s.lane].target)return false;
    s.challengeRoll=1;s.shot=null;s.phase='aim';s.paused=false;return true;
  }
  function readSave(raw) {
    const fresh={version:1,bestScore:0,challengeBest:[0,0,0,0,0]};
    try {
      const value=typeof raw==='string'?JSON.parse(raw):raw;
      if(!value || value.version!==1 || !Number.isInteger(value.bestScore) || value.bestScore<0 || value.bestScore>300 || !Array.isArray(value.challengeBest) || value.challengeBest.length!==5 || value.challengeBest.some(n=>!Number.isInteger(n)||n<0||n>10)) return fresh;
      return {version:1,bestScore:value.bestScore,challengeBest:value.challengeBest.slice()};
    } catch {return fresh;}
  }
  return {revive,LANES,score,recordRoll,rack,createShot,tickShot,setPaused,readSave};
});
