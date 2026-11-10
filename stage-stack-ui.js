(()=>{
  const island=window.IslandRevive?.create({id:'stage-stack'});
  function reviveIsland(){if(!StageStack.revive(game))return false;running=true;last=performance.now();flash=0;particles=[];$('overlay').hidden=true;sync();island?.hide();canvas.focus();return true;}
  function offerIsland(){if(game.status==='lost')island?.offer($('action').parentElement,reviveIsland,()=>game.status==='lost');else island?.hide();}
  const $=id=>document.getElementById(id);
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const avatar=new Image();avatar.src='jiajia-white-20261021.webp';
  const saveKey='little-house-stage-stack-best';
  let best=0;
  try{best=Math.max(0,Number(localStorage.getItem(saveKey)||0));}catch{}
  let game=StageStack.createGame(),running=false,paused=false,pointerId=null,last=0,flash=0,particles=[];
  const leaderboard=StageLeaderboard.mount('stack');leaderboard.setScore(best);

  function sync(){
    $('progress').textContent=String(game.placed.length);
    $('best').textContent=String(Math.max(best,game.placed.length));
    $('pause').disabled=!running;
    $('drop').disabled=!running;
  }
  function show(title,description,action){
    $('result-title').textContent=title;$('result-text').textContent=description;
    $('action').textContent=action;
    $('overlay').hidden=false;running=false;paused=false;clearPointer();sync();offerIsland();
  }
  function start(){
    if(document.hidden)return;
    if(!paused){island?.reset();game=StageStack.createGame();particles=[];flash=0;}
    paused=false;running=true;last=performance.now();$('overlay').hidden=true;sync();
  }
  function pause(){if(!running)return;show('游戏已暂停','舞台板停在原位，准备好后继续。','继续游戏');paused=true;}
  function clearPointer(){const id=pointerId;pointerId=null;if(id!==null&&canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);}
  function drop(){
    if(!running)return;
    const result=StageStack.drop(game);
    if(result.type==='placed'){
      flash=result.perfect?.5:.25;
      const y=510-game.placed.length*35+Math.max(0,game.placed.length-8)*35;
      for(let i=0;i<13;i++)particles.push({x:game.top.x+game.top.width/2,y,vx:(Math.random()-.5)*160,vy:-50-Math.random()*110,life:.5,color:i%2?'#ecc47f':'#a9cfb1'});
    }
    sync();
    if(game.status==='lost'){
      best=Math.max(best,game.placed.length);
      try{localStorage.setItem(saveKey,String(best));}catch{}
      leaderboard.setScore(best);
      leaderboard.refresh();
      show('舞台板落空啦',`这次叠到 ${game.placed.length} 层。再试一次，刷新你的最高纪录！`,'再试一次');
    }
  }
  function platform(x,y,width,color,glow=false){
    ctx.save();if(glow){ctx.shadowColor='#f4d398';ctx.shadowBlur=20;}
    ctx.fillStyle='#684b36';ctx.beginPath();ctx.roundRect(x,y,width,29,6);ctx.fill();
    ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x+2,y+2,Math.max(0,width-4),20,5);ctx.fill();
    ctx.strokeStyle='#765b40';ctx.lineWidth=1.5;ctx.stroke();ctx.strokeStyle='#fff5d6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+6,y+6);ctx.lineTo(x+Math.max(6,width-6),y+6);ctx.stroke();
    for(let px=x+8;px<x+width-4;px+=25){ctx.fillStyle='#98714b';ctx.fillRect(px,y+15,10,1);}
    ctx.fillStyle='#fff7ce';for(let px=x+14;px<x+width-10;px+=26){ctx.beginPath();ctx.arc(px,y+25,2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function draw(){
    const gradient=ctx.createLinearGradient(0,0,0,600);gradient.addColorStop(0,'#e5ebe9');gradient.addColorStop(.7,'#f7e8df');gradient.addColorStop(1,'#d5e6d7');ctx.fillStyle=gradient;ctx.fillRect(0,0,432,600);
    window.GameArt?.scene(ctx,'stage',0,0,432,600);
    ctx.fillStyle='#ba6550';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(65,0);ctx.quadraticCurveTo(45,170,60,320);ctx.lineTo(0,340);ctx.fill();ctx.beginPath();ctx.moveTo(432,0);ctx.lineTo(367,0);ctx.quadraticCurveTo(387,170,372,320);ctx.lineTo(432,340);ctx.fill();
    ctx.strokeStyle='#ffe9a9';ctx.lineWidth=5;ctx.beginPath();ctx.arc(216,57,85,Math.PI,0);ctx.stroke();
    for(let i=0;i<7;i++){const x=60+i*52;ctx.fillStyle=i%2?'#ffe5aa':'#fff8e1';ctx.beginPath();ctx.arc(x,57,5,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ab7148';ctx.fillRect(0,540,432,60);ctx.fillStyle='#694a33';ctx.fillRect(0,540,432,8);
    ctx.strokeStyle='#e3b479';ctx.lineWidth=1;for(let x=18;x<432;x+=44){ctx.beginPath();ctx.moveTo(x,548);ctx.lineTo(x-24,600);ctx.stroke();}
    for(let x=14;x<432;x+=36){ctx.fillStyle='#ffe1a0';ctx.beginPath();ctx.arc(x,547,3,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#506d5d';ctx.font='700 13px Microsoft YaHei';ctx.textAlign='center';ctx.fillText('家家今晚的舞台',216,117);
    const camera=Math.max(0,game.placed.length-8)*35;
    if(510+camera<600)platform(game.baseX,510+camera,game.baseWidth,'#d5b8c5');
    for(let index=Math.max(0,game.placed.length-12);index<game.placed.length;index++){
      const block=game.placed[index],y=510-(index+1)*35+camera;
      if(y<600)platform(block.x,y,block.width,['#8fbb91','#e1a67b','#d4bd83'][index%3]);
    }
    if(game.status==='playing')platform(game.moving.x,510-(game.placed.length+1)*35+camera,game.moving.width,'#f2d6a8',true);
    if(avatar.complete&&avatar.naturalWidth)ctx.drawImage(avatar,325,454,84,94);
    if(flash>0){ctx.fillStyle=`rgba(255,247,211,${flash*.45})`;ctx.fillRect(0,0,432,600);}
    for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  }
  function frame(time){
    const dt=Math.min(.05,(time-last)/1000||0);last=time;
    if(running)StageStack.step(game,dt);
    flash=Math.max(0,flash-dt*2);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    draw();requestAnimationFrame(frame);
  }
  canvas.addEventListener('pointerdown',event=>{if(!running||pointerId!==null||event.isPrimary===false||(event.button!=null&&event.button!==0))return;pointerId=event.pointerId;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointerup',event=>{if(event.pointerId!==pointerId)return;clearPointer();drop();});
  for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(event.pointerId===pointerId)clearPointer();});
  $('drop').onclick=drop;$('pause').onclick=pause;
  $('action').onclick=start;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('blur',pause);window.addEventListener('pagehide',pause);
  window.addEventListener('keydown',event=>{if(event.repeat||document.hidden||event.target?.tagName==='BUTTON')return;if(event.code==='Space'||event.code==='Enter'){event.preventDefault();if($('overlay').hidden)drop();else start();}});
  show('帮家家搭舞台','没有终点，看你能叠到多少层。看准舞台板经过的位置，点一下放下。','开始叠舞台');requestAnimationFrame(frame);
})();
