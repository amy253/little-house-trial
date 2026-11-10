(() => {
  const $ = id => document.getElementById(id);
  const island=window.IslandRevive?.create({id:'house-jump'});
  const canvas = $('jump'), ctx = canvas.getContext('2d');
  const portrait = new Image(); portrait.src = 'jiajia-white-20261021.webp';
  let game = HouseJump.create(), active = false, last = 0, best = 0, pointer = null;
  try { best = Number(localStorage.getItem('house-jump-best')) || 0; } catch {}

  function sync() {
    $('score').textContent = game.score;
    $('bounces').textContent = game.bounces;
    $('best').textContent = Math.max(best, game.score);
    $('kind').textContent = game.score < 25 ? '普通平台' : game.score < 75 ? '小心移动平台' : '小心碎裂平台';
  }

  function begin() {
    game = HouseJump.create();
    island?.reset();
    active = true;
    pointer = null;
    $('overlay').hidden = true;
    $('pause').textContent = '暂停';
    $('status').textContent = '手机左右拖动 · 电脑按 ← →';
    sync();
  }

  function finish() {
    active = false;
    best = Math.max(best, game.score);
    try { localStorage.setItem('house-jump-best', String(best)); } catch {}
    $('title').textContent = '家家落进云朵里啦';
    $('description').textContent = `跳到了 ${game.score} 米，完成 ${game.bounces} 次落台。再找一条向上的路吧！`;
    $('start').textContent = '再跳一次';
    $('overlay').hidden = false;
    $('status').textContent = '掉下去啦，点「再跳一次」重新挑战';
    const failed=game;island?.offer($('overlay').querySelector?.('.result-card')||$('overlay'),()=>{if(game!==failed||!HouseJump.revive(game))return false;active=true;pointer=null;last=performance.now();$('overlay').hidden=true;$('pause').textContent='暂停';island?.hide();sync();return true;},()=>game===failed&&game.status==='lost');
    sync();
  }

  function roundRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function draw(time) {
    const W = HouseJump.WIDTH, H = HouseJump.HEIGHT;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#cce9ea'); sky.addColorStop(.72, '#e7f1e5'); sky.addColorStop(1, '#f8eee0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);window.GameArt?.scene(ctx,'daySky',0,0,W,H);
    const cloudShift = game.camera * .2;
    for (let i = 0; i < 12; i++) {
      const x = (i * 149 + 37) % 480 - 20;
      const y = ((i * 173 + 64 + cloudShift) % 690) - 60;
      ctx.fillStyle = '#fffaf0aa';
      ctx.beginPath(); ctx.ellipse(x, y, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 19, y - 5, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of game.platforms) {
      const x = HouseJump.platformX(p, game.time);
      const y = H - (p.y - game.camera);
      if (y < -20 || y > H + 20) continue;
      const color = p.kind === 'fragile' ? '#e8a9ad' : p.kind === 'moving' ? '#85b3ce' : '#83b693';
      roundRect(x - p.w / 2, y - 3, p.w, 13, 7, '#637e71');
      roundRect(x - p.w / 2, y - 8, p.w, 13, 7, color);ctx.strokeStyle='#715444';ctx.lineWidth=2;ctx.stroke();
      const roof=p.kind==='fragile'?'#efbaae':p.kind==='moving'?'#b8d9ef':'#c8e2b5';roundRect(x-p.w/2+4,y-13,p.w-8,6,3,roof);
      window.GameArt?.draw(ctx,'house',x-p.w/2-6,y-19,24,25);
      ctx.strokeStyle = '#fff7ebaa'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - p.w / 2 + 10, y - 4); ctx.lineTo(x + p.w / 2 - 10, y - 4); ctx.stroke();
      if (p.kind === 'fragile') {
        ctx.strokeStyle = '#ab747c';
        ctx.beginPath(); ctx.moveTo(x - 5, y - 7); ctx.lineTo(x + 1, y); ctx.lineTo(x + 7, y - 7); ctx.stroke();
      }
    }
    const x = game.player.x, y = H - (game.player.y - game.camera);
    ctx.fillStyle = '#58755c33'; ctx.beginPath(); ctx.ellipse(x, y + 5, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (window.GameArt?.draw(ctx,'jiajia',x-34,y-72,68,74)) {}
    else if (portrait.complete && portrait.naturalWidth) ctx.drawImage(portrait, x - 31, y - 70, 62, 70);
    else { ctx.fillStyle = '#efd2b7'; ctx.beginPath(); ctx.arc(x, y - 35, 26, 0, Math.PI * 2); ctx.fill(); }
    if (game.player.vy > 0) {
      ctx.fillStyle = '#fff7d0';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - 16 + i * 16, y + 10 + Math.sin(time / 130 + i) * 2, 2, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  function frame(time) {
    const dt = Math.min(.05, (time - last) / 1000 || 0); last = time;
    if (active && !game.paused) {
      HouseJump.step(game, dt);
      sync();
      if (game.status === 'lost') finish();
    }
    draw(time);
    requestAnimationFrame(frame);
  }

  function pointerX(event) {
    return Math.max(0, Math.min(HouseJump.WIDTH, (event.clientX - canvas.getBoundingClientRect().left) * HouseJump.WIDTH / canvas.getBoundingClientRect().width));
  }
  canvas.addEventListener('pointerdown', event => {
    if (!active || game.paused) return;
    pointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    game.targetX = pointerX(event);
  });
  canvas.addEventListener('pointermove', event => { if (pointer === event.pointerId) game.targetX = pointerX(event); });
  function release(event) { if (pointer === event.pointerId) { pointer = null; game.targetX = null; } }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  window.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); game.axis = event.key === 'ArrowLeft' ? -1 : 1;
      game.targetX = null;
    }
  });
  window.addEventListener('keyup', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') game.axis = 0; });
  function pause() {
    if (!active) return;
    game.paused = !game.paused;
    $('pause').textContent = game.paused ? '继续' : '暂停';
    $('status').textContent = game.paused ? '已暂停，点继续再玩' : '手机左右拖动 · 电脑按 ← →';
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && active && !game.paused) pause(); });
  $('start').onclick = begin;
  $('restart').onclick = begin;
  $('pause').onclick = pause;
  sync(); requestAnimationFrame(frame);
})();
