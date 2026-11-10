(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./jiajia-claw.js'));
  else { root.JiajiaClawUI=factory(root.JiajiaClaw); root.JiajiaClawUI.mount(); }
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 const SAVE_KEY='jiajia-claw-save';
 function pointerPosition(event,stage){
  const r=stage.getBoundingClientRect(),sx=r.width/stage.offsetWidth,sy=r.height/stage.offsetHeight;
  return {x:(event.clientX-r.left-stage.clientLeft*sx)/(stage.clientWidth*sx),y:(event.clientY-r.top-stage.clientTop*sy)/(stage.clientHeight*sy)};
 }
 function createController(options) {
  options=options||{};const storage=options.storage;let saved,available=!!storage;
  try {if(storage)saved=storage.getItem(SAVE_KEY);}catch(_){available=false;}
  const s=C.createGame(saved),held=new Set();let paused=false,inputRemainder=0;
  const c={state:s,get paused(){return paused;},get saveAvailable(){return available;},
   save(){try {if(storage){storage.setItem(SAVE_KEY,C.serialize(s));available=true;}}catch(_){available=false;}},
   hold(direction,on){if(!['left','right','back','front'].includes(direction))return;if(on&&!paused&&s.phase==='aim')held.add(direction);else held.delete(direction);},
   clearHeld(){held.clear();},
   setPaused(value){paused=!!value;held.clear();inputRemainder=0;},
   aim(x){if(!paused)return C.aim(s,x);return false;},
   aimDepth(z){if(!paused)return C.aimDepth(s,z);return false;},
   drop(){held.clear();return paused?false:C.drop(s);},
   reclose(){return paused?false:C.reclose(s);},
   nextRound(){held.clear();return C.nextRound(s);},
   revive(){held.clear();inputRemainder=0;if(!C.revive(s))return false;paused=false;return true;},
   selectDisplay(id){if(C.selectDisplay(s,id)){c.save();return true;}return false;},
   tick(dt){if(paused||!Number.isFinite(dt)||dt<=0)return;const before=s.phase;
    inputRemainder+=Math.min(dt,60);
    while(inputRemainder>=1/120-1e-9){
      inputRemainder-=1/120;
      if(s.phase==='aim'){
       C.move(s,(held.has('right')?1:0)-(held.has('left')?1:0),1/120);
       C.moveDepth(s,(held.has('front')?1:0)-(held.has('back')?1:0),1/120);
      }
      C.step(s,1/120);
    }
    if(before!=='result'&&s.phase==='result')c.save();}
  };return c;
 }
 function mount(){
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id);if(!$('claw-stage'))return;
  let storage;try{storage=window.localStorage;}catch(_){}
  const island=window.IslandRevive?.create({id:'jiajia-claw'});island?.reset();
  const c=createController({storage}),s=c.state,stage=$('claw-stage'),layer=$('plush-layer'),drop=$('drop-button'),again=$('again-button');
  let joystick=null,joyDir=null;joystick=window.TouchJoystick?.create({element:$('joystick'),thumb:$('joystick-thumb'),enabled:()=>!c.paused&&s.phase==='aim',onChange:({direction})=>{if(joyDir)c.hold(joyDir,false);joyDir=direction==='up'?'back':direction==='down'?'front':direction;if(joyDir)c.hold(joyDir,true);}});

  const floor=C.PLUSHES.map(p=>{const item=document.createElement('div');item.className='machine-plush';item.dataset.plush=p.id;
   item.style.left=p.x*100+'%';item.innerHTML='<img draggable="false" src="'+p.asset+'" alt="'+p.name+'"><span>'+p.name+'</span>';
   layer.append(item);return item;});
  const feet=C.PLUSHES.map(()=>{const foot=document.createElement('span');foot.className='plush-foot';foot.setAttribute('aria-hidden','true');layer.append(foot);return foot;});
  const carried=$('carried-plush'),claw=$('claw-head'),rope=$('claw-rope');let sound=false,audio,lastPhase=s.phase,lastResult=null,lastCollection='',dragId=null,lastTime=null;
  function beep(won){if(!sound)return;try {audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.setValueAtTime(won?660:330,audio.currentTime);o.frequency.exponentialRampToValueAtTime(won?990:220,audio.currentTime+.16);
    g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.start();o.stop(audio.currentTime+.23);
   }catch(_){} }
  function collection(){const key=JSON.stringify([s.counts,s.displayed,c.saveAvailable]);if(key===lastCollection)return;lastCollection=key;
   const goal=C.collectionGoal(s),p=C.PLUSHES.find(p=>p.id===goal.target);
   $('goal-text').textContent=goal.complete?'五款集齐！全家福解锁啦': '还差 '+goal.missing.length+' 款 · 试着抱回'+p.name;
   $('goal-picture').src=goal.complete?C.PLUSHES[4].asset:p.asset;$('goal-picture').alt=goal.complete?'集齐五款娃娃':p.name;
   $('goal-card').dataset.complete=String(goal.complete);
   $('prize-total').textContent=Object.values(s.counts).reduce((a,b)=>a+b,0);$('unique-total').textContent=Object.values(s.counts).filter(n=>n>0).length;
   $('collection-list').replaceChildren();C.PLUSHES.forEach(p=>{const button=document.createElement('button');button.className='collection-item';button.dataset.collection=p.id;button.disabled=!s.counts[p.id];button.setAttribute('aria-pressed',String(s.displayed.includes(p.id)));
    button.innerHTML='<img src="'+p.asset+'" alt=""><span>'+p.name+'</span><b>'+ (s.counts[p.id]?'× '+s.counts[p.id]:'待抓取')+'</b><small>'+ (s.displayed.includes(p.id)?'已摆上展示架':s.counts[p.id]?'点击摆上展示架':'收集后可展示')+'</small>';
    button.addEventListener('click',()=>{c.selectDisplay(p.id);collection();});$('collection-list').append(button);});
   $('family-photo').hidden=!goal.complete;$('family-cast').replaceChildren();
   if(goal.complete)C.PLUSHES.forEach(p=>{const img=document.createElement('img');img.src=p.asset;img.alt=p.name;$('family-cast').append(img);});
   $('display-shelf').replaceChildren();
   if(!s.displayed.length){const hint=document.createElement('p');hint.textContent='集齐五款，解锁家家和卟哩的全家福';$('display-shelf').append(hint);}
   s.displayed.forEach(id=>{const p=C.PLUSHES.find(p=>p.id===id),img=document.createElement('img');img.src=p.asset;img.alt=p.name;$('display-shelf').append(img);});
   $('save-note').textContent=c.saveAvailable?'收藏自动保存在这台设备':'本次可正常玩 · 浏览器暂时无法保存收藏';
  }
  function render(){
   joystick?.refresh();
   const info=C.gripInfo(s),feedback=C.feedback(s),pulse=C.pulseInfo(s),busy=s.phase!=='aim'&&s.phase!=='result',swing=s.swingAngle*180/Math.PI;
   stage.dataset.grip=feedback.kind;$('aim-line').querySelector('small').textContent=feedback.label;
   stage.dataset.phase=s.phase;stage.dataset.falling=String(s.falling);stage.dataset.won=String(s.outcome==='won');stage.dataset.pulse=String(pulse.ready);claw.style.left=s.hookX*100+'%';claw.style.top=s.clawY*100+'%';claw.style.setProperty('--swing',swing+'deg');
   claw.classList.toggle('closed',['grip','lift','return'].includes(s.phase));rope.style.left=s.clawX*100+'%';rope.style.height=(s.clawY*100-7)+'%';
   rope.style.transform='translateX(-50%) rotate('+(-Math.atan2(s.hookX-s.clawX,Math.max(.01,s.clawY-.07))*180/Math.PI)+'deg)';
   const closure=s.phase==='grip'?Math.min(1,s.phaseTime/C.DURATIONS.grip):['lift','return'].includes(s.phase)?(s.pulseUsed&&['good','perfect'].includes(s.pulseResult)?1.22:1):0;
   claw.querySelector('.finger-left').style.transform='rotate('+(-20+27*closure)+'deg)';
   claw.querySelector('.finger-right').style.transform='rotate('+(20-27*closure)+'deg)';
   $('aim-line').style.left=s.hookX*100+'%';$('aim-line').style.top=(C.depthY(s.clawDepth)+.11)*100+'%';$('aim-line').hidden=s.phase!=='aim';
   floor.forEach((el,i)=>{
    const toy=s.toys[i],removed=i===s.targetIndex&&(s.captured||s.falling||s.outcome==='won');el.style.opacity=removed?'0':'1';
    el.style.left=toy.x*100+'%';el.style.top=toy.y*100+'%';el.style.transform='translate(-50%,-50%) rotate('+toy.tilt+'deg)';
    el.dataset.gripX=String(toy.gripX);el.dataset.depth=String(toy.depth);el.style.zIndex=String(3+Math.round(toy.depth*2));
    const target=s.phase==='aim'&&i===info.index&&info.accuracy>0;el.classList.toggle('target',target);feet[i].classList.toggle('target',target);
    feet[i].style.left=toy.gripX*100+'%';feet[i].style.top=(toy.y+.11)*100+'%';feet[i].hidden=removed;
   });
   carried.hidden=!s.captured&&!s.falling; if(s.captured||s.falling){const p=C.PLUSHES[s.targetIndex];if(carried.dataset.id!==p.id){carried.src=p.asset;carried.dataset.id=p.id;carried.alt=p.name;}
    carried.style.left=s.toyX*100+'%';carried.style.top=s.toyY*100+'%';carried.style.transform='translate(-50%,-50%) rotate('+s.toyAngle+'deg)';carried.style.opacity=s.phase==='release'?1-s.releaseProgress*.8:1;}
   drop.disabled=c.paused||!(s.phase==='aim'||pulse.available);drop.hidden=s.phase==='result';again.hidden=s.phase!=='result';
   drop.closest('.control-row').hidden=s.phase==='result';$('grip-panel').hidden=s.phase==='result';
   $('aim-slider').closest('details').hidden=s.phase!=='aim';
   drop.dataset.ready=String(pulse.ready);
   const buttonText=s.phase==='aim'?'下爪':pulse.available?'再夹一下':s.pulseResult==='perfect'?'夹得漂亮！':s.pulseResult==='good'?'稳住啦！':s.pulseUsed?'机会用完了':'正在抓取…';
   $('drop-label').textContent=buttonText;$('drop-hint').textContent=s.phase==='aim'?'拖动玻璃瞄准':pulse.available?'绿灯亮时按！':'每爪一次机会';
   for(const direction of ['left','right','back','front'])$('move-'+direction).disabled=busy||s.phase==='result';
   $('aim-slider').disabled=s.phase!=='aim';$('aim-slider').value=Math.round(s.clawX*1000);
   $('depth-slider').disabled=s.phase!=='aim';$('depth-slider').value=Math.round(s.clawDepth*1000);
   const motion=Math.min(1,Math.abs(s.swingAngle)*2+s.sway),timing=s.phase==='lift'&&s.captured;
   const pct=Math.round((timing?pulse.progress:motion)*100);$('grip-fill').style.width=pct+'%';$('grip-meter').setAttribute('aria-valuenow',pct);
   $('grip-meter').setAttribute('aria-label',timing?'二次收爪时机，绿色区域可按，金色区域最稳':'机械爪摆动幅度，越小越稳');
   $('grip-panel').dataset.secure=String(timing?pulse.ready:feedback.kind==='secure');$('grip-panel').dataset.timing=String(timing);
   if(s.phase==='aim'){
    $('grip-text').textContent=feedback.label;
    const features=['蓬松 · 中等重量','圆头 · 轻巧','细长 · 容易抓偏','重心偏侧','带杯子 · 偏重'];
    $('target-name').textContent=C.PLUSHES[info.index].name+' · '+features[info.index];
   }else {
    $('target-name').textContent=timing?'二次收爪 · 每爪一次':'娃娃机工作中';
    $('grip-text').textContent=pulse.available?(pulse.ready?'绿灯亮了！现在按':pulse.progress>.8?'时机过了，下次早点':'先等绿灯亮'):s.pulseResult==='perfect'?'漂亮！夹得更牢':s.pulseResult==='good'?'成功补夹，稳住啦':s.pulseResult==='early'?'按早了，下次等绿灯':s.pulseResult==='late'?'按晚了，下次提早一点':s.falling?'滑落啦':'看看能不能带回家';
   }
   const messages={aim:info.stable?'拖动影子到娃娃脚下，再按「下爪」。':'瞄准后稍等，爪子停稳更好抓。',drop:'爪子下降中 · 提起后留意绿灯',grip:'夹住！准备再收爪一次…',lift:s.slipped?'哎呀，掉回去了！':pulse.available?(pulse.ready?'现在按「再夹一下」！能把抓偏的救回来':pulse.progress>.8?'补夹时机过了，看看能否直接夹住':'看准绿灯，准备「再夹一下」'):'二次收爪已用，看看能否稳住…',return:s.slipped?'差一点！娃娃滑回软垫了':s.captured?'稳住稳住…往取物口走啦！':'这一爪抓空了',release:s.captured?'到门口啦，准备抱回家！':'换个角度再试试',result:s.outcome==='won'?(s.pulseResult==='perfect'?'漂亮的补夹！':s.pulseResult==='good'?'成功救回来了！':'抓到了！')+C.PLUSHES[s.targetIndex].name+'加入收藏':s.outcome==='slipped'?'差一点就到家了！下一爪试试绿灯时再夹一下。':'这次抓空了，把影子移到娃娃脚下再试。'};
   messages.aim=feedback.text;messages.grip=feedback.text;messages.result=feedback.text;
   if(['empty','slipped'].includes(feedback.kind)){messages.lift=feedback.text;messages.return=feedback.text;messages.release=feedback.text;}
   if(!['aim','result'].includes(s.phase)&&!pulse.available)$('grip-text').textContent=feedback.label;
   $('machine-status').textContent=c.paused?'已暂停 · 回到页面继续':messages[s.phase];
   $('stage-badge').textContent=feedback.label;
   if(lastPhase!==s.phase){if(s.phase==='grip')beep(false);if(s.phase==='result'){
    $('result-message').textContent=messages.result;lastResult=s.outcome;beep(s.outcome==='won');collection();
    if(s.outcome==='won'){$('catch-picture').src=C.PLUSHES[s.targetIndex].asset;$('catch-picture').alt=C.PLUSHES[s.targetIndex].name;$('catch-name').textContent=C.PLUSHES[s.targetIndex].name;$('catch-quality').textContent=s.pulseResult==='perfect'?'完美补夹 ✦':s.pulseResult==='good'?'一把救回来！':'今天的抱抱 +1';}
   }lastPhase=s.phase;}
   $('catch-pop').hidden=!(s.phase==='result'&&s.outcome==='won');
   $('result-card').hidden=s.phase!=='result';$('result-card').dataset.won=String(lastResult==='won');
   if(s.phase==='result'&&['missed','slipped'].includes(s.outcome))island?.offer($('result-card'),()=>{if(!c.revive())return false;endDrag();lastPhase='aim';lastResult=null;lastTime=null;render();drop.focus();return true;},()=>s.phase==='result'&&['missed','slipped'].includes(s.outcome));else island?.hide();
  }
  function doDrop(){joystick?.reset();if(s.phase==='lift'?c.reclose():c.drop()){$('aim-slider').closest('details').open=false;beep(false);render();}}
  drop.addEventListener('click',doDrop);again.addEventListener('click',()=>{if(c.nextRound())island?.reset();render();drop.focus();});
  $('aim-slider').addEventListener('input',e=>{c.aim(Number(e.target.value)/1000);render();});
  $('depth-slider').addEventListener('input',e=>{c.aimDepth(Number(e.target.value)/1000);render();});
  function aimPointer(e){const p=pointerPosition(e,stage);c.aim(p.x);c.aimDepth((p.y-.63)/.30);render();}
  stage.addEventListener('pointerdown',e=>{if(s.phase!=='aim'||e.button!==0)return;dragId=e.pointerId;stage.setPointerCapture(e.pointerId);aimPointer(e);});
  stage.addEventListener('pointermove',e=>{if(e.pointerId===dragId)aimPointer(e);});
  function endDrag(){dragId=null;}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);stage.addEventListener('lostpointercapture',endDrag);
  for(const direction of ['left','right','back','front']){const b=$('move-'+direction);let pointerHeld=false;
   b.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointerHeld=true;b.setPointerCapture(e.pointerId);c.hold(direction,true);});
   const release=()=>{pointerHeld=false;c.hold(direction,false);};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
   b.addEventListener('click',e=>{if(e.detail===0&&!pointerHeld){
    if(direction==='left'||direction==='right')c.aim(s.clawX+(direction==='left'?-.005:.005));
    else c.aimDepth(s.clawDepth+(direction==='back'?-.01:.01));render();}});
  }
  document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;
   const directions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'back',ArrowDown:'front'};
   if(directions[e.key]){e.preventDefault();c.hold(directions[e.key],true);}
   if(e.code==='Space'&&(e.target===$('joystick')||!e.target.closest('button,a'))){e.preventDefault();if(!e.repeat){s.phase==='result'?(c.nextRound(),island?.reset(),render()):doDrop();}}
  });
  document.addEventListener('keyup',e=>{const directions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'back',ArrowDown:'front'};if(directions[e.key])c.hold(directions[e.key],false);});
  window.addEventListener('blur',()=>{joystick?.reset();c.clearHeld();endDrag();});window.addEventListener('pagehide',()=>{joystick?.reset();c.setPaused(true);endDrag();});
  let drawerOpen=false;
  document.addEventListener('mobile-screen-drawer',e=>{drawerOpen=!!e.detail.open;c.setPaused(drawerOpen||document.hidden);endDrag();lastTime=null;render();});
  window.addEventListener('pageshow',()=>{c.setPaused(drawerOpen||document.hidden);lastTime=null;});
  document.addEventListener('visibilitychange',()=>{c.setPaused(drawerOpen||document.hidden);endDrag();lastTime=null;render();});
  $('sound-button').addEventListener('click',()=>{sound=!sound;$('sound-button').setAttribute('aria-pressed',String(sound));$('sound-button').textContent=sound?'声音：开':'声音：关';if(sound)beep(true);});
  collection();render();
  function frame(now){const dt=lastTime===null?0:Math.min((now-lastTime)/1000,.05);lastTime=now;c.tick(dt);render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
 }
 return {SAVE_KEY,createController,mount,pointerPosition};
});

