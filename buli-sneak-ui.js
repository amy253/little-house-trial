(function(){
 'use strict';
 const S=window.BuliSneak,$=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),KEY='little-house-buli-sneak-v1',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const island=window.IslandRevive?.create({id:'buli-sneak'});island?.reset();
 let saved=S.readSave(null),storageOK=true;try{saved=S.readSave(localStorage.getItem(KEY));}catch(_){storageOK=false;}
 let s=S.create(),last=null,clock=0,previous='ready',activePointer=null,keyHeld=false,statusStamp='';
 let joystick=null;joystick=window.TouchJoystick?.create({element:$('joystick'),thumb:$('joystick-thumb'),axis:'forward',enabled:()=>s.phase==='playing'&&!s.paused,onChange:({direction})=>{S.setMoving(s,direction==='right');$('move').setAttribute('aria-pressed',String(direction==='right'));}});
 const cat=new Image(),girl=new Image(),rooms=new Image(),girlPoses=new Image();cat.src='fishing-buli-life.png';girl.src='aijia-chibi.webp';rooms.src='buli-sneak-rooms-v2.png';girlPoses.src='buli-sneak-jiajia-v2.png';
 for(const asset of [cat,girl])asset.onerror=()=>{$('storage-note').textContent='角色图片加载失败，请刷新重试。';$('storage-note').hidden=false;};
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(_){storageOK=false;}$('storage-note').hidden=storageOK;}
 function release(){joystick?.reset();activePointer=null;keyHeld=false;S.setMoving(s,false);$('move').setAttribute('aria-pressed','false');}
 function newLevel(level){island?.reset();release();s=S.create({level});last=null;previous='ready';statusStamp='';update();}
 function begin(){if(S.start(s)){previous='playing';last=null;update();$('joystick').focus({preventScroll:true});}}
 function pause(){release();if(s.phase==='playing'){S.setPaused(s,true);update();}}
 function resume(){S.setPaused(s,false);last=null;update();$('joystick').focus({preventScroll:true});}
 function update(){
  joystick?.refresh();
  const cfg=s.rules,pct=Math.floor(s.progress),secs=Math.max(0,Math.ceil((s.deadline??cfg.limit)-s.elapsed));
  $('level-number').textContent=String(s.level+1).padStart(2,'0');$('room').textContent=cfg.room;$('snack').textContent=cfg.snack;$('seconds').textContent=secs;$('distance').textContent=pct+'%';$('progress-fill').style.width=s.progress+'%';
  const cover=cfg.covers.findIndex(([a,b])=>s.progress>=a&&s.progress<=b);
  $('attention-label').textContent=cover>=0?['花盆挡住家家视线','篮子挡住家家视线','靠垫挡住家家视线'][cover]:'回头后，被看到移动就立即失败';
  $('suspicion-label').textContent=s.reason==='caught'?'被发现':s.paused?'已暂停':s.phase==='won'?'到手啦':cover>=0?'有掩护':s.watcher==='warning'?'快松手':s.watcher==='look'?'别动':'安全';
  $('route-note').textContent=cfg.creaks.length?'响木板会引起注意 · 看见黄色就松手':'随时松手装睡 · 绿圈是家家的视线盲区';
  const key=s.paused?'paused':s.phase==='won'?'won':s.phase==='lost'?'lost':s.watcher;
  const stamp=key+s.alert+cover;
  if(stamp!==statusStamp){
   statusStamp=stamp;$('watch-status').className='watch-status '+(key==='warning'?'warning':key==='look'||key==='lost'?'look':'away');
   const warning=s.alert==='floor'?'木板吱呀响了':'家家要回头了';
   $('watch-status').textContent={away:'家家背对着 · 向右滑摇杆',warning:warning+' · 快松手',look:'家家在看 · 松手装睡',paused:'稍作休息 · 回来再接着偷吃',won:'零食到手，计划成功！',lost:s.reason==='time'?'家家把零食收起来了':'被家家发现啦！'}[key];
   $('move').className='move '+key;$('move').firstChild.textContent=key==='warning'||key==='look'?'松手，装睡 ':'按住，偷偷前进 ';
   $('move').querySelector('span').textContent=key==='warning'?'要回头了，快松手':key==='look'?'家家在看，别动':'松手就装睡';
  }
  $('pause').disabled=s.phase!=='playing'||s.paused;$('move').disabled=s.phase!=='playing'||s.paused;
  const overlay=s.phase!=='playing'||s.paused;$('overlay').hidden=!overlay;
  if(s.phase==='lost')island?.offer($('overlay'),()=>{if(!S.revive(s))return false;release();previous='playing';statusStamp='';last=null;update();$('joystick').focus({preventScroll:true});return true;},()=>s.phase==='lost');else island?.hide();
  if(!overlay)return;
  $('stars').hidden=s.phase!=='won';$('secondary-action').hidden=s.phase!=='won';
  if(s.paused){$('result-tag').textContent='小猫休息站';$('result-title').textContent='家家也暂停啦';$('result-body').textContent='回来后接着刚才的位置，卟哩不会偷偷往前走。';$('main-action').textContent='继续偷吃 →';}
  else if(s.phase==='ready'){$('result-tag').textContent=cfg.room+' · 第 '+(s.level+1)+' 关';$('result-title').textContent='这次目标：'+cfg.snack;$('result-body').textContent='背对时向右滑摇杆前进，黄色预警就松手装睡。回头后被看到移动，就立即失败；停在哪都可以装睡。';$('main-action').textContent='开始偷吃 →';}
  else if(s.phase==='won'){$('result-tag').textContent='秘密计划成功';$('result-title').textContent='小猫的加餐时间';$('result-body').textContent='用了 '+s.elapsed.toFixed(1)+' 秒，'+(s.level===11?'三个房间都探索完啦！':'下一次换个地方继续悄悄靠近。');$('stars').textContent='★'.repeat(s.stars)+'☆'.repeat(3-s.stars);$('main-action').textContent=s.level===11?'回关卡地图':'下一关 →';$('secondary-action').textContent='再玩这一关';}
  else{$('result-tag').textContent='下次再机灵一点';$('result-title').textContent=s.reason==='time'?'零食被收走了':'卟哩，别装啦';$('result-body').textContent=s.reason==='time'?'家家背对时及时起步，别让零食等太久。':'家家回头后，看到卟哩移动就会立即被发现。黄色预警出现时就松手装睡，不能等回头后再松手。';$('main-action').textContent='再试一次 →';}
 }
 $('main-action').onclick=()=>{if(s.paused)resume();else if(s.phase==='ready')begin();else if(s.phase==='lost')newLevel(s.level);else if(s.level<11)newLevel(s.level+1);else openMap();};
 $('secondary-action').onclick=()=>newLevel(s.level);$('pause').onclick=pause;
 const move=$('move');move.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||s.phase!=='playing'||s.paused)return;e.preventDefault();activePointer=e.pointerId;move.setPointerCapture(e.pointerId);S.setMoving(s,true);move.setAttribute('aria-pressed','true');});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])move.addEventListener(event,e=>{if(activePointer===e.pointerId)release();});
 move.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('keydown',e=>{if($('map-dialog').open)return;if(e.key==='Escape'&&s.phase==='playing'){e.preventDefault();if(s.paused)resume();else pause();return;}const target=e.target;if(target instanceof HTMLElement&&target.closest('button,a,input,summary')&&target!==move&&target!==$('joystick'))return;if(e.key===' '||e.code==='Space'||e.key==='ArrowRight'){e.preventDefault();if(e.repeat||keyHeld||s.phase!=='playing'||s.paused)return;keyHeld=true;S.setMoving(s,true);move.setAttribute('aria-pressed','true');}});
 document.addEventListener('keyup',e=>{if(e.key===' '||e.code==='Space'||e.key==='ArrowRight')release();});
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 function openMap(){pause();$('level-list').replaceChildren();for(let i=0;i<12;i++){const b=document.createElement('button');b.disabled=i>saved.unlocked;b.className=i===s.level?'current':'';b.textContent=String(i+1).padStart(2,'0');const room=document.createElement('small');room.textContent=S.config(i).room;const stars=document.createElement('span');stars.className='mini-stars';stars.textContent=i>saved.unlocked?'未解锁':'★'.repeat(saved.stars[i])+'☆'.repeat(3-saved.stars[i]);b.append(room,stars);b.onclick=()=>{$('map-dialog').close();newLevel(i);};$('level-list').append(b);}$('map-dialog').showModal();}
 $('map').onclick=openMap;$('close-map').onclick=()=>$('map-dialog').close();
 function rect(x,y,w,h,r,color,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.lineWidth=1.5;ctx.strokeStyle=stroke;ctx.stroke();}}
 function oval(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function line(points,color,width=1){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 function room(){
  if(window.GameArt?.scene(ctx,Math.floor(s.level/4)===0?'kitchen':'wood',0,0,432,480))return;
  if(rooms.complete&&rooms.naturalWidth){const theme=Math.floor(s.level/4),cw=rooms.naturalWidth/3;ctx.drawImage(rooms,theme*cw,0,cw,rooms.naturalHeight,0,0,432,480);ctx.fillStyle=['#ffe8b20c','#6572a50c','#ffd2900c'][theme];ctx.fillRect(0,0,432,480);if(!reduced){for(let i=0;i<14;i++){const x=(i*67+clock*2)%432,y=30+(i*97+clock*3)%320;oval(x,y,.8+(i%3)*.4,.8+(i%3)*.4,'#fff2cc55');}}return;}
  const theme=Math.floor(s.level/4),wall=['#ebeddc','#e5e8df','#eee5df'][theme],floor=['#dcc49e','#c7c4a6','#d9bdab'][theme];
  ctx.fillStyle=wall;ctx.fillRect(0,0,432,480);rect(0,345,432,135,0,floor);rect(0,338,432,8,0,'#b4ad93');
  for(let y=367;y<480;y+=28)line([[0,y],[432,y]],'#f0e5c45c');for(let i=0;i<6;i++)line([[i*95-40,347],[i*95-10,480]],'#99886735');
  rect(26,40,133,149,12,'#b9c5a9','#a7b89b');rect(33,47,119,133,7,'#c8ded4');oval(111,81,18,18,'#fff1bf');oval(55,149,44,25,'#a5c3a5');oval(133,153,42,37,'#b4cfad');line([[92,47],[92,180]],'#f8f5e5',5);line([[33,112],[152,112]],'#f8f5e5',5);rect(20,180,144,9,3,'#edf0de');
  rect(192,50,56,64,4,'#e5cfb2','#b5a585');rect(200,58,40,48,1,'#f9f2df');ctx.font='20px serif';ctx.textAlign='center';ctx.fillStyle='#90a981';ctx.fillText(['♧','♪','⌂'][theme],220,90);
  if(theme===0){rect(21,226,112,109,5,'#becab0','#91a98d');rect(17,215,120,14,3,'#f7f1dc');line([[77,232],[77,333]],'#9db296');oval(68,272,2,2,'#7b927a');oval(87,272,2,2,'#7b927a');rect(292,228,120,105,4,'#bfd0b1');rect(282,219,139,13,3,'#faf2da');rect(325,261,55,47,5,'#94a68e');rect(332,266,41,31,4,'#71877a');oval(344,245,3,3,'#87987d');oval(365,245,3,3,'#87987d');}
  else if(theme===1){rect(23,228,119,109,4,'#b3aa88');for(let y=245;y<323;y+=31){rect(27,y,111,4,0,'#8e906f');for(let i=0;i<9;i++)rect(32+i*11,y-22,8,21,2,['#d4b8a0','#a0b7a1','#e2d4b2'][i%3]);}rect(289,255,132,10,3,'#c6ae88');rect(300,264,7,76,1,'#b3a17e');rect(399,264,7,76,1,'#b3a17e');rect(332,228,41,28,4,'#eeebd8');}
  else{rect(23,253,125,80,17,'#cfa9a2');rect(28,255,116,38,12,'#dfbeb5');rect(16,277,25,61,12,'#be9893');rect(134,277,24,61,12,'#be9893');rect(67,266,28,24,8,'#f1dec2');rect(291,255,128,78,14,'#b9c6a7');rect(297,250,116,40,12,'#cad5ba');rect(285,275,23,62,11,'#9eaf90');rect(402,275,23,62,11,'#9eaf90');}
  oval(227,425,182,38,['#efe5c45e','#e3e8c163','#efe0cd70'][theme]);
  ctx.font='9px "Microsoft YaHei",sans-serif';ctx.fillStyle='#827e68';ctx.textAlign='left';ctx.fillText('小猫出发',22,462);ctx.textAlign='right';ctx.fillText('加餐在这里 →',408,462);
 }
 function drawGirl(){const x=S.layout(s.progress,s.rules).watcher.x-65+(s.watcher==='warning'&&!reduced?Math.sin(clock*15)*1.4:0),y=180+(reduced?0:Math.sin(clock*2)*1.2);oval(x+65,339,40,7,'#36271842');if(girlPoses.complete&&girlPoses.naturalWidth){const cw=girlPoses.naturalWidth/4,frame=s.phase==='lost'?3:s.watcher==='away'?0:s.watcher==='warning'?1:2;ctx.drawImage(girlPoses,frame*cw,0,cw,girlPoses.naturalHeight,x-8,y-17,143,181);}else if(girl.complete&&girl.naturalWidth)ctx.drawImage(girl,x,y,127,155);const text=s.phase==='lost'?'抓到小馋猫！':s.phase==='won'?'加餐啦～':s.watcher==='warning'?(s.alert==='floor'?'什么声音？':'嗯？'):s.watcher==='look'?'卟哩呢？':['翻翻食谱…','再看一页…','看会儿剧…'][Math.floor(s.level/4)];rect(x+14,y-43,97,28,13,'#fff7e6f2','#dbc398');ctx.beginPath();ctx.moveTo(x+52,y-15);ctx.lineTo(x+61,y-7);ctx.lineTo(x+65,y-15);ctx.fillStyle='#fff7e6';ctx.fill();ctx.font='11px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillStyle='#715943';ctx.fillText(text,x+62,y-25);}
 function route(){
  for(const [a,b]of s.rules.covers){const x=(S.trackX(a)+S.trackX(b))/2,rx=(S.trackX(b)-S.trackX(a))/2;oval(x,460,rx,4,'#80c99280');line([[x-rx,460],[x+rx,460]],'#dbf8c1',2);}
  for(const [a,b]of s.rules.creaks){const x=S.trackX(a),w=S.trackX(b)-x;rect(x,442,w,17,3,'#e5ad586f','#f2ce85c9');line([[x+3,446],[x+w-3,454]],'#ffdaa3a0',1);ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffefd1';ctx.fillText('!',x+w/2,475);}
  if(s.watcher==='look'&&s.phase==='playing'){
   const {watcher,cat}=S.layout(s.progress,s.rules),hidden=s.rules.covers.findIndex(([a,b])=>s.progress>=a&&s.progress<=b);
   if(hidden>=0){const p=s.rules.props[hidden],y=p.footY-p.height+8,t=(y-watcher.y)/(cat.footY-cat.height/2-watcher.y);line([[watcher.x,watcher.y],[watcher.x+(cat.x-watcher.x)*t,y]],'#f4d68a66',2);}
   else{ctx.beginPath();ctx.moveTo(watcher.x,watcher.y);ctx.lineTo(cat.x-36,cat.footY);ctx.lineTo(cat.x+36,cat.footY);ctx.closePath();ctx.fillStyle='#f4b76517';ctx.fill();}
  }
  if(s.elapsed-s.creakTime<1&&!reduced){const age=s.elapsed-s.creakTime;ctx.beginPath();ctx.ellipse(S.trackX(s.creakAt),450,10+age*32,5+age*12,0,0,Math.PI*2);ctx.strokeStyle=`rgba(255,221,157,${1-age})`;ctx.lineWidth=2;ctx.stroke();}
 }
 function snack(){if(window.GameArt?.draw(ctx,['toast','fishDish','bowl','candy'][s.level%4],345,390,58,36))return;oval(373,424,28,8,'#8b927c2b');oval(373,418,26,7,'#f7f2d9');if(s.level%4===0){for(let i=0;i<3;i++){oval(361+i*12,411-(i%2)*8,9,6,'#c69e62');oval(359+i*12,409-(i%2)*8,2,1,'#efd4a0');}}else if(s.level%4===1){oval(371,410,20,7,'#b7c9bb');ctx.beginPath();ctx.moveTo(389,410);ctx.lineTo(399,401);ctx.lineTo(399,417);ctx.fillStyle='#91aa9a';ctx.fill();oval(359,408,2,2,'#607a65');}else if(s.level%4===2){rect(352,399,41,18,5,'#91b2a0');oval(372,399,20,5,'#ecd8b3');for(let i=0;i<8;i++)oval(359+i*4,397+(i%2)*3,2,1.5,'#b19066');}else{ctx.save();ctx.translate(373,404);ctx.rotate(-.5);rect(-22,-7,44,14,3,'#e5a4ac','#c9898b');rect(-14,-5,26,10,2,'#fcefd2');ctx.restore();}}
 function furniture(){
  for(const item of S.layout(s.progress,s.rules).props){
   const {x,width:w,height:h,footY:y,kind}=item,top=y-h;oval(x,y+3,w*.48,6,'#30291f4a');
   if(kind===0){
    rect(x-w/2,top,w,h,10,'#bc8058','#9b6444');oval(x,top+3,w/2,6,'#e4b17d');oval(x,top+2,w*.43,4,'#684d39');
    for(let i=0;i<7;i++){ctx.save();ctx.translate(x,top+3);ctx.rotate((i-3)*.32);oval(0,-24,9,32,['#658d57','#8fac6a','#48774e'][i%3]);line([[0,-1],[0,-49]],'#a9bc81',1);ctx.restore();}oval(x-w*.25,top+h*.6,5,h*.27,'#eab88945');
   }else if(kind===1){
    rect(x-w/2,top,w,h,11,'#b68654','#825934');oval(x,top+2,w/2-2,7,'#dbb785');oval(x,top+2,w/2-6,4,'#865e3b');
    for(let yy=top+14;yy<y-3;yy+=8)line([[x-w/2+3,yy],[x+w/2-3,yy]],'#e2ba86',2);for(let xx=x-w/2+7;xx<x+w/2;xx+=9)line([[xx,top+8],[xx,y-4]],'#947048',1);
    rect(x-w*.36,top-8,w*.72,11,4,'#bbbf96');line([[x-w*.23,top-8],[x+w*.19,top-9]],'#e6dbc6',2);
   }else{
    rect(x-w/2,top,w,h,12,'#ad8a8b','#805f61');rect(x-w*.46,top+3,w*.92,h*.38,10,'#8fa491','#6b836f');rect(x-w*.46,top+h*.4,w*.92,h*.3,10,'#d0ac9d','#a78676');line([[x-w*.4,y-10],[x+w*.4,y-10]],'#cfb59c',1);for(let i=-1;i<=1;i++)oval(x+i*12,top+18,1.3,1.3,'#d9dac2');
   }
  }
 }
 // Measured alpha bounds in each 512px cell. All poses use a common body centre and ground anchor.
 const CAT_BOUNDS=[[53,48,459,370],[0,37,502,385],[64,67,404,400],[46,119,456,297],[51,12,461,417],[0,4,418,436]];
 function drawCat(){
  const moving=s.moving&&!s.paused&&s.phase==='playing',frame=moving?(reduced?0:Math.floor(clock*5)%2===0?0:2):s.phase==='ready'||s.phase==='lost'?5:s.phase==='won'?0:3,{x,footY:y,width:w}=S.layout(s.progress,s.rules).cat;
  oval(x,y+2,w*.44,4,'#352d2540');if(moving){for(let i=1;i<5;i++){const px=x-i*11;if(px<20)continue;oval(px,y+1+(i%2)*3,1.8,1.2,'#f8de9d45');}}
  const [bx,by,bw,bh]=CAT_BOUNDS[frame],h=frame===0||frame===2?w*40/44:w*bh/bw;
  if(window.GameArt?.draw(ctx,'cat',x-w/2,y-h,w,h)){}else if(cat.complete&&cat.naturalWidth){const unit=cat.naturalWidth/1536;ctx.drawImage(cat,((frame%3)*512+bx)*unit,(Math.floor(frame/3)*512+by)*unit,bw*unit,bh*unit,x-w/2,y-h,w,h);}
  if(!moving&&s.phase==='playing'&&!reduced&&!S.inCover(s.progress,s.rules)){ctx.fillStyle='#fff0cb';ctx.font='12px serif';ctx.textAlign='left';ctx.fillText('z',x+17,y-h-4);ctx.font='9px serif';ctx.fillText('z',x+25,y-h-14-Math.sin(clock*2)*2);}
  if(s.phase==='won'){ctx.fillStyle='#ffb9cc';ctx.font='21px serif';ctx.textAlign='center';for(let i=0;i<3;i++)ctx.fillText('♥',x-24+i*24,y-h-12-(reduced?0:Math.sin(clock*3+i)*4));}
  if(s.phase==='playing'&&S.inCover(s.progress,s.rules)){rect(x-34,y+10,68,17,8,'#547957ed');ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff7dc';ctx.fillText('家家看不到',x,y+22);}
 }
 function draw(){room();route();drawGirl();furniture();ctx.save();ctx.translate(0,26);snack();ctx.restore();drawCat();}
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.width*480/432*dpr);ctx.setTransform(canvas.width/432,0,0,canvas.height/480,0,0);draw();}new ResizeObserver(resize).observe(canvas);
 function frame(t){const dt=last===null?0:Math.min(.05,(t-last)/1000);last=t;if(!s.paused)clock+=dt;S.tick(s,dt);if(s.phase!==previous){if(s.phase==='won'){release();saved.stars[s.level]=Math.max(saved.stars[s.level],s.stars);saved.unlocked=Math.max(saved.unlocked,Math.min(11,s.level+1));persist();}else if(s.phase==='lost')release();previous=s.phase;}update();draw();requestAnimationFrame(frame);}
 update();$('storage-note').hidden=storageOK;resize();requestAnimationFrame(frame);
})();
