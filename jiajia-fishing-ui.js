(function () {
  'use strict';
  const F = window.JiajiaFishing;
  const Scene = window.JiajiaFishingScene;
  const $ = id => document.getElementById(id);
  const canvas = $('fishing'), ctx = canvas.getContext('2d');
  const action = $('action'), panel = $('panel');
  const island=window.IslandRevive?.create({id:'jiajia-fishing'});let offeredResult=null;
  const SAVE_KEY = 'little-house-fishing-v1';
  let stored = null, parsed = null;
  try {
    stored = localStorage.getItem(SAVE_KEY);
    if (stored !== null) parsed = JSON.parse(stored);
  } catch (_) { $('save-note').textContent = '存档暂时无法读取，先从湖边重新开始吧。'; stored = null; }
  const saved = F.readSave(parsed);
  function needsRepair(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return true;
    if (![1,2].includes(value.version) || ['coins', 'rodLevel', 'totalCaught', 'tutorialDone'].some(key => value[key] !== saved[key])) return true;
    const entries = value.collection;
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return true;
    if (Object.keys(entries).some(id => !Object.hasOwn(saved.collection, id))) return true;
    if (F.FISH.some((f,index) => !entries[f.id] ? index<6 : entries[f.id].count !== saved.collection[f.id].count || entries[f.id].bestWeight !== saved.collection[f.id].bestWeight)) return true;
    if(value.version===2) {
      if(value.selectedBait!==saved.selectedBait)return true;
      for(const key of ['inventory','pet','equipment','baits','owned','decorations']) {
        const section=value[key];
        if(!section||typeof section!=='object'||Array.isArray(section)||Object.keys(section).some(id=>!Object.hasOwn(saved[key],id))||Object.keys(saved[key]).some(id=>key==='inventory'&&F.FISH.slice(6).some(f=>f.id===id)&&!Object.hasOwn(section,id)?false:section[id]!==saved[key][id]))return true;
      }
      if(['selectedSpot','released'].some(key=>Object.hasOwn(value,key)&&value[key]!==saved[key]))return true;
    }
    return false;
  }
  if (stored !== null && needsRepair(parsed)) $('save-note').textContent = '存档数据有异常，已恢复可用部分，其余从头开始。';
  else if(stored!==null&&parsed.version===1)$('save-note').textContent='旧金币和图鉴已保留。下一条鱼可以选择喂卟哩！';
  const game = F.create(saved);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = new Image(), buli = new Image(), buliLife = new Image();
  hero.src = 'fishing-jiajia-poses.png';
  buli.src = 'fishing-buli-poses.png';
  buliLife.src = 'fishing-buli-poses.png';
  let previousPhase = 'ready', visualTime = 0, resultAt = 0, lastFrame = null;
  let pointerId = null, pointerHeld = false, keyHeld = false, openKind = null, returnFocus = null;
  let shopCategory='gear', effectTime=0, ambientTime=0, snack=null, toastUntil=0;
  function bondRoadmap(status){return '<h3 class="bond-heading">成长足迹</h3><ol class="bond-roadmap">'+status.milestones.map(m=>'<li class="'+(m.unlocked?'unlocked':'locked')+'"><b>'+m.threshold+' 亲密</b><span>'+m.description+'<small>'+(m.unlocked?'已达成':'晋级赠送')+' · '+m.gift+' 金币</small></span></li>').join('')+'</ol>';}
  const baitNames={basic:'普通饵',shrimp:'鲜虾饵',glow:'星光饵'};
  const habits={dart:'爱突然变向，留意力度',wiggle:'喜欢左右扭动',dive:'会往深处钻，记得收线',leap:'会跃出水面，别一直硬拉',surge:'会一阵阵冲刺，收放有节奏'};
  function releaseMessage(result){return '小鱼游回湖里啦 · 金币 +'+result.coins+(result.gift?' · 放生礼物 +'+result.gift:'');}

  function notify(message) { $('feedback-toast').textContent=message;$('feedback-toast').hidden=false;toastUntil=effectTime+3.8; }
  function foodReaction(result) {
    snack={fishId:result.fishId,at:effectTime};
    ambientTime=0;
    notify('卟哩：啊呜，好吃！亲密度 +'+result.affection+(result.gift?' · 成长礼物 +'+result.gift+' 金币':'')+' · 接下来 3 竿帮你留意浮漂');
  }
  function decide(choice) {
    if(choice==='feed'&&snack&&effectTime-snack.at<4.2)return;
    if(!F.chooseCatch(game,choice))return;
    if(choice==='feed')foodReaction(game.result.feedback);
    else notify(choice==='release'?releaseMessage(game.result.feedback):choice==='sell'?'小鱼卖掉啦，金币 +'+game.result.price:'已经放进鱼篓，随时可以喂卟哩。');
    persist();sync();
  }
  for(const choice of ['sell','feed','keep','release'])$('catch-'+choice).addEventListener('click',()=>decide(choice));

  function persist() {
    try { localStorage.setItem(SAVE_KEY, F.writeSave(game.save)); }
    catch (_) { $('save-note').textContent = '本次可以继续玩，但浏览器暂时不能保存进度。'; }
  }

  function held() { F.setHeld(game, pointerHeld || keyHeld); }
  function release() { pointerHeld = false; keyHeld = false; pointerId = null; held(); }
  function active() { return ['waiting', 'bite', 'reeling'].includes(game.phase); }
  function pause() { release(); F.setPaused(game, true); sync(); }
  function resume() { F.setPaused(game, false); lastFrame = null; sync(); action.focus(); }

  function mainAction() {
    if (game.paused || !panel.hidden) return;
    if (game.phase === 'ready') { if(F.cast(game)){island?.reset();offeredResult=null;persist();} }
    else if (game.phase === 'bite') F.hook(game);
    else if (game.phase === 'caught' || game.phase === 'escaped') {
      if(game.phase==='caught'&&!game.result.disposition){F.chooseCatch(game,'keep');persist();}
      island?.hide();offeredResult=null;F.dismiss(game);
    }
    sync();
  }

  action.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointerId !== null || action.disabled) return;
    event.preventDefault();
    pointerId = event.pointerId;
    action.setPointerCapture(event.pointerId);
    if (game.phase === 'reeling') { pointerHeld = true; held(); }
    else mainAction();
  });
  function endPointer(event) {
    if (event.pointerId !== pointerId) return;
    pointerHeld = false; pointerId = null; held();
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  action.addEventListener('lostpointercapture', endPointer);
  action.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId || !pointerHeld) return;
    const rect = action.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      pointerHeld = false; held();
    }
  });
  action.addEventListener('click', event => {
    // Assistive activation has no pointerdown; physical clicks were handled above.
    if (event.detail === 0) mainAction();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { closePanel(); return; }
    if (!panel.hidden) {
      if (event.key === 'Tab') {
        const buttons = Array.from(panel.querySelectorAll('button:not(:disabled)'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.code !== 'Space' || (event.target.closest('button,a') && event.target !== action)) return;
    event.preventDefault();
    if (game.paused) return;
    if (game.phase === 'reeling') { keyHeld = true; held(); }
    else if (!event.repeat) mainAction();
  });
  document.addEventListener('keyup', event => {
    if (event.code === 'Space') { keyHeld = false; held(); }
  });
  window.addEventListener('blur', () => { release(); if (active()) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { release(); if (active()) pause(); } });
  $('pause').addEventListener('click', () => game.paused ? resume() : pause());
  $('resume').addEventListener('click', resume);

  function openPanel(kind) {
    island?.hide();offeredResult=null;
    returnFocus = document.activeElement;
    openKind = kind;
    release();
    F.setPaused(game, true);
    panel.hidden = false;
    renderPanel(); sync();
    $('panel-close').focus();
  }
  function closePanel() {
    panel.hidden = true;
    openKind = null;
    if (!active()) F.setPaused(game, false);
    sync();
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }
  $('catalog-button').addEventListener('click', () => openPanel('catalog'));
  $('upgrade-button').addEventListener('click', () => openPanel('upgrade'));
  $('bag-button').addEventListener('click',()=>openPanel('bag'));
  $('pet-button').addEventListener('click',()=>openPanel('pet'));
  $('spot-button').addEventListener('click',()=>openPanel('spots'));
  $('journey-button').addEventListener('click',()=>openPanel('journey'));
  $('panel-close').addEventListener('click', closePanel);
  panel.addEventListener('click', event => { if (event.target === panel) closePanel(); });

  function renderPanel() {
    const content = $('panel-content');
    if (openKind === 'catalog') {
      $('panel-title').textContent = '湖里的小朋友';
      content.innerHTML = '<p class="panel-intro">每一次遇见，都留下一个小小记录。还没钓到的鱼，会随着捕获数量解锁。</p><div class="fish-catalog"></div>';
      const grid = content.querySelector('.fish-catalog');
      for (const fish of F.FISH) {
        const entry = game.save.collection[fish.id], known = entry.count > 0;
        const item = document.createElement('article');
        item.className = 'fish-entry' + (known ? '' : ' unknown');
        item.innerHTML = '<canvas width="160" height="76" aria-hidden="true"></canvas><h3>' + (known ? fish.name : '还没遇见') + '</h3><small>' + fish.rarity + '</small><p>' + (known ? '已钓 ' + entry.count + ' 条 · 最大 ' + entry.bestWeight.toFixed(2) + ' kg' : fish.unlock > game.save.totalCaught ? '累计钓 ' + fish.unlock + ' 条后出没' : '已在湖里，等你发现') + '</p><p>'+(known?(habits[fish.pattern]||'收放平稳，适合慢慢练习'):'')+'</p>';
        grid.appendChild(item);
        drawFish(item.querySelector('canvas').getContext('2d'), fish, 80, 39, 29, 0, !known);
      }
    } else if(openKind==='journey') renderJourney(content);
    else if(openKind==='spots') renderSpots(content);
    else if(openKind==='bag'||openKind==='pet') renderFishBag(content,openKind==='pet');
    else renderShop(content);
  }

  function renderJourney(content){
    const status=F.journeyStatus(game.save),notes=game.save.journey.bottles;
    $('panel-title').textContent='小心愿与瓶中信';
    content.innerHTML='<article class="wish-detail"><span>第 '+(status.chapter+1)+' 个小心愿 · 不限时间</span><h3>'+status.title+'</h3><p>'+status.description+'</p><strong>'+status.progress+' / '+status.target+'</strong><p>完成赠 '+status.coins+' 金币 + 1 份特别鱼饵</p><button id="claim-wish" type="button">'+(active()?'钓完这一竿再领奖':status.ready?'领取心愿礼物':'小心愿还在进行')+'</button></article><h3 class="bottle-heading">瓶中信 · '+notes.length+' / '+F.BOTTLE_NOTES.length+'</h3><p class="panel-intro">每新钓上 4 条鱼，就会顺带捞到一个漂流瓶，还有金币与鲜虾饵。还有 '+status.nextBottle+' 条，就到下一份惊喜。</p><div class="bottle-notes">'+F.BOTTLE_NOTES.map((n,i)=>'<article class="'+(notes.includes(i)?'found':'unfound')+'"><span>'+(notes.includes(i)?'✉':'◌')+'</span><h4>'+(notes.includes(i)?n.title:'还在湖上漂流')+'</h4><p>'+(notes.includes(i)?n.text:'下一次起鱼，也许就遇见它。')+'</p></article>').join('')+'</div>';
    $('claim-wish').disabled=active()||!status.ready;
    $('claim-wish').addEventListener('click',()=>{const reward=F.claimWish(game);if(!reward)return;persist();renderPanel();sync();notify('小心愿完成！金币 +'+reward.coins+' · '+baitNames[reward.bait]+' +1');$('panel-close').focus();});
  }

  function renderSpots(content){
    $('panel-title').textContent='换个地方，遇见新鱼';
    content.innerHTML='<p class="panel-intro">每处钓点都有常来的小鱼。累计钓 3 条解锁芦苇湾，7 条解锁深水湖心。换地方不会增加收线难度。</p><div id="spot-list" class="spot-list"></div>';
    for(const spot of F.SPOTS){
      const locked=game.save.totalCaught<spot.unlock,selected=game.save.selectedSpot===spot.id;
      const row=document.createElement('article');row.className='spot-card '+spot.id;
      row.innerHTML='<span class="spot-icon">'+({shallow:'☀',reeds:'♧',deep:'☾'}[spot.id])+'</span><h3>'+spot.name+'</h3><p>'+spot.description+'</p><small>常见：'+spot.favorites.map(id=>F.FISH.find(f=>f.id===id).name).join('、')+'</small><button id="spot-'+spot.id+'" type="button">'+(active()?'钓完这一竿再换':locked?'还需钓 '+(spot.unlock-game.save.totalCaught)+' 条':selected?'正在这里钓鱼':'去这里钓鱼')+'</button>';
      $('spot-list').appendChild(row);const button=$('spot-'+spot.id);button.disabled=active()||locked||selected;
      button.addEventListener('click',()=>{if(F.selectSpot(game,spot.id)){persist();renderPanel();sync();notify('下一竿去'+spot.name);$('panel-close').focus();}});
    }
  }

  function renderFishBag(content,isPet) {
    const status=F.petStatus(game.save);
    $('panel-title').textContent=isPet?'卟哩的小鱼时光':'今天的小鱼篓';
    content.innerHTML=(isPet?'<div class="pet-card"><div><span>亲密 Lv.'+status.level+'</span><h3>'+status.title+'</h3><p>亲密度 '+game.save.pet.affection+' · 已喂 '+game.save.pet.fed+' 条</p><small>'+(status.next?'再攒 '+(status.next-game.save.pet.affection)+' 亲密度，晋级送 '+status.nextGift+' 金币。':'你是卟哩最喜欢的小房子。')+'</small></div></div>':'')+'<div class="pet-theater"><canvas id="pet-scene" width="360" height="145" aria-label="卟哩的湖边日常：走动、跳跃、睡觉，喂鱼后吃小鱼"></canvas></div>'+(isPet?bondRoadmap(status):'')+'<p class="panel-intro">'+(active()?'先钓完这一竿，再慢慢处理鱼篓。':isPet?'普通鱼 +3、稀有鱼 +8、传说鱼 +18 亲密度。小食盆额外 +1。围巾与月光灯解锁后可在商店购买。':'小鱼可以卖掉、喂卟哩或放生，图鉴一直保留。')+'</p><p class="release-note">已放生 '+game.save.released+' 条 · 放生返还 20% 鱼价，累计 5 / 15 / 30 条还送金币。</p><div id="bag-list" class="bag-list"></div>';
    const list=$('bag-list'); let found=false;
    for(const fish of F.FISH) {
      const count=game.save.inventory[fish.id];if(!count)continue;found=true;
      const row=document.createElement('article');row.className='bag-row';
      row.innerHTML='<canvas width="100" height="66" aria-hidden="true"></canvas><div><h3>'+fish.name+' <small>×'+count+'</small></h3><p>'+fish.rarity+' · '+fish.price+' 金币 / 条</p><div class="row-actions"><button id="bag-feed-'+fish.id+'" type="button">喂卟哩</button>'+(!isPet?'<button id="bag-sell-'+fish.id+'" type="button">卖一条</button><button id="bag-release-'+fish.id+'" type="button">放生</button>':'')+'</div></div>';
      list.appendChild(row);drawFish(row.querySelector('canvas').getContext('2d'),fish,54,33,21,0);
      for(const kind of isPet?['feed']:['feed','sell','release']) {
        const button=$('bag-'+kind+'-'+fish.id);button.disabled=active();
        button.addEventListener('click',()=>{
          if(active())return;
          if(kind==='feed'&&snack&&effectTime-snack.at<4.2)return;
          const result=kind==='feed'?F.feedFish(game.save,fish.id):kind==='release'?F.releaseFish(game.save,fish.id):F.sellFish(game.save,fish.id);
          if(!result)return;
          if(kind==='feed')foodReaction(result);else notify(kind==='release'?releaseMessage(result):'卖出 '+fish.name+'，金币 +'+result.coins);
          persist();renderPanel();sync();$('panel-close').focus();
        });
      }
    }
    if(!found)list.innerHTML='<div class="empty-bag"><span>▱</span><h3>鱼篓还是空的</h3><p>下一次钓到小鱼，选择「留在鱼篓」或「喂卟哩」。</p></div>';
  }

  function renderShop(content) {
    $('panel-title').textContent='湖边小商店';
    content.innerHTML='<p class="panel-intro">口袋里有 <b>'+game.save.coins+' 金币</b>。买一点实用装备，或为卟哩添一份小快乐。</p><nav class="shop-tabs" aria-label="商店分类"><button id="shop-gear" type="button">装备</button><button id="shop-bait" type="button">鱼饵</button><button id="shop-decor" type="button">湖边装饰</button></nav><div id="shop-grid" class="shop-grid"></div>';
    for(const category of ['gear','bait','decor']) {
      $('shop-'+category).classList.toggle('selected',category===shopCategory);
      $('shop-'+category).addEventListener('click',()=>{shopCategory=category;renderPanel();$('shop-'+category).focus();});
    }
    const grid=$('shop-grid');
    if(shopCategory==='bait') {
      const basic=document.createElement('article');basic.className='shop-item basic-bait';
      basic.innerHTML='<span class="shop-icon">◌</span><h3>普通饵</h3><p>免费无限 · 普通鱼也会有惊喜。</p><button id="equip-basic" type="button">'+(game.save.selectedBait==='basic'?'正在使用':'使用普通饵')+'</button>';
      grid.appendChild(basic);$('equip-basic').disabled=active()||game.save.selectedBait==='basic';
      $('equip-basic').addEventListener('click',()=>{if(F.selectBait(game,'basic')){persist();renderPanel();sync();$('panel-close').focus();}});
    }
    for(const item of F.SHOP.filter(i=>i.category===shopCategory)) {
      const state=F.shopState(game.save,item.id),row=document.createElement('article');row.className='shop-item';
      let label=active()?'钓完这一竿再买':state.owned?'已经拥有':state.max?'已经满级':state.locked?(item.unlock?'累计钓 '+item.unlock+' 条解锁':'亲密度 '+item.affection+' 解锁'):state.canBuy?state.price+' 金币 · '+(item.category==='gear'?'升级':'购买'):'还差 '+(state.price-game.save.coins)+' 金币';
      row.innerHTML='<span class="shop-icon">'+item.icon+'</span><div class="shop-caption">'+(item.category==='gear'?'当前 '+state.level+' 级':item.category==='bait'?'库存 '+game.save.baits[item.id]+' 份':state.owned?'小小收藏':'湖边心愿')+'</div><h3>'+item.name+'</h3><p>'+item.description+'</p><button id="buy-'+item.id+'" type="button">'+label+'</button>'+(item.category==='bait'?'<button id="equip-'+item.id+'" class="secondary-buy" type="button">'+(game.save.selectedBait===item.id?'正在使用':'使用这款鱼饵')+'</button>':item.category==='decor'&&state.owned?'<button id="decor-'+item.id+'" class="secondary-buy" type="button">'+(game.save.decorations[item.id]?'收起装饰':'摆到湖边')+'</button>':'');
      grid.appendChild(row);
      const buy=$('buy-'+item.id);buy.disabled=active()||!state.canBuy;
      buy.addEventListener('click',()=>{if(!F.purchase(game,item.id))return;persist();renderPanel();sync();notify(item.name+'买好啦！');$('panel-close').focus();});
      if(item.category==='bait') {
        const equip=$('equip-'+item.id);equip.disabled=active()||!game.save.baits[item.id]||game.save.selectedBait===item.id;
        equip.addEventListener('click',()=>{if(F.selectBait(game,item.id)){persist();renderPanel();sync();notify('下一竿使用'+item.name);$('panel-close').focus();}});
      }
      if(item.category==='decor'&&state.owned)$('decor-'+item.id).addEventListener('click',()=>{if(F.toggleDecoration(game,item.id)){persist();renderPanel();sync();$('panel-close').focus();}});
      if(item.category==='decor'&&state.owned)$('decor-'+item.id).disabled=active();
    }
  }

  const labels = { ready: ['⌁', '抛竿', '湖边 · 微风'], waiting: ['⋯', '等鱼儿咬钩', '浮漂在轻轻摇'], bite: ['!', '咬钩了！提竿', '鱼儿咬钩了！'], reeling: ['↟', '按住收线 · 松手放线', '跟鱼儿拉拉手'], caught: ['✓', '继续钓鱼', '今日又一份惊喜'], escaped: ['↻', '再来一竿', '没关系，下次会遇见'] };
  function sync() {
    if (game.phase !== previousPhase) {
      if (game.phase === 'caught') {persist();const treasure=game.result.treasure;if(treasure)notify((treasure.bottle===null?'捞到一瓶湖边补给':'捞到漂流瓶：'+F.BOTTLE_NOTES[treasure.bottle].title)+' · 金币 +'+treasure.coins+' · 鲜虾饵 +1');}
      if (game.phase === 'caught' || game.phase === 'escaped') resultAt = visualTime;
      previousPhase = game.phase;
    }
    const [icon, text, phase] = labels[game.phase];
    const rules = game.rules;
    $('coins').textContent = game.save.coins;
    $('rod-level').textContent = game.save.rodLevel;
    $('total-caught').textContent = game.save.totalCaught;
    const bond=F.petStatus(game.save);
    const wish=F.journeyStatus(game.save);
    $('wish-title').textContent=wish.title;
    $('wish-progress').textContent=wish.ready?'完成啦，去领一份小礼物':wish.description+' '+wish.progress+' / '+wish.target;
    $('wish-meter').style.width=(wish.progress/wish.target*100)+'%';
    $('journey-button').textContent=wish.ready?'领取心愿礼物 ›':'心愿 / 瓶中信 ›';
    $('bottle-summary').textContent='瓶中信 '+game.save.journey.bottles.length+' / '+F.BOTTLE_NOTES.length+' · 再钓 '+wish.nextBottle+' 条遇见漂流瓶';
    if($('claim-wish'))$('claim-wish').disabled=active()||!wish.ready;
    $('bag-count').textContent=Object.values(game.save.inventory).reduce((a,b)=>a+b,0);
    $('pet-title').textContent='卟哩 · '+bond.title;
    $('pet-summary').textContent='亲密 Lv.'+bond.level+' · '+game.save.pet.affection+(bond.next?' / '+bond.next:'')+' · 已喂 '+game.save.pet.fed+' 条小鱼';
    $('pet-progress').style.width=bond.percent+'%';
    $('bond-next').textContent=bond.next?'亲密度 '+bond.next+' · 下一份礼物 '+bond.nextGift+' 金币':'所有成长礼物已领取 · 卟哩最喜欢你';
    const selected=game.save.selectedBait;
    const bait=active()?game.encounterBait:(selected==='basic'||game.save.baits[selected]>0?selected:'basic');
    $('bait-summary').textContent=(active()?'本竿：':'下一竿：')+baitNames[bait]+(bait==='basic'?' · 免费无限':' · 库存 '+game.save.baits[bait]+' 份')+(active()&&game.catAssisted?' · 卟哩帮忙，提竿多 0.3 秒':!active()&&game.save.catHelp?' · 卟哩帮忙剩 '+game.save.catHelp+' 竿':'');
    $('feedback-toast').hidden=effectTime>=toastUntil;
    const eating=snack&&effectTime-snack.at<4.2;
    $('catch-feed').disabled=!!eating;
    for(const fish of F.FISH)if($('bag-feed-'+fish.id))$('bag-feed-'+fish.id).disabled=active()||!!eating;
    $('discovered').textContent = Object.values(game.save.collection).filter(e => e.count > 0).length + ' / '+F.FISH.length;
    $('spot-summary').textContent=F.SPOTS.find(s=>s.id===game.save.selectedSpot).name;
    $('action-icon').textContent = icon;
    $('action-text').textContent = text;
    $('phase-label').textContent = phase + (['waiting', 'reeling'].includes(game.phase) ? ' · ' + rules.name : '');
    action.disabled = game.paused || game.phase === 'waiting' || !panel.hidden;
    action.classList.toggle('bite', game.phase === 'bite');
    action.classList.toggle('held', game.held);
    $('paused-card').hidden = !game.paused || !panel.hidden;
    $('pause').textContent = game.paused ? '▶ 继续' : 'Ⅱ 暂停';
    $('reel-meters').hidden = game.phase !== 'reeling';
    $('fight-habit').textContent=game.fish?game.fish.name+' · '+(habits[game.fish.pattern]||'收放平稳，慢慢找节奏'):'';
    const percent = Math.floor(game.progress);
    $('reel-progress').firstElementChild.style.width = percent + '%';
    $('reel-progress').setAttribute('aria-valuenow', percent);
    $('reel-percent').textContent = percent + '%';
    $('tension-marker').style.left = game.tension + '%';
    $('safe-zone').style.left = rules.low + '%';
    $('safe-zone').style.width = (rules.high - rules.low) + '%';
    $('safe-zone').textContent = rules.high - rules.low >= 24 ? '保持这里' : '✓';
    $('tension-track').style.background = `linear-gradient(90deg,#edc2a5 0 ${rules.dangerLow}%,#ead8af ${rules.dangerLow}% ${rules.low}%,#afd0af ${rules.low}% ${rules.high}%,#ead8af ${rules.high}% ${rules.dangerHigh}%,#e5a598 ${rules.dangerHigh}%)`;
    const tight = game.tension > rules.high, slack = game.tension < rules.low;
    const danger = game.tension < rules.dangerLow || game.tension > rules.dangerHigh;
    $('tension-label').textContent = danger ? (tight ? '太紧了，松手放线！' : '太松了，按住收线！') : tight ? '有点紧，松手一点' : slack ? '有点松，按住一点' : '很好，绿色区收线最快';
    $('tension-label').style.color = tight || slack ? '#c18369' : '#608371';
    let hint = '';
    if (game.phase === 'ready') hint = game.save.tutorialDone ? '绿色收线快，黄色也能慢慢收。别持续拉得太紧或太松。' : '第一步：点击「抛竿」，等浮漂动起来。';
    if (game.phase === 'waiting') hint = '浮漂下沉、水花冒出来时，马上点「提竿」。';
    if (game.phase === 'bite') hint = '咬钩啦！现在点一下按钮，把鱼钩住。';
    if (game.phase === 'reeling') hint = danger ? (tight ? '先松手放线，持续太紧才会断线。进度会保留。' : '先按住收线，持续太松才会逃鱼。进度会保留。') : tight || slack ? '黄色区也能继续收线，只是慢一些。'+(tight?'松手一点更快。':'按住一点更快。') : '绿色区收线最快，稍微偏到黄色也没关系。';
    if (game.phase === 'caught') {
      const decision=game.result.disposition;
      hint=decision==='release'?releaseMessage(game.result.feedback):decision==='sell'?'小鱼卖掉啦，金币 +'+game.result.price+'。去商店挑一点喜欢的用品吧。':decision==='feed'?'卟哩啊呜吃掉啦！亲密度 +'+game.result.feedback.affection+'，一起变成更好的小伙伴。':decision==='keep'?'小鱼已留在鱼篓。之后可以卖掉，或者留给卟哩。':'这条小鱼你来决定：换金币、喂卟哩、留在鱼篓，或者放生。';
    }
    if (game.phase === 'escaped') hint = game.result.reason === 'tight' ? '刚才拉得太紧了。下一竿记得及时松手。' : game.result.reason === 'slack' ? '刚才鱼线太松了。下一竿按住把力度收回来。' : '提竿慢了一点。下次看见水花就点按钮。';
    if (game.paused && panel.hidden) hint = '已暂停，准备好后点「继续钓鱼」。';
    if ($('hint').textContent !== hint) $('hint').textContent = hint;
    const card = $('catch-card');
    if(game.phase==='escaped'&&panel.hidden&&offeredResult!==game.result){const failedResult=game.result;offeredResult=failedResult;island?.offer(card,()=>{if(!panel.hidden||game.result!==failedResult||!F.revive(game))return false;release();lastFrame=null;previousPhase=game.phase;resultAt=visualTime;offeredResult=null;island?.hide();sync();action.focus();return true;},()=>panel.hidden&&game.phase==='escaped'&&game.result===failedResult);}
    else if(game.phase!=='escaped'||!panel.hidden){island?.hide();offeredResult=null;}
    $('catch-choices').hidden=game.phase!=='caught'||!!game.result?.disposition||!game.save.inventory[game.fish?.id];
    $('catch-price').textContent=game.fish?'+'+game.fish.price+' 金币':'';
    card.hidden = !['caught', 'escaped'].includes(game.phase);
    if (!card.hidden) {
      card.classList.toggle('escaped', game.phase === 'escaped');
      $('catch-kicker').textContent = game.phase === 'escaped' ? '下次再见' : game.result.isNew ? '图鉴 · 第一次遇见' : '湖边 · 捕获成功';
      $('catch-title').textContent = game.phase === 'caught' ? game.fish.name : game.result.reason === 'tight' ? '鱼线绷断了' : game.result.reason === 'slack' ? '小鱼溜走了' : '鱼儿游走了';
      $('catch-description').textContent = game.phase === 'caught' ? game.fish.rarity + ' · ' + game.result.weight.toFixed(2) + ' kg · '+(game.result.disposition==='release'?'已经游回湖里':game.result.disposition==='feed'?'卟哩最喜欢的小鱼时光':game.result.disposition==='sell'?'已售出 +'+game.result.price+' 金币':game.result.disposition==='keep'?'已经放入鱼篓':'已记入图鉴，等你决定') : '不扣金币。再试一次，慢慢找到手感。';
      if(game.result.treasure)$('catch-description').textContent+=' · 额外捞到漂流瓶，金币 +'+game.result.treasure.coins;
    }
  }

  function ellipse(c, x, y, rx, ry, color) {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();if(rx>8&&ry>8){c.save();c.strokeStyle='#715745';c.lineWidth=1.3;c.stroke();c.restore();}
  }
  function polygon(c, points, color) {
    c.fillStyle = color; c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (const point of points.slice(1)) c.lineTo(point[0], point[1]);
    c.closePath(); c.fill();c.save();c.strokeStyle='#715745';c.lineWidth=1.4;c.stroke();c.restore();
  }
  function drawFish(c, f, x, y, size, rotation, silhouette = false) {
    c.save(); c.translate(x, y); c.rotate(rotation);
    if(f.shape==='long')c.scale(1.25,.72);
    if(f.shape==='round')c.scale(.87,1.18);
    const color = silhouette ? '#c5cdbf' : f.color, accent = silhouette ? '#c5cdbf' : f.accent;
    polygon(c, [[-size * .7, 0], [-size * 1.5, -size * .65], [-size * 1.4, size * .65]], color);
    polygon(c, [[-size * .45, -size * .3], [-size * .12, -size * .85], [size * .35, -size * .25]], accent);
    ellipse(c, 0, 0, size * 1.12, size * .56, color);
    if (!silhouette) {
      ellipse(c, size * .16, size * .2, size * .68, size * .23, accent);
      if (f.id === 'koi') { ellipse(c, -size * .5, -size * .05, size * .25, size * .36, accent); ellipse(c, size * .36, -size * .21, size * .2, size * .18, accent); }
      if (f.id === 'moon') { ellipse(c, -size * .25, -size * .2, size * .13, size * .13, '#fff4ce'); ellipse(c, -size * .64, 0, size * .08, size * .08, '#fff4ce'); }
      if(f.id==='trout')for(let i=0;i<7;i++)ellipse(c,-size*.65+i*size*.18,-size*.16+(i%2)*size*.18,size*.035,size*.035,'#506c68');
      if(f.id==='perch')for(let i=0;i<4;i++)ellipse(c,-size*.65+i*size*.3,-size*.1,size*.05,size*.34,'#657959');
      if(f.shape==='spiny')for(let i=0;i<5;i++)polygon(c,[[-size*.65+i*size*.2,-size*.35],[-size*.55+i*size*.2,-size*.85],[-size*.45+i*size*.2,-size*.35]],accent);
      if(f.id==='catfish'||f.id==='dragon'){c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.moveTo(size*.9,size*.1);c.quadraticCurveTo(size*1.25,size*.4,size*1.5,size*.2);c.moveTo(size*.9,size*.2);c.quadraticCurveTo(size*1.1,size*.7,size*1.35,size*.6);c.stroke();}
      ellipse(c, size * .65, -size * .12, size * .2, size * .23, '#fffaf0');
      ellipse(c, size * .69, -size * .12, size * .11, size * .14, '#4f655b');
      ellipse(c, size * .72, -size * .17, size * .035, size * .045, '#fff');
      ellipse(c, size * .74, size * .18, size * .1, size * .06, '#dfb19b');
      c.strokeStyle = '#4e6b5a55'; c.lineWidth = Math.max(1, size * .025);
      c.beginPath(); c.arc(size * .52, size * .04, size * .34, -.6, 1.1); c.stroke();
    } else {
      c.fillStyle = '#f4f5ec'; c.font = 'bold ' + size + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 0);
    }
    c.restore();
  }

  function cloud(x, y, scale, color='#fffdf2') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ellipse(ctx, 0, 0, 27, 10, color); ellipse(ctx, -12, -6, 12, 12, color); ellipse(ctx, 9, -10, 16, 15, color); ctx.restore();
  }
  function asset(c, img, frame, x, y, w, h, isCat) {
    if(isCat&&window.GameArt?.draw(c,frame>=4?'catResting':'catStanding',x,y,w,h))return;
    if (img.complete && img.naturalWidth){
      const r=Scene.ATLAS[isCat?'cat':'hero'][frame],cellX=frame%3*512,cellY=Math.floor(frame/3)*512;
      if(isCat){const scale=w/100*.22,dx=x+(w-r.w*scale)/2,dy=y+h-r.h*scale;c.save();if(r.clip){c.beginPath();c.moveTo(dx+(r.clip[0][0]-r.x)*scale,dy+(r.clip[0][1]-r.y)*scale);for(const p of r.clip.slice(1))c.lineTo(dx+(p[0]-r.x)*scale,dy+(p[1]-r.y)*scale);c.closePath();c.clip();}c.drawImage(img,r.x,r.y,r.w,r.h,dx,dy,r.w*scale,r.h*scale);c.restore();return;}
      const dx=sx=>x+(sx-cellX)/512*w,dy=sy=>y+(sy-cellY)/512*h;
      c.save();if(r.clip){c.beginPath();c.moveTo(dx(r.clip[0][0]),dy(r.clip[0][1]));for(const p of r.clip.slice(1))c.lineTo(dx(p[0]),dy(p[1]));c.closePath();c.clip();}
      c.drawImage(img,r.x,r.y,r.w,r.h,dx(r.x),dy(r.y),r.w/512*w,r.h/512*h);c.restore();
    }
    else {
      if(isCat){
        ellipse(c,x+w*.48,y+h*.76,w*.31,h*.2,'#777566');ellipse(c,x+w*.65,y+h*.55,w*.19,h*.19,'#8c8975');
        polygon(c,[[x+w*.5,y+h*.48],[x+w*.51,y+h*.29],[x+w*.62,y+h*.4]],'#676556');polygon(c,[[x+w*.7,y+h*.4],[x+w*.8,y+h*.3],[x+w*.82,y+h*.49]],'#676556');
        c.strokeStyle='#383b34';c.lineWidth=3;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+w*(.28+i*.09),y+h*.63);c.lineTo(x+w*(.32+i*.09),y+h*.8);c.stroke();}
        for(const eye of [.58,.72]){ellipse(c,x+w*eye,y+h*.53,3.2,3.4,'#d1bc53');ellipse(c,x+w*eye,y+h*.53,1.3,2.2,'#242d27');}return;
      }
      ellipse(c, x + w / 2, y + h / 2, w * .37, h * .4, isCat ? '#e7c49e' : '#697b66');
      ellipse(c, x + w / 2, y + h / 2, w * .28, h * .26, '#f4dcc0');
      ellipse(c, x + w * .42, y + h * .48, 3, 4, '#526351'); ellipse(c, x + w * .59, y + h * .48, 3, 4, '#526351');
    }
  }

  function drawMeal(c,pose,age){
    if(game.save.decorations.cushion){ellipse(c,53,391,36,8,'#bd8b81');ellipse(c,53,388,36,7,'#e0b7a4');}
    const dishX=157,dishY=386;
    ellipse(c,dishX,dishY+5,24,5,'#6d817138');
    polygon(c,[[133,dishY-3],[181,dishY-3],[176,dishY+6],[138,dishY+6]],game.save.equipment.bowl?'#e8cfaa':'#efe5d1');
    ellipse(c,dishX,dishY-3,24,5,'#a8a791');
    if(pose.foodVisible&&snack)drawFish(c,F.FISH.find(f=>f.id===snack.fishId),dishX,dishY-8,13*pose.foodScale,Math.PI);
    if(age>=3.2&&age<4.2){c.strokeStyle='#fff8df';c.lineWidth=2;c.beginPath();c.moveTo(148,378);c.lineTo(166,378);for(let i=0;i<3;i++){c.moveTo(152+i*5,373);c.lineTo(152+i*5,383);}c.stroke();}
    // Entire body comes to the bowl; sniff/bite are lowered poses, chewing lifts her head.
    ellipse(c,pose.catX+50,393,32-(299-pose.catY)*.25,4,'#66795d20');
    c.save();if(pose.catFlip){c.translate((pose.catX+50)*2,0);c.scale(-1,1);}
    const canonicalCat=window.GameArt?.draw(c,pose.catActivity==='sleep'?'catResting':pose.catActivity==='walk'?'catStanding':'cat',pose.catX,pose.catY,100,100);
    if(canonicalCat){}else if(pose.catSheet==='life'&&buliLife.complete&&buliLife.naturalWidth){
      const r=Scene.ATLAS.life[pose.catFrame],scale=.22,w=r.w*scale,h=r.h*scale;
      c.drawImage(buliLife,r.x,r.y,r.w,r.h,pose.catX+(100-w)/2,pose.catY+98-h,w,h);
    }else asset(c,buli,pose.catSheet==='life'?0:pose.catFrame,pose.catX,pose.catY,100,100,true);
    if(pose.catSheet==='meal'){
      const r=Scene.ATLAS.cat[pose.catFrame],anchor=p=>({x:pose.catX+(100-r.w*.22)/2+(p[0]-r.x)*.22,y:pose.catY+100-r.h*.22+(p[1]-r.y)*.22});
      if(game.save.decorations.scarf&&r.neck){const n=anchor(r.neck);polygon(c,[[n.x-8,n.y-2],[n.x+8,n.y],[n.x+3,n.y+6]],'#cd8c81');}
      if(r.mouth&&age<3.2&&snack){const m=anchor(r.mouth);ellipse(c,m.x,m.y,2,1.5,'#bba287');}
    }
    c.restore();
    if(pose.catActivity==='sleep'){c.font='11px Georgia';c.fillStyle='#74836b';c.fillText('z z',pose.catX+69,pose.catY+39);}
  }

  function drawPetTheater(pose,age){
    if(panel.hidden||!['bag','pet'].includes(openKind)||!$('pet-scene'))return;
    const c=$('pet-scene').getContext('2d');c.clearRect(0,0,360,145);
    c.fillStyle='#eee7d4';c.fillRect(0,0,360,145);
    c.fillStyle='#d6c49f';c.fillRect(0,106,360,39);
    c.strokeStyle='#bfa881';c.lineWidth=1;for(let y=114;y<145;y+=15){c.beginPath();c.moveTo(0,y);c.lineTo(360,y);c.stroke();}
    c.save();c.translate(78,-273);c.scale(1.04,1.04);drawMeal(c,pose,age);c.restore();
  }

  function reedClump(x,base,height,t,darkness=0){
    for(let i=0;i<6;i++){
      const tip=x+(i-2)*7+Math.sin(t*.8+i)*1.5,top=base-height+i%3*8;
      ctx.strokeStyle=Scene.colorMix(i%2?'#68874e':'#8fa36a','#142a37',darkness*.7);ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(x+(i-2)*6,base);ctx.quadraticCurveTo(tip-9,top+29,tip,top);ctx.stroke();
      ctx.beginPath();ctx.moveTo(tip,top+37);ctx.quadraticCurveTo(tip+15,top+18,tip+19,top+24);ctx.stroke();
      if(i%2)ellipse(ctx,tip,top+4,2.5,9,Scene.colorMix('#9c8159','#142a37',darkness*.7));
    }
  }

  function drawLandscape(t,ambience,spot){
    const {darkness,warmth}=ambience;
    const shade=color=>Scene.colorMix(Scene.colorMix(color,'#ebb182',warmth*.22),'#102139',darkness*.76);
    const colors=spot==='deep'?{sky:['#d9e8f3','#c2d8e5'],water:['#8bafc4','#638fa9','#497990']}:spot==='reeds'?{sky:['#e7e8cb','#f4deb3'],water:['#a9b681','#849e74','#668d78']}:{sky:['#e5eddb','#f5efce'],water:['#a9c9b9','#83b4af','#74a8a5']};
    const sky=ctx.createLinearGradient(0,0,0,210);sky.addColorStop(0,Scene.colorMix(Scene.colorMix(colors.sky[0],'#ba86a1',warmth*.8),'#0c172e',darkness));sky.addColorStop(1,Scene.colorMix(Scene.colorMix(colors.sky[1],'#f1be88',warmth*.9),'#273b56',darkness));
    ctx.fillStyle=sky;ctx.fillRect(0,0,432,205);ctx.save();ctx.globalAlpha=(1-darkness)*.65;window.GameArt?.scene(ctx,'sky',0,0,432,178);ctx.restore();
    if(darkness<.95){ctx.globalAlpha=1-darkness;ellipse(ctx,345,70+warmth*66,25,25,'#f8dea2');ctx.globalAlpha=1;}
    if(darkness>0){ctx.globalAlpha=darkness;ellipse(ctx,345,61,22,22,'#f2edcc');ellipse(ctx,352,55,19,19,Scene.colorMix('#f5efce','#1b2c45',darkness));
      for(let n=0;n<20;n++)ellipse(ctx,23+n*41%387,22+(n*37)%101,.9,.9,'#e0e7d8');ctx.globalAlpha=1;}
    cloud(72+Math.sin(t*.08)*4,75,.8,shade('#fffdf2'));cloud(228,47,.6,shade('#fffdf2'));
    if(spot==='deep'){
      polygon(ctx,[[0,185],[0,147],[58,108],[104,159],[173,86],[237,143],[307,103],[384,152],[432,118],[432,198]],shade('#9eb9cb'));
      polygon(ctx,[[0,194],[34,168],[108,182],[163,133],[194,169],[275,146],[339,181],[408,153],[432,168],[432,199]],shade('#7e9eaf'));
      polygon(ctx,[[150,115],[173,86],[195,111],[176,105],[169,115]],shade('#e1e9e7'));
      polygon(ctx,[[284,124],[307,103],[331,126],[308,119]],shade('#dde6e3'));
    }else if(spot==='reeds'){
      ellipse(ctx,98,170,202,66,shade('#b0bb86'));ellipse(ctx,374,182,126,46,shade('#9caa72'));
      ellipse(ctx,85,206,209,43,shade('#80995e'));
      ctx.fillStyle=shade('#8d8860');ctx.fillRect(25,111,8,73);ellipse(ctx,19,99,57,57,shade('#a6b17a'));ellipse(ctx,49,109,34,45,shade('#b7bd85'));
    }else{
      ellipse(ctx,90,162,170,72,shade('#c4d6b7'));ellipse(ctx,359,172,169,65,shade('#b6cfae'));
      ellipse(ctx,152,198,155,63,shade('#a6c49d'));ellipse(ctx,366,210,155,59,shade('#a0bf99'));
      ctx.fillStyle=shade('#efe8c8');ctx.fillRect(297,130,42,31);polygon(ctx,[[289,132],[318,111],[346,132]],shade('#a4af87'));
      ctx.fillStyle=shade('#92ac94');ctx.fillRect(313,143,10,18);ctx.fillStyle=shade('#d5be8d');ctx.fillRect(301,139,7,9);ctx.save();ctx.globalAlpha=1-darkness*.8;window.GameArt?.draw(ctx,'house',284,105,70,64);ctx.restore();
    }
    const water=ctx.createLinearGradient(0,178,0,400);water.addColorStop(0,Scene.colorMix(shade(colors.water[0]),spot==='deep'?'#233e58':'#2b4549',darkness*.7));water.addColorStop(.55,Scene.colorMix(shade(colors.water[1]),'#18313e',darkness*.7));water.addColorStop(1,Scene.colorMix(shade(colors.water[2]),'#132934',darkness*.7));
    ctx.fillStyle=water;ctx.fillRect(0,178,432,222);
    if(spot==='reeds'){
      polygon(ctx,[[0,176],[118,175],[182,182],[226,194],[184,210],[81,215],[0,223]],shade('#b6ba84'));
      ellipse(ctx,37,203,116,13,shade('#91a06b'));
      for(const x of [5,44,85,132,175,365,398,426])reedClump(x,198+x%3*5,42+x%19,t,darkness);
    }
    for(let i=0;i<17;i++){
      const x=(i*73+Math.sin(t*.4+i)*8)%432,y=192+(i*29)%190;
      ctx.strokeStyle=spot==='deep'?'#d4e6ee55':'#e7f0d847';ctx.lineWidth=i%3?1.5:2.5;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+15,y+3,x+(spot==='deep'?47:30)+i%13,y);ctx.stroke();
    }
    if(spot!=='deep')for(let i=0;i<(spot==='reeds'?6:3);i++){
      const x=382-i*23,y=296+i*13;
      ellipse(ctx,x,y,13,5,spot==='reeds'?shade('#67824d'):shade('#6e9c78'));ctx.strokeStyle=shade('#abc79d');ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+5,y-1);ctx.stroke();
      if(i===1){ellipse(ctx,x+3,y-7,5,6,shade('#e3c0bb'));ellipse(ctx,x-2,y-6,5,6,shade('#f0d6c6'));}
    }
    if(spot==='deep'){
      ellipse(ctx,350,215,25,3,'#abc7d051');ctx.fillStyle=shade('#d4e3d6');ctx.fillRect(346,201,5,12);ctx.fillStyle=shade('#b79169');ctx.fillRect(346,201,5,4);
    }
  }

  function glow(c,x,y,r,color,opacity){
    c.save();for(let i=4;i>=1;i--){c.globalAlpha=opacity*(5-i)/14;ellipse(c,x,y,r*i/4,r*i/4,color);}c.restore();
  }
  function drawLantern(ambience,upgraded){
    const light=ambience.darkness;
    if(!light&&!upgraded)return;
    ctx.fillStyle='#706455';ctx.fillRect(193,241,4,92);ctx.strokeStyle='#706455';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(195,243);ctx.quadraticCurveTo(223,229,224,257);ctx.stroke();
    ctx.fillStyle='#655347';ctx.fillRect(214,255,21,5);ctx.fillRect(214,285,21,5);
    ctx.fillStyle=light?'#f7cf81':'#afa48a';ctx.fillRect(217,260,15,25);ctx.strokeStyle='#6b6255';ctx.strokeRect(216,259,17,27);
    if(light){ctx.fillStyle='#fff3c2';ctx.fillRect(222,262,5,20);}
    if(upgraded){ctx.fillStyle='#b59b64';ctx.fillRect(210,253,29,3);}
  }

  function draw() {
    const t = reducedMotion || game.paused ? game.time : visualTime;
    const snackAge=snack?effectTime-snack.at:Infinity;
    // This UI owns the frozen ambient clock, including pet-panel-only animation.
    const pose=Scene.poseAt(game,{visualTime,snackAge,reducedMotion,ambientTime,allowAmbient:true,resultAge:visualTime-resultAt});
    const ambience=Scene.ambienceAt(new Date()),night=ambience.darkness>.5;
    if(document.body)document.body.dataset.lakeTime=ambience.period;
    if(game.phase==='ready')$('phase-label').textContent={night:'月下 · 夜钓',day:'湖边 · 微风',dusk:'晚霞 · 湖边',dawn:'晨光 · 湖边'}[ambience.period];
    const spot=game.save.selectedSpot;
    ctx.clearRect(0, 0, 432, 400);
    drawLandscape(t,ambience,spot);
    // A soft perspective dock with visible planks.
    if(spot==='deep'){
      ctx.fillStyle='#d8ccb3';ctx.beginPath();ctx.moveTo(0,289);ctx.lineTo(174,285);ctx.quadraticCurveTo(237,310,232,399);ctx.lineTo(0,399);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#476d82';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(175,288);ctx.quadraticCurveTo(234,315,228,399);ctx.stroke();
      ctx.strokeStyle='#ad8c63';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(169,347);ctx.lineTo(228,384);ctx.stroke();ctx.save();ctx.translate(227,384);ctx.rotate(-.95);ellipse(ctx,0,0,6,17,'#b99d73');ctx.restore();
    }else{
      polygon(ctx,[[0,309],[183,296],[239,400],[0,400]],spot==='reeds'?'#75865e':'#8eaa94');
      polygon(ctx,[[0,293],[179,282],[230,389],[0,398]],spot==='reeds'?'#bfa984':'#d1bc95');
    }
    for (let y = 309; y <= 390; y += 18) {
      ctx.strokeStyle = '#ad986f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(184 + (y - 290) * .38, y - 12); ctx.stroke();
    }
    if(spot!=='deep'){ctx.fillStyle='#b09972';ctx.fillRect(151,292,8,63);ellipse(ctx,155,291,7,4,'#e4cfaa');}
    ctx.save();ctx.globalAlpha=1-ambience.darkness*.65;window.GameArt?.draw(ctx,'leaf',368,354,42,40);window.GameArt?.draw(ctx,'flower',395,370,31,29);ctx.restore();
    ellipse(ctx, 80, 329, 51, 10, '#6c816d35');
    ctx.fillStyle='#987d5c';ctx.fillRect(52,316,5,30);ctx.fillRect(95,316,5,32);polygon(ctx,[[46,309],[102,309],[108,319],[45,320]],'#a58963');
    // Lamp spill is behind the figures: face, clothes and coat retain full color.
    if(ambience.darkness){glow(ctx,146,323,game.save.decorations.lantern?156:122,'#ffe4a8',ambience.darkness*.5);ellipse(ctx,122,384,103,13,'#ffe4a83d');glow(ctx,224,270,34,'#ffdd91',ambience.darkness*.48);}
    asset(ctx,hero,pose.heroFrame,pose.heroX,pose.heroY,pose.heroSize,pose.heroSize,false);
    ctx.save();ctx.translate(44,397);ctx.scale(1.3,1.3);ctx.translate(-44,-397);drawMeal(ctx,pose,snackAge);ctx.restore();
    drawLantern(ambience,game.save.decorations.lantern);
    const {rodBase,rodTip}=pose;
    const bend=game.phase==='reeling'?Math.max(0,game.tension-40)*.24:0;
    ctx.strokeStyle = '#aa8354'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();ctx.moveTo(rodBase.x,rodBase.y);ctx.quadraticCurveTo((rodBase.x+rodTip.x)/2,rodTip.y-25+bend,rodTip.x,rodTip.y);ctx.stroke();
    ctx.strokeStyle = '#e3c095';ctx.lineWidth=2;ctx.stroke();
    ellipse(ctx,rodBase.x+3,rodBase.y+9,6,8,'#718679');ellipse(ctx,rodBase.x+3,rodBase.y+9,3,4,'#d9c59a');
    const bx=pose.bobber.x,by=pose.bobber.y;
    if (active()) {
      ctx.strokeStyle = '#f7eee1b8';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(rodTip.x,rodTip.y);ctx.quadraticCurveTo((rodTip.x+bx)/2,pose.castFlight?by-12:245,bx,by);ctx.stroke();
      for (let i = 0; !pose.castFlight&&i < 3; i++) {
        const ring = (t * (game.phase === 'bite' ? 2 : .55) + i / 3) % 1;
        ctx.strokeStyle = 'rgba(244,250,225,' + (1 - ring) * .65 + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(bx, by + 5, 6 + ring * 32, 2 + ring * 9, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if(night){glow(ctx,bx,by-5,19,'#b8ff98',.34);ellipse(ctx,bx,by+14,9,3,'#b1f7a72e');}
      ctx.fillStyle=night?'#e7ffae':'#f8f1d9';ctx.fillRect(bx-2,by-15,4,20);ctx.fillStyle=night?'#7af3ad':'#ca866e';ctx.fillRect(bx-2,by-15,4,8);
      if (game.phase === 'bite' || game.phase === 'reeling' && Math.abs(game.fight) > 18) {
        for (let i = 0; i < 5; i++) ellipse(ctx, bx + (i - 2) * 7, by - 9 - Math.abs(Math.sin(t * 5 + i)) * 15, 2, 4, '#e6f0dc');
      }
    } else if (game.phase === 'caught') {
      const elapsed=reducedMotion?0:visualTime-resultAt,landing=reducedMotion?1:pose.landing;
      const fx=287+(215-287)*landing,fy=279+(244-279)*landing-Math.sin(landing*Math.PI)*55;
      ellipse(ctx,287,291,47*(1-landing),8*(1-landing),'#e8f1d68a');
      if(game.result.treasure){ctx.save();ctx.translate(261,261);ctx.rotate(-.25);polygon(ctx,[[-6,-7],[6,-7],[8,10],[-8,10]],'#abcac5');ctx.fillStyle='#b49a6b';ctx.fillRect(-4,-14,8,7);ctx.fillStyle='#fff0cc';ctx.fillRect(-4,-2,8,7);ctx.restore();}
      if(!game.result.disposition||game.result.disposition==='keep'){ctx.strokeStyle='#f7eee1b8';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(rodTip.x,rodTip.y);ctx.lineTo(fx,fy);ctx.stroke();drawFish(ctx,game.fish,fx,fy,28,reducedMotion?0:Math.sin(elapsed*7)*.08);}
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 + elapsed;
        if(!game.result.disposition)ellipse(ctx,fx+Math.cos(angle)*47,fy+Math.sin(angle)*37,2,2,'#fff1bc');
      }
    } else {
      ctx.globalAlpha = .23;
      drawFish(ctx, F.FISH[0], 285 + Math.sin(t * .6) * 28, 318, 14, -.08);
      ctx.globalAlpha = 1;
    }
    for (let i = 0; spot!=='deep'&&i < 7; i++) {
      ctx.strokeStyle = Scene.colorMix(i % 2 ? '#84a270' : '#96af7c','#142a37',ambience.darkness*.7); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(409 + i * 4, 400); ctx.quadraticCurveTo(398 + i * 5, 354, 398 + i * 5 + Math.sin(t + i) * 2, 337 - i % 3 * 9); ctx.stroke();
    }
    if(spot==='reeds'){reedClump(381,403,103,t,ambience.darkness);reedClump(424,412,122,t,ambience.darkness);}
    if(game.save.selectedSpot==='deep'){ctx.globalAlpha=.23;drawFish(ctx,F.FISH[10],351+Math.sin(t*.4)*12,350,24,0);ctx.globalAlpha=1;}
    if(night)for(const p of Scene.firefliesAt(visualTime,spot,reducedMotion)){glow(ctx,p.x,p.y,9,'#d0f29c',p.alpha*.22*ambience.darkness);ctx.globalAlpha=p.alpha*ambience.darkness;ellipse(ctx,p.x,p.y,1.7,1.7,'#eaffb2');ctx.globalAlpha=1;}
    drawPetTheater(pose,snackAge);
  }

  function frame(timestamp) {
    const dt = lastFrame === null ? 0 : Math.min((timestamp - lastFrame) / 1000, .1);
    lastFrame = timestamp;
    if (!game.paused) visualTime += dt;
    if(!document.hidden)effectTime+=dt;
    if(!document.hidden&&(!game.paused||!panel.hidden))ambientTime+=dt;
    F.step(game, dt); sync(); draw();
    window.requestAnimationFrame(frame);
  }
  sync(); draw();
  if(stored!==null&&parsed&&(!Object.hasOwn(parsed,'selectedSpot')||!Object.hasOwn(parsed,'released')||F.FISH.some(f=>!Object.hasOwn(parsed.collection||{},f.id))))persist();
  window.requestAnimationFrame(frame);
})();
