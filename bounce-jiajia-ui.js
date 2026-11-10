(()=>{
  const island=window.IslandRevive?.create({id:'bounce-jiajia'});
  function reviveIsland(){if(!BounceJiajia.revive(game))return false;running=true;last=performance.now();aiming=false;volley=null;rowDrop=shake=0;particles=[];flashes.clear();$('start-overlay').hidden=true;status('拖动虚线瞄准，松开发射。');island?.hide();canvas.focus();return true;}
  function offerIsland(){if(game.status==='lost')island?.offer($('start-button').parentElement,reviveIsland,()=>game.status==='lost');else island?.hide();}
  const canvas=document.getElementById('bounce-stage');
  const ctx=canvas.getContext('2d');
  const W=432,H=610,TOP=64,CELL=58,LEFT=13,LAND_Y=566,RADIUS=7,SPEED=355;
  const $=id=>document.getElementById(id);
  const buli=new Image();window.GameArt?.bind?window.GameArt.bind(buli,'catHead'):buli.src='merge-tier-1.png';
  const saveKey='little-house-bounce-best';
  let best=1;
  try{best=Math.max(1,Number(localStorage.getItem(saveKey)||1));}catch{}
  let game=BounceJiajia.createGame();
  let running=false,aiming=false,aim={x:216,y:250},volley=null,last=0,rowDrop=0,shake=0;
  let particles=[],flashes=new Map();

  function sync(){
    $('round').textContent=String(game.round);
    $('score').textContent=String(game.score);
    $('ball-count').textContent=`×${game.balls}${game.pendingBalls?` +${game.pendingBalls}`:''}`;
    $('best-round').textContent=String(Math.max(best,game.round));
  }

  function status(message){$('status').textContent=message;sync();}

  function showOverlay(title,text,button){
    $('result-title').textContent=title;$('result-text').textContent=text;
    $('start-button').textContent=button;$('start-overlay').hidden=false;offerIsland();
  }

  function reset(){island?.reset();
    game=BounceJiajia.createGame();running=true;aiming=false;volley=null;particles=[];flashes.clear();rowDrop=0;
    $('start-overlay').hidden=true;status('拖动虚线瞄准，松开发射。');
  }

  function canvasPoint(event){
    const rect=canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*W/rect.width,y:(event.clientY-rect.top)*H/rect.height};
  }

  function setAim(point){
    const dx=point.x-game.launchX,dy=point.y-LAND_Y;
    const length=Math.hypot(dx,dy)||1;
    const minUp=-.28;
    let nx=dx/length,ny=dy/length;
    if(ny>minUp){ny=minUp;nx=Math.sign(nx||1)*Math.sqrt(1-ny*ny);}
    aim={x:game.launchX+nx*260,y:LAND_Y+ny*260,nx,ny};
  }

  function launch(){
    if(!running||game.status!=='aiming'||!aim.ny)return;
    game.status='shooting';
    volley={total:game.balls,launched:0,time:0,active:[],firstLanding:null,endDelay:null,
      vx:aim.nx*SPEED,vy:aim.ny*SPEED,pierceLeft:game.pierceBalls};
    game.pierceBalls=0;aiming=false;
    status(`一共 ${volley.total} 颗卟哩，正在发射…`);
  }

  function addParticle(x,y,color,count=8){
    for(let index=0;index<count;index++)particles.push({x,y,vx:(Math.random()-.5)*150,vy:(Math.random()-.8)*145,life:.45+Math.random()*.25,color});
  }

  function spawnBall(){
    const piercing=volley.pierceLeft>0;
    if(piercing)volley.pierceLeft--;
    volley.active.push({x:game.launchX,y:LAND_Y-9,vx:volley.vx,vy:volley.vy,piercing,passed:new Set(),lastHit:0,lastAt:0});
    volley.launched++;
  }

  function blockRect(block){return {x:LEFT+block.col*CELL+3,y:TOP+block.row*CELL+3,w:CELL-6,h:CELL-6};}
  function bonusCenter(bonus){return {x:LEFT+bonus.col*CELL+CELL/2,y:TOP+bonus.row*CELL+CELL/2};}

  function circleHitsRect(ball,rect){
    const cx=Math.max(rect.x,Math.min(ball.x,rect.x+rect.w));
    const cy=Math.max(rect.y,Math.min(ball.y,rect.y+rect.h));
    const dx=ball.x-cx,dy=ball.y-cy;
    return dx*dx+dy*dy<=RADIUS*RADIUS;
  }

  function updateBall(ball,dt,now){
    const oldX=ball.x,oldY=ball.y;
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    if(ball.x<RADIUS){ball.x=RADIUS;ball.vx=Math.abs(ball.vx);}
    if(ball.x>W-RADIUS){ball.x=W-RADIUS;ball.vx=-Math.abs(ball.vx);}
    if(ball.y<TOP-7+RADIUS){ball.y=TOP-7+RADIUS;ball.vy=Math.abs(ball.vy);}

    for(const bonus of [...game.bonuses]){
      const center=bonusCenter(bonus);
      if(Math.hypot(ball.x-center.x,ball.y-center.y)<=RADIUS+13){
        BounceJiajia.removeBonus(game,bonus.id);
        addParticle(center.x,center.y,bonus.type==='bomb'?'#ef8f7e':'#91b89b',16);
        if(bonus.type==='ball')status('接到加球！下一轮多 1 颗卟哩。');
        if(bonus.type==='pierce')status('接到穿透！下一轮前 3 颗球可以穿过方块。');
        if(bonus.type==='bomb'){shake=.18;status('砰！所有数字方块都减少 2。');}
      }
    }

    for(const block of [...game.blocks]){
      const rect=blockRect(block);
      if(!circleHitsRect(ball,rect))continue;
      if(ball.piercing){
        if(ball.passed.has(block.id))continue;
        ball.passed.add(block.id);
      }else{
        if(ball.lastHit===block.id&&now-ball.lastAt<75)continue;
        ball.lastHit=block.id;ball.lastAt=now;
      }
      const result=BounceJiajia.hitBlock(game,block.id,1);
      flashes.set(block.id,.12);addParticle(ball.x,ball.y,result.destroyed?'#f3bd72':'#d7a5aa',result.destroyed?13:4);
      if(!ball.piercing){
        ball.x=oldX;ball.y=oldY;
        const fromTop=oldY+RADIUS<=rect.y,fromBottom=oldY-RADIUS>=rect.y+rect.h;
        if(fromTop||fromBottom)ball.vy*=-1;else ball.vx*=-1;
      }
      break;
    }

    if(ball.y>=LAND_Y&&ball.vy>0){
      if(volley.firstLanding===null)volley.firstLanding=Math.max(18,Math.min(W-18,ball.x));
      return false;
    }
    return true;
  }

  function finishRound(){
    const result=BounceJiajia.finishVolley(game,volley.firstLanding===null?game.launchX:volley.firstLanding);
    volley=null;rowDrop=.32;sync();
    if(result.type==='game-over'){
      running=false;best=Math.max(best,game.round);
      try{localStorage.setItem(saveKey,String(best));}catch{}
      showOverlay('方块压到底线啦',`坚持了 ${game.round} 回合，得到 ${game.score} 分。再来一次，试试打出更陡的反弹角度。`,'再试一次');
    }else{
      const power=game.pierceBalls?` · 已备好 ${game.pierceBalls} 颗穿透球`:'';
      status(`第 ${game.round} 回合，数字更大了${power}。`);
    }
  }

  function update(dt,now){
    rowDrop=Math.max(0,rowDrop-dt);shake=Math.max(0,shake-dt);
    for(const [id,time] of [...flashes]){const next=time-dt;if(next<=0)flashes.delete(id);else flashes.set(id,next);}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    if(!volley)return;
    volley.time+=dt;
    while(volley.launched<volley.total&&volley.time>=volley.launched*.055)spawnBall();
    const steps=Math.max(1,Math.ceil(dt/.006));
    for(let step=0;step<steps;step++)volley.active=volley.active.filter(ball=>updateBall(ball,dt/steps,now));
    if(volley.launched===volley.total&&!volley.active.length){
      if(volley.endDelay===null)volley.endDelay=.28;
      volley.endDelay-=dt;
      if(volley.endDelay<=0)finishRound();
    }
    sync();
  }

  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function drawBackground(){
    const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,'#dfe9df');gradient.addColorStop(.58,'#f7eadf');gradient.addColorStop(1,'#f5e1cf');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
    window.GameArt?.scene(ctx,'garden',0,0,W,H);
    ctx.fillStyle='#fff1d6ed';roundedRect(10,8,W-20,H-16,20);ctx.fill();
    ctx.strokeStyle='#8d6844';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#9bb382';ctx.lineWidth=3;ctx.stroke();
    ctx.globalAlpha=.35;ctx.fillStyle='#fff';for(let y=18;y<H;y+=36)for(let x=(y/36%2)*18;x<W;x+=36){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    ctx.fillStyle='#617969';ctx.font='700 11px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(game.round<=4?'新手练习：先打最靠近底线的方块':'数字越大，要反弹越多次',W/2,29);
    ctx.setLineDash([7,7]);ctx.strokeStyle='#d68e88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10,TOP+BounceJiajia.DANGER_ROW*CELL);ctx.lineTo(W-10,TOP+BounceJiajia.DANGER_ROW*CELL);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#b47f7d';ctx.font='700 9px Microsoft YaHei';ctx.textAlign='right';ctx.fillText('危险线',W-14,TOP+BounceJiajia.DANGER_ROW*CELL-7);
  }

  function drawBlocks(){
    const dropOffset=rowDrop?CELL*(rowDrop/.32):0;
    for(const block of game.blocks){
      const rect=blockRect(block),y=rect.y-dropOffset;
      const ratio=Math.min(1,block.hp/Math.max(4,game.round*1.25));
      const colors=ratio>.68?['#c37f7f','#9f5f65']:ratio>.34?['#e1b37e','#c88763']:['#92b69c','#6c927c'];
      ctx.save();if(flashes.has(block.id)){ctx.shadowColor='#fff2a8';ctx.shadowBlur=22;ctx.translate((Math.random()-.5)*4,0);}
      ctx.fillStyle='#ffffff88';roundedRect(rect.x,y+4,rect.w,rect.h,12);ctx.fill();
      const fill=ctx.createLinearGradient(rect.x,y,rect.x+rect.w,y+rect.h);fill.addColorStop(0,colors[0]);fill.addColorStop(1,colors[1]);ctx.fillStyle=fill;roundedRect(rect.x,y,rect.w,rect.h-4,12);ctx.fill();ctx.strokeStyle='#685138';ctx.lineWidth=2;ctx.stroke();
      ctx.strokeStyle='#fff1d5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rect.x+7,y+7);ctx.lineTo(rect.x+rect.w-7,y+7);ctx.stroke();
      ctx.fillStyle='#fffaf2';ctx.font='800 18px Microsoft YaHei';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(block.hp),rect.x+rect.w/2,y+(rect.h-4)/2);ctx.restore();
    }
  }

  function drawBonuses(){
    const dropOffset=rowDrop?CELL*(rowDrop/.32):0;
    for(const bonus of game.bonuses){
      const center=bonusCenter(bonus);center.y-=dropOffset;
      const style={ball:['＋','#8bb49a'],bomb:['💥','#dc897f'],pierce:['↟','#8d94bf']}[bonus.type];
      ctx.save();ctx.shadowColor=style[1];ctx.shadowBlur=14;ctx.fillStyle='#fffaf2';ctx.beginPath();ctx.arc(center.x,center.y,14,0,Math.PI*2);ctx.fill();ctx.strokeStyle=style[1];ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=style[1];ctx.font=`800 ${bonus.type==='bomb'?15:19}px Microsoft YaHei`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(style[0],center.x,center.y+1);ctx.restore();
    }
  }

  function drawBuliBall(x,y,r=RADIUS,piercing=false){
    ctx.save();if(piercing){ctx.shadowColor='#8399df';ctx.shadowBlur=13;ctx.beginPath();ctx.arc(x,y,r+3,0,Math.PI*2);ctx.fillStyle='#dfe8ff';ctx.fill();}
    if(window.GameArt?.draw(ctx,'catHead',x-r*1.55,y-r*1.55,r*3.1,r*3.1)){}
    else if(buli.complete&&buli.naturalWidth)ctx.drawImage(buli,x-r*1.55,y-r*1.55,r*3.1,r*3.1);
    else{ctx.fillStyle='#8d7257';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  function drawTrajectory(){
    if(!aiming||game.status!=='aiming'||!aim.ny)return;
    let x=game.launchX,y=LAND_Y,vx=aim.nx*6,vy=aim.ny*6,bounces=0;
    ctx.fillStyle='#597665';
    for(let index=0;index<105;index++){
      x+=vx;y+=vy;
      if(x<RADIUS||x>W-RADIUS){vx*=-1;x=Math.max(RADIUS,Math.min(W-RADIUS,x));bounces++;}
      if(y<TOP){break;}
      if(index%3===0){ctx.globalAlpha=Math.max(.18,1-index/120);ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();}
      if(bounces>1)break;
    }
    ctx.globalAlpha=1;
  }

  function draw(){
    ctx.save();if(shake)ctx.translate((Math.random()-.5)*7,(Math.random()-.5)*5);
    drawBackground();drawBlocks();drawBonuses();drawTrajectory();
    if(volley)for(const ball of volley.active)drawBuliBall(ball.x,ball.y,RADIUS,ball.piercing);
    if(!volley){drawBuliBall(game.launchX,LAND_Y,12,game.pierceBalls>0);ctx.fillStyle='#55705f';ctx.font='800 12px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`×${game.balls}`,game.launchX,LAND_Y+27);}
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.7);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.restore();
  }

  function frame(time){
    const dt=Math.min(.033,(time-last)/1000||0);last=time;
    if(running)update(dt,time);draw();requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown',event=>{
    if(!running||game.status!=='aiming')return;
    canvas.setPointerCapture(event.pointerId);aiming=true;setAim(canvasPoint(event));event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{if(aiming){setAim(canvasPoint(event));event.preventDefault();}});
  canvas.addEventListener('pointerup',event=>{if(aiming){setAim(canvasPoint(event));launch();event.preventDefault();}});
  canvas.addEventListener('pointercancel',()=>{aiming=false;});
  $('start-button').onclick=reset;$('restart').onclick=reset;
  window.addEventListener('keydown',event=>{
    if(!running||game.status!=='aiming')return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      const angle=event.key==='ArrowLeft'?-2.08:-1.06;aim={nx:Math.cos(angle),ny:Math.sin(angle),x:game.launchX+Math.cos(angle)*260,y:LAND_Y+Math.sin(angle)*260};aiming=true;event.preventDefault();
    }
    if((event.code==='Space'||event.code==='Enter')&&aim.ny){launch();event.preventDefault();}
  });
  sync();draw();requestAnimationFrame(frame);
})();
