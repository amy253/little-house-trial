(()=>{
  const island=window.IslandRevive?.create({id:'stage-runner'});
  function reviveIsland(){if(!StageRunner.revive(game))return false;running=true;last=performance.now();pointer=null;visualLane=game.lane;powerNotice='复活成功，并送你一个护盾！';powerNoticeTime=1.7;$('overlay').hidden=true;sync();island?.hide();canvas.focus();return true;}
  const $=id=>document.getElementById(id);
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const avatar=new Image();avatar.src='jiajia-bonnet-20261021.webp';
  const buliImage=new Image();window.GameArt?.bind?window.GameArt.bind(buliImage,'catHead'):buliImage.src='merge-tier-1.png';
  const saveKey='little-house-stage-runner-best';
  const powerNames={shield:'护盾',revive:'复活卡',magnet:'卟哩磁铁',invincible:'短暂无敌',slow:'减速时光'};
  let best=0;
  try{best=Math.max(0,Number(localStorage.getItem(saveKey)||0));}catch{}
  let game=StageRunner.createGame(),running=false,paused=false,last=0,visualLane=1,pointer=null;
  let instructionTime=0,powerNotice='',powerNoticeTime=0;
  const leaderboard=StageLeaderboard.mount('runner');leaderboard.setScore(best);

  function powerStatus(){
    const active=[];
    if(game.shields)active.push(`护盾×${game.shields}`);
    if(game.revives)active.push(`复活×${game.revives}`);
    if(game.magnetTime>0)active.push('磁铁');
    if(game.invincibleTime>0)active.push('无敌');
    if(game.slowTime>0)active.push('减速');
    return active.join(' · ')||'暂无';
  }
  function sync(){
    $('progress').textContent=String(Math.floor(game.distance));
    $('best').textContent=String(Math.max(best,Math.floor(game.distance)));
    $('buli-count').textContent=`${game.buli}/5`;
    $('power-status').textContent=powerStatus();
    $('pause').disabled=!running;
  }
  function show(title,description,action){
    $('result-title').textContent=title;$('result-text').textContent=description;
    $('action').textContent=action;$('island-revive').hidden=true;
    $('revive-status').hidden=true;$('overlay').hidden=false;running=false;paused=false;clearPointer();sync();
    if(game.status==='lost')island?.offer($('action').parentElement,reviveIsland,()=>game.status==='lost');else island?.hide();
  }
  function start(){
    if(document.hidden)return;
    if(!paused){island?.reset();game=StageRunner.createGame();visualLane=1;instructionTime=2;powerNoticeTime=0;}
    paused=false;
    running=true;last=performance.now();$('overlay').hidden=true;sync();
  }
  function pause(){if(!running)return;show('游戏已暂停','角色停在原位，准备好后继续。','继续游戏');paused=true;}
  function clearPointer(){const id=pointer?.id;pointer=null;if(id!=null&&canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);}
  function showIntro(){
    show('陪家家跑向舞台','障碍不只靠换道：整排线缆要跳，整排横杆要蹲。收集 5 个卟哩会随机获得一个道具。','开始跑酷');
  }
  function showTutorial(){
    const tutorial=$('tutorial');
    $('overlay').hidden=true;tutorial.hidden=false;
    setTimeout(()=>tutorial.classList.add('leaving'),2550);
    setTimeout(()=>{
      tutorial.hidden=true;tutorial.classList.remove('leaving');
      showIntro();
    },3000);
  }
  function finish(event){
    if(game.status!=='lost')return;
    best=Math.max(best,Math.floor(game.distance));
    try{localStorage.setItem(saveKey,String(best));}catch{}
    leaderboard.setScore(best);leaderboard.refresh();
    const title=event?.kind==='cable'?'绊到线缆啦':event?.kind==='beam'?'没蹲过横杆啦':'撞到音箱啦';
    show(title,`这次跑了 ${Math.floor(game.distance)} 米。可以直接重跑，也可以去找家家说说话后复活继续，每局有两次机会。`,'再跑一次');
  }
  function laneX(lane,depth){return 216+(lane-1)*(23+91*depth);}
  function drawPickup(lane,y,scale,depth){
    const x=laneX(lane,depth);
    const size=38*scale;
    ctx.save();ctx.shadowColor='#fff4a4';ctx.shadowBlur=12*scale;
    if(window.GameArt?.draw(ctx,'catHead',x-size/2,y-53*scale,size,size)){}
    else if(buliImage.complete&&buliImage.naturalWidth)ctx.drawImage(buliImage,x-size/2,y-53*scale,size,size);
    else{ctx.fillStyle='#e9b987';ctx.beginPath();ctx.arc(x,y-35*scale,16*scale,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawObstacle(context,kind,x,y,scale){
    if(kind==='speaker'){
      context.fillStyle='#484c48';context.strokeStyle='#49372d';context.lineWidth=2*scale;context.beginPath();context.roundRect(x-24*scale,y-40*scale,48*scale,53*scale,7*scale);context.fill();context.stroke();
      context.fillStyle='#d2bc92';context.fillRect(x-19*scale,y-35*scale,38*scale,3*scale);
      context.strokeStyle='#8e9881';context.lineWidth=scale;for(let i=0;i<3;i++){context.beginPath();context.moveTo(x-17*scale,y+(-27+i*5)*scale);context.lineTo(x+17*scale,y+(-27+i*5)*scale);context.stroke();}
      context.fillStyle='#b8cbb9';context.beginPath();context.arc(x,y-11*scale,13*scale,0,Math.PI*2);context.fill();context.fillStyle='#698a78';context.beginPath();context.arc(x,y-11*scale,7*scale,0,Math.PI*2);context.fill();
    }else if(kind==='cable'){
      context.strokeStyle='#624437';context.lineWidth=12*scale;context.lineCap='round';context.beginPath();context.moveTo(x-34*scale,y+5*scale);context.quadraticCurveTo(x,y-25*scale,x+34*scale,y+5*scale);context.stroke();context.strokeStyle='#db8993';context.lineWidth=7*scale;context.stroke();
      context.fillStyle='#b7727d';context.fillRect(x-35*scale,y+3*scale,9*scale,9*scale);context.fillRect(x+26*scale,y+3*scale,9*scale,9*scale);
    }else{
      context.fillStyle='#b77e8d';context.fillRect(x-34*scale,y-55*scale,6*scale,61*scale);context.fillRect(x+28*scale,y-55*scale,6*scale,61*scale);
      context.fillStyle='#f8d692';context.strokeStyle='#634632';context.lineWidth=2*scale;context.beginPath();context.roundRect(x-36*scale,y-56*scale,72*scale,12*scale,3*scale);context.fill();context.stroke();
      context.fillStyle='#b9694e';for(let i=0;i<5;i++)context.fillRect(x+(-30+i*13)*scale,y-53*scale,6*scale,6*scale);
    }
  }
  function drawWave(wave){
    const remaining=wave.at-game.distance;if(remaining<0||remaining>340)return;
    const depth=1-remaining/340,y=137+390*depth*depth,scale=.32+1.08*depth;
    if(wave.pickup!==undefined)drawPickup(wave.pickup,y,scale,depth);
    for(const block of wave.blocks){
      const x=laneX(block.lane,depth);
      drawObstacle(ctx,block.kind,x,y,scale);
    }
  }
  function drawNotice(text,time,maximum){
    if(time<=0)return;
    const alpha=Math.min(1,time/.45,maximum-time<.35?(maximum-time)/.35:1);
    ctx.globalAlpha=Math.max(0,alpha);ctx.fillStyle='#fffdf2e8';ctx.beginPath();ctx.roundRect(69,190,294,42,19);ctx.fill();
    ctx.fillStyle='#54705c';ctx.font='800 14px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(text,216,216);ctx.globalAlpha=1;
  }
  function draw(){
    const sky=ctx.createLinearGradient(0,0,0,600);sky.addColorStop(0,'#dfeee8');sky.addColorStop(.55,'#f4e8e3');sky.addColorStop(1,'#d5dfcf');ctx.fillStyle=sky;ctx.fillRect(0,0,432,600);
    window.GameArt?.scene(ctx,'stage',0,0,432,600);
    ctx.fillStyle='#b9d1c3';ctx.beginPath();ctx.arc(216,125,112,Math.PI,0);ctx.fill();
    ctx.fillStyle='#fff6d9';ctx.font='800 23px Microsoft YaHei';ctx.textAlign='center';ctx.fillText('家家演出现场',216,96);
    ctx.fillStyle='#b96f56';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(58,0);ctx.quadraticCurveTo(15,140,58,260);ctx.lineTo(0,310);ctx.fill();ctx.beginPath();ctx.moveTo(432,0);ctx.lineTo(374,0);ctx.quadraticCurveTo(417,140,374,260);ctx.lineTo(432,310);ctx.fill();
    ctx.fillStyle='#d3a16a';ctx.beginPath();ctx.moveTo(186,144);ctx.lineTo(246,144);ctx.lineTo(425,600);ctx.lineTo(7,600);ctx.closePath();ctx.fill();
    ctx.save();ctx.clip();ctx.strokeStyle='#936643';ctx.lineWidth=1.5;for(let i=0;i<13;i++){const depth=((i+game.distance*.045)%13)/13,y=144+456*depth*depth;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(432,y);ctx.stroke();}for(const side of [-1.5,-.5,.5,1.5]){ctx.beginPath();ctx.moveTo(216+side*14,144);ctx.lineTo(216+side*130,600);ctx.stroke();}ctx.restore();
    ctx.strokeStyle='#fff1c4';ctx.lineWidth=3;ctx.setLineDash([14,15]);for(const side of [-.5,.5]){ctx.beginPath();ctx.moveTo(216+side*47,145);ctx.lineTo(216+side*280,600);ctx.stroke();}ctx.setLineDash([]);
    ctx.strokeStyle='#ffedbf';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(186,144);ctx.lineTo(7,600);ctx.moveTo(246,144);ctx.lineTo(425,600);ctx.stroke();
    for(let i=game.waves.length-1;i>=0;i--)drawWave(game.waves[i]);
    const jump=game.jumpTime>0?Math.sin((1-game.jumpTime/.72)*Math.PI)*46:0;
    const crouching=game.slideTime>0;
    const playerX=laneX(visualLane,1);
    if(game.invincibleTime>0){ctx.fillStyle='#fff3a84a';ctx.beginPath();ctx.arc(playerX,468-jump,60,0,Math.PI*2);ctx.fill();}
    if(game.shields>0){ctx.strokeStyle='#c3f4ef';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(playerX,472-jump,55,70,0,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#4e6c583e';ctx.beginPath();ctx.ellipse(playerX,533,39-jump*.25,11-jump*.06,0,0,Math.PI*2);ctx.fill();
    if(avatar.complete&&avatar.naturalWidth)ctx.drawImage(avatar,playerX-48,crouching?463:415-jump,96,crouching?70:117);
    drawNotice('左右滑换道 · 上滑跳 · 下滑蹲',instructionTime,2);
    drawNotice(powerNotice,powerNoticeTime,1.7);
  }
  function frame(time){
    const dt=Math.min(.05,(time-last)/1000||0);last=time;
    if(running){
      const events=StageRunner.step(game,dt);
      for(const event of events){
        if(event.type==='power'){powerNotice=`获得道具：${powerNames[event.power]}`;powerNoticeTime=1.7;}
        else if(event.type==='protected'){powerNotice=event.power==='shield'?'护盾挡住了一次！':'无敌中，安全通过！';powerNoticeTime=1.7;}
        else if(event.type==='revive'){powerNotice='复活卡生效，并送你一个护盾！';powerNoticeTime=1.7;}
        else if(event.type==='hit')finish(event);
      }
      sync();
    }
    visualLane+=(game.lane-visualLane)*Math.min(1,dt*13);
    instructionTime=Math.max(0,instructionTime-dt);powerNoticeTime=Math.max(0,powerNoticeTime-dt);
    draw();requestAnimationFrame(frame);
  }
  function move(direction){if(running)StageRunner.moveLane(game,direction);}
  function jump(){if(running)StageRunner.jump(game);}
  function slide(){if(running)StageRunner.slide(game);}
  canvas.addEventListener('pointerdown',event=>{if(!running||pointer||event.isPrimary===false||(event.button!=null&&event.button!==0))return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,consumed:false};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id||pointer.consumed)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<26)return;
    pointer.consumed=true;
    if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx));else if(dy<0)jump();else slide();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(event.pointerId===pointer?.id)clearPointer();});
  $('pause').onclick=pause;
  $('action').onclick=start;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('blur',pause);window.addEventListener('pagehide',pause);
  window.addEventListener('keydown',event=>{if(event.target?.tagName==='BUTTON')return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(event.code)){event.preventDefault();if(event.code==='ArrowLeft')move(-1);else if(event.code==='ArrowRight')move(1);else if(event.code==='ArrowDown')slide();else jump();}});
  showTutorial();
  requestAnimationFrame(frame);
})();
