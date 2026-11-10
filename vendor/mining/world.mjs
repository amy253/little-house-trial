// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
import { Grid } from './grid.mjs';
import { TerrainGenerator } from './terrain-generator.mjs';
import { PerlinNoise } from './perlin-noise.mjs';
import { ZLevelDistribution } from './z-level-distribution.mjs';
import { SIZE, random, rockHitPoints } from './config.mjs';

// The original five-scale terrain generator still shapes every stratum.
// A seeded random source makes saves compact: only changed cells are persisted.
export class World {
    constructor(seed = Date.now() >>> 0, changes = {}) {
        this.seed = seed; this.levels = new Map(); this.changes = changes; this.revision = 0;
        this.shaftNetworks = this.generateShaftNetworks();
    }
    level(depth) {
        if (this.levels.has(depth)) return this.levels.get(depth);
        const rng = random(this.seed + depth * 7919);
        const grid = new Grid();
        const noise = new PerlinNoise(rng);
        const distribution = new ZLevelDistribution(rng);
        const generator = new TerrainGenerator(noise, distribution);
        generator.generate(-depth * 4, grid);
        const raw = grid.getGridAtZLevel(-depth * 4);
        const cells = [];
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
            const source = raw[y][x];
            const density = noise.getNoise(x * .14 + 2, y * .14 + 2, depth * .13);
            const solid = !!source || density > -.12;
            const hardnessVariation = rng();
            let ore = rng() < .19 ? Math.min(6, Math.floor(rng() * (2 + depth / 3))) : null;
            if (source?.getMineral()) ore = Math.min(6, Math.floor(rng() * (2 + depth / 3)));
            const rockDensity = source ? 1 + Math.log2(source.getRock().getHitPoints() / 400) * .38 : 1;
            const hp = rockHitPoints(depth, rockDensity, hardnessVariation);
            let hazard = null;
            const roll = rng();
            if (depth >= 8 && roll < .055) hazard = 'lava';
            else if (depth >= 6 && roll < .092) hazard = 'gas';
            else if (depth >= 4 && roll < .15) hazard = 'unstable';
            const cell = { x, y, solid, hp, maxHp: hp, ore: solid ? ore : null, hazard, seen: false, scanned: false, relic: false };
            if (hazard === 'lava') { cell.solid = false; cell.ore = null; }
            cells.push(cell);
        }
        // A legible, safe starting area and a guaranteed first upgrade economy.
        if (depth === 0) {
            for (const c of cells) {
                if (Math.hypot(c.x - 12, c.y - 12) < 3.2) { c.solid = false; c.ore = null; }
            }
            for (const [x, y] of [[15,12],[15,11],[15,13],[14,14],[12,15],[11,15],[9,12],[9,11]]) {
                Object.assign(cells[y * SIZE + x], { solid: true, ore: 0, hp: 42, maxHp: 42 });
            }
        }
        if ([5,10,15,20].includes(depth)) {
            const c = cells[(10 + depth / 5) * SIZE + 15];
            Object.assign(c, { relic: true, solid: false, ore: null, hazard: null });
        }
        // Each natural connection is seeded by its upper stratum, so generating
        // the lower endpoint first gives the same paired vertical passage.
        for(const direction of ['shaftDown','shaftUp']) {
            const upper=direction==='shaftDown'?depth:depth-1;
            if(upper<0||upper>=21)continue;
            for(const [x,y] of this.naturalShafts(upper)) Object.assign(cells[y*SIZE+x],{solid:false,ore:null,hazard:null,[direction]:true,natural:true});
        }
        for (const [index, patch] of Object.entries(this.changes[depth] || {})) Object.assign(cells[index], patch);
        this.levels.set(depth, cells);
        return cells;
    }
    naturalShafts(upperDepth) {
        return this.shaftNetworks.filter(n=>n.top<=upperDepth&&n.bottom>upperDepth).map(n=>[n.x,n.y]);
    }
    generateShaftNetworks() {
        const rng=random(this.seed+473823),networks=[];
        for(let i=0;i<16;i++) {
            let x,y;
            do {x=4+Math.floor(rng()*17);y=4+Math.floor(rng()*17);}while(Math.hypot(x-12,y-12)<6||networks.some(n=>n.x===x&&n.y===y));
            const top=i<11?i*2:i===11?0:Math.floor(rng()*20);
            const length=i<11?2+i%4:1+Math.floor(rng()*6);
            networks.push({x,y,top,bottom:Math.min(21,top+length)});
        }
        return networks;
    }
    cell(depth, x, y) { return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : this.level(depth)[y * SIZE + x]; }
    change(depth, cell, patch) {
        Object.assign(cell, patch);
        const changes = this.changes[depth] ||= {};
        changes[cell.y * SIZE + cell.x] = { ...changes[cell.y * SIZE + cell.x], ...patch };
        this.revision++;
    }
    reveal(depth, x, y, range, scan = false) {
        for (const c of this.level(depth)) {
            if (Math.hypot(c.x - x, c.y - y) <= range && (!c.seen || (scan && !c.scanned))) this.change(depth, c, scan ? { seen: true, scanned: true } : { seen: true });
        }
    }
}
