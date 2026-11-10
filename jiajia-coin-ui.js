(function(){
 'use strict';
 window.JiajiaCoinUI={async boot({createPhysics,createScene}){
  const C=window.JiajiaCoin,$=id=>document.getElementById(id),canvas=$('world'),island=window.IslandRevive.create({id:'jiajia-coin'});
  let restored=null,best=0;try{restored=C.restore(localStorage.getItem(C.SAVE_KEY));best=Number(localStorage.getItem(C.SAVE_KEY+'-best'))||0;}catch(_){}
  let game=restored?.game||C.create(crypto.getRandomValues(new Uint32Array(1))[0],best),physics=createPhysics(game,restored?.snapshot),scene=null,round=0,loadSequence=0,lastTime=null,lastSave=0,handled=false,aim=0,pointer=null,previousFocus=null;
  game.paused=true;island.reset(game.revives);
  const live=()=>!!scene&&!game.paused&&game.status==='playing'&&$('dialog').hidden;
  function persist(){try{localStorage.setItem(C.SAVE_KEY,C.save(game,physics.snapshot()));localStorage.setItem(C.SAVE_KEY+'-best',String(game.best));}catch(_){$('feedback').textContent='浏览器未允许存档，本次仍可继续玩';}}
  function clearInput(){if(pointer){try{canvas.releasePointerCapture(pointer.id);}catch(_){}pointer=null;}}
  function hud(){
   $('wallet').textContent=game.wallet;$('score').textContent=game.score;$('best').textContent=`最高 ${game.best}`;$('goal').textContent=`下一目标 ${C.level(game)*500}`;
   $('combo').hidden=game.combo<3;$('combo').textContent=`${game.combo} 连推 ×${C.multiplier(game)}`;
   $('drop').disabled=!live()||game.wallet<=0||game.cooldownMs>0||game.coins.length>=C.MAX_COINS;
   if(!game.wallet&&game.status==='playing')$('feedback').textContent=`等最后几轮推落 · ${Math.ceil((20000-game.emptyMs)/1000)}秒`;
  }
  function dialog(title,copy,actions){
   game.paused=true;lastTime=null;clearInput();island.hide();previousFocus=document.activeElement;$('dialog-title').textContent=title;$('dialog-copy').textContent=copy;$('dialog-actions').replaceChildren();
   for(const [label,action,primary]of actions){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.className='primary';b.addEventListener('click',action);$('dialog-actions').appendChild(b);}
   $('dialog').hidden=false;$('play').inert=true;hud();persist();$('dialog-actions').querySelector('button')?.focus({preventScroll:true});
  }
  function resume(){if(!scene||game.status!=='playing'||document.hidden)return;island.hide();$('dialog').hidden=true;$('play').inert=false;game.paused=false;clearInput();lastTime=performance.now();$('feedback').textContent='左右拖动选落点 · 轻点画面投一枚';hud();persist();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
  function pause(){if(!scene||game.status!=='playing'||!$('dialog').hidden)return;dialog('歇一会儿',`已得 ${game.score} 分 · 台面和硬币都已保存`,[['继续推币',resume,true],['重新开一局',confirmRestart]]);}
  function confirmRestart(){dialog('重新开一局？','本局积分和台面会重置，最高分保留。',[['继续当前这局',resume,true],['确认重开',restart]]);}
  function restart(){round++;clearInput();game=C.create(crypto.getRandomValues(new Uint32Array(1))[0],game.best);game.paused=true;physics=createPhysics(game);island.reset();handled=false;aim=0;load(false,true);}
  function settle(){if(game.status!=='lost'||handled)return;handled=true;dialog('可投币用完了',`本局 ${game.score} 分 · 最长 ${game.bestCombo} 连推\n去比邻岛找家家说话，回来补25枚接着推。`,[['重新开一局',restart,true]]);
   const attempt=round,current=game;island.offer($('revive-host'),()=>{if(attempt!==round||current!==game||game.status!=='lost'||!scene)return false;if(!C.revive(game))return false;handled=false;dialog('补好25枚了',`台面和 ${game.score} 分都留着，准备好再继续。`,[['继续推币',resume,true]]);persist();return true;},()=>attempt===round&&current===game&&game.status==='lost'&&!!scene);
  }
  function drop(){if(!live())return;if(game.coins.length>=C.MAX_COINS){$('feedback').textContent='台面满了，等推板推出一些空间';return;}const c=C.drop(game);if(!c)return;physics.add(c,aim);$('feedback').textContent=c.kind==='silver'?'银币入槽返3枚，瞄准前沿的币堆':'看准推板退回时，把币落在币堆后面';hud();persist();}
  function failed(){scene?.dispose();scene=null;handled=false;dialog('画面暂时没能打开','请重试加载；本局台面和进度已保存。',[['重试加载',()=>load(true),true]]);}
  async function load(again=false,start=false){const token=++loadSequence;scene?.dispose();scene=null;dialog('正在准备推币机','硬币台面马上就来…',[]);
   try{const loaded=await createScene(canvas,physics);if(token!==loadSequence){loaded.dispose();return;}scene=loaded;scene.resize();handled=false;if(game.status==='lost')settle();else if(start){if(document.hidden)dialog('准备好了','台面已保存，回来点继续推币。',[['继续推币',resume,true]]);else resume();}else dialog(again?'画面已恢复':restored?'接着上次推':'家家推币机',restored?'台面已保存，点继续接着玩。':'左右拖动选落点，轻点画面或点“投一枚”。\n前沿掉进槽里返币，侧边掉落不返。',[['开始推币',resume,true],['怎么玩',help]]);}
   catch(_){if(token===loadSequence)failed();}
  }
  function help(){dialog('怎么玩','拖动选择落点，点画面或按钮投一枚。推板会来回挤动币堆。\n金币入前槽：10分、返1枚；银币：50分、返3枚。侧边掉落不计分。\n连续入槽有加分倍率。币用完仍等20秒，没币回收再结算，每局能去比邻岛复活两次。',[['知道了，继续推',resume,true]]);}
  canvas.addEventListener('pointerdown',e=>{if(pointer&&pointer.id!==e.pointerId){clearInput();return;}if(!live()||pointer||e.isPrimary===false||(e.button!==undefined&&e.button!==0))return;e.preventDefault();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};aim=Math.max(-2.95,Math.min(2.95,scene.aimAt(e.clientX)));try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
  canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>12)pointer.moved=true;aim=Math.max(-2.95,Math.min(2.95,scene.aimAt(e.clientX)));});
  canvas.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const tap=!pointer.moved&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<=12;clearInput();if(tap)drop();});
  canvas.addEventListener('pointercancel',e=>{if(pointer?.id===e.pointerId)clearInput();});canvas.addEventListener('lostpointercapture',clearInput);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();loadSequence++;failed();});
  $('drop').addEventListener('click',drop);$('pause').addEventListener('click',pause);$('help').addEventListener('click',help);
  window.addEventListener('keydown',e=>{if(!$('dialog').hidden){if(e.key==='Tab'){const buttons=[...$('dialog').querySelectorAll('button,a[href]')].filter(b=>!b.disabled&&!b.hidden&&b.getClientRects().length),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}return;}if(e.code==='Space'&&!e.repeat&&!['BUTTON','A','INPUT'].includes(e.target?.tagName)){e.preventDefault();drop();}else if(e.key==='Escape')pause();});
  window.addEventListener('blur',()=>{clearInput();pause();});window.addEventListener('pagehide',()=>{clearInput();pause();lastTime=null;persist();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
  function resize(){clearInput();scene?.resize();}window.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>{clearInput();pause();resize();});
  function frame(now){if(live()){const ms=lastTime===null?0:now-lastTime;lastTime=now;const r=physics.step(ms);for(const event of r.events)C.collect(game,event.id,event.front);C.tick(game,r.advancedMs);if(r.events.some(e=>e.front))$('feedback').textContent=`入槽了！已回收 ${game.returned} 枚`;hud();settle();if(now-lastSave>=1000){persist();lastSave=now;}}else lastTime=null;if(scene)scene.render(aim);requestAnimationFrame(frame);}
  requestAnimationFrame(frame);persist();await load();
 }};
})();
