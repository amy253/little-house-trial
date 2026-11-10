(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliSneak=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const STEP=1/120,COVERS=[[23,29],[51,57],[77,83]],clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const TRACK={start:44,end:330,catWidth:72,catHeight:76,catFoot:450,propFoot:392};
 const WATCHER={x:216,y:235,footY:338};
 const trackX=p=>TRACK.start+clamp(p,0,100)*(TRACK.end-TRACK.start)/100;
 function layout(progress,rules){return {cat:{x:trackX(progress),footY:TRACK.catFoot,width:TRACK.catWidth,height:TRACK.catHeight},watcher:WATCHER,props:rules.props,snack:{x:373,footY:450}};}
 // Project the opaque furniture rectangle from Jiajia's eyes onto the whole cat silhouette.
 // A foreground object behind the cat from her viewpoint cannot supply cover.
 function sightRange(prop){
  const top=prop.footY-prop.height+8,bottom=prop.footY-8,left=prop.x-prop.width/2+8,right=prop.x+prop.width/2-8;
  if(top<=WATCHER.y||prop.footY>=TRACK.catFoot||prop.footY<=WATCHER.footY)return null;
  let low=-Infinity,high=Infinity;
  for(const y of [TRACK.catFoot-TRACK.catHeight,TRACK.catFoot]){
   const t1=(top-WATCHER.y)/(y-WATCHER.y),t2=(Math.min(bottom,y)-WATCHER.y)/(y-WATCHER.y);
   if(t1>=1||t2<=0)return null;
   const a=Math.min(WATCHER.x+(left-WATCHER.x)/t1,WATCHER.x+(left-WATCHER.x)/t2);
   const b=Math.max(WATCHER.x+(right-WATCHER.x)/t1,WATCHER.x+(right-WATCHER.x)/t2);
   low=Math.max(low,a+TRACK.catWidth/2);high=Math.min(high,b-TRACK.catWidth/2);
  }
  return low<=high?[(low-TRACK.start)*100/(TRACK.end-TRACK.start),(high-TRACK.start)*100/(TRACK.end-TRACK.start)]:null;
 }
 function config(level){
  const n=clamp(Number.isInteger(level)?level:0,0,11),hard=Math.max(0,n-2),shift=[0,-1,1][Math.floor(n/4)];
  const props=[20,55,88].map((p,kind)=>({kind,progress:p+shift,x:WATCHER.x+(trackX(p+shift)-WATCHER.x)*.7,footY:TRACK.propFoot,width:[82,88,84][kind],height:66}));
  const covers=props.map(sightRange);
  return {level:n,room:['厨房','书房','客厅'][Math.floor(n/4)],snack:['鱼肉小饼','香香烤鱼','一碗猫粮','猫条加餐'][n%4],awayMin:n<2?1.25-n*.25:.78-hard*.02,awayRange:n<2?.65:1.05,warning:n<2?.5-n*.07:.36-hard*.008,lookMin:n<2?1+n*.1:.85+hard*.02,lookRange:.65,limit:n<2?19+n*.5:18+hard*.3,speed:n<2?14.5+n:17.5+hard*.1,props,covers,creaks:n<2?[]:n<6?[[35,40]]:n<10?[[35,40],[65,69]]:[[35,40],[65,69],[89,92]]};
 }
 function roll(s){return clamp(Number(s.random())||0,0,1);}
 function create(options={}){const rules=config(options.level),s={level:rules.level,rules,phase:'ready',paused:false,moving:false,progress:0,suspicion:0,elapsed:0,deadline:rules.limit,watcher:'away',phaseTime:0,duration:0,accumulator:0,reason:null,stars:0,alert:'return',creakCount:0,creakAt:-1,creakTime:-10,random:typeof options.random==='function'?options.random:Math.random};s.duration=rules.awayMin+roll(s)*rules.awayRange;return s;}
 function start(s){if(s.phase!=='ready')return false;s.phase='playing';s.moving=false;return true;}
 function setMoving(s,value){s.moving=s.phase==='playing'&&!s.paused&&Boolean(value);}
 function setPaused(s,value){if(s.phase!=='playing')return;s.paused=Boolean(value);s.moving=false;s.accumulator=0;}
 function inCover(progress,rules){return (rules?.props?rules.props.map(sightRange):COVERS).some(range=>range&&progress>=range[0]&&progress<=range[1]);}
 function finish(s,phase,reason){s.phase=phase;s.reason=reason;s.moving=false;if(phase==='won')s.stars=s.elapsed<s.rules.limit*.55?3:s.elapsed<s.rules.limit*.8?2:1;}
 function catchMoving(s){if(s.watcher!=='look'||!s.moving||inCover(s.progress,s.rules))return false;s.suspicion=1;finish(s,'lost','caught');return true;}
 function step(s){
  s.elapsed+=STEP;s.phaseTime+=STEP;
  const before=s.progress;
  if(catchMoving(s))return;
  if(s.moving)s.progress=Math.min(100,s.progress+s.rules.speed*STEP);
  if(catchMoving(s))return;
  s.suspicion=0;
  if(s.progress<100&&s.elapsed>=(s.deadline??s.rules.limit)){finish(s,'lost','time');return;}
  const board=s.rules.creaks.find(([a])=>before<a&&s.progress>=a);
  if(board&&s.watcher==='away'){
   s.watcher='warning';s.alert='floor';s.creakAt=s.progress;s.creakTime=s.elapsed;s.creakCount++;s.phaseTime=0;
   s.duration=s.rules.warning+.08;return;
  }
  if(s.phaseTime+1e-9>=s.duration){
   s.phaseTime=Math.max(0,s.phaseTime-s.duration);
   if(s.watcher==='away'){s.watcher='warning';s.alert='return';s.duration=s.rules.warning+roll(s)*.12;}
   else if(s.watcher==='warning'){s.watcher='look';s.duration=s.rules.lookMin+roll(s)*s.rules.lookRange;}
   else{s.watcher='away';s.alert='return';s.duration=s.rules.awayMin+roll(s)*s.rules.awayRange;}
  }
  if(catchMoving(s))return;
  if(s.progress>=100)finish(s,'won','snack');
 }
 function tick(s,dt){if(s.phase!=='playing'||s.paused||!Number.isFinite(dt)||dt<=0)return;s.accumulator+=Math.min(dt,.1);while(s.accumulator+1e-9>=STEP&&s.phase==='playing'){s.accumulator-=STEP;if(s.accumulator<1e-9)s.accumulator=0;step(s);}}
 function revive(s){
  if(s.phase!=='lost')return false;
  s.deadline=Math.max(s.deadline??s.rules.limit,s.elapsed+Math.max(12,(100-s.progress)/s.rules.speed*3+3));
  s.phase='playing';s.paused=false;s.moving=false;s.suspicion=0;s.reason=null;s.accumulator=0;
  s.watcher='away';s.phaseTime=0;s.duration=s.rules.awayMin+s.rules.awayRange;s.alert='return';return true;
 }
 function readSave(raw){let v={};try{v=JSON.parse(raw)||{};}catch(_){}return {unlocked:Number.isInteger(v.unlocked)&&v.unlocked>=0&&v.unlocked<12?v.unlocked:0,stars:Array.from({length:12},(_,i)=>Number.isInteger(v.stars?.[i])&&v.stars[i]>=0&&v.stars[i]<=3?v.stars[i]:0)};}
 return {revive,config,create,start,setMoving,setPaused,tick,inCover,readSave,layout,trackX};
});
