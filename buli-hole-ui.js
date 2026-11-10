(function(){
 'use strict';
 const H=window.BuliHole,$=id=>document.getElementById(id),canvas=$('world'),island=window.IslandRevive.create({id:'buli-hole'});
 let game=null,hadSave=false,scene=null,loaded=false,round=0,loadSequence=0,loadFactory=null,handled=false,lastTime=null,lastRender=null,lastSave=0,lastHud='',windowBlurred=false;
 let stick={x:0,y:0},drag={x:0,y:0},dragOwner=null,dragStart=null,joystick=null,pendingEvents=[],rewardTimer=null,previousFocus=null;
 const keys=new Set(),format=ms=>`${Math.floor(Math.ceil(ms/1000)/60).toString().padStart(2,'0')}:${(Math.ceil(ms/1000)%60).toString().padStart(2,'0')}`;
 function seed(){return crypto.getRandomValues(new Uint32Array(1))[0];}
 try{game=H.restore(localStorage.getItem(H.SAVE_KEY));hadSave=!!game;}catch(_){}
 if(!game)game=H.create(1,seed());island.reset(game.revives);round++;
 const live=()=>loaded&&game.status==='playing'&&!game.paused&&$('dialog').hidden;
 function persist(){if(!game)return;try{localStorage.setItem(H.SAVE_KEY,H.save(game));}catch(_){$('feedback').textContent='浏览器未允许存档，本次仍可继续玩';}}
 function resetDrag(){const old=dragOwner;dragOwner=dragStart=null;drag={x:0,y:0};if(old!==null)try{canvas.releasePointerCapture(old);}catch(_){} }
 function resetInput(){keys.clear();stick={x:0,y:0};resetDrag();joystick?.reset();}
 function refresh(){joystick?.refresh();$('pause').disabled=!loaded;$('help').disabled=!loaded;}
 function movement(){
  let v=stick.x||stick.y?stick:drag.x||drag.y?drag:{x:(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),y:(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0)};
  // Screen-right and screen-down basis of the fixed isometric camera.
  return{x:v.x*.774+v.y*.633,z:-v.x*.633+v.y*.774};
 }
 function syncClock(){const now=performance.now();if(loaded&&lastTime!==null)pendingEvents.push(...H.step(game,movement(),Math.max(0,now-lastTime)));lastTime=live()?now:null;}
 function hud(){
  const signature=[game.level,Math.ceil(game.remainingMs/1000),game.mass,game.eaten.length].join(':');if(signature===lastHud)return;lastHud=signature;
  $('district').textContent=`街区 ${game.level}`;$('clock').textContent=format(game.remainingMs);$('clock').classList.toggle('urgent',game.remainingMs<=20000);
  $('size').textContent=`体型 ${(H.radius(game)/.62).toFixed(1)}×`;$('count').textContent=`已吞 ${game.eaten.length} 件 · ${game.mass} 分`;$('goal').textContent=`目标 ${game.target} 分`;
  const percent=Math.min(100,Math.floor(game.mass/game.target*100));$('progress-fill').style.width=percent+'%';$('progress').setAttribute('aria-valuenow',String(percent));
  let best=null;for(const t of Object.values(H.TYPES))if(t.radius*1.06<=H.radius(game)&&(!best||t.radius>best.radius))best=t;
  $('feedback').textContent=game.mass?`现在能吞${best?.label||'小物件'}了`:'先吞路边的路锥和箱子';
 }
 function hideDialog(){island.hide();$('dialog').hidden=true;canvas.inert=false;refresh();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function dialog(title,copy,actions){
  resetInput();game.paused=true;lastTime=null;island.hide();previousFocus=document.activeElement;$('dialog-title').textContent=title;$('dialog-copy').textContent=copy;$('dialog-actions').replaceChildren();
  actions.forEach(([label,action,primary])=>{const button=document.createElement('button');button.type='button';button.textContent=label;if(primary)button.className='primary';button.addEventListener('click',action);$('dialog-actions').appendChild(button);});
  $('dialog').hidden=false;canvas.inert=true;refresh();$('dialog-actions').querySelector('button')?.focus({preventScroll:true});persist();
 }
 function resume(){if(!loaded||game.status!=='playing'||document.hidden)return;resetInput();hideDialog();game.paused=false;windowBlurred=false;lastTime=performance.now();refresh();persist();}
 function restart(){round++;island.reset();resetInput();pendingEvents=[];game=H.create(game.level,game.seed);handled=false;lastTime=null;scene.setGame(game);hud();hideDialog();persist();if(document.hidden)pause();else resume();}
 function nextStreet(){round++;island.reset();resetInput();pendingEvents=[];game=H.create(game.level+1,seed());handled=false;lastTime=null;scene.setGame(game);hud();hideDialog();persist();if(document.hidden)pause();else resume();}
 function settle(){
  hud();if(game.status==='playing'||handled)return;handled=true;resetInput();lastTime=null;persist();
  if(game.status==='won')dialog('这片街区，吃下啦',`吞掉 ${game.eaten.length} 件 · 得到 ${game.mass} 分\n下一片街区换一组新的房子和车辆。`,[['下一街区',nextStreet,true],['再吞这一局',restart]]);
  else{dialog('时间到了',`已经吞掉 ${game.eaten.length} 件，得到 ${game.mass} 分。\n复活保留体型和街区进度，再给45秒。`,[['重开这一局',restart]]);const identity=round,failed=game;
   island.offer($('revive-host'),()=>{if(round!==identity||game!==failed||!H.revive(game))return false;handled=false;resetInput();hud();persist();dialog('卟哩又能吃啦',`体型和街区都保留了。\n本局剩余 ${2-game.revives} 次复活，点继续才会计时。`,[['继续吞吞城',resume,true],['重开这一局',restart]]);return true;},()=>round===identity&&game===failed&&game.status==='lost');
  }
 }
 function pause(){if(!loaded||game.status!=='playing')return;syncClock();if(game.status!=='playing'){settle();return;}dialog('卟哩歇一会儿',`街区 ${game.level} · 已吞 ${game.eaten.length} 件\n时间暂停，当前街区会自动保存。`,[['继续吞吞城',resume,true],['重开这一局',restart]]);}
 function loadFailed(){loaded=false;resetInput();lastTime=null;dialog('街区没能加载','请检查网络后重试，或换用Safari、Chrome浏览器。\n加载期间不会计时。',[['重新加载',()=>loadFactory?window.BuliHoleUI.boot(loadFactory):window.location.reload(),true]]);}
 window.BuliHoleUI={async boot(factory){
  loadFactory=factory;const identity=++loadSequence;loaded=false;lastTime=null;resetInput();scene?.dispose();scene=null;
  $('dialog-title').textContent='正在准备街区';$('dialog-copy').textContent='小城镇马上就来…';$('dialog-actions').replaceChildren();$('dialog').hidden=false;refresh();
  try{const candidate=await factory(canvas,(done,total)=>{if(identity===loadSequence)$('dialog-copy').textContent=`小城镇马上就来… ${done}/${total}`;});
   if(identity!==loadSequence){candidate.dispose();return;}scene=candidate;loaded=true;handled=false;scene.setGame(game);size();hud();
   if(game.status!=='playing')settle();else if(hadSave)dialog('接着上次吞',`街区 ${game.level} · 已吞 ${game.eaten.length} 件\n位置、体型、时间和复活次数都保留了。`,[['继续吞吞城',resume,true],['重开这一局',restart]]);else if(document.hidden||windowBlurred)pause();else resume();hadSave=true;
  }catch(_){if(identity===loadSequence)loadFailed();}
 }};
 joystick=window.TouchJoystick.create({element:$('joystick'),thumb:$('thumb'),analog:true,enabled:()=>live()&&dragOwner===null,onChange:value=>{stick={x:value.x,y:value.y};}});
 canvas.addEventListener('pointerdown',event=>{if(!live()||event.button!==0||event.isPrimary===false||dragOwner!==null||joystick.active)return;event.preventDefault();dragOwner=event.pointerId;dragStart={x:event.clientX,y:event.clientY};try{canvas.setPointerCapture(dragOwner);}catch(_){} });
 canvas.addEventListener('pointermove',event=>{if(event.pointerId!==dragOwner||!live())return;event.preventDefault();let x=(event.clientX-dragStart.x)/64,y=(event.clientY-dragStart.y)/64;const magnitude=Math.max(1,Math.hypot(x,y));x/=magnitude;y/=magnitude;drag=Math.hypot(x,y)<.15?{x:0,y:0}:{x,y};});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(event.pointerId===dragOwner)resetDrag();});
 canvas.addEventListener('contextmenu',event=>event.preventDefault());
 $('pause').addEventListener('click',pause);$('help').addEventListener('click',()=>{if(!loaded||game.status!=='playing')return;syncClock();if(game.status!=='playing'){settle();return;}
  dialog('先吃小的，再吞大的','按住圆形摇杆滑动，或在场景里按住拖动。\n松手停下，先吞路锥、箱子和花盆。\n洞口会越吃越大，接着吞树、汽车和房子。\n达到目标分数就能进入新街区；失败每局可去比邻岛复活两次。',[['明白，继续',resume,true]]);
  const link=document.createElement('a');link.href='https://kenney.nl/assets/city-kit-suburban';link.target='_blank';link.rel='noopener noreferrer';link.className='source-link';link.textContent='城镇模型：Kenney · CC0';$('dialog-actions').appendChild(link);
 });
 function size(){resetInput();document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px');const rect=canvas.getBoundingClientRect();if(scene)scene.resize(rect.width,rect.height);refresh();}
 window.addEventListener('resize',size);window.visualViewport?.addEventListener('resize',size);window.addEventListener('orientationchange',size);
 window.addEventListener('blur',()=>{windowBlurred=true;pause();resetInput();});window.addEventListener('focus',()=>{windowBlurred=false;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();resetInput();}});window.addEventListener('pagehide',()=>{syncClock();game.paused=true;resetInput();lastTime=null;persist();});
 document.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(key==='escape'&&live()){event.preventDefault();pause();return;}
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)&&live()){event.preventDefault();keys.add(key);}
  if(event.key==='Tab'&&!$('dialog').hidden){const controls=[...$('dialog-actions').querySelectorAll('button:not(:disabled),a[href]'),...$('revive-host').querySelectorAll('button:not(:disabled),a[href]')].filter(e=>!e.hidden&&e.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 });document.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
 window.addEventListener('error',()=>{if(!loaded)loadFailed();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();loaded=false;loadFailed();});
 function frame(now){
  syncClock();const dt=lastRender===null?16:Math.max(0,now-lastRender);lastRender=now;
  if(scene&&loaded&&!document.hidden){const events=pendingEvents;pendingEvents=[];scene.render(game,events,dt);if(events.length){$('reward').textContent='+'+events.reduce((sum,e)=>sum+e.mass,0);$('reward').classList.remove('reward-pop');void $('reward').offsetWidth;$('reward').classList.add('reward-pop');clearTimeout(rewardTimer);rewardTimer=setTimeout(()=>$('reward').classList.remove('reward-pop'),800);}hud();settle();}
  if(loaded&&now-lastSave>=1000){persist();lastSave=now;}requestAnimationFrame(frame);
 }
 refresh();size();requestAnimationFrame(frame);
})();
