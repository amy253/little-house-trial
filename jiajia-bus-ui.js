(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./jiajia-bus.js'):root.BusCatch);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BusCatchUI=api;api.mount(root);}})(typeof globalThis==='object'?globalThis:this,function(B){
 'use strict';
 function mount(win,options={}){
  const doc=win.document,$=id=>doc.getElementById(id),canvas=$('bus-scene');if(!canvas)return;
  let storage=null,save=B.readSave(null),saveFailed=false;
  try{storage=win.localStorage;save=B.readSave(storage.getItem(B.SAVE_KEY));}catch(_){saveFailed=true;}
  let g=B.create(save.completed+1),scene=null,sceneReady=false,loading=false,loadId=0,disposed=false,handled=false,panelMode='loading',last=win.performance.now(),ready;
  const island=win.IslandRevive?.create({id:'jiajia-bus'}),pointers=new Set(),listeners=[];
  function on(target,event,fn){target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));}
  function status(text){$('status').textContent=text;}
  function render(){
   $('remaining').textContent=g.remaining.toFixed(1);$('distance').textContent=g.distance.toFixed(1);$('station').textContent=g.level;
   $('record').textContent=saveFailed?'本次可玩 · 进度暂未保存':`已赶上 ${save.completed} 班车`;
   const active=sceneReady&&g.status==='playing'&&!g.paused;
   for(const side of ['left','right']){
    const node=$(side+'-foot');node.disabled=!active;node.classList.toggle('next',active&&g.lastFoot!==null&&g.lastFoot!==side);
   }
   $('menu').disabled=!sceneReady||!['playing','boarding'].includes(g.status);
   $('action').disabled=loading;
   $('next-foot').textContent=g.status==='boarding'?'赶上了，正在上车':g.stumble>0?'绊了一下，站稳再换脚':g.lastFoot?`换${g.lastFoot==='left'?'右':'左'}脚`:'左、右脚交替点';
  }
  function show(mode,title,copy,action){
   panelMode=mode;$('panel-title').textContent=title;$('panel-copy').textContent=copy;$('action').textContent=action;
   if(!$('panel').open)$('panel').showModal();render();
  }
  function close(){if($('panel').open)$('panel').close();}
  function fresh(level=g.level){
   if(!sceneReady)return;island?.reset();g=B.create(level);B.start(g);handled=false;pointers.clear();last=win.performance.now();
   close();status('先迈任意一脚，再左右交替；别连续点同一脚。');render();$('left-foot').focus({preventScroll:true});
  }
  function pause(){
   if(!sceneReady||g.paused||!['playing','boarding'].includes(g.status))return;
   g.paused=true;pointers.clear();show('paused','歇一口气','时间已经停住。继续后左右交替点，连续点同一脚会踉跄。','继续赶车');status('已暂停，车门倒计时也已停止。');
  }
  function press(side){
   if(!sceneReady)return;const result=B.foot(g,side);
   if(result.kind==='step')status(result.rhythm?'节奏很好，继续换脚！':'迈出一步，换另一只脚。');
   else if(result.kind==='stumble')status('同一只脚连点，绊了一下！站稳后换另一只脚。');
   else if(result.kind==='rushed')status('两脚别同时点，左右交替。');render();
  }
  function finish(){
   if(handled)return;handled=true;
   if(g.status==='won'){
    const next=B.record(save,g);if(next.completed!==save.completed){save=next;try{if(!storage)throw Error('storage');storage.setItem(B.SAVE_KEY,JSON.stringify(save));}catch(_){saveFailed=true;}}
    show('won','赶上车啦！',`第 ${g.level} 站成功上车，还剩 ${g.remaining.toFixed(1)} 秒。下一站继续赶车。`,'下一站');status('成功上车！');
   }else{
    show('lost','车门关上了',`还差 ${g.distance.toFixed(1)} 米。左右交替点，别让同一只脚连点绊住你。`,'再赶一次');status(`还差 ${g.distance.toFixed(1)} 米，试试更稳地换脚。`);
    const failed=g;island?.offer($('revive-host'),()=>{
     if(g!==failed||!B.revive(g))return false;handled=false;last=win.performance.now();pointers.clear();close();status('家家等着你呢！距离保留，继续交替换脚。');render();$('left-foot').focus({preventScroll:true});return true;
    },()=>g===failed&&g.status==='lost');
   }
  }
  function frame(now){
   if(disposed)return;const dt=Math.max(0,(now-last)/1000);last=now;B.tick(g,dt);
   if(['won','lost'].includes(g.status))finish();render();if(sceneReady)scene.render(g,Math.min(.1,dt));win.requestAnimationFrame(frame);
  }
  function load(){
   const token=++loadId;loading=true;sceneReady=false;show('loading','车站准备中','正在加载公交、人物和街景，稍等一下。','正在加载…');
   const factory=options.sceneFactory||((target)=>import('./bus-scene.mjs').then(m=>m.createScene(target)));
   ready=Promise.resolve().then(()=>factory(canvas)).then(result=>{
    if(disposed||token!==loadId){result.dispose();return;}scene?.dispose();scene=result;sceneReady=true;loading=false;
    show('ready','师傅，等等我！','左右脚交替点击，赶在关门前跑到车门。点同一只脚会绊一下。','开始赶车');status('场景已就绪，准备好了就出发。');
   },()=>{if(!disposed&&token===loadId){loading=false;show('error','街景没加载好','场景加载未完成，请检查网络后重试加载。','重试加载');status('场景加载失败，尚未开始计时。');}});
   return ready;
  }
  on($('action'),'click',()=>{
   if(loading)return;if(panelMode==='error'){load();return;}
   if(panelMode==='paused'){g.paused=false;last=win.performance.now();close();status('继续赶车，左右脚交替。');render();return;}
   fresh(panelMode==='won'?g.level+1:g.level);
  });
  on($('menu'),'click',pause);
  on($('panel'),'cancel',event=>{event.preventDefault();});
  for(const side of ['left','right']){
   on($(side+'-foot'),'pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;event.preventDefault();
    if(pointers.has(event.pointerId))return;pointers.add(event.pointerId);press(side);
   });
   on($(side+'-foot'),'click',event=>{if(event.detail===0)press(side);});
  }
  for(const name of ['pointerup','pointercancel'])on(doc,name,event=>pointers.delete(event.pointerId));
  on(win,'keydown',event=>{
   if(event.repeat||$('panel').open)return;const side={ArrowLeft:'left',ArrowRight:'right',a:'left',A:'left',d:'right',D:'right'}[event.key];
   if(side){event.preventDefault();press(side);}
  });
  on(doc,'visibilitychange',()=>{if(doc.hidden)pause();});on(win,'blur',pause);on(win,'pagehide',pause);
  load();render();win.requestAnimationFrame(frame);
  return {get game(){return g;},get ready(){return ready;},dispose(){disposed=true;loadId++;scene?.dispose();island?.hide();listeners.forEach(fn=>fn());}};
 }
 return {mount};
});
