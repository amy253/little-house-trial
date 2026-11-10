(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JiajiaClaw = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PLUSHES = [
    {id:'chibi',name:'白裙家家',asset:'jiajia-white-20261021.webp',x:.2,color:'#edbd64'},
    {id:'grimace',name:'格纹帽家家',asset:'jiajia-bonnet-20261021.webp',x:.35,color:'#efafbb'},
    {id:'mic',name:'西装家家',asset:'jiajia-blazer-20261021.webp',x:.5,color:'#a5bcca'},
    {id:'wok',name:'大厨家家',asset:'catch-aijia-wok-toss.png',x:.65,color:'#b7c99f'},
    {id:'boba',name:'奶茶卟哩',asset:'catch-buli-milktea-plush.png',x:.8,color:'#caa582'}
  ];
  const DURATIONS = {drop:.65,grip:.25,lift:1.7,return:.8,release:.55};
  const WEIGHTS=[1.1,1,.78,1.15,1.35], WIDTHS=[.057,.063,.049,.057,.054], FIXED=1/120;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const depthY = z => .52+.30*z;
  function layout(round) {
    let seed=(round+1)*7919;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    return PLUSHES.map((p,i)=>{
      const x=p.x+(random()-.5)*.035,tilt=(random()-.5)*26;
      const depth=[.22,.72,.42,.82,.32][i]+(random()-.5)*.07;
      return {x,depth,y:depthY(depth),tilt,gripX:x+Math.sin(tilt*Math.PI/180)*.018,weight:WEIGHTS[i],width:WIDTHS[i]};
    });
  }
  function parseSave(input) {
    try {
      const v=typeof input==='string'?JSON.parse(input):input;
      if (!v || typeof v!=='object' || v.version!==1) return {};
      return v;
    } catch (_) { return {}; }
  }
  function createGame(saved) {
    const v=parseSave(saved), counts={};
    for(const p of PLUSHES) {
      const n=v.counts && v.counts[p.id];
      counts[p.id]=Number.isSafeInteger(n) && n>=0 ? Math.min(n,99999):0;
    }
    const displayed=Array.isArray(v.displayed)?[...new Set(v.displayed.filter(id=>counts[id]>0 && PLUSHES.some(p=>p.id===id)))].slice(0,3):[];
    const rounds=Number.isSafeInteger(v.rounds)&&v.rounds>=0?Math.min(v.rounds,999999):0;
    return {phase:'aim',phaseTime:0,clawX:.43,clawDepth:.5,clawY:.17,sway:0,clock:0,counts,displayed,
      toys:layout(rounds),swingAngle:0,swingVelocity:0,remainder:0,hookX:.43,
      toyX:0,toyY:0,toyAngle:0,falling:false,fallVelocity:0,bounces:0,returnVelocity:0,transportLoad:0,dropSway:0,dropDepth:.60,
      rounds,
      outcome:null,targetIndex:null,grip:0,captured:false,slipped:false,awardIssued:false,dropX:.5,releaseProgress:0,pulseUsed:false,pulseResult:null,contact:null,slipPhase:null};
  }
  function aim(s,x) {
    if(s.phase!=='aim' || !Number.isFinite(x)) return false;
    const next=clamp(x,.12,.88), distance=Math.abs(next-s.clawX);
    s.swingVelocity=clamp(s.swingVelocity+(next-s.clawX)*9,-2,2);
    s.sway=clamp(s.sway+distance*4.5,0,1); s.clawX=next;
    s.hookX=s.clawX+Math.sin(s.swingAngle)*.055;return true;
  }
  function move(s,direction,dt) {
    if(!Number.isFinite(dt)||dt<=0) return false;
    return aim(s,s.clawX+clamp(direction,-1,1)*.28*dt);
  }
  function aimDepth(s,z) {
    if(s.phase!=='aim'||!Number.isFinite(z))return false;
    const next=clamp(z,.12,.88),distance=Math.abs(next-s.clawDepth);
    s.sway=clamp(s.sway+distance*3.5,0,1);s.clawDepth=next;return true;
  }
  function moveDepth(s,direction,dt) {
    if(!Number.isFinite(dt)||dt<=0)return false;
    return aimDepth(s,s.clawDepth+clamp(direction,-1,1)*.24*dt);
  }
  function gripInfo(s) {
    let index=0,reach=Infinity;
    s.toys.forEach((p,i)=>{const d=Math.hypot((s.hookX-p.gripX)/p.width,(s.clawDepth-p.depth)/.32);if(d<reach){reach=d;index=i;}});
    const toy=s.toys[index],distance=Math.abs(s.hookX-toy.gripX),depthDistance=Math.abs(s.clawDepth-toy.depth),accuracy=clamp(1-reach,0,1);
    const strength=distance>.049||depthDistance>.22?0:clamp(accuracy-Math.max(s.sway,s.dropSway)*.28-Math.abs(toy.tilt)*.001,0,1);
    const required=.7+toy.weight*.1+.065;
    return {index,distance,depthDistance,offsetX:toy.gripX-s.hookX,offsetDepth:toy.depth-s.clawDepth,accuracy,strength,required,stable:s.sway<.12&&Math.abs(s.swingAngle)<.04,secure:strength>=required};
  }
  function feedback(s) {
    const info=s.phase==='aim'?gripInfo(s):s.contact||gripInfo(s),toy=s.toys[info.index];
    const direction=Math.abs(info.offsetX)/toy.width>=Math.abs(info.offsetDepth)/.32?(info.offsetX>0?'向右一点':'向左一点'):(info.offsetDepth>0?'往前一点':'往后一点');
    const advice=(!info.stable||s.dropSway>=.12)&&info.accuracy>.85?'下爪时还在晃，下次停稳再下爪':direction+'，把影子对准脚下中心';
    const say=(kind,label,text)=>({kind,label,text,index:info.index});
    if(s.phase==='aim'){
      if(!info.stable&&info.accuracy>.85)return say('shaky','还在晃','对位接近了，等爪子停稳再下爪');
      if(!info.secure)return say('adjust','再挪一点',direction+'，对准脚下中心再下爪');
      return say('secure','✓ 对准了','对准且已停稳，可以下爪；提起后留意补夹绿灯');
    }
    if(s.outcome==='won')return say('won','抱回家啦',PLUSHES[info.index].name+'已到取物口，收藏 +1');
    if(s.slipped){
      const when=s.slipPhase==='return'?'搬运时':'提起时',pulse=s.pulseResult==='early'?'补夹按早了，下次等绿灯':s.pulseResult==='late'?'补夹按晚了，下次在绿灯时按':advice;
      return say('slipped',when+'滑落',when+'没夹稳；'+pulse);
    }
    if(s.phase==='drop')return say('dropping','正在下爪','爪子下降中，接触娃娃后看夹持状态');
    if(info.strength<.26||s.outcome==='missed')return say('empty','没有夹住','这一爪没夹住；'+advice);
    if(s.phase==='release')return say('secure','正在入袋','到取物口啦，等娃娃落下加入收藏');
    if(s.grip<info.required)return say('loose','夹住边缘','夹住了，但还不牢；提起后绿灯亮时补夹一次');
    return say('secure','夹持较稳',s.phase==='return'?'夹持较稳，正在送往取物口':'夹持较稳，提起后仍可在绿灯时补夹');
  }
  function drop(s) {
    if(s.phase!=='aim') return false;
    const info=gripInfo(s); s.targetIndex=info.strength>0?info.index:null;
    s.dropDepth=depthY(s.clawDepth)-.17;
    s.grip=info.strength;s.dropX=s.clawX;s.dropSway=s.sway;s.phase='drop';s.phaseTime=0;s.rounds++;
    s.falling=false;s.bounces=0;s.returnVelocity=0;s.transportLoad=0;
    s.contact=null;s.slipPhase=null;
    s.outcome=null;s.captured=false;s.slipped=false;s.awardIssued=false;s.releaseProgress=0;s.pulseUsed=false;s.pulseResult=null;
    return true;
  }
  function pulseInfo(s) {
    const progress=clamp(s.phaseTime/DURATIONS.lift,0,1),available=s.phase==='lift'&&s.captured&&!s.pulseUsed;
    return {available,progress,ready:available&&progress>=.25&&progress<=.8,perfect:available&&progress>=.46&&progress<=.6};
  }
  function reclose(s) {
    const info=pulseInfo(s);if(!info.available)return false;
    s.pulseUsed=true;s.pulseResult=info.perfect?'perfect':info.ready?'good':info.progress<.25?'early':'late';
    if(info.ready){s.grip=clamp(s.grip+(info.perfect?.20:.14),0,1);s.swingVelocity*=.65;}
    return true;
  }
  function collectionGoal(s) {
    const missing=PLUSHES.filter(p=>!s.counts[p.id]).map(p=>p.id);
    return {missing,complete:missing.length===0,target:missing[0]||null};
  }
  function slip(s) {
    s.slipPhase=s.phase;s.captured=false;s.slipped=true;s.falling=true;s.fallVelocity=.04;s.bounces=0;
  }
  function pose(s,dt) {
    const p=clamp(s.phaseTime/(DURATIONS[s.phase]||1),0,1),e=p*p*(3-2*p);
    if(s.phase==='drop')s.clawY=.17+(s.dropDepth-.17)*e;
    if(s.phase==='grip')s.clawY=s.dropDepth;
    if(s.phase==='lift') {
      s.clawY=s.dropDepth-(s.dropDepth-.17)*e;
    }
    if(s.phase==='return'){
      s.clawY=.17;const x=s.dropX+(.09-s.dropX)*e,velocity=(x-s.clawX)/dt;
      const acceleration=(velocity-s.returnVelocity)/dt;
      s.swingVelocity=clamp(s.swingVelocity-acceleration*dt*.8,-2,2);
      s.transportLoad=Math.min(.035,Math.abs(acceleration)*.008);s.returnVelocity=velocity;s.clawX=x;
    }
    if(s.phase==='release'){s.clawX=.09;s.clawY=.17;s.releaseProgress=e;}
    s.hookX=s.clawX+Math.sin(s.swingAngle)*.055;
    if(s.captured){
      const toy=s.toys[s.targetIndex];s.toyX=s.hookX;s.toyY=s.clawY+.17;
      s.toyAngle=toy.tilt+s.swingAngle*180/Math.PI;
      const load=.7+toy.weight*.1+(s.phase==='return'?.045+s.transportLoad:0)+Math.abs(s.swingAngle)*.04;
      if((s.phase==='lift'&&p>.82||s.phase==='return')&&s.grip<load)slip(s);
      if(s.phase==='release')s.toyY+=.57*s.releaseProgress;
    }
  }
  function advance(s) {
    const phase=s.phase;s.phaseTime=0;
    if(phase==='drop'){
      const contact=gripInfo(s);s.contact=contact;s.grip=contact.strength;s.targetIndex=contact.strength>0?contact.index:null;s.phase='grip';
    }
    else if(phase==='grip'){
      s.captured=s.targetIndex!==null&&s.grip>=.26;s.phase='lift';
      if(s.captured){s.toyX=s.hookX;s.toyY=s.clawY+.17;s.toyAngle=s.toys[s.targetIndex].tilt;}
    }
    else if(phase==='lift')s.phase='return';
    else if(phase==='return')s.phase='release';
    else if(phase==='release') {
      if(s.captured&&!s.awardIssued) {
        s.counts[PLUSHES[s.targetIndex].id]++;s.awardIssued=true;s.outcome='won';
      } else s.outcome=s.slipped?'slipped':'missed';
      s.captured=false;s.phase='result';s.releaseProgress=1;
    }
  }
  function step(s,dt) {
    if(!Number.isFinite(dt)||dt<=0)return;
    s.remainder+=Math.min(dt,60);
    while(s.remainder>=FIXED-1e-9){
      s.remainder-=FIXED;s.clock+=FIXED;s.sway*=Math.exp(-FIXED*2.5);
      s.swingVelocity+=(-24*s.swingAngle-3.6*s.swingVelocity)*FIXED;
      s.swingAngle=clamp(s.swingAngle+s.swingVelocity*FIXED,-.45,.45);
      if(DURATIONS[s.phase]){
        s.phaseTime+=FIXED;pose(s,FIXED);
        if(s.phaseTime>=DURATIONS[s.phase]-1e-9)advance(s);
      }else s.hookX=s.clawX+Math.sin(s.swingAngle)*.055;
      if(s.falling){
        s.fallVelocity+=1.25*FIXED;s.toyY+=s.fallVelocity*FIXED;s.toyAngle+=70*FIXED;
        const toy=s.toys[s.targetIndex];
        if(s.toyY>=toy.y){
          s.toyY=toy.y;
          if(s.bounces===0&&s.fallVelocity>.12){s.fallVelocity*=-.2;s.bounces++;}
          else{
            s.falling=false;toy.x=clamp(s.toyX,.13,.87);toy.tilt=clamp(s.toyAngle,-28,28);
            toy.gripX=toy.x+Math.sin(toy.tilt*Math.PI/180)*.018;s.toyX=toy.x;s.toyAngle=toy.tilt;
          }
        }
      }
    }
  }
  function revive(s) {
    if(s.phase!=='result'||!['missed','slipped'].includes(s.outcome))return false;
    Object.assign(s,{phase:'aim',phaseTime:0,clawX:.43,clawDepth:.5,hookX:.43,clawY:.17,sway:0,outcome:null,
      swingAngle:0,swingVelocity:0,dropSway:0,falling:false,fallVelocity:0,bounces:0,returnVelocity:0,transportLoad:0,remainder:0,
      toyX:0,toyY:0,toyAngle:0,captured:false,slipped:false,awardIssued:false,targetIndex:null,releaseProgress:0,pulseUsed:false,pulseResult:null,contact:null,slipPhase:null});
    return true;
  }
  function nextRound(s) {
    if(s.phase!=='result')return false;
    Object.assign(s,{phase:'aim',phaseTime:0,clawX:.43,clawDepth:.5,hookX:.43,clawY:.17,sway:0,outcome:null,
      toys:layout(s.rounds),swingAngle:0,swingVelocity:0,dropSway:0,falling:false,remainder:0,
      captured:false,slipped:false,awardIssued:false,targetIndex:null,releaseProgress:0,pulseUsed:false,pulseResult:null,contact:null,slipPhase:null});return true;
  }
  function selectDisplay(s,id) {
    if(!PLUSHES.some(p=>p.id===id)||!s.counts[id])return false;
    const i=s.displayed.indexOf(id);
    if(i>=0)s.displayed.splice(i,1);else {if(s.displayed.length>=3)s.displayed.shift();s.displayed.push(id);}
    return true;
  }
  function serialize(s) {return JSON.stringify({version:1,counts:s.counts,displayed:s.displayed,rounds:s.rounds});}
  return {revive,PLUSHES,DURATIONS,layout,depthY,createGame,aim,aimDepth,move,moveDepth,gripInfo,feedback,pulseInfo,reclose,collectionGoal,drop,step,nextRound,selectDisplay,serialize};
});
