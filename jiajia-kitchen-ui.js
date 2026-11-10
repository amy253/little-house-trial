(function (root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./jiajia-kitchen.js') : root.JiajiaKitchen;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JiajiaKitchenUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (K) {
  'use strict';
  const SAVE_KEY = 'jiajia-kitchen-save';
  function createController(options) {
    const o = options || {}; let saved = null, failed = false;
    try { const raw = o.storage && o.storage.getItem(SAVE_KEY); if (raw) saved = JSON.parse(raw); } catch (_) { failed = true; }
    const controller = { game: K.create(saved, o.random), storageUnavailable: failed };
    function persist() {
      try { if (o.storage) o.storage.setItem(SAVE_KEY, JSON.stringify(K.getSave(controller.game))); }
      catch (_) { controller.storageUnavailable = true; }
    }
    function notify(result) { if (typeof o.render === 'function') o.render(controller.game, result); return result; }
    controller.dispatch = function (action, value) {
      const g = controller.game; let result;
      if (action === 'restart') { controller.game = K.create(K.getSave(g), g.random); result = K.start(controller.game); }
      else if (action === 'pause') { if (g.status === 'playing') { g.paused = !g.paused; result = { kind: g.paused ? 'paused' : 'resume' }; } }
      else if (action === 'recipe') {
        const recipe = K.recipes[value], station = recipe && g.stations[recipe.station];
        // A finished dish keeps the same tap target as the dish that started it.
        result = recipe && recipe.day <= g.day && (station.status === 'burnt' || (station.status === 'ready' && station.recipe === value))
          ? K.pickup(g, recipe.station) : K.cook(g, value);
      }
      else if (['start', 'cook', 'pickup', 'serve', 'discard', 'feed', 'buy'].includes(action)) result = K[action](g, value);
      if (result && result.kind === 'buy') persist();
      return notify(result);
    };
    controller.frame = function (seconds) { const before = controller.game.status; K.step(controller.game, seconds); if (before === 'playing' && controller.game.status === 'complete') persist(); notify(); };
    controller.background = function () { if (controller.game.status === 'playing') { controller.game.paused = true; notify({ kind: 'paused' }); } };
    return controller;
  }
  return { SAVE_KEY, createController };
});

if(typeof window==='object'){
(function(root,factory){const K=typeof module==='object'&&module.exports?require('./jiajia-kitchen.js'):root.JiajiaKitchen,api=factory(K);if(typeof module==='object'&&module.exports)module.exports=api;else root.KitchenWalk=api;})(globalThis,function(K){
 'use strict';
 const tableAreas=[{x:530,y:205,w:210,h:89},{x:775,y:300,w:200,h:100},{x:520,y:365,w:218,h:103}];
 const points=[{id:'grill',x:245,y:350,reach:48,name:'煎烤台'},{id:'pot',x:248,y:278,reach:43,name:'暖汤锅'},{id:'pass',x:370,y:330,reach:52,left:285,right:440,name:'出餐口'},{id:'sink',x:168,y:472,reach:52,name:'洗碗池'},...[[500,277],[750,418],[500,440]].map(([x,y],i)=>({id:'table'+i,x,y,reach:52,name:(i+1)+'号桌',slot:i,area:tableAreas[i]}))];
 const obstacles=[{x:0,y:90,w:265,h:170},{x:0,y:238,w:223,h:185},{x:0,y:365,w:145,h:197},{x:267,y:145,w:160,h:158},...tableAreas];
 function blocked(x,y){return x<158||x>980||y<212||y>535||obstacles.some(r=>x>r.x-8&&x<r.x+r.w+8&&y>r.y-8&&y<r.y+r.h+8);}
 function create(game){game.walkingMode=true;game.tables=Array.from({length:3},()=>({dirty:false}));return{game,player:{x:350,y:410},work:null,walking:false,direction:1,walkTime:0,recipes:{grill:'fish',pot:'soup'},last:''};}
 function start(w){w.game.tables.forEach(t=>t.dirty=false);w.player={x:350,y:410};w.work=null;w.walking=false;return K.start(w.game);}
 function distance(p,player){const a=p.area,x=a?Math.max(a.x,Math.min(a.x+a.w,player.x)):p.left!==undefined?Math.max(p.left,Math.min(p.right,player.x)):p.x,y=a?Math.max(a.y,Math.min(a.y+a.h,player.y)):p.y;return Math.hypot(x-player.x,y-player.y);}
 function nearest(w){const g=w.game,candidates=points.map(p=>({...p,distance:distance(p,w.player)})).filter(p=>p.distance<=p.reach).sort((a,b)=>a.distance-b.distance);if(g.held?.recipe){const match=candidates.find(p=>p.slot!==undefined&&g.customers.some(c=>c.slot===p.slot&&c.status==='waiting'&&c.recipe===g.held.recipe));if(match)return match;}if(!g.held){const dirty=candidates.find(p=>p.slot!==undefined&&g.tables[p.slot].dirty);if(dirty)return dirty;}return candidates[0]||null;}
 function context(w){const g=w.game,p=nearest(w);if(!p)return{label:'走近灶台或餐桌',enabled:false};if(w.work)return{...p,label:w.work.type==='wash'?'洗碗中…':'收盘中…',enabled:false,progress:w.work.elapsed/w.work.duration};
  if(p.id==='grill'||p.id==='pot'){const s=g.stations[p.id],recipe=w.recipes[p.id];if(g.held?.dirty)return{...p,label:'先把餐盘送洗',enabled:false};if(s.status==='burnt')return{...p,key:'burn',value:p.id,label:'清理糊锅',enabled:true};if(s.status==='ready')return{...p,key:'pickup',value:p.id,label:g.held?'托盘已满，先上菜':'取餐',detail:K.recipes[s.recipe].name,enabled:!g.held};if(s.status==='cooking')return{...p,label:'制作中…',enabled:false,progress:s.progress/s.duration};return{...p,key:'cook',value:recipe,label:'开始做菜',detail:K.recipes[recipe].name,enabled:true};}
  if(p.id==='pass'){if(g.held)return{...p,label:g.held.dirty?'先把餐盘送洗':'托盘已满，先上菜',enabled:false};const ready=Object.keys(g.stations).find(k=>g.stations[k].status==='ready');if(ready)return{...p,key:'pickup',value:ready,label:'取餐',detail:K.recipes[g.stations[ready].recipe].name,enabled:true};if(g.stations.bar.status==='burnt')return{...p,key:'burn',value:'bar',label:'清理奶茶台',enabled:true};if(g.day>=3&&g.stations.bar.status==='idle')return{...p,key:'cook',value:'tea',label:'调一杯奶茶',enabled:true};return{...p,label:g.stations.bar.status==='cooking'?'奶茶制作中…':'还没有做好的菜',enabled:false};}
  if(p.id==='sink')return{...p,key:g.held?.dirty?'wash':'discard',label:g.held?.dirty?'洗碗':g.held?'放下这盘菜':'这里可以洗碗',enabled:!!g.held};
  const guest=g.customers.find(c=>c.slot===p.slot);if(g.held?.dirty)return{...p,label:'先把餐盘送洗',enabled:false};if(g.tables[p.slot].dirty)return{...p,key:'clear',label:g.held?'先放下手里的菜':'收拾桌子',enabled:!g.held};if(!guest)return{...p,label:'等小幽灵入座',enabled:false};if(guest.status==='eating')return{...p,label:'小幽灵用餐中',enabled:false};if(guest.status!=='waiting')return{...p,label:'小幽灵要走了',enabled:false};const match=g.held?.recipe===guest.recipe;return{...p,key:'serve',value:guest.id,label:match?'上菜':g.held?'菜品不符':'想吃'+K.recipes[guest.recipe].name,detail:g.held&&!match?'这桌要'+K.recipes[guest.recipe].name+'，你端的是'+K.recipes[g.held.recipe].name:K.recipes[guest.recipe].name,enabled:match};
 }
 function act(w,recipe){const g=w.game;if(g.paused||g.status!=='playing')return{ok:false};if(recipe&&nearest(w)?.id==='grill'&&K.unlocked(g).includes(recipe)&&K.recipes[recipe].station==='grill')w.recipes.grill=recipe;const c=context(w);if(!c.enabled)return{ok:false};if(c.key==='clear'||c.key==='wash'){w.work={type:c.key,point:c,elapsed:0,duration:c.key==='wash'?.9:.7};return{ok:true,kind:'working'};}const result=c.key==='burn'?K.pickup(g,c.value):K[c.key](g,c.value);return{ok:true,...result};}
 function step(w,seconds,input={x:0,y:0}){const g=w.game;if(g.paused||g.status!=='playing'||!Number.isFinite(seconds)||seconds<=0){w.walking=false;return;}let left=Math.min(10,seconds);const len=Math.hypot(input.x||0,input.y||0),scale=Math.max(1,len),vx=(input.x||0)/scale,vy=(input.y||0)/scale;w.walking=len>.02;if(w.walking)w.direction=vy<-.25?-1:1;
  while(left>1e-8&&g.status==='playing'){const dt=Math.min(1/60,left);left-=dt;if(w.walking){const x=w.player.x+vx*145*dt,y=w.player.y+vy*145*dt;if(!blocked(x,w.player.y))w.player.x=x;if(!blocked(w.player.x,y))w.player.y=y;w.walkTime+=dt;}
   if(w.work){const a=w.work,p=a.point;if(distance(p,w.player)>p.reach)w.work=null;else if((a.elapsed+=dt)>=a.duration){if(a.type==='clear'&&!g.held&&g.tables[p.slot].dirty){g.tables[p.slot].dirty=false;g.held={dirty:true};w.last='脏餐盘拿好了，送去洗碗池';}else if(a.type==='wash'&&g.held?.dirty){g.held=null;w.last='餐盘洗干净了';}w.work=null;}}
   K.step(g,dt);
  }
 }
 function localPoint(x,y,r,width,height,rotated){x-=r.left;y-=r.top;return rotated?{x:y,y:height-x}:{x,y};}
 return{points,obstacles,blocked,create,start,context,nearest,act,step,localPoint};
});

}
(function(){
 'use strict';if(typeof window!=='object'||!document.querySelector('.walk-shell'))return;
 const K=window.JiajiaKitchen,W=window.KitchenWalk,$=id=>document.getElementById(id),root=$('walk-root'),canvas=$('walk-canvas'),ctx=canvas.getContext('2d'),modal=$('walk-modal');
 let storage;try{storage=localStorage;}catch{}const controller=window.JiajiaKitchenUI.createController({storage}),g=controller.game,w=W.create(g),island=window.IslandRevive.create({id:'jiajia-kitchen'});
 window.jiajiaKitchen={game:g,world:w};let assets=false,regions=[],last=0,width=0,height=0,rotated=false,stick=null,input={x:0,y:0},lastToast='',toastUntil=0,ended=false,modalMode='start',round=0;
 const bg=new Image(),atlas=new Image(),food={fish:8,soup:9,toast:10,tea:11},tables=[{gx:557,gy:272,fx:630,fy:236},{gx:878,gy:363,fx:870,fy:334},{gx:557,gy:443,fx:620,fy:405}];
 const fmt=n=>Math.round(n),save=()=>{try{storage?.setItem('jiajia-kitchen-save',JSON.stringify(K.getSave(g)));}catch{toast('浏览器未允许存档，本次仍可玩');}};
 function toast(text){if(text){lastToast=text;toastUntil=performance.now()+3500;}}
 function stop(){input={x:0,y:0};stick=null;w.walking=false;}
 function open(title,copy,buttons,mode){island.hide();stop();g.paused=true;modalMode=mode;modal.hidden=false;$('walk-title').textContent=title;$('walk-copy').textContent=copy;const host=$('walk-buttons');host.replaceChildren();for(const [label,fn,primary]of buttons){const b=document.createElement('button');b.textContent=label;b.className=primary?'primary':'';b.onclick=fn;host.appendChild(b);}root.querySelector('.walk-play-ui').inert=true;$('walk-shop').hidden=!['start','end'].includes(mode);shop();host.querySelector('button')?.focus({preventScroll:true});}
 function close(){island.hide();modal.hidden=true;root.querySelector('.walk-play-ui').inert=false;g.paused=false;last=0;}
 function start(){island.reset();round++;ended=false;W.start(w);close();toast('先走近左侧煎烤台，再点“开始做菜”');}
 function restart(){g.status='idle';start();}
 function pause(){if(g.status!=='playing'||!modal.hidden)return;open('先歇一会儿','走路、做菜和客人的耐心都已暂停。',[['继续营业',close,true],['重做今天',restart]],'pause');}
 function help(){if(!modal.hidden)return;open('走到身边，再动手','按住空白处拖动走路，松手就停。\n走近灶台点做菜；菜熟后原地或出餐口点取餐。\n走近同款订单的小幽灵点上菜。\n客人走后收盘，再送到左下洗碗池。',[['知道了，继续',close,true]],'help');}
 function shop(){for(const type of ['cooker','patience']){const b=$('buy-'+type),lv=g.save[type],price=K.prices[lv];b.textContent=(type==='cooker'?'升级灶台':'升级座椅')+' · '+(lv>=3?'已满级':price+'金币');b.disabled=g.status==='playing'||lv>=3||g.save.coins<price;b.onclick=()=>{const r=K.buy(g,type);if(r.kind==='buy'){save();shop();}};}}
 function finish(){if(ended||g.status!=='complete')return;ended=true;save();const success=g.summary.success;open(success?'今天的小食堂打烊啦':'今天差一点完成',`已上菜 ${g.served}/${g.target} 位 · 收入 ${g.earned} 金币\n${success?'明天会有新的小幽灵来吃饭。':'去比邻岛找家家说话，可以保留进度继续营业。'}`,[[success?'开始下一天':'重做今天',success?start:restart,true]],'end');if(!success){const identity=round;island.offer($('walk-revive'),()=>{if(identity!==round||!K.revive(g))return false;ended=false;w.work=null;close();return true;},()=>identity===round&&g.status==='complete'&&!g.summary?.success);}}
 function resize(){rotated=innerHeight>innerWidth;width=rotated?innerHeight:innerWidth;height=rotated?innerWidth:innerHeight;root.style.setProperty('--stage-w',width+'px');root.style.setProperty('--stage-h',height+'px');root.classList.toggle('rotated',rotated);root.dataset.rotated=rotated;const d=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);stop();}
 function point(e){return W.localPoint(e.clientX,e.clientY,root.getBoundingClientRect(),width,height,rotated);}
 // Suppress browser double-tap zoom, including labels and modal surfaces.
 let touchTap=null,previousTap=null;
 root.addEventListener('dblclick',e=>e.preventDefault());
 root.addEventListener('touchstart',e=>{const t=e.touches[0];touchTap=e.touches.length===1?{x:t.clientX,y:t.clientY,time:performance.now()}:null;},{passive:true});
 root.addEventListener('touchmove',e=>{const t=e.touches[0];if(touchTap&&(!t||Math.hypot(t.clientX-touchTap.x,t.clientY-touchTap.y)>8)){touchTap=null;previousTap=null;}},{passive:true});
 root.addEventListener('touchend',e=>{const t=e.changedTouches[0],now=performance.now();if(touchTap&&t&&!e.touches.length&&now-touchTap.time<300){if(previousTap&&now-previousTap.time<320&&Math.hypot(t.clientX-previousTap.x,t.clientY-previousTap.y)<28)e.preventDefault();previousTap={x:t.clientX,y:t.clientY,time:now};}touchTap=null;},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(!modal.hidden||g.status!=='playing')return;e.preventDefault();const p=point(e);stick={id:e.pointerId,x:p.x,y:p.y,dx:0,dy:0};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!stick||stick.id!==e.pointerId)return;const p=point(e),dx=p.x-stick.x,dy=p.y-stick.y,len=Math.hypot(dx,dy),scale=Math.min(1,46/Math.max(1,len));stick.dx=dx*scale;stick.dy=dy*scale;const strength=Math.min(1,Math.max(0,len-9)/37);input=len>9?{x:dx/len*strength,y:dy/len*strength}:{x:0,y:0};});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(stick?.id===e.pointerId)stop();});
 function roundRect(x,y,b,h,r=10){ctx.beginPath();ctx.roundRect(x,y,b,h,r);}
 function pill(text,x,y,color='#fff7e7',ink='#623b23',size=12){ctx.font='600 '+size+'px system-ui,sans-serif';const b=ctx.measureText(text).width+20;roundRect(x-b/2,y,b,24,10);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#9e6d49';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=ink;ctx.textAlign='center';ctx.fillText(text,x,y+16);}
 function sprite(id,x,y,h,alpha=1){const s=regions[id];if(!s)return;const b=h*s.w/s.h;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(atlas,s.x,s.y,s.w,s.h,x-b/2,y-h,b,h);ctx.restore();}
 function dirty(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#fff5df';ctx.strokeStyle='#967354';ctx.lineWidth=1.5;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(i*14,-i*4,26,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.strokeStyle='#d89359';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-2,12,.4,2.5);ctx.stroke();ctx.restore();}
 function draw(now){const d=Math.min(2,devicePixelRatio||1);ctx.setTransform(d*width/1000,0,0,d*height/562,0,0);ctx.clearRect(0,0,1000,562);if(!assets)return;ctx.drawImage(bg,0,0,1000,562);
  for(const [id,x,y]of [['grill',125,225],['pot',186,100],['pass',362,169],['sink',96,351]])pill(W.points.find(p=>p.id===id).name,x,y,'#fff5df','#633e27',12);
  const ready=Object.values(g.stations).filter(s=>s.status==='ready');if(ready.length&&!g.held){ctx.save();ctx.fillStyle='#d9eeb797';ctx.strokeStyle='#577536';ctx.lineWidth=2;roundRect(278,315,168,28,12);ctx.fill();ctx.stroke();ctx.restore();pill('出餐口 · 在这里取餐',362,291,'#f0f8d7','#3c5e2e',12);ready.forEach((s,i)=>sprite(food[s.recipe],320+i*38,230,37));}
  for(const [id,x,y]of [['grill',150,280],['pot',195,155],['bar',350,220]]){const s=g.stations[id];if(s.status==='cooking'){pill('制作中 '+Math.min(99,Math.floor(s.progress/s.duration*100))+'%',x,y,'#fff3d2');}else if(s.status==='ready'){pill('做好了 · 可取餐',x,y-20,'#e9f4c8');}else if(s.status==='burnt')pill('糊锅了',x,y,'#ffe0c3');}
  for(const c of g.customers)if(c.status==='waiting'&&g.held?.recipe===c.recipe){const a=W.points.find(p=>p.slot===c.slot).area;ctx.save();ctx.strokeStyle='#567c35';ctx.lineWidth=3;roundRect(a.x-10,a.y-9,a.w+20,a.h+18,17);ctx.stroke();pill((c.slot+1)+'号桌 · 可上菜',a.x+a.w/2,a.y+a.h+12,'#edf6cf','#3d612b',12);ctx.restore();}
  const actors=[];for(const c of g.customers){const t=tables[c.slot],ghost=12+((g.day+c.id-2)%6+6)%6,alpha=c.status==='leaving'?Math.max(0,1-c.age/1.1):1;actors.push({y:t.gy,draw:()=>{sprite(ghost,t.gx,t.gy+Math.sin(now/600+c.id)*2,114,alpha);if(c.status==='waiting'){roundRect(t.gx+22,t.gy-139,90,62,13);ctx.fillStyle='#fffcf4';ctx.strokeStyle='#91613c';ctx.lineWidth=1.5;ctx.fill();ctx.stroke();sprite(food[c.recipe],t.gx+66,t.gy-103,35);ctx.fillStyle='#563b2b';ctx.font='600 10px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(K.recipes[c.recipe].name,t.gx+66,t.gy-89);ctx.fillStyle='#e2d6bd';ctx.fillRect(t.gx+32,t.gy-85,70,3);ctx.fillStyle=c.patience/c.maxPatience<.3?'#cb6851':'#79a261';ctx.fillRect(t.gx+32,t.gy-85,70*c.patience/c.maxPatience,3);}else if(c.status==='eating')sprite(food[c.recipe],t.fx,t.fy,42);}});}
  for(let i=0;i<3;i++)if(g.tables[i].dirty){const t=tables[i];dirty(t.fx,t.fy-9);pill('待收盘',t.fx,t.fy+10,'#fff0d5','#7d4e2c',11);}
  actors.push({y:w.player.y,draw:()=>{const held=g.held,pose=held?(w.direction<0?5:4):w.direction<0?3:w.walking?(Math.floor(w.walkTime*8)%2?1:2):0,bob=w.walking?Math.sin(w.walkTime*16)*1.8:0;ctx.save();ctx.fillStyle='#805d3a25';ctx.beginPath();ctx.ellipse(w.player.x,w.player.y,26,8,0,0,Math.PI*2);ctx.fill();ctx.restore();sprite(pose,w.player.x,w.player.y+bob,150);if(held?.dirty)dirty(w.player.x,w.player.y-47,.7);else if(held)sprite(food[held.recipe],w.player.x,w.player.y-44,29);}});actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
  if(stick){ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=2;ctx.strokeStyle='#fff7dccc';ctx.fillStyle='#fff9e931';ctx.beginPath();ctx.arc(stick.x,stick.y,46,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(stick.x+stick.dx,stick.y+stick.dy,16,0,Math.PI*2);ctx.fillStyle='#fff9e9a0';ctx.fill();ctx.stroke();}
 }
 let oldContext='',oldRecipes='';function hud(now){$('walk-day').textContent='第'+g.day+'天 · 上菜'+g.served+'/'+g.target;$('walk-coins').textContent=g.save.coins+Math.max(0,g.earned-(g.settledEarned||0));const c=W.context(w),signature=[c.id,c.label,c.detail,c.enabled,g.paused,g.status].join('|');if(signature!==oldContext){oldContext=signature;$('walk-action').textContent=c.label;$('walk-action').disabled=!c.enabled||g.paused||g.status!=='playing';$('walk-context').textContent=c.id?c.name+(c.detail?' · '+c.detail:''):'走近后，点按钮做事';}
  $('walk-meter').style.width=(c.progress?Math.min(100,c.progress*100):0)+'%';$('walk-carry').textContent='托盘：'+(g.held?.dirty?'脏餐盘':g.held?K.recipes[g.held.recipe].name:'空');$('walk-toast').textContent=now<toastUntil?lastToast:w.last||'做菜 → 出餐口取餐 → 上菜 → 收盘洗碗';
  const choices=c.id==='grill'&&g.stations.grill.status==='idle'?K.unlocked(g).filter(r=>K.recipes[r].station==='grill'):[],key=choices.join(',')+w.recipes.grill;if(key!==oldRecipes){oldRecipes=key;$('walk-recipes').replaceChildren();if(choices.length>1)for(const r of choices){const b=document.createElement('button');b.textContent=K.recipes[r].name;b.className=r===w.recipes.grill?'selected':'';b.onclick=()=>{w.recipes.grill=r;oldRecipes='';};$('walk-recipes').appendChild(b);}}
  root.dataset.playerX=w.player.x.toFixed(1);root.dataset.playerY=w.player.y.toFixed(1);root.dataset.near=c.id||'';root.dataset.held=g.held?.dirty?'dirty':g.held?.recipe||'';
 }
 $('walk-action').onclick=()=>{const r=W.act(w);oldContext='';if(r.kind==='cook')toast('做好后点“取餐”，灶台旁或出餐口都能拿');if(r.kind==='pickup')toast('端好了，去绿色提示的桌边点“上菜”');if(r.kind==='serve')toast('上菜成功 +'+r.paid+'金币');};$('walk-pause').onclick=pause;$('walk-help').onclick=help;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',()=>{stop();save();});window.addEventListener('resize',resize);document.addEventListener('keydown',e=>{if(e.key==='Escape')pause();});
 function atlasRegions(){const c=document.createElement('canvas');c.width=atlas.width;c.height=atlas.height;const a=c.getContext('2d');a.drawImage(atlas,0,0);const rows=[0,490,730,atlas.height],cell=atlas.width/6;for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=Math.round(col*cell),y=rows[row],cw=Math.round(cell),ch=rows[row+1]-y,data=a.getImageData(x,y,cw,ch).data;let x0=cw,y0=ch,x1=0,y1=0;for(let yy=0;yy<ch;yy++)for(let xx=0;xx<cw;xx++)if(data[(yy*cw+xx)*4+3]>45){x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);}regions.push({x:x+x0,y:y+y0,w:x1-x0+1,h:y1-y0+1});}}
 function load(image,src){return new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=src;});}
 resize();open('家家小食堂','拖动空白处控制家家走路。\n走近后点动作按钮，做菜、上菜、收盘和洗碗。',[['正在准备场景…',()=>{},true]],'loading');$('walk-buttons').querySelector('button')?.setAttribute('disabled','');
 Promise.all([load(bg,'home-covers/play-jiajia-kitchen.jpg?v=20261105-walk'),load(atlas,'jiajia-kitchen-chef.png?v=20261105-ghosts')]).then(()=>{atlasRegions();assets=true;root.dataset.assets='ready';open('小幽灵们来吃饭啦',`第 ${g.day} 天 · 目标给 ${g.target} 位客人上菜\n走近后再点右下角动作；空白处按住拖动走路。`,[['开始营业',start,true]],'start');}).catch(()=>open('场景没加载完整','请检查网络，重新加载后再开门。',[['重新加载',()=>location.reload(),true]],'loading'));
 function frame(now){const dt=last?Math.min(.06,(now-last)/1000):0;last=now;if(assets&&modal.hidden){const before=g.status;W.step(w,dt,input);if(before==='playing'&&g.status==='complete')finish();}draw(now);hud(now);requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
