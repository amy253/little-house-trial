(function(){
 'use strict';
 const B=window.BuliBomber,$=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),KEY='buli-bomber-save-v1',island=window.IslandRevive?.create({id:'buli-bomber'});
 let save,storageFailed=false;try{save=B.normalizeSave(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){save=B.normalizeSave(null);storageFailed=true;}
 let g=B.create(0),held=new Map(),repeat=0,last=performance.now(),offered=false,recorded=false,previous='',stick=null;
 const joystick=$('joystick'),thumb=$('joystick-thumb');
 const cat=new Image();window.GameArt?.bind?window.GameArt.bind(cat,'catHead'):cat.src='buli-head-snack.png';island?.reset();
 const shifts={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
 function text(id,value){if($(id).textContent!==String(value))$(id).textContent=String(value);}
 function clear(){held.clear();repeat=0;stick?.reset();}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(_){storageFailed=true;}}
 function load(index){if(!Number.isInteger(index)||index<0||index>=save.unlocked)return;clear();island?.reset();g=B.create(index);offered=recorded=false;previous='';last=performance.now();update();draw();}
 function start(){clear();B.start(g);last=performance.now();update();}
 function pause(){clear();B.pause(g);update();}
 stick=window.TouchJoystick.create({element:joystick,thumb,enabled:()=>g.phase==='playing',onChange:({direction})=>{if(!direction){held.delete('stick');repeat=0;return;}const shift={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction];held.set('stick',shift);repeat=0;B.move(g,...shift);update();}});
 $('bomb').addEventListener('click',()=>{B.place(g);update();});
 $('action').addEventListener('click',()=>{if(g.phase==='won')load(Math.min(5,g.index+1));else if(g.phase==='lost')load(g.index);else start();});
 $('pause').addEventListener('click',()=>g.phase==='paused'?start():pause());$('restart').addEventListener('click',()=>load(g.index));
 $('level').addEventListener('change',()=>load(Number($('level').value)));
 document.addEventListener('keydown',e=>{
  if(e.target.closest?.('input,select,textarea,dialog'))return;
  if(e.code==='KeyP'||e.key==='Escape'){if(g.phase==='playing'||g.phase==='paused'){e.preventDefault();g.phase==='paused'?start():pause();}return;}
  if(g.phase!=='playing')return;
  if(shifts[e.code]){e.preventDefault();if(!held.has(e.code)){held.set(e.code,shifts[e.code]);repeat=0;B.move(g,...shifts[e.code]);update();}}
  else if(e.code==='Space'&&!e.repeat&&!e.target.closest?.('button,a')){e.preventDefault();B.place(g);update();}
 });
 document.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 function update(){
  if(g.phase!=='playing')clear();
  if((g.phase==='won'||g.phase==='lost')&&!recorded){recorded=true;save.best=Math.max(save.best,g.score);if(g.phase==='won')save.unlocked=Math.max(save.unlocked,Math.min(6,g.index+2));persist();}
  text('score',g.score);text('best',save.best);text('enemies',g.enemies.length);text('capacity',(g.capacity-g.bombs.length)+' / '+g.capacity);text('range',g.range);
  $('level').value=String(g.index);for(const option of $('level').options)option.disabled=Number(option.value)>=save.unlocked;
  stick?.refresh();$('bomb').disabled=g.phase!=='playing'||g.bombs.length>=g.capacity;
  $('pause').disabled=!['playing','paused'].includes(g.phase);text('pause',g.phase==='paused'?'▶ 继续':'Ⅱ 暂停');$('panel').hidden=g.phase==='playing';
  if(g.phase==='ready'){text('panel-title','先留一条退路');text('panel-copy','放弹后有2秒逃开。绕到拐角躲火，炸箱子捡道具，消灭敌人再进右下角出口。');text('action','开始炸弹猫 →');}
  else if(g.phase==='paused'){text('panel-title',g.revived?'回来啦，卟哩准备好了':'歇一歇，炸弹也停了');text('panel-copy',g.revived?'已清除当前炸弹和火焰，进度与道具保留。继续后有2秒护盾。':'倒计时和敌人都暂停，准备好了再继续。');text('action','继续炸弹猫 →');}
  else if(g.phase==='lost'){text('panel-title',g.reason==='fire'?'没躲开自己的火焰':'被捣蛋毛球碰到了');text('panel-copy','本关得分 '+g.score+'。先去比邻岛说说话复活，或重来本关。');text('action','重新开始本关');}
  else if(g.phase==='won'){text('panel-title',g.index===5?'六个小院都守住啦！':'小院清理完成！');text('panel-copy','本关得分 '+g.score+'，用时 '+Math.round(g.time)+' 秒。');text('action',g.index===5?'再挑战最后一关':'下一关 →');}
  text('status',g.phase==='ready'?'先开始，再炸开箱子。开局留有拐角退路。':g.phase==='playing'?g.shield>0?'护盾还剩 '+g.shield.toFixed(1)+' 秒 · 留意退路':g.enemies.length?'放弹先留退路 · 敌人清空后出口才开门':g.map[9][9]===2?'敌人已清空！炸开右下角爪印箱，找到出口。':'出口开门了！走到右下角猫窝。':g.phase==='paused'?'已暂停，点“继续”再走。':g.phase==='lost'?'本局有两次比邻岛复活机会。':'通关！可以进入下一关。');
  text('storage-note',storageFailed?'当前浏览器无法保存，仍可正常游玩。':'关卡和最高分保存在当前浏览器');
  if(g.phase==='lost'&&!offered){offered=true;island?.offer($('panel-card'),()=>{if(!B.revive(g))return false;clear();recorded=false;last=performance.now();update();return true;},()=>g.phase==='lost');}
  else if(g.phase!=='lost'&&offered){offered=false;island?.hide();}
  if(previous!==g.phase&&g.phase!=='playing')$('action').focus({preventScroll:true});previous=g.phase;
 }
 function rect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}}
 function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
 function label(value,x,y,color,size=16){ctx.fillStyle=color;ctx.font='bold '+size+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,x,y);}
 function draw(){
  const view=canvas.getBoundingClientRect(),width=view.width||484,height=view.height||484,dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const unit=Math.max(width,height)/B.SIZE,world=unit*B.SIZE;
  ctx.translate(-Math.max(0,Math.min(world-width,(g.player.x+.5)*unit-width/2)),-Math.max(0,Math.min(world-height,(g.player.y+.5)*unit-height/2)));
  for(let y=0;y<B.SIZE;y++)for(let x=0;x<B.SIZE;x++){
   const px=x*unit,py=y*unit,tile=g.map[y][x];rect(px+1,py+1,unit-2,unit-2,6,(x+y)%2?'#abc77d':'#c7df99');
   if(tile===1&&!window.GameArt?.draw(ctx,'stone',px+2,py+2,unit-4,unit-4)){rect(px+2,py+2,unit-4,unit-4,7,'#a0af8d','#829671');rect(px+5,py+5,unit-10,5,2,'#b9c7a6');}
   if(tile===2&&!window.GameArt?.draw(ctx,'crate',px+4,py+4,unit-8,unit-8)){rect(px+4,py+4,unit-8,unit-8,5,'#c9a77a','#ac8558');ctx.strokeStyle='#e2c699';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+9,py+10);ctx.lineTo(px+unit-9,py+unit-10);ctx.moveTo(px+unit-9,py+10);ctx.lineTo(px+9,py+unit-10);ctx.stroke();}
   if(tile===2&&x===9&&y===9&&!window.GameArt?.draw(ctx,'paw',px+unit*.3,py+unit*.3,unit*.4,unit*.4))label('⌂',px+unit/2,py+unit/2,'#6f5939',22);
  }
  if(g.map[9][9]===0){const x=9*unit,y=9*unit;rect(x+6,y+3,unit-12,unit-6,12,g.enemies.length?'#c3c0af':'#83a277','#61775a');label(g.enemies.length?'⌂':'♡',x+unit/2,y+unit/2,'#fff9e7',23);}
  for(const item of g.items){const x=(item.x+.5)*unit,y=(item.y+.5)*unit;circle(x,y,unit*.3,item.kind==='bomb'?'#85a894':'#d6ab61');label(item.kind==='bomb'?'+':'↔',x,y,'#fffaf0',24);}
  for(const b of g.bombs){
   const x=(b.x+.5)*unit,y=(b.y+.5)*unit;if(!window.GameArt?.draw(ctx,'bomb',x-unit*.35,y-unit*.35,unit*.7,unit*.7))circle(x,y,unit*.29,b.left<.7?'#a36b57':'#514e46');circle(x+8,y-13,4,'#e5ad55');label(String(Math.ceil(Math.max(0,b.left))),x,y,'#fff2ce',16);
  }
  for(const fire of g.fires)for(const p of fire.cells){const x=p.x*unit,y=p.y*unit;if(window.GameArt?.draw(ctx,'flame',x+3,y+3,unit-6,unit-6))continue;rect(x+3,y+3,unit-6,unit-6,9,'#e9984ccc');rect(x+10,y+10,unit-20,unit-20,7,'#ffde8b');}
  for(const e of g.enemies){const x=(e.x+.5)*unit,y=(e.y+.5)*unit;if(window.GameArt?.draw(ctx,g.index>=3?'pinkGhost':'blueGhost',x-unit*.4,y-unit*.4,unit*.8,unit*.8))continue;circle(x,y+2,unit*.32,g.index>=3?'#aa7281':'#b78974');circle(x-6,y-2,3,'#fff6dd');circle(x+6,y-2,3,'#fff6dd');circle(x-6,y-2,1.4,'#564c40');circle(x+6,y-2,1.4,'#564c40');label('⌁',x,y+11,'#f8dfc8',15);}
  const x=g.player.x*unit,y=g.player.y*unit;if(g.shield>0){circle(x+unit/2,y+unit/2,unit*.47,'#98c5b899');}
  if(window.GameArt?.draw(ctx,'catHead',x+2,y+1,unit-4,unit-2)){}else if(cat.complete&&cat.naturalWidth)ctx.drawImage(cat,x+2,y+1,unit-4,unit-2);else{circle(x+unit/2,y+unit/2,unit*.35,'#aa9477');label('卟',x+unit/2,y+unit/2,'#fff5db',18);}
 }
 function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(g.phase==='playing'&&held.size){repeat+=dt;if(repeat>=(held.has('stick')?.28:.16)){repeat=0;B.move(g,...[...held.values()].at(-1));}}
  B.tick(g,dt);update();draw();requestAnimationFrame(frame);
 }
 update();draw();requestAnimationFrame(frame);
})();
