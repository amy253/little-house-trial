// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
import { CELL, SIZE, ORES, biome, random } from './config.mjs';

const TAU = Math.PI * 2;
function polygon(ctx, points) { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); }
export class Renderer {
    constructor(canvas, game, minimap) {
        this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.map = minimap; this.game = game;
        this.camera = {x:game.state.x*CELL+32,y:game.state.y*CELL+32}; this.ship = {...this.camera};
        this.particles = []; this.rings = []; this.caveIns = []; this.labels = []; this.shake = 0; this.drilling = 0; this.flash = 0;
        this.cache = document.createElement('canvas'); this.cache.width = this.cache.height = SIZE*CELL;
        this.cachedRevision = -1; this.cachedDepth = -1; this.time = 0; this.reduced = false;
        this.resize();
    }
    resize() {
        const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
        this.dpr = Math.min(window.devicePixelRatio || 1,1.5);
        this.canvas.width = Math.round(this.width*this.dpr); this.canvas.height = Math.round(this.height*this.dpr);
    }
    event(e) {
        const s = this.game.state;
        if(e.type==='ore') {
            this.labels.push({x:e.x*CELL+32,y:e.y*CELL+10,text:`${ORES[e.ore].name} +1`,color:ORES[e.ore].color,age:0});
        }
        if(e.type==='damage')this.labels.push({x:s.x*CELL+32,y:s.y*CELL+10,text:e.cause==='lava'?'熔岩损伤':`机身 −${Math.round(e.amount)}`,color:'#f2a281',age:0});
        if(this.labels.length>6)this.labels.shift();
        if (e.type === 'scan') this.rings.push({ x:s.x*CELL+32,y:s.y*CELL+32,r:0,life:1.7 });
        if (['dig','explosion','collapse','ore'].includes(e.type)) {
            const count = this.reduced ? 5 : e.type === 'dig' ? (e.broken ? 35 : 15) : 55;
            for(let i=0;i<count;i++) {
                const a = Math.random()*TAU, speed = 25+Math.random()*(e.type === 'dig' ? 180 : 320);
                this.particles.push({x:e.x*CELL+32,y:e.y*CELL+32,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.3+Math.random()*.7,max:1,size:1+Math.random()*3,color:e.type==='ore'?ORES[e.ore].color:e.type==='explosion'?'#ff783d':Math.random()<.35?'#ffd8a0':'#a69a84'});
            }
        }
        if(e.type==='dig') {this.drilling=.22;this.shake=e.broken?4:1.8;}
        if(e.type==='damage') {this.flash=.22;this.shake=5;}
        if(['explosion','collapse'].includes(e.type)) this.shake=10;
        if(e.type==='collapse') this.caveIns.push({x:e.x*CELL+32,y:e.y*CELL+32,age:0,seed:e.x*719+e.y*931});
        if(e.type==='depth') { this.particles=[];this.rings=[];this.caveIns=[];this.labels=[];this.cachedDepth=-1;this.ship={x:s.x*CELL+32,y:s.y*CELL+32};this.camera={...this.ship}; }
        if(this.particles.length>400) this.particles.splice(0,this.particles.length-400);
    }
    buildTerrain() {
        const g = this.game, depth = g.state.depth, ctx = this.cache.getContext('2d');
        const palette = biome(depth); ctx.fillStyle = '#eee4cc';ctx.fillRect(0,0,this.cache.width,this.cache.height);
        const rng = random(g.world.seed+depth);
        for(let i=0;i<200;i++) {
            const x=rng()*1600,y=rng()*1600;
            ctx.fillStyle = i%3 ? '#ddd1b6' : '#d6c7a9';ctx.globalAlpha=.25+rng()*.25;
            ctx.fillRect(x,y,rng()*3+.5,rng()*2+.5);
        }
        ctx.globalAlpha=1;
        for(const c of g.world.level(depth)) {
            const x=c.x*CELL+32,y=c.y*CELL+32;
            if(!c.seen) {
                if(c.solid) {
                    const r=random(c.x*374761+c.y*668265+depth*1763+g.world.seed);const points=[];
                    for(let i=0;i<9;i++){const a=i/9*TAU,radius=26+r()*10;points.push([x+Math.cos(a)*radius,y+Math.sin(a)*radius]);}
                    polygon(ctx,points);ctx.fillStyle='#c8bea8';ctx.fill();ctx.strokeStyle='#b5a991';ctx.stroke();
                    polygon(ctx,[points[5],points[6],points[7],[x,y]]);ctx.fillStyle='#d9cdb5';ctx.fill();
                }
                continue;
            }
            if(c.rubble) this.rubblePile(ctx,c);
            else if(c.solid) this.rock(ctx,c,depth,palette);
            else {
                const r=random(c.x*875+c.y*13+depth*76);
                for(let i=0;i<7;i++) {ctx.fillStyle=i%2?'#d4c6aa':'#dfd3bb';ctx.beginPath();ctx.ellipse(x+(r()-.5)*58,y+(r()-.5)*58,1+r()*3,1+r()*2,r()*3,0,TAU);ctx.fill();}
            }
        }
        this.cachedRevision=g.world.revision;this.cachedDepth=depth;
    }
    rock(ctx,c,depth,palette) {
        const r=random(c.x*374761+c.y*668265+depth*1763+this.game.world.seed);
        const x=c.x*CELL+32+(r()-.5)*5,y=c.y*CELL+32+(r()-.5)*5;const points=[];
        const bulk=.8+r()*.25;
        for(let i=0;i<12;i++) {const a=i/12*TAU;const radius=(25+r()*12)*bulk;points.push([x+Math.cos(a)*radius,y+Math.sin(a)*radius]);}
        ctx.save();ctx.shadowColor='#0009';ctx.shadowBlur=9;ctx.shadowOffsetY=7;
        polygon(ctx,points);ctx.fillStyle=palette.color;ctx.fill();ctx.shadowColor='transparent';
        const middle=[x+(r()-.5)*22,y+(r()-.5)*22];
        for(let i=0;i<points.length;i++) {
            polygon(ctx,[points[i],points[(i+1)%points.length],middle]);
            ctx.fillStyle=i<6?'#040c13':'#e4dbbf';ctx.globalAlpha=.08+r()*.28;ctx.fill();
        }
        ctx.globalAlpha=1; polygon(ctx,points);ctx.strokeStyle='#bcb39a30';ctx.lineWidth=1;ctx.stroke();
        ctx.save();ctx.clip();
        for(let i=0;i<4;i++) {
            ctx.fillStyle=i%3?'#050b1055':'#f2dfbd38';const px=x+(r()-.5)*70,py=y+(r()-.5)*70;
            ctx.fillRect(px,py,.4+r()*1.7,.4+r()*1.2);
        }
        for(let i=0;i<4;i++) {
            const a=r()*TAU;let px=x+(r()-.5)*25,py=y+(r()-.5)*25;
            ctx.beginPath();ctx.moveTo(px,py);
            for(let j=0;j<4;j++){px+=Math.cos(a)*8+(r()-.5)*8;py+=Math.sin(a)*8+(r()-.5)*8;ctx.lineTo(px,py);}
            ctx.strokeStyle='#12191cc0';ctx.lineWidth=.5+r();ctx.stroke();
            ctx.translate(-.6,-.6);ctx.strokeStyle='#e0d6b438';ctx.lineWidth=.5;ctx.stroke();ctx.translate(.6,.6);
        }
        ctx.restore();
        if(c.ore!==null) {
            const color=ORES[c.ore].color;
            for(let i=0;i<4+(c.scanned?3:0);i++) {
                const ox=x+(r()-.5)*29,oy=y+(r()-.5)*29;
                ctx.shadowColor=color;ctx.shadowBlur=c.scanned?10:3;
                polygon(ctx,[[ox,oy-7],[ox+4,oy-2],[ox+2,oy+5],[ox-4,oy+2]]);ctx.fillStyle=color;ctx.globalAlpha=c.scanned?.95:.7;ctx.fill();
                ctx.strokeStyle='#ffffff60';ctx.lineWidth=.7;ctx.stroke();
            }
            ctx.shadowBlur=0;ctx.shadowColor='transparent';ctx.globalAlpha=1;
        }
        if(c.hp<c.maxHp) {
            const damage=1-c.hp/c.maxHp;ctx.strokeStyle='#080a0c';ctx.lineWidth=1.5+damage*2;
            for(let i=0;i<2+damage*5;i++) {const a=i*2.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a+.3)*12,y+Math.sin(a+.3)*12);ctx.lineTo(x+Math.cos(a)*31*damage,y+Math.sin(a)*31*damage);ctx.stroke();}
            ctx.fillStyle='#0009';ctx.fillRect(x-17,y+23,34,3);ctx.fillStyle='#e6b16b';ctx.fillRect(x-17,y+23,34*c.hp/c.maxHp,3);
        }
        ctx.restore();
    }
    draw(dt, paused=false) {
        this.time+=dt;const s=this.game.state;const ctx=this.ctx;const w=this.width,h=this.height;
        if(this.cachedRevision!==this.game.world.revision||this.cachedDepth!==s.depth) this.buildTerrain();
        const ease=1-Math.exp(-dt*12); this.ship.x+=(s.x*CELL+32-this.ship.x)*ease;this.ship.y+=(s.y*CELL+32-this.ship.y)*ease;
        this.camera.x+=(this.ship.x-this.camera.x)*(1-Math.exp(-dt*5));this.camera.y+=(this.ship.y-this.camera.y)*(1-Math.exp(-dt*5));
        this.shake=Math.max(0,this.shake-dt*24);this.drilling=Math.max(0,this.drilling-dt);this.flash=Math.max(0,this.flash-dt);
        ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#f4ecd9';ctx.fillRect(0,0,w,h);
        const scale=Math.max(.65,Math.min(1.15,w/1350));
        const shake=this.reduced?0:this.shake;const ox=w*.47-this.camera.x*scale+(Math.random()-.5)*shake,oy=h*.52-this.camera.y*scale+(Math.random()-.5)*shake;
        ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.drawImage(this.cache,0,0);
        this.hazards(ctx);
        // Source work-light geometry retained; full-screen dark fog removed for the light theme.
        ctx.save();ctx.translate(this.ship.x,this.ship.y);ctx.rotate(s.direction);ctx.globalCompositeOperation='screen';
        const beam=ctx.createRadialGradient(20,0,8,70,0,310);beam.addColorStop(0,'#d5eac728');beam.addColorStop(.5,'#b8d5c911');beam.addColorStop(1,'#b8d5c900');
        ctx.fillStyle=beam;polygon(ctx,[[20,-12],[300,-145],[350,0],[300,145],[20,12]]);ctx.fill();ctx.restore();
        for(const ring of this.rings) {ring.r+=dt*410;ring.life-=dt;ctx.strokeStyle=`rgba(131,237,216,${Math.max(0,ring.life/2)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r,0,TAU);ctx.stroke();}
        this.rings=this.rings.filter(r=>r.life>0);
        for(const p of this.particles) {
            p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*2);p.vy*=Math.exp(-dt*2);ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);
        }ctx.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
        this.drawShip(ctx,paused);
        this.drawCaveIns(ctx,dt);
        ctx.restore();
        const sx=this.ship.x*scale+ox,sy=this.ship.y*scale+oy;
        // Sparse motes and parallax dust; visibility is deliberate, never a black screen.
        if(!this.reduced) for(let i=0;i<55;i++) {const x=((i*137.6+this.time*(3+i%4)-this.camera.x*.15)%w+w)%w;const y=((i*91.2+Math.sin(this.time*.15+i)*15-this.camera.y*.1)%h+h)%h;ctx.fillStyle=`rgba(180,197,190,${.07+(i%3)*.03})`;ctx.fillRect(x,y,i%4===0?2:1,1);}
        if(this.flash>0) {ctx.fillStyle=`rgba(193,63,33,${this.flash*.6})`;ctx.fillRect(0,0,w,h);}
        const energyBand=this.game.energyStatus.band;
        if(energyBand&&!s.lost){
            const critical=energyBand===2,pulse=this.reduced?1:.65+Math.sin(this.time*(critical?6:2.6))*.35;
            const glow=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.32,w/2,h/2,Math.max(w,h)*.66);
            glow.addColorStop(0,'#00000000');glow.addColorStop(.6,'#00000000');glow.addColorStop(1,critical?`rgba(217,76,42,${pulse*.43})`:`rgba(220,154,62,${pulse*.24})`);
            ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
        }
        for(const label of this.labels){
            label.age+=dt;ctx.save();ctx.globalAlpha=Math.min(.95,Math.max(0,(1.5-label.age)*1.4));
            ctx.font='600 14px "Segoe UI", sans-serif';ctx.textAlign='center';ctx.fillStyle=label.color;
            ctx.shadowColor='#03080c';ctx.shadowBlur=5;
            ctx.fillText(label.text,label.x*scale+ox,label.y*scale+oy-22-(this.reduced?0:label.age*19));ctx.restore();
        }
        this.labels=this.labels.filter(label=>label.age<1.5);
        if(this.game.transition>0) {
            const a=Math.sin(this.game.transition/.65*Math.PI);ctx.fillStyle=`rgba(239,230,207,${a*.8})`;ctx.fillRect(0,0,w,h);
            ctx.textAlign='center';ctx.fillStyle=`rgba(55,87,91,${a})`;ctx.font='12px monospace';ctx.fillText(`正在到达 ${s.depth*10} 米矿层`,w/2,h/2+65);
        }
        this.drawMap();
    }
    hazards(ctx) {
        const s=this.game.state,t=this.time;
        for(const c of this.game.world.level(s.depth)) {
            if(!c.seen) continue;const x=c.x*CELL+32,y=c.y*CELL+32;
            if(c.hazard==='lava') {
                const glow=ctx.createRadialGradient(x,y,5,x,y,55);glow.addColorStop(0,'#fd70217a');glow.addColorStop(1,'#ff480000');ctx.fillStyle=glow;ctx.fillRect(x-55,y-55,110,110);
                ctx.fillStyle='#87311c';ctx.beginPath();ctx.ellipse(x,y,28,24,.3,0,TAU);ctx.fill();
                ctx.strokeStyle='#fc9b41';ctx.lineWidth=2;
                for(let i=0;i<3;i++) {ctx.beginPath();ctx.moveTo(x-23,y-14+i*13);ctx.bezierCurveTo(x-8,y+Math.sin(t+i)*6-12+i*13,x+8,y+6+i*7,x+24,y-8+i*10);ctx.stroke();}
            } else if(c.hazard==='gas') {
                for(let i=0;i<3;i++) {const gx=x+Math.sin(t*.7+i*2)*12,gy=y+Math.cos(t*.5+i*2)*10;const glow=ctx.createRadialGradient(gx,gy,1,gx,gy,28);glow.addColorStop(0,'#afcb6448');glow.addColorStop(1,'#8bbc4b00');ctx.fillStyle=glow;ctx.fillRect(gx-28,gy-28,56,56);}
                if(c.scanned) {ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#bed783';ctx.fillText('瓦斯',x,y+23);}
            } else if(c.hazard==='unstable') {
                ctx.strokeStyle='#c4a67180';ctx.setLineDash([3,5]);ctx.strokeRect(x-24,y-24,48,48);ctx.setLineDash([]);
                if(c.scanned) {ctx.font='8px monospace';ctx.fillStyle='#d4b583';ctx.textAlign='center';ctx.fillText('易塌方',x,y+22);}
            }
            if(c.relic) {
                ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.shadowColor='#a6e9df';ctx.shadowBlur=24;ctx.fillStyle='#8ad3c4';ctx.fillRect(-9,-9,18,18);ctx.strokeStyle='#d9fff1';ctx.strokeRect(-13,-13,26,26);ctx.restore();
                ctx.strokeStyle='#9ee9d670';ctx.beginPath();ctx.arc(x,y,22+Math.sin(t*2)*4,0,TAU);ctx.stroke();ctx.fillStyle='#b9dfd6';ctx.textAlign='center';ctx.font='9px monospace';ctx.fillText('勘探箱',x,y+40);
            }
            if(c.shaftDown||c.shaftUp)this.shaft(ctx,c);
        }
        for(const p of this.game.pending) {
            if(p.depth!==s.depth)continue;
            const x=p.x*CELL+32,y=p.y*CELL+32,danger=1-p.time/1.7,r=random(p.x*719+p.y*931);
            ctx.save();ctx.translate(x,y);
            const warning=ctx.createRadialGradient(0,0,8,0,0,90);warning.addColorStop(0,`rgba(221,139,65,${.06+danger*.13})`);warning.addColorStop(1,'#d9924000');ctx.fillStyle=warning;ctx.fillRect(-90,-90,180,180);
            // Branching fissures grow outward as the ceiling loses cohesion.
            for(let i=0;i<9;i++) {
                const a=r()*TAU,length=(35+r()*48)*Math.min(1,danger*1.8+.2);
                ctx.beginPath();ctx.moveTo(Math.cos(a)*5,Math.sin(a)*5);
                const mx=Math.cos(a+.2)*length*.48,my=Math.sin(a+.2)*length*.48;
                ctx.lineTo(mx,my);ctx.lineTo(Math.cos(a)*length,Math.sin(a)*length);
                ctx.moveTo(mx,my);ctx.lineTo(mx+Math.cos(a+.9)*length*.3,my+Math.sin(a+.9)*length*.3);
                ctx.strokeStyle='#090b0d';ctx.lineWidth=2+danger*2;ctx.stroke();ctx.strokeStyle=`rgba(229,160,91,${.25+danger*.5})`;ctx.lineWidth=.7;ctx.stroke();
            }
            ctx.setLineDash([8,6]);ctx.strokeStyle=Math.sin(t*12)>0?'#f1bd7c':'#b6814e';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,83,0,TAU);ctx.stroke();ctx.setLineDash([]);
            if(!this.reduced)for(let i=0;i<12;i++) {
                const px=(r()-.5)*105,py=(r()-.5)*85,fall=(danger*3+i*.19)%1;
                ctx.fillStyle=`rgba(0,0,0,${fall*.35})`;ctx.beginPath();ctx.ellipse(px,py,2+fall*4,1+fall*2,0,0,TAU);ctx.fill();
                ctx.fillStyle=i%2?'#aa9e83':'#655f51';ctx.fillRect(px,py-(1-fall)*75,2+r()*3,2+r()*3);
            }
            if(p.time<.5&&!this.reduced) {
                const rng=random(p.x*719+p.y*931);
                for(let i=0;i<7;i++) {
                    const px=(rng()-.5)*65,py=(rng()-.5)*55,sz=10+rng()*14;
                    const elevation=Math.pow(p.time/.5,2)*160;
                    ctx.fillStyle=`rgba(0,0,0,${.15+(1-p.time/.5)*.35})`;ctx.beginPath();ctx.ellipse(px,py,sz+10*p.time,sz*.5,0,0,TAU);ctx.fill();
                    this.chunk(ctx,px-elevation*.14,py-elevation,sz,rng()*3);
                }
            }
            ctx.fillStyle='#f3cc94';ctx.textAlign='center';ctx.font='bold 13px "Segoe UI",sans-serif';ctx.fillText(`Cave-in · ${p.time.toFixed(1)}s`,0,107);ctx.restore();
        }
    }
    shaft(ctx,c) {
        const x=c.x*CELL+32,y=c.y*CELL+32,r=random(c.x*947+c.y*311+this.game.world.seed);ctx.save();ctx.translate(x,y);
        const rim=[],inner=[];
        for(let i=0;i<15;i++){const a=i/15*TAU,radius=26+r()*9;rim.push([Math.cos(a)*radius,Math.sin(a)*radius*.8]);inner.push([Math.cos(a)*(radius-9),Math.sin(a)*(radius-9)*.8+3]);}
        ctx.save();ctx.shadowColor='#000c';ctx.shadowBlur=10;ctx.shadowOffsetY=6;polygon(ctx,rim);ctx.fillStyle='#3e453c';ctx.fill();ctx.restore();
        if(c.shaftDown){
            polygon(ctx,rim);ctx.fillStyle='#080d10';ctx.fill();
            for(let i=0;i<rim.length;i++){
                polygon(ctx,[rim[i],rim[(i+1)%rim.length],inner[(i+1)%inner.length],inner[i]]);
                const light=i>7;ctx.fillStyle=light?'#827b65':'#363e38';ctx.fill();ctx.strokeStyle=light?'#b6aa8045':'#172423';ctx.lineWidth=.5;ctx.stroke();
            }
            polygon(ctx,inner);ctx.fillStyle='#02070b';ctx.fill();
            // Broken ledges disappear into the bore instead of outlining a symbol.
            ctx.save();ctx.clip();
            for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(-3,1+i*5,22-i*3,13-i*2,.15,Math.PI*.12,Math.PI*.95);ctx.strokeStyle=`rgba(87,90,71,${.4-i*.08})`;ctx.lineWidth=2;ctx.stroke();}
            const depth=ctx.createRadialGradient(0,10,2,0,6,27);depth.addColorStop(0,'#010508');depth.addColorStop(.65,'#02080ce8');depth.addColorStop(1,'#03090a00');ctx.fillStyle=depth;ctx.fillRect(-30,-30,60,60);ctx.restore();
        }else{
            polygon(ctx,rim);const floor=ctx.createRadialGradient(-6,-8,0,0,0,36);floor.addColorStop(0,'#a5b39977');floor.addColorStop(1,'#384a3a11');ctx.fillStyle=floor;ctx.fill();
        }
        for(let i=0;i<15;i++){
            const a=r()*TAU,d=29+r()*12;this.chunk(ctx,Math.cos(a)*d,Math.sin(a)*d*.8,1.5+r()*4,r()*TAU);
        }
        if(c.shaftUp){
            ctx.globalCompositeOperation='screen';
            const light=ctx.createLinearGradient(-25,-85,5,15);light.addColorStop(0,'#bdd5b300');light.addColorStop(.7,'#a5c6a918');light.addColorStop(1,'#c1dabb30');ctx.fillStyle=light;
            polygon(ctx,[[-42,-90],[-15,-90],[26,15],[5,27],[-22,14]]);ctx.fill();
            const pool=ctx.createRadialGradient(-2,0,1,-2,0,37);pool.addColorStop(0,c.shaftDown?'#b3d3bf14':'#b3d3bf38');pool.addColorStop(1,'#b3d3bf00');ctx.fillStyle=pool;ctx.fillRect(-40,-40,80,80);
            if(!this.reduced)for(let i=0;i<9;i++){const px=(r()-.5)*27,py=((this.time*7+i*13)%75)-60;ctx.fillStyle='#c6d7ad66';ctx.fillRect(px+py*.25,py,1,1.5);}
        }
        ctx.globalCompositeOperation='source-over';
        for(const direction of [-1,1]) {
            if(direction<0&&!c.shaftUp||direction>0&&!c.shaftDown)continue;
            const ax=c.shaftUp&&c.shaftDown?(direction<0?-8:8):0,ay=3;
            ctx.beginPath();ctx.moveTo(ax,ay-direction*6);ctx.lineTo(ax,ay+direction*6);
            ctx.moveTo(ax-3.5,ay+direction*2);ctx.lineTo(ax,ay+direction*6);ctx.lineTo(ax+3.5,ay+direction*2);
            ctx.strokeStyle='#0a131ad0';ctx.lineWidth=3.2;ctx.stroke();
            ctx.strokeStyle=direction<0?'#b7d2bfbb':'#d5bd8dbb';ctx.lineWidth=1.25;ctx.stroke();
        }
        ctx.restore();
    }
    chunk(ctx,x,y,size,angle) {
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);
        const points=[[-size*.8,-size*.3],[-size*.35,-size*.75],[size*.65,-size*.55],[size,size*.2],[size*.3,size*.7],[-size*.6,size*.55]];
        polygon(ctx,points);ctx.fillStyle='#736e60';ctx.fill();ctx.strokeStyle='#b2a68870';ctx.lineWidth=.8;ctx.stroke();
        polygon(ctx,[points[0],points[1],points[2],[0,0]]);ctx.fillStyle='#a3987b';ctx.fill();
        polygon(ctx,[points[3],points[4],points[5],[0,0]]);ctx.fillStyle='#41463f';ctx.fill();
        ctx.beginPath();ctx.moveTo(-size*.3,-size*.5);ctx.lineTo(size*.12,0);ctx.lineTo(-size*.2,size*.5);ctx.strokeStyle='#282e2b';ctx.stroke();ctx.restore();
    }
    rubblePile(ctx,c) {
        const r=random(c.x*719+c.y*931),x=c.x*CELL+32,y=c.y*CELL+32;
        ctx.fillStyle='#070c0d80';ctx.beginPath();ctx.ellipse(x,y+8,36,25,0,0,TAU);ctx.fill();
        for(let i=0;i<12;i++) this.chunk(ctx,x+(r()-.5)*48,y+(r()-.5)*40,4+r()*14,r()*TAU);
        if(c.solid&&c.hp<c.maxHp){ctx.fillStyle='#101717';ctx.fillRect(x-18,y+26,36,4);ctx.fillStyle='#dda86e';ctx.fillRect(x-18,y+26,36*c.hp/c.maxHp,4);}
    }
    drawCaveIns(ctx,dt) {
        for(const event of this.caveIns) {
            event.age+=dt;const age=event.age,r=random(event.seed),fade=Math.max(0,1-age/2.5);
            ctx.save();ctx.translate(event.x,event.y);
            // Slabs bounce and settle; displaced air carries several overlapping dust fronts.
            for(let i=0;i<7;i++) {
                const x=(r()-.5)*65,y=(r()-.5)*55,size=10+r()*14,angle=r()*3;
                const bounce=this.reduced?0:Math.max(0,Math.sin(age*13))*Math.exp(-age*6)*16;
                if(age<.75)this.chunk(ctx,x+Math.sin(i)*age*8,y-bounce,size,angle+age*.15);
            }
            if(age<.6){ctx.strokeStyle=`rgba(215,186,136,${(.6-age)*.5})`;ctx.lineWidth=5*(1-age/.6);ctx.beginPath();ctx.ellipse(0,5,25+age*160,12+age*95,0,0,TAU);ctx.stroke();}
            for(let i=0;i<(this.reduced?4:14);i++) {
                const a=r()*TAU,speed=20+r()*65,distance=age*speed;
                const x=Math.cos(a)*distance,y=Math.sin(a)*distance*.65-age*12;
                const radius=18+age*27+r()*12;
                const dust=ctx.createRadialGradient(x,y,0,x,y,radius);
                dust.addColorStop(0,`rgba(153,144,117,${fade*.2})`);dust.addColorStop(.45,`rgba(113,115,97,${fade*.14})`);dust.addColorStop(1,'#59665b00');ctx.fillStyle=dust;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
            }
            ctx.restore();
        }
        this.caveIns=this.caveIns.filter(e=>e.age<2.5);
    }
    drawShip(ctx,paused) {
        const s=this.game.state,t=this.time;ctx.save();ctx.translate(this.ship.x,this.ship.y);ctx.rotate(s.direction);
        const working=this.drilling>0;ctx.translate(working&&!this.reduced?Math.sin(t*120)*1.4:0,0);
        ctx.shadowColor='#000b';ctx.shadowBlur=12;ctx.shadowOffsetY=7;
        // Side tracks, suspension, cooling pipes and thruster housings.
        for(const side of [-1,1]) {
            const y=side*17;ctx.fillStyle='#12191d';ctx.fillRect(-23,y-6,43,12);ctx.strokeStyle='#556363';ctx.strokeRect(-23,y-6,43,12);
            for(let i=0;i<8;i++) {ctx.fillStyle=i%2?'#64706c':'#394644';ctx.fillRect(-21+i*5,y-5,2,10);}
            ctx.fillStyle='#9ca398';ctx.fillRect(-15,side*11-2,25,4);ctx.fillStyle='#171e21';ctx.fillRect(-29,y-4,7,8);
            const flame=paused?6:10+Math.sin(t*30)*4;const glow=ctx.createLinearGradient(-25,0,-45,0);glow.addColorStop(0,'#b7ecddaa');glow.addColorStop(1,'#75d9d800');ctx.fillStyle=glow;polygon(ctx,[[-27,y-3],[-28-flame,y],[-27,y+3]]);ctx.fill();
        }
        const metal=ctx.createLinearGradient(0,-17,0,17);metal.addColorStop(0,'#d5edf1');metal.addColorStop(.28,'#91bfce');metal.addColorStop(.6,'#5e95ae');metal.addColorStop(1,'#3f6b83');
        polygon(ctx,[[-24,-11],[-13,-17],[13,-14],[24,-7],[24,7],[13,14],[-13,17],[-24,11]]);ctx.fillStyle=metal;ctx.fill();ctx.shadowColor='transparent';ctx.strokeStyle='#e8e6c266';ctx.stroke();
        ctx.fillStyle='#c7914e';ctx.fillRect(-11,-14,7,28);ctx.fillStyle='#dec690';ctx.fillRect(-9,-13,2,26);
        ctx.fillStyle='#14282b';polygon(ctx,[[1,-10],[14,-8],[20,-4],[20,4],[14,8],[1,10]]);ctx.fill();ctx.strokeStyle='#76bfb6';ctx.stroke();
        const glass=ctx.createLinearGradient(0,-10,10,10);glass.addColorStop(0,'#a4e9da88');glass.addColorStop(.5,'#214c5188');glass.addColorStop(1,'#0c202f');ctx.fillStyle=glass;ctx.fill();
        ctx.strokeStyle='#7da9a1';ctx.beginPath();ctx.moveTo(9,-9);ctx.lineTo(9,9);ctx.stroke();
        ctx.fillStyle='#101e22';ctx.fillRect(-20,-7,7,14);ctx.fillStyle=s.heat>80?'#ee8446':'#90c2ad';for(let i=0;i<4;i++)ctx.fillRect(-19,-5+i*3,5,1);
        for(const y of [-10,10]) {ctx.fillStyle='#effbda';ctx.shadowColor='#d9fac5';ctx.shadowBlur=15;ctx.fillRect(17,y-2,5,3);}ctx.shadowBlur=0;ctx.shadowColor='transparent';
        // Segmented tungsten drill, animated while striking.
        ctx.fillStyle='#455459';ctx.fillRect(23,-6,7,12);
        const segments=5+Math.floor(s.tiers.drill/2);
        for(let i=0;i<segments;i++) {const width=segments+1-i;const offset=working?Math.sin(t*(90+s.tiers.drill*12)+i)*1.3:0;polygon(ctx,[[28+i*3,-width+offset],[33+i*3,0],[28+i*3,width+offset]]);ctx.fillStyle=i%2?(s.tiers.drill>3?'#d4cba6':'#b9bdb0'):'#687775';ctx.fill();ctx.strokeStyle='#202a2d';ctx.stroke();}
        for(const [x,y] of [[-18,-10],[-18,10],[0,-12],[0,12]]) {ctx.fillStyle='#e0dac1';ctx.beginPath();ctx.arc(x,y,1,0,TAU);ctx.fill();}
        ctx.strokeStyle='#9ba798';ctx.beginPath();ctx.moveTo(-18,-12);ctx.lineTo(-26,-27);ctx.stroke();ctx.fillStyle=Math.sin(t*3)>0?'#c5e5ca':'#586b5d';ctx.fillRect(-28,-29,3,3);
        ctx.restore();
    }
    drawMap() {
        if(!this.map) return;const ctx=this.map.getContext('2d'),s=this.game.state;const size=this.map.width/SIZE;
        ctx.fillStyle='#0c1317';ctx.fillRect(0,0,this.map.width,this.map.height);
        for(const c of this.game.world.level(s.depth)) {
            if(!c.seen)continue;ctx.fillStyle=c.relic?'#b9f4d9':c.shaftDown||c.shaftUp?'#82b6b0':c.hazard&&c.scanned?'#db925a':c.ore!==null&&c.scanned?ORES[c.ore].color:c.solid?'#58625d':'#202c2c';ctx.fillRect(c.x*size,c.y*size,size-1,size-1);
        }
        ctx.fillStyle='#f4cc8a';ctx.fillRect(s.x*size-1,s.y*size-1,size+1,size+1);
    }
}
