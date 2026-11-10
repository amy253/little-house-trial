(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BuliEscape = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const ROOMS = Object.freeze({living:'暖暖客厅', kitchen:'薄荷厨房', balcony:'落日阳台'});
  const ITEMS = Object.freeze({smallKey:{name:'小铜钥匙', detail:'打开客厅抽屉'}, snack:{name:'小鱼零食', detail:'卟哩喜欢的鱼鱼'}, screwdriver:{name:'螺丝刀', detail:'拧开通风口螺丝'}, doorKey:{name:'小屋门钥匙', detail:'打开阳台旁的大门'}});
  const CLUES = Object.freeze({
    note:{id:'note', title:'抽屉里的便笺', body:'「橱柜密码藏在画里。数一数，按卟哩最喜欢的顺序读。」下面画了一包小鱼零食。'},
    frame:{id:'frame', title:'客厅画框', body:'画中有 3 朵花、1 个太阳、4 颗星星。三类图案的数量分别是：花 3，太阳 1，星星 4。'},
    paw:{id:'paw', title:'卟哩的爪印卡', body:'卟哩吃完鱼鱼，走到画框下，露出垫子里的卡片：花 → 太阳 → 星星。按这个顺序数画里的图案。'},
    colors:{id:'colors', title:'通风口里的色卡', body:'「阳台小盒，从左往右，依次按下。」蓝 → 粉 → 黄 → 蓝。每次按下一个颜色。'}
  });
  const TARGET_ROOMS = {sofa:'living', drawer:'living', frame:'living', buli:'living', plant:'living', cupboard:'kitchen', vent:'kitchen', kettle:'kitchen', sink:'kitchen', box:'balcony', door:'balcony', flowers:'balcony', window:'balcony'};
  const flagNames = ['sofaSearched','drawerOpen','frameSeen','catFed','cupboardOpen','ventOpen','boxOpen','doorOpen'];
  function createState() {
    return {version:1, room:'living', flags:Object.fromEntries(flagNames.map(k => [k,false])), inventory:[], journal:[], selected:null, won:false};
  }
  function derive(s) {
    const f = s.flags;
    s.inventory = [];
    if (f.sofaSearched && !f.drawerOpen) s.inventory.push('smallKey');
    if (f.drawerOpen && !f.catFed) s.inventory.push('snack');
    if (f.cupboardOpen) s.inventory.push('screwdriver');
    if (f.boxOpen && !f.doorOpen) s.inventory.push('doorKey');
    s.journal = [];
    if (f.drawerOpen) s.journal.push({...CLUES.note});
    if (f.frameSeen) s.journal.push({...CLUES.frame});
    if (f.catFed) s.journal.push({...CLUES.paw});
    if (f.ventOpen) s.journal.push({...CLUES.colors});
    if (!s.inventory.includes(s.selected)) s.selected = null;
    s.won = f.doorOpen;
    return s;
  }
  function normalize(raw) {
    const s = createState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) return s;
    const f = raw.flags && typeof raw.flags === 'object' && !Array.isArray(raw.flags) ? raw.flags : {};
    s.flags.sofaSearched = f.sofaSearched === true;
    s.flags.drawerOpen = s.flags.sofaSearched && f.drawerOpen === true;
    s.flags.frameSeen = f.frameSeen === true;
    s.flags.catFed = s.flags.drawerOpen && f.catFed === true;
    s.flags.cupboardOpen = s.flags.catFed && s.flags.frameSeen && f.cupboardOpen === true;
    s.flags.ventOpen = s.flags.cupboardOpen && f.ventOpen === true;
    s.flags.boxOpen = s.flags.ventOpen && f.boxOpen === true;
    s.flags.doorOpen = s.flags.boxOpen && f.doorOpen === true;
    s.room = typeof raw.room === 'string' && Object.hasOwn(ROOMS, raw.room) ? raw.room : 'living';
    s.selected = typeof raw.selected === 'string' && Object.hasOwn(ITEMS, raw.selected) ? raw.selected : null;
    return derive(s);
  }
  function serialize(state) {
    const s = normalize(state);
    return JSON.stringify({version:1, room:s.room, flags:s.flags, selected:s.selected});
  }
  function act(state, input) {
    let s = normalize(state);
    const a = input && typeof input === 'object' ? input : {};
    let message = '', effect = 'inspect', modal = null;
    function done(text, kind) { return {state:derive(s), message:text || message, effect:kind || effect, modal}; }
    if (a.type === 'restart') return {state:createState(), message:'新的小屋冒险开始了。看看房间里藏着什么吧。', effect:'restart', modal:null};
    if (s.won) return done('门已经打开了，卟哩在等你一起出门！');
    if (a.type === 'room') {
      if (typeof a.room === 'string' && Object.hasOwn(ROOMS, a.room)) {s.room = a.room; message = '来到' + ROOMS[a.room] + '。';}
      return done();
    }
    if (a.type === 'select') {
      if (a.item === null) s.selected = null;
      else if (s.inventory.includes(a.item)) s.selected = s.selected === a.item ? null : a.item;
      return done(s.selected ? '已拿起' + ITEMS[s.selected].name + '，点房间里的物件使用。' : '已收起物品，可以查看房间。', 'select');
    }
    if (a.type === 'code') {
      if (s.room !== 'kitchen' || a.target !== 'cupboard') return done();
      if (s.flags.cupboardOpen) return done('橱柜已经打开，螺丝刀在物品栏里。');
      if (!(s.flags.catFed && s.flags.frameSeen)) return done('先找到画里的数量和卟哩喜欢的顺序，再来试试。', 'blocked');
      if (typeof a.code !== 'string' || a.code.trim() !== '314') return done('密码还不对。按「花 → 太阳 → 星星」重新数一数，物品和线索都还在。', 'wrong');
      s.flags.cupboardOpen = true;
      return done('咔哒！橱柜打开了，获得螺丝刀。', 'reward');
    }
    if (a.type === 'colors') {
      if (s.room !== 'balcony') return done();
      if (s.flags.boxOpen) return done('小盒已经打开。');
      if (!s.flags.ventOpen) return done('四个按钮没有标记。也许小屋里藏着一张色卡。', 'blocked');
      if (!Array.isArray(a.colors) || a.colors.length !== 4 || !a.colors.every(c => typeof c === 'string') || a.colors.join(',') !== 'sky,rose,gold,sky') return done('颜色顺序还不对。小盒没有锁死，看看笔记里的色卡再试一次。', 'wrong');
      s.flags.boxOpen = true;
      return done('小盒弹开了！找到小屋门钥匙。', 'reward');
    }
    if (a.type !== 'inspect' || TARGET_ROOMS[a.target] !== s.room) return done();
    const f = s.flags;
    if (s.selected) {
      if (a.target === 'drawer' && s.selected === 'smallKey' && !f.drawerOpen) { f.drawerOpen = true; return done('小铜钥匙打开了抽屉。获得小鱼零食和一张便笺，已记入笔记。', 'reward'); }
      if (a.target === 'buli' && s.selected === 'snack' && !f.catFed) { f.catFed = true; return done('卟哩吃得好开心！它走到画框下，找出了爪印卡：花 → 太阳 → 星星。', 'feed'); }
      if (a.target === 'vent' && s.selected === 'screwdriver' && !f.ventOpen) { f.ventOpen = true; return done('拧开四颗螺丝，通风口里藏着一张色卡：蓝 → 粉 → 黄 → 蓝。', 'reward'); }
      if (a.target === 'door' && s.selected === 'doorKey' && !f.doorOpen) { f.doorOpen = true; s.selected = null; return done('门开了！和卟哩一起去晒太阳吧。', 'win'); }
      return done(ITEMS[s.selected].name + '在这里用不上。它还在手里，可以换个地方试试。', 'blocked');
    }
    switch (a.target) {
      case 'sofa': if (!f.sofaSearched) {f.sofaSearched = true; return done('抱枕下面有一把小铜钥匙！已经放进随身小口袋。', 'reward');} return done('抱枕下已经找过了。');
      case 'drawer': return done(f.drawerOpen ? CLUES.note.body : '抽屉上有一个小小的铜锁。需要一把钥匙。');
      case 'frame': f.frameSeen = true; return done(CLUES.frame.body, 'clue');
      case 'buli': return done(f.catFed ? CLUES.paw.body : '卟哩守着垫子，眼睛望向抽屉。它好像想吃小鱼零食。');
      case 'cupboard': if (!f.cupboardOpen) modal = 'number'; return done(f.cupboardOpen ? '橱柜打开了，工具已经收好。' : '薄荷橱柜有三位数字锁。画框和卟哩的卡片会告诉你密码。');
      case 'vent': return done(f.ventOpen ? CLUES.colors.body : '通风口的盖板用螺丝固定着。里面像是有一张纸。');
      case 'box': if (!f.boxOpen) modal = 'colors'; return done(f.boxOpen ? '小盒里已没有东西了，门钥匙收在物品栏。' : '小盒有四种颜色按钮。需要连续按四次，按错也可以重试。');
      case 'door': return done('门外是暖暖的阳光。找齐线索，拿到门钥匙就能出去了。');
      case 'plant': return done('绿植摇着叶子。盆里只有土，没有钥匙。');
      case 'kettle': return done('水壶里是温温的水，冒着一点水汽。');
      case 'sink': return done('水槽干干净净，旁边的通风口似乎藏着什么。');
      case 'flowers': return done('阳台上的花都开了。花盆后面的小盒很值得看看。');
      case 'window': return done('夕阳给玻璃染上了蜜桃色。卟哩也想出去走走。');
      default: return done();
    }
  }
  function hint(state, level) {
    const s = normalize(state), f = s.flags, explicit = level >= 2;
    if (s.won) return '你和卟哩已经逃出小屋。可以再玩一次。';
    if (!f.sofaSearched) return explicit ? '点击客厅沙发，抱枕下藏着小铜钥匙。' : '软软的沙发抱枕，好像压着什么。';
    if (!f.drawerOpen) return explicit ? '点物品栏的小铜钥匙，再点客厅抽屉。' : '铜色的锁和手里的钥匙很像。';
    if (!f.catFed) return explicit ? '点小鱼零食，再点客厅里的卟哩。' : '卟哩饿了，抽屉里找到了它喜欢的东西。';
    if (!f.frameSeen) return explicit ? '收起手中物品，再点客厅画框，数花、太阳和星星。' : '卟哩的卡片在说画里的三个图案。去看看画框吧。';
    if (!f.cupboardOpen) return explicit ? '花 3、太阳 1、星星 4：厨房橱柜的密码是 314。先收起物品再点橱柜。' : '花 → 太阳 → 星星，把画框里的数量按这个顺序连起来。';
    if (!f.ventOpen) return explicit ? '拿起螺丝刀，点厨房通风口。' : '有了工具，可以拆开那块带螺丝的盖板了。';
    if (!f.boxOpen) return explicit ? '到阳台，收起物品，点小盒，按：蓝 → 粉 → 黄 → 蓝。' : '通风口的色卡是阳台小盒的按钮顺序。';
    return explicit ? '拿起小屋门钥匙，点阳台的大门。' : '手里的新钥匙应该能打开最后那扇门。';
  }
  return Object.freeze({createState, normalize, serialize, act, hint, ROOMS, ITEMS});
});
