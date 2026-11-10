(function(){
 'use strict';
 const F=window.BuliFly,$=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),KEY='little-house-buli-fly-v1';
 const island=window.IslandRevive?.create({id:'buli-fly'});island?.reset();
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let save=F.readSave(null),storageOK=true;try{save=F.readSave(localStorage.getItem(KEY));}catch(_){storageOK=false;}
 let s=F.create({best:save.best}),last=null,clock=0,feedbackTime=0,priorScore=0,priorPhase='ready',particles=[],heartEffects=[],audio=null,keyHeld=false;
 const cat=new Image();let catReady=false;cat.onload=()=>{catReady=true;};cat.onerror=()=>{$('feedback').textContent='卟哩图片加载失败，请刷新重试';$('feedback').classList.add('show');feedbackTime=999;};cat.src='buli-fly-poses.png';
 function persist(){save.best=s.best;try{localStorage.setItem(KEY,JSON.stringify(save));}catch(_){storageOK=false;}$('storage-note').hidden=storageOK;}
 function soundMark(){$('sound').textContent=save.sound?'声音开':'声音关';$('sound').setAttribute('aria-pressed',String(save.sound));}
 function tone(kind){if(!save.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.connect(g);g.connect(audio.destination);o.type='sine';const pitch={flap:490,score:740,lose:210,medal:880}[kind]||490;o.frequency.setValueAtTime(pitch,t);o.frequency.exponentialRampToValueAtTime(kind==='flap'?820:kind==='lose'?90:pitch*1.5,t+.11);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.start(t);o.stop(t+.18);}catch(_){save.sound=false;soundMark();}}
 function announce(message){$('feedback').textContent=message;$('feedback').classList.add('show');feedbackTime=1.7;}
 function burst(x,y){if(reduced)return;for(let i=0;i<14;i++)particles.push({x,y,vx:(Math.random()-.5)*100,vy:-Math.random()*90,life:.7+Math.random()*.4,color:i%2?'#fff9bd':'#91cdb6'});}
 function mark(){ $('score').textContent=s.score;$('best').textContent=s.best;$('welcome').hidden=s.phase!=='ready';$('pause').disabled=s.phase!=='playing';$('pause').setAttribute('aria-label',s.paused?'继续游戏':'暂停游戏');$('phase-label').textContent=s.paused?'稍作休息':s.phase==='playing'?(s.score<5?'慢慢找到节奏':s.score<15?'穿过云间':'飞得越来越远'):s.phase==='lost'?'本次飞行':'准备出发'; }
 function showResult(){island?.offer($('overlay'),()=>{if(!F.revive(s))return false;keyHeld=false;particles=[];heartEffects=[];feedbackTime=0;priorScore=s.score;priorPhase=s.phase;last=null;$('overlay').hidden=true;island?.hide();mark();canvas.focus({preventScroll:true});return true;},()=>s.phase==='lost');const newRecord=s.score>save.best;persist();$('overlay').hidden=false;$('result-label').textContent=newRecord?'新的飞行纪录':'这趟飞行';$('result-title').textContent=s.score>=30?'天空小猫，起飞！':s.score>=15?'已经摸到云啦':s.score>=5?'飞起来的感觉真好':'下次再飞远一点';$('result-score').textContent=s.score;$('result-text').textContent=s.reason==='ceiling'?'飞太高啦，少点一下就好。':s.reason==='ground'?'掉得有点快，早点轻点一下。':'擦到云门啦，下一次从缝隙中间过。';for(const m of document.querySelectorAll('[data-goal]'))m.classList.toggle('earned',s.best>=Number(m.dataset.goal));$('restart').hidden=false;$('restart').disabled=true;$('resume').hidden=true;document.querySelector('.medals').hidden=false;tone('lose');}
 function launch(){if(s.paused)return;const wasLost=s.phase==='lost';if(!F.tap(s))return;if(wasLost){island?.reset();$('overlay').hidden=true;particles=[];heartEffects=[];priorScore=0;priorPhase='ready';}tone('flap');burst(s.cat.x-24,s.cat.y+12);mark();}
 function pause(){if(s.phase!=='playing'||s.paused)return;island?.hide();F.setPaused(s,true);$('overlay').hidden=false;$('result-label').textContent='云上休息站';$('result-title').textContent='卟哩等你回来';$('result-score').textContent=s.score;$('result-text').textContent='回来后，接着刚才的位置飞。';$('restart').hidden=true;$('resume').hidden=false;document.querySelector('.medals').hidden=true;mark();}
 function resume(){F.setPaused(s,false);last=null;$('overlay').hidden=true;mark();canvas.focus({preventScroll:true});}
 $('start').addEventListener('click',()=>{launch();canvas.focus({preventScroll:true});});$('restart').addEventListener('click',()=>{launch();canvas.focus({preventScroll:true});});$('resume').addEventListener('click',resume);$('pause').addEventListener('click',pause);$('sound').addEventListener('click',()=>{save.sound=!save.sound;soundMark();persist();if(save.sound)tone('score');if(s.phase==='playing'&&!s.paused)canvas.focus({preventScroll:true});});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();canvas.focus({preventScroll:true});launch();});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('keydown',e=>{if(e.target instanceof HTMLElement&&e.target.closest('button,a,summary,input'))return;if(e.key==='Escape'||e.key.toLowerCase()==='p'){e.preventDefault();if(s.paused)resume();else pause();return;}if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();if(e.repeat||keyHeld)return;keyHeld=true;launch();}});document.addEventListener('keyup',e=>{if(e.code==='Space'||e.key==='ArrowUp')keyHeld=false;});
 window.addEventListener('blur',()=>{keyHeld=false;pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keyHeld=false;pause();}});
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(canvas.width/F.W,0,0,canvas.height/F.H,0,0);}
 new ResizeObserver(resize).observe(canvas);
 function round(x,y,w,h,r,fill,stroke){if(h<=0)return;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();}}
 function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function cloud(x,y,scale=1,alpha=.8){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(scale,scale);ellipse(0,0,27,10,'#fffdf0');ellipse(-15,-5,15,12,'#fffdf0');ellipse(4,-12,19,17,'#fffdf0');ellipse(24,-3,15,11,'#fffdf0');ctx.restore();}
 function scenery(){const sky=ctx.createLinearGradient(0,0,0,640);sky.addColorStop(0,'#abe0d9');sky.addColorStop(.55,'#d4ead8');sky.addColorStop(1,'#f4edd4');ctx.fillStyle=sky;ctx.fillRect(0,0,432,640);window.GameArt?.scene(ctx,'daySky',0,0,432,F.GROUND);ellipse(354,114,40,40,'#fff4c78c');ellipse(354,114,28,28,'#fff6d6');
  const travel=s.elapsed*20;for(let i=0;i<6;i++){const x=((i*112-travel*(i%2?.65:.32)+900)%660)-100;cloud(x,106+(i%3)*130,i%2?.85:1.35,.48);}
  ctx.fillStyle='#a6cbb780';ctx.beginPath();ctx.moveTo(0,525);ctx.bezierCurveTo(90,445,130,478,220,524);ctx.bezierCurveTo(312,450,340,466,432,505);ctx.lineTo(432,640);ctx.lineTo(0,640);ctx.fill();ctx.fillStyle='#8ab69c55';ctx.beginPath();ctx.moveTo(0,561);ctx.quadraticCurveTo(210,478,432,561);ctx.lineTo(432,640);ctx.lineTo(0,640);ctx.fill();
  for(let i=0;i<9;i++){const x=((i*67-s.elapsed*32+1500)%630)-80;round(x,541+(i%3)*8,35,43,4,'#efead9','#9bb9a060');ctx.beginPath();ctx.moveTo(x-5,545+(i%3)*8);ctx.lineTo(x+17,527+(i%3)*8);ctx.lineTo(x+40,545+(i%3)*8);ctx.fillStyle='#9bbda4';ctx.fill();round(x+13,564+(i%3)*8,9,20,2,'#b9b89b');}
  ctx.fillStyle='#a6bea0';ctx.fillRect(0,F.GROUND,432,4);ctx.fillStyle='#f0ecd5';ctx.fillRect(0,F.GROUND+4,432,52);ctx.fillStyle='#ced5b5';const offset=s.elapsed*F.difficulty(s.score).speed%32;for(let x=-offset;x<432;x+=32)round(x,595,18,3,2,'#ced5b5');ctx.font='9px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillStyle='#9ca58b';ctx.fillText('卟哩的云间旅行',216,622);
 }
 function vine(x,y,side,len){ctx.strokeStyle='#5a9b79';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+side*15,y+16,x-side*9,y+len-10,x+side*10,y+len);ctx.stroke();for(let i=0;i<3;i++){ctx.save();ctx.translate(x+side*(i%2?0:7),y+12+i*15);ctx.rotate(side*.7);ellipse(0,0,4,9,'#76b185');ctx.restore();}}
 function gate(g){const top=g.center-g.gap/2,bottom=g.center+g.gap/2;if(window.GameArt?.spriteUrl('cat')){round(g.x, -10,68,top+10,24,'#fff4d6','#bd996d');round(g.x,bottom,68,F.GROUND-bottom,24,'#fff4d6','#bd996d');for(const [a,b]of [[0,top],[bottom,F.GROUND]])for(let y=a+18;y<b-8;y+=36){ellipse(g.x+20,y,17,24,'#fffbed');ellipse(g.x+47,y+9,18,24,'#ffecc5');}if(!g.passed&&!g.heartTaken)heart(g.x+34,g.center);return;}const grad=ctx.createLinearGradient(g.x,0,g.x+68,0);grad.addColorStop(0,'#7db89a');grad.addColorStop(.3,'#aed0a7');grad.addColorStop(1,'#74a98d');round(g.x, -10,68,top+10,7,grad,'#669c84');round(g.x,bottom,68,F.GROUND-bottom,7,grad,'#669c84');ctx.fillStyle='#e5efc642';ctx.fillRect(g.x+12,0,7,top-8);ctx.fillRect(g.x+12,bottom+10,7,F.GROUND-bottom-10);round(g.x-5,top-19,78,19,6,'#b5d4ae','#78ac8a');round(g.x-5,bottom,78,19,6,'#b5d4ae','#78ac8a');vine(g.x+63,top-55,-1,45);vine(g.x+6,bottom+16,1,49);cloud(g.x+15,top-12,.55,.92);cloud(g.x+49,bottom+15,.48,.85);
  if(!g.passed&&!g.heartTaken)heart(g.x+34,g.center);
 }
 function heart(x,y,scale=1,alpha=1){
   ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
   const halo=ctx.createRadialGradient(0,0,6,0,0,27);halo.addColorStop(0,'#fffaf1c9');halo.addColorStop(1,'#fffaf100');ellipse(0,0,27,27,halo);
   ctx.beginPath();ctx.moveTo(0,-6);ctx.bezierCurveTo(-9,-20,-23,-7,-12,4);ctx.bezierCurveTo(-7,9,-3,12,0,15);ctx.bezierCurveTo(3,12,7,9,12,4);ctx.bezierCurveTo(23,-7,9,-20,0,-6);ctx.closePath();
   const pink=ctx.createLinearGradient(0,-15,0,15);pink.addColorStop(0,'#ff9eae');pink.addColorStop(1,'#e84273');ctx.fillStyle=pink;ctx.shadowColor='#e76a8559';ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle='#fff9ef';ctx.stroke();ctx.lineWidth=1.4;ctx.strokeStyle='#c84769';ctx.stroke();
   ctx.beginPath();ctx.moveTo(-10,-5);ctx.quadraticCurveTo(-9,-10,-5,-8);ctx.strokeStyle='#ffe9ef';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.stroke();ctx.restore();
 }
 function updateHearts(dt){
  for(const effect of heartEffects)effect.age+=dt;
  heartEffects=heartEffects.filter(effect=>effect.age<1.05);
  if(s.phase!=='playing')return;
  for(const g of s.gates){
   if(g.heartTaken||g.passed||g.x+34>s.cat.x+24)continue;
   g.heartTaken=true;
   heartEffects.push({x:g.x+34,y:g.center,age:0});
  }
 }
 function drawHeartEffects(){
  for(const effect of heartEffects){
   const age=effect.age,x=s.cat.x+10,y=s.cat.y-10;
   if(!reduced&&age<.24){
    const p=age/.24,ease=1-(1-p)**3;
    heart(effect.x+(x-effect.x)*ease,effect.y+(y-effect.y)*ease-Math.sin(p*Math.PI)*20,1+.55*Math.sin(p*Math.PI));
    continue;
   }
   const p=Math.max(0,(age-.24)/.81),alpha=Math.min(1,(1.05-age)*3);
   ctx.save();ctx.globalAlpha=alpha;
   if(!reduced){
    ctx.strokeStyle='#ff83a4';ctx.lineWidth=3*(1-p)+1;ctx.beginPath();ctx.arc(x-12,y,22+p*39,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7-.4,r=25+p*42;heart(x-12+Math.cos(a)*r,y+Math.sin(a)*r,.24+(1-p)*.12,alpha);}
   }
   if(reduced)heart(x,y-38,.55,alpha);
   ctx.restore();
  }
 }
 function drawCat(){
  const ready=s.phase==='ready',lost=s.phase==='lost',x=ready?216:s.cat.x,y=ready?258+(reduced?0:Math.sin(clock*2.5)*5):s.cat.y;
  const angle=ready?-.07:lost?Math.min(.5,s.lostTime*.7):Math.max(-.24,Math.min(.45,s.cat.vy/700));
  const pose=ready?(reduced?1:Math.floor(clock*2)%2):(s.flapTime>.06?0:1);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  const eating=heartEffects.find(effect=>effect.age>=.24&&effect.age<.8);
  if(eating&&!reduced){
   const p=(eating.age-.24)/.56,glow=ctx.createRadialGradient(-15,-10,8,-15,-10,58);
   glow.addColorStop(0,'#fff7cfb3');glow.addColorStop(.6,'#ffbbda66');glow.addColorStop(1,'#ffbbda00');ellipse(-15,-10,58,58,glow);
   const pop=1+.13*Math.sin(p*Math.PI);ctx.scale(pop,pop);
  }
  if(ready)ctx.scale(1.55,1.55);
  else if(!reduced&&s.flapTime>0)ctx.scale(1+Math.sin(s.flapTime/.18*Math.PI)*.035,1-Math.sin(s.flapTime/.18*Math.PI)*.025);
  ctx.shadowColor='#49796735';ctx.shadowBlur=6;ctx.shadowOffsetY=3;
  if(window.GameArt?.draw(ctx,'catStanding',-50,-50,88,88)){}else if(catReady){const cell=cat.naturalWidth/2;ctx.drawImage(cat,pose*cell,0,cell,cat.naturalHeight,-68,-63,104,104);}
  else{ellipse(-6,0,22,15,'#a58b6a');ellipse(15,-9,15,17,'#a58b6a');for(const dx of [10,22]){ellipse(dx,-11,4,5,'#e8c95b');ellipse(dx,-11,1.6,3.5,'#303c2b');}}
  ctx.restore();
  if(ready){ctx.strokeStyle='#96b8a1';ctx.lineWidth=1;ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(289,258);ctx.quadraticCurveTo(312,251,301,222);ctx.stroke();ctx.setLineDash([]);ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillStyle='#7d9e8b';ctx.textAlign='center';ctx.fillText('轻轻一点 ↑',318,210);}
 }
 function draw(){scenery();if(s.phase!=='ready')for(const g of s.gates)gate(g);else{cloud(52,270,.8,.9);cloud(376,330,.7,.85);}for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ellipse(p.x,p.y,2.2,2.2,p.color);}ctx.globalAlpha=1;drawCat();drawHeartEffects();}
 function frame(t){const dt=last===null?0:Math.min(.05,(t-last)/1000);last=t;if(!s.paused){clock+=dt;F.tick(s,dt);updateHearts(dt);if(!reduced){for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;}particles=particles.filter(p=>p.life>0);}if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0)$('feedback').classList.remove('show');}}
  if(s.score!==priorScore){tone('score');burst(s.cat.x,s.cat.y);if([5,15,30].includes(s.score)){announce(s.score===5?'初次展翅 · 第一枚徽章！':s.score===15?'云间穿梭 · 节奏越来越稳':'天空小猫 · 太会飞啦！');tone('medal');}priorScore=s.score;mark();}
  if(s.phase==='lost'&&priorPhase!=='lost'){showResult();mark();}if(s.phase==='lost')$('restart').disabled=s.lostTime<.65;priorPhase=s.phase;draw();requestAnimationFrame(frame);
 }
 soundMark();mark();$('storage-note').hidden=storageOK;resize();requestAnimationFrame(frame);
})();



