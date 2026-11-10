(function (root) {
  const WIDTH = 432, HEIGHT = 560, GRAVITY = 1280, BOUNCE = 650;
  function progress(height) { return 1 - Math.exp(-Math.max(0, height) / 700); }

  function platformX(p, time) {
    const level = progress(p.y);
    return p.x + (p.kind === 'moving' ? Math.sin(time * (2.1 + level * 2.7) + p.phase) * (22 + level * 18) : 0);
  }

  function create(random = Math.random) {
    const g = {
      random, time: 0, status: 'playing', paused: false, camera: 0,
      score: 0, bestHeight: 80, bounces: 0, axis: 0, targetX: null,
      player: { x: 216, y: 80, vy: BOUNCE },
      platforms: [{ x: 216, y: 80, w: 120, kind: 'still', phase: 0 }],
      nextY: 80, nextX: 216
    };
    generate(g, 720);
    return g;
  }

  function generate(g, upTo) {
    while (g.nextY < upTo) {
      const height = g.nextY;
      const level = progress(height);
      const gap = 82 + level * 18 + g.random() * (30 + level * 24);
      const width = 112 - level * 76;
      const drift = (g.random() * 2 - 1) * (105 + level * 50);
      const x = Math.max(width / 2 + 30, Math.min(WIDTH - width / 2 - 30, g.nextX + drift));
      const roll = g.random();
      const fragileChance = .20 + level * .23;
      const movingChance = .27 + level * .16;
      const kind = height < 330 ? 'still' : roll < fragileChance ? 'fragile' : roll < fragileChance + movingChance ? 'moving' : 'still';
      const p = { x, y: height + gap, w: width, kind, phase: g.random() * Math.PI * 2 };
      g.platforms.push(p);
      g.nextY = p.y;
      g.nextX = x;
    }
  }

  function move(g, dt) {
    if (g.targetX !== null) {
      const delta = g.targetX - g.player.x;
      g.player.x += Math.sign(delta) * Math.min(Math.abs(delta), 365 * dt);
    } else {
      g.player.x += g.axis * 365 * dt;
    }
    g.player.x = Math.max(22, Math.min(WIDTH - 22, g.player.x));
    const previousY = g.player.y;
    const previousVy = g.player.vy;
    g.player.vy -= GRAVITY * dt;
    g.player.y += previousVy * dt - GRAVITY * dt * dt / 2;

    if (previousVy <= 0 || g.player.vy <= 0) {
      for (let i = g.platforms.length - 1; i >= 0; i--) {
        const p = g.platforms[i];
        if (previousY < p.y || g.player.y > p.y) continue;
        const x = platformX(p, g.time);
        if (Math.abs(g.player.x - x) > p.w / 2 + 15 - progress(p.y) * 10) continue;
        g.player.y = p.y;
        g.player.vy = BOUNCE;
        g.bounces++;
        if (p.kind === 'fragile') g.platforms.splice(i, 1);
        break;
      }
    }

    g.bestHeight = Math.max(g.bestHeight, g.player.y - (g.revivalHeightOffset || 0));
    g.score = Math.max(g.score, Math.floor((g.bestHeight - 80) / 10));
    const cloudSpeed = g.time > 12 ? 12 + 50 * progress(g.bestHeight) : 0;
    g.camera = Math.max(g.camera + cloudSpeed * dt, g.player.y - 315);
    generate(g, g.camera + HEIGHT + 150);
    g.platforms = g.platforms.filter(p => p.y >= g.camera - 130);
    if (g.player.y < g.camera - 82) g.status = 'lost';
  }

  function step(g, dt) {
    if (g.status !== 'playing' || g.paused || !Number.isFinite(dt) || dt <= 0) return;
    let left = Math.min(dt, .12);
    while (left > 1e-8 && g.status === 'playing') {
      const part = Math.min(left, 1 / 120);
      g.time += part;
      move(g, part);
      left -= part;
    }
  }

  function revive(g) {
    if (g.status !== 'lost') return false;
    const reached = g.bestHeight + (g.revivalHeightOffset || 0);
    let p = g.platforms.find(p => p.kind === 'still' && p.y >= g.camera + 40 && p.y <= reached);
    if (!p) { p = { x: 216, y: Math.max(g.camera + 40, Math.min(reached, g.camera + 80)), w: 120, kind: 'still', phase: 0 }; g.platforms.push(p); }
    // Clouds can rise past the earned height. The forced lift and its first
    // bounce are a rescue, so subsequent height points start beyond that apex.
    if (p.y > reached) g.revivalHeightOffset = p.y + BOUNCE * BOUNCE / (2 * GRAVITY) - g.bestHeight;
    g.player = { x: platformX(p, g.time), y: p.y, vy: BOUNCE };
    g.axis = 0; g.targetX = null; g.status = 'playing'; g.paused = false;
    return true;
  }
  const api = { WIDTH, HEIGHT, BOUNCE, create, generate, platformX, step, revive };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HouseJump = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
