// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
const KEY = 'dig-deep-descent.v030';
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min, max) => Number.isInteger(value) && finite(value, min, max);
export function validateSave(data) {
    if (!data || data.version !== 3 || !integer(data.seed, 0, 4294967295)) return false;
    const s = data.state;
    if (!s || !integer(s.x,0,24) || !integer(s.y,0,24) || !integer(s.depth,0,21)) return false;
    if (!s.tiers || !['drill','battery','storage','hull'].every(id => integer(s.tiers[id],0,6))) return false;
    if (!['balanced','prospector','ghost','bastion'].includes(s.module)) return false;
    if (!['energy','hull','heat','credits','deepest','sold','direction'].every(k => finite(s[k], k === 'direction' ? -7 : 0, 1e9))) return false;
    if (!['lost','completed'].every(k => typeof s[k] === 'boolean')) return false;
    if (!Array.isArray(s.cargo) || s.cargo.length > 60 || !s.cargo.every(o => integer(o,0,6))) return false;
    if (!Array.isArray(s.recovered) || s.recovered.length > 4 || new Set(s.recovered).size !== s.recovered.length || !s.recovered.every(o => integer(o,0,3))) return false;
    if (!Array.isArray(s.milestones) || !s.milestones.every(m => ['first','depth5','sold24','depth10','depth15','signal'].includes(m))) return false;
    if(s.tutorials!==undefined&&(!Array.isArray(s.tutorials)||!s.tutorials.every(v=>['gas','lava','unstable'].includes(v))))return false;
    for(const key of ['lastDamage','lossCause'])if(s[key]!==undefined&&![null,'gas','lava','collapse','power'].includes(s[key]))return false;
    if (!data.changes || typeof data.changes !== 'object' || Array.isArray(data.changes)) return false;
    const allowed = ['solid','hp','maxHp','ore','hazard','seen','scanned','relic','rubble','shaftDown','shaftUp','natural'];
    for (const [depth, cells] of Object.entries(data.changes)) {
        if (!integer(Number(depth),0,21) || !cells || typeof cells !== 'object') return false;
        for (const [index, patch] of Object.entries(cells)) {
            if (!integer(Number(index),0,624) || !patch || typeof patch !== 'object') return false;
            if (!Object.keys(patch).every(k => allowed.includes(k))) return false;
            for (const [k,v] of Object.entries(patch)) {
                if (['solid','seen','scanned','relic','rubble','shaftDown','shaftUp','natural'].includes(k) && typeof v !== 'boolean') return false;
                if (['hp','maxHp'].includes(k) && !finite(v,0,10000)) return false;
                if (k === 'ore' && v !== null && !integer(v,0,6)) return false;
                if (k === 'hazard' && ![null,'gas','lava','unstable'].includes(v)) return false;
            }
        }
    }
    if (!Array.isArray(data.pending) || data.pending.length > 625 || !data.pending.every(p => integer(p.x,0,24) && integer(p.y,0,24) && integer(p.depth,0,21) && finite(p.time,0,2))) return false;
    return true;
}
export function readSave(storage) {
    try { const value = storage.getItem(KEY); if (!value) return { data: null }; const data = JSON.parse(value); return validateSave(data) ? { data } : { data: null, error: 'The saved expedition could not be read. A fresh expedition is ready.' }; }
    catch { return { data: null, error: 'Local saving is unavailable. Use Export save in the flight menu to keep your progress.' }; }
}
export function writeSave(storage, game) {
    try { storage.setItem(KEY, JSON.stringify(game.snapshot())); return true; } catch { return false; }
}
