(function () {
  'use strict';
  const Core = window.Buli2048;
  const island=window.IslandRevive?.create({id:'buli-2048'});island?.reset();
  const $ = (id) => document.getElementById(id);
  const board = $('board');
  const layer = $('tiles');
  const slots = $('slots');
  const dialog = $('new-dialog');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#f8edcf', '#dbeade', '#f3d8dd', '#f5ddba', '#d9e5f0', '#e5dcef', '#e9dab4', '#d3e5dd', '#edcad3', '#f3d39d', '#f3d975', '#ded1ef'];
  let game;
  let busy = false;
  let animationTimer = 0;
  let animationVersion = 0;
  let gesture = null;
  let saveAvailable = true;
  let saved = null;
  try { saved = window.localStorage.getItem(Core.SAVE_KEY); }
  catch (_) { saveAvailable = false; }
  game = Core.createGame({ save: saved });
  const resumed = !!Core.readSave(saved);

  const rows = Array.from({ length: 4 }, () => {
    const row = document.createElement('div'); row.className = 'slot-row';
    row.setAttribute('role', 'row'); slots.append(row); return row;
  });
  const cells = Array.from({ length: 16 }, (_, index) => {
    const cell = document.createElement('div');
    cell.className = 'slot';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-rowindex', String(Math.floor(index / 4) + 1));
    cell.setAttribute('aria-colindex', String(index % 4 + 1));
    rows[Math.floor(index / 4)].append(cell);
    return cell;
  });

  function announce(text) { $('announcement').textContent = text; }
  function persist() {
    try { window.localStorage.setItem(Core.SAVE_KEY, Core.serialize(game)); }
    catch (_) { saveAvailable = false; }
    $('save-note').hidden = saveAvailable;
  }
  function tier(value) { return Math.min(11, Math.max(0, Math.round(Math.log2(value)) - 1)); }
  function place(node, index) {
    const gap = parseFloat(window.getComputedStyle(board).getPropertyValue('--gap')) || 8;
    const step = (layer.clientWidth + gap) / 4;
    node.style.transform = 'translate(' + (index % 4 * step) + 'px,' + (Math.floor(index / 4) * step) + 'px)';
  }
  function tile(value, index) {
    const level = tier(value);
    const node = document.createElement('div');
    node.className = 'tile';
    node.dataset.tier = String(level + 1);
    node.dataset.digits = String(Math.min(5, String(value).length));
    node.style.setProperty('--tile-color', colors[level]);
    const inner = document.createElement('div');
    inner.className = 'tile-inner';
    const number = document.createElement('span');
    number.className = 'tile-number'; number.textContent = String(value);
    inner.append(number);
    node.append(inner);
    place(node, index);
    return node;
  }
  function cancelAnimation() {
    animationVersion++;
    clearTimeout(animationTimer);
    busy = false;
  }
  function renderTiles(result) {
    layer.replaceChildren();
    game.board.forEach((value, index) => {
      if (!value) return;
      const node = tile(value, index);
      if (result && result.merged.includes(index)) node.classList.add('merged');
      if (result && result.spawned && result.spawned.index === index) node.classList.add('spawn');
      layer.append(node);
    });
  }
  function renderStats() {
    $('score').textContent = String(game.score);
    $('best').textContent = String(game.best);
    $('moves').textContent = game.moves + ' 步';
    const largest = Math.max(...game.board);
    $('milestone').textContent = '最大数字 · ' + largest;
    $('undo').disabled = busy || !game.previous;
    $('overlay-undo').disabled = busy || !game.previous;
    cells.forEach((cell, index) => cell.setAttribute('aria-label', '第' + (Math.floor(index / 4) + 1) + '行，第' + (index % 4 + 1) + '列：' + (game.board[index] || '空格')));
  }
  function renderResult() {
    const status = Core.status(game);
    if (status === 'lost') {
      island?.offer($('result-card'), () => {
        if (!Core.revive(game)) return false;
        cancelAnimation(); gesture = null;
        $('score-gain').textContent = '';
        persist(); render(); board.focus({ preventScroll: true });
        return true;
      }, () => Core.status(game) === 'lost');
    } else island?.hide();
    $('overlay').hidden = status === 'playing';
    $('game-shell').inert = status !== 'playing';
    if (status === 'playing') return;
    const won = status === 'won';
    $('continue').hidden = !won;
    $('result-kicker').textContent = '卟哩2048';
    $('result-title').textContent = won ? '合到 2048 啦！' : '这局先歇一会儿';
    $('result-copy').textContent = won ? '继续合成，挑战 4096。' : '本局 ' + game.score + ' 分。棋盘已经没有可走的方向。';
    announce(won ? '恭喜合到2048！可以继续挑战，也可以撤销或开始新局。' : '棋盘已经没有可移动的方向。可以撤销刚才一步，或再来一局。');
    (won ? $('continue') : game.previous ? $('overlay-undo') : $('try-again')).focus({ preventScroll: true });
  }
  function render(result) { renderTiles(result); renderStats(); renderResult(); }
  function animate(result) {
    if (reducedMotion.matches) { render(result); return; }
    busy = true;
    renderStats();
    const version = ++animationVersion;
    layer.replaceChildren();
    const pieces = result.transitions.map((transition) => {
      const node = tile(transition.value, transition.from);
      layer.append(node);
      return { node, transition };
    });
    // Flush the original positions before the transition starts.
    layer.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (version !== animationVersion) return;
      pieces.forEach(({ node, transition }) => place(node, transition.to));
    });
    animationTimer = setTimeout(() => {
      if (version !== animationVersion) return;
      busy = false;
      render(result);
    }, 155);
  }
  function move(direction) {
    if (busy || dialog.open || document.hidden) return;
    const result = Core.move(game, direction);
    if (!result.changed) {
      if (Core.status(game) === 'playing') announce('这个方向挪不动，试试别的方向吧。');
      return;
    }
    persist();
    if (result.gained) {
      $('score-gain').textContent = '+' + result.gained;
      $('score-gain').classList.remove('gain-pop');
      $('score-gain').getBoundingClientRect();
      $('score-gain').classList.add('gain-pop');
    } else $('score-gain').textContent = '';
    announce(result.gained ? '合并 +' + result.gained + ' 分' : '新数字已加入棋盘');
    animate(result);
  }
  function reset() {
    island?.reset();
    cancelAnimation(); gesture = null;
    game = Core.createGame({ best: game.best });
    $('score-gain').textContent = '';
    persist(); render(); announce('试着把两个 2 合成 4。');
    board.focus({ preventScroll: true });
  }
  function requestNew() {
    gesture = null;
    if (game.moves > 0) {
      dialog.showModal();
      $('cancel-new').focus();
    } else reset();
  }
  function undo() {
    if (busy || !Core.undo(game)) return;
    $('score-gain').textContent = '';
    persist(); render(); announce('退回刚才一步，最高纪录保留。');
    board.focus({ preventScroll: true });
  }
  $('undo').addEventListener('click', undo);
  $('overlay-undo').addEventListener('click', undo);
  $('new-game').addEventListener('click', requestNew);
  $('try-again').addEventListener('click', requestNew);
  $('cancel-new').addEventListener('click', () => {
    dialog.close();
    (Core.status(game) === 'playing' ? board : $('try-again')).focus({ preventScroll: true });
  });
  $('confirm-new').addEventListener('click', () => { dialog.close(); reset(); });
  $('continue').addEventListener('click', () => {
    Core.keepPlaying(game); persist(); render();
    if (Core.status(game) === 'playing') {
      announce('猫猫王继续出发，下一站 4096！'); board.focus({ preventScroll: true });
    }
  });
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || dialog.open ||
        event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
    if (event.target !== board && event.target !== document.body) return;
    const direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault(); move(direction);
  });
  board.addEventListener('pointerdown', (event) => {
    if (event.isPrimary === false) { gesture = null; return; }
    if (event.button !== 0 || busy || dialog.open || Core.status(game) !== 'playing' ||
        event.target.closest('button')) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    board.setPointerCapture(event.pointerId);
    board.focus({ preventScroll: true });
  });
  board.addEventListener('pointerup', (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointercancel', () => { gesture = null; });
  board.addEventListener('lostpointercapture', () => { gesture = null; });

  // Some mobile browsers still handle double taps on scrollable panels.
  let tapStart = null;
  let lastTap = null;
  document.addEventListener('dblclick', (event) => event.preventDefault());
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) {
      tapStart = lastTap = null;
      return;
    }
    const touch = event.touches[0];
    tapStart = { x: touch.clientX, y: touch.clientY, time: event.timeStamp };
  }, { passive: true });
  document.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (tapStart && Math.hypot(touch.clientX - tapStart.x, touch.clientY - tapStart.y) > 8) {
      tapStart = lastTap = null;
    }
  }, { passive: true });
  document.addEventListener('touchcancel', () => { tapStart = lastTap = null; });
  document.addEventListener('touchend', (event) => {
    const start = tapStart;
    tapStart = null;
    if (!start || event.touches.length || event.changedTouches.length !== 1) return;
    const { clientX: x, clientY: y } = event.changedTouches[0];
    const time = event.timeStamp;
    if (time - start.time >= 300 || Math.hypot(x - start.x, y - start.y) > 8) {
      lastTap = null;
      return;
    }
    if (lastTap && time - lastTap.time < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 28) {
      event.preventDefault();
    }
    lastTap = { x, y, time };
  }, { passive: false });

  window.addEventListener('blur', () => { gesture = null; cancelAnimation(); render(); });
  document.addEventListener('visibilitychange', () => {
    gesture = null;
    if (document.hidden) { cancelAnimation(); renderTiles(); renderStats(); }
    else render();
  });
  window.addEventListener('resize', () => { cancelAnimation(); render(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { cancelAnimation(); render(); }).observe(board);
  persist(); render();
  if (Core.status(game) === 'playing') announce(resumed ? '已恢复上次的棋盘。' : '试着把两个 2 合成 4。');
})();
