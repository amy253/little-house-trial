(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.EggWall=factory();})(globalThis,function(){
 'use strict';
 const TAU=Math.PI*2,FLIGHT=.26,wrap=a=>(a%TAU+TAU)%TAU;
 const distance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
 const phases=[[1,1,1],[.8,1,0],[.18,0,0],[.8,0,-1],[.7,-1,-1],[.8,-1,0],[.18,0,0],[.8,0,1]],period=phases.reduce((s,p)=>s+p[0],0),cycleTurn=phases.reduce((s,p)=>s+(p[1]+p[2])*p[0]/2,0);
 function motion(t,instant=false){const cycles=Math.floor(t/period);t-=cycles*period;let angle=cycles*cycleTurn;for(const [duration,from,to]of phases){const part=Math.min(t,duration),u=part/duration;if(t<duration){if(instant)return from+(to-from)*(3*u*u-2*u*u*u);return angle+from*part+(to-from)*duration*(u*u*u-.5*u*u*u*u);}angle+=(from+to)*duration/2;t-=duration;}return instant?1:angle;}
 const rate=g=>1+Math.min(.5,(g.level-1)*.07+g.completed*.025);
 function velocity(g,time=g.elapsed){return g.speed*motion(time*rate(g),true);}
 function advance(g,dt){const r=rate(g);g.angle+=g.speed*(motion((g.elapsed+dt)*r)-motion(g.elapsed*r))/r;g.elapsed+=dt;}
 function layer(g){g.elapsed=0;const extra=Math.min(6,Math.ceil((g.level-1)/2));g.totalShots=g.remaining=(g.completed<2?3:5)+extra;g.painted=[];g.shots=[];const count=g.level===1?(g.completed===0?0:g.completed===1?1:4):Math.min(8,2+Math.floor((g.level-2)/2)+g.completed);g.markWidth=Math.min(.32,.24+(g.level-1)*.018);g.obstacles=Array.from({length:count},(_,i)=>({angle:wrap(i*TAU/count+(i%2)*.14),width:g.markWidth}));}
 function create(level=1){level=Math.max(1,Math.min(999,Math.floor(Number(level)||1)));const g={level,layers:Math.min(6,3+Math.floor(level/2)),completed:0,angle:0,speed:Math.min(3.4,1.6+(level-1)*.13)*(level%2?1:-1),elapsed:0,cannon:0,shots:[],get shot(){return this.shots[0]||null;},status:'ready',paused:false,clearTime:0,hit:null,event:0};layer(g);return g;}
 function start(g){if(g.status==='ready')g.status='playing';}
 function shoot(g){if(g.status!=='playing'||g.paused||g.shots.length>=g.remaining)return false;g.shots.push({time:0,x:0});return true;}
 function tick(g,dt){if(g.paused||!['playing','clearing'].includes(g.status)||!Number.isFinite(dt)||dt<=0)return;
  let left=dt;
  while(left>1e-10&&['playing','clearing'].includes(g.status)){
   if(g.status==='clearing'){const step=Math.min(left,g.clearTime);g.clearTime-=step;left-=step;if(g.clearTime<=1e-10){g.status='playing';layer(g);}continue;}
   const step=Math.min(left,g.shot?Math.max(0,FLIGHT-g.shot.time):left);advance(g,step);for(const shot of g.shots)shot.time+=step;left-=step;
   if(g.shot&&g.shot.time+1e-10>=FLIGHT){g.shots.shift();const angle=wrap(Math.PI/2-g.angle);g.hitAngle=angle;g.event++;g.hit=[...g.obstacles,...g.painted].find(m=>distance(m.angle,angle)<m.width/2+.045)||null;
    if(g.hit){g.status='lost';g.shots=[];}else{g.painted.push({angle,width:g.markWidth});g.remaining--;if(!g.remaining){g.completed++;g.status=g.completed===g.layers?'won':'clearing';g.clearTime=.7;}}
   }
  }
 }
 function revive(g){if(g.status!=='lost')return false;g.painted=g.painted.filter(m=>m!==g.hit);g.obstacles=g.obstacles.filter(m=>m!==g.hit);g.hit=null;g.status='playing';g.shots=[];g.paused=false;return true;}
 return{TAU,FLIGHT,create,start,shoot,tick,revive,wrap,velocity};
});
