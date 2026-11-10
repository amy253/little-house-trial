(function () {
  'use strict';
  const B=window.BuliBowling, $=id=>document.getElementById(id);
  const canvas=$('scene'), ctx=canvas.getContext('2d'), SAVE_KEY='little-house-buli-bowling-v1';
  const island=window.IslandRevive?.create({id:'buli-bowling'});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cat=new Image(); window.GameArt?.bind?window.GameArt.bind(cat,'catStanding'):cat.src='buli-hop-standing.png'; cat.onload=draw;
  let save; try {save=B.readSave(localStorage.getItem(SAVE_KEY));} catch {save=B.readSave(null);$('storage-note').hidden=false;}
  let mode='classic',lane=0,rolls=[],standing=allPins(),shot=null,phase='aim',paused=false,challengeRoll=0;
  let drag=null,lastTime=0,animation=0;
  const scoreCells=Array.from({length:10},(_,i)=> {
    const cell=document.createElement('div');cell.className='frame';
    cell.innerHTML='<span>'+(i+1)+' 局</span><div class="marks"></div><strong></strong>';
    $('scoreboard').append(cell);return cell;
  });
  function allPins() {return [0,1,2,3,4,5,6,7,8,9];}
  function persist() {try {localStorage.setItem(SAVE_KEY,JSON.stringify(save));} catch {$('storage-note').hidden=false;}}
  function settings() {return {position:Number($('position').value)/100,angle:Number($('angle').value),power:Number($('power').value)/100};}
  function current() {return mode==='classic'?B.score(rolls).next:{frame:lane+1,roll:challengeRoll+1,remaining:standing.length,reset:challengeRoll===0};}
  function syncAim() {
    const s=settings();
    $('position-value').textContent=Math.abs(s.position)<.01?'居中':(s.position<0?'偏左 ':'偏右 ')+Math.round(Math.abs(s.position)*100)+'%';
    $('angle-value').textContent=s.angle===0?'正前方':(s.angle<0?'向左 ':'向右 ')+Math.abs(s.angle)+'°';
    $('power-value').textContent=Math.round(s.power*100)+'%'; draw();
  }
  function updateCard() {
    const failed=()=>mode==='challenge'&&phase==='ended'&&10-standing.length<B.LANES[lane].target;
    if(failed())island?.offer($('roll-result'),()=>{const round={mode,lane,phase,standing,challengeRoll,shot,paused};if(!B.revive(round))return false;({phase,challengeRoll,shot,paused}=round);drag=null;lastTime=0;updateCard();syncAim();canvas.focus({preventScroll:true});return true;},failed);else island?.hide();
    const data=B.score(rolls),next=current();
    $('total').textContent=mode==='classic'?data.total:10-standing.length;
    $('best').textContent=mode==='classic'?save.bestScore:save.challengeBest[lane];
    $('score-caption').textContent=mode==='classic'?'已结算得分':'本轮倒下';
    $('record-caption').textContent=mode==='classic'?'最高纪录':'这条球道纪录';
    $('standing-count').innerHTML=standing.length+' <small>只罐头</small>';
    $('frame-label').textContent=phase==='rolling'?(mode==='classic'?'第 '+next.frame+' 局 · 第 '+next.roll+' 投':'挑战 '+(lane+1)+' · 第 '+(challengeRoll+1)+' 投'):'aim'===phase?(mode==='classic'?'第 '+next.frame+' 局 · 第 '+next.roll+' 投':'挑战 '+(lane+1)+' · 第 '+(challengeRoll+1)+' 投'):'本投已结算';
    $('lane-hint').textContent=B.LANES[lane].hint+' 两投合计倒下 '+B.LANES[lane].target+' 只过关。';
    $('classic-mode').setAttribute('aria-pressed',String(mode==='classic'));
    $('challenge-mode').setAttribute('aria-pressed',String(mode==='challenge'));
    $('challenge-picker').hidden=mode!=='challenge';$('score-section').hidden=mode!=='classic';
    $('aim-panel').hidden=phase!=='aim';$('roll-result').hidden=phase==='aim'||phase==='rolling';
    $('swipe-cue').hidden=phase!=='aim'||(mode==='classic'?rolls.length>0:challengeRoll>0)||Boolean(drag);
    $('throw').disabled=phase!=='aim'||paused;
    for(const id of ['position','angle','power']) $(id).disabled=phase!=='aim'||paused;
    $('pause').disabled=phase!=='rolling';$('pause').textContent=paused?'▶':'Ⅱ';
    $('pause').setAttribute('aria-label',paused?'继续投球':'暂停投球');$('paused-panel').hidden=!paused;
    scoreCells.forEach((cell,i)=> {
      const f=data.frames[i];let marks=f.rolls.map((n,j)=> {
        const previous=f.rolls[j-1];
        if(j>0 && previous<10 && previous+n===10) return '/';
        if(n===10) return 'X';
        return n===0?'–':String(n);
      });
      // In frame ten, a third throw after a spare is a fresh rack.
      if(i===9 && f.rolls.length===3 && f.rolls[0]<10) marks[2]=f.rolls[2]===10?'X':f.rolls[2]===0?'–':String(f.rolls[2]);
      cell.querySelector('.marks').textContent=marks.length?marks.join(' '):'·';
      cell.querySelector('strong').textContent=f.cumulative===null?'·':String(f.cumulative);
      cell.classList.toggle('current',Boolean(data.next && data.next.frame===i+1));
      cell.setAttribute('aria-label','第 '+(i+1)+' 局，'+(f.rolls.length?'投球倒下 '+f.rolls.join('、')+' 只':'还未投球')+'，'+(f.cumulative===null?'等待计分':'累计 '+f.cumulative+' 分'));
    });
    $('bonus-note').textContent=data.complete?'比赛结束！十局全部结算完成。':data.frames.some(f=>f.rolls.length && f.score===null)?'有一局正在等待后续投球加分，累计分会在奖励确定后显示。':'全倒加后两投，补中加后一投；等到奖励投出后才显示累计分。';
  }
  function fresh(nextMode=mode,nextLane=lane) {
    island?.reset();cancelAnimationFrame(animation); animation=0; drag=null;paused=false;mode=nextMode;lane=nextLane;
    rolls=[];standing=allPins();shot=null;phase='aim';challengeRoll=0;lastTime=0;
    $('lane').value=String(lane);$('position').value='0';$('angle').value='0';$('power').value='80';
    $('status').textContent=mode==='classic'?'先试一颗直球吧。向上划动球道，或点「投出小球」。':B.LANES[lane].hint;
    updateCard();syncAim();
  }
  function throwBall() {
    if(phase!=='aim'||paused) return;
    drag=null;shot=B.createShot({...settings(),standing,lane:mode==='challenge'?lane:-1});
    phase='rolling';lastTime=0;updateCard();$('status').textContent='小球滚动中… 等罐头停下来再结算。';draw();
    animation=requestAnimationFrame(animate);
  }
  function animate(time) {
    animation=0;
    if(paused||phase!=='rolling') return;
    if(lastTime) B.tickShot(shot,Math.min((time-lastTime)/1000,.06));lastTime=time;
    $('standing-count').innerHTML=(standing.length-shot.knocked.length)+' <small>只还站着</small>';
    draw();
    if(shot.complete) finishRoll(); else animation=requestAnimationFrame(animate);
  }
  function finishRoll() {
    const before=current(),count=shot.knocked.length;
    standing=standing.filter(id=>!shot.knocked.includes(id));
    let ended=false;
    if(mode==='classic') {rolls=B.recordRoll(rolls,count);ended=B.score(rolls).complete;}
    else {challengeRoll++;ended=challengeRoll>=2||standing.length===0;}
    phase=ended?'ended':'result';
    $('result-tag').textContent=mode==='classic'?'第 '+before.frame+' 局 · 第 '+before.roll+' 投':'挑战 '+(lane+1)+' · 第 '+challengeRoll+' 投';
    $('result-title').textContent=count===10?'全倒！十只一起倒':standing.length===0?'补中！最后一只也倒啦':count===0?(shot.ball.gutter?'小球滚进沟里啦':'差一点碰到罐头'):'这一投，倒下 '+count+' 只';
    $('result-text').textContent=standing.length?'还剩 '+standing.length+' 只。看看位置和瞄准线，再试下一投。':'漂亮的罐头连锁碰撞！';
    $('next').hidden=ended;$('again').hidden=!ended;$('next-lane').hidden=true;
    if(ended && mode==='classic') {
      const total=B.score(rolls).total; save.bestScore=Math.max(save.bestScore,total);persist();
      $('result-tag').textContent='十局比赛结束';$('result-title').textContent='卟哩拿到 '+total+' 分';
      $('result-text').textContent=(total===300?'满分大满贯！':total>=150?'罐头球馆的小高手！':'一场开心的罐头碰碰乐。')+' 最高纪录 '+save.bestScore+' 分。';
      $('status').textContent='十局全部完成，可查看计分卡，或再玩一局。';
    } else if(ended) {
      const knocked=10-standing.length,win=knocked>=B.LANES[lane].target;
      save.challengeBest[lane]=Math.max(save.challengeBest[lane],knocked);persist();
      $('result-title').textContent=win?'挑战过关！':'再试试另一条路线';
      $('result-text').textContent='合计倒下 '+knocked+' / 10 只，目标 '+B.LANES[lane].target+' 只。'+(win?'卟哩替你留了一枚小印章。':'摆球和角度都可以调整。');
      $('again').textContent='再试这条球道 ↗';$('next-lane').hidden=lane===B.LANES.length-1;
      $('status').textContent=win?'这条球道的目标已经达成。':'下次可以从球道另一侧瞄准。';
    } else {
      const next=current();$('next').textContent=mode==='classic'?(next.frame===before.frame?'准备补投 →':'摆好第 '+next.frame+' 局 →'):'准备第二投 →';
      if(mode==='classic' && next.frame===10 && next.roll===3) $('next').textContent='准备奖励投 →';
      $('status').textContent=count===0?'调整一下摆球位置和角度，再来一投。':'罐头已经停稳，点按钮让小球回到起点。';
    }
    updateCard();draw();$('roll-result').scrollIntoView({block:'nearest',behavior:reduced?'auto':'smooth'});
  }
  function prepareNext() {
    if(phase!=='result') return;
    const next=current();if(mode==='classic' && next.reset) standing=allPins();
    shot=null;phase='aim';$('status').textContent=next.reset?'新一局罐头摆好了，向上划动或点按钮投球。':'剩下的罐头会留在原位。这一投瞄准它们吧。';
    updateCard();syncAim();canvas.focus({preventScroll:true});canvas.scrollIntoView({block:'nearest',behavior:reduced?'auto':'smooth'});
  }
  function pause(value) {
    drag=null;if(phase!=='rolling') {draw();return;}
    paused=value;B.setPaused(shot,value);lastTime=0;cancelAnimationFrame(animation);animation=0;
    updateCard();draw();if(!paused) animation=requestAnimationFrame(animate);
  }
  function point(event) {const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*460/r.width,y:(event.clientY-r.top)*590/r.height};}
  function aimSwipe(start,p) {
    const up=start.y-p.y;
    if(up>12) {
      $('angle').value=String(Math.round(Math.max(-16,Math.min(16,(p.x-start.x)/up*25))));
      $('power').value=String(Math.round(Math.max(40,Math.min(100,40+up*.3))));syncAim();
    }
    return up;
  }
  canvas.addEventListener('pointerdown',event=> {
    if(phase!=='aim'||paused||!event.isPrimary||event.button!==0) return;
    event.preventDefault();const p=point(event);canvas.focus({preventScroll:true});
    drag={id:event.pointerId,start:p};canvas.setPointerCapture(event.pointerId);
    if(p.y>300) $('position').value=String(Math.round(Math.max(-.82,Math.min(.82,(p.x-230)/166))*100));
    updateCard();syncAim();
  });
  canvas.addEventListener('pointermove',event=> {
    if(!drag||drag.id!==event.pointerId) return;
    event.preventDefault();aimSwipe(drag.start,point(event));
  });
  canvas.addEventListener('pointerup',event=> {
    if(!drag||drag.id!==event.pointerId) return;
    const start=drag.start,p=point(event);drag=null;
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if(aimSwipe(start,p)>=28) throwBall();
    else {$('status').textContent='球摆好了。再向上划一段，或点「投出小球」。';updateCard();draw();}
  });
  function cancelDrag() {drag=null;updateCard();draw();}
  canvas.addEventListener('pointercancel',cancelDrag);
  canvas.addEventListener('lostpointercapture',()=> {if(drag) cancelDrag();});
  document.addEventListener('keydown',event=> {
    if(event.target.closest('input,select,button,a,summary') || event.ctrlKey||event.metaKey||event.altKey) return;
    if(event.key.toLowerCase()==='p' && phase==='rolling') {event.preventDefault();if(!event.repeat)pause(!paused);return;}
    if(phase!=='aim'||paused) return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','A','d','D',' ','Enter'].includes(event.key)) event.preventDefault();else return;
    if(event.key===' '||event.key==='Enter') {if(!event.repeat)throwBall();return;}
    if(event.key==='ArrowLeft') $('angle').value=String(Number($('angle').value)-1);
    if(event.key==='ArrowRight') $('angle').value=String(Number($('angle').value)+1);
    if(event.key==='ArrowUp') $('power').value=String(Number($('power').value)+5);
    if(event.key==='ArrowDown') $('power').value=String(Number($('power').value)-5);
    if(event.key.toLowerCase()==='a') $('position').value=String(Number($('position').value)-4);
    if(event.key.toLowerCase()==='d') $('position').value=String(Number($('position').value)+4);
    syncAim();
  });
  for(const id of ['position','angle','power']) $(id).addEventListener('input',syncAim);
  $('throw').addEventListener('click',throwBall);$('next').addEventListener('click',prepareNext);
  $('pause').addEventListener('click',()=>pause(!paused));$('resume').addEventListener('click',()=>pause(false));
  $('restart').addEventListener('click',()=>fresh());$('again').addEventListener('click',()=>fresh());
  $('classic-mode').addEventListener('click',()=>{if(mode!=='classic')fresh('classic');});
  $('challenge-mode').addEventListener('click',()=>{if(mode!=='challenge')fresh('challenge');});
  $('lane').addEventListener('change',()=>fresh('challenge',Number($('lane').value)));
  $('next-lane').addEventListener('click',()=>fresh('challenge',Math.min(4,lane+1)));
  window.addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});

  // Perspective is only drawing; the shared core simulates real plane collisions.
  function project(x,y) {const depth=Math.max(-.1,y)/(Math.max(-.1,y)+4);return {x:230+x*175*(1-depth*.75),y:538-depth*525,half:175*(1-depth*.75)};}
  function polygon(points,fill) {ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
  function circle(x,y,r,fill) {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
  function text(str,x,y,size,color) {ctx.font=size+'px "Microsoft YaHei",sans-serif';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(str,x,y);}
  function drawCan(pin) {
    if(pin.y>11||pin.y<0||Math.abs(pin.x)>2.2) return;
    const p=project(pin.x,pin.y),r=p.half*.106,h=r*2.9;
    ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#75867535';ctx.beginPath();ctx.ellipse(2,2,r*1.4,r*.45,0,0,Math.PI*2);ctx.fill();
    if(pin.fallen) {ctx.rotate(1.28+(reduced?0:Math.sin(pin.rotation)*.18));ctx.globalAlpha=.87;}
    const g=ctx.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#dc715b');g.addColorStop(.45,'#ffaf82');g.addColorStop(1,'#ca654c');
    ctx.fillStyle=g;ctx.fillRect(-r,-h,r*2,h-r*.2);ctx.beginPath();ctx.ellipse(0,-r*.2,r,r*.35,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f4ddb7';ctx.fillRect(-r,-h*.7,r*2,h*.42);
    ctx.fillStyle='#b17f69';ctx.beginPath();ctx.ellipse(0,-h,r,r*.36,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#eedac2';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,-h,r*.78,r*.22,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#8b9c77';ctx.beginPath();ctx.ellipse(-1,-h*.48,r*.4,r*.23,0,0,Math.PI*2);ctx.fill();polygon([{x:r*.28,y:-h*.48},{x:r*.64,y:-h*.61},{x:r*.64,y:-h*.36}],'#8b9c77');
    window.GameArt?.draw(ctx,'fish',-r*.65,-h*.69,r*1.3,h*.42);ctx.strokeStyle='#895536';ctx.lineWidth=1.8;ctx.strokeRect(-r,-h,r*2,h-r*.2);
    ctx.restore();
  }
  function drawBall(ball) {
    if(ball.y>11||ball.y<-.3) return;
    const p=project(ball.x,ball.y),r=p.half*ball.r;
    ctx.save();ctx.translate(p.x,p.y-r*.7);ctx.fillStyle='#66856a35';ctx.beginPath();ctx.ellipse(2,r*.8,r*1.08,r*.31,0,0,Math.PI*2);ctx.fill();
    const g=ctx.createRadialGradient(-r*.35,-r*.45,r*.06,0,0,r);g.addColorStop(0,'#b4dace');g.addColorStop(.45,'#79aa99');g.addColorStop(1,'#456f62');circle(0,0,r,g);
    ctx.strokeStyle='#426d60';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.rotate(reduced?0:ball.rotation||0);for(const p of [[-.28,-.35],[.14,-.45],[.35,-.12]]) circle(p[0]*r,p[1]*r,r*.11,'#3f6559');
    ctx.restore();
  }
  function draw() {
    if(!ctx) return;
    const ratio=Math.min(window.devicePixelRatio||1,2);if(canvas.width!==460*ratio){canvas.width=460*ratio;canvas.height=590*ratio;}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,460,590);
    const room=ctx.createLinearGradient(0,0,0,590);room.addColorStop(0,'#d3e9df');room.addColorStop(1,'#bbd4bd');ctx.fillStyle=room;ctx.fillRect(0,0,460,590);window.GameArt?.scene(ctx,'kitchen',0,0,460,590);
    ctx.fillStyle='#e6efdd';ctx.fillRect(0,86,460,8);ctx.fillStyle='#f2f3df';ctx.beginPath();ctx.roundRect(159,86,142,58,15);ctx.fill();
    text('BULI BOWLING',230,109,11,'#849978');text('今日罐头球馆',230,129,10,'#a0aa8a');
    circle(66,130,21,'#ebd6a1');text('★',66,135,15,'#f9f1d4');circle(397,133,19,'#adcab2');text('♪',397,138,18,'#edf2dc');
    ctx.fillStyle='#91b99a';ctx.fillRect(0,161,460,7);ctx.fillStyle='#a6c3a5';ctx.fillRect(0,168,460,65);
    for(const side of [-1,1]) polygon([project(side,0),project(side*1.24,0),project(side*1.24,10.5),project(side,10.5)],'#9aab94');
    polygon([project(-1,0),project(1,0),project(1,10.5),project(-1,10.5)],'#efdcb1');
    for(let x=-.92;x<1;x+=.16) {ctx.strokeStyle='#c8b38655';ctx.lineWidth=1;ctx.beginPath();const a=project(x,0),b=project(x,10.5);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    for(const y of [1.6,3.6,6.4,9.4]) {ctx.strokeStyle='#c8b38635';ctx.beginPath();const a=project(-1,y),b=project(1,y);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    for(const x of [-.65,-.32,0,.32,.65]) {const p=project(x,3.2);polygon([{x:p.x,y:p.y-7},{x:p.x-4,y:p.y+2},{x:p.x+4,y:p.y+2}],'#b7a477');}
    const foul=project(0,.08);ctx.fillStyle='#b7916f';ctx.fillRect(foul.x-foul.half,foul.y-1,foul.half*2,3);
    if(mode==='challenge') for(const obstacle of B.LANES[lane].obstacles) {
      const p=project(obstacle.x,obstacle.y),r=obstacle.r*p.half;
      ctx.fillStyle='#75857533';ctx.beginPath();ctx.ellipse(p.x+3,p.y+5,r,r*.43,0,0,Math.PI*2);ctx.fill();
      circle(p.x,p.y-r*.3,r,'#afbc96');circle(p.x-r*.1,p.y-r*.43,r*.75,'#d7dec0');
      ctx.strokeStyle='#9da880';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y-r*.3,r*.48,-.7,2.4);ctx.stroke();
      text('✦',p.x,p.y-r*.15,Math.max(10,r*.7),'#9da783');
    }
    if(phase==='aim') {
      const s=settings();ctx.strokeStyle='#b7a063';ctx.setLineDash([3,7]);ctx.lineWidth=2;ctx.beginPath();
      for(let y=.35;y<=6.8;y+=.1){const x=s.position+Math.tan(s.angle*Math.PI/180)*(y-.25);if(Math.abs(x)>1.08)break;const p=project(x,y);if(y===.35)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
      ctx.stroke();ctx.setLineDash([]);
    }
    const pins=shot?shot.pins:B.rack(standing);[...pins].sort((a,b)=>b.y-a.y).forEach(drawCan);
    if(shot && !reduced) for(const impact of shot.impacts) {
      const age=shot.elapsed-impact.time;if(age<0||age>.32)continue;const p=project(impact.x,impact.y);
      ctx.strokeStyle='#fff6d5';ctx.globalAlpha=1-age/.32;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-9,8+age*40,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
    if(phase==='aim')drawBall({x:settings().position,y:.25,r:.145,rotation:0});else if(shot)drawBall(shot.ball);
    ctx.fillStyle='#c0cba5';ctx.fillRect(0,555,460,35);ctx.fillStyle='#dfe5c8';ctx.fillRect(0,555,460,4);
    if(!window.GameArt?.draw(ctx,'cat',7,475,61,94)&&cat.complete&&cat.naturalWidth)ctx.drawImage(cat,7,475,61,94);
    text('卟哩的罐头球馆',265,579,10,'#849471');
    if(mode==='challenge')text('目标：两投倒下 '+B.LANES[lane].target+' 只',230,74,10,'#7e9578');
  }
  window.addEventListener('resize',draw);
  fresh();
})();
