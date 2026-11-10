(()=>{
 const island=window.IslandRevive?.create({id:'light-wheel'});let roundToken=0;
 function reviveIsland(){if(!W.revive(g))return false;roundToken++;running=true;paused=false;last=performance.now();celebrate=flash=0;$('overlay').hidden=true;$('pause').textContent='暂停';island?.hide();canvas.focus();return true;}
 const $=id=>document.getElementById(id),canvas=$('wheel'),ctx=canvas.getContext('2d'),W=LightWheel;
 const portrait=new Image();portrait.src='jiajia-bonnet-20261021.webp';
 let g=W.create(),running=false,paused=false,last=0,celebrate=0,flash=0,best=Number(localStorage.getItem('jiajia-wheel-best')||0);
 $('best').textContent=best;
 function start(){island?.reset();roundToken++;g=W.create();running=true;paused=false;celebrate=flash=0;$('overlay').hidden=true;$('pause').textContent='暂停';}
 function shoot(){if(running&&!paused&&celebrate<=0)W.fire(g);}
 function stick(x,y,a,color){ctx.save();ctx.translate(x,y);ctx.rotate(a);
 if(window.GameArt?.spriteUrl('lightstick')){ctx.save();ctx.rotate(Math.PI);window.GameArt.draw(ctx,'lightstick',-9,-54,18,54);ctx.restore();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,37,7,0,Math.PI*2);ctx.stroke();ctx.restore();return;}ctx.lineCap='round';ctx.strokeStyle='#657c70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,29);ctx.stroke();ctx.shadowColor=color;ctx.shadowBlur=12;ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-6,20,12,30,5);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#79563b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff9ed';ctx.fillRect(-2,24,3,17);ctx.restore();}
 function draw(){ctx.clearRect(0,0,432,520);const bg=ctx.createLinearGradient(0,0,0,520);bg.addColorStop(0,'#e4eee5');bg.addColorStop(1,'#fbf4e9');ctx.fillStyle=bg;ctx.fillRect(0,0,432,520);
 window.GameArt?.scene(ctx,'stage',0,0,432,520);ctx.fillStyle='#fff2d5d9';ctx.beginPath();ctx.roundRect(22,30,388,458,30);ctx.fill();
 ctx.strokeStyle='#a47b49';ctx.lineWidth=3;ctx.stroke();
 ctx.strokeStyle='#cbd9cb';ctx.lineWidth=1;for(const r of [155,185]){ctx.beginPath();ctx.arc(216,218,r,0,Math.PI*2);ctx.stroke();}
 g.pins.forEach((p,i)=>{const a=p+g.angle;stick(216+Math.cos(a)*68,218+Math.sin(a)*68,a-Math.PI/2,i%2?'#e9acbb':'#e4bd75');});
 ctx.fillStyle='#fff3de';ctx.shadowColor='#6b806b33';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(216,218,67,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.save();ctx.beginPath();ctx.arc(216,218,64,0,Math.PI*2);ctx.clip();if(window.GameArt?.spriteUrl('catHead')){window.GameArt.draw(ctx,'jiajia',160,158,83,119);window.GameArt.draw(ctx,'catHead',211,212,64,64);}else if(portrait.complete&&portrait.naturalWidth)ctx.drawImage(portrait,152,154,128,128);ctx.restore();ctx.strokeStyle='#759b7c';ctx.lineWidth=5;ctx.beginPath();ctx.arc(216,218,66,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.fillStyle='#c3b17c';ctx.strokeStyle='#6e6145';ctx.lineWidth=1;ctx.beginPath();ctx.arc(216+Math.cos(a)*66,218+Math.sin(a)*66,2.5,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.textAlign='center';
 if(running&&g.status==='playing'){stick(216,445,Math.PI,'#e9acbb');g.shots.forEach(s=>stick(216,445-(.18-s.remaining)/.18*159,Math.PI,'#e9acbb'));}
 if(celebrate>0){ctx.fillStyle='#587561';ctx.font='bold 21px Microsoft YaHei';ctx.fillText('第 '+g.round+' 轮 · '+(g.direction<0?'反向旋转':'继续点亮'),216,385);ctx.strokeStyle='#e5be78';ctx.lineWidth=4;ctx.beginPath();ctx.arc(216,218,72+(1-celebrate/.75)*70,0,Math.PI*2);ctx.stroke();}
 if(flash>0){ctx.fillStyle='rgba(215,112,121,'+flash*.25+')';ctx.fillRect(0,0,432,520);}
 $('score').textContent=g.score;$('round').textContent=g.round;$('left').textContent=g.target-g.hits;
 }
 function frame(t){const dt=Math.min(.035,(t-last)/1000||0);last=t;if(running&&!paused){if(celebrate>0)celebrate-=dt;else{const round=g.round,score=g.score;W.step(g,dt);if(g.round!==round)celebrate=.75;if(g.score!==score){best=Math.max(best,g.score);localStorage.setItem('jiajia-wheel-best',best);$('best').textContent=best;}if(g.status==='lost'){running=false;flash=1;$('title').textContent='这次点亮 '+g.score+' 根';$('description').textContent='撞到应援棒啦。最高分 '+best+' 根，再试一次，等空隙转到底部再点。';$('start').textContent='再来一次';const token=roundToken;setTimeout(()=>{if(token!==roundToken||g.status!=='lost')return;$('overlay').hidden=false;island?.offer($('start').parentElement,reviveIsland,()=>g.status==='lost');},300);}}}flash=Math.max(0,flash-dt*2);draw();requestAnimationFrame(frame);}
 $('start').onclick=start;$('restart').onclick=start;canvas.addEventListener('pointerdown',e=>{e.preventDefault();shoot();});document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();shoot();}});
 $('pause').onclick=()=>{if(!running)return;paused=!paused;$('pause').textContent=paused?'继续':'暂停';$('status').textContent=paused?'已暂停':'点屏幕发射 · 电脑也可按空格';};document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)$('pause').click();});requestAnimationFrame(frame);
})();
