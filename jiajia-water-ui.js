(function(){
 'use strict';
 const W=window.JiajiaWater,E=window.WaterDecanta,$=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),field=$('playfield');
 const COLORS=['#ed6579','#549be5','#72b568','#efc648','#ef934d','#a77ccc','#39b6b0','#ed9fc9'],NAMES=['红','蓝','绿','黄','橙','紫','青','粉'];
 const tint=(hex,f)=>'#'+hex.slice(1).match(/../g).map(c=>Math.round(parseInt(c,16)*(1-Math.abs(f))+(f>0?255:0)*Math.abs(f)).toString(16).padStart(2,'0')).join(''),LIGHT=COLORS.map(c=>tint(c,.20)),DARK=COLORS.map(c=>tint(c,-.18));
 const island=window.IslandRevive.create({id:'jiajia-water'}),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let game=null,round=0,worker=null,workerTimer=null,lastTime=null,lastSave=0,selected=-1,animation=null,places=[],width=0,height=0,handled=false,lastClock='',previousFocus=null;
 const format=ms=>`${Math.floor(Math.ceil(ms/1000)/60).toString().padStart(2,'0')}:${(Math.ceil(ms/1000)%60).toString().padStart(2,'0')}`;
 function persist(){if(!game)return;try{localStorage.setItem(W.SAVE_KEY,W.save(game));}catch(_){$('feedback').textContent='浏览器未允许存档，本次仍可继续玩';}}
 function syncClock(){const now=performance.now();if(game&&lastTime!==null)W.tick(game,now-lastTime);lastTime=game?.status==='playing'&&!game.paused?now:null;}
 function poly(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
 function bottle(p,tube,{cut=0,add=0,color=0,active=false,target=false,index=0}={}){
  const outer=E.polyToWorld(E.bottlePoly(p.w,p.h),p),inner=E.polyToWorld(E.buildTubeShape(p.w,p.h).poly,p),area=E.shoelace(inner),bottom=E.yBounds(inner).max;
  ctx.save();ctx.lineJoin='round';ctx.shadowColor=active||target?'#5b8d6255':'#476e3822';ctx.shadowBlur=active||target?14:7;poly(outer);const glass=ctx.createLinearGradient(p.cx-p.w/2,0,p.cx+p.w/2,0);glass.addColorStop(0,'#d6e9df');glass.addColorStop(.18,'#ffffffd9');glass.addColorStop(.68,'#ffffff88');glass.addColorStop(1,'#bfd6cb');ctx.fillStyle=glass;ctx.fill();ctx.shadowBlur=0;
  const bands=[];for(const c of tube){const tail=bands[bands.length-1];if(tail?.color===c)tail.units++;else bands.push({color:c,units:1});}
  for(let i=bands.length-1,left=cut;i>=0&&left>0;i--){const take=Math.min(bands[i].units,left);bands[i].units-=take;left-=take;}
  if(add>0){const tail=bands[bands.length-1];if(tail?.color===color)tail.units+=add;else bands.push({color,units:add});}
  ctx.save();poly(inner);ctx.clip();let volume=0,prev=bottom;
  // Paint exact disjoint horizontal bands. Liquid stays level as glass rotates.
  for(const band of bands){if(band.units<=0)continue;volume+=band.units;const y=E.waterline(inner,volume*area/4,23),g=ctx.createLinearGradient(p.cx-p.w/2,0,p.cx+p.w/2,0);g.addColorStop(0,DARK[band.color]);g.addColorStop(.20,COLORS[band.color]);g.addColorStop(.42,LIGHT[band.color]);g.addColorStop(.72,COLORS[band.color]);g.addColorStop(1,DARK[band.color]);ctx.fillStyle=g;ctx.fillRect(p.cx-p.h,y,p.h*2,Math.max(0,prev-y)+.45);ctx.fillStyle=LIGHT[band.color];ctx.beginPath();ctx.ellipse(p.cx,y+1,p.w*.46,Math.min(3.2,p.w*.045),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff44';ctx.fillRect(p.cx-p.h,y,p.h*2,1);prev=y;}
  ctx.restore();poly(outer);ctx.strokeStyle=active?'#315f49':target?'#6b9360':'#88a59a';ctx.lineWidth=active||target?2.4:1.6;ctx.stroke();
  const shine=E.bottleProfileLeft(p.w,p.h,E.CLASSIC_SHAPE,p.w*.09);ctx.beginPath();shine.map(point=>E.toWorld(point,p)).forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));ctx.strokeStyle='#ffffffbd';ctx.lineWidth=Math.max(2,p.w*.045);ctx.lineCap='round';ctx.stroke();
  const rim=[{x:-p.w*.20,y:-p.h/2+2},{x:p.w*.20,y:-p.h/2+2}].map(v=>E.toWorld(v,p));ctx.beginPath();ctx.moveTo(rim[0].x,rim[0].y);ctx.lineTo(rim[1].x,rim[1].y);ctx.strokeStyle='#ffffffdd';ctx.lineWidth=3;ctx.stroke();
  ctx.restore();if(!p.angle){const done=E.isTubeDone(tube,4)&&tube.length;ctx.fillStyle=done?'#315f49':'#53684d';ctx.font='600 12px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(done?'已归类':tube.length?String(index+1):'空瓶',p.cx,p.cy+p.h/2+21);if(active||target){const label=active?'已选':'倒这里',w=target?Math.min(54,p.cellW-6):42,y=Math.max(2,p.cy-p.h/2-25);ctx.beginPath();ctx.roundRect(p.cx-w/2,y,w,21,7);ctx.fillStyle=active?'#315f49':'#d5e9c9';ctx.fill();ctx.fillStyle=active?'#ffffff':'#315f49';ctx.font='600 11px system-ui,sans-serif';ctx.fillText(label,p.cx,y+14);}}
 }
 function draw(now=performance.now()){
  ctx.clearRect(0,0,width,height);if(!game)return;
  let a=animation,t=a?Math.min(1,(now-a.start)/a.duration):1;
  for(let i=0;i<places.length;i++){
   if(a&&i===a.from)continue;const p=places[i],tube=a&&i===a.to?a.before.tubes[i]:game.board.tubes[i];
   ctx.save();ctx.translate(p.cx,p.cy+p.h/2+5);ctx.scale(1,.16);const shadow=ctx.createRadialGradient(0,0,1,0,0,p.w*.85);shadow.addColorStop(0,'#70926935');shadow.addColorStop(1,'#70926900');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,p.w*.85,0,Math.PI*2);ctx.fill();ctx.restore();
   bottle({...p,cy:p.cy-(selected===i?12:0),angle:0},tube,{index:i,active:selected===i,target:selected>=0&&E.canPour(game.board,selected,i),add:a&&i===a.to?a.amount*Math.min(1,Math.max(0,(t-.3)/.4)):0,color:a?.color});
  }
  if(a){
   const p=places[a.from],d=places[a.to],direction=d.cx>width/2?1:-1,angle=direction*1.58,lip=E.toWorld({x:direction*p.w*.23,y:-p.h/2},{cx:0,cy:0,angle}),end={cx:d.cx-lip.x,cy:d.cy-d.h/2-12-lip.y};
   const travel=t<.3?t/.3:t>.7?(1-t)/.3:1,ease=travel*travel*(3-2*travel),pose={...p,cx:p.cx+(end.cx-p.cx)*ease,cy:p.cy+(end.cy-p.cy)*ease,angle:angle*ease};
   const fraction=Math.min(1,Math.max(0,(t-.3)/.4));bottle(pose,a.before.tubes[a.from],{index:a.from,cut:a.amount*fraction,active:true});
   if(t>=.3&&t<=.7){const mouth=E.toWorld({x:direction*p.w*.23,y:-p.h/2},pose);ctx.beginPath();ctx.moveTo(mouth.x,mouth.y);ctx.quadraticCurveTo(d.cx,d.cy-d.h/2-8,d.cx,d.cy-d.h/2+13);ctx.strokeStyle=COLORS[a.color];ctx.lineWidth=4;ctx.lineCap='round';ctx.stroke();}
  }
 }
 function layout(){
  const rect=field.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!game)return;
  const count=game.board.tubes.length;let best=null;
  for(let cols=2;cols<=Math.min(12,count);cols++){const rows=Math.ceil(count/cols),cellW=width/cols,cellH=height/rows,h=Math.min(230,cellH-50,(cellW-18)/.39);if(cellW<48||h<30)continue;const score=h-(rows===1?5:0);if(!best||score>best.score)best={cols,rows,cellW,cellH,h,score};}
  if(!best)best={cols:count,rows:1,cellW:width/count,cellH:height,h:Math.max(25,height-45)};
  places=Array.from({length:count},(_,i)=>{const row=Math.floor(i/best.cols),inRow=Math.min(best.cols,count-row*best.cols),col=i%best.cols;return{cx:width/2+(col-(inRow-1)/2)*best.cellW,cy:(row+.5)*best.cellH-2,w:best.h*.39,h:best.h,cellW:best.cellW,cellH:best.cellH};});
  updateButtons();draw();
 }
 function updateButtons(){
  if(!game)return;const host=$('bottles');if(host.children.length!==places.length){host.replaceChildren(...places.map((_,i)=>{const b=document.createElement('button');b.type='button';b.className='bottle';b.dataset.index=i;b.addEventListener('click',()=>choose(i));return b;}));}
  [...host.children].forEach((b,i)=>{const p=places[i],t=game.board.tubes[i];b.style.cssText=`left:${p.cx-p.cellW/2+2}px;top:${Math.max(0,p.cy-p.cellH/2+2)}px;width:${p.cellW-4}px;height:${p.cellH-4}px`;
   b.dataset.colors=t.join(',');b.setAttribute('aria-label',`第${i+1}瓶：${t.length?t.map(c=>NAMES[c]).join('、')+'（从底到顶）':'空瓶'}`);b.setAttribute('aria-pressed',String(selected===i));b.disabled=!!animation||game.paused||game.status!=='playing';});
  $('undo').disabled=!!animation||game.paused||game.status!=='playing'||!game.history.length;
 }
 function hud(){if(!game)return;$('level').textContent=`第 ${game.level} 关`;$('moves').textContent=game.moves;const clock=format(game.remainingMs);if(clock!==lastClock){$('clock').textContent=clock;lastClock=clock;}$('clock').classList.toggle('urgent',game.remainingMs<=30000);}
 function hideDialog(){island.hide();$('dialog').hidden=true;field.inert=false;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function dialog(title,copy,actions){
  if(game)game.paused=true;lastTime=null;animation=null;selected=-1;island.hide();previousFocus=document.activeElement;$('dialog-title').textContent=title;$('dialog-copy').textContent=copy;$('dialog-actions').replaceChildren();
  actions.forEach(([label,action,primary])=>{const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';b.addEventListener('click',action);$('dialog-actions').appendChild(b);});
  $('dialog').hidden=false;field.inert=true;updateButtons();draw();$('dialog-actions').querySelector('button')?.focus({preventScroll:true});persist();
 }
 function resume(){if(!game||game.status!=='playing'||document.hidden)return;hideDialog();game.paused=false;lastTime=performance.now();updateButtons();persist();}
 function pause(){if(!game||game.status!=='playing')return;syncClock();if(game.status!=='playing'){settle();return;}dialog('先歇一会儿',`第 ${game.level} 关 · 已倒 ${game.moves} 步\n时间已暂停，进度会自动保存。`,[['继续倒果汁',resume,true],['重开这一关',restart]]);}
 function restart(){if(!game)return;const level=game.level,puzzle={board:game.initial};round++;worker?.terminate();worker=null;clearTimeout(workerTimer);game=W.create(level,puzzle);island.reset();handled=false;selected=-1;animation=null;lastTime=null;hideDialog();layout();hud();persist();if(document.hidden)pause();else resume();}
 function settle(){
  hud();if(!game||game.status==='playing'||handled)return;handled=true;persist();
  if(game.status==='won'){dialog('这一瓶，刚刚好',`第 ${game.level} 关完成 · ${game.moves} 步\n下一关会换一组新果汁。`,[['下一关',()=>start(game.level+1),true],['再玩这一关',restart]]);}
  else{dialog(game.reason==='time'?'时间到了':'暂时倒不动了',`第 ${game.level} 关 · 已倒 ${game.moves} 步\n复活会保留果汁，加一个空瓶和至少60秒。`,[['重开这一关',restart]]);const identity=round;
   island.offer($('revive-host'),()=>{if(identity!==round||!W.revive(game))return false;handled=false;layout();hud();persist();dialog('空瓶送来了',`果汁都保留了，本局剩余 ${2-game.revives} 次复活。\n点继续才会重新计时。`,[['继续倒果汁',resume,true],['重开这一关',restart]]);return true;},()=>identity===round&&game?.status==='lost');
  }
 }
 function choose(index){
  syncClock();if(!game||game.paused||game.status!=='playing'||animation){settle();return;}
  if(index===selected){selected=-1;$('feedback').textContent='已放下，重新选一瓶';updateButtons();draw();return;}
  if(selected<0){if(!game.board.tubes[index].length){$('feedback').textContent='这是空瓶，先选有果汁的一瓶';return;}selected=index;$('feedback').textContent=`已选第 ${index+1} 瓶 · 再点空瓶或同色瓶`;updateButtons();draw();return;}
  const from=selected,before=E.cloneState(game.board),amount=W.pour(game,from,index);
  if(!amount){$('feedback').textContent=game.board.tubes[index].length>=4?'这一瓶已经满了':'只能倒进空瓶，或顶部同色的瓶子';if(game.board.tubes[index].length)selected=index;updateButtons();draw();return;}
  selected=-1;$('feedback').textContent=`第 ${from+1} 瓶 → 第 ${index+1} 瓶`;persist();hud();
  if(reduced.matches){updateButtons();draw();settle();return;}
  animation={from,to:index,amount,color:before.tubes[from].at(-1),before,start:performance.now(),duration:650};updateButtons();
 }
 function start(level){
  round++;const identity=round;worker?.terminate();clearTimeout(workerTimer);island.reset();handled=false;animation=null;selected=-1;lastTime=null;
  dialog('准备新果汁','正在校验这一局能顺利归类…',[]);
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  function receive(puzzle){if(identity!==round)return;clearTimeout(workerTimer);worker?.terminate();worker=null;game=W.create(level,puzzle);handled=false;hideDialog();layout();hud();persist();if(document.hidden)pause();else resume();$('feedback').textContent='先点一瓶，再点另一瓶倒入';}
  function fallback(){receive(W.generate(level,seed,{attempts:0}));}
  try{worker=new Worker('jiajia-water-worker.js');worker.onmessage=event=>{if(identity!==round||event.data.round!==identity)return;event.data.error?fallback():receive(event.data.puzzle);};worker.onerror=event=>{event.preventDefault();if(identity===round)fallback();};worker.postMessage({round:identity,level,seed});workerTimer=setTimeout(()=>{if(identity===round)fallback();},10000);}catch(_){fallback();}
 }
 $('pause').addEventListener('click',pause);$('undo').addEventListener('click',()=>{syncClock();if(game&&!game.paused&&!animation&&W.undo(game)){selected=-1;updateButtons();draw();hud();persist();$('feedback').textContent='撤回了一步，时间不会退回';}settle();});
 $('restart').addEventListener('click',()=>{if(!game)return;syncClock();if(game.status!=='playing'){settle();return;}dialog('重开这一关？','瓶子回到这一关的开始，计时与两次复活也重新开始。',[['继续当前局',resume,true],['确认重开',restart]]);});
 $('help').addEventListener('click',()=>{if(!game||game.status!=='playing')return;syncClock();if(game.status!=='playing'){settle();return;}dialog('把同色果汁装在一起','① 点有果汁的瓶子，再点目标瓶。\n② 只能倒进空瓶或顶部同色的瓶子。\n③ 每瓶装满一种颜色，就能去下一关。\n点错可撤回；退出会保存。失败可去比邻岛找家家说话，每次尝试两次复活。',[['知道了，继续',resume,true]]);const a=document.createElement('a');a.href='https://github.com/alliterhorst/decanta-water-sort';a.target='_blank';a.rel='noopener noreferrer';a.className='source-link';a.textContent='规则与瓶子几何：Decanta · MIT';$('dialog-actions').appendChild(a);});
 function size(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px');animation=null;layout();updateButtons();if(game?.status!=='playing')settle();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',()=>{syncClock();if(game)game.paused=true;persist();});window.addEventListener('resize',size);window.visualViewport?.addEventListener('resize',size);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('dialog').hidden){event.preventDefault();pause();}if(event.key==='Tab'&&!$('dialog').hidden){const buttons=[...$('dialog').querySelectorAll('button:not(:disabled),a[href]')].filter(n=>n.getClientRects().length),first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 function frame(now){
  syncClock();if(game){hud();if(animation){draw(now);if(now-animation.start>=animation.duration){animation=null;updateButtons();draw();settle();}}else if(game.status!=='playing')settle();if(now-lastSave>1000){persist();lastSave=now;}}
  requestAnimationFrame(frame);
 }
 size();try{game=W.restore(localStorage.getItem(W.SAVE_KEY));}catch(_){}
 if(game){round++;island.reset(game.revives);layout();hud();if(game.status==='playing')dialog('接着上次玩',`第 ${game.level} 关 · 已倒 ${game.moves} 步\n果汁、时间和剩余复活次数都保留了。`,[['继续倒果汁',resume,true],['重开这一关',restart]]);else settle();}else start(1);
 requestAnimationFrame(frame);
})();
