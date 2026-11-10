// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
import { World } from './world.mjs';
import { UPGRADES, ORES, LOGS, MODULES, DRILL_POWER } from './config.mjs';

export class Expedition {
    constructor(saved = null) {
        this.world = new World(saved?.seed, saved?.changes);
        this.state = {
            x: 12, y: 12, depth: 0, energy: 320, hull: 100, heat: 0, credits: 0,
            cargo: [], tiers: { drill: 0, battery: 0, storage: 0, hull: 0 }, module: 'balanced',
            deepest: 0, sold: 0, recovered: [], milestones: [],
            direction: 0, lost: false, completed: false, tutorials: [], lastDamage: null, lossCause: null, ...(saved?.state || {}),
        };
        this.events = [];
        this.pending = saved?.pending || [];
        this.cooldown = 0; this.scanCooldown = 0; this.transition = 0; this.damageNoticeCooldown = 0;
        this.energyWarningBand = 0; this.energyAlertCooldown = 0;
        this.world.level(this.state.depth);
        this.reveal();
    }
    get stats() {
        const s = this.state;
        return { power: DRILL_POWER[s.tiers.drill], energy: 320 + s.tiers.battery * 100,
            capacity: 12 + s.tiers.storage * 8 - (s.module === 'bastion' ? 3 : 0),
            hull: 100 + s.tiers.hull * 30 - (s.module === 'prospector' ? 20 : 0),
            maxDepth: 3 + s.tiers.drill * 3 };
    }
    get cargoValue() { return this.state.cargo.reduce((sum, ore) => sum + ORES[ore].value, 0) * (this.state.module === 'prospector' ? 1.25 : 1); }
    emit(type, data = {}) { this.events.push({ type, ...data }); }
    message(text, tone = 'info') { this.emit('message', { text, tone }); }
    reveal() { const s = this.state; this.world.reveal(s.depth, s.x, s.y, 5); }
    cost(id) { return Math.round(UPGRADES[id].base * 1.67 ** this.state.tiers[id]); }
    buy(id) {
        const spec = UPGRADES[id]; const s = this.state;
        if (!spec || s.depth !== 0 || s.lost || s.tiers[id] >= spec.max || s.credits < this.cost(id)) return false;
        s.credits -= this.cost(id); s.tiers[id]++;
        s.energy = this.stats.energy; s.hull = this.stats.hull;
        this.emit('purchase'); this.message(`${spec.name}已升级到 ${s.tiers[id] + 1} 级`); this.emit('save'); return true;
    }
    fit(id) {
        if (this.state.depth !== 0 || this.state.lost || !MODULES[id] || (id !== 'balanced' && this.state.recovered.length === 0)) return false;
        if (this.state.cargo.length > 12 + this.state.tiers.storage * 8 - (id === 'bastion' ? 3 : 0)) return false;
        this.state.module = id; this.state.hull = this.stats.hull; this.emit('save'); return true;
    }
    service() { this.state.energy = this.stats.energy; this.state.hull = this.stats.hull; this.state.heat = 0; }
    dock() {
        if (this.state.depth !== 0 || this.state.lost) return false;
        this.service(); this.emit('dock'); this.emit('save'); return true;
    }
    sell() {
        const s = this.state;
        if (s.depth !== 0 || s.lost || !s.cargo.length) return false;
        const value = Math.round(this.cargoValue); s.credits += value; s.sold += s.cargo.length; s.cargo = [];
        this.service(); this.message(`矿石已出售，获得 ${value} 金币`, 'good'); this.emit('purchase'); this.contracts(); this.emit('save'); return true;
    }
    contracts() {
        const s = this.state;
        for (const [id, done, reward, text] of [
            ['first', s.sold >= 4, 100, '首批矿石'], ['depth5', s.deepest >= 5, 180, '深入50米'],
            ['sold24', s.sold >= 24, 300, '累计出售24份'], ['depth10', s.deepest >= 10, 400, '深入100米'],
            ['depth15', s.deepest >= 15, 650, '深入150米'], ['signal', s.recovered.length >= 4, 1500, '集齐勘探箱'],
        ]) {
            if (done && !s.milestones.includes(id)) { s.milestones.push(id); s.credits += reward; this.message(`目标完成：${text}，奖励 ${reward} 金币`, 'good'); }
        }
    }
    action(action) {
        const s = this.state;
        if (s.lost || this.transition > 0) return false;
        const moves = { up: [0,-1,-Math.PI/2], down: [0,1,Math.PI/2], left: [-1,0,Math.PI], right: [1,0,0] };
        if (moves[action]) {
            if (this.cooldown > 0) return false;
            const [dx,dy,angle] = moves[action]; s.direction = angle;
            const cell = this.world.cell(s.depth, s.x + dx, s.y + dy);
            if (!cell) { this.message('到达矿区边界，换个方向挖。'); this.cooldown = .2; return false; }
            if(cell.hazard && !s.tutorials.includes(cell.hazard)) {
                s.tutorials.push(cell.hazard);this.emit('tutorial',{hazard:cell.hazard});this.emit('save');return false;
            }
            if (cell.solid) {
                if (s.heat >= 96) { this.message('钻头过热，停一下等它冷却。', 'warning'); this.cooldown = .5; return false; }
                if (cell.ore !== null && s.cargo.length >= this.stats.capacity && cell.hp <= this.stats.power) {
                    this.message('货舱满了，返航地面卖矿再来。', 'warning'); this.cooldown = .5; return false;
                }
                s.energy = Math.max(0, s.energy - 2.2);
                s.heat = Math.min(100, s.heat + 7 * (s.module === 'ghost' ? 1.3 : 1));
                this.world.change(s.depth, cell, { hp: Math.max(0, cell.hp - this.stats.power) });
                this.emit('dig', { x: cell.x, y: cell.y, broken: cell.hp === 0 });
                this.cooldown = .18 - s.tiers.drill * .011;
                if (cell.hp === 0) {
                    if (cell.ore !== null) { s.cargo.push(cell.ore); this.emit('ore', { x: cell.x, y: cell.y, ore: cell.ore }); }
                    this.world.change(s.depth, cell, { solid: false, ore: null, rubble: false });
                    this.enter(cell);
                }
            } else { s.energy = Math.max(0, s.energy - (s.module === 'ghost' ? .27 : .45)); this.cooldown = .12; this.enter(cell); }
            this.checkLoss(); return true;
        }
        if (action === 'scan') {
            if (this.scanCooldown > 0) return false;
            if (s.energy < 5) { this.message('电量不足，暂时无法扫描。', 'warning'); return false; }
            s.energy -= 5; this.scanCooldown = 4;
            this.world.reveal(s.depth, s.x, s.y, 9, true); this.emit('scan'); this.message('扫描完成，附近矿石和危险已标出。'); this.checkLoss(); return true;
        }
        if (action === 'descend' || action === 'ascend') return this.changeDepth(action === 'descend' ? 1 : -1);
        return false;
    }
    enter(cell) {
        const s = this.state; s.x = cell.x; s.y = cell.y; this.reveal(); this.emit('move');
        if (cell.relic) {
            const id = LOGS.findIndex(log => log.depth === s.depth);
            if (id >= 0 && !s.recovered.includes(id)) {
                const reward=200+s.depth*15;
                const unlockedModules=s.recovered.length===0;
                s.recovered.push(id); s.credits += reward;
                this.world.change(s.depth, cell, { relic: false }); this.emit('relic', { id, reward, unlockedModules });
                if (id === 3 && s.recovered.length === 4) { s.completed = true; this.emit('complete'); }
                // Recovering the final record out of order still completes the objective.
                if (s.recovered.length === 4 && !s.completed) { s.completed = true; this.emit('complete'); }
                this.contracts(); this.emit('save');
            }
        }
        if (cell.hazard === 'gas') {
            this.damage(24 + s.depth, '瓦斯爆炸，请避开黄绿色气体。', 'gas'); s.heat = Math.min(100, s.heat + 20);
            this.emit('explosion', { x: cell.x, y: cell.y }); this.world.change(s.depth, cell, { hazard: null });
        }
        if (cell.hazard === 'unstable' && !this.pending.some(p => p.depth === s.depth && p.x === cell.x && p.y === cell.y)) {
            this.pending.push({ x: cell.x, y: cell.y, depth: s.depth, time: 1.7 });
            this.message('即将塌方，尽快离开标记区域！', 'warning'); this.emit('alarm');
        }
    }
    damage(amount, reason, cause = null) {
        const s = this.state;
        const actual=amount * (s.module === 'bastion' ? .65 : 1) / (1 + s.tiers.hull * .12);
        s.hull = Math.max(0, s.hull - actual);if(cause)s.lastDamage=cause;
        if(this.damageNoticeCooldown<=0 || cause!=='lava') {
            this.emit('damage',{cause,amount:actual});this.damageNoticeCooldown=.9;
            if(reason)this.message(`${reason} 机身 −${Math.round(actual)}`, 'warning');
            else if(cause==='lava')this.message('熔岩正在损伤机身，快离开橙色熔岩池！', 'warning');
        }
        this.checkLoss();
    }
    verticalCost(delta) {
        const s=this.state;
        if(s.depth+delta<0)return 0;
        const cell=this.world.cell(s.depth,s.x,s.y);
        if(cell[delta>0?'shaftDown':'shaftUp'])return 2;
        return delta>0?9+(s.depth+1)*1.4:6+s.depth*.7;
    }
    get ascentCost() {
        const s=this.state,key=`${s.x}:${s.y}:${s.depth}:${this.world.revision}`;
        if(this.ascentCache?.key===key)return this.ascentCache.cost;
        let cost=0;
        for(let depth=s.depth;depth>0;depth--)cost+=this.world.cell(depth,s.x,s.y).shaftUp?2:6+depth*.7;
        cost=Math.ceil(cost);this.ascentCache={key,cost};return cost;
    }
    get energyStatus() {
        const needed=this.ascentCost,remaining=Math.floor(this.state.energy),capacity=this.stats.energy;
        const buffer=Math.max(20,capacity*.12,needed*.25);
        const cautionAt=Math.max(capacity*.3,needed+buffer);
        const criticalAt=Math.max(capacity*.1,needed+Math.max(8,capacity*.04));
        return {needed,remaining,band:this.state.energy<=criticalAt?2:this.state.energy<=cautionAt?1:0};
    }
    changeDepth(delta) {
        const s = this.state; const depth = s.depth + delta;
        if (depth < 0) return this.dock();
        if (delta > 0 && depth > this.stats.maxDepth) { this.message(`请先升级钻头，才能继续下潜到 ${s.depth*10+10} 米`, 'warning'); this.cooldown = .4; return false; }
        const energy = this.verticalCost(delta);
        if (s.energy < energy) { this.message('返航电量不足，沿已经打通的竖井上升，每层只用2电量。', 'warning'); return false; }
        const origin=this.world.cell(s.depth,s.x,s.y);
        const reused=!!origin[delta>0?'shaftDown':'shaftUp'];
        this.world.change(s.depth,origin,{[delta>0?'shaftDown':'shaftUp']:true});
        s.energy -= energy; s.depth = depth; s.deepest = Math.max(s.deepest, depth);
        const cell = this.world.cell(depth, s.x, s.y);
        // The vertical bore creates a safe arrival pocket; it cannot harvest ore for free.
        this.world.change(depth, cell, { solid: false, ore: null, hazard: null, rubble:false, [delta>0?'shaftUp':'shaftDown']:true });
        if(!reused)s.heat=Math.min(100,s.heat+10);
        this.reveal(); this.transition = reused?.32:.65; this.cooldown = .2; this.emit('depth', { depth, reused });
        this.enter(cell); this.contracts();
        if (depth === 0) { this.service(); this.emit('dock'); }
        else if ([4,6,8].includes(depth)) this.message(({4:'这一层有塌方，注意地面的裂纹。',6:'这一层有瓦斯，留意黄绿色气体。',8:'这一层有熔岩，绕开橙色流动区域。'})[depth], 'warning');
        this.checkLoss(); this.emit('save'); return true;
    }
    tick(dt) {
        if (this.state.lost) return;
        const s = this.state;
        this.cooldown = Math.max(0, this.cooldown - dt); this.scanCooldown = Math.max(0, this.scanCooldown - dt);this.damageNoticeCooldown=Math.max(0,this.damageNoticeCooldown-dt);
        this.transition = Math.max(0, this.transition - dt); s.heat = Math.max(0, s.heat - dt * 13);
        if (this.world.cell(s.depth, s.x, s.y).hazard === 'lava') { this.damage((10 + s.depth * .7) * dt,null,'lava'); s.heat = Math.min(100, s.heat + dt * 25); }
        for (const p of this.pending) {
            p.time -= dt;
            if (p.time <= 0) {
                const cell = this.world.cell(p.depth, p.x, p.y);
                this.world.change(p.depth, cell, { hazard: null, rubble: true });
                if (p.depth === s.depth) {
                    this.emit('collapse', { x:p.x, y:p.y });
                    if (Math.hypot(s.x-p.x,s.y-p.y) <= 1.4) this.damage(32 + s.depth, '塌方落石击中了钻机。', 'collapse');
                }
                // Leave diggable rubble, but never trap the ship inside a solid cell.
                if (!(s.depth === p.depth && s.x === p.x && s.y === p.y)) this.world.change(p.depth, cell, { solid: true, hp: 30, maxHp: 30 });
            }
        }
        this.pending = this.pending.filter(p => p.time > 0);
        this.checkLoss();this.warnEnergy(dt);
    }
    warnEnergy(dt) {
        if(this.state.lost)return;
        const {band,needed,remaining}=this.energyStatus;
        this.energyAlertCooldown=Math.max(0,this.energyAlertCooldown-dt);
        if(!band){this.energyWarningBand=0;this.energyAlertCooldown=0;return;}
        const changed=band!==this.energyWarningBand;
        if(changed||this.energyAlertCooldown<=0){
            this.emit(band===2?'criticalEnergy':'lowEnergy');
            this.energyAlertCooldown=band===2?7:22;
            if(changed)this.message(this.state.depth===0?`电量只剩 ${remaining}，在地面打开整备站免费补满。`:`${remaining<needed?'直接上升电量不足，请沿原竖井返回':'请尽快返航地面'}；预计需要 ${needed} 电量，当前剩余 ${remaining}`, 'warning');
        }
        this.energyWarningBand=band;
    }
    checkLoss() {
        if (this.state.lost) return;
        if (this.state.energy <= 0 || this.state.hull <= 0) {
            this.state.lossCause=this.state.energy<=0?'power':this.state.lastDamage;
            this.state.lost = true; this.emit('lost'); this.emit('save');
        }
    }
    snapshot() { return { version: 3, seed: this.world.seed, state: JSON.parse(JSON.stringify(this.state)), changes: this.world.changes, pending: this.pending }; }
}
