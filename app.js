(() => {
  const sandIsland=window.IslandRevive?.create({id:'sand'}),matchIsland=window.IslandRevive?.create({id:'match3'}),starsIsland=window.IslandRevive?.create({id:'stars'}),mergeIsland=window.IslandRevive?.create({id:'merge'});
  let currentMode='';
  function reviveSand(){if(currentMode!=='sand'||!SandGame.revive(game))return false;paused=false;flights=[];streams=[];accumulator=0;stamp='';queueStamp='';last=performance.now();sync();canvas.focus();return true;}
  function reviveMatch(){if(currentMode!=='match3'||!Match3Game.revive(match3Game))return false;match3TurnId++;match3Drag=null;match3Busy=false;$('match3-win').hidden=true;matchIsland?.hide();renderMatch3();$('match3-board').querySelector('button')?.focus();return true;}
  function reviveStars(){if(currentMode!=='stars'||!StarCatch.revive(starsGame))return false;starsPaused=false;starsStarted=true;starsPointer=null;starsEffects=[];starsBounce=starsFlash=0;last=performance.now();syncStars();starsCanvas.focus();return true;}
  function reviveMerge(){if(currentMode!=='merge'||!MergeGame.revive(mergeGame))return false;mergePaused=false;mergeStarted=true;mergePointer=null;mergeEffects=[];mergeMilestoneTime=0;mergeMilestone.hidden=true;mergeAim=216;last=performance.now();syncMerge();mergeCanvas.focus();return true;}

  const $=id=>document.getElementById(id);
  const canvas=$('board'), ctx=canvas.getContext('2d');
  const colors=['','#b9abd3','#efc66e','#e99289','#f4e5c5','#83b5a3'];
  const names=['','丁香紫','奶油黄','珊瑚粉','米白','薄荷绿'];
  let game=SandGame.createGame(0),paused=false,last=0,accumulator=0,flights=[],streams=[];
  const levelCount=SandGame.LEVEL_COUNT;
  const unlockKey='little-house-unlocked-level';
  let unlockedLevel=Math.max(0,Math.min(levelCount-1,Number(localStorage.getItem(unlockKey)||0)));
  let stamp='';
  let queueStamp='';
  const cell=15,left=36,top=25;
  function inventory(){
    $('inventory').replaceChildren();
    for(let column=0;column<3;column++){
      const lane=document.createElement('div');
      lane.className='queue-column';
      const label=document.createElement('div');
      label.className='queue-label';label.textContent=`第 ${column+1} 列 ↑`;
      lane.append(label);
      const remaining=game.inventory.filter((b,i)=>i%3===column&&!b.used);
      if(!remaining.length){
        const empty=document.createElement('p');empty.className='queue-empty';empty.textContent='本列已派完';lane.append(empty);
      }
      remaining.forEach((item,position)=>{
      const button=document.createElement('button');
      button.className=`bucket-button ${position===0?'queue-head':'queue-waiting'}`;
      button.dataset.id=item.id;
      button.dataset.head=position===0?'true':'false';
      button.style.setProperty('--bucket',colors[item.color]);
      button.setAttribute('aria-label',`第${column+1}列${position===0?'队首，可派出':'排队中'}：${names[item.color]}桶，容量${item.capacity}`);
      button.innerHTML=`<span class="pail" aria-hidden="true"></span><span class="amount">${item.capacity}</span><span class="color-name">${names[item.color]}</span><span class="queue-status">${position===0?'点击出发':'排队中'}</span>`;
      button.onclick=()=>{
        if(paused) return;
        if(SandGame.dispatch(game,item.id)){
          $('hint').textContent=`第${column+1}列的${names[item.color]}桶出发了，后面的桶已前移。`;
          sync();
        }
      };
      lane.append(button);
      });
      $('inventory').append(lane);
    }
  }
  function reset(){sandIsland?.reset();
    const requestedLevel=Number($('level').value);
    game=SandGame.createGame(Math.min(requestedLevel,unlockedLevel));
    $('level').value=String(game.level);
    paused=false;flights=[];streams=[];accumulator=0;stamp='';queueStamp='';
    $('level-badge').textContent=`第 ${game.level+1} / ${levelCount} 关`;
    $('hint').textContent=game.level===0?'只能点每列最前面的桶。先试试第1列的薄荷绿桶.':game.level===1?'烛光礼服这一关颜色更多，先看头纱和礼服底部露出的颜色。':game.level===3?'斜纹会露出多种底色，先派能接到沙的队首桶，给后面的颜色留位置。':game.level===4?'回纹从外往里分层，观察底部露出的颜色，别让六个位置都被内层颜色占满。':'只能点三列队首；想拿后面的颜色，要先派走前面的桶。';
    sync();draw();
  }
  function sync(){
    if(currentMode==='sand'&&game.status==='blocked')sandIsland?.offer($('result-action').parentElement,reviveSand,()=>currentMode==='sand'&&game.status==='blocked');else sandIsland?.hide();
    if(game.status==='won'&&game.level<levelCount-1){
      unlockedLevel=Math.max(unlockedLevel,game.level+1);
      localStorage.setItem(unlockKey,String(unlockedLevel));
    }
    $('level').querySelectorAll('option').forEach((option,index)=>{
      option.disabled=index>unlockedLevel;
      option.textContent=index>unlockedLevel?`${String(index+1).padStart(2,'0')} · 通关后解锁`:option.dataset.label||option.textContent;
    });
    $('progress').value=game.collected;
    $('progress-text').textContent=`已经收集 ${Math.round(game.collected/game.total*100)}%`;
    $('completed').textContent=`装满 ${game.completed} 桶`;
    $('slots').textContent=`${game.active.length} / 6`;
    $('pause').textContent=paused?'▷':'Ⅱ';
    $('pause').setAttribute('aria-label',paused?'继续游戏':'暂停游戏');
    $('pause').disabled=game.status!=='playing';
    const nextQueue=game.inventory.map(b=>b.used?'1':'0').join('');
    if(nextQueue!==queueStamp){queueStamp=nextQueue;inventory();}
    $('inventory').querySelectorAll('button').forEach(b=>{
      b.disabled=b.dataset.head!=='true'||paused||game.status!=='playing'||game.active.length>=6;
    });
    const overlay=paused||game.status!=='playing';
    $('overlay').hidden=!overlay;
    $('overlay').classList.toggle('won',game.status==='won'&&!paused);
    $('result-home').hidden=game.status!=='won'||paused;
    if(overlay){
      const won=game.status==='won';
      $('result-icon').textContent=paused?'☾':won?'✦':'↻';
      $('result-title').textContent=paused?'歇一小会儿':won?'这一幅，收好啦！':'小桶有点堵住了';
      $('result-body').textContent=paused?'小桶和沙子都在等你，准备好再继续。':won?'所有彩沙都装好了。再玩一局，或在上方换一幅沙画。':'六个位置都满了，底部又没有它们能接的颜色。重来一次，先选底部的颜色。';
      $('result-action').textContent=paused?'继续接沙':won&&game.level<levelCount-1?'下一关':'再玩一次';
    }
    if(game.active.length===6&&game.status==='playing') $('hint').textContent='六个位置满了，等有小桶装满飞走后再派新桶。';
  }
  function round(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function bucket(b,y,alpha=1){
    const x=left+b.x*cell,w=4*cell;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.fillStyle='#43554d13';ctx.beginPath();ctx.ellipse(x+w/2,y+53,25,5,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+3,y);ctx.lineTo(x+w-3,y);ctx.lineTo(x+w-9,y+43);ctx.quadraticCurveTo(x+w/2,y+54,x+9,y+43);ctx.closePath();ctx.fillStyle=colors[b.color];ctx.fill();ctx.strokeStyle='#665744';ctx.lineWidth=2.5;ctx.stroke();
    ctx.save();ctx.clip();ctx.fillStyle='#ffffff42';ctx.fillRect(x,y,60,44*(1-b.fill/b.capacity));ctx.restore();
    ctx.beginPath();ctx.ellipse(x+w/2,y,w/2-2,7,0,0,Math.PI*2);ctx.fillStyle=colors[b.color];ctx.fill();ctx.strokeStyle='#ffffffc0';ctx.stroke();
    ctx.strokeStyle='#665744';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+w/2,y+8,w*.34,Math.PI,0);ctx.stroke();
    ctx.fillStyle='#fff7e8';ctx.fillRect(x+12,y+12,4,17);
    ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#364a41';ctx.fillText(`${b.fill}/${b.capacity}`,x+w/2,y+29);
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,432,532);
    round(0,0,432,532,16,'#f5dfb1');
    window.GameArt?.scene(ctx,'wood',0,0,432,532);
    round(25,14,382,382,12,'#9b6d46');
    round(29,18,374,374,9,'#e5bb7b');
    round(32,21,368,368,7,'#fff1cd');
    ctx.strokeStyle='#715137';ctx.lineWidth=2;ctx.strokeRect(32,21,368,368);
    for(const x of [29,403])for(const y of [18,392]){ctx.fillStyle='#6e5139';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    const grainCell=cell/4;
    for(let y=0;y<24;y++) for(let x=0;x<24;x++){
      const c=game.grid[y][x];
      if(!c) continue;
      const cellX=left+x*cell,cellY=top+y*cell;
      // Keep the 24×24 logic grid, but render four-by-four particles with no gaps.
      for(let gy=0;gy<4;gy++) for(let gx=0;gx<4;gx++){
        ctx.fillStyle=colors[c];
        ctx.fillRect(cellX+gx*grainCell,cellY+gy*grainCell,grainCell+0.15,grainCell+0.15);
        if((x+y+gx+gy)%4===0){ctx.fillStyle='#fff8e62e';ctx.fillRect(cellX+gx*grainCell,cellY+gy*grainCell,1.4,1.4);}
      }
    }
    ctx.strokeStyle='#9aaa9670';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(left,391);ctx.lineTo(left+360,391);ctx.stroke();ctx.setLineDash([]);
    ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#929887';ctx.fillText('↓ 只收底部露出的同色沙 ↓',216,410);
    round(0,481,432,38,8,'#d4dbcf');
    round(0,486,432,26,5,'#7b8e7d');
    ctx.save();ctx.beginPath();ctx.rect(0,418,432,108);ctx.clip();
    ctx.strokeStyle='#d2dbc073';ctx.lineWidth=2;
    for(let x=-30+(game.phase*cell)%28;x<470;x+=28){ctx.beginPath();ctx.moveTo(x,491);ctx.lineTo(x+8,499);ctx.lineTo(x,507);ctx.stroke();}
    for(const b of game.active){
      const bx=left+b.x*cell;
      ctx.fillStyle=colors[b.color]+'40';ctx.fillRect(bx,417,60,3);
      bucket(b,432);
    }
    ctx.restore();
    for(const p of streams){ctx.fillStyle=colors[p.color];ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
    for(const f of flights) bucket(f,432-(1-f.life)*115,f.life);
  }
  function frame(now){
    const dt=Math.min((now-last)/1000||0,0.05);last=now;
    if(!paused&&game.status==='playing'){
      accumulator+=dt;
      while(accumulator>=1/30){
        const before=new Map(game.active.map(b=>[b.id,b.fill]));
        SandGame.step(game,1/30);accumulator-=1/30;
        for(const b of [...game.active,...game.departed]) if(b.fill>(before.get(b.id)||0)){
          streams.push({x:left+(b.x+0.5+(game.tick%4))*cell,y:391,color:b.color,life:.4});
        }
        for(const b of game.departed) flights.push({...b,life:1});
      }
    }
    if(!paused){for(const f of flights) f.life-=dt*1.8;for(const p of streams){p.life-=dt;p.y+=dt*145;}flights=flights.filter(f=>f.life>0);streams=streams.filter(p=>p.life>0);}
    const next=[paused,game.status,game.collected,game.completed,game.active.length].join(':');
    if(stamp!==next){stamp=next;sync();}
    draw();
    if(!starsView.hidden){
      if(!starsPaused&&starsGame.status==='playing'){
        const events=StarCatch.step(starsGame,dt);
        for(const event of events){
          if(event.type==='catch'){
            starsBounce=.28;
            addStarBurst(event.x,event.y,'#ffdb7e');
            $('stars-hint').textContent=`接住啦！再接 ${starsGame.target-starsGame.caught} 个小房子就能过关。`;
          }else if(event.type==='miss'||event.type==='hit'){
            starsFlash=.25;
            $('stars-hint').textContent=event.type==='hit'?'碰到乌云了，快避开灰色的。':'漏掉一个小房子，快移动小篮子。';
          }
        }
        if(events.some(event=>event.type!=='dodge')) syncStars();
      }
      starsBounce=Math.max(0,starsBounce-dt);
      starsFlash=Math.max(0,starsFlash-dt);
      for(const particle of starsEffects){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.life-=dt;}
      starsEffects=starsEffects.filter(particle=>particle.life>0);
      drawStars(now);
    }
    if(!mergeView.hidden){
      if(!mergePaused&&mergeGame.status==='playing'){
        const events=MergeGame.step(mergeGame,dt);
        const merged=events.filter(event=>event.type==='merge');
        for(const event of merged) addMergeBurst(event.x,event.y,event.tier);
        if(merged.some(event=>event.tier===mergeNames.length-1)){
          mergeMilestone.hidden=false;mergeMilestoneTime=2.8;
          $('merge-hint').textContent='合成游泳家家啦！继续投放，挑战更高分。';
        }else if(merged.length){
          $('merge-hint').textContent=mergeGame.highestTier===mergeNames.length-1
            ?`合成了${mergeNames[merged.at(-1).tier]}！继续挑战最高分。`
            :`合成了${mergeNames[merged.at(-1).tier]}！继续往更大的图案升级。`;
        }
        if(events.length) syncMerge();
      }
      if(!mergePaused){
        for(const particle of mergeEffects){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.life-=dt;}
        mergeEffects=mergeEffects.filter(particle=>particle.life>0);
        if(mergeMilestoneTime>0){
          mergeMilestoneTime=Math.max(0,mergeMilestoneTime-dt);
          if(mergeMilestoneTime===0) mergeMilestone.hidden=true;
        }
      }
      drawMerge();
    }
    requestAnimationFrame(frame);
  }
  $('pause').onclick=()=>{paused=!paused;sync();};
  $('restart').onclick=reset;
  $('level').querySelectorAll('option').forEach(option=>{option.dataset.label=option.textContent;});
  $('level').onchange=()=>{if(Number($('level').value)<=unlockedLevel) reset();else $('level').value=String(game.level);};
  $('result-action').onclick=()=>{
    if(paused){paused=false;sync();return;}
    if(game.status==='won'&&game.level<levelCount-1){
      $('level').value=String(game.level+1);
      reset();
      return;
    }
    reset();
  };
  $('result-home').onclick=()=>showMode('home');
  const modeHome=$('mode-home'),modeSand=$('mode-sand'),modeMatch3=$('mode-match3'),modeStars=$('mode-stars'),modeMerge=$('mode-merge');
  const homeView=$('home-view'),flowerView=$('flower-view'),sandView=$('sand-view'),match3View=$('match3-view'),starsView=$('stars-view'),mergeView=$('merge-view');
  const flowerPlant=$('home-plant'),flowerScene=$('flower-scene'),flowerStatus=$('flower-status'),flowerWater=$('flower-water'),flowerIsland=$('flower-island'),flowerKey='little-house-flower-growth';
  let savedFlower;
  try{savedFlower=JSON.parse(localStorage.getItem(flowerKey));}catch{savedFlower=null;}
  let flowerState=FlowerGrowth.start(savedFlower),flowerAnimating=false,flowerSaveFailed=false;
  function renderFlower(){
    const checked=FlowerGrowth.advance(flowerState);
    const changed=checked.day!==flowerState.day||checked.total!==flowerState.total||checked.resetDay!==flowerState.resetDay;
    flowerState=checked;if(changed)saveFlower();
    const growth=FlowerGrowth.view(flowerState);
    $('flower-care').textContent=growth.daysUntilWither===null||growth.withered?'3天不浇会枯萎':`上次${growth.lastWaterDay.slice(5)}浇水 · 再${growth.daysUntilWither}天不浇会枯萎`;
    $('flower-care').dataset.urgent=String(growth.daysUntilWither!==null&&growth.daysUntilWither<=1);
    flowerStatus.dataset.urgent=$('flower-care').dataset.urgent;
    flowerPlant.dataset.withered=String(growth.withered);
    flowerPlant.dataset.stage=String(growth.stage);flowerPlant.style.setProperty('--plant-growth',String(growth.visual));flowerPlant.style.setProperty('--plant-bloom',String(growth.bloom));
    flowerPlant.setAttribute('aria-label',growth.withered?'断水后枯萎的小花':['还没发芽的花盆','小花发芽了','花苞长出来了','小花开了'][growth.stage]);
    flowerStatus.textContent=flowerAnimating?'艾佳正在给小花浇水…':[
      '种子种好了，等你来浇水。',
      '小芽长出来了，继续陪它长大。',
      '花苞出现了，离开花更近了。',
      '花开啦！记得继续浇水，断水3天也会枯萎。'
    ][growth.stage];
    $('flower-fill').style.width=`${growth.phaseProgress*100}%`;
    $('flower-progress').setAttribute('aria-valuemax',String(growth.next?growth.next.at-growth.next.from:FlowerGrowth.BLOOM));
    $('flower-progress').setAttribute('aria-valuenow',String(growth.next?growth.total-growth.next.from:FlowerGrowth.BLOOM));
    $('flower-progress').setAttribute('aria-label',growth.next?`到${growth.next.label}的进度`:'小花已经盛开');
    $('flower-next').textContent=growth.withered?'重新浇水，从发芽开始':growth.next?`再浇${growth.next.remaining}次：${growth.next.label}`:'已盛开 · 仍需浇水照顾';
    $('flower-count').textContent=`本株 ${growth.total} 次 · 今日可浇 ${growth.remainingToday} 次`;
    if(!flowerAnimating&&!growth.remainingToday&&growth.stage!==3)flowerStatus.textContent=growth.bonusEarned<FlowerGrowth.BONUS_LIMIT?'今天已浇完，去岛上找家家还能领额外次数。':'今天的小花喝饱了，明天再来陪它吧。';
    if(!flowerAnimating&&growth.daysUntilWither===1)flowerStatus.textContent=`上次${growth.lastWaterDay.slice(5)}浇水，再1天不浇就会枯萎。`;
    if(growth.withered)flowerStatus.textContent='连续3天没浇水，小花枯萎了。下次浇水重新发芽。';
    if(flowerSaveFailed)flowerStatus.textContent='浏览器未允许保存进度，请先保持页面打开。';
    $('home-flower-summary').textContent=growth.withered?'小花枯萎了，来重新照顾它':growth.stage===3?'小花已经开啦，记得继续浇水':growth.remainingToday?`今天还可浇 ${growth.remainingToday} 次 · 进度 ${growth.total}/${FlowerGrowth.BLOOM}`:'今天浇完了，明天再来';
    flowerWater.disabled=flowerAnimating||growth.remainingToday===0;
    flowerWater.textContent=flowerAnimating?'正在浇水…':!growth.remainingToday?'今日浇水已用完':growth.withered?'重新浇水，发芽':'给小花浇水';
    flowerIsland.disabled=flowerAnimating;
  }
  function saveFlower(){try{localStorage.setItem(flowerKey,JSON.stringify(flowerState));flowerSaveFailed=false;window.dispatchEvent(new Event('flower-save-changed'));return true;}catch(_){flowerSaveFailed=true;return false;}}
  window.FlowerSaveBridge={
    read:()=>flowerState,
    restore:saved=>{flowerState=FlowerGrowth.start(saved);saveFlower();renderFlower();}
  };
  flowerWater.onclick=()=>{
    if(flowerAnimating) return;
    if(FlowerGrowth.view(flowerState).remainingToday===0)return;
    const next=FlowerGrowth.water(flowerState);
    flowerState=next;
    saveFlower();
    flowerAnimating=true;
    flowerWater.disabled=true;
    flowerIsland.disabled=true;
    flowerWater.textContent='正在浇水…';
    flowerStatus.textContent='艾佳正在给小花浇水…';
    flowerScene.classList.remove('watering');
    flowerPlant.classList.remove('watered');
    void flowerScene.offsetWidth;
    flowerScene.classList.add('watering');
    setTimeout(()=>{renderFlower();flowerPlant.classList.add('watered');},1500);
    setTimeout(()=>{flowerAnimating=false;flowerScene.classList.remove('watering');renderFlower();},2600);
  };
  flowerIsland.onclick=()=>{
    if(flowerIsland.disabled) return;
    const next=FlowerGrowth.beginIslandVisit(flowerState,Date.now());
    if(next.visitStartedAt!==flowerState.visitStartedAt){
      flowerState=next;saveFlower();
      flowerStatus.textContent='去找家家说话吧！离开游戏满 10 秒再回来，可领一次额外浇水。';
    }
    window.open('https://www.homielands.com/','_blank','noopener');
  };
  function finishFlowerIslandVisit(){
    if(!flowerState.visitLeftAt){renderFlower();return;}
    const before=flowerState.bonusEarned;
    flowerState=FlowerGrowth.finishIslandVisit(flowerState,Date.now());
    saveFlower();renderFlower();
    if(flowerState.withered)return;
    flowerStatus.textContent=flowerState.bonusEarned>before
      ?'收到啦！获得 1 次额外浇水机会。'
      :'这次离开游戏还不到 10 秒，请重新打开岛页面再试。';
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      const next=FlowerGrowth.markIslandLeft(flowerState,Date.now());
      if(JSON.stringify(next)!==JSON.stringify(flowerState)){flowerState=next;saveFlower();}
    }else finishFlowerIslandVisit();
  });
  window.addEventListener('focus',finishFlowerIslandVisit);
  $('garden-tools').onclick=()=>$('garden-dialog').showModal();$('garden-close').onclick=()=>$('garden-dialog').close();
  if(savedFlower&&flowerState.total>0&&!savedFlower.lastWaterDay)saveFlower();
  renderFlower();
  const match3Symbols=['♥','◆','✦','❀','☘','♦'];
  const match3Art=['heart','blueGem','star','flower','leaf','purpleGem'];
  const match3Colors=['#d49b9b','#8aa7c4','#d4b05f','#c78eb0','#82ad98','#8998ca'];
  const match3LevelCount=Match3Game.LEVEL_COUNT,match3UnlockKey='little-house-match3-unlocked-level';
  let match3Unlocked=Math.max(0,Math.min(match3LevelCount-1,Number(localStorage.getItem(match3UnlockKey)||0)));
  let match3Game=Match3Game.createGame(),match3Drag=null,match3Busy=false,match3TurnId=0;
  const starsCanvas=$('stars-canvas'),starsCtx=starsCanvas.getContext('2d');
  const starsUnlockKey='little-house-stars-unlocked-level';
  const starsNormalUnlockKey='little-house-stars-normal-unlocked-level';
  function readStarsUnlock(key,max,fallback=0){
    const saved=localStorage.getItem(key),value=saved===null?fallback:Number(saved);
    return Number.isInteger(value)?Math.max(0,Math.min(max,value)):0;
  }
  let starsDifficulty='normal';
  let starsUnlocked=readStarsUnlock(starsNormalUnlockKey,4,readStarsUnlock(starsUnlockKey,2)*2);
  let starsGame=StarCatch.createGame(),starsPaused=true,starsStarted=false,starsPointer=null;
  let starsEffects=[],starsBounce=0,starsFlash=0;
  const mergeCanvas=$('merge-canvas'),mergeCtx=mergeCanvas.getContext('2d'),mergeMilestone=$('merge-milestone');
  const mergeNames=['小卟哩','蛋糕家家','橙子家家','机车家家','眼镜家家','游泳家家'];
  const mergeSymbols=['✦','❀','✾','✿','☆','♥'];
  const mergeColors=['#f6bdc8','#f6aebc','#eda267','#e0a5c5','#a7c7ba','#f2bd8e'];
  const mergeArtFiles=['merge-tier-1.png','merge-tier-2.png','merge-tier-3.png?v=2','merge-tier-4.png?v=2','merge-tier-5.png','merge-tier-6.png'];
  const mergeArt=mergeArtFiles.map(path=>{
    if(!path) return null;
    const image=new Image();if(path==='merge-tier-1.png'&&window.GameArt?.bind)window.GameArt.bind(image,'catHead');else image.src=path;return image;
  });
  const mergeBestKey='little-house-merge-best';
  let mergeBest=Number(localStorage.getItem(mergeBestKey)||0);
  let mergeGame=MergeGame.createGame(),mergePaused=true,mergeStarted=false,mergePointer=null,mergeAim=216,mergeEffects=[],mergeMilestoneTime=0;
  $('match3-level').querySelectorAll('option').forEach(option=>{option.dataset.label=option.textContent;});
  function refreshMatch3Levels(){
    $('match3-level-badge').textContent=`第 ${match3Game.level+1} / ${match3LevelCount} 关`;
    $('match3-level').value=String(match3Game.level);
    $('match3-level').querySelectorAll('option').forEach((option,index)=>{
      option.disabled=index>match3Unlocked;
      option.textContent=index>match3Unlocked?`${String(index+1).padStart(2,'0')} · 通关后解锁`:option.dataset.label;
    });
  }
  document.addEventListener('game-art-ready',()=>{if(currentMode==='match3'&&!match3Busy&&!match3Drag)renderMatch3();});
  function renderMatch3(fallCells=[]){
    refreshMatch3Levels();
    $('match3-score').textContent=match3Game.score;
    $('match3-target').textContent=match3Game.targetCells?`金框 ${match3Game.goalCells.length} 格`:match3Game.targetScore;
    $('match3-moves').textContent=match3Game.moves;
    $('match3-colors').textContent=match3Game.colorCount;
    $('match3-board').replaceChildren();
    const falling=new Map(fallCells.map(point=>[`${point.row}:${point.column}`,point.steps]));
    match3Game.board.forEach((row,rowIndex)=>row.forEach((value,columnIndex)=>{
      const tile=document.createElement('button');
      const goal=match3Game.goalCells.some(point=>point.row===rowIndex&&point.column===columnIndex);
      tile.className='match3-tile'+(goal?' match3-goal-cell':'');
      tile.dataset.row=rowIndex;tile.dataset.column=columnIndex;
      tile.style.order=rowIndex*Match3Game.SIZE+columnIndex;
      const steps=falling.get(`${rowIndex}:${columnIndex}`);
      if(steps){
        tile.classList.add('dropping');
        tile.style.setProperty('--drop-from',`${-105*Math.min(steps,3)}%`);
        tile.style.setProperty('--drop-delay',`${(Match3Game.SIZE-1-rowIndex)*18}ms`);
      }
      tile.style.color=match3Colors[value];tile.textContent=match3Symbols[value];
      const artUrl=window.GameArt?.spriteUrl(match3Art[value]);
      if(artUrl){const icon=document.createElement('img');icon.src=artUrl;icon.alt='';icon.className='comic-match-icon';icon.draggable=false;tile.replaceChildren(icon);}
      tile.setAttribute('aria-label',`第${rowIndex+1}行第${columnIndex+1}列${goal?'，待清理金框':''}`);
      tile.onpointerdown=event=>{
        if(match3Busy||match3Game.status!=='playing') return;
        event.preventDefault();
        $('match3-board').querySelectorAll('.suggested').forEach(item=>item.classList.remove('suggested'));
        tile.setPointerCapture(event.pointerId);
        match3Drag={pointerId:event.pointerId,point:{row:rowIndex,column:columnIndex},x:event.clientX,y:event.clientY,tile};
        tile.classList.add('dragging');
      };
      tile.onpointermove=event=>{
        if(!match3Drag||match3Drag.pointerId!==event.pointerId||match3Drag.tile!==tile) return;
        const dx=event.clientX-match3Drag.x,dy=event.clientY-match3Drag.y;
        const horizontal=Math.abs(dx)>=Math.abs(dy);
        const next=horizontal
          ?{row:rowIndex,column:columnIndex+Math.sign(dx)}
          :{row:rowIndex+Math.sign(dy),column:columnIndex};
        const target=next.row>=0&&next.row<Match3Game.SIZE&&next.column>=0&&next.column<Match3Game.SIZE?tileAt(next):null;
        if(match3Drag.target&&match3Drag.target!==target){
          match3Drag.target.classList.remove('drag-target');
          match3Drag.target.style.transform='';
        }
        match3Drag.target=target;
        if(!target){tile.style.transform='';return;}
        target.classList.add('drag-target');
        const distance=horizontal?target.offsetLeft-tile.offsetLeft:target.offsetTop-tile.offsetTop;
        const movement=Math.sign(distance)*Math.min(Math.abs(distance),Math.abs(horizontal?dx:dy));
        tile.style.transform=horizontal?`translateX(${movement}px)`:`translateY(${movement}px)`;
        target.style.transform=horizontal?`translateX(${-movement}px)`:`translateY(${-movement}px)`;
      };
      tile.onpointerup=event=>{
        if(!match3Drag||match3Drag.pointerId!==event.pointerId||match3Drag.tile!==tile) return;
        const {point,x,y,target}=match3Drag;
        const dx=event.clientX-x,dy=event.clientY-y;
        match3Drag=null;tile.classList.remove('dragging');target?.classList.remove('drag-target');
        const threshold=tile.getBoundingClientRect().width*.25;
        if(Math.max(Math.abs(dx),Math.abs(dy))<threshold){
          tile.classList.add('swapping');target?.classList.add('swapping');
          tile.style.transform='';if(target) target.style.transform='';
          setTimeout(()=>{tile.classList.remove('swapping');target?.classList.remove('swapping');},220);
          return;
        }
        const next=Math.abs(dx)>=Math.abs(dy)
          ?{row:point.row,column:point.column+Math.sign(dx)}
          :{row:point.row+Math.sign(dy),column:point.column};
        if(next.row<0||next.row>=Match3Game.SIZE||next.column<0||next.column>=Match3Game.SIZE){
          tile.style.transform='';if(target) target.style.transform='';
          return;
        }
        animateMatch3Move(point,next);
      };
      tile.onpointercancel=()=>{
        if(match3Drag?.tile===tile){
          match3Drag.target?.classList.remove('drag-target');
          if(match3Drag.target) match3Drag.target.style.transform='';
          match3Drag=null;
        }
        tile.classList.remove('dragging');tile.style.transform='';
      };
      tile.onkeydown=event=>{
        if(match3Busy||match3Game.status!=='playing') return;
        const direction={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[event.key];
        if(!direction) return;
        event.preventDefault();
        const next={row:rowIndex+direction[0],column:columnIndex+direction[1]};
        if(next.row>=0&&next.row<Match3Game.SIZE&&next.column>=0&&next.column<Match3Game.SIZE)
          animateMatch3Move({row:rowIndex,column:columnIndex},next);
      };
      $('match3-board').append(tile);
    }));
  }
  function tileAt(point){return $('match3-board').querySelector(`[data-row="${point.row}"][data-column="${point.column}"]`);}
  function showMatch3Result(){
    if(currentMode==='match3'&&['over','stuck'].includes(match3Game.status))matchIsland?.offer($('match3-win').querySelector('.match3-win-actions'),reviveMatch,()=>currentMode==='match3'&&['over','stuck'].includes(match3Game.status));else matchIsland?.hide();
    const won=match3Game.status==='won';
    if(won&&match3Game.level<match3LevelCount-1){
      match3Unlocked=Math.max(match3Unlocked,match3Game.level+1);
      localStorage.setItem(match3UnlockKey,String(match3Unlocked));
      refreshMatch3Levels();
    }
    const panel=$('match3-win');
    panel.classList.toggle('failed',!won);
    panel.setAttribute('aria-label',won?'家家乐过关':'家家乐失败');
    $('match3-result-icon').textContent=won?'✦':'↻';
    $('match3-result-title').textContent=won?'过关啦！':'挑战失败';
    $('match3-result-body').textContent=won
      ?match3Game.targetCells?`第 ${match3Game.level+1} 关的 ${match3Game.targetCells} 格金框全部清理！收获 ${match3Game.score} 分。`:`第 ${match3Game.level+1} 关完成，收获 ${match3Game.score} 分。`
      :match3Game.status==='stuck'
        ?'棋盘已经没有可消除的组合了。再试一次，换种走法吧。'
        :match3Game.targetCells?`步数用完了，还剩 ${match3Game.goalCells.length} 格金框。优先在金框位置连成三颗。`:`步数用完了，还差 ${match3Game.targetScore-match3Game.score} 分。再试一次吧。`;
    $('match3-win-next').textContent=won
      ?match3Game.level<match3LevelCount-1?'下一关':'重玩本关'
      :'再试一次';
    panel.hidden=false;
  }
  function animateMatch3Move(firstPoint,secondPoint){
    const first=tileAt(firstPoint),second=tileAt(secondPoint);
    if(!first||!second) return;
    match3Busy=true;
    const turnId=++match3TurnId;
    const dx=secondPoint.column-firstPoint.column,dy=secondPoint.row-firstPoint.row;
    first.classList.add('swapping');second.classList.add('swapping');
    const distance=dx?second.offsetLeft-first.offsetLeft:second.offsetTop-first.offsetTop;
    first.style.transform=dx?`translateX(${distance}px)`:`translateY(${distance}px)`;
    second.style.transform=dx?`translateX(${-distance}px)`:`translateY(${-distance}px)`;
    setTimeout(()=>{
      if(turnId!==match3TurnId) return;
      const result=Match3Game.play(match3Game,firstPoint,secondPoint);
      if(!result.ok){
        first.style.transform='';second.style.transform='';
        $('match3-hint').textContent='这次交换不能消除，试试旁边的颜色。';
        setTimeout(()=>{
          if(turnId!==match3TurnId) return;
          first.classList.remove('swapping');second.classList.remove('swapping');
          match3Busy=false;
        },250);
        return;
      }
      first.style.order=secondPoint.row*Match3Game.SIZE+secondPoint.column;
      second.style.order=firstPoint.row*Match3Game.SIZE+firstPoint.column;
      first.dataset.row=secondPoint.row;first.dataset.column=secondPoint.column;
      second.dataset.row=firstPoint.row;second.dataset.column=firstPoint.column;
      first.style.transform='';second.style.transform='';
      first.classList.remove('swapping');second.classList.remove('swapping');
      const cleared=[...new Map(result.cleared.map(point=>[`${point.row}:${point.column}`,point])).values()];
      cleared.forEach((point,index)=>{
        const tile=tileAt(point);
        if(!tile) return;
        tile.classList.add('clearing');
        tile.style.animationDelay=`${Math.min(index,7)*35}ms`;
      });
      const firstCleared=tileAt(cleared[0]);
      if(firstCleared){
        const scoreBubble=document.createElement('span');
        scoreBubble.className='match3-float-score';
        scoreBubble.textContent=`+${result.score}`;
        scoreBubble.style.left=`${firstCleared.offsetLeft+firstCleared.offsetWidth/2}px`;
        scoreBubble.style.top=`${firstCleared.offsetTop}px`;
        $('match3-board').append(scoreBubble);
      }
      $('match3-hint').textContent=match3Game.targetCells?`本次清理 ${result.goalsCleared} 格金框，还剩 ${match3Game.goalCells.length} 格。`:`消除了 ${result.removed} 颗，继续找下一组。`;
      $('match3-score').textContent=match3Game.score;
      $('match3-moves').textContent=match3Game.moves;
      const score=$('match3-score');score.classList.remove('score-pop');void score.offsetWidth;score.classList.add('score-pop');
      setTimeout(()=>{
        if(turnId!==match3TurnId) return;
        if(match3Game.status==='won') $('match3-hint').textContent=match3Game.targetCells?'过关啦！金框已经全部清理。':`过关啦！你已经达到 ${match3Game.targetScore} 分，可以再玩一局。`;
        if(match3Game.status==='over') $('match3-hint').textContent='步数用完了，这一关挑战失败。';
        if(match3Game.status==='stuck') $('match3-hint').textContent='没有可消除的组合了，这一关挑战失败。';
        renderMatch3(result.fallCells);
        setTimeout(()=>{
          if(turnId!==match3TurnId) return;
          $('match3-board').querySelectorAll('.dropping').forEach(tile=>tile.classList.remove('dropping'));
          match3Busy=false;
          if(match3Game.status!=='playing') showMatch3Result();
        },520);
      },850);
    },190);
  }
  function refreshStarsLevels(){
    const levels=StarCatch.getLevels(starsDifficulty);
    $('stars-difficulty').value=starsDifficulty;
    $('stars-level-badge').textContent=`${starsDifficulty==='normal'?'普通':'挑战'} ${starsGame.level+1} / ${levels.length}`;
    if($('stars-level').querySelectorAll('option').length!==levels.length){
      $('stars-level').replaceChildren(...levels.map((_,index)=>{const option=document.createElement('option');option.value=String(index);return option;}));
    }
    $('stars-level').value=String(starsGame.level);
    $('stars-level').querySelectorAll('option').forEach((option,index)=>{
      option.disabled=index>starsUnlocked;
      option.textContent=`${String(index+1).padStart(2,'0')} · ${index>starsUnlocked?'通关后解锁':levels[index].name}`;
    });
  }
  function syncStars(){
    if(currentMode==='stars'&&starsGame.status==='lost')starsIsland?.offer($('stars-overlay').querySelector('.stars-result-card'),reviveStars,()=>currentMode==='stars'&&starsGame.status==='lost');else starsIsland?.hide();
    const lastLevel=StarCatch.getLevels(starsDifficulty).length-1;
    if(starsGame.status==='won'&&starsGame.level<lastLevel){
      starsUnlocked=Math.max(starsUnlocked,starsGame.level+1);
      localStorage.setItem(starsDifficulty==='normal'?starsNormalUnlockKey:starsUnlockKey,String(starsUnlocked));
    }
    refreshStarsLevels();
    $('stars-caught').textContent=`${starsGame.caught} / ${starsGame.target}`;
    $('stars-misses').textContent=`${starsGame.misses} / ${starsGame.maxMisses}`;
    $('stars-pause').textContent=starsPaused?'▷ 继续':'Ⅱ 暂停';
    $('stars-pause').disabled=starsGame.status!=='playing';
    const overlay=$('stars-overlay');
    const won=starsGame.status==='won';
    overlay.hidden=!starsPaused&&starsGame.status==='playing';
    overlay.classList.toggle('won',won);
    overlay.setAttribute('aria-label',won?'接家家过关':starsGame.status==='lost'?'接家家失败':starsStarted?'接家家暂停':'接家家开始游戏');
    $('stars-result-icon').textContent=won?'⌂':starsGame.status==='lost'?'↻':'⌂';
    $('stars-result-title').textContent=won?'小房子全接住啦！':starsGame.status==='lost'?'这次漏掉了':'接住今晚的小房子';
    $('stars-result-body').textContent=won
      ?`第 ${starsGame.level+1} 关完成，接住了 ${starsGame.caught} 个小房子。`
      :starsGame.status==='lost'
        ?'机会用完了。再试一次，先看小房子落下的位置。'
        :`${starsGame.tip} 接住 ${starsGame.target} 个小房子；累计失误 ${starsGame.maxMisses} 次本关结束。`;
    $('stars-action').textContent=won?starsGame.level<lastLevel?'下一关':'重玩本关':starsGame.status==='lost'?'再试一次':starsStarted?'继续游戏':'开始接家家';
  }
  function resetStars(level=starsGame.level){starsIsland?.reset();
    starsGame=StarCatch.createGame(Math.min(level,starsUnlocked),Math.random,starsDifficulty);
    starsPaused=true;starsStarted=false;starsPointer=null;starsEffects=[];starsBounce=0;starsFlash=0;
    $('stars-hint').textContent=starsGame.tip+' 按住画面左右移动篮子。';
    syncStars();drawStars(performance.now());
  }
  function addStarBurst(x,y,color){
    for(let index=0;index<11;index++){
      const angle=index*Math.PI*2/11;
      const speed=55+(index%3)*24;
      starsEffects.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-25,life:.48,color});
    }
  }
  function drawLittleHouse(ctx,x,y){
    if(window.GameArt?.draw(ctx,'house',x-23,y-25,46,50))return;
    ctx.save();ctx.translate(x,y);
    ctx.shadowColor='#ffe1a4';ctx.shadowBlur=20;
    ctx.fillStyle='#fff3d1';ctx.strokeStyle='#fff9e8';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-15,-5,30,27,3);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(0,-22);ctx.lineTo(20,-5);ctx.closePath();
    ctx.fillStyle='#efa486';ctx.strokeStyle='#ffe8cd';ctx.lineWidth=2.5;ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle='#eebd6b';ctx.fillRect(-10,2,6,6);ctx.fillRect(4,2,6,6);
    ctx.fillStyle='#7da99e';ctx.beginPath();ctx.roundRect(-4,10,8,12,2);ctx.fill();
    ctx.restore();
  }
  function drawStars(now){
    const ctx=starsCtx,w=StarCatch.WIDTH,h=starsCanvas.height;
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#142039');sky.addColorStop(.67,'#314263');sky.addColorStop(1,'#716b83');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    for(let index=0;index<48;index++){
      const x=12+(index*91)%408,y=15+(index*137)%380;
      ctx.globalAlpha=.25+.3*(1+Math.sin(now/650+index))/2;
      ctx.fillStyle='#fff5da';ctx.beginPath();ctx.arc(x,y,index%7===0?2:1,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.fillStyle='#52647a';ctx.beginPath();ctx.ellipse(70,514,180,74,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#667985';ctx.beginPath();ctx.ellipse(365,523,205,75,0,0,Math.PI*2);ctx.fill();
    window.GameArt?.scene(ctx,'garden',0,447,w,88);
    for(const [x,y] of [[22,125],[378,235],[29,365]]){ctx.fillStyle='#fff0cd';ctx.strokeStyle='#b69575';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x-12,y,13,Math.PI,0);ctx.arc(x+5,y-7,19,Math.PI,0);ctx.arc(x+24,y,11,Math.PI,0);ctx.lineTo(x+35,y+9);ctx.lineTo(x-25,y+9);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.strokeStyle='#f2dcaa55';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,489);ctx.lineTo(414,489);ctx.stroke();
    for(const item of starsGame.items){
      if(item.kind==='star'){
        drawLittleHouse(ctx,item.x,item.y);
      }else{
        ctx.save();ctx.translate(item.x,item.y);ctx.fillStyle='#8994a5';ctx.strokeStyle='#c4ccd4';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(-11,3,11,Math.PI,0);ctx.arc(3,-4,15,Math.PI,0);ctx.arc(17,4,10,Math.PI,0);ctx.lineTo(27,11);ctx.lineTo(-22,11);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      }
    }
    for(const particle of starsEffects){
      ctx.globalAlpha=Math.max(0,particle.life/.48);ctx.fillStyle=particle.color;
      ctx.beginPath();ctx.arc(particle.x,particle.y,3,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.save();ctx.translate(starsGame.basketX,StarCatch.BASKET_Y+9);
    ctx.scale(1+starsBounce*.35,1-starsBounce*.3);
    ctx.fillStyle='#19273a55';ctx.beginPath();ctx.ellipse(0,48,57,8,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(-42,-5);ctx.lineTo(42,-5);ctx.lineTo(31,37);ctx.quadraticCurveTo(0,49,-31,37);ctx.closePath();
    ctx.fillStyle='#9fc7b4';ctx.fill();ctx.strokeStyle='#56704d';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#badac6';ctx.beginPath();ctx.ellipse(0,-5,43,9,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f4ffef';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#557667';ctx.font='bold 25px sans-serif';ctx.textAlign='center';if(!window.GameArt?.draw(ctx,'house',-13,5,26,27))ctx.fillText('⌂',0,29);
    ctx.restore();
    if(starsFlash){ctx.fillStyle=`rgba(240,140,145,${starsFlash*.7})`;ctx.fillRect(0,0,w,h);}
  }
  function moveStarsPointer(event){
    const bounds=starsCanvas.getBoundingClientRect();
    StarCatch.moveBasket(starsGame,(event.clientX-bounds.left)*StarCatch.WIDTH/bounds.width);
  }
  starsCanvas.onpointerdown=event=>{
    if(starsPaused||starsGame.status!=='playing') return;
    event.preventDefault();starsCanvas.focus();starsPointer=event.pointerId;
    starsCanvas.setPointerCapture(event.pointerId);moveStarsPointer(event);
  };
  starsCanvas.onpointermove=event=>{if(starsPointer===event.pointerId) moveStarsPointer(event);};
  starsCanvas.onpointerup=event=>{if(starsPointer===event.pointerId) starsPointer=null;};
  starsCanvas.onpointercancel=()=>{starsPointer=null;};
  starsCanvas.onkeydown=event=>{
    if(starsPaused||starsGame.status!=='playing') return;
    const delta={ArrowLeft:-42,ArrowRight:42}[event.key];
    if(!delta) return;
    event.preventDefault();StarCatch.moveBasket(starsGame,starsGame.basketX+delta);
  };
  $('stars-level').onchange=()=>{
    const level=Number($('stars-level').value);
    if(level<=starsUnlocked) resetStars(level);else $('stars-level').value=String(starsGame.level);
  };
  $('stars-difficulty').onchange=()=>{
    starsDifficulty=$('stars-difficulty').value==='challenge'?'challenge':'normal';
    starsUnlocked=starsDifficulty==='challenge'?readStarsUnlock(starsUnlockKey,2):readStarsUnlock(starsNormalUnlockKey,4,readStarsUnlock(starsUnlockKey,2)*2);
    resetStars(0);
  };
  $('stars-action').onclick=()=>{
    if(starsGame.status==='won') resetStars(Math.min(starsGame.level+1,StarCatch.getLevels(starsDifficulty).length-1));
    else if(starsGame.status==='lost') resetStars();
    else{starsPaused=false;starsStarted=true;syncStars();starsCanvas.focus();}
  };
  $('stars-pause').onclick=()=>{if(starsGame.status==='playing'){starsPaused=!starsPaused;starsStarted=true;syncStars();}};
  $('stars-reset').onclick=()=>resetStars();
  $('stars-home').onclick=()=>showMode('home');
  const mergeChain=$('merge-chain');
  mergeNames.forEach((name,tier)=>{
    const item=document.createElement('span');
    item.className='merge-chain-item';
    item.innerHTML=`<span class="merge-chain-icon" style="--tone:${mergeColors[tier]}"><img src="${mergeArtFiles[tier]}" alt=""></span>${name}`;
    mergeChain.append(item);
  });
  function syncMerge(){
    if(currentMode==='merge'&&mergeGame.status==='lost')mergeIsland?.offer($('merge-overlay').querySelector('.merge-result-card'),reviveMerge,()=>currentMode==='merge'&&mergeGame.status==='lost');else mergeIsland?.hide();
    if(mergeGame.score>mergeBest){
      mergeBest=mergeGame.score;
      localStorage.setItem(mergeBestKey,String(mergeBest));
    }
    $('merge-score').textContent=String(mergeGame.score);
    $('merge-best').textContent=String(mergeBest);
    $('merge-next').textContent=mergeNames[mergeGame.nextTier];
    mergeChain.querySelectorAll('.merge-chain-item').forEach((item,tier)=>item.classList.toggle('active',tier===mergeGame.highestTier));
    $('merge-pause').textContent=mergePaused?'▷ 继续':'Ⅱ 暂停';
    $('merge-pause').disabled=mergeGame.status!=='playing';
    const overlay=$('merge-overlay'),lost=mergeGame.status==='lost';
    overlay.hidden=!mergePaused&&!lost;
    if(lost) mergeMilestone.hidden=true;
    overlay.setAttribute('aria-label',lost?'合家团圆结束':'合家团圆暂停');
    $('merge-result-icon').textContent=lost?'↻':'❀';
    $('merge-result-title').textContent=lost?'花园装满啦':'把小快乐合起来';
    $('merge-result-body').textContent=lost
      ?`这局拿到 ${mergeGame.score} 分，最高合成了${mergeNames[mergeGame.highestTier]}。再试一次，挑战更大的图案吧！`
      :'两个相同图案碰到就会升级。别让它们堆过警戒线。';
    $('merge-action').textContent=lost?'再玩一次':mergeStarted?'继续游戏':'开始合成';
  }
  function resetMerge(){mergeIsland?.reset();
    mergeGame=MergeGame.createGame();
    mergePaused=true;mergeStarted=false;mergePointer=null;mergeAim=216;mergeEffects=[];mergeMilestoneTime=0;mergeMilestone.hidden=true;
    $('merge-hint').textContent='按住上方图案左右拖动，松手投放；键盘左右键和空格也可以。';
    syncMerge();drawMerge();
  }
  function addMergeBurst(x,y,tier){
    const final=tier===mergeNames.length-1,count=final?28:12,duration=final?.9:.5;
    for(let index=0;index<count;index++){
      const angle=index*Math.PI*2/count,speed=55+index%3*18+(final?35:0);
      mergeEffects.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-20,life:duration,duration,color:mergeColors[tier]});
    }
  }
  function drawMergeToken(x,y,tier,r,alpha=1){
    const ctx=mergeCtx;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.shadowColor=mergeColors[tier];ctx.shadowBlur=15;
    const fill=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.15,x,y,r);
    fill.addColorStop(0,'#fffdf5');fill.addColorStop(.42,mergeColors[tier]);fill.addColorStop(1,mergeColors[tier]);
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#765639';ctx.lineWidth=2.5;ctx.stroke();
    ctx.strokeStyle='#fff5d6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x-r*.05,y-r*.06,r*.84,Math.PI*1.08,Math.PI*1.65);ctx.stroke();
    const art=mergeArt[tier];
    if(art?.complete&&art.naturalWidth){
      const crop=Math.min(art.naturalWidth,art.naturalHeight);
      ctx.save();ctx.beginPath();ctx.arc(x,y,r-3,0,Math.PI*2);ctx.clip();
      ctx.drawImage(art,(art.naturalWidth-crop)/2,(art.naturalHeight-crop)/2,crop,crop,x-r+3,y-r+3,(r-3)*2,(r-3)*2);
      ctx.restore();
    }else{
      ctx.fillStyle=tier>=4?'#355b54':'#704d65';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font=`bold ${Math.round(r*1.22)}px sans-serif`;
      ctx.fillText(mergeSymbols[tier],x,y+1);
    }
    ctx.restore();
  }
  function drawMerge(){
    const ctx=mergeCtx,w=MergeGame.WIDTH,h=mergeCanvas.height;
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#f6eaf0');sky.addColorStop(1,'#ded7e7');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    window.GameArt?.scene(ctx,'garden',0,0,w,h);
    for(let index=0;index<34;index++){
      const x=(index*83+31)%w,y=(index*127+67)%h;
      ctx.fillStyle=index%3?'#ffffff80':'#e4a5b780';
      ctx.beginPath();ctx.arc(x,y,index%5===0?2:1,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='#fff1d9ed';ctx.fillRect(mergeGame.wall,MergeGame.LINE,w-mergeGame.wall*2,MergeGame.FLOOR-MergeGame.LINE);
    ctx.strokeStyle='#65896b';ctx.lineWidth=10;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(mergeGame.wall,MergeGame.LINE);ctx.lineTo(mergeGame.wall,MergeGame.FLOOR);
    ctx.lineTo(w-mergeGame.wall,MergeGame.FLOOR);ctx.lineTo(w-mergeGame.wall,MergeGame.LINE);ctx.stroke();
    ctx.strokeStyle='#b9d59a';ctx.lineWidth=3;ctx.stroke();
    for(let y=MergeGame.LINE+25;y<MergeGame.FLOOR;y+=64){ctx.strokeStyle='#55714d';ctx.lineWidth=2;for(const x of [mergeGame.wall,w-mergeGame.wall]){ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.stroke();}}
    ctx.strokeStyle='#d98c9e';ctx.lineWidth=2;ctx.setLineDash([7,6]);
    ctx.beginPath();ctx.moveTo(mergeGame.wall+4,MergeGame.LINE);ctx.lineTo(w-mergeGame.wall-4,MergeGame.LINE);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ae7084';ctx.font='12px sans-serif';ctx.textAlign='left';ctx.fillText('警戒线',mergeGame.wall+10,MergeGame.LINE+18);
    if(mergeGame.status==='playing'){
      const r=MergeGame.RADII[mergeGame.nextTier];
      const x=Math.max(mergeGame.wall+r,Math.min(w-mergeGame.wall-r,mergeAim));
      ctx.save();ctx.strokeStyle='#b88aa87a';ctx.lineWidth=2;ctx.setLineDash([4,6]);
      ctx.beginPath();ctx.moveTo(x,79);ctx.lineTo(x,MergeGame.LINE);ctx.stroke();ctx.restore();
      drawMergeToken(x,52,mergeGame.nextTier,r,.95);
    }
    for(const piece of mergeGame.pieces){
      ctx.fillStyle='#8e7b8d25';ctx.beginPath();ctx.ellipse(piece.x,MergeGame.FLOOR+4,piece.r*.8,5,0,0,Math.PI*2);ctx.fill();
      drawMergeToken(piece.x,piece.y,piece.tier,piece.r);
    }
    for(const particle of mergeEffects){
      ctx.globalAlpha=Math.max(0,particle.life/particle.duration);ctx.fillStyle=particle.color;
      ctx.beginPath();ctx.arc(particle.x,particle.y,3,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function moveMergePointer(event){
    const bounds=mergeCanvas.getBoundingClientRect();
    mergeAim=(event.clientX-bounds.left)*MergeGame.WIDTH/bounds.width;
  }
  mergeCanvas.onpointerdown=event=>{
    if(mergePaused||mergeGame.status!=='playing') return;
    event.preventDefault();mergeCanvas.focus();mergePointer=event.pointerId;
    mergeCanvas.setPointerCapture(event.pointerId);moveMergePointer(event);
  };
  mergeCanvas.onpointermove=event=>{if(mergePointer===event.pointerId) moveMergePointer(event);};
  mergeCanvas.onpointerup=event=>{
    if(mergePointer!==event.pointerId) return;
    moveMergePointer(event);mergePointer=null;
    if(MergeGame.drop(mergeGame,mergeAim)){
      $('merge-hint').textContent='落下啦！相同图案碰在一起会升级。';syncMerge();
    }else $('merge-hint').textContent='等上一颗落下后再投。';
  };
  mergeCanvas.onpointercancel=()=>{mergePointer=null;};
  mergeCanvas.onkeydown=event=>{
    if(mergePaused||mergeGame.status!=='playing') return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();mergeAim+=event.key==='ArrowLeft'?-25:25;
      const r=MergeGame.RADII[mergeGame.nextTier];
      mergeAim=Math.max(mergeGame.wall+r,Math.min(MergeGame.WIDTH-mergeGame.wall-r,mergeAim));
    }else if(event.key===' '||event.key==='Enter'){
      event.preventDefault();if(MergeGame.drop(mergeGame,mergeAim)) syncMerge();
    }
  };
  $('merge-action').onclick=()=>{
    if(mergeGame.status==='lost') resetMerge();
    mergePaused=false;mergeStarted=true;syncMerge();mergeCanvas.focus();
  };
  $('merge-pause').onclick=()=>{if(mergeGame.status==='playing'){mergePaused=!mergePaused;mergeStarted=true;syncMerge();}};
  $('merge-reset').onclick=()=>resetMerge();
  $('merge-home').onclick=()=>showMode('home');
  function showMode(mode){
    currentMode=mode;
    if(mode!=='sand')sandIsland?.hide();if(mode!=='match3')matchIsland?.hide();if(mode!=='stars')starsIsland?.hide();if(mode!=='merge')mergeIsland?.hide();
    const home=mode==='home';
    const flower=mode==='flower';
    const sand=mode==='sand';
    const match3=mode==='match3';
    const stars=mode==='stars';
    const merge=mode==='merge';
    if(home||flower) renderFlower();
    if(!stars&&!starsView.hidden&&starsGame.status==='playing'&&!starsPaused){starsPaused=true;syncStars();}
    if(!merge&&!mergeView.hidden&&mergeGame.status==='playing'&&!mergePaused){mergePaused=true;syncMerge();}
    homeView.hidden=!home;flowerView.hidden=!flower;sandView.hidden=!sand;match3View.hidden=!match3;starsView.hidden=!stars;mergeView.hidden=!merge;
    $('sand-guide').hidden=!sand;$('sand-note').hidden=!sand;
    modeHome.classList.toggle('active',home||flower);
    modeSand.classList.toggle('active',sand);
    modeMatch3.classList.toggle('active',match3);
    modeStars.classList.toggle('active',stars);
    modeMerge.classList.toggle('active',merge);
    if(sand&&game.status==='won') reset();else if(sand)sync();
    if(stars)syncStars();if(merge)syncMerge();
    if(match3){
      if(match3Game.status==='won') resetMatch3(match3Game.level);
      else{renderMatch3();if(match3Game.status!=='playing')showMatch3Result();}
    }
  }
  modeHome.onclick=()=>showMode('home');
  $('home-flower').onclick=()=>showMode('flower');
  $('flower-back').onclick=()=>showMode('home');
  modeSand.onclick=()=>showMode('sand');
  modeMatch3.onclick=()=>showMode('match3');
  modeStars.onclick=()=>showMode('stars');
  modeMerge.onclick=()=>showMode('merge');
  $('home-sand').onclick=()=>showMode('sand');
  $('home-match3').onclick=()=>showMode('match3');
  $('home-stars').onclick=()=>showMode('stars');
  $('home-merge').onclick=()=>showMode('merge');
  $('match3-show-hint').onclick=()=>{
    if(match3Busy||match3Game.status!=='playing') return;
    const move=Match3Game.findValidMove(match3Game.board,true,match3Game.goalCells);
    if(!move) return;
    $('match3-board').querySelectorAll('.suggested').forEach(tile=>tile.classList.remove('suggested'));
    move.forEach(point=>tileAt(point)?.classList.add('suggested'));
    $('match3-hint').textContent=match3Game.targetCells?'按亮起两格交换；剩余金框可能需要先调整周围图案。':'把亮起来的其中一颗，滑向另一颗。';
  };
  function resetMatch3(level=match3Game.level){matchIsland?.reset();
    match3TurnId++;match3Game=Match3Game.createGame(Math.random,Math.min(level,match3Unlocked));match3Drag=null;match3Busy=false;
    $('match3-win').hidden=true;
    $('match3-win').classList.remove('failed');
    $('match3-hint').textContent=match3Game.targetCells?'消除金框里的图案，每格清一次；分数再高也要清完金框。':'按住一颗图标，向上下左右滑动一格。';
    renderMatch3();
  }
  $('match3-level').onchange=()=>{
    const level=Number($('match3-level').value);
    if(level<=match3Unlocked) resetMatch3(level);
    else $('match3-level').value=String(match3Game.level);
  };
  $('match3-reset').onclick=()=>resetMatch3();
  $('match3-win-next').onclick=()=>resetMatch3(match3Game.status==='won'?Math.min(match3Game.level+1,match3LevelCount-1):match3Game.level);
  $('match3-win-home').onclick=()=>showMode('home');
  for(const confetti of document.querySelectorAll('.match3-confetti')){
    for(let index=0;index<16;index++){
      const piece=document.createElement('span');
      piece.style.setProperty('--x',`${(index*37)%100}%`);
      piece.style.setProperty('--color',['#e9b75e','#d68e9b','#91b9a1','#a89bd0'][index%4]);
      piece.style.setProperty('--delay',`${(index%5)*.14}s`);
      piece.style.setProperty('--duration',`${1.6+(index%4)*.23}s`);
      confetti.append(piece);
    }
  }
  renderMatch3();resetStars();resetMerge();
  showMode(new URLSearchParams(location.search).get('game')==='match3'?'match3'
    :new URLSearchParams(location.search).get('game')==='sand'?'sand'
    :new URLSearchParams(location.search).get('game')==='stars'?'stars'
    :new URLSearchParams(location.search).get('game')==='merge'?'merge'
    :new URLSearchParams(location.search).get('game')==='flower'?'flower':'home');
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden) renderFlower();
    if(document.hidden&&game.status==='playing'){paused=true;sync();}
    if(document.hidden&&starsGame.status==='playing'&&!starsPaused){starsPaused=true;syncStars();}
    if(document.hidden&&mergeGame.status==='playing'&&!mergePaused){mergePaused=true;syncMerge();}
  });
  reset();requestAnimationFrame(frame);
})();
