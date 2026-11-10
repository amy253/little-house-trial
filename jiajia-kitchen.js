(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JiajiaKitchen = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const recipes = Object.freeze({
    fish: { name: '香煎小鱼', emoji: '🐟', station: 'grill', seconds: 3.4, price: 12, day: 1 },
    soup: { name: '暖暖南瓜汤', emoji: '🥣', station: 'pot', seconds: 4.5, price: 15, day: 1 },
    toast: { name: '蜂蜜厚吐司', emoji: '🍞', station: 'grill', seconds: 3.8, price: 17, day: 2 },
    tea: { name: '卟哩奶茶', emoji: '🧋', station: 'bar', seconds: 4.2, price: 20, day: 3 }
  });
  const prices = [45, 85, 135];
  function integer(value, fallback, min, max) { return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback; }
  function normalizeSave(value) {
    const s = value && typeof value === 'object' ? value : {};
    return { version: 1, day: integer(s.day, 1, 1, 9999), coins: integer(s.coins, 0, 0, 9999999), cooker: integer(s.cooker, 0, 0, 3), patience: integer(s.patience, 0, 0, 3), best: integer(s.best, 0, 0, 99999), totalServed: integer(s.totalServed, 0, 0, 9999999) };
  }
  function difficulty(day) { return { quota: Math.min(18, 6 + (day - 1) * 2), patience: Math.max(20, 38 - (day - 1) * 2), interval: Math.max(3.8, 6.5 - (day - 1) * .3) }; }
  function emptyStation() { return { status: 'idle', recipe: null, progress: 0, duration: 0, readyAge: 0 }; }
  function create(save, random) {
    const normalized = normalizeSave(save), d = difficulty(normalized.day);
    return { save: normalized, random: typeof random === 'function' ? random : Math.random, status: 'idle', paused: false, day: normalized.day, elapsed: 0, stations: { grill: emptyStation(), pot: emptyStation(), bar: emptyStation() }, customers: [], held: null, arrived: 0, served: 0, missed: 0, burnt: 0, earned: 0, combo: 0, bestCombo: 0, nextArrival: 0, quota: d.quota, target: Math.ceil(d.quota * .65), catFed: false, perkLeft: 0, id: 0, events: [], summary: null };
  }
  function event(g, kind, data) { const e = Object.assign({ kind }, data || {}); g.events.push(e); if (g.events.length > 48) g.events.shift(); return e; }
  function gate(g) { if (g.paused) return event(g, 'paused'); if (g.status !== 'playing') return event(g, 'closed'); return null; }
  function unlocked(g) { return Object.keys(recipes).filter(key => recipes[key].day <= g.day); }
  function arrive(g) {
    const choices = unlocked(g), d = difficulty(g.day);
    // The first guest teaches the pan. Later orders vary with the daily menu.
    const r = g.arrived === 0 ? 'fish' : choices[Math.min(choices.length - 1, Math.floor(Math.max(0, g.random()) * choices.length))];
    const slot = [0, 1, 2].find(n => !g.customers.some(c => c.slot === n) && !g.tables?.[n]?.dirty);
    if (slot === undefined) return false;
    const patience = d.patience + g.save.patience * 4 + (g.walkingMode ? 22 : 0);
    const c = { id: ++g.id, slot, recipe: r, patience, maxPatience: patience, status: 'waiting', age: 0, face: g.arrived % 6 };
    g.customers.push(c); g.arrived++; event(g, 'arrive', { id: c.id }); return true;
  }
  function start(g) {
    if (g.status === 'playing') return event(g, 'already-open');
    g.day = g.save.day; g.status = 'playing'; g.paused = false; g.elapsed = 0; g.stations = { grill: emptyStation(), pot: emptyStation(), bar: emptyStation() }; g.customers = []; g.held = null;
    g.arrived = g.served = g.missed = g.burnt = g.earned = g.combo = g.bestCombo = 0; g.catFed = false; g.perkLeft = 0; g.summary = null; g.settledEarned = 0; g.settledServed = 0;
    const d = difficulty(g.day); g.quota = d.quota; g.target = Math.ceil(d.quota * .65); g.nextArrival = d.interval; g.events.length = 0; arrive(g); return event(g, 'start');
  }
  function cook(g, recipe) {
    const blocked = gate(g); if (blocked) return blocked;
    const r = recipes[recipe]; if (!r || r.day > g.day) return event(g, 'locked');
    const s = g.stations[r.station]; if (s.status !== 'idle') return event(g, 'busy', { station: r.station });
    Object.assign(s, { status: 'cooking', recipe, progress: 0, duration: r.seconds * (1 - .1 * g.save.cooker), readyAge: 0 });
    return event(g, 'cook', { recipe, station: r.station });
  }
  function pickup(g, station) {
    const blocked = gate(g); if (blocked) return blocked;
    const s = g.stations[station]; if (!s) return event(g, 'not-ready');
    if (s.status === 'burnt') { g.stations[station] = emptyStation(); return event(g, 'clear'); }
    if (s.status !== 'ready') return event(g, 'not-ready');
    if (g.held) return event(g, 'tray-full');
    g.held = { recipe: s.recipe }; g.stations[station] = emptyStation(); return event(g, 'pickup', { recipe: g.held.recipe });
  }
  function serve(g, id) {
    const blocked = gate(g); if (blocked) return blocked;
    const c = g.customers.find(c => c.id === id && c.status === 'waiting');
    if (!c) return event(g, 'gone'); if (!g.held) return event(g, 'empty-hand'); if (c.recipe !== g.held.recipe) return event(g, 'wrong');
    const tip = (c.patience / c.maxPatience >= .7 ? 3 : 0) + Math.min(5, Math.floor(g.combo / 3));
    const paid = recipes[c.recipe].price + tip;
    c.status = 'eating'; c.age = 0; g.held = null; g.served++; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo); g.earned += paid;
    return event(g, 'serve', { id, recipe: c.recipe, paid, tip });
  }
  function discard(g) { const blocked = gate(g); if (blocked) return blocked; if (!g.held) return event(g, 'empty-hand'); g.held = null; return event(g, 'discard'); }
  function feed(g) {
    const blocked = gate(g); if (blocked) return blocked;
    if (g.catFed) return event(g, 'cat-full'); if (!g.held || g.held.recipe !== 'fish') return event(g, 'fish-needed');
    g.held = null; g.catFed = true; g.perkLeft = 15; return event(g, 'feed');
  }
  function buy(g, upgrade) {
    if (g.status === 'playing') return event(g, 'shop-closed');
    if (upgrade !== 'cooker' && upgrade !== 'patience') return event(g, 'invalid-upgrade');
    const level = g.save[upgrade]; if (level >= 3) return event(g, 'max');
    if (g.save.coins < prices[level]) return event(g, 'poor');
    g.save.coins -= prices[level]; g.save[upgrade]++; return event(g, 'buy', { upgrade });
  }
  function finish(g) {
    if (g.status !== 'playing') return;
    const success = g.served >= g.target;
    // A failed day is already banked. Recoveries only bank the new meals and income.
    g.save.coins = Math.min(9999999, g.save.coins + Math.max(0, g.earned - (g.settledEarned || 0))); g.save.best = Math.max(g.save.best, g.earned); g.save.totalServed = Math.min(9999999, g.save.totalServed + Math.max(0, g.served - (g.settledServed || 0)));
    g.settledEarned = g.earned; g.settledServed = g.served;
    if (success) g.save.day = Math.min(9999, g.day + 1);
    g.status = 'complete'; g.held = null;
    g.summary = { day: g.day, success, served: g.served, missed: g.missed, burnt: g.burnt, earned: g.earned, bestCombo: g.bestCombo, target: g.target };
    event(g, 'complete', { success });
  }
  function tick(g, dt) {
    g.elapsed += dt;
    const perk = g.perkLeft > 0; g.perkLeft = Math.max(0, g.perkLeft - dt);
    Object.entries(g.stations).forEach(([station, s]) => {
      if (s.status === 'cooking') {
        s.progress += dt;
        if (s.progress + 1e-8 >= s.duration) { s.readyAge = Math.max(0, s.progress - s.duration); s.progress = s.duration; s.status = 'ready'; event(g, 'ready', { station, recipe: s.recipe }); }
      } else if (s.status === 'ready') s.readyAge += dt;
      if (s.status === 'ready' && s.readyAge + 1e-8 >= 12) { s.status = 'burnt'; g.burnt++; g.combo = 0; event(g, 'burn', { station }); }
    });
    g.customers.forEach(c => {
      if (c.status === 'waiting') {
        c.patience = Math.max(0, c.patience - dt * (perk ? .55 : 1));
        if (c.patience <= 1e-8) { c.status = 'leaving'; c.age = 0; g.missed++; g.combo = 0; event(g, 'miss', { id: c.id }); }
      } else c.age += dt;
    });
    g.customers = g.customers.filter(c => {const stay=c.status === 'waiting' || c.age < (c.status === 'eating' ? 2.4 : 1.1);if(!stay&&c.status==='eating'&&g.tables)g.tables[c.slot].dirty=true;return stay;});
    g.nextArrival -= dt;
    if (g.arrived < g.quota && g.nextArrival <= 1e-8 && g.customers.length < 3 && arrive(g)) g.nextArrival = difficulty(g.day).interval;
    if (g.arrived === g.quota && g.customers.length === 0 && !g.tables?.some(t=>t.dirty) && !g.held?.dirty) finish(g);
  }
  function step(g, seconds) {
    if (g.status !== 'playing' || g.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    let left = Math.min(3600, seconds);
    while (left > 1e-8 && g.status === 'playing') { const dt = Math.min(.05, left); tick(g, dt); left -= dt; }
  }
  function getSave(g) { return normalizeSave(g.save); }
  function revive(g) { if (g.status !== 'complete' || !g.summary || g.summary.success) return false; g.quota += Math.max(0, g.target - g.served); g.status = 'playing'; g.paused = false; g.summary = null; g.nextArrival = .5; g.held = null; g.events = []; return true; }
  return { revive, recipes, prices, normalizeSave, difficulty, create, start, cook, pickup, serve, discard, feed, buy, step, getSave, unlocked };
});
