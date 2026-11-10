(function(){
 'use strict';
 const D=window.BuliDifference,scenes=window.DifferenceScenes,$=id=>document.getElementById(id),surfaces=[$('original'),$('changed')];
 let progress;try{progress=D.readProgress(localStorage.getItem(D.SAVE_KEY));}catch(_){progress=D.readProgress(null);}
 let game,round=0,loaded=false,lastTime=null,handled=false,hintUsed=false,hintTimer=null,previousFocus=null,lastHud='';
 const revive=window.IslandRevive.create({id:'buli-difference'});
 const format=ms=>{const s=Math.ceil(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
 function fit(){const rect=$('board').getBoundingClientRect(),ratio=scenes[game?.level]?.aspect||4/3,gap=matchMedia('(max-height:420px)').matches?5:7,width=Math.max(0,Math.min(rect.width,(rect.height-gap)/2*ratio)),height=width/ratio;for(const s of surfaces){s.style.width=width+'px';s.style.height=height+'px';}}
 function sizeViewport(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px');fit();}
 function drawHud(){
  const signature=[round,Math.ceil(game.remainingMs/1000),game.found.length,game.mistakes,hintUsed,loaded,game.status,game.paused].join(':');if(signature===lastHud)return;lastHud=signature;
  $('clock').textContent=format(game.remainingMs);$('clock').classList.toggle('urgent',game.remainingMs<=20000);$('choose').innerHTML=`第 ${game.level+1} / ${scenes.length} 关 <span aria-hidden="true">⌄</span>`;
  $('progress').replaceChildren(...Array.from({length:5},(_,i)=>{const n=document.createElement('i');if(i<game.found.length)n.className='found';return n;}));$('progress').setAttribute('aria-label',`已找到${game.found.length}处`);
  $('lives').replaceChildren(...Array.from({length:3},(_,i)=>{const n=document.createElement('img');n.src='vendor/heart.svg';n.alt='';if(i>=3-game.mistakes)n.className='empty';return n;}));$('lives').setAttribute('aria-label',`剩余${3-game.mistakes}次容错`);
  $('hint-count').textContent=hintUsed?'0':'1';$('hint').disabled=hintUsed||!loaded||game.status!=='playing'||game.paused;
 }
 function marker(index,className='found-marker'){
  const r=D.LEVELS[game.level].regions[index];for(const s of surfaces){const n=document.createElement('i');n.className=className;n.dataset.region=index;n.style.cssText=`left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%`;s.appendChild(n);}
 }
 function hideDialog(){revive.hide();$('dialog').hidden=true;$('scene-picker').hidden=true;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function dialog(title,description,actions){
  lastTime=null;D.pause(game);previousFocus=document.activeElement;$('dialog-title').textContent=title;$('dialog-description').textContent=description;$('dialog-actions').replaceChildren();$('scene-picker').hidden=true;
  for(const [text,action,primary] of actions){const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.addEventListener('click',action);$('dialog-actions').appendChild(b);}
  $('dialog').hidden=false;drawHud();$('dialog-actions').querySelector('button')?.focus({preventScroll:true});
 }
 function continueGame(){if(!loaded||game.status!=='playing'||document.hidden)return;hideDialog();D.resume(game);lastTime=performance.now();drawHud();}
 function pauseGame(){if(!loaded||game.status!=='playing')return;dialog('已暂停','时间停在这里，准备好了再继续。',[['继续找不同',continueGame,true],['重新开始',()=>start(game.level)],['选择关卡',choose]]);}
 function settle(){
  drawHud();if(game.status==='playing'||handled)return;handled=true;lastTime=null;
  if(game.status==='won'){
   progress=D.record(progress,game);try{localStorage.setItem(D.SAVE_KEY,JSON.stringify(progress));}catch(_){}
   dialog('全部找到了',`第 ${game.level+1} 幅 · 用时 ${format(game.elapsedMs)} · 已找到 5 / 5`,[['下一幅',()=>start((game.level+1)%scenes.length),true],['再找一次',()=>start(game.level)],['选择关卡',choose]]);
  }else{
   dialog(game.reason==='time'?'时间到了':'休息一下',`已找到 ${game.found.length} / 5 处。复活后保留进度，补回三次容错与至少 60 秒。`,[['重新开始',()=>start(game.level),true],['选择关卡',choose]]);
   const identity=round;revive.offer($('revive-host'),()=>{
    if(identity!==round||!D.revive(game))return false;handled=false;lastTime=null;drawHud();dialog('已经恢复','进度保留了。现在有三次容错，点继续再开始计时。',[['继续找不同',continueGame,true],['重新开始',()=>start(game.level)]]);return true;
   },()=>identity===round&&game.status==='lost');
  }
 }
 const details={
  'hair-clip':'<path d="M9 29l23-15 5 5-23 15z" fill="#c79863" stroke="#694436" stroke-width="1.6"/><path d="M13 29l20-13" stroke="#f3d49e" stroke-width="2"/>',
  pearl:'<circle cx="24" cy="24" r="8" fill="#e7d1a6" stroke="#826945" stroke-width="1.6"/><circle cx="22" cy="21" r="3" fill="#fff7db"/>',
  'edge-seam':'<path d="M5 26l38-5" stroke="#493932" stroke-opacity=".65" stroke-width="3"/><path d="M6 24l35-5" stroke="#ceb593" stroke-width="1.4" stroke-dasharray="4 2"/>',
  'flower-brooch':'<path d="M24 14c8-7 13 0 12 5 8 5 5 13-3 14-4 8-12 8-16 1-9-1-12-10-5-15 0-6 6-11 12-5z" fill="#d9a9a2" stroke="#865c5d" stroke-width="1.6"/><circle cx="24" cy="25" r="5" fill="#eecb8b" stroke="#987747"/>',
  'phone-ring':'<circle cx="24" cy="24" r="9" fill="none" stroke="#382f35" stroke-width="5"/><circle cx="24" cy="23" r="9" fill="none" stroke="#dbb581" stroke-width="2.8"/>',
  'paw-badge':'<path d="M14 29q10-16 20 0c4 10-8 5-10 5s-14 5-10-5z" fill="#bd7963"/><path d="M11 21h.5m7-7h.5m10 0h.5m7 7h.5" stroke="#bd7963" stroke-width="6" stroke-linecap="round"/>',
  'yarn-ball':'<circle cx="24" cy="23" r="13" fill="#b77364" stroke="#734737" stroke-width="1.5"/><path d="M13 20l22 8m-21-13 21 10m-14-14 12 11M15 29q21 11 27 2" fill="none" stroke="#e0aa8d" stroke-width="2"/>',
  'star-pin':'<path d="M24 8l5 10 12 2-9 8 2 12-10-6-11 6 2-12-8-8 12-2z" fill="#e8b86a" stroke="#9b6f47" stroke-width="1.9"/>',
  ribbon:'<path d="M24 23q-14-15-17-2t15 8l-5 10 8-4 6 4-2-10q16 5 14-8T24 23z" fill="#a66b86" stroke="#724857" stroke-width="1.8"/><circle cx="24" cy="26" r="4" fill="#dfadb1"/>',
  berry:'<path d="M24 34q-18-7-10-15 9-7 18 0 7 9-8 15z" fill="#db6c69" stroke="#a24347" stroke-width="1.6"/><path d="M17 17l6-6 6 5-4 4z" fill="#739360"/>',
  'case-clasp':'<path d="M12 18l23 3-2 10-23-3z" fill="#8d7779" stroke="#69585d"/><path d="M14 19l19 3-1 6-19-2z" fill="#d4c1ba"/>',
  'wing-pin':'<path d="M7 21l17 3 17-5-6 9-11 5-11-4z" fill="#bda075" stroke="#6e573f" stroke-width="1.5"/><path d="M12 23l12 5 12-5m-12 5v4" fill="none" stroke="#edcf95" stroke-width="1.3"/>',
  'packet-print':'<path d="M11 22l7-2m-6 5 6-2m4-4 4-1m-3 5 5-1m4-4 5-2m-4 5 5-2" stroke="#354c43" stroke-width="2.2" stroke-linecap="round"/>',
  'sleeve-tag':'<path d="M10 15l28 4-2 17-28-5z" fill="#517d9a" stroke="#295571" stroke-width="2"/><path d="M14 19l19 3m-19 5 13 2" stroke="#a1b9c7" stroke-width="1.6" stroke-dasharray="3 2"/>',
  'tie-clip':'<path d="M8 25l30-5 1 5-30 6z" fill="#94969e" stroke="#514f61" stroke-width="1.2"/><path d="M10 25l27-4" stroke="#f1eddf" stroke-width="1.8"/>',
  'welt-pocket':'<path d="M6 20l36-2-1 8-35 2z" fill="#4b5368" stroke="#38445b" stroke-width="1.2"/><path d="M7 20l34-2" stroke="#9097ae" stroke-width="1.8"/>',
  'strap-stud':'<ellipse cx="24" cy="24" rx="8" ry="10" fill="#9b7753" stroke="#4c3526" stroke-width="2"/><path d="M21 20l6 7" stroke="#d3b695" stroke-width="2" stroke-linecap="round"/>',
  'bracelet-charm':'<path d="M25 14v6m0 0c-10-6-10 7-2 11 9-2 12-14 2-11z" fill="#ba9764" stroke="#735d42" stroke-width="1.5"/><path d="M20 23q0-2 3-2" fill="none" stroke="#edd29f" stroke-width="1.5"/>',
  'seat-stitch':'<path d="M4 30q20-16 39-16" fill="none" stroke="#361a27" stroke-width="3"/><path d="M4 28q20-16 39-16" fill="none" stroke="#99616c" stroke-width="1.6" stroke-dasharray="3 2"/>',
  'stage-light':'<path d="M12 19l21 3-1 8-21-3z" fill="#232447"/><path d="M15 22l14 2-1 4-14-2z" fill="#a2a8ef"/>',
  'tuning-peg':'<path d="M10 20l18 5-1 4-18-5z" fill="#8a7a9b"/><path d="M28 20l8 2-2 11-8-2z" fill="#aea6be" stroke="#5b4d74" stroke-width="1.2"/>',
  'shirt-patch':'<path d="M14 13l23 7-3 17-24-5z" fill="#dfc4a9" stroke="#8a6164" stroke-width="1.5"/><path d="M23 19l2 5 6 1-5 3v5l-4-4-5 1 3-5-2-5z" fill="#954a57"/>',
  'guitar-knob':'<ellipse cx="24" cy="26" rx="10" ry="8" fill="#260f1e"/><ellipse cx="24" cy="23" rx="8" ry="7" fill="#53353d"/><path d="M24 19v5" stroke="#e3c7b3" stroke-width="1.8" stroke-linecap="round"/>',
  'cuff-button':'<circle cx="24" cy="24" r="8" fill="#e9e4d9" stroke="#a6a4a1" stroke-width="1.8"/><path d="M22 23h.5m4 2h.5" stroke="#757273" stroke-width="2.4" stroke-linecap="round"/>',
  'speaker-plate':'<path d="M7 18h34v12H7z" fill="#34312c" stroke="#7e7767" stroke-width="1.4"/><path d="M15 24h18" stroke="#8c8475" stroke-width="2" stroke-dasharray="3 2"/>',
  'speaker-lights':'<path d="M6 18h36v12H6z" fill="#1f2827" stroke="#36443c"/><path d="M11 24h5m5 0h5m5 0h5" stroke="#82ad8f" stroke-width="3"/>'
 };
 function makeChanges(scene){
  for(const r of D.LEVELS[game.level].regions){
   const patch=document.createElement('span');
   patch.className='change-region';
   patch.setAttribute('aria-hidden','true');
   patch.style.cssText=`left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%`;
   if(r.copy){
    const [x,y]=r.copy,img=document.createElement('img');
    patch.classList.add('photo-retouch');
    img.src=scene.src;img.alt='';img.draggable=false;
    img.style.cssText=`width:${100/r.w}%;height:${100/r.h}%;left:${-x/r.w*100}%;top:${-y/r.h*100}%`;
    cropPhoto(img,scene);
    patch.appendChild(img);
   }else{
    const detail=document.createElementNS('http://www.w3.org/2000/svg','svg');
    detail.setAttribute('viewBox','0 0 48 48');
    detail.innerHTML=details[r.detail];
    patch.appendChild(detail);
   }
   $('changed').appendChild(patch);
  }
 }
 function cropPhoto(image,scene){
  image.style.objectPosition=`50% ${scene.positionY*100}%`;
  image.style.objectFit=scene.illustration?'contain':'cover';
 }
 function start(level){
  round++;const identity=round;revive.reset();clearTimeout(hintTimer);game=D.create(level);loaded=false;handled=false;hintUsed=false;lastTime=null;hideDialog();for(const s of surfaces){s.querySelectorAll('.change-region,.found-marker,.hint-marker,.wrong-marker').forEach(n=>n.remove());s.querySelector('.base-photo').removeAttribute('src');}drawHud();fit();
  dialog('照片加载中','准备两幅可以仔细对照的照片…',[]);
  const scene=scenes[game.level];if(!scene){loadError(identity);return;}
  const photo=new Image();photo.onload=()=>{
   if(identity!==round)return;for(const s of surfaces){const image=s.querySelector('.base-photo');s.classList.toggle('illustration',!!scene.illustration);image.src=scene.src;cropPhoto(image,scene);}makeChanges(scene);loaded=true;hideDialog();fit();$('feedback').textContent='找出 5 处不同';
   if(document.hidden||!document.hasFocus())pauseGame();else continueGame();
  };photo.onerror=()=>loadError(identity);photo.src=scene.src;
 }
 function loadError(identity){if(identity!==round)return;loaded=false;dialog('照片没能加载','请检查网络，然后重试。加载期间不会计时。',[['重新加载',()=>start(game.level),true],['选择关卡',choose]]);}
 function choose(){
  revive.hide();dialog('选择关卡',`共 ${scenes.length} 关 · 每关五处不同`,[['返回',()=>loaded&&game.status==='playing'?pauseGame():start(game.level)]]);
  const groups=[scenes.filter(s=>!s.illustration),scenes.filter(s=>s.illustration)],pageSize=6;
  const groupButtons=[$('pick-photos'),$('pick-illustrations')],prev=$('scene-prev'),next=$('scene-next');
  let group=Number(!!scenes[game.level].illustration);
  let page=Math.floor(groups[group].findIndex(s=>s.id===game.level)/pageSize);
  function renderPage(){
   const pool=groups[group],total=Math.ceil(pool.length/pageSize);
   const cards=pool.slice(page*pageSize,(page+1)*pageSize).map(scene=>{
    const button=document.createElement('button'),image=document.createElement('img'),title=document.createElement('span'),best=document.createElement('small');
    button.type='button';button.className='scene-option'+(scene.id===game.level?' active':'');
    image.src=scene.src;image.alt='';cropPhoto(image,scene);
    title.textContent=scene.title;
    best.textContent=progress.bests[scene.id]===undefined?'待探索':`最佳 ${format(progress.bests[scene.id])}`;
    button.append(image,title,best);button.onclick=()=>start(scene.id);return button;
   });
   $('scene-list').replaceChildren(...cards);
   groupButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===group)));
   $('scene-page').textContent=`${page+1} / ${total}`;
   prev.disabled=page===0;next.disabled=page===total-1;
  }
  groupButtons.forEach((button,index)=>button.onclick=()=>{group=index;page=0;renderPage();});
  prev.onclick=()=>{page--;renderPage();};next.onclick=()=>{page++;renderPage();};
  $('scene-picker').hidden=false;renderPage();groupButtons[group].focus({preventScroll:true});
 }
 function showHelp(){
  if(!loaded||game.status!=='playing')return;revive.hide();dialog('找出五处不同','对比上下两张照片。找找少了的道具、多出来的配饰或变了的细节，点任一张图都算。点错三次或两分钟用完会结束；每局可去比邻岛复活两次。',[['明白，继续',continueGame,true]]);
  const scene=scenes[game.level];if(scene){const p=document.createElement('p');p.className='source-credit';p.textContent=scene.credit;$('dialog-actions').appendChild(p);}
 }
 function hint(){
  if(hintUsed||!loaded||game.paused||game.status!=='playing')return;hintUsed=true;marker(D.LEVELS[game.level].regions.findIndex((_,i)=>!game.found.includes(i)),'hint-marker');$('feedback').textContent='看看金色圆圈里的细节';drawHud();const identity=round;hintTimer=setTimeout(()=>{if(identity!==round)return;surfaces.forEach(s=>s.querySelectorAll('.hint-marker').forEach(n=>n.remove()));$('feedback').textContent='找出 5 处不同';},2000);
 }
 for(const s of surfaces)s.addEventListener('click',event=>{
  if(!loaded||game.paused||game.status!=='playing'||event.button>0)return;event.preventDefault();const r=s.getBoundingClientRect();if(!r.width||!r.height)return;const x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height,now=performance.now(),dt=lastTime===null?0:Math.max(0,now-lastTime);lastTime=now;
  const result=D.hit(game,x,y,dt,.015);if(result.kind==='found'){marker(result.index);$('feedback').textContent=`找到了 ${game.found.length} / 5 处`;}else if(result.kind==='wrong'){const n=document.createElement('span');n.className='wrong-marker';n.textContent='×';n.style.left=x*100+'%';n.style.top=y*100+'%';s.appendChild(n);setTimeout(()=>n.remove(),650);$('feedback').textContent='这里一样，再仔细看看';}settle();
 });
 $('pause').addEventListener('click',pauseGame);$('choose').addEventListener('click',choose);$('help').addEventListener('click',showHelp);$('hint').addEventListener('click',hint);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){lastTime=null;if(game?.status==='playing'&&loaded)pauseGame();}});window.addEventListener('blur',()=>{lastTime=null;if(game?.status==='playing'&&loaded)pauseGame();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&loaded&&game.status==='playing'){event.preventDefault();if($('dialog').hidden)pauseGame();}if(event.key==='Tab'&&!$('dialog').hidden){const buttons=[...$('dialog').querySelectorAll('button:not(:disabled),a[href]')].filter(n=>!n.hidden&&n.getClientRects().length);if(!buttons.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 window.addEventListener('resize',sizeViewport);window.visualViewport?.addEventListener('resize',sizeViewport);
 function frame(now){if(game&&loaded&&!game.paused&&game.status==='playing'){if(lastTime!==null)D.tick(game,Math.max(0,now-lastTime));lastTime=now;settle();}else lastTime=null;requestAnimationFrame(frame);}
 sizeViewport();start(Math.min(scenes.length-1,progress.unlocked-1));requestAnimationFrame(frame);
})();
