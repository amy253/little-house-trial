(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./jiajia-sand-slide.js'):root.SandSlide);if(typeof module==='object'&&module.exports)module.exports=api;else{root.SandSlideUI=api;api.mount(root);}})(typeof globalThis==='object'?globalThis:this,function(S){
 'use strict';
 function mount(win,options={}){
  const doc=win.document,$=id=>doc.getElementById(id),canvas=$('sand-canvas');if(!canvas)return;
  let save=S.readSave(null),storage=null,saveFailed=false;try{storage=win.localStorage;save=S.readSave(storage.getItem(S.SAVE_KEY));}catch(_){saveFailed=true;}
  let g=null,art=null,loading=false,mode='loading',ready,last=win.performance.now(),disposed=false,handled=false,selected=null,drag=null,loadId=0,lastHud='';
  const island=win.IslandRevive?.create({id:'jiajia-sand-slide'}),listeners=[];
  const message=text=>{$('status').textContent=text;};
  function on(target,key,fn){target.addEventListener(key,fn);listeners.push(()=>target.removeEventListener(key,fn));}
  function release(){if(drag)try{canvas.releasePointerCapture(drag.id);}catch(_){}drag=null;}
  function render(){
   const key=[loading,mode,g?.level,g?.status,g?.paused,g?Math.ceil(g.remaining):'',g?.collected,g?.moves,selected,save.completed,saveFailed].join('|');if(key===lastHud)return;lastHud=key;
   $('action').disabled=loading;$('restart').disabled=loading||!g;$('first').disabled=loading||!art;$('menu').disabled=!g||g.status!=='playing';$('hint').disabled=!g||g.status!=='playing'||g.paused;
   if(!g)return;const t=Math.ceil(g.remaining);$('time').textContent=`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
   $('level').textContent=g.level;$('progress').textContent=`${Math.round(g.collected/g.total*100)}%`;$('moves').textContent=g.moves;
   $('record').textContent=saveFailed?'本次可玩，进度暂未保存':`已完成 ${save.completed} 幅`;
   if(g.level<=2&&g.status==='playing'&&!g.paused){const h=S.hint(g);message(h?.path.length?'沿箭头把亮边盒子送到上沿，挡住时先横向让路。':h?'正在接沙，装满100%后盒子会消失，再送下一种颜色。':'先等彩沙落稳，再把露出颜色的盒子送到上沿。');}
  }
  function show(next,title,copy,action){mode=next;$('panel-title').textContent=title;$('panel-copy').textContent=copy;$('action').textContent=action;if(!$('panel').open)$('panel').showModal();render();}
  function close(){if($('panel').open)$('panel').close();}
  function fresh(level){
   if(!art)return;release();island?.reset();g=S.create(level,art.picture(level));S.start(g);handled=false;selected=null;last=win.performance.now();close();
   message(level===1?'按箭头把亮边盒子拖到上沿。':level===2?'先把上方横盒拖到上沿；装满后，下面的盒子就有路了。':'先挪开挡路的盒子，把底部露出的同色盒送到最上沿。');render();canvas.focus({preventScroll:true});
  }
  function pause(){if(!g||g.status!=='playing'||g.paused)return;release();g.paused=true;show('paused','先歇一会儿','计时和流沙都已暂停，继续后接着挪盒子。','继续接沙');}
  function load(){
   const token=++loadId;loading=true;show('loading','正在铺好彩沙','准备家家的沙画和盒子，尚未开始计时。','正在加载…');
   const factory=options.artFactory||((target)=>win.SandSlideArt.create(target));
   ready=Promise.resolve().then(()=>factory(canvas)).then(result=>{
    if(disposed||token!==loadId){result.dispose();return;}art?.dispose();art=result;loading=false;g=S.create(save.completed+1,art.picture(save.completed+1));
    show('ready','挪盒子，接彩沙','按住盒子拖到最上沿，只吸底部露出的同色沙。盒子装满就消失；挡路时先给它腾位置。','开始接沙');message('上面是沙画，下面的彩盒可以直接拖动。');
   },()=>{if(!disposed&&token===loadId){loading=false;show('error','沙画加载失败','图片没能加载，请检查网络后重试。还没有开始计时。','重试加载');}});return ready;
  }
  function finish(){
   if(handled)return;handled=true;release();
   if(g.status==='won'){
    const next=S.record(save,g);if(next.completed!==save.completed){save=next;try{if(!storage)throw Error('storage');storage.setItem(S.SAVE_KEY,JSON.stringify(save));}catch(_){saveFailed=true;}}
    show('won','这一幅收好啦',`第 ${g.level} 幅全部装好了，挪了 ${g.moves} 格。下一幅盒子会更挤，先观察沙画底部。`,'下一幅沙画');message('彩沙全部收好，下一幅继续。');
   }else{
    show('lost','时间到了','已接走的沙和盒子位置都保留。可以去比邻岛复活，或重新安排这一局。','重新接这一幅');message('本局超时。');const failed=g;
    island?.offer($('revive-host'),()=>{if(g!==failed||!S.revive(g))return false;handled=false;last=win.performance.now();close();message('补了2分钟，布局和已装彩沙保留，继续接沙。');render();return true;},()=>g===failed&&g.status==='lost');
   }
  }
  function frame(now){
   if(disposed)return;const dt=Math.max(0,(now-last)/1000);last=now;if(g){S.tick(g,dt);if(['won','lost'].includes(g.status))finish();render();art?.draw(g,selected,Math.min(.1,dt));}win.requestAnimationFrame(frame);
  }
  function point(event){const rect=canvas.getBoundingClientRect(),b=art.layout().board;return {x:(event.clientX-rect.left-b.x)/b.tile,y:(event.clientY-rect.top-b.y)/b.tile};}
  function moved(id,dx,dy){const ok=S.move(g,id,dx,dy);if(ok)message('盒子到最上沿就能接同色沙；装满会自动腾出位置。');else message('这里被挡住了，先挪开旁边的盒子。');return ok;}
  on(canvas,'pointerdown',event=>{
   if(!g||g.status!=='playing'||g.paused||drag||event.button!==undefined&&event.button!==0)return;
   event.preventDefault();const p=point(event),id=S.hit(g,p.x,p.y);if(id===null)return;selected=id;drag={id:event.pointerId,box:id,x:p.x,y:p.y};try{canvas.setPointerCapture(event.pointerId);}catch(_){}canvas.focus({preventScroll:true});
  });
  on(canvas,'pointermove',event=>{
   if(!drag||drag.id!==event.pointerId)return;event.preventDefault();if(!g.boxes.some(b=>b.id===drag.box)){release();return;}
   const p=point(event);for(let n=0;n<20;n++){
    const dx=p.x-drag.x,dy=p.y-drag.y;if(Math.max(Math.abs(dx),Math.abs(dy))<.55)break;
    const sx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,sy=sx?0:Math.sign(dy);
    if(!moved(drag.box,sx,sy)){drag.x=p.x;drag.y=p.y;break;}drag.x+=sx;drag.y+=sy;
   }render();
  });
  for(const key of ['pointerup','pointercancel','lostpointercapture'])on(canvas,key,event=>{if(drag?.id===event.pointerId)release();});
  on(canvas,'keydown',event=>{
   if(!g||g.status!=='playing'||g.paused)return;const ids=g.boxes.map(b=>b.id);
   if(event.key===' '){event.preventDefault();selected=ids[(ids.indexOf(selected)+1)%ids.length];message('已换一个盒子，用方向键移动。');}
   const d={ArrowUp:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowDown:[0,1]}[event.key];if(d){event.preventDefault();if(selected===null)selected=ids[0];moved(selected,...d);render();}
  });
  on($('action'),'click',()=>{if(loading)return;if(mode==='error'){load();return;}if(mode==='paused'){g.paused=false;last=win.performance.now();close();render();return;}fresh(mode==='won'?g.level+1:g.level);});
  on($('menu'),'click',pause);on($('restart'),'click',()=>{if(g&&!loading)fresh(g.level);});on($('first'),'click',()=>{if(!loading)fresh(1);});
  on($('hint'),'click',()=>{if(!g||g.paused||g.status!=='playing')return;const h=S.hint(g);if(h){selected=h.id;message(h.path.length?`亮边的盒子能接到沙，先向${h.path[0][1]<0?'上':h.path[0][1]>0?'下':h.path[0][0]<0?'左':'右'}挪，再送到最上沿。`:'最上沿的盒子正在接沙，等它装满腾出位置。');}else message('先挪开挡路的盒子，给沙画底部颜色的盒子留一条上去的路。');});
  on($('panel'),'cancel',event=>event.preventDefault());on(doc,'visibilitychange',()=>{if(doc.hidden)pause();});on(win,'blur',pause);on(win,'pagehide',pause);on(win,'resize',release);
  load();render();win.requestAnimationFrame(frame);
  return {get game(){return g;},get ready(){return ready;},dispose(){disposed=true;loadId++;release();island?.hide();art?.dispose();listeners.forEach(fn=>fn());}};
 }
 return {mount};
});
