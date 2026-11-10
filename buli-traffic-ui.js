(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./buli-traffic.js'));else{root.BuliTrafficUI=factory(root.BuliTraffic);root.BuliTrafficUI.mount();}})(typeof globalThis==='object'?globalThis:this,function(T){
  'use strict';
  function pointerPosition(event,board){
    const r=board.getBoundingClientRect(),sx=r.width/board.offsetWidth,sy=r.height/board.offsetHeight;
    return {x:6*(event.clientX-r.left-board.clientLeft*sx)/(board.clientWidth*sx),y:6*(event.clientY-r.top-board.clientTop*sy)/(board.clientHeight*sy)};
  }
  function createController(game){
    return {
      game,selected:'B',gesture:null,preview:0,suggestion:null,
      select(id){if(!game.cars.some(c=>c.id===id)||game.status!=='playing')return false;this.cancel();this.selected=id;this.suggestion=null;return true;},
      begin(id,pointer,point){if(this.gesture||!this.select(id)||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;this.gesture={id,pointer,start:point};return true;},
      drag(pointer,point){if(this.gesture?.pointer!==pointer||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;const c=game.cars.find(c=>c.id===this.gesture.id),axis=c.axis==='h'?'x':'y',bounds=T.range(game.cars,c.id);this.preview=Math.max(bounds.min,Math.min(bounds.max,Math.round(point[axis]-this.gesture.start[axis])));return true;},
      end(pointer,point){if(this.gesture?.pointer!==pointer)return false;this.drag(pointer,point);const {id}=this.gesture,delta=this.preview;this.cancel();return T.move(game,id,delta);},
      cancel(){this.gesture=null;this.preview=0;},
      step(delta){this.cancel();this.suggestion=null;return T.move(game,this.selected,delta);},
      key(key,{typing=false}={}){if(typing||this.gesture||game.status!=='playing')return false;const c=game.cars.find(c=>c.id===this.selected);if(!c)return false;const keys=c.axis==='h'?{ArrowLeft:-1,ArrowRight:1}:{ArrowUp:-1,ArrowDown:1};if(!(key in keys))return false;this.step(keys[key]);return true;},
      hint(){this.cancel();this.suggestion=T.hint(game);if(this.suggestion)this.selected=this.suggestion.id;return this.suggestion;}
    };
  }
  function mount(){
    if(typeof document==='undefined')return;
    const $=id=>document.getElementById(id),board=$('board');if(!board)return;
    let storage=null;try{storage=window.localStorage;}catch(_){}
    let game=T.load(storage),controller=createController(game),wonTimer=null,storageNotice=false;
    let joystick=null;joystick=window.TouchJoystick?.create({element:$('joystick'),thumb:$('joystick-thumb'),enabled:()=>game.status==='playing'&&!$('levels-dialog').open&&!document.hidden,onChange:({direction})=>{if(direction&&!$('move-'+direction).disabled)$('move-'+direction).click();}});
    const colors=['#9bbd9b','#dba38f','#a7becd','#d9c17b','#afa3c6','#c4c589','#dba6b1','#93b9b0','#bda992','#9faab7','#d7ae7e','#acb48d','#c5aab2'];
    const direction=move=>{const c=game.cars.find(c=>c.id===move.id);return c.axis==='h'?(move.delta<0?'左':'右'):(move.delta<0?'上':'下');};
    const carName=c=>c.id==='B'?'卟哩的小车':`${c.id} 号小车`;
    function save(){if(!T.persist(storage,game)&&!storageNotice){storageNotice=true;$('status').textContent='这次无法保存进度，仍可继续慢慢玩。';}}
    function point(event){return pointerPosition(event,board);}

    const scenery=document.querySelector?.('.scenery');
    function paintComicScene(){scenery?.classList.toggle('comic-scene-ready',!!window.GameArt?.sceneUrl('garden'));}
    document.addEventListener('game-art-ready',paintComicScene);paintComicScene();
    function renderCars(){
      const oldFocus=document.activeElement?.dataset.car;
      board.querySelectorAll('.vehicle').forEach(el=>el.remove());
      for(let i=0;i<game.cars.length;i++){
        const c=game.cars[i],el=document.createElement('button'),horizontal=c.axis==='h',delta=controller.gesture?.id===c.id?controller.preview:0;
        el.type='button';el.className=`vehicle ${horizontal?'horizontal':'vertical'}${c.id==='B'?' target':''}${controller.selected===c.id?' selected':''}${controller.suggestion?.id===c.id?' hinted':''}${controller.gesture?.id===c.id?' dragging':''}${game.status==='won'&&c.id==='B'?' departing':''}`;
        el.dataset.car=c.id;el.setAttribute('aria-label',`${carName(c)}，只能${horizontal?'左右':'上下'}滑动，${c.len}格长`);el.setAttribute('aria-pressed',String(controller.selected===c.id));el.disabled=game.status!=='playing';
        el.style.left=`${(c.x+(horizontal?delta:0))/6*100}%`;el.style.top=`${(c.y+(!horizontal?delta:0))/6*100}%`;el.style.width=`${(horizontal?c.len:1)/6*100}%`;el.style.height=`${(!horizontal?c.len:1)/6*100}%`;el.style.setProperty('--car',colors[(i-1+colors.length)%colors.length]);el.style.setProperty('--car-height',`${board.clientWidth/6*(horizontal?1:c.len)-8}px`);el.style.setProperty('--car-width',`${board.clientWidth/6*(horizontal?c.len:1)-8}px`);
        const body=document.createElement('span');body.className='car-body';body.setAttribute('aria-hidden','true');body.innerHTML='<span class="car-window"></span>'+(c.id==='B'?'<img src="'+(window.GameArt?.spriteUrl('cat')||'buli-head-snack.png')+'" alt="" draggable="false">':`<span class="car-letter">${c.id}</span>`)+`<span class="axis-cue">${horizontal?'↔':'↕'}</span>`;el.append(body);board.append(el);
      }
      if(oldFocus&&!controller.gesture)board.querySelector(`[data-car="${oldFocus}"]`)?.focus({preventScroll:true});
    }
    function renderControls(){
      joystick?.refresh();
      $('moves').textContent=game.moves;const c=game.cars.find(c=>c.id===controller.selected)||game.cars[0],r=T.range(game.cars,c.id),playing=game.status==='playing';
      $('selected-name').textContent=carName(c);$('axis-label').textContent=`只能${c.axis==='h'?'左右':'上下'}滑动`;
      for(const [id,axis,delta] of [['move-left','h',-1],['move-right','h',1],['move-up','v',-1],['move-down','v',1]])$(id).disabled=!playing||c.axis!==axis||(delta<0?r.min===0:r.max===0);
      $('undo').disabled=!playing||!game.history.length;$('hint').disabled=!playing;
    }
    function render(){
      const level=T.levels[game.index];$('chapter').textContent=`${game.index<8?'暖身小路':game.index<16?'穿过小镇':'回家的远路'} · ${String(game.index+1).padStart(2,'0')} / ${T.levels.length}`;$('level-title').textContent=level.title;$('par').textContent=`三星目标 ${level.par} 次`;
      $('instruction').textContent=game.index===0?'先把薄荷色的 A 车往下挪，再把卟哩的小车拖到右侧出口。':'横着的小车左右走，竖着的小车上下走。给卟哩让出右边的小路。';
      renderCars();renderControls();
      $('win-panel').hidden=game.status!=='won';
      if(game.status==='won'){
        const starCount=T.stars(game.moves,level.par);$('win-stars').textContent='★'.repeat(starCount)+'☆'.repeat(3-starCount);$('win-stars').setAttribute('aria-label',`获得 ${starCount} 颗星`);$('win-summary').textContent=`用了 ${game.moves} 次滑动 · 最好 ${game.save.best[game.index]} 次。${game.index===T.levels.length-1?'所有小路都走通啦！':'下一段小路已经解锁。'}`;
        $('next').textContent=game.index===T.levels.length-1?'全部完成 · 看关卡地图':'下一段小路 →';
        clearTimeout(wonTimer);wonTimer=setTimeout(()=>{$('next').focus({preventScroll:true});},window.matchMedia('(prefers-reduced-motion: reduce)').matches?50:850);
      }
    }
    function changed(result,message){if(result){save();render();$('status').textContent=game.status==='won'?'卟哩顺利开出停车场啦！':message||'小路又宽了一点。继续帮卟哩挪车吧。';}else{renderControls();$('status').textContent='这边有车挡住啦，先挪挪别的小车。';}}
    function start(index){joystick?.reset();const next=T.create(index,game.save);if(!next)return;clearTimeout(wonTimer);game=next;controller=createController(game);$('status').textContent='拖动小车，或点选后用方向键。一次拖动算一次。';save();render();}
    function cancel(){joystick?.reset();if(!controller.gesture)return;controller.cancel();renderCars();renderControls();}
    board.addEventListener('pointerdown',event=>{
      if(event.button!==0||controller.gesture)return;const car=event.target.closest('[data-car]');if(!car)return;
      if(controller.begin(car.dataset.car,event.pointerId,point(event))){event.preventDefault();board.setPointerCapture(event.pointerId);renderCars();renderControls();}
    });
    board.addEventListener('pointermove',event=>{if(controller.drag(event.pointerId,point(event))){const c=game.cars.find(c=>c.id===controller.gesture.id),el=board.querySelector(`[data-car="${c.id}"]`);el.style.left=`${(c.x+(c.axis==='h'?controller.preview:0))/6*100}%`;el.style.top=`${(c.y+(c.axis==='v'?controller.preview:0))/6*100}%`;}});
    board.addEventListener('pointerup',event=>{if(controller.gesture?.pointer!==event.pointerId)return;const delta=controller.preview,result=controller.end(event.pointerId,point(event));if(board.hasPointerCapture(event.pointerId))board.releasePointerCapture(event.pointerId);if(result)changed(true);else{renderCars();renderControls();if(delta)$('status').textContent='这边有车挡住啦。';}});
    board.addEventListener('pointercancel',cancel);board.addEventListener('lostpointercapture',cancel);
    board.addEventListener('click',event=>{const car=event.target.closest('[data-car]');if(car&&controller.select(car.dataset.car)){renderCars();renderControls();}});
    for(const [id,delta] of [['move-left',-1],['move-up',-1],['move-down',1],['move-right',1]])$(id).addEventListener('click',()=>changed(controller.step(delta)));
    document.addEventListener('keydown',event=>{const typing=!!event.target.closest?.('input,textarea,select,[contenteditable="true"]');if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||$('levels-dialog').open)return;if(controller.key(event.key,{typing})){event.preventDefault();save();render();$('status').textContent=game.status==='won'?'卟哩順利开出停车场啦！':'按方向键继续挪，或拖动到想去的位置。';}});
    $('undo').addEventListener('click',()=>{controller.cancel();controller.suggestion=null;changed(T.undo(game),'刚才那一步已经撤销。');});
    function restart(){controller.cancel();controller.suggestion=null;T.reset(game);save();render();$('status').textContent='回到出发的位置。再慢慢试一次。';}
    $('reset').addEventListener('click',restart);$('replay').addEventListener('click',restart);
    $('hint').addEventListener('click',()=>{
      const h=controller.hint();renderCars();renderControls();$('status').textContent=h?`下一步：把${carName(game.cars.find(c=>c.id===h.id))}往${direction(h)}滑 ${Math.abs(h.delta)} 格。虚线标出的就是它；提示不会替你移动。`:'先试着挪挪别的车，再来看下一步。';
    });
    function openLevels(){joystick?.reset();cancel();const list=$('level-list');list.replaceChildren();T.levels.forEach((l,i)=>{const button=document.createElement('button'),best=game.save.best[i];button.type='button';button.dataset.level=i;button.disabled=i>=game.save.unlocked;button.className=i===game.index?'current':'';button.setAttribute('aria-label',`第 ${i+1} 关，${l.title}，${button.disabled?'尚未解锁':best?`最好 ${best} 次`:'可以游玩'}`);button.innerHTML=`<span class="level-number">${button.disabled?'·':String(i+1).padStart(2,'0')}</span><span class="level-stars">${best?'★'.repeat(T.stars(best,l.par))+'☆'.repeat(3-T.stars(best,l.par)):button.disabled?'未解锁':'☆☆☆'}</span><small>${best?best+' 次':l.par+' 次三星'}</small>`;button.addEventListener('click',()=>{$('levels-dialog').close();start(i);});list.append(button);});$('levels-dialog').showModal();}
    $('levels-button').addEventListener('click',openLevels);$('close-levels').addEventListener('click',()=>$('levels-dialog').close());$('levels-dialog').addEventListener('click',event=>{if(event.target===$('levels-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
    $('next').addEventListener('click',()=>{if(game.index===T.levels.length-1)openLevels();else start(game.index+1);});
    window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();save();}});window.addEventListener('pagehide',()=>{cancel();save();});
    window.addEventListener('resize',()=>{cancel();renderCars();});document.addEventListener('game-art-ready',renderCars);render();
  }
  return {createController,mount,pointerPosition};
});
