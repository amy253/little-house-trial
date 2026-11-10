(function(){
 'use strict';
 const M=window.JiajiaMetro,$=id=>document.getElementById(id),colors=['#169fff','#ad36ee','#ffe62d','#66db26','#fa3c38','#ff9b27'],names=['蓝','紫','黄','绿','红','橙'],angles={N:0,NE:45,E:90,SE:135,S:180,SW:225,W:270,NW:315,bay:-25},directions={N:'上',NE:'右上',E:'右',SE:'右下',S:'下',SW:'左下',W:'左',NW:'左上'},island=window.IslandRevive?.create({id:'jiajia-metro'});
 let save=M.normalizeSave(null),storageFailed=false;
 try{localStorage.getItem(M.SAVE_KEY);save=M.load(localStorage);}catch(_){storageFailed=true;}
 let g=M.restoreAttempt(save.attempt)||M.create(save.selected),busy=false,epoch=0,offered=false,tip='',teaching=true,animations=[],fliers=[];
 const artFrames={people:[[131,99,282,364],[609,99,283,364],[130,605,285,362],[608,605,285,362],[128,1084,286,359],[607,1083,287,360]],buses:[[202,41,232,449],[596,41,232,448],[202,522,234,453],[593,522,235,452],[201,1001,237,459],[591,1001,239,458]],cars:[[170,72,270,439],[587,70,274,441],[169,560,274,434],[584,560,273,434],[169,1038,275,438],[582,1038,276,439]]};
 function el(tag,className,text){const node=document.createElement(tag);node.className=className||'';if(text!==undefined)node.textContent=text;return node;}
 function sprite(kind,color){const node=el('span',kind==='people'?'passenger':'toy-vehicle');const [x,y,w,h]=artFrames[kind][color];node.style.aspectRatio=w+'/'+h;node.style.backgroundImage='url(metro-original-'+kind+'.png)';node.style.backgroundSize=(1024/w*100)+'% '+(1536/h*100)+'%';node.style.backgroundPosition=(x/(1024-w)*100)+'% '+(y/(1536-h)*100)+'%';return node;}
 function person(color){return sprite('people',color);}
 function vehicle(c,dir=c.dir){const node=sprite('cars',c.color);node.style.setProperty('--angle',angles[dir]+'deg');return node;}
 function boardingVehicle(c){const node=sprite('buses',c.color);node.classList.add('open-bus');node.style.setProperty('--angle','-25deg');for(let i=0;i<c.boarded;i++){const p=person(c.color);p.classList.add('seated-person');p.style.left=(i%2?61:34)+'%';p.style.top=(30+Math.floor(i/2)*17)+'%';node.appendChild(p);}return node;}
 const crowd=[];
 function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 const outer=[[.2,-.06],[.8,-.06],[.91,.12],[.85,.215],[.7,.28],[.54,.306],[.46,.306],[.3,.28],[.15,.215],[.09,.12]],inner=[[.265,.158],[.28,.14],[.33,.127],[.4,.128],[.46,.15],[.5,.163],[.54,.15],[.6,.128],[.67,.127],[.72,.14],[.735,.158],[.73,.187],[.68,.22],[.6,.257],[.53,.282],[.47,.282],[.4,.257],[.32,.22],[.27,.187]];
 for(let row=0;row<22;row++)for(let col=0;col<27;col++){const x=.035+col*.036+(row%2)*.018,y=-.048+row*.017;if(inside(x,y,outer)&&!inside(x,y,inner))crowd.push({x,y});}
 const order=p=>(Math.atan2(p.y-.16,p.x-.5)-Math.PI/2+Math.PI*2)%(Math.PI*2);crowd.sort((a,b)=>order(a)-order(b));
 const introCrowd=[[.49,.309],[.43,.30],[.37,.285],[.31,.265],[.25,.24],[.20,.21],[.17,.175],[.17,.14],[.20,.1],[.26,.075],[.33,.07],[.40,.09],[.46,.12],[.5,.14],[.54,.12],[.60,.09],[.67,.07],[.74,.075],[.8,.1],[.83,.14],[.83,.175],[.8,.21],[.75,.24],[.69,.265]];
 function crowdPoint(index,count){if(g.layout!=='original'&&g.index<3){const [x,y]=introCrowd[index];return {x,y};}if(index===0)return {x:.49,y:.309};return crowd[Math.min(crowd.length-1,Math.floor((index-1)*(crowd.length-1)/Math.max(1,g.total-2)))];}
 function store(){save.attempt=M.saveAttempt(g);try{if(!M.persist(localStorage,save))storageFailed=true;}catch(_){storageFailed=true;}}
 function clearPath(){const canvas=$('travel-path');canvas.getContext?.('2d')?.clearRect(0,0,canvas.width,canvas.height);}
 function drawPath(from,exit,to){const canvas=$('travel-path'),ctx=canvas.getContext?.('2d');if(!ctx)return;const r=$('metro-root').getBoundingClientRect();canvas.width=r.width;canvas.height=r.height;const points=[from,exit,to];ctx.beginPath();points.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.left+p.width/2-r.left,p.top+p.height/2-r.top));ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#139eff';ctx.lineWidth=18;ctx.stroke();ctx.strokeStyle='#effaff';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.stroke();}
 function stopAnimation(){epoch++;for(const a of animations)a.cancel();animations=[];for(const node of fliers)node.remove();fliers=[];clearPath();busy=false;}
 function levelOptions(){const nodes=[];for(let i=0;i<save.unlocked;i++){const o=el('option','','关卡 '+String(i+1));o.value=String(i);nodes.push(o);}$('level').replaceChildren(...nodes);$('level').value=String(g.index);}
 function load(index,play){stopAnimation();island?.reset();offered=false;save.selected=index;g=M.create(index);tip='';teaching=true;if(play)M.start(g);store();levelOptions();render();}
 function render(){
  const lesson=M.lesson(g),guide=teaching&&!busy?lesson:null;
  $('metro-root').classList.toggle('intro-level',g.layout!=='original'&&g.index<3);
  $('metro-root').classList.toggle('ramp-level',g.layout==='ramp-v1'&&g.index>=3&&g.index<7);
  $('coach').hidden=!guide;
  if(guide)$('coach').textContent='教学 '+guide.step+'/'+guide.total+' · '+(guide.clearing?'先点圈出的挡路车。':g.layout!=='original'&&g.index===1?'路让开了，点圈出的蓝车接人。':g.layout!=='original'&&g.index===2?(guide.step===1?'先点蓝车，看看没坐满会怎样。':'车会占位等，先接'+names[guide.head]+'色小人。'):guide.step===1?'队首是'+names[guide.head]+'色，点圈出的同色车。':guide.step===2?'换'+names[guide.head]+'色了，点圈出的车接人。':'轮到你：选能出库的'+names[guide.head]+'车。');
  $('guide-toggle').disabled=busy;
  $('guide-toggle').hidden=!lesson;
  $('guide-toggle').textContent=teaching?'关教学':'开教学';
  $('guide-toggle').setAttribute('aria-pressed',String(teaching));
  $('score').textContent=g.delivered;$('total').textContent=' / '+g.total;$('remaining').textContent=g.queue.length;$('lives').textContent=island?.remaining()??2;
  const waiting=g.cars.filter(c=>c.state==='waiting');$('spaces').textContent='空位 '+(g.slots-waiting.length)+' / '+g.slots;
  const head=g.queue[0];$('head-label').textContent=head===undefined?'大家都上车啦':'先接'+names[head]+'色小人';
  const people=g.queue.map((color,i)=>{const p=person(color),q=crowdPoint(i,g.queue.length);p.setAttribute('aria-label','第'+(i+1)+'位，'+names[color]+'色小人');if(i===0)p.classList.add('queue-head');p.style.left=q.x*100+'%';p.style.top=q.y/.32*100+'%';p.style.zIndex=String(Math.round(q.y*1000));return p;});$('queue').replaceChildren(...people);$('queue-more').textContent='';
  const slots=[];for(let i=0;i<g.slots;i++){const slot=el('div','boarding-slot');slot.id='slot-'+i;slot.style.left=(13+i*12.9)+'%';const c=waiting.find(c=>c.slot===i);slot.setAttribute('aria-label',c?names[c.color]+'车 '+c.boarded+'/'+c.capacity+' 人':'空候车位 '+(i+1));if(c){const bus=boardingVehicle(c);slot.appendChild(bus);slot.appendChild(el('span','seat-count',c.boarded+'/'+c.capacity));}slots.push(slot);}$('slots').replaceChildren(...slots);
  const cellRect=$('yard').getBoundingClientRect();$('yard').style.setProperty('--car-size',Math.min(cellRect.width/g.cols*.62,cellRect.height/g.rows*.47)+'px');
  $('yard').style.setProperty('--cols',g.cols);$('yard').style.setProperty('--rows',g.rows);const cars=[];
  for(const c of g.cars){if(c.state!=='garage')continue;const blocked=M.blocker(g,c.id),button=el('button','vehicle'+(guide&&guide.car===c.id&&(guide.step<3||guide.clearing)?' guide-target':''));button.type='button';button.dataset.car=c.id;button.style.left=((c.x+.5)/g.cols*100)+'%';button.style.top=((c.y+.5)/g.rows*100)+'%';button.setAttribute('aria-label',c.id+' '+names[c.color]+'色车，'+c.capacity+'座，向'+directions[c.dir]+'出库'+(blocked?'，被'+blocked+'车挡住':''));button.disabled=g.phase!=='playing'||busy;button.appendChild(vehicle(c));button.addEventListener('click',()=>send(c.id,button));cars.push(button);}$('yard').replaceChildren(...cars);
  $('start').hidden=g.phase!=='ready';$('level').disabled=busy;$('pause').disabled=!['playing','paused'].includes(g.phase);$('pause').setAttribute('aria-label',g.phase==='paused'?'继续游戏':'暂停游戏');$('pause').classList.toggle('resume',g.phase==='paused');
  $('status').textContent=tip||g.reason||(g.phase==='ready'?'看最前面的小人颜色，点对应的小车。':g.index===2?'没坐满的车会等着，把空位留给下一种颜色。':'看队首颜色，沿车顶箭头出车。');
  const panel=!busy&&['paused','lost','won'].includes(g.phase);$('panel').hidden=!panel;
  if(panel&&!$('panel').open)$('panel').showModal();else if(!panel&&$('panel').open)$('panel').close();
  if(panel){$('panel-title').textContent=g.phase==='won'?'大家都上车啦！':g.phase==='lost'?'这次出车顺序没对上':'先歇一会儿';$('panel-copy').textContent=g.phase==='won'?'第 '+(g.index+1)+' 关完成，'+g.total+' 位乘客已全部接走。':g.phase==='lost'?g.reason+' 队首是'+names[g.queue[0]]+'色。复活会撤回最后一次出车，先给同色车腾路，别再把'+g.slots+'个候车位占满。':g.reason||'车辆和队伍都停着，点继续再接人。';$('panel-action').hidden=g.phase==='lost';$('panel-action').textContent=g.phase==='won'?(g.index+1<M.levels.length?'下一关 →':'18关全部完成，再玩一次 →'):'继续接人 →';}
  $('storage-note').textContent=storageFailed?'当前浏览器无法保存进度，仍可正常接人。':'车辆、队伍和复活用量自动保存在当前浏览器；重新打开后点继续。';
  if(g.phase==='lost'&&!busy&&!offered){offered=true;island?.offer($('panel-card'),()=>{if(!M.revive(g))return false;offered=false;tip=g.reason;store();Promise.resolve().then(render);return true;},()=>g.phase==='lost');}
  else if(g.phase!=='lost'&&offered){offered=false;island?.hide();}
 }
 function slotRect(index){const r=$('slots').children[index].getBoundingClientRect(),width=r.width*.83,height=width*449/232;return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height};}
 async function fly(node,from,to,duration,id,exit,angle=0,delay=0){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;node.id=id;node.classList.add('flying');node.style.left=from.left+'px';node.style.top=from.top+'px';node.style.width=from.width+'px';node.style.height=from.height+'px';document.getElementById('metro-root').appendChild(node);fliers.push(node);
  const frames=[{transform:'translate(0,0) rotate('+angle+'deg)'}];if(exit)frames.push({transform:'translate('+(exit.left-from.left)+'px,'+(exit.top-from.top)+'px) rotate('+angle+'deg)',offset:.45});frames.push({transform:'translate('+(to.left-from.left+((to.width||from.width)-from.width)/2)+'px,'+(to.top-from.top+((to.height||from.height)-from.height)/2)+'px) rotate(0deg) scale('+(to.width?to.width/from.width:1)+','+(to.height?to.height/from.height:1)+')'});
  const a=node.animate(frames,{duration,delay,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});animations.push(a);await a.finished.catch(()=>{});animations=animations.filter(v=>v!==a);fliers=fliers.filter(v=>v!==node);node.remove();}
 async function send(id,button){
  if(busy)return;const c={...g.cars.find(c=>c.id===id)},source=button.querySelector('.toy-vehicle')||button,r=source.getBoundingClientRect(),width=source.offsetWidth||r.width,height=source.offsetHeight||r.height,from={left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height},result=M.dispatch(g,id);
  if(!result.ok){tip=result.reason;render();const blocker=$('yard').querySelector('[data-car="'+result.blocked+'"]');blocker?.classList.add('blocked-flash');return;}
  busy=true;$('coach').hidden=true;$('guide-toggle').disabled=true;const token=++epoch,drive=result.events[0],target=slotRect(drive.slot),yard=$('yard').getBoundingClientRect(),rad=angles[c.dir]*Math.PI/180,dx=Math.sin(rad),dy=-Math.cos(rad),tx=Math.abs(dx)<.01?Infinity:(dx>0?yard.left+yard.width-from.left:from.left-yard.left)/Math.abs(dx),ty=Math.abs(dy)<.01?Infinity:(dy>0?yard.top+yard.height-from.top:from.top-yard.top)/Math.abs(dy),distance=Math.min(tx,ty)+from.height,exit={left:from.left+dx*distance,top:from.top+dy*distance,width:from.width,height:from.height};button.style.visibility='hidden';for(const b of $('yard').children)b.disabled=true;drawPath(from,exit,target);
  if(g.phase==='won'){save=M.complete(save,g.index);levelOptions();}store();
  tip=names[c.color]+'车 '+id+' 正在去候车位。';$('status').textContent=tip;
  await fly(vehicle(c,'N'),from,target,420,'moving-car',exit,angles[c.dir]);if(token!==epoch)return;clearPath();
  $('slots').children[drive.slot].appendChild(boardingVehicle({...c,boarded:0}));
  const boardEvents=result.events.filter(e=>e.kind==='board');
  if(boardEvents.length){await Promise.all(boardEvents.map((e,i)=>{const child=$('queue').children[i];if(!child)return;const fromPerson=child.getBoundingClientRect(),v=g.cars.find(v=>v.id===e.id),seat=v.boarded-boardEvents.filter(b=>b.id===e.id).length+boardEvents.slice(0,i).filter(b=>b.id===e.id).length,t=slotRect(e.slot),to={left:t.left+t.width*(seat%2?.55:.3),top:t.top+t.height*(.3+Math.floor(seat/2)*.17),width:t.width*.18,height:t.height*.12};child.style.visibility='hidden';return fly(person(e.color),fromPerson,to,180,'moving-person-'+i,null,0,Math.min(i,11)*18);}));if(token!==epoch)return;}render();
  for(const e of result.events.filter(e=>e.kind==='depart')){const v=g.cars.find(v=>v.id===e.id),fromSlot=slotRect(e.slot),edge=$('metro-root').getBoundingClientRect();await fly(boardingVehicle(v),fromSlot,{left:edge.left+edge.width+40,top:fromSlot.top},220,'departing-car',null,-25);if(token!==epoch)return;}
  busy=false;tip=boardEvents.length?'接上 '+boardEvents.length+' 人，'+(result.events.some(e=>e.kind==='depart')?'满座的车已驶离。':'还没坐满，车会留下等人。'):names[c.color]+'车在等同色小人，留好剩余候车位。';
  if(g.index===0&&g.delivered>=12&&g.checkpoint.delivered<12)tip='学会啦！继续按队首颜色接人，别让七个候车位都被占满。';
  render();
 }
 function pause(){if(g.phase==='playing')M.pause(g);stopAnimation();store();render();}
 $('guide-toggle').addEventListener('click',()=>{teaching=!teaching;render();});
 $('start').addEventListener('click',()=>{M.start(g);tip='';store();render();});$('restart').addEventListener('click',()=>load(g.index,true));$('panel-restart').addEventListener('click',()=>load(g.index,true));
 $('panel-action').addEventListener('click',()=>{if(g.phase==='won')load(g.index+1<M.levels.length?g.index+1:0,true);else{M.start(g);tip='';store();render();}});
 $('pause').addEventListener('click',()=>{if(g.phase==='playing')pause();else if(g.phase==='paused'){M.start(g);store();render();}});
 $('level').addEventListener('change',()=>{const index=Number($('level').value);if(Number.isInteger(index)&&index>=0&&index<save.unlocked)load(index,true);});
 $('help').addEventListener('click',()=>{pause();$('instructions').showModal();});$('close-help').addEventListener('click',()=>$('instructions').close());
 $('panel').addEventListener('cancel',e=>e.preventDefault());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',pause);
 document.addEventListener('keydown',e=>{if($('instructions').open||e.target.closest?.('button,a,select'))return;if(e.key==='p'||e.key==='P'||e.key==='Escape'){e.preventDefault();$('pause').click();}});
 function resize(){const height=window.visualViewport?.height||window.innerHeight;$('metro-root').style.setProperty('--play-height',height+'px');if(busy)pause();else render();}
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);island?.reset(g.revives);if(save.attempt&&g.phase==='paused')g.reason='已恢复：已接 '+g.delivered+' 人，候车 '+g.cars.filter(c=>c.state==='waiting').length+' 辆，剩余 '+(2-g.revives)+' 次复活。点继续接着玩。';levelOptions();resize();render();
})();
