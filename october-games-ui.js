(()=>{
 'use strict';
 const $=id=>document.getElementById(id),kind=document.body.dataset.game,G={boxing:window.BuliBoxing,clinic:window.JiajiaClinic,hotel:window.JiajiaHotel}[kind],island=window.IslandRevive.create({id:kind}),asset='assets/october-three/';
 let raw;try{raw=localStorage.getItem(G.KEY);}catch(_){}
 let s=G.restore(raw),paused=true,mode='intro',last=0,saved=0,gesture=null,tool='examine';
 const names={boxing:'卟哩拳击馆',clinic:'家家宠物诊所',hotel:'家家迷你旅馆'};
 const guides={boxing:'左右滑动闪避、下滑格挡。对手收拳时点它反击；连点会耗光体力。第一场先看提示，闪开一拳再还手。也可用方向键和空格。',clinic:'先选左侧工具，再在黄色操作区动手：温度计按住检查，镊子按住小刺向上拔，棉片来回擦，绷带横向拖过伤口。每位小动物都有不同照护步骤。',hotel:'上面是候房客人，下面是房间。点空房办理入住，住满后点房间收钱，再点打扫。空房右上角可升级，未开放的房间可以扩建；接待目标完成后继续下一班。离开页面会暂停。'};
 const text=(id,value)=>{const el=$(id),v=String(value);if(el&&el.textContent!==v)el.textContent=v;};
 function save(){try{localStorage.setItem(G.KEY,JSON.stringify(s));$('storage-note').hidden=true;}catch(_){$('storage-note').hidden=false;}}
 function clearGesture(){gesture=null;if($('floating-tool'))$('floating-tool').hidden=true;}
 function show(next){clearGesture();mode=next;paused=true;if($('menu').open)$('menu').close();$('overlay').hidden=false;
  const intro=raw?'本局进度已经保存，点继续接着玩。':guides[kind];
  const title=next==='intro'?names[kind]:next==='help'?'怎么玩':next==='pause'?'休息一下':next==='won'?{boxing:'漂亮，赢了！',clinic:'照护完成！',hotel:'这一班接待完成！'}[kind]:{boxing:'先下场休息一下',clinic:'小动物需要休息',hotel:'这一班忙不过来了'}[kind];
  const description=next==='intro'?intro:next==='help'?guides[kind]:next==='pause'?'当前进度已保留，准备好再继续。':next==='won'?{boxing:`赢下第 ${s.stage} 场。下一位对手会更快一点，体力回满再上场。`,clinic:`第 ${s.caseNo+1} 位小动物照护完成，接下来迎接下一位。`,hotel:`接待了 ${s.served} 位客人。房间、升级和金币保留，继续经营下一班。`}[kind]:'本局有两次比邻岛复活机会。去找家家说说话，回来后接着玩；也可以重新开始本局。';
  text('title',title);text('description',description);text('action',next==='won'?(kind==='boxing'?'挑战下一场':kind==='clinic'?'接待下一位':'开始下一班'):next==='lost'?'重新本局':next==='intro'&&!raw?'开始游戏':'继续游戏');
  if(next==='lost'){const failed=s;island.offer($('result'),()=>{if(s!==failed||!G.revive(s))return false;save();resume(true);return true;},()=>s===failed&&s.phase==='lost');}
 }
 function resume(keepRevival=false){if(!keepRevival)island.hide();if(s.phase!=='playing'){show(s.phase);return;}paused=false;mode='';$('overlay').hidden=true;last=performance.now();render();}
 function fresh(){if(kind==='boxing')s=G.create(s.stage);else if(kind==='clinic')s=G.create(s.caseNo,s.treated);else{const old=s;s=G.create();s.day=old.day;s.coins=old.coins;s.rooms=old.rooms.map(r=>({level:r.level,status:'ready',remaining:0,guest:0}));}island.reset();tool='examine';save();resume();}
 function changed(){save();render();if(s.phase!=='playing')show(s.phase);}
 $('action').onclick=()=>{if(mode==='lost')fresh();else if(mode==='won'){s=G.next(s);island.reset(s.used);tool='examine';save();resume();}else resume();};
 $('menu-open').onclick=()=>{if(paused||s.phase!=='playing')return;clearGesture();paused=true;mode='menu';$('menu').showModal();save();};
 $('menu-close').onclick=()=>$('menu').close();$('menu').addEventListener('close',()=>{if(mode==='menu'){if(document.hidden)show('pause');else resume();}});
 $('help').onclick=()=>show('help');$('restart').onclick=()=>{mode='restart';$('menu').close();fresh();};$('pause').onclick=()=>show('pause');
 function depart(){clearGesture();save();if(s.phase==='playing'&&mode!=='intro')show('pause');}
 window.addEventListener('pagehide',depart);window.addEventListener('blur',depart);document.addEventListener('visibilitychange',()=>{if(document.hidden)depart();});
 function picture(src){const image=new Image();image.src=src;return image;}
 const buli=picture(asset+'buli-sitting.png'),animals=['panda','rabbit','penguin','pig','elephant'].map(n=>picture(asset+n+'.png'));
 const toolNames={examine:'温度计',tweezer:'镊子',clean:'棉片',bandage:'绷带',cool:'冰袋',water:'水杯'};
 const paths={examine:'<path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 8v9"/><circle cx="11" cy="18" r="1"/>',tweezer:'<path d="m6 3 7 8 5 10M6 3l-1 11 8 7M6 3l11 16"/>',clean:'<path d="m5 8 8-4 6 12-8 4z"/><path d="m9 10 5 7m-2-9 4 7"/>',bandage:'<rect x="2" y="7" width="20" height="10" rx="3" transform="rotate(-35 12 12)"/><path d="m9 9 6 6m-6-3 3-3"/>',cool:'<path d="M8 5h8l3 5v10H5V10zM8 2h8v3H8zM12 10v7m-3-5 6 3m-6 0 6-3"/>',water:'<path d="m5 5 2 16h10l2-16ZM7 11h10"/>'};
 const icon=t=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[t]+'</svg>';
 let clinicCase=-1,hotelBuilt=false,queueKey='';
 function clinicApply(amount){if(paused||!gesture||gesture.step!==s.step)return;const before=s.step,wrong=tool!==G.steps(s)[s.step];G.apply(s,tool,amount);if(wrong||s.step!==before||s.phase!=='playing')clearGesture();changed();}
 function inCare(x,y,wide=false){const r=(wide?$('patient'):$('care-target')).getBoundingClientRect(),pad=wide?0:45;return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad;}
 function beginCare(e,selected){if(paused||gesture||e.button!==0||e.isPrimary===false)return;e.preventDefault();if(selected)tool=selected;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,step:s.step,atTarget:inCare(e.clientX,e.clientY),distance:0};e.currentTarget.setPointerCapture?.(e.pointerId);renderClinic();moveTool(e.clientX,e.clientY);}
 function moveTool(x,y){const f=$('floating-tool');f.innerHTML=icon(tool);f.hidden=false;f.style.left=x+'px';f.style.top=y+'px';}
 if(kind==='clinic'){
  $('clinic-stage').addEventListener('pointerdown',e=>beginCare(e));
  document.addEventListener('pointermove',e=>{const p=gesture;if(!p||p.id!==e.pointerId||paused)return;moveTool(e.clientX,e.clientY);const dist=Math.hypot(e.clientX-p.x,e.clientY-p.y);p.distance+=dist;p.x=e.clientX;p.y=e.clientY;
   if(!p.atTarget&&inCare(p.x,p.y)){p.atTarget=true;p.startX=p.x;p.startY=p.y;}
   if(tool==='tweezer'&&p.atTarget&&p.startY-p.y>=55)clinicApply(1);
   else if(['clean','bandage'].includes(tool)&&inCare(p.x,p.y))clinicApply(dist/(tool==='clean'?230:110));
  });
  document.addEventListener('pointerup',e=>{const p=gesture;if(!p||p.id!==e.pointerId)return;if(!paused&&inCare(e.clientX,e.clientY,true)){if(tool!==G.steps(s)[s.step])clinicApply(1);else if(tool==='water')clinicApply(1);}clearGesture();});
  for(const ev of ['pointercancel','lostpointercapture'])document.addEventListener(ev,e=>{if(gesture?.id===e.pointerId)clearGesture();});
  $('care-target').addEventListener('keydown',e=>{if(!paused&&['Enter',' '].includes(e.key)){e.preventDefault();const before=s.step;G.apply(s,tool,.25);if(s.step!==before)clearGesture();changed();}});
 }
 function renderClinic(){
  text('stat1',`第 ${s.caseNo+1} 位`);text('stat2',`耐心 ${s.hearts}/3`);text('stat3',Math.ceil(s.time)+'秒');
  const steps=G.steps(s),required=steps[Math.min(s.step,steps.length-1)],instructions={examine:'选温度计，在小动物身上按住检查',tweezer:'选镊子，按住小刺向上拔出',clean:'选棉片，在操作区来回擦拭',bandage:'选绷带，横向拖过操作区',cool:'选冰袋，在小动物身上按住降温',water:'选水杯，再点小动物喂水'};
  if(clinicCase!==s.caseNo){clinicCase=s.caseNo;const pet=s.caseNo===0?'buli':s.caseNo%5;const img=$('patient');img.src=pet==='buli'?asset+'buli-sitting.png':asset+['rabbit','panda','penguin','pig','elephant'][pet]+'.png';img.alt=pet==='buli'?'卟哩':'等待照护的小动物';$('tools').replaceChildren();for(const t of steps){const b=document.createElement('button');b.type='button';b.dataset.tool=t;b.innerHTML=icon(t)+toolNames[t];b.setAttribute('aria-label','选择'+toolNames[t]);b.addEventListener('pointerdown',e=>beginCare(e,t));b.onclick=()=>{tool=t;renderClinic();};$('tools').appendChild(b);}}
  for(const b of $('tools').children)b.setAttribute('aria-pressed',String(b.dataset.tool===tool));text('patient-label',s.caseNo===0?'卟哩 · 身上扎了小刺':['擦伤照护','脏兮兮的小客人','发热的小客人'][s.caseNo%3]);text('care-step',`第 ${Math.min(s.step+1,steps.length)} / ${steps.length} 步 · ${toolNames[required]}`);text('hint',instructions[required]+'；用错工具会减少耐心。');$('care-target').dataset.tool=required;$('care-target').setAttribute('aria-label','照护操作区：'+toolNames[required]);$('care-progress').value=s.progress;
 }
 function renderHotel(){
  text('stat1',`第 ${s.day} 班`);text('stat2',`金币 ${s.coins}`);text('stat3',`${s.served}/${G.goal(s)} 位 · ${Math.ceil(s.time)}秒`);
  if(!hotelBuilt){hotelBuilt=true;for(let i=0;i<6;i++){const room=document.createElement('section');room.className='room';room.innerHTML='<img class="bed" src="'+asset+'bed.png" alt=""><img class="plant" src="'+asset+'plant.png" alt="" hidden><img class="lamp" src="'+asset+'lamp.png" alt="" hidden><img class="guest" alt="入住的客人" hidden><span class="room-label"></span><button class="room-action"><span></span></button><button class="room-upgrade"></button>';room.querySelector('.room-action').onclick=()=>{if(paused)return;const ok=i<s.rooms.length?G.room(s,i):i===s.rooms.length&&G.build(s);if(ok)changed();else text('hint',i>=s.rooms.length?'金币还不够，先接待客人赚取房费。':'这间房正在使用，先处理其他房间。');};room.querySelector('.room-upgrade').onclick=()=>{if(!paused&&G.upgrade(s,i))changed();};$('rooms').appendChild(room);}}
  for(let i=0;i<6;i++){const node=$('rooms').children[i],r=s.rooms[i],button=node.querySelector('.room-action'),label=node.querySelector('.room-label'),up=node.querySelector('.room-upgrade');node.className='room '+(r?r.status:'locked');for(const cl of ['bed','plant','lamp','guest'])node.querySelector('.'+cl).hidden=(!r&&cl!=='bed')||(cl==='plant'&&r&&r.level<2)||(cl==='lamp'&&r.level<3)||(cl==='guest'&&!['occupied','checkout'].includes(r.status));label.textContent=r?`${i+1}号 · ${r.level}级`:'';up.hidden=!r||r.level>=3||r.status!=='ready';if(r){up.textContent='升级 '+r.level*40;up.disabled=s.coins<r.level*40;up.setAttribute('aria-label',`升级${i+1}号房，${r.level*40}金币`);node.querySelector('.bed').src=asset+(r.level>=2?'bed-double.png':'bed.png');const img=node.querySelector('.guest'),src=asset+['rabbit','panda','penguin','pig','elephant'][r.guest%5]+'.png';if(img.getAttribute('src')!==src)img.src=src;const action={ready:s.queue.length?'办理入住':'等待客人',occupied:'住宿中 '+Math.ceil(r.remaining)+'秒',checkout:'收房费 '+(25+r.level*10),dirty:'打扫房间',cleaning:'打扫中 '+Math.ceil(r.remaining)+'秒'}[r.status];button.firstElementChild.textContent=action;button.setAttribute('aria-label',`${i+1}号房：${action}`);button.disabled=['occupied','cleaning'].includes(r.status)||r.status==='ready'&&!s.queue.length;}else{button.firstElementChild.textContent=i===s.rooms.length?'扩建房间 · '+G.cost(s)+'金币':'后续开放';button.setAttribute('aria-label',i===s.rooms.length?'扩建房间，'+G.cost(s)+'金币':'后续开放的房间');button.disabled=i!==s.rooms.length;}}
  const q=s.queue.map(p=>p.id).join(',');if(q!==queueKey||!$('waiting').children.length){queueKey=q;$('waiting').replaceChildren();for(const p of s.queue){const el=document.createElement('div');el.className='waiting-guest';el.innerHTML='<img src="'+asset+['rabbit','panda','penguin','pig','elephant'][p.id%5]+'.png" alt="候房客人"><progress max="65" aria-label="候房耐心"></progress>';$('waiting').appendChild(el);}if(!s.queue.length){const el=document.createElement('span');el.className='waiting-empty';el.textContent='客人正在路上…';$('waiting').appendChild(el);}}
  s.queue.forEach((p,i)=>{$('waiting').children[i].querySelector('progress').value=p.patience;});text('hint',`流失 ${s.missed}/3 位 · 点房间入住 → 收房费 → 打扫。空房可升级，升级和金币会保留。`);
 }
 const canvas=kind==='boxing'?$('board'):null,ctx=canvas?.getContext('2d');
 function contain(image,x,y,w,h){if(!image.complete||!image.naturalWidth)return;const a=Math.min(w/image.naturalWidth,h/image.naturalHeight);ctx.drawImage(image,x+(w-image.naturalWidth*a)/2,y+(h-image.naturalHeight*a)/2,image.naturalWidth*a,image.naturalHeight*a);}
 function glove(x,y,size,color){ctx.fillStyle=color;ctx.strokeStyle='#6c3d35';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-size*.55,y-size*.52,size,size*.9,size*.3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x+size*.43,y+size*.1,size*.25,size*.31,-.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f8eee1';ctx.fillRect(x-size*.4,y+size*.37,size*.7,size*.22);}
 function renderBoxing(){text('stage',`第 ${s.stage} 场`);text('hp-value',Math.ceil(s.hp));text('enemy-value',Math.ceil(s.enemy));$('hp').value=s.hp;$('enemy-hp').value=s.enemy;text('stamina','体力 '+Math.floor(s.stamina));text('fight-cue',s.event);$('fight-cue').style.color=s.beat==='recover'?'#22624b':'#6c392d';
  const r=canvas.getBoundingClientRect(),w=r.width,h=r.height,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#e6d9bf';ctx.fillRect(0,0,w,h);
  const top=h*.19,bottom=h*.95;ctx.fillStyle='#76a3a5';ctx.beginPath();ctx.moveTo(w*.14,top);ctx.lineTo(w*.86,top);ctx.lineTo(w+35,bottom);ctx.lineTo(-35,bottom);ctx.closePath();ctx.fill();
  ctx.lineWidth=4;for(let n=0;n<3;n++){ctx.strokeStyle=n===1?'#fcf7e7':'#af4d39';ctx.beginPath();ctx.moveTo(0,h*(.27+n*.07));ctx.lineTo(w*.15,top-n*12);ctx.lineTo(w*.85,top-n*12);ctx.lineTo(w,h*(.27+n*.07));ctx.stroke();}
  ctx.strokeStyle='#f6e9c7';ctx.lineWidth=3;ctx.strokeRect(w*.3,h*.45,w*.4,h*.23);ctx.fillStyle='#456e7130';ctx.beginPath();ctx.ellipse(w*.5,h*.5,w*.22,h*.035,0,0,Math.PI*2);ctx.fill();
  const size=Math.min(w*.46,h*.34),attack=s.beat==='windup'?Math.max(0,1-s.timer/.8):0,enemyX=w*.5,enemyY=h*.2;
  contain(animals[(s.stage-1)%animals.length],enemyX-size*.5,enemyY,size,size);const gs=size*.31;glove(enemyX-size*.58,enemyY+size*.72+attack*18,gs,'#ba4939');glove(enemyX+size*.58,enemyY+size*.72+attack*18,gs,'#ba4939');
  const px=w*.5+(s.dodge>0?s.side*w*.2:0),py=h*.58,ps=Math.min(w*.5,h*.38);contain(buli,px-ps*.5,py,ps,ps);const raised=s.block>0?ps*.35:0,punch=s.cooldown>.18?ps*.65:0;glove(px-ps*.5,py+ps*.5-raised,ps*.31,'#316f7c');glove(px+ps*.5,py+ps*.5-raised-punch,ps*.31,'#316f7c');
  if(s.flash>0&&s.beat==='recover'&&s.hp<100){ctx.fillStyle='#cf50301c';ctx.fillRect(0,0,w,h);}text('hint','左右滑闪避 · 下滑格挡 · 对手收拳时，点它反击');
 }
 if(kind==='boxing'){
  canvas.addEventListener('pointerdown',e=>{if(paused||gesture||e.button!==0||e.isPrimary===false)return;e.preventDefault();gesture={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const p=gesture;if(!p||p.id!==e.pointerId||paused)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.hypot(dx,dy)<26)return;G.act(s,Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'block':'punch');clearGesture();changed();});
  canvas.addEventListener('pointerup',e=>{const p=gesture;if(!p||p.id!==e.pointerId)return;const r=canvas.getBoundingClientRect();if(!paused&&e.clientY-r.top<r.height*.65&&Math.abs(e.clientX-r.left-r.width/2)<r.width*.38){G.act(s,'punch');changed();}clearGesture();});
  for(const ev of ['pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(gesture?.id===e.pointerId)clearGesture();});
  document.addEventListener('keydown',e=>{if(paused||e.repeat||e.target.closest('button,a'))return;const d={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'block',' ':'punch'}[e.key];if(d){e.preventDefault();G.act(s,d);changed();}});
 }
 function render(){if(kind==='boxing')renderBoxing();else if(kind==='clinic')renderClinic();else renderHotel();}
 function loop(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!paused){G.tick(s,dt);if(kind==='clinic'&&gesture&&inCare(gesture.x,gesture.y,true)&&['examine','cool'].includes(tool))clinicApply(dt/(tool==='cool'?1.2:.7));if(s.phase!=='playing')show(s.phase);saved+=dt;if(saved>=1){saved=0;save();}}render();requestAnimationFrame(loop);}
 island.reset(s.used);render();show(s.phase==='playing'?'intro':s.phase);requestAnimationFrame(loop);
})();
