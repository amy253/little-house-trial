(function(){
 'use strict';
 const H=window.BuliHome,$=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),KEY='buli-home-save-v1';
 const island=window.IslandRevive?.create({id:'buli-home'});island?.reset();
 let save,storageFailed=false;
 try{save=H.normalizeSave(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){save=H.normalizeSave(null);storageFailed=true;}
 let g=H.create(0),pointer=null,strokes=[],last=performance.now(),recorded=false,modal='',focusBack=null,warning='',warnUntil=0;
 const catImage=new Image();window.GameArt?.bind?window.GameArt.bind(catImage,'catHead'):catImage.src='buli-head-snack.png';
 function text(id,s){if($(id).textContent!==s)$(id).textContent=s;}
 function stopPointer(){if(pointer!==null){try{canvas.releasePointerCapture(pointer);}catch(e){}pointer=null;}}
 function load(index){island?.reset();stopPointer();g=H.create(index);strokes=[];recorded=false;warning='';$('wait').value='0';hide();update();render();}
 function hide(){island?.hide();modal='';$('dialog').hidden=true;$('level-list').hidden=true;if(focusBack&&focusBack.focus)focusBack.focus();focusBack=null;}
 function show(kind,title,copy,action='知道了'){island?.hide();stopPointer();focusBack=kind==='win'||kind==='loss'?$('restart'):document.activeElement;modal=kind;$('dialog').hidden=false;text('dialog-title',title);text('dialog-copy',copy);text('dialog-action',action);$('level-list').hidden=kind!=='levels';$('dialog-action').focus();if(kind==='loss'){const failedGame=g,valid=()=>g===failedGame&&g.phase==='lost'&&modal==='loss'&&!$('dialog').hidden;island?.offer($('dialog'),()=>{if(!valid()||!H.revive(g))return false;stopPointer();if(g.phase==='drawing'){strokes=[];$('wait').value='0';}recorded=false;last=performance.now();hide();update();render();canvas.focus({preventScroll:true});return true;},valid);}}
 function warn(copy){warning=copy;warnUntil=performance.now()+2200;update();}
 function update(){const drawing=g.phase==='drawing',ready=drawing&&g.path.length>1&&Math.hypot(g.path.at(-1).x-g.level.home.x,g.path.at(-1).y-g.level.home.y)<=24;
  const plan=H.plan(g),left=Math.max(0,g.level.ink-plan.length),planned=drawing?plan.fish:g.collected;
  text('level-number',String(g.index+1).padStart(2,'0'));text('level-title',g.level.name);text('fish-count',`${planned} / 2`);text('best',save.best[g.index]?`${'★'.repeat(save.best[g.index])}${'☆'.repeat(3-save.best[g.index])}`:'未通关');
  text('ink-left',`${Math.floor((left+1e-8)/10)} / ${g.level.ink/10}`);$('ink-fill').style.width=`${left/g.level.ink*100}%`;text('goal',`① → ② → 猫窝 · 三星线量 ≤ ${g.level.gold/10} · 复活通关得1星`);
  $('go').disabled=modal!==''||(!ready&&g.phase!=='paused');text('go',g.phase==='paused'?'继续走 →':ready?(plan.fish<2?`还差鱼干${plan.fish===0?'①':'②'}，仍要出发？`:'出发，带卟哩回家 →'):'画到猫窝，再出发 →');
  $('undo').disabled=!drawing||!g.path.length;$('clear').disabled=!drawing||!g.path.length;$('wait').disabled=!drawing;$('pause').disabled=g.phase!=='running'&&g.phase!=='paused';text('pause',g.phase==='paused'?'▶ 继续':'Ⅱ 暂停');
  let copy=g.level.hint;if(ready&&plan.fish<2)copy=`路线还没按顺序经过鱼干${plan.fish===0?'①':'②'}，直接出发会失败。`;if(g.phase==='running')copy=g.time<g.wait?'先等一等，留意机器人的位置。':g.collected<2?`下一枚是鱼干${g.collected===0?'①':'②'}，留意前面的障碍。`:'晚餐带齐了，小心走完最后一段。';if(g.phase==='paused')copy='已暂停。点“继续走”后再出发。';if(g.phase==='won')copy='回到家啦！重玩可以尝试更短路线拿三星。';if(g.phase==='lost')copy=g.reason==='fish'?'漏掉鱼干了。可以复活保留已捡鱼干，再重新规划路线。':'撞到障碍了，可以找家家复活或重画本关。';if(warning&&performance.now()<warnUntil)copy=warning;text('status',copy);
  text('instruction',g.phase==='drawing'?(plan.fish===2?'晚餐路线已齐！画到猫窝，选好等待时间再出发。':`先经过${plan.fish===0?'①再经过②':'②'}，线量有限，可以抬手续画。`):g.phase==='running'?'出发后不能改线；看清失误，再调整路线或等待时间。':'两枚鱼干都带齐，才能真正回家。');
  text('storage-note',storageFailed?'浏览器暂时不能保存存档，本次仍可玩。':'星星与关卡保存在当前浏览器');
 }
 function position(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*H.W/r.width,y:(e.clientY-r.top)*H.H/r.height};}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false||pointer!==null||modal||g.phase!=='drawing')return;e.preventDefault();canvas.focus();if(!H.begin(g,position(e))){warn('从卟哩脚下，或已经画好的线尾开始。');return;}strokes.push(g.path.length);pointer=e.pointerId;canvas.setPointerCapture(pointer);update();render();});
 function extend(e){if(pointer!==e.pointerId||modal)return;e.preventDefault();const p=position(e),tail=g.path.at(-1);if(!H.append(g,p))warn(tail&&H.pathLength(g)+Math.hypot(p.x-tail.x,p.y-tail.y)>g.level.ink?'线量不够了，撤一段或重新画，试试更短的小路。':'这段路被挡住了。绕过家具，给小爪子留点空间。');else warning='';update();render();}
 canvas.addEventListener('pointermove',extend);canvas.addEventListener('pointerup',e=>{if(pointer===e.pointerId){extend(e);stopPointer();}});canvas.addEventListener('pointercancel',stopPointer);canvas.addEventListener('lostpointercapture',()=>pointer=null);
 function go(){stopPointer();if(modal)return;if(g.phase==='paused')H.resume(g);else if(!H.start(g,Number($('wait').value)))warn('先把路线画到右上角猫窝，再点出发。');last=performance.now();update();}
 $('go').addEventListener('click',go);
 $('wait').addEventListener('change',()=>{update();render();});
 $('undo').addEventListener('click',()=>{stopPointer();if(g.phase!=='drawing')return;const before=strokes.pop();if(before===undefined)H.undo(g);else while(g.path.length>before)H.undo(g);update();render();});
 $('clear').addEventListener('click',()=>{stopPointer();H.clear(g);strokes=[];update();render();});$('restart').addEventListener('click',()=>load(g.index));
 function pause(){stopPointer();H.pause(g);update();}
 $('pause').addEventListener('click',()=>{if(g.phase==='paused'&&!modal)go();else pause();});
 $('help-open').addEventListener('click',()=>{pause();show('help','画一条回家的路','从卟哩脚下开始，按①→②的顺序带齐鱼干，再到右上角猫窝。漏鱼干会失败。\n线量有限：撤回会返还线量，重新画也可以。画线时显示路线经过的鱼干数，实际出发后才捡取。\n机器人沿虚线巡逻；喷水区显示距开启或停止的秒数。选择等待时间，会预览出发时的障碍状态。前4关练路线，后8关练绕行与错峰。\n在三星线量内、不复活通关得3星；更长路线可得2星或1星。复活通关得1星。\n每局可去比邻岛找家家说话复活2次。撞到障碍后保留路线与鱼干；漏鱼干后保留已捡鱼干，返回起点重画。\n键盘：方向键画线，Enter出发，Backspace撤回。');update();});
 $('levels-open').addEventListener('click',()=>{pause();show('levels','小屋里的12条小路','前4关练省线与鱼干顺序，后8关加入巡逻和喷水。带齐两枚鱼干才解锁下一关；短路线、不复活可以拿三星。');$('level-list').replaceChildren();H.levels.forEach((l,i)=>{const b=document.createElement('button');b.textContent=i<save.unlocked?`${String(i+1).padStart(2,'0')} · ${l.name}\n${save.best[i]?'★'.repeat(save.best[i])+'☆'.repeat(3-save.best[i]):'待回家'}`:`${String(i+1).padStart(2,'0')} · 未解锁`;b.disabled=i>=save.unlocked;b.className=i===g.index?'current':'';b.addEventListener('click',()=>{if(i<save.unlocked)load(i);});$('level-list').appendChild(b);});update();});
 $('dialog-close').addEventListener('click',()=>{hide();update();});$('dialog-action').addEventListener('click',()=>{if(modal==='win'){if(g.index<11)load(g.index+1);else{hide();$('levels-open').click();}}else if(modal==='loss')load(g.index);else{hide();update();}});
 canvas.addEventListener('keydown',e=>{if(modal)return;const shifts={ArrowUp:[0,-12],ArrowDown:[0,12],ArrowLeft:[-12,0],ArrowRight:[12,0]};if(shifts[e.key]&&g.phase==='drawing'){e.preventDefault();stopPointer();if(!g.path.length)H.begin(g,g.cat);const p=g.path.at(-1),d=shifts[e.key];if(!H.append(g,{x:p.x+d[0],y:p.y+d[1]}))warn('这里被挡住了，换个方向试试。');update();render();}else if(e.key==='Enter'){e.preventDefault();go();}else if(e.key==='Backspace'){e.preventDefault();stopPointer();H.undo(g);while(strokes.length&&strokes.at(-1)>=g.path.length)strokes.pop();update();render();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);
 document.addEventListener('keydown',e=>{if(!modal)return;if(e.key==='Escape'){e.preventDefault();hide();update();}if(e.key==='Tab'){
   const nodes=[$('dialog-close'),...(!$('level-list').hidden?Array.from($('level-list').children).filter(b=>!b.disabled):[]),$('dialog-action'),...Array.from($('dialog').querySelectorAll?.('.island-revive-widget button, .island-revive-widget a')||[]).filter(b=>!b.disabled&&!b.hidden)],i=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();
 }});
 function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}}
 function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
 function label(copy,x,y,size=12,color='#897564'){ctx.fillStyle=color;ctx.font=`${size}px "Microsoft YaHei", sans-serif`;ctx.textAlign='center';ctx.fillText(copy,x,y);}
 function line(a,b,color,width,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
 function fish(f,picked){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(-.18);ctx.globalAlpha=picked?.15:1;ctx.fillStyle='#c39762';ctx.beginPath();ctx.ellipse(0,0,12,6,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-18,-7);ctx.lineTo(-18,7);ctx.closePath();ctx.fill();circle(6,-1,1.2,'#624a33');line({x:-2,y:-3},{x:-2,y:3},'#eed1a2',1);ctx.restore();}
 function furniture(o){rr(o.x+3,o.y+5,o.w,o.h,9,'#9c84662a');
  if(o.kind==='plant'){rr(o.x,o.y,o.w,o.h,9,'#ddcfb2','#c0ae8c');for(const [dx,dy,r]of [[0,-7,15],[-10,4,13],[11,6,12]])circle(o.x+o.w/2+dx,o.y+o.h/2+dy,r,'#8f9f73','#6f825b');circle(o.x+o.w/2,o.y+o.h/2,5,'#b4bc8e');return;}
  if(o.kind==='shelf'){rr(o.x,o.y,o.w,o.h,6,'#bc9d78','#9c7f5e');const vertical=o.h>o.w;const n=vertical?Math.floor(o.h/52):Math.floor(o.w/45);for(let i=0;i<n;i++){let x=o.x+(vertical?9:9+i*45),y=o.y+(vertical?12+i*52:8);rr(x,y,vertical?o.w-18:28,vertical?32:o.h-16,3,i%2?'#d8c7a7':'#ded5bd','#ad9372');}return;}
  rr(o.x,o.y,o.w,o.h,10,'#a9b69a','#889a79');const horiz=o.w>=o.h;rr(o.x+8,o.y+8,o.w-16,o.h-16,7,'#c0c9ac','#a3af91');if(horiz)line({x:o.x+o.w/2,y:o.y+9},{x:o.x+o.w/2,y:o.y+o.h-9},'#a2b08f',1);else line({x:o.x+8,y:o.y+o.h/2},{x:o.x+o.w-8,y:o.y+o.h/2},'#a2b08f',1);rr(o.x+5,o.y+7,9,o.h-14,4,'#a3b28f');rr(o.x+o.w-14,o.y+7,9,o.h-14,4,'#a3b28f');
 }
 function render(){ctx.clearRect(0,0,H.W,H.H);rr(0,0,H.W,H.H,14,'#eadcc4');for(let y=18;y<540;y+=48){line({x:10,y},{x:422,y},'#d4c5a9',.8);for(let x=20+(Math.floor(y/48)%2)*100;x<432;x+=160)line({x,y},{x,y:y+48},'#d9cbb1',.8);}rr(9,9,414,522,13,null,'#cbbb9d');
  // Small wall details keep the room legible without adding collision objects.
  rr(130,18,74,18,5,'#d8e0d0','#bdc8b1');line({x:167,y:19},{x:167,y:35},'#b2beab',2);rr(318,475,78,38,10,'#ddc1a0');label('BULI',357,499,10,'#ac8c67');
  const home=g.level.home;circle(home.x+2,home.y+8,34,'#b6937150');ctx.beginPath();ctx.ellipse(home.x,home.y+3,33,25,0,0,Math.PI*2);ctx.fillStyle='#cba685';ctx.fill();ctx.strokeStyle='#b5906c';ctx.stroke();ctx.beginPath();ctx.ellipse(home.x,home.y+4,25,17,0,0,Math.PI*2);ctx.fillStyle='#f4dfba';ctx.fill();label('猫窝',home.x,home.y-35,11);label('♥',home.x,home.y+10,18,'#ba8c68');
  const previewTime=g.phase==='drawing'?g.time+Number($('wait').value):g.time;
  for(const h of g.level.hazards){const z=H.hazardAt(h,previewTime);if(h.type==='robot'){line(h.a,h.b,'#b69f7b',2,[5,7]);circle(h.a.x,h.a.y,3,'#b69f7b');circle(h.b.x,h.b.y,3,'#b69f7b');circle(z.x+2,z.y+4,18,'#88756325');circle(z.x,z.y,h.r,'#e9e5da','#adad99');circle(z.x,z.y,11,'#d1d5c6');circle(z.x,z.y-9,2,'#e89b7c');line({x:z.x-7,y:z.y+3},{x:z.x+7,y:z.y+3},'#acb49e',2);}else{rr(h.x,h.y,h.w,h.h,8,z.active?'#a6c9d37a':'#d0d8c73a','#95b6bb');ctx.save();ctx.setLineDash([3,5]);rr(h.x,h.y,h.w,h.h,8,null,'#95b6bb');ctx.restore();const cycle=((previewTime+h.offset)%h.period+h.period)%h.period,left=z.active?h.on-cycle:h.period-cycle;label(`${z.active?'喷水':'干燥'} ${left.toFixed(1)}s`,h.x+h.w/2,h.y+h.h/2+4,10,'#547c85');}}
  g.level.obstacles.forEach(furniture);const planned=g.phase==='drawing'?H.plan(g).fish:g.collected;g.level.fish.forEach((f,i)=>{if(!g.picked.includes(i))circle(f.x,f.y,23,i<planned?'#b9d69c35':null,i===planned?'#b78048':'#b1b99a');fish(f,g.picked.includes(i));circle(f.x,f.y-24,10,i<planned?'#70866a':'#fff8e9','#bba781');label(i===0?'①':'②',f.x,f.y-20,15,i<planned?'#fff8e9':'#9b7048');});
  if(g.path.length){ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(g.path[0].x,g.path[0].y);g.path.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.strokeStyle='#f9fff080';ctx.lineWidth=12;ctx.stroke();ctx.strokeStyle='#7d9a68';ctx.lineWidth=4;ctx.stroke();const tail=g.path.at(-1);circle(tail.x,tail.y,5,'#7d9a68','#fffbe9');}
  if(g.phase==='drawing'&&!g.path.length){circle(g.cat.x,g.cat.y,32,null,'#acb38c');label('从这里画',g.cat.x,g.cat.y+47,11,'#8d9776');}
  if(g.phase!=='drawing'&&g.path.length>1){let spacing=14;for(let i=1;i<=Math.min(g.segment,g.path.length-1);i++){const a=g.path[i-1],b=i===g.segment?g.cat:g.path[i],d=Math.hypot(b.x-a.x,b.y-a.y);while(spacing<d){const x=a.x+(b.x-a.x)*spacing/d,y=a.y+(b.y-a.y)*spacing/d;circle(x,y,2.3,'#62795588');circle(x-2.5,y-4,1.2,'#62795588');circle(x+1,y-5,1.2,'#62795588');circle(x+3.5,y-3.5,1.2,'#62795588');spacing+=28;}spacing-=d;}}
  const c=g.cat,bob=g.phase==='running'&&g.time>g.wait?Math.sin(g.time*16)*2:0;circle(c.x+1,c.y+8,21,'#8d755338');ctx.save();ctx.translate(c.x,c.y+bob);rr(-13,11,10,8,4,'#b59b7d');rr(3,11,10,8,4,'#b59b7d');if(catImage.complete&&catImage.naturalWidth)ctx.drawImage(catImage,-25,-24,50,46);else{circle(0,0,18,'#998570');label('卟哩',0,4,10,'#fffcf4');}ctx.restore();
 }
 function frame(now){
  const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;H.advance(g,dt);
  if(g.phase==='won'&&!recorded){
   recorded=true;save=H.record(save,g.index,g.stars);try{localStorage.setItem(KEY,JSON.stringify(save));}catch(e){storageFailed=true;}
   const score=g.revivals?'本次复活通关，获得1星。':g.stars===3?'路线省又稳，拿到三星！':'试试更短的路线，挑战三星。';
   show('win',g.index===11?'十二条小路，都到家啦！':'卟哩回到家啦！',`${'★'.repeat(g.stars)}${'☆'.repeat(3-g.stars)}\n按顺序带齐两枚鱼干！\n使用线量 ${Math.ceil(H.pathLength(g)/10)} / ${g.level.ink/10}。${score}`,g.index===11?'看看所有小路':'下一条小路 →');
  }else if(g.phase==='lost'&&!recorded){
   recorded=true;const why={furniture:'这条路太挤，卟哩被家具挡住了。',robot:'遇到扫地机器人了，换条路或等一等。',water:'小爪子碰到水了，试着错开喷水时间。',fish:`还有鱼干${g.collected===0?'①':'②'}没带回来，或者经过的顺序不对。复活可以保留已捡鱼干，回起点重画；也可以重新挑战本关。`};
   show('loss','换条小路再试试',why[g.reason]||'重新规划路线或出发时机。','重新画 →');
  }
  update();render();requestAnimationFrame(frame);
 }
 update();render();requestAnimationFrame(frame);
})();
