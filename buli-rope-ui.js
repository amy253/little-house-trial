(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./buli-rope.js'));else{root.BuliRopeUI=factory(root.BuliRope);root.buliRopeApp=root.BuliRopeUI.mount(root);}})(typeof globalThis==='object'?globalThis:this,function(R){
 'use strict';
 function mount(win){
  const doc=win.document,$=id=>doc.getElementById(id),canvas=$('rope-canvas'),ctx=canvas.getContext('2d'),panel=$('panel'),card=$('panel-card');
  let save;try{save=R.normalizeSave(JSON.parse(win.localStorage.getItem(R.SAVE_KEY)||'null'));}catch(_){save=R.normalizeSave();}
  let game=R.create(0,save),last=null,clock=0,handled=false,resultClock=0,particles=[],trail=[],audio=null,mode='ready';
  const island=win.IslandRevive?.create({id:'buli-rope'});
  const ropeButtons=[0,1,2].map(i=>$(`cut-rope-${i}`)),bubbleButton=$('pop-bubble');
  function syncControls(){
   const disabled=game.paused||game.status!=='playing',count=game.ropes.length;
   ropeButtons.forEach((button,i)=>{const rope=game.ropes[i];button.hidden=!rope||rope.cut;button.disabled=disabled||!rope||rope.cut;button.textContent=count===1?'剪断绳子':count===2?(i===0?'剪左绳':'剪右绳'):['剪左绳','剪中绳','剪右绳'][i];button.setAttribute('aria-label',count===1?'剪断当前绳子':`剪断当前${button.textContent.slice(1)}`);});
   bubbleButton.hidden=!game.bubble;bubbleButton.disabled=disabled||!game.bubble;
  }
  function focusRemaining(previous){if(doc.activeElement!==previous||!previous.hidden)return;const next=[...ropeButtons,bubbleButton].find(b=>!b.hidden&&!b.disabled);if(next)next.focus();else canvas.focus();}
  ropeButtons.forEach((button,id)=>button.addEventListener('click',()=>{
   const rope=game.ropes[id];if(game.paused||game.status!=='playing'||!rope||rope.cut)return;
   const x=(rope.x+game.fish.x)/2,y=(rope.y+game.fish.y)/2,dx=game.fish.x-rope.x,dy=game.fish.y-rope.y,length=Math.hypot(dx,dy)||1;
   R.action(game,{type:'swipe',points:[{x:x-dy/length*16,y:y+dx/length*16},{x:x+dy/length*16,y:y-dx/length*16}]});syncControls();focusRemaining(button);
  }));
  bubbleButton.addEventListener('click',()=>{if(game.paused||game.status!=='playing'||!game.bubble)return;R.action(game,{type:'tap',x:game.fish.x,y:game.fish.y});syncControls();focusRemaining(bubbleButton);});
  const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const portrait=new win.Image();let portraitReady=false;portrait.onload=()=>{portraitReady=true;};portrait.src='buli-hop-standing.png';
  function persist(){try{win.localStorage.setItem(R.SAVE_KEY,JSON.stringify(save));$('save-status').textContent='星星与关卡自动保存';}catch(_){$('save-status').textContent='本次进度未能保存，可继续游玩';}}
  function soundMark(){const enabled=save.sound;$('sound').textContent=enabled?'♪':'♩';$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'关闭声音':'打开声音');}
  function tone(kind){
   if(!save.sound)return;
   try{const AudioContext=win.AudioContext||win.webkitAudioContext;if(!AudioContext)return;audio||=new AudioContext();if(audio.state==='suspended')audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.type='sine';const now=audio.currentTime;osc.frequency.setValueAtTime(kind==='star'?790:kind==='won'?590:kind==='pop'?430:280,now);osc.frequency.exponentialRampToValueAtTime(kind==='won'?980:180,now+.13);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.18);osc.start(now);osc.stop(now+.2);}catch(_){}
  }
  function button(label,action,primary){return `<button data-action="${action}"${primary?' class="primary"':''}>${label}</button>`;}
  function show(content,newMode){island?.hide();R.action(game,{type:'pause',value:true});syncControls();trail=[];mode=newMode;card.innerHTML=content;panel.hidden=false;}
  function resume(){panel.hidden=true;mode='playing';last=null;R.action(game,{type:'pause',value:false});syncControls();canvas.focus();}
  function ready(){show(`<div class="tag">FISH DELIVERY · ${String(game.index+1).padStart(2,'0')}</div><h2>${game.level.title}</h2><p>${game.level.hint}</p><p class="tiny">划过或点一下绳子都能剪断<br>把小鱼送到卟哩面前，它就会吃到啦</p><div class="panel-buttons">${button('开饭啦','start',true)}</div>`,'ready');}
  function load(index){save=R.getSave(game);game=R.create(index,save);island?.reset();handled=false;particles=[];trail=[];resultClock=0;$('level-title').textContent=`${String(index+1).padStart(2,'0')} / ${game.level.title}`;$('hint').textContent=game.level.hint;$('stars').textContent='☆ ☆ ☆';ready();}
  function levelMenu(){const rows=R.levels.map((level,i)=>`<button data-level="${i}" aria-label="第${i+1}关 ${level.title}"${i>=save.unlocked?' disabled':''}>${i>=save.unlocked?'·':i+1}<small>${i>=save.unlocked?'未解锁':'★'.repeat(save.best[i])+'☆'.repeat(3-save.best[i])}</small></button>`).join('');show(`<div class="tag">TWELVE LITTLE TREATS</div><h2>鱼鱼快递地图</h2><p>星星不影响解锁，每次开饭都是新机会。</p><div class="level-grid">${rows}</div><div class="panel-buttons">${button('回到这一关','resume')}</div>`,'levels');}
  function help(){show(`<div class="tag">A SMALL GUIDE</div><h2>给卟哩送小鱼</h2><div class="help-lines"><p>✂ 划过绳子后松手，就能剪断。也可以直接点绳子。</p><p>☆ 沿途收星星；没有星星也能通关。</p><p>○ 气泡会托着鱼往上飞，点气泡让它落下。气泡里的鱼还不能吃哦。</p><p>≈ 薄荷色区域有风，会把小鱼推向箭头方向。</p><p>△ 避开红色刺板。摆动关看虚线落点，绿色提示亮起时剪绳。</p></div><div class="panel-buttons">${button('明白了，继续','resume',true)}</div>`,'help');}
  function pause(){show(`<div class="tag">TAKE YOUR TIME</div><h2>卟哩等你回来</h2><p>小鱼和时间都停住了。</p><div class="panel-buttons">${button('继续开饭','resume',true)}${button('重新开始','restart')}</div>`,'pause');}
  function result(){
   const won=game.status==='won',lastLevel=game.index===11;
   show(`<div class="tag">${won?'NOM NOM · THANK YOU':'ONE MORE LITTLE TRY'}</div><h2>${won?(lastLevel?'鱼鱼全部送到啦':'卟哩：还想吃！'):'小鱼溜走啦'}</h2>${won?`<div class="result-stars">${'★'.repeat(game.collected)+'☆'.repeat(3-game.collected)}</div>`:''}<p>${won?(lastLevel?'十二份小心意，卟哩都收到了。':'这顿小鱼吃得好香。再去送下一份吧。'):game.lossReason==='spikes'?'碰到刺板了，试着先摆到安全的一侧。':'换个剪绳时机再试试，卟哩会等你。'}</p><div class="panel-buttons">${button('再玩这一关','restart')}${won&&!lastLevel?button('下一份小鱼','next',true):button('关卡地图','map',won)}</div>`,'result');
   if(!won){const failed=game;island?.offer(card,()=>{if(game!==failed||!R.revive(game))return false;handled=false;resultClock=0;last=null;trail=[];particles=[];panel.hidden=true;mode='playing';island?.hide();syncControls();canvas.focus();return true;},()=>game===failed&&game.status==='lost'&&mode==='result');}
  }
  card.addEventListener('click',event=>{
   const target=event.target.closest('[data-action],[data-level]');if(!target||target.disabled)return;
   if(target.dataset.level!=null){load(Number(target.dataset.level));return;}
   switch(target.dataset.action){case'start':case'resume':if(game.status!=='playing'){result();}else resume();break;case'restart':load(game.index);break;case'next':load(game.index+1);break;case'map':levelMenu();break;}
  });
  $('restart').addEventListener('click',()=>load(game.index));$('pause').addEventListener('click',()=>mode==='pause'?resume():pause());$('levels').addEventListener('click',levelMenu);$('help').addEventListener('click',help);
  $('sound').addEventListener('click',()=>{save.sound=!save.sound;game.save.sound=save.sound;soundMark();persist();if(save.sound)tone('star');});
  function point(event){const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*432/rect.width,y:(event.clientY-rect.top)*600/rect.height};}
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0||event.isPrimary===false||game.paused||game.status!=='playing'||game.gesture)return;event.preventDefault();const p=point(event);R.action(game,{type:'down',id:event.pointerId,...p});trail=[p];try{canvas.setPointerCapture(event.pointerId);}catch(_){};});
  canvas.addEventListener('pointermove',event=>{if(game.gesture?.id!==event.pointerId)return;event.preventDefault();const p=point(event);R.action(game,{type:'move',id:event.pointerId,...p});trail.push(p);if(trail.length>50)trail.shift();});
  canvas.addEventListener('pointerup',event=>{if(game.gesture?.id!==event.pointerId)return;event.preventDefault();R.action(game,{type:'up',id:event.pointerId,...point(event)});trail=[];try{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch(_){};});
  const cancel=event=>{R.action(game,{type:'cancel',id:event.pointerId});trail=[];};canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden&&game.status==='playing')pause();});win.addEventListener('blur',()=>{if(game.status==='playing')pause();});
  canvas.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();pause();}});
  function ellipse(x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function text(label,x,y,size,color,align='center'){ctx.font=`${size}px "Microsoft YaHei",sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(label,x,y);}
  function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function star(x,y,r,fill,stroke){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;const px=x+Math.cos(a)*q,py=y+Math.sin(a)*q;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function scissors(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineWidth=2;ellipse(-5,6,4,4,null,'#657663');ellipse(5,6,4,4,null,'#657663');ctx.beginPath();ctx.moveTo(-3,3);ctx.lineTo(8,-11);ctx.moveTo(3,3);ctx.lineTo(-8,-11);ctx.strokeStyle='#657663';ctx.stroke();ctx.restore();}
  function background(){
   const g=ctx.createLinearGradient(0,0,0,600);g.addColorStop(0,'#fff8e9');g.addColorStop(1,'#ead8b8');ctx.fillStyle=g;ctx.fillRect(0,0,432,600);
   ctx.fillStyle='#fffdf34d';for(let i=0;i<9;i++)ctx.fillRect(i*52+9,0,26,600);
   ctx.strokeStyle='#c8b48d40';ctx.lineWidth=1;for(let y=20;y<600;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(432,y+4);ctx.stroke();}
   round(14,15,404,29,10,'#f1e4cc','#d8c5a5');text('卟 哩 的 小 屋 · 鱼 鱼 快 递',216,34,10,'#998467');
   ctx.strokeStyle='#8ca17e65';ctx.lineWidth=2;for(const side of [0,1]){const x=side?414:18;ctx.beginPath();ctx.moveTo(x,57);ctx.quadraticCurveTo(x+(side?-10:10),87,x,119);ctx.stroke();for(let i=0;i<3;i++){ctx.save();ctx.translate(x,63+i*17);ctx.rotate(side?-.7:.7);ellipse(side?-5:5,0,8,3,'#8ba77b65');ctx.restore();}}
   ctx.fillStyle='#e0cba5';ctx.fillRect(0,555,432,45);ctx.strokeStyle='#c7b18c';ctx.beginPath();ctx.moveTo(0,555);ctx.lineTo(432,555);ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(i*135,555);ctx.lineTo(i*135-20,600);ctx.stroke();}
   text('made with a little patience',216,586,9,'#aa9475');win.GameArt?.scene(ctx,'wood',0,0,432,600);
  }
  function fan(){const f=game.level.fan;if(!f)return;ctx.save();ctx.fillStyle='#8ba99215';ctx.fillRect(f.x,f.y,f.w,f.h);ctx.strokeStyle='#8fa38c';ctx.globalAlpha=.42;ctx.lineWidth=1.6;const shift=reduced?0:clock*22%62;for(let row=0;row<3;row++)for(let i=0;i<4;i++){const x=f.x+20+i*70+(f.force>0?shift:-shift),y=f.y+25+row*52;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+12,y-5,x+28,y+5,x+38,y);ctx.stroke();}ctx.restore();const x=f.force>0?35:397,y=f.y+f.h/2;round(x-17,y+15,34,10,4,'#8b9f85');ctx.lineWidth=2;ctx.strokeStyle='#778b73';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+20);ctx.stroke();ellipse(x,y,22,22,'#edf4e6','#809877');ctx.save();ctx.translate(x,y);ctx.rotate(reduced?0:clock*4);for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ellipse(0,-10,5,9,'#a4b898');}ctx.restore();ellipse(x,y,4,4,'#7b9173');text(f.force>0?'→':'←',x,y+45,19,'#779470');}
  function hazards(){for(const h of game.level.hazards||[]){round(h.x,h.y,h.w,h.h,3,'#b98a79','#956c5b');for(let x=h.x+5;x<h.x+h.w-4;x+=15){ctx.beginPath();ctx.moveTo(x,h.y+h.h-2);ctx.lineTo(x+6,h.y+1);ctx.lineTo(x+12,h.y+h.h-2);ctx.fillStyle='#ebc2a7';ctx.fill();ctx.strokeStyle='#986b58';ctx.stroke();}text('小心刺刺',h.x+h.w/2,h.y+h.h+16,10,'#a47160');}}
  function cat(){
   const m=game.level.mouth,won=game.status==='won',chew=won?Math.sin(resultClock*20):0;ellipse(m.x,m.y+65,76,12,'#9d806b1f');ellipse(m.x,m.y+49,78,23,'#a0b18b','#829774');ellipse(m.x,m.y+45,65,14,'#bfc9a4');
   ctx.save();ctx.translate(m.x,m.y-18);ctx.rotate(reduced?0:Math.sin(clock*1.9)*.012);ctx.beginPath();ctx.ellipse(0,-5,76,69,0,0,Math.PI*2);if(win.GameArt?.draw(ctx,'catHead',-79,-74,158,148)){}else{ctx.clip();if(portraitReady)ctx.drawImage(portrait,300,145,650,500,-79,-53,156,120);else{
    ellipse(0,-7,76,68,'#a58b6d');ctx.fillStyle='#3c3027';for(let i=-2;i<=2;i++)round(i*21-6,-75,12,40,6,'#3c3027');for(const x of [-25,25]){ellipse(x,-21,16,18,'#e0b657');ellipse(x,-21,6,16,'#302c23');ellipse(x-4,-26,3,3,'#fff7d5');}}}
   ctx.restore();
   ellipse(m.x-37,m.y+39+chew,22,14,'#ac9274','#79634d');ellipse(m.x+37,m.y+39-chew,22,14,'#ac9274','#79634d');ctx.strokeStyle='#4e4032';ctx.lineWidth=1;for(const dx of [-47,-37,-27,27,37,47]){ctx.beginPath();ctx.moveTo(m.x+dx,m.y+40);ctx.lineTo(m.x+dx,m.y+46);ctx.stroke();}
   // Keep Buli's original face; feeding feedback stays beside the portrait.
   text(won?'好香呀 ♥':'等你的小鱼',m.x,m.y+81,11,'#826953');if(won){text('♥',m.x-69,m.y-29,19,'#d88f89');text('♥',m.x+70,m.y-48,15,'#d88f89');}
  }
  function forecast(){
   if(!game.level.gravity||game.bubble||game.ropes.filter(r=>!r.cut).length!==1||game.status!=='playing')return;
   const f=game.fish,m=game.level.mouth,gravity=game.level.gravity;const t=(-f.vy+Math.sqrt(f.vy*f.vy+2*gravity*(m.y-f.y)))/gravity;if(!Number.isFinite(t)||t<0)return;const land=f.x+f.vx*t;ctx.save();ctx.globalAlpha=.45;ctx.setLineDash([2,7]);ctx.strokeStyle='#968769';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(f.x,f.y);for(let i=1;i<=20;i++){const q=t*i/20;ctx.lineTo(f.x+f.vx*q,f.y+f.vy*q+.5*gravity*q*q);}ctx.stroke();ctx.setLineDash([]);ellipse(land,m.y,8,3,null,'#998569');ctx.restore();if(Math.abs(land-m.x)<22){round(134,48,164,25,10,'#e5edda','#b7c9a5');text('现在剪绳 · 鱼鱼会到卟哩面前',216,65,10,'#6d855e');}}
  function ropes(){
   for(const r of game.ropes){ellipse(r.x,r.y,10,10,'#a98c67','#826a4e');ellipse(r.x-2,r.y-2,3,3,'#d4bd97');if(r.cut)continue;ctx.lineCap='round';ctx.lineWidth=6;ctx.strokeStyle='#775e4033';ctx.beginPath();ctx.moveTo(r.x+2,r.y+1);ctx.lineTo(game.fish.x+2,game.fish.y+1);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#a78c61';ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(game.fish.x,game.fish.y);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#ead5ad';ctx.setLineDash([3,5]);ctx.stroke();ctx.setLineDash([]);}
  }
  function fish(){
   if(game.status==='won')return;const f=game.fish;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(Math.max(-.55,Math.min(.55,f.vx/230)));ctx.shadowColor='#846c4335';ctx.shadowBlur=5;ctx.shadowOffsetY=3;if(!win.GameArt?.draw(ctx,'fish',-30,-18,60,36)){ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(-27,-13);ctx.quadraticCurveTo(-23,0,-27,13);ctx.closePath();ctx.fillStyle='#dc9970';ctx.fill();ctx.strokeStyle='#b57950';ctx.lineWidth=1.5;ctx.stroke();ellipse(0,0,21,13,'#edba7e','#be8658');ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.beginPath();ctx.moveTo(-1,-8);ctx.quadraticCurveTo(5,0,-1,8);ctx.strokeStyle='#d09d68';ctx.stroke();ellipse(12,-3,2.5,2.5,'#66503a');ellipse(12.7,-4,1,1,'#fff');}ctx.restore();
   if(game.bubble){const grad=ctx.createRadialGradient(f.x-10,f.y-12,1,f.x,f.y,33);grad.addColorStop(0,'#f9ffff55');grad.addColorStop(1,'#89bdc530');ctx.lineWidth=2;ellipse(f.x,f.y,33,33,grad,'#93b9ba');ctx.beginPath();ctx.arc(f.x,f.y,27,Math.PI*1.1,Math.PI*1.6);ctx.strokeStyle='#ffffffcc';ctx.lineWidth=3;ctx.stroke();text('点破',f.x,f.y+48,10,'#7a9796');}
  }
  function draw(){
   ctx.clearRect(0,0,432,600);background();fan();hazards();cat();forecast();ropes();
   for(const s of game.stars){if(s.taken)continue;const bob=reduced?0:Math.sin(clock*2+s.y)*2;ctx.lineWidth=1.5;ellipse(s.x,s.y+9,12,3,'#ac8d3820');if(!win.GameArt?.draw(ctx,'star',s.x-15,s.y+bob-15,30,30))star(s.x,s.y+bob,13,'#f6d479','#c3a354');ellipse(s.x-3,s.y-4+bob,2,2,'#fff6cf');}
   fish();
   if(game.index===0&&!game.ropes[0].cut){ctx.save();ctx.setLineDash([4,5]);ctx.strokeStyle='#8a9c79';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(164,160);ctx.lineTo(270,160);ctx.stroke();ctx.restore();scissors(160,160);text('划过这根绳子',216,144,11,'#7a8e68');ctx.beginPath();ctx.moveTo(276,460);ctx.quadraticCurveTo(264,448,243,466);ctx.strokeStyle='#c3927d';ctx.lineWidth=1;ctx.stroke();text('送给卟哩吃',320,456,10,'#b2836f');}
   if(trail.length){ctx.strokeStyle='#effaf4';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();const end=trail.at(-1);scissors(end.x,end.y,.8);}
   for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);star(p.x,p.y,4,p.color);ctx.globalAlpha=1;}
  }
  function frame(now){
   const delta=last===null?0:Math.max(0,Math.min((now-last)/1000,.08));last=now;clock+=delta;
   R.step(game,delta);
   syncControls();
   while(game.events.length){const e=game.events.shift();if(['cut','star','pop','won'].includes(e.type))tone(e.type);if(e.type==='star')for(let i=0;i<7;i++)particles.push({x:e.x,y:e.y,vx:Math.cos(i)*35,vy:Math.sin(i)*35-20,life:1,color:'#e1b65e'});if(e.type==='lost')game.lossReason=e.reason;}
   $('stars').textContent='★ '.repeat(game.collected)+'☆ '.repeat(3-game.collected);
   if(game.status!=='playing'&&!handled){handled=true;save=R.getSave(game);if(game.status==='won')persist();resultClock=0;}
   if(handled&&!game.paused){resultClock+=delta;if(resultClock>(game.status==='won'?.85:.4)&&panel.hidden)result();}
   for(const p of particles){p.x+=p.vx*delta;p.y+=p.vy*delta;p.life-=delta*1.7;}particles=particles.filter(p=>p.life>0);draw();win.requestAnimationFrame(frame);
  }
  soundMark();load(0);draw();win.requestAnimationFrame(frame);
  return {get game(){return game;},get save(){return save;},load,draw};
 }
 return {mount};
});
