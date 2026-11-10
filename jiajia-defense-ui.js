(function(){
 'use strict';
 const M=window.JiajiaDefense,$=id=>document.getElementById(id),canvas=$('battlefield'),ctx=canvas.getContext('2d'),terrain=document.createElement('canvas'),tile=64,art={},island=window.IslandRevive.create({id:'jiajia-defense'});
 const spriteIds=[1,23,24,25,38,47,50,130,131,180,203,245,246,247,249,250,251,273,275];
 let save=M.normalizeSave(null),storageFailed=false,s,kind='rapid',selected=null,cursor=null,ready=false,loading=false,offered=false,round=0,recorded=false,last=performance.now(),hudClock=0,tip='',press=null;
 terrain.width=640;terrain.height=768;
 try{localStorage.getItem(M.SAVE_KEY);save=M.load(localStorage);}catch(_){storageFailed=true;}
 function store(){try{if(!M.persist(localStorage,save))storageFailed=true;}catch(_){storageFailed=true;}}
 function sprite(context,id,x,y,size=64,angle=0){const img=art[id];if(!img)return;context.save();context.translate(x,y);context.rotate(angle);context.drawImage(img,-size/2,-size/2,size,size);context.restore();}
 function road(x,y){return s.path.some(p=>p.x===x&&p.y===y);}
 function makeTerrain(){
  if(!ready)return;const t=terrain.getContext('2d');t.clearRect(0,0,640,768);
  for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++)t.drawImage(art[24],x*tile,y*tile,tile,tile);
  for(const p of s.path){const x=p.x*tile,y=p.y*tile;t.drawImage(art[50],x,y,tile,tile);
   if(p.x>0&&!road(p.x-1,p.y))t.drawImage(art[25],0,0,32,64,x,y,32,64);
   if(p.x<s.cols-1&&!road(p.x+1,p.y))t.drawImage(art[23],32,0,32,64,x+32,y,32,64);
   if(p.y>0&&!road(p.x,p.y-1))t.drawImage(art[47],0,0,64,32,x,y,64,32);
   if(p.y<s.rows-1&&!road(p.x,p.y+1))t.drawImage(art[1],0,32,64,32,x,y+32,64,32);
  }
  const end=s.path[s.path.length-1];sprite(t,180,(end.x+.5)*tile,(end.y+.5)*tile,62);
  t.fillStyle='#213e33';t.font='bold 16px "Microsoft YaHei",sans-serif';t.textAlign='center';t.fillText('基地',(end.x+.5)*tile,(end.y+.5)*tile+5);
 }
 function paint(){
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,640,768);if(!ready)return;ctx.drawImage(terrain,0,0);
  for(let y=0;y<s.rows;y+=3)for(const x of [0,9])if(!road(x,y)&&!s.towers.some(t=>t.x===x&&t.y===y))sprite(ctx,(x+y)%2?131:130,(x+.5)*tile,(y+.5)*tile,43);
  if(s.phase==='build'&&s.wave===0&&!s.towers.length){
   const choices=[];for(let y=1;y<s.rows-1;y++)for(let x=1;x<s.cols-1;x++)if(M.canBuild(s,x,y))choices.push({x,y,n:s.path.filter(p=>Math.hypot(p.x-x,p.y-y)<2.4).length});
   choices.sort((a,b)=>b.n-a.n);const marked=[];for(const p of choices){if(marked.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<2))continue;sprite(ctx,38,(p.x+.5)*tile,(p.y+.5)*tile,60);marked.push(p);if(marked.length===3)break;}
  }
  const chosen=s.towers.find(t=>t.id===selected);
  if(chosen){const range=M.TOWERS[chosen.kind].range+(chosen.level-1)*.23;ctx.beginPath();ctx.arc((chosen.x+.5)*tile,(chosen.y+.5)*tile,range*tile,0,Math.PI*2);ctx.fillStyle='#f6e9a526';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff6b999';ctx.stroke();}
  if(cursor&&['build','playing'].includes(s.phase)){ctx.strokeStyle=M.canBuild(s,cursor.x,cursor.y)?'#fff9c8':'#ffcf9b';ctx.lineWidth=3;ctx.strokeRect(cursor.x*tile+3,cursor.y*tile+3,58,58);}
  for(const tower of s.towers){const x=(tower.x+.5)*tile,y=(tower.y+.5)*tile;sprite(ctx,180,x,y,56);sprite(ctx,M.TOWERS[tower.kind].sprite,x,y,60,tower.angle);if(tower.level>1){ctx.fillStyle='#fff5cd';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText(tower.level===2?'Ⅱ':'Ⅲ',x,y+27);}}
  for(const enemy of s.enemies){const p=M.position(s,enemy),x=(p.x+.5)*tile,y=(p.y+.5)*tile;sprite(ctx,[245,246,247][enemy.kind],x,y,102,p.angle);ctx.fillStyle='#163b2ec9';ctx.fillRect(x-15,y-24,30,4);ctx.fillStyle=enemy.slowFor>0?'#d5edfa':'#f9dd79';ctx.fillRect(x-15,y-24,30*Math.max(0,enemy.hp/enemy.maxHp),4);}
  for(const shot of s.shots){const f=1-shot.life/shot.maxLife,x=(shot.x+(shot.tx-shot.x)*f+.5)*tile,y=(shot.y+(shot.ty-shot.y)*f+.5)*tile;sprite(ctx,M.TOWERS[shot.kind].shot,x,y,shot.kind==='cannon'?43:55,shot.angle);}
  if(s.breathing>0&&s.phase==='playing'){ctx.fillStyle='#213d32d9';ctx.fillRect(210,12,220,36);ctx.fillStyle='#f6f1d8';ctx.textAlign='center';ctx.font='bold 17px "Microsoft YaHei",sans-serif';ctx.fillText('重新集结 · '+Math.ceil(s.breathing)+' 秒',320,36);}
 }
 function syncHud(){
  $('lives').textContent=s.lives;$('coins').textContent=s.coins;$('wave').textContent=s.wave+' / '+s.totalWaves;$('revives-left').textContent=island.remaining();$('panel-revives').textContent=island.remaining();
  $('enemy-count').textContent=s.phase==='playing'?'场上 '+s.enemies.length+' · 待进场 '+(s.waveCount-s.spawned):s.phase==='build'?'布置防线':s.phase==='won'?'营地守住了':'战斗已停止';
  const tower=s.towers.find(t=>t.id===selected);$('upgrade').disabled=!tower||s.coins<M.upgradeCost(tower)||!['build','playing'].includes(s.phase);
 }
 function modal(dialog,open){if(open&&!dialog.open)dialog.showModal();else if(!open&&dialog.open)dialog.close();}
 function mapList(){
  $('map-list').replaceChildren(...M.maps.map((map,i)=>{const button=document.createElement('button');button.type='button';button.disabled=i>=save.unlocked;button.className=i===s.index?'current':'';const title=document.createElement('span');title.textContent=String(i+1).padStart(2,'0')+'  '+map.name;const note=document.createElement('small');note.textContent=i>=save.unlocked?'通关前图解锁':save.bestLives[i]?'最佳 '+save.bestLives[i]+' 生命':'尚未通关';button.append(title,note);button.addEventListener('click',()=>{modal($('map-dialog'),false);fresh(i);});return button;}));
 }
 function update(){
  if(s.phase==='won'&&!recorded){recorded=true;save=M.complete(save,s.index,s.lives);store();}
  $('map-name').textContent=s.name;$('map-number').textContent=(s.index+1)+' / '+M.maps.length;
  $('pause').disabled=!ready||!['build','playing','paused'].includes(s.phase);$('pause').setAttribute('aria-label',s.phase==='paused'?'继续游戏':'暂停游戏');
  const tower=s.towers.find(t=>t.id===selected);$('upgrade').hidden=!tower;$('upgrade').textContent=tower&&tower.level>=3?'已满级':'升级 '+(tower?M.upgradeCost(tower):'')+' 金';
  $('selection').textContent=tower?M.TOWERS[tower.kind].name+' · '+tower.level+' 级':M.TOWERS[kind].name+' · 点空草地建造';
  $('send-wave').hidden=s.phase!=='build';$('send-wave').disabled=!ready;$('send-wave').textContent='开始第 '+(s.wave+1)+' 波';
  for(const button of document.querySelectorAll('[data-tower]')){button.setAttribute('aria-pressed',String(!tower&&button.dataset.tower===kind));button.disabled=!ready;}
  $('status').textContent=tip||(s.phase==='build'?(s.wave?'波次完成！升级防线后，再开始下一波。':'弯道旁的浅色格适合建炮。先布防，再开始。'):s.phase==='playing'?'炮台自动攻击；战斗中也能建造和升级。':s.phase==='paused'?'战场已暂停，点击继续后再战。':'');
  const panel=['paused','lost','won'].includes(s.phase)&&!$('instructions').open&&!$('map-dialog').open;modal($('panel'),panel);
  if(panel){$('panel-title').textContent=s.phase==='won'?'防线守住了！':s.phase==='lost'?'基地失守':'战场已暂停';$('panel-copy').textContent=s.phase==='won'?s.name+' · 5波全部击退，剩余 '+s.lives+' 点生命。':s.phase==='lost'?'敌人突破了防线。去比邻岛后可恢复8点生命，保留炮台、金币和当前波次；复活后由你决定何时继续。':s.revives&&s.breathing?'防线与金币都保留了。当前敌人已清空，继续后有3秒集结时间。':'敌人、炮台和波次计时都已停下。准备好了，再继续。';$('panel-action').hidden=s.phase==='lost';$('panel-action').textContent=s.phase==='won'?(s.index+1<M.maps.length?'前往下一张地图':'六道防线完成 · 再玩一次'):'继续游戏';}
  $('storage-note').textContent=storageFailed?'当前浏览器无法保存进度；本次游戏仍可正常游玩。':'通关与最高剩余生命自动保存在当前浏览器。';
  if(s.phase==='lost'&&!offered){offered=true;const identity=s,token=round;island.offer($('panel-card'),()=>{if(s!==identity||round!==token||s.phase!=='lost'||!M.revive(s))return false;last=performance.now();tip='复活完成，布局与金币已保留。';queueMicrotask(update);return true;},()=>s===identity&&round===token&&s.phase==='lost');}
  else if(s.phase!=='lost'&&offered){offered=false;island.hide();}
  syncHud();paint();
 }
 function fresh(index){round++;island.reset();offered=false;recorded=false;selected=null;kind='rapid';cursor=null;press=null;tip='';s=M.create(index);save.selected=s.index;store();last=performance.now();makeTerrain();update();fit();}
 function fit(){const height=window.visualViewport?.height||window.innerHeight;$('defense-root').style.setProperty('--height',height+'px');document.documentElement.style.setProperty('--height',height+'px');const r=$('stage').getBoundingClientRect(),w=Math.max(0,Math.floor(Math.min(r.width,r.height*640/768)));canvas.style.width=w+'px';canvas.style.height=(w*768/640)+'px';}
 async function loadAssets(){
  if(loading)return;loading=true;ready=false;$('loading').hidden=false;$('retry-assets').hidden=true;$('loading-copy').textContent='正在载入原版地图素材…';update();
  try{await Promise.all(spriteIds.map(id=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{art[id]=img;resolve();};img.onerror=()=>reject(new Error(String(id)));img.src='assets/classics/tower/towerDefense_tile'+String(id).padStart(3,'0')+'.png';})));ready=true;$('loading').hidden=true;makeTerrain();fit();}
  catch(_){$('loading-copy').textContent='原版素材未能载入，请检查网络后重试。';$('retry-assets').hidden=false;}finally{loading=false;update();}
 }
 function boardPoint(event){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return null;const x=Math.floor((event.clientX-r.left)/r.width*s.cols),y=Math.floor((event.clientY-r.top)/r.height*s.rows);return x>=0&&y>=0&&x<s.cols&&y<s.rows?{x,y}:null;}
 function act(point){
  if(!ready||!point||!['build','playing'].includes(s.phase)||$('instructions').open||$('map-dialog').open)return;
  const tower=s.towers.find(t=>t.x===point.x&&t.y===point.y);cursor=point;
  if(tower){selected=tower.id;tip='已选 '+M.TOWERS[tower.kind].name+'；浅色圆圈是射程。';}else{selected=null;const result=M.build(s,point.x,point.y,kind);tip=result.ok?M.TOWERS[kind].name+'已建造。消灭敌人赚取金币。':result.reason;}update();
 }
 canvas.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;const point=boardPoint(event);if(!point)return;press={id:event.pointerId,x:event.clientX,y:event.clientY,point};cursor=point;canvas.setPointerCapture(event.pointerId);});
 canvas.addEventListener('pointerup',event=>{if(!press||press.id!==event.pointerId)return;const p=press;press=null;if(Math.hypot(event.clientX-p.x,event.clientY-p.y)<12)act(p.point);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);});
 canvas.addEventListener('pointercancel',()=>{press=null;cursor=null;});canvas.addEventListener('lostpointercapture',()=>{press=null;});
 canvas.addEventListener('keydown',event=>{if(!ready||!['build','playing'].includes(s.phase))return;const moves={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(moves[event.key]){event.preventDefault();const [dx,dy]=moves[event.key],p=cursor||{x:4,y:5};cursor={x:Math.max(0,Math.min(9,p.x+dx)),y:Math.max(0,Math.min(11,p.y+dy))};canvas.setAttribute('aria-label','第'+(cursor.y+1)+'行第'+(cursor.x+1)+'列，回车建造或选择炮台。');paint();}else if(event.key==='Enter'||event.key===' '){event.preventDefault();act(cursor||{x:4,y:5});}});
 for(const button of document.querySelectorAll('[data-tower]'))button.addEventListener('click',()=>{kind=button.dataset.tower;selected=null;tip=M.TOWERS[kind].name+'：'+(kind==='rapid'?'快速攻击单个敌人':kind==='cannon'?'攻击一片范围内的敌人':'减慢敌人，让其他炮台多打几轮')+'。点草地建造。';update();});
 $('upgrade').addEventListener('click',()=>{const result=M.upgrade(s,selected);tip=result.ok?'升级完成，伤害、射速与射程提升。':result.reason;update();});
 $('send-wave').addEventListener('click',()=>{if(ready&&M.startWave(s)){tip='';last=performance.now();update();}});
 function pause(){press=null;if(M.pause(s)){last=performance.now();tip='';update();}}
 function resume(){if(M.resume(s)){tip='';last=performance.now();update();}}
 $('pause').addEventListener('click',()=>s.phase==='paused'?resume():pause());
 $('restart').addEventListener('click',()=>fresh(s.index));$('panel-restart').addEventListener('click',()=>fresh(s.index));
 $('panel-action').addEventListener('click',()=>{if(s.phase==='won')fresh(s.index+1<M.maps.length?s.index+1:0);else resume();});
 $('help').addEventListener('click',()=>{pause();modal($('panel'),false);modal($('instructions'),true);});$('close-help').addEventListener('click',()=>{modal($('instructions'),false);update();});
 $('maps-open').addEventListener('click',()=>{pause();mapList();modal($('panel'),false);modal($('map-dialog'),true);});$('close-maps').addEventListener('click',()=>{modal($('map-dialog'),false);update();});
 $('panel').addEventListener('cancel',event=>event.preventDefault());
 for(const id of ['instructions','map-dialog'])$(id).addEventListener('cancel',event=>{event.preventDefault();modal($(id),false);update();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('instructions').open&&!$('map-dialog').open){event.preventDefault();pause();}});
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();last=performance.now();});
 window.addEventListener('resize',()=>{press=null;cursor=null;fit();});window.visualViewport?.addEventListener('resize',fit);new ResizeObserver(fit).observe($('stage'));
 $('retry-assets').addEventListener('click',loadAssets);
 function frame(now){const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;const previous=s.phase;if(ready&&!document.hidden)M.tick(s,dt);if(s.phase!==previous)update();hudClock+=dt;if(hudClock>=.15){hudClock=0;syncHud();}paint();requestAnimationFrame(frame);}
 fresh(save.selected);loadAssets();requestAnimationFrame(frame);
})();
