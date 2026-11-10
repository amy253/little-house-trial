(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliTug=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const opponents=[
    {name:'奶糖',title:'第一次抢猫条',hint:'红色「猛拉」时松手，绿色「喘气」时按住。',power:.16,rest:2.6,charge:1.15,pull:.9,feint:false},
    {name:'橘子',title:'会抓时机的橘猫',hint:'先恢复，再在喘气刚开始时按下，触发抢拉。',power:.185,rest:2.45,charge:1.05,pull:1.05,feint:false},
    {name:'团子',title:'小心它的虚晃',hint:'黄色蓄力不一定真拉，等红色猛拉再松手。',power:.205,rest:2.3,charge:1,pull:1.1,feint:true},
    {name:'麻薯',title:'连拉两下',hint:'它偶尔会连拉，喘气前别急着冲。',power:.225,rest:2.2,charge:.9,pull:1.25,feint:true},
    {name:'饼干',title:'最后一口也不让',hint:'保留至少一格体力，抓住每次绿色抢拉窗口。',power:.245,rest:2.1,charge:.85,pull:1.3,feint:true},
    {name:'猫条大王',title:'小屋抢吃冠军',hint:'它猛拉得久，但每次喘气都能反击。',power:.265,rest:2.05,charge:.8,pull:1.4,feint:true}
  ];
  function readSave(raw){raw=raw&&typeof raw==='object'?raw:{};return {learned:raw.learned===true,unlocked:Number.isFinite(raw.unlocked)?clamp(Math.floor(raw.unlocked),0,5):0,best:opponents.map((_,i)=>Array.isArray(raw.best)&&Number.isFinite(raw.best[i])&&raw.best[i]>0&&raw.best[i]<=180?raw.best[i]:null)};}
  function create(level,options){level=Number.isFinite(level)?clamp(Math.floor(level),0,5):0;return {level,status:'ready',position:0,stamina:100,held:false,time:0,deadline:60,phase:'ready',phaseTime:0,cycle:0,burst:0,burstCooldown:0,bursts:0,rested:1,exhausted:0,overworks:0,accumulator:0,wasFeint:false,combo:0,bestCombo:0,counterThisCycle:false,guide:options&&options.tutorial===true?0:-1,guideProgress:0,learned:false};}
  function start(s){if(s.status==='ready')s.status='playing';}
  function hold(s,on){if(s.status!=='playing'){s.held=false;return;}on=!!on;
    if(s.guide>=0){if(s.guide===2&&on&&!s.held){s.guide=3;s.guideProgress=0;s.position+=.18;s.burst=.9;}s.held=on;return;}
    if(on&&!s.held&&s.rested>=.35&&s.phase==='rest'&&s.phaseTime<.85&&s.burstCooldown<=0&&!s.counterThisCycle&&s.stamina>=26&&s.exhausted<=0){s.burst=.65;s.burstCooldown=3;s.stamina-=7;s.bursts++;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.counterThisCycle=true;s.position=clamp(s.position+.09+.025*Math.min(3,s.combo),-1,1);}s.held=on;if(on)s.rested=0;}
  function pause(s){if(s.status==='playing'){s.status='paused';s.held=false;s.rested=0;s.accumulator=0;}}
  function resume(s){if(s.status==='paused'){s.status='playing';s.held=false;s.accumulator=0;}}
  function duration(s){const o=opponents[s.level];return s.phase==='ready'?.85:s.phase==='charge'?o.charge:s.phase==='feint'?.42:s.phase==='pull'?o.pull+(s.level>=3&&s.cycle%3===2?.35:0):o.rest;}
  function nextPhase(s){const o=opponents[s.level];if(s.phase==='ready'){s.phase='charge';s.wasFeint=false;}else if(s.phase==='charge'){s.wasFeint=o.feint&&s.cycle%3===1;s.phase=s.wasFeint?'feint':'pull';}else if(s.phase==='pull'||s.phase==='feint'){s.phase='rest';s.counterThisCycle=false;}else{if(!s.counterThisCycle)s.combo=0;s.phase='ready';s.cycle++;}s.phaseTime=0;}
  function practice(s,dt){
    if(s.guide===0){s.phase='rest';if(s.held){s.guideProgress+=dt;s.stamina=Math.max(65,s.stamina-32*dt);s.position=Math.min(.2,s.position+.3*dt);if(s.guideProgress>=.65){s.guide=1;s.guideProgress=0;s.phase='pull';}}}
    else if(s.guide===1){s.phase='pull';if(!s.held){s.guideProgress+=dt;s.stamina=Math.min(100,s.stamina+40*dt);if(s.guideProgress>=.65){s.guide=2;s.guideProgress=0;s.phase='rest';}}else s.guideProgress=0;}
    else if(s.guide===2){s.phase='rest';s.stamina=Math.min(100,s.stamina+30*dt);}
    else{s.guideProgress+=dt;s.burst=Math.max(0,s.burst-dt);if(s.guideProgress>=.9){s.guide=-1;s.learned=true;s.position=0;s.stamina=100;s.held=false;s.phase='ready';s.phaseTime=0;s.time=0;s.rested=1;s.burst=0;s.accumulator=0;}}
  }
  function step(s,dt){
    if(s.guide>=0){practice(s,dt);return;}
    s.time+=dt;s.phaseTime+=dt;if(s.phaseTime>=duration(s))nextPhase(s);
    s.burstCooldown=Math.max(0,s.burstCooldown-dt);s.burst=Math.max(0,s.burst-dt);s.exhausted=Math.max(0,s.exhausted-dt);
    const active=s.held&&s.exhausted<=0;const o=opponents[s.level];
    if(active){s.stamina=Math.max(0,s.stamina-(s.phase==='pull'?23:15)*dt);s.rested=0;if(s.stamina<=0){s.exhausted=1.1;s.overworks++;s.position-=.065;}}
    else{s.stamina=Math.min(100,s.stamina+23*dt);s.rested+=dt;}
    let rival=s.phase==='pull'?o.power:s.phase==='rest'?.018:s.phase==='charge'?.034:s.phase==='feint'?.014:.055+s.level*.002;
    // Planting paws while recovering reduces the rival's pull, but cannot gain ground.
    if(!active)rival*=s.exhausted>0?.95:.45;
    const player=active?(.092+.065*s.stamina/100)+(s.burst>0?.21:0):0;
    s.position=clamp(s.position+(player-rival)*dt,-1,1);
    if(s.position>=1){s.status='won';s.held=false;}else if(s.position<=-1||s.time>=(s.deadline??60)-1e-8){s.status='lost';s.held=false;}
  }
  function tick(s,dt){if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;s.accumulator+=Math.min(2,dt);while(s.accumulator+1e-9>=1/120&&s.status==='playing'){s.accumulator-=1/120;step(s,1/120);}if(s.accumulator<0)s.accumulator=0;}
  function revive(s){
    if(s.status!=='lost')return false;
    s.deadline=Math.max(s.deadline??60,s.time+60);s.status='playing';s.position=Math.max(-.35,s.position);
    s.stamina=100;s.exhausted=0;s.phase='rest';s.phaseTime=0;s.held=false;s.rested=1;s.accumulator=0;
    s.burst=0;s.burstCooldown=0;s.counterThisCycle=false;return true;
  }
  function counterWindow(s){return s.status==='playing'&&s.guide<0&&s.phase==='rest'&&s.phaseTime<.85&&!s.counterThisCycle&&s.rested>=.35&&s.stamina>=26&&s.burstCooldown<=0&&s.exhausted<=0;}
  function cue(s){
    if(s.status==='ready')return {kind:'neutral',title:'把猫条拉到左边，卟哩就能吃到',tip:'按住拉 · 松手恢复',action:'hold'};
    if(s.status==='won')return {kind:'rest',title:'猫条归卟哩啦！',tip:'赢得漂亮，开吃！',action:'hold'};
    if(s.status==='lost')return {kind:'pull',title:'猫条被抢走啦',tip:s.overworks?'体力用光了，下次松手喘口气。':'它猛拉就松手，它喘气就按下。',action:'release'};
    if(s.guide===0)return {kind:'rest',title:'① 按住按钮，拉一小段',tip:'亲手试一下，不会输；一直按到下一步',action:'hold'};
    if(s.guide===1)return {kind:'pull',title:'② 松开手，让卟哩恢复体力',tip:'它猛拉时松手，卟哩会蹲稳，不用硬扛',action:'release'};
    if(s.guide===2)return {kind:'rest',title:'③ 它累了！现在按下抢拉',tip:'喘气刚开始按下，能一下抢回更多',action:'press'};
    if(s.guide===3)return {kind:'rest',title:'学会啦！一把抢回来了',tip:'接下来正式开始：红色松手，绿色按下',action:'hold'};
    if(s.exhausted>0||s.stamina<20)return {kind:'pull',title:s.exhausted>0?'累趴了！快松手':'体力不多了，松手歇一下',tip:'恢复体力后再拉，更有劲',action:'release'};
    if(s.burst>0)return {kind:'rest',title:s.combo>1?'漂亮！'+s.combo+' 连击':'漂亮！一把抢回来了',tip:'继续按住；连着抓准，下一次拉得更远',action:'hold'};
    if(s.phase==='pull')return {kind:'pull',title:'松手！它在猛拉',tip:'让它白费力气，留体力反击',action:'release'};
    if(s.phase==='rest'&&s.phaseTime<.85&&!s.counterThisCycle&&s.burstCooldown<=0&&s.stamina>=26&&s.rested<.35)return {kind:'charge',title:'松一下，蓄劲抢拉',tip:'松手一下，按钮变绿后再按下',action:'release'};
    if(counterWindow(s))return {kind:'rest',title:s.held?'松一下，再按下抢拉！':'现在按下！抢一大把',tip:'绿色机会条消失前，按下按钮',action:s.held?'release':'press'};
    if(s.phase==='rest')return {kind:'rest',title:'按住！它还在喘气',tip:'把猫条拉回卟哩这边',action:'hold'};
    if(s.phase==='charge')return {kind:'charge',title:'它在蓄力，盯着它',tip:'变红再松手，黄色可能是假动作',action:'hold'};
    if(s.phase==='feint')return {kind:'rest',title:'是假动作！继续拉',tip:'别被吓住，这是抢回来的好机会',action:'hold'};
    return {kind:'neutral',title:'按住拉一会，留点体力',tip:s.stamina<40?'松手恢复，等它喘气':'可以按住，留一点体力',action:s.stamina<40?'release':'hold'};
  }
  return {revive,opponents,create,start,hold,pause,resume,tick,cue,counterWindow,readSave};
});
