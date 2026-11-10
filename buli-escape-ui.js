(function(root, factory) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./buli-escape.js') : root.BuliEscape);
  if (node) module.exports = api;
  else {root.BuliEscapeUI = api; api.mount(root.document);}
})(typeof globalThis !== 'undefined' ? globalThis : this, function(G) {
  'use strict';
  const SAVE_KEY = 'buli-escape-save';
  function guidance(state) {
    const s = G.normalize(state), f = s.flags;
    if (s.won) return {done:true, stage:4, title:'门打开啦，和卟哩去晒太阳！', text:'你已找到钥匙，完成这次小屋冒险。', action:null};
    const steps = [
      [!f.sofaSearched,1,'living','sofa',null,'先找一把小钥匙','点客厅里金色框的沙发，看看抱枕下面。'],
      [!f.drawerOpen,1,'living','drawer','smallKey','用小钥匙打开抽屉','先拿起小铜钥匙，再点金色框的抽屉使用。'],
      [!f.catFed,1,'living','buli','snack','把小鱼零食喂给卟哩','先拿起小鱼零食，再点卟哩。它会帮你找线索。'],
      [!f.frameSeen,2,'living','frame',null,'看看画框里的图案','点金色框的画框，记下花、太阳、星星的数量。'],
      [!f.cupboardOpen,2,'kitchen','cupboard',null,'解开厨房的数字锁','切到厨房，点数字橱柜。结合画框数量和爪印卡的顺序想出三位密码。'],
      [!f.ventOpen,3,'kitchen','vent','screwdriver','用螺丝刀拆开通风口','拿起螺丝刀，再点金色框的通风口，找里面的线索。'],
      [!f.boxOpen,3,'balcony','box',null,'打开阳台的彩色小盒','切到阳台，点彩色小盒。按线索本里的色卡顺序输入。'],
      [true,4,'balcony','door','doorKey','拿门钥匙，打开大门','先拿起小屋门钥匙，再点阳台旁的大门，带卟哩出门。']
    ];
    const [,stage,room,target,item,title,text] = steps.find(step => step[0]);
    let action, label;
    if (s.room !== room) {action={type:'room',room};label='去'+G.ROOMS[room];}
    else if (s.selected && s.selected !== item) {action={type:'select',item:null};label='先收起手中物品';}
    else if (item && s.selected !== item) {action={type:'select',item};label='拿起'+G.ITEMS[item].name;}
    else {action={type:'locate',target};label='指出要点的位置';}
    return {done:false,stage,room,target,item,title,text,action,label};
  }
  function createSession(storage) {
    let state = G.createState(), available = !!storage;
    if (storage) {
      let raw = null;
      try {raw = storage.getItem(SAVE_KEY);}
      catch (_) {available = false;}
      if (raw) {
        try {state = G.normalize(JSON.parse(raw));}
        catch (_) {state = G.createState();}
      }
    }
    return {
      getState:() => G.normalize(state),
      storageAvailable:() => available,
      dispatch(action) {
        const result = G.act(state, action);
        state = result.state;
        if (storage) {
          try {storage.setItem(SAVE_KEY, G.serialize(state));}
          catch (_) {available = false;}
        }
        return {...result, state:G.normalize(state)};
      }
    };
  }
  const ICONS = {
    smallKey:'<circle cx="12" cy="13" r="7" fill="none" stroke="#b8975e" stroke-width="4"/><path d="M18 18L30 30M25 25L29 21M29 29L33 25" fill="none" stroke="#b8975e" stroke-width="4"/>',
    doorKey:'<circle cx="12" cy="13" r="7" fill="none" stroke="#9eaf80" stroke-width="4"/><path d="M18 18L30 30M25 25L29 21M29 29L33 25" fill="none" stroke="#9eaf80" stroke-width="4"/>',
    snack:'<path d="M8 8H30L28 33H10Z" fill="#d8aa81"/><path d="M9 10H29" stroke="#a27a59" stroke-width="3"/><path d="M13 21Q21 12 26 21Q20 29 13 21L9 16V26Z" fill="#fff0cd"/><circle cx="24" cy="20" r="1" fill="#a17a53"/>',
    screwdriver:'<path d="M27 9L13 23" stroke="#9caaa3" stroke-width="5"/><path d="M28 5L33 10L28 13L25 10Z" fill="#82968c"/><path d="M6 26L13 19L20 26L13 33Q8 38 3 33Z" fill="#ba8871"/>'
  };
  function mount(doc) {
    if (!doc || !G) return;
    const $ = id => doc.getElementById(id);
    if (!$('scene')) return;
    let storage = null;
    try {storage = doc.defaultView.localStorage;} catch (_) {}
    const session = createSession(storage);
    const scene = $('scene'), dialog = $('puzzle-dialog'), help = $('help-dialog');
    let puzzle = null, sequence = [], hintLevel = 0, soundEnabled = false, audio = null;
    const colorNames = {sky:'蓝', rose:'粉', gold:'黄', sage:'绿'};
    const completedTargets = {sofa:'sofaSearched', drawer:'drawerOpen', frame:'frameSeen', buli:'catFed', cupboard:'cupboardOpen', vent:'ventOpen', box:'boxOpen', door:'doorOpen'};
    // Repaint the actual room vectors, keeping the clue diagrams and hit areas intact.
    const roomPalette={'#c88675':'#eeb188','#da9a87':'#f6c199','#b87868':'#d58d68','#adbdad':'#a3cebb','#d5a99a':'#e8d0ab','#d0ab82':'#f0c794','#c59972':'#d8aa79','#b0845f':'#bf9065','#e8d9c5':'#fff1d8','#c7a78b':'#d9b78f','#e1e9da':'#e0efd6','#a8bfae':'#b9dcca','#90ab99':'#9fcab3','#c5c6ad':'#c0d9bb','#dbd7bf':'#edf0d7'};
    doc.querySelectorAll('.room-art [fill]').forEach(shape=>{const fill=shape.getAttribute('fill');if(roomPalette[fill])shape.setAttribute('fill',roomPalette[fill]);});
    doc.querySelectorAll('.sofa-art,.drawer-art,.cupboard-art,.kettle-art,.door-art,.flowerpots-art,.box-art').forEach(group=>{group.setAttribute('stroke','#76513c');group.setAttribute('stroke-width','2.7');group.setAttribute('stroke-linejoin','round');});
    function paintCat(){const url=window.GameArt?.spriteUrl('cat');if(url)doc.querySelectorAll('.buli img,.win-overlay img').forEach(img=>{img.src=url;});}
    paintCat();doc.addEventListener('game-art-ready',()=>{paintCat();render();});
    function el(tag, className, text) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    }
    function journal(container, state) {
      container.replaceChildren();
      if (!state.journal.length) {
        container.append(el('p', 'empty-notes', '第一页还空着。去房间里找找吧。'));
        return;
      }
      state.journal.forEach((clue, index) => {
        const article = el('article', 'clue-note');
        const heading = el('h3');
        heading.append(el('span', 'clue-number', '0' + (index + 1)), doc.createTextNode(clue.title));
        article.append(heading, el('p', '', clue.body));
        container.append(article);
      });
    }
    function render() {
      const s = session.getState(), f = s.flags;
      doc.querySelectorAll('[data-panel]').forEach(panel => {panel.hidden = panel.dataset.panel !== s.room;});
      doc.querySelectorAll('[data-room]').forEach(button => {button.setAttribute('aria-pressed', String(button.dataset.room === s.room));});
      scene.setAttribute('aria-label', G.ROOMS[s.room] + '，点击房间里的物件');
      $('room-stamp').textContent = G.ROOMS[s.room] + ' · 午后 04:30';
      for (const [key, css] of Object.entries({sofaSearched:'sofa-searched', drawerOpen:'drawer-open', catFed:'cat-fed', cupboardOpen:'cupboard-open', ventOpen:'vent-open', boxOpen:'box-open', doorOpen:'won'})) scene.classList.toggle(css, f[key]);
      const cat = doc.querySelector('[data-target="buli"]');
      cat.classList.toggle('cat-fed', f.catFed);
      if (!f.catFed) cat.classList.remove('feeding');
      doc.querySelectorAll('[data-target]').forEach(button => {
        button.classList.toggle('completed', !!f[completedTargets[button.dataset.target]]);
        button.disabled = s.won;
      });
      doc.querySelectorAll('[data-room]').forEach(button => {button.disabled = s.won;});
      const next = guidance(s);
      const explicit = hintLevel >= 2 && !next.done;
      const showHint = hintLevel > 0 && !next.done;
      $('task-card').classList.toggle('has-hint', showHint);
      $('task-heading').hidden = !showHint;
      $('task-text').hidden = !showHint;
      $('task-action').hidden = !explicit;
      $('task-dismiss').hidden = !showHint;
      $('task-title').textContent = explicit ? next.title : '留意房间里的细节';
      $('task-text').textContent = showHint ? G.hint(s,hintLevel) : '';
      $('task-step').textContent = explicit ? '明确提示' : '一点线索';
      $('task-action').textContent = next.label || '已经出门啦';
      $('task-action').disabled = next.done;
      $('task-hint').disabled = next.done;
      $('task-hint').textContent = hintLevel === 1 ? '再明确一点' : hintLevel >= 2 ? '查看提示' : '需要提示';
      doc.querySelectorAll('[data-target]').forEach(button => button.classList.toggle('recommended',explicit&&button.dataset.target===next.target&&s.room===next.room));
      doc.querySelectorAll('[data-room]').forEach(button => button.classList.toggle('recommended',explicit&&s.room!==next.room&&button.dataset.room===next.room));
      const progress = Object.values(f).filter(Boolean).length;
      $('progress-label').textContent = '已发现 ' + progress + ' / 8';
      $('progress-fill').style.width = (progress / 8 * 100) + '%';
      $('save-label').textContent = session.storageAvailable() ? '进度自动保存' : '本次可玩 · 浏览器未能保存';
      const inventory = $('inventory');
      inventory.replaceChildren();
      if (!s.inventory.length) inventory.append(el('div', 'inventory-empty', s.won ? '门钥匙已经用上，冒险完成！' : '口袋还空着，先找找房间里的小物件。'));
      for (const item of s.inventory) {
        const button = el('button', 'item-button');
        button.type = 'button';
        button.dataset.item = item;
        button.classList.toggle('recommended',explicit&&next.item===item&&s.selected!==item);
        button.setAttribute('aria-pressed', String(s.selected === item));
        button.disabled = s.won;
        const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox','0 0 40 40');
        icon.setAttribute('aria-hidden','true');
        icon.innerHTML = ICONS[item];
        const label = el('span');
        label.append(el('strong','',G.ITEMS[item].name), el('small','',s.selected === item ? '已拿起 · 点物件使用' : G.ITEMS[item].detail));
        const art=window.GameArt?.spriteUrl(item==='snack'?'fish':item==='smallKey'||item==='doorKey'?'key':null);
        if(art){const image=el('img','comic-inventory');image.src=art;image.alt='';button.append(image,label);}else button.append(icon, label);
        inventory.append(button);
      }
      $('item-count').textContent = s.inventory.length;
      $('put-away').hidden = !s.selected;
      $('inventory-help').textContent = s.selected ? '手中拿着「' + G.ITEMS[s.selected].name + '」。点物件使用，或先收起再查看。' : '找到物品后，先拿起，再点房间里的物件使用。';
      journal($('journal'), s);
      if (dialog.open) journal($('modal-journal'), s);
      $('win-panel').hidden = !s.won;
      $('hint-button').disabled = s.won;
    }
    function tone(effect) {
      if (!soundEnabled || doc.hidden) return;
      try {
        const Context = doc.defaultView.AudioContext || doc.defaultView.webkitAudioContext;
        if (!Context) return;
        audio = audio || new Context();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
        const now = audio.currentTime, notes = effect === 'win' ? [523,659,784,1046] : effect === 'wrong' ? [220,196] : [659,784];
        notes.forEach((frequency,index) => {
          const oscillator = audio.createOscillator(), gain = audio.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0,now + index * .11);
          gain.gain.linearRampToValueAtTime(.035,now + index * .11 + .015);
          gain.gain.exponentialRampToValueAtTime(.001,now + index * .11 + .2);
          oscillator.connect(gain); gain.connect(audio.destination);
          oscillator.start(now + index * .11); oscillator.stop(now + index * .11 + .23);
          oscillator.onended = () => {oscillator.disconnect(); gain.disconnect();};
        });
      } catch (_) {}
    }
    function dispatch(action) {
      const before = session.getState();
      const result = session.dispatch(action);
      if (JSON.stringify(before.flags) !== JSON.stringify(result.state.flags)) {
        hintLevel = 0;
        $('hint-button').textContent = '需要一点提示';
        $('hint-text').textContent = '新线索已经收好了，继续找找看。';
      }
      render();
      if (result.message) $('message').textContent = result.message;
      $('message').parentElement.className = 'narration ' + result.effect;
      if (['reward','feed','win','wrong'].includes(result.effect)) tone(result.effect);
      if (result.effect === 'feed') doc.querySelector('[data-target="buli"]').classList.add('feeding');
      if (result.modal) openPuzzle(result.modal);
      if (result.effect === 'win') $('replay-button').focus({preventScroll:true});
      return result;
    }
    function drawSequence() {
      const output = $('color-sequence');
      output.replaceChildren();
      for (let i = 0; i < 4; i++) output.append(el('span', 'sequence-chip ' + (sequence[i] || 'empty'), sequence[i] ? colorNames[sequence[i]] : String(i + 1)));
      doc.querySelectorAll('[data-color]').forEach(button => {button.disabled = sequence.length >= 4;});
      output.setAttribute('aria-label', '已输入的颜色：' + (sequence.map(c => colorNames[c]).join('，') || '还没有输入'));
    }
    function closePuzzle() {dialog.close(); puzzle = null; sequence = [];}
    function openPuzzle(type) {
      puzzle = type; sequence = [];
      $('modal-title').textContent = type === 'number' ? '薄荷橱柜的数字锁' : '阳台小盒的颜色锁';
      $('modal-description').textContent = type === 'number' ? '按卟哩的顺序，读出画中三类图案的数量。' : '照着通风口色卡，从左到右按下四个颜色。可以重复按同一个颜色。';
      $('number-puzzle').hidden = type !== 'number'; $('color-puzzle').hidden = type !== 'colors';
      $('modal-feedback').textContent = ''; $('modal-journal').hidden = true;
      $('code-input').value = ''; drawSequence();
      journal($('modal-journal'), session.getState());
      if (!dialog.open) dialog.showModal();
      if (type === 'number') $('code-input').focus();
      else doc.querySelector('[data-color]').focus();
    }
    doc.querySelectorAll('[data-target]').forEach(button => button.addEventListener('click', () => dispatch({type:'inspect',target:button.dataset.target})));
    doc.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => dispatch({type:'room',room:button.dataset.room})));
    $('inventory').addEventListener('click', event => {const button = event.target.closest('[data-item]'); if (button) dispatch({type:'select',item:button.dataset.item});});
    $('put-away').addEventListener('click', () => dispatch({type:'select',item:null}));
    function requestHint() {hintLevel=Math.min(2,hintLevel+1);$('hint-text').textContent=G.hint(session.getState(),hintLevel);$('hint-button').textContent=hintLevel<2?'再明确一点':'查看当前提示';render();}
    $('hint-button').addEventListener('click',requestHint);
    $('task-hint').addEventListener('click',requestHint);
    $('task-dismiss').addEventListener('click', () => {
      hintLevel = 0;
      $('hint-button').textContent = '需要一点提示';
      $('hint-text').textContent = '没有时间限制，卟哩会陪你。';
      render();
    });
    $('restart-button').addEventListener('click', restart);
    $('replay-button').addEventListener('click', restart);
    function restart() {
      if (dialog.open) closePuzzle();
      if (help.open) help.close();
      puzzle = null; sequence = []; hintLevel = 0;
      dispatch({type:'restart'});
      $('hint-button').textContent = '需要一点提示'; $('hint-text').textContent = '没有时间限制，卟哩会陪你。';
      doc.querySelector('[data-target="sofa"]').focus({preventScroll:true});
    }
    $('modal-close').addEventListener('click',closePuzzle);
    dialog.addEventListener('cancel', () => {puzzle = null; sequence = [];});
    $('code-input').addEventListener('input', event => {event.target.value = event.target.value.replace(/[^0-9]/g,'').slice(0,3);});
    doc.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => {
      if (puzzle !== 'colors' || sequence.length >= 4) return;
      sequence.push(button.dataset.color); drawSequence(); $('modal-feedback').textContent = '';
    }));
    $('clear-colors').addEventListener('click', () => {sequence = []; drawSequence(); $('modal-feedback').textContent = '';});
    $('puzzle-form').addEventListener('submit', event => {
      event.preventDefault();
      if (!puzzle || !dialog.open) return;
      const result = dispatch(puzzle === 'number' ? {type:'code',target:'cupboard',code:$('code-input').value} : {type:'colors',colors:sequence.slice()});
      if (result.effect === 'reward') closePuzzle();
      else {
        $('modal-feedback').textContent = result.message;
        if (puzzle === 'number') {$('code-input').focus(); $('code-input').select();}
        else {sequence = []; drawSequence(); doc.querySelector('[data-color]').focus();}
      }
    });
    $('modal-journal-button').addEventListener('click', () => {$('modal-journal').hidden = !$('modal-journal').hidden;});
    $('task-action').addEventListener('click', () => {
      if (hintLevel < 2) return;
      const next=guidance(session.getState());
      if (!next.action) return;
      if (next.action.type !== 'locate') dispatch(next.action);
      const updated=guidance(session.getState());
      const target=doc.querySelector('[data-target="'+updated.target+'"]');
      if (target && session.getState().room===updated.room) {
        target.focus({preventScroll:true});
        target.scrollIntoView({block:'center',behavior:doc.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      }
    });
    $('help-button').addEventListener('click', () => {if (!help.open) help.showModal();});
    for (const id of ['help-close','help-start']) $(id).addEventListener('click', () => help.close());
    $('sound-toggle').addEventListener('click', () => {soundEnabled = !soundEnabled; $('sound-toggle').setAttribute('aria-pressed',String(soundEnabled)); $('sound-toggle').textContent = '声音：' + (soundEnabled ? '开' : '关'); if (soundEnabled) tone('reward'); else if (audio) audio.suspend().catch(() => {});});
    doc.addEventListener('visibilitychange', () => {doc.body.classList.toggle('backgrounded',doc.hidden); if (doc.hidden && audio) audio.suspend().catch(() => {});});
    doc.querySelector('[data-target="buli"]').addEventListener('animationend', event => {if (event.animationName === 'buli-eat') event.currentTarget.classList.remove('feeding');});
    doc.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {img.style.opacity = '0';}));
    render();
    if (session.getState().won) $('message').textContent = '门已经打开。卟哩等你一起出门晒太阳！';
    else if (Object.values(session.getState().flags).some(Boolean)) $('message').textContent = '欢迎回来！物品和线索都还在，我们继续找门钥匙吧。';
  }
  return Object.freeze({createSession, guidance, mount, SAVE_KEY});
});
