import {Expedition} from './vendor/mining/expedition.mjs';
import {validateSave} from './vendor/mining/persistence.mjs';
import {UPGRADES} from './vendor/mining/config.mjs';
export {ORES,UPGRADES,HAZARDS} from './vendor/mining/config.mjs';
export const SAVE_KEY='little-house-buli-mine-v1';
export class Mining{
 constructor(seed,best=0){this.engine=new Expedition({seed});this.paused=false;this.revives=0;this.region=1;this.income=0;this.best=Number.isFinite(best)?Math.max(0,Math.floor(best)):0;this.returning=false;this.returnCostPaid=0;}
 get state(){return this.engine.state;}get world(){return this.engine.world;}get stats(){return this.engine.stats;}get events(){return this.engine.events;}get pending(){return this.engine.pending;}get energyStatus(){return this.engine.energyStatus;}get transition(){return this.engine.transition;}
 live(){return !this.paused&&!this.state.lost;}
 earn(before){this.income+=Math.max(0,this.state.credits-before);this.best=Math.max(this.best,this.income);}
 action(a){if(!this.live()||!['up','down','left','right','descend','ascend','scan'].includes(a))return false;this.returning=false;const cash=this.state.credits,result=this.engine.action(a);this.earn(cash);return result;}
 sell(){if(!this.live())return false;const cash=this.state.credits,result=this.engine.sell();this.earn(cash);return result;}
 buy(id){return this.live()&&Object.hasOwn(UPGRADES,id)?this.engine.buy(id):false;}
 dock(){return this.live()?this.engine.dock():false;}
 startReturn(){if(!this.live()||!this.state.depth)return false;this.returning=true;return true;}
 tick(dt){if(!this.live()||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,1);while(left>1e-8&&!this.state.lost){const step=Math.min(left,.1);this.engine.tick(step);left-=step;if(this.returning&&this.engine.transition<=0){if(this.state.depth===0){this.returning=false;break;}const cost=this.engine.verticalCost(-1),cash=this.state.credits;if(!this.engine.action('ascend')){this.returning=false;this.engine.message('返航能量不足，沿已经打通的竖井上升更省电。','warning');}else{this.returnCostPaid+=cost;this.earn(cash);}if(this.state.depth===0)this.returning=false;}}}
 revive(){if(!this.state.lost||this.revives>=2)return false;this.revives++;this.state.lost=false;this.state.lossCause=null;this.state.lastDamage=null;this.engine.service();const c=this.world.cell(this.state.depth,this.state.x,this.state.y);if(c.hazard)this.world.change(this.state.depth,c,{hazard:null});this.engine.pending=this.engine.pending.filter(p=>p.depth!==this.state.depth||Math.hypot(p.x-this.state.x,p.y-this.state.y)>1.5);this.returning=false;this.paused=true;return true;}
 nextRegion(){if(!this.live()||this.state.depth!==0||this.state.deepest<20||this.state.cargo.length)return false;const old=this.state,seed=(this.world.seed+Math.imul(this.region,2654435761))>>>0;this.region++;this.engine=new Expedition({seed,state:{credits:old.credits,tiers:{...old.tiers},sold:0,tutorials:[...old.tutorials]}});this.engine.service();this.returning=false;this.returnCostPaid=0;return true;}
 save(){return JSON.stringify({version:1,expedition:this.engine.snapshot(),paused:this.paused,revives:this.revives,region:this.region,income:this.income,best:this.best,returning:this.returning,returnCostPaid:this.returnCostPaid,cooldown:this.engine.cooldown,scanCooldown:this.engine.scanCooldown,transition:this.engine.transition});}
}
export function create(seed=Date.now()>>>0,best=0){return new Mining(seed>>>0,best);}
const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max,integer=(v,min,max)=>Number.isInteger(v)&&finite(v,min,max);
export function restore(raw){try{
 if(typeof raw!=='string'||raw.length>4000000)return null;const d=JSON.parse(raw);if(d?.version!==1||!validateSave(d.expedition)||!integer(d.revives,0,2)||!integer(d.region,1,1000000)||!finite(d.income,0,1e12)||!finite(d.best,d.income,1e12)||typeof d.paused!=='boolean'||typeof d.returning!=='boolean'||!finite(d.returnCostPaid,0,1e9)||!finite(d.cooldown,0,.5)||!finite(d.scanCooldown,0,4)||!finite(d.transition,0,.65))return null;
 const g=new Mining(d.expedition.seed,d.best);g.engine=new Expedition(d.expedition);const s=g.state,t=g.stats;
 if(s.energy>t.energy||s.hull>t.hull||s.heat>100||s.cargo.length>t.capacity||s.depth>t.maxDepth||s.deepest<s.depth||!integer(s.deepest,0,21)||s.lost!==(s.energy<=0||s.hull<=0))return null;
 const cell=g.world.cell(s.depth,s.x,s.y);if(cell.solid)return null;
 g.revives=d.revives;g.region=d.region;g.income=d.income;g.best=d.best;g.returnCostPaid=d.returnCostPaid;g.returning=false;g.engine.cooldown=d.cooldown;g.engine.scanCooldown=d.scanCooldown;g.engine.transition=d.transition;g.paused=true;return g;
 }catch(_){return null;}}
