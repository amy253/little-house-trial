(function (root) {
  'use strict';
  const UPGRADE_COSTS = Object.freeze([60, 180, 450]);
  const FISH = Object.freeze([
    { id: 'crucian', name: '鲫鱼', rarity: '普通', price: 10, unlock: 0, weight: 35, hookWindow: 1.8, escapeTime: 2, reelSeconds: 8, fightStrength: 5, color: '#95b9a7', accent: '#e5ede0', mass: [.2, .8] },
    { id: 'carp', name: '鲤鱼', rarity: '普通', price: 14, unlock: 0, weight: 20, hookWindow: 1.8, escapeTime: 2, reelSeconds: 10, fightStrength: 7, color: '#daaa74', accent: '#fff1d2', mass: [.5, 1.8] },
    { id: 'grass', name: '草鱼', rarity: '普通', price: 18, unlock: 0, weight: 15, hookWindow: 1.8, escapeTime: 2, reelSeconds: 12, fightStrength: 9, color: '#83a99d', accent: '#d9e7d0', mass: [.8, 2.8] },
    { id: 'koi', name: '锦鲤', rarity: '稀有', price: 35, unlock: 3, weight: 15, hookWindow: 1.2, escapeTime: 1.4, reelSeconds: 14, fightStrength: 18, color: '#f1d6af', accent: '#cd7c60', mass: [.6, 2.4] },
    { id: 'silver', name: '银光鲈鱼', rarity: '稀有', price: 50, unlock: 7, weight: 10, hookWindow: 1.2, escapeTime: 1.4, reelSeconds: 17, fightStrength: 23, color: '#9dbecc', accent: '#e8f4f1', mass: [1, 3.5] },
    { id: 'moon', name: '月光鱼', rarity: '传说', price: 100, unlock: 12, weight: 5, hookWindow: 1, escapeTime: 1.1, reelSeconds: 20, fightStrength: 29, color: '#b0a0d0', accent: '#f8e5ae', mass: [1.5, 4.8], pattern:'surge' },
    { id:'bluegill',name:'蓝鳃太阳鱼',rarity:'普通',price:12,unlock:0,weight:12,hookWindow:1.8,escapeTime:2,reelSeconds:8,fightStrength:6,color:'#8bb7bd',accent:'#e2cc7c',mass:[.15,.65],shape:'round',pattern:'dart' },
    { id:'loach',name:'泥鳅',rarity:'普通',price:14,unlock:0,weight:10,hookWindow:1.8,escapeTime:2,reelSeconds:10,fightStrength:8,color:'#a4906c',accent:'#e3d4a3',mass:[.1,.45],shape:'long',pattern:'wiggle' },
    { id:'catfish',name:'鲶鱼',rarity:'稀有',price:44,unlock:3,weight:8,hookWindow:1.4,escapeTime:1.5,reelSeconds:14,fightStrength:16,color:'#748d86',accent:'#d6dfc5',mass:[1,4],shape:'long',pattern:'dive' },
    { id:'perch',name:'河鲈',rarity:'稀有',price:32,unlock:3,weight:10,hookWindow:1.4,escapeTime:1.5,reelSeconds:13,fightStrength:15,color:'#93a775',accent:'#e3dca9',mass:[.4,1.8],shape:'spiny',pattern:'dart' },
    { id:'trout',name:'虹鳟',rarity:'稀有',price:60,unlock:7,weight:7,hookWindow:1.3,escapeTime:1.4,reelSeconds:16,fightStrength:19,color:'#8ab3a9',accent:'#d6a2ab',mass:[.8,3],pattern:'leap' },
    { id:'dragon',name:'金龙鱼',rarity:'传说',price:140,unlock:18,weight:3,hookWindow:1.2,escapeTime:1.3,reelSeconds:20,fightStrength:25,color:'#dcb96a',accent:'#fff0bd',mass:[1.2,5],shape:'long',pattern:'surge' }
  ].map(Object.freeze));
  const SPOTS=Object.freeze([
    {id:'shallow',name:'浅滩码头',unlock:0,description:'轻松的小鱼与湖边惊喜',favorites:['crucian','carp','bluegill']},
    {id:'reeds',name:'芦苇湾',unlock:3,description:'泥鳅、鲶鱼、锦鲤常在这里',favorites:['loach','catfish','koi']},
    {id:'deep',name:'深水湖心',unlock:7,description:'河鲈、虹鳟与传说鱼的踪迹',favorites:['perch','silver','trout','moon','dragon']}
  ].map(s=>Object.freeze({...s,favorites:Object.freeze(s.favorites)})));
  const SHOP = Object.freeze([
    { id:'rod',category:'gear',name:'鱼竿升级',icon:'⌁',prices:UPGRADE_COSTS,max:4,description:'提竿更从容，收线更快，挣扎减轻。' },
    { id:'line',category:'gear',name:'韧性鱼线',icon:'〰',prices:[45,130],max:2,description:'每级多留 0.12 秒挽救危险力度。' },
    { id:'float',category:'gear',name:'灵敏浮漂',icon:'◉',prices:[35,110],max:2,description:'每级延长 0.15 秒提竿窗口。' },
    { id:'bowl',category:'gear',name:'卟哩小食盆',icon:'◡',prices:[70],max:1,description:'每次喂鱼额外获得 1 点亲密度。' },
    { id:'shrimp',category:'bait',name:'鲜虾饵',icon:'🦐',price:24,amount:3,unlock:3,description:'3 份 · 提高已解锁稀有鱼的出现机会。' },
    { id:'glow',category:'bait',name:'星光饵',icon:'✦',price:55,amount:3,unlock:12,description:'3 份 · 更容易遇到已解锁的月光鱼。' },
    { id:'cushion',category:'decor',name:'卟哩软垫',icon:'☁',price:35,affection:0,description:'给码头上的卟哩一个软乎乎的位置。' },
    { id:'scarf',category:'decor',name:'小鱼围巾',icon:'♡',price:45,affection:20,description:'亲密度 20 解锁 · 卟哩戴上暖暖围巾。' },
    { id:'lantern',category:'decor',name:'月光小灯',icon:'☾',price:120,affection:50,description:'亲密度 50 解锁 · 升级湖边的小灯，夜里亮起更温暖的灯光。' }
  ].map(Object.freeze));
  const BOND_THRESHOLDS = [20,50,100,200], BOND_GIFTS = [20,40,80,120];
  const bounded = (n, low, high) => Math.max(low, Math.min(high, n));
  const nonnegative = n => typeof n === 'number' && Number.isFinite(n) ? bounded(n, 0, 1e9) : 0;
  const integer = n => Math.floor(nonnegative(n));
  const WISHES=Object.freeze([
    {kind:'catch',title:'收一篓小惊喜',description:'钓上 3 条鱼，留给自己或卟哩。',target:3,coins:25},
    {kind:'feed',title:'卟哩的双份晚餐',description:'喂卟哩 2 条鱼，她会帮你留意浮漂。',target:2,coins:30},
    {kind:'travel',title:'换个风景',description:'在两个不同钓点各钓上一条鱼。',target:2,coins:40},
    {kind:'release',title:'给小湖一份温柔',description:'放生 2 条鱼，再去遇见新朋友。',target:2,coins:30}
  ].map(Object.freeze));
  const BOTTLE_NOTES=Object.freeze([
    {title:'第一封湖边来信',text:'把今天最开心的小事留在这里。下一位路过的人，也会带走一点好心情。'},
    {title:'小猫的脚印',text:'木板上有一串小小的爪印。信里只写着：记得给你的伙伴留一条鱼。'},
    {title:'芦苇里的秘密',text:'傍晚的芦苇轻轻摇，岸边的灯刚刚亮。慢一点，也能遇见漂亮的小鱼。'},
    {title:'月亮的回信',text:'夜里的湖面会替你收好烦恼。等天亮，带走一篓新的期待。'},
    {title:'深水的小约定',text:'如果今天没有遇见想要的那条鱼，就和身边的小伙伴再坐一会儿。'},
    {title:'下次还来',text:'最后一张小纸条写着：谢谢你照顾这片湖。明天，我们还在这里见。'}
  ].map(Object.freeze));
  function journeyStatus(save){
    const j=save.journey,w=WISHES[j.chapter%WISHES.length],progress=w.kind==='travel'?j.spots.length:j.progress;
    return {...w,chapter:j.chapter,progress:Math.min(w.target,progress),ready:progress>=w.target,nextBottle:4-j.finds%4,coins:w.coins+Math.min(25,Math.floor(j.chapter/4)*5)};
  }
  function wishEvent(save,kind,spot){
    const status=journeyStatus(save);if(status.kind!==kind)return;
    if(kind==='travel'){if(!save.journey.spots.includes(spot))save.journey.spots.push(spot);}
    else save.journey.progress=Math.min(status.target,save.journey.progress+1);
  }
  function claimWish(g){
    const s=journeyStatus(g.save);if(!canManage(g)||!s.ready)return false;
    const bait=g.save.totalCaught>=12&&s.chapter%4===3?'glow':'shrimp';
    g.save.coins+=s.coins;g.save.baits[bait]++;g.save.journey.chapter++;g.save.journey.progress=0;g.save.journey.spots=[];
    return {coins:s.coins,bait};
  }
  function lakeTreasure(save){
    if(++save.journey.finds%4)return null;
    const bottle=BOTTLE_NOTES.findIndex((_,i)=>!save.journey.bottles.includes(i));
    if(bottle>=0)save.journey.bottles.push(bottle);
    const coins=[12,18,24][SPOTS.findIndex(s=>s.id===save.selectedSpot)];
    save.coins+=coins;save.baits.shrimp++;
    return {bottle:bottle>=0?bottle:null,coins,bait:'shrimp'};
  }

  function createSave() {
    return { version: 2, coins: 0, rodLevel: 1, totalCaught: 0, tutorialDone: false,
      collection: Object.fromEntries(FISH.map(f => [f.id, { count: 0, bestWeight: 0 }])),
      inventory:Object.fromEntries(FISH.map(f=>[f.id,0])), pet:{affection:0,fed:0},
      equipment:{line:0,float:0,bowl:0}, baits:{shrimp:0,glow:0}, selectedBait:'basic',
      owned:{cushion:false,scarf:false,lantern:false}, decorations:{cushion:false,scarf:false,lantern:false},selectedSpot:'shallow',released:0,
      journey:{chapter:0,progress:0,spots:[],finds:0,bottles:[]},catHelp:0 };
  }

  function readSave(input) {
    let value = input;
    if (typeof input === 'string') {
      try { value = JSON.parse(input); } catch (_) { return createSave(); }
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return createSave();
    const save = createSave();
    save.coins = integer(value.coins);
    save.rodLevel = bounded(integer(value.rodLevel) || 1, 1, 4);
    save.tutorialDone = value.tutorialDone === true;
    for (const fish of FISH) {
      const entry = value.collection && value.collection[fish.id];
      if (!entry || typeof entry !== 'object') continue;
      const count = integer(entry.count);
      save.collection[fish.id] = { count, bestWeight: count ? nonnegative(entry.bestWeight) : 0 };
      save.totalCaught += count;
    }
    for (const fish of FISH) save.inventory[fish.id] = Math.min(integer(value.inventory?.[fish.id]), save.collection[fish.id].count);
    save.pet = { affection:integer(value.pet?.affection),fed:integer(value.pet?.fed) };
    for (const id of ['line','float','bowl']) save.equipment[id] = bounded(integer(value.equipment?.[id]),0,id==='bowl'?1:2);
    for (const id of ['shrimp','glow']) save.baits[id] = integer(value.baits?.[id]);
    if (['basic','shrimp','glow'].includes(value.selectedBait)) save.selectedBait=value.selectedBait;
    for (const id of ['cushion','scarf','lantern']) {
      save.owned[id]=value.owned?.[id]===true;
      save.decorations[id]=save.owned[id]&&value.decorations?.[id]===true;
    }
    const spot=SPOTS.find(s=>s.id===value.selectedSpot&&s.unlock<=save.totalCaught);
    if(spot)save.selectedSpot=spot.id;
    save.released=Math.min(integer(value.released),save.totalCaught);
    const j=value.journey||{};save.journey.chapter=integer(j.chapter);
    save.journey.progress=Math.min(integer(j.progress),WISHES[save.journey.chapter%4].target);
    save.journey.finds=Math.min(integer(j.finds),save.totalCaught);
    if(Array.isArray(j.spots))save.journey.spots=[...new Set(j.spots.filter(id=>SPOTS.some(s=>s.id===id&&s.unlock<=save.totalCaught)))].slice(0,2);
    if(Array.isArray(j.bottles))save.journey.bottles=[...new Set(j.bottles.filter(id=>Number.isInteger(id)&&id>=0&&id<BOTTLE_NOTES.length))];
    save.catHelp=Math.min(3,integer(value.catHelp));
    return save;
  }

  function writeSave(save) { return JSON.stringify(readSave(save)); }

  function chooseFish(save, random = Math.random, bait = 'basic') {
    if (!save.tutorialDone) return FISH[0];
    const available = FISH.filter(f => f.unlock <= save.totalCaught);
    const spot=SPOTS.find(s=>s.id===save.selectedSpot&&s.unlock<=save.totalCaught)||SPOTS[0];
    const weights = available.map(f => {
      const weight=f.weight*(spot.favorites.includes(f.id)?2:1);
      const boost=bait==='shrimp'?(f.unlock===0?.6:1.8):bait==='glow'?(f.unlock===0?.45:f.rarity==='传说'?4.5:1.3):1;
      return weight*boost;
    });
    let point = bounded(random(), 0, .999999999) * weights.reduce((a,b)=>a+b,0);
    for (let i = 0; i < available.length; i++) {
      point -= weights[i];
      if (point < 0) return available[i];
    }
    return available[available.length - 1];
  }

  function upgrade(save) {
    const price = UPGRADE_COSTS[save.rodLevel - 1];
    if (price === undefined || save.coins < price) return false;
    save.coins -= price;
    save.rodLevel++;
    return true;
  }

  function petStatus(save) {
    const level=BOND_THRESHOLDS.filter(n=>save.pet.affection>=n).length;
    const start=level?BOND_THRESHOLDS[level-1]:0, next=BOND_THRESHOLDS[level]??null;
    const descriptions=['更爱蹦跳 · 商店解锁小鱼围巾','主动靠近家家 · 商店解锁月光小灯','贴贴更久，陪伴更频繁','最黏你的湖边伙伴'];
    return {level,title:['湖边小伙伴','开始贴贴','最爱的小房子','形影不离','卟哩的全世界'][level],next,nextGift:BOND_GIFTS[level]??0,
      milestones:BOND_THRESHOLDS.map((threshold,i)=>({threshold,gift:BOND_GIFTS[i],description:descriptions[i],unlocked:save.pet.affection>=threshold})),
      percent:next===null?100:bounded((save.pet.affection-start)/(next-start)*100,0,100)};
  }
  function sellFish(save,id) {
    const fish=FISH.find(f=>f.id===id);
    if(!fish||!(save.inventory[id]>0))return false;
    save.inventory[id]--;save.coins+=fish.price;return {coins:fish.price,fishId:id};
  }
  function feedFish(save,id) {
    const fish=FISH.find(f=>f.id===id);
    if(!fish||!(save.inventory[id]>0))return false;
    const before=petStatus(save).level;
    const affection=(fish.rarity==='普通'?3:fish.rarity==='稀有'?8:18)+save.equipment.bowl;
    save.inventory[id]--;save.pet.affection+=affection;save.pet.fed++;
    save.catHelp=3;wishEvent(save,'feed');
    let gift=0;for(let n=before;n<petStatus(save).level;n++)gift+=BOND_GIFTS[n];
    save.coins+=gift;return {affection,gift,fishId:id};
  }
  function releaseFish(save,id) {
    const fish=FISH.find(f=>f.id===id);if(!fish||!(save.inventory[id]>0))return false;
    const before=save.released++;save.inventory[id]--;
    wishEvent(save,'release');
    const coins=Math.max(1,Math.floor(fish.price*.2));
    const thresholds=[5,15,30],gifts=[20,40,70];let gift=0;
    for(let n=0;n<thresholds.length;n++)if(before<thresholds[n]&&save.released>=thresholds[n])gift+=gifts[n];
    save.coins+=coins+gift;return {fishId:id,coins,gift};
  }
  function chooseCatch(g,choice) {
    if(g.phase!=='caught'||g.result.disposition||!['sell','feed','keep','release'].includes(choice))return false;
    const feedback=choice==='sell'?sellFish(g.save,g.fish.id):choice==='feed'?feedFish(g.save,g.fish.id):choice==='release'?releaseFish(g.save,g.fish.id):{};
    if(!feedback)return false;
    g.result.disposition=choice;g.result.feedback=feedback;return true;
  }
  const canManage=g=>['ready','caught','escaped'].includes(g.phase);
  function selectSpot(g,id) {
    const spot=SPOTS.find(s=>s.id===id);
    if(!canManage(g)||!spot||spot.unlock>g.save.totalCaught)return false;
    g.save.selectedSpot=id;return true;
  }
  function shopState(save,id) {
    const item=SHOP.find(i=>i.id===id);if(!item)return null;
    const level=id==='rod'?save.rodLevel:save.equipment[id]||0;
    const owned=item.category==='decor'&&save.owned[id]===true;
    const max=item.category==='gear'&&level>=item.max;
    const price=item.prices?.[id==='rod'?level-1:level]??item.price??0;
    const locked=save.totalCaught<(item.unlock||0)||save.pet.affection<(item.affection||0);
    return {price,level,owned,max,locked,canBuy:!owned&&!max&&!locked&&save.coins>=price};
  }
  function purchase(g,id) {
    if(!canManage(g))return false;
    const item=SHOP.find(i=>i.id===id),state=shopState(g.save,id);
    if(!item||!state.canBuy)return false;
    g.save.coins-=state.price;
    if(id==='rod')g.save.rodLevel++;
    else if(item.category==='gear')g.save.equipment[id]++;
    else if(item.category==='bait')g.save.baits[id]+=item.amount;
    else {g.save.owned[id]=true;g.save.decorations[id]=true;}
    return true;
  }
  function selectBait(g,id) {
    if(!canManage(g)||!['basic','shrimp','glow'].includes(id)||id!=='basic'&&!(g.save.baits[id]>0))return false;
    g.save.selectedBait=id;return true;
  }
  function toggleDecoration(g,id) {
    if(!canManage(g)||!Object.hasOwn(g.save.owned,id)||!g.save.owned[id])return false;
    g.save.decorations[id]=!g.save.decorations[id];return true;
  }

  function difficulty(save, fish) {
    const pace = fish.rarity === '普通' ? .4 : 1;
    if (!save.tutorialDone) return { name: '教学', low: 25, high: 70, dangerLow: 10, dangerHigh: 85,
      escapeTime: fish.escapeTime+save.equipment.line*.12, speed: 1.5, strength: fish.fightStrength, surge: 0, reelSeconds: fish.reelSeconds * .75 * pace };
    const tier = save.totalCaught < 3 ? 0 : save.totalCaught < 7 ? 1 : 2;
    const rarity = fish.rarity === '普通' ? 0 : fish.rarity === '稀有' ? 1 : 2;
    const half = Math.max(12, [18, 16, 14][tier] - rarity);
    return { name: ['进阶', '凶猛', '极限'][tier], low: 49 - half, high: 49 + half,
      dangerLow: [12, 14, 16][tier], dangerHigh: [86, 84, 82][tier],
      escapeTime: Math.max(1, [1.6, 1.4, 1.2][tier] - rarity * .1)+save.equipment.line*.12,
      speed: [2.2, 2.5, 2.8][tier] + rarity * .25,
      strength: [14, 18, 22][tier] + fish.fightStrength * .45,
      surge: [8, 12, 16][tier] + rarity * 4,
      reelSeconds: fish.reelSeconds * [.8, .9, 1][tier] * pace };
  }

  function create(save = createSave(), random = Math.random) {
    const normalized = readSave(save);
    return { save: normalized, random, phase: 'ready', time: 0, phaseTime: 0,
      paused: false, held: false, fish: null, tension: 45, progress: 0,
      dangerTime: 0, result: null, waitTime: 0, fightPhase: 0, fight: 0,
      rules: difficulty(normalized, FISH[0]),encounterBait:'basic',catAssisted:false };
  }

  function cast(g) {
    if (g.paused || g.phase !== 'ready') return false;
    g.catAssisted=g.save.catHelp>0;if(g.catAssisted)g.save.catHelp--;
    const selected=g.save.selectedBait;
    g.encounterBait=selected!=='basic'&&g.save.baits[selected]>0?selected:'basic';
    if(g.encounterBait!=='basic')g.save.baits[g.encounterBait]--;
    else g.save.selectedBait='basic';
    g.fish = chooseFish(g.save, g.random,g.encounterBait);
    g.rules = difficulty(g.save, g.fish);
    g.waitTime = 2 + bounded(g.random(), 0, 1) * 2;
    g.fightPhase = g.random() * Math.PI * 2;
    g.phase = 'waiting';
    g.phaseTime = 0;
    g.result = null;
    return true;
  }

  function hook(g) {
    if (g.paused || g.phase !== 'bite') return false;
    g.phase = 'reeling';
    g.rules = difficulty(g.save, g.fish);
    g.phaseTime = 0;
    g.progress = 0;
    g.tension = (g.rules.low + g.rules.high) / 2;
    g.dangerTime = 0;
    g.held = false;
    return true;
  }

  function setHeld(g, held) { g.held = !g.paused && g.phase === 'reeling' && held === true; }
  function setPaused(g, paused) {
    g.paused = paused === true;
    if (g.paused) g.held = false;
  }

  function dismiss(g) {
    if (g.phase !== 'caught' && g.phase !== 'escaped') return;
    g.phase = 'ready';
    g.phaseTime = 0;
    g.fish = null;
    g.result = null;
    g.progress = 0;
    g.dangerTime = 0;
    g.held = false;
    g.fight = 0;
  }

  function escaped(g, reason) {
    g.escapePhaseTime = g.phaseTime;
    g.phase = 'escaped';
    g.phaseTime = 0;
    g.held = false;
    g.result = { reason, fishId: g.fish.id, price: 0, weight: 0, isNew: false };
  }

  function caught(g) {
    const f = g.fish, entry = g.save.collection[f.id];
    const weight = Math.round((f.mass[0] + (f.mass[1] - f.mass[0]) * g.random()) * 100) / 100;
    g.result = { reason: 'caught', fishId: f.id, price: f.price, weight, isNew: entry.count === 0 };
    entry.count++;
    entry.bestWeight = Math.max(entry.bestWeight, weight);
    g.save.totalCaught++;
    g.save.inventory[f.id]++;
    g.save.tutorialDone = true;
    wishEvent(g.save,'catch');wishEvent(g.save,'travel',g.save.selectedSpot);g.result.treasure=lakeTreasure(g.save);
    g.phase = 'caught';
    g.phaseTime = 0;
    g.progress = 100;
    g.held = false;
  }

  function step(g, dt) {
    if (g.paused || !['waiting', 'bite', 'reeling'].includes(g.phase) || !Number.isFinite(dt) || dt <= 0) return;
    let remaining = Math.min(dt, .25);
    while (remaining > 1e-9 && !['caught', 'escaped'].includes(g.phase)) {
      const part = Math.min(remaining, 1 / 120);
      remaining -= part;
      g.time += part;
      g.phaseTime += part;
      const bonus = g.save.rodLevel - 1;
      if (g.phase === 'waiting') {
        if (g.phaseTime >= g.waitTime) { g.phase = 'bite'; g.phaseTime = 0; }
      } else if (g.phase === 'bite') {
        if (g.phaseTime >= g.fish.hookWindow + bonus * .1 + g.save.equipment.float*.15+(g.catAssisted?.3:0)) escaped(g, 'missed');
      } else {
        const rules = g.rules;
        // Stateless bursts vary direction per segment, independent of render rate.
        const segment = g.phaseTime / (1.15 - (rules.speed - 1.5) * .12);
        const hash = Math.sin((Math.floor(segment) + Math.floor(g.fightPhase * 10000)) * 127.1) * 43758.5453;
        const random = hash - Math.floor(hash);
        const burst = Math.sin((segment % 1) * Math.PI) ** 2 * (random < .5 ? -1 : 1) * rules.surge;
        const pattern=g.fish.pattern;
        const habit=pattern==='wiggle'?Math.sin(g.phaseTime*7)*3:pattern==='dive'?-3:pattern==='dart'?Math.sin(g.phaseTime*3.8)*4:pattern==='leap'?Math.sin(g.phaseTime*2.1)*5:pattern==='surge'?Math.sin(g.phaseTime*1.3)*4:0;
        g.fight = bounded((Math.sin(g.phaseTime * rules.speed + g.fightPhase) + .4 * Math.sin(g.phaseTime * rules.speed * 2.3)) * rules.strength + burst+habit, -26, 25) * (1 - bonus * .05);
        g.tension = bounded(g.tension + ((g.held ? 34 : -28) + g.fight) * part, 0, 100);
        const danger = g.tension < rules.dangerLow || g.tension > rules.dangerHigh;
        const reelRate = danger ? 0 : g.tension >= rules.low && g.tension <= rules.high ? 1 : .45;
        g.progress += 100 / rules.reelSeconds * (1 + bonus * .1) * part * reelRate;
        g.dangerTime = danger ? g.dangerTime + part : 0;
        if (g.dangerTime >= rules.escapeTime) escaped(g, g.tension > rules.dangerHigh ? 'tight' : 'slack');
        else if (g.progress >= 100) caught(g);
      }
    }
  }

  function revive(g){if(g.phase!=='escaped'||!g.result||!g.fish)return false;const missed=g.result.reason==='missed';g.phase=missed?'bite':'reeling';g.phaseTime=missed?0:(g.escapePhaseTime||g.phaseTime);g.tension=(g.rules.low+g.rules.high)/2;g.dangerTime=0;g.result=null;g.held=false;g.paused=false;return true;}
  const api = { revive,FISH, SPOTS,WISHES,BOTTLE_NOTES,journeyStatus,claimWish,selectSpot,releaseFish,UPGRADE_COSTS, SHOP,petStatus,sellFish,feedFish,chooseCatch,shopState,purchase,selectBait,toggleDecoration,createSave, readSave, writeSave, chooseFish, upgrade,
    create, cast, hook, setHeld, step, setPaused, dismiss };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.JiajiaFishing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
