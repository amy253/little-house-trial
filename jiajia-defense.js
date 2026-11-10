(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JiajiaDefense=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const SAVE_KEY='little-house-jiajia-defense-v1',COLS=10,ROWS=12;
 const TOWERS={rapid:{name:'速射炮',cost:65,range:2.4,damage:12,period:.4,sprite:249,shot:273},cannon:{name:'榴弹炮',cost:100,range:2.8,damage:33,period:1.05,splash:1.05,sprite:250,shot:251},frost:{name:'减速炮',cost:80,range:2.6,damage:7,period:.7,slow:.45,sprite:203,shot:275}};
 const maps=[
  {name:'青草弯道',points:[[0,2],[7,2],[7,5],[2,5],[2,9],[9,9]]},
  {name:'溪谷回廊',points:[[0,1],[5,1],[5,4],[1,4],[1,8],[7,8],[7,10],[9,10]]},
  {name:'松林双湾',points:[[0,2],[3,2],[3,6],[7,6],[7,3],[9,3]]},
  {name:'南坡防线',points:[[0,9],[3,9],[3,3],[7,3],[7,8],[9,8]]},
  {name:'环山小径',points:[[0,1],[8,1],[8,8],[5,8],[5,4],[2,4],[2,10],[9,10]]},
  {name:'最后的营地',points:[[0,3],[6,3],[6,1],[9,1],[9,7],[3,7],[3,10],[9,10]]}
 ];
 function pathFor(points){const path=[{x:points[0][0],y:points[0][1]}];for(let i=1;i<points.length;i++){let {x,y}=path[path.length-1];const [tx,ty]=points[i];while(x!==tx||y!==ty){x+=Math.sign(tx-x);y+=Math.sign(ty-y);path.push({x,y});}}return path;}
 function create(index=0){index=Number.isInteger(index)&&maps[index]?index:0;return {index,name:maps[index].name,cols:COLS,rows:ROWS,path:pathFor(maps[index].points),phase:'build',resumePhase:null,coins:245,lives:8,maxLives:8,wave:0,totalWaves:5,waveCount:0,spawned:0,spawnClock:0,enemies:[],towers:[],shots:[],nextId:1,kills:0,elapsed:0,revives:0,shotsFired:0,breathing:0};}
 function active(s){return s.phase==='build'||s.phase==='playing';}
 function canBuild(s,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<s.cols&&y<s.rows&&!s.path.some(p=>p.x===x&&p.y===y)&&!s.towers.some(t=>t.x===x&&t.y===y);}
 function build(s,x,y,kind){const spec=Object.prototype.hasOwnProperty.call(TOWERS,kind)?TOWERS[kind]:null;if(!active(s))return {ok:false,reason:'请先继续游戏'};if(!spec||!canBuild(s,x,y))return {ok:false,reason:'请点空草地，不能占用道路'};if(s.coins<spec.cost)return {ok:false,reason:'金币不够，消灭敌人可获得金币'};s.coins-=spec.cost;const tower={id:s.nextId++,x,y,kind,level:1,cooldown:0,angle:0};s.towers.push(tower);return {ok:true,tower};}
 function upgradeCost(t){return t.level<3?Math.round(TOWERS[t.kind].cost*(.65+t.level*.25)):Infinity;}
 function upgrade(s,id){const t=s.towers.find(t=>t.id===id);if(!active(s)||!t)return {ok:false,reason:'请先选择炮台'};const cost=upgradeCost(t);if(t.level>=3)return {ok:false,reason:'已升到最高三级'};if(s.coins<cost)return {ok:false,reason:'升级金币不足'};s.coins-=cost;t.level++;return {ok:true};}
 function startWave(s){if(s.phase!=='build'||s.wave>=s.totalWaves)return false;s.phase='playing';s.wave++;s.waveCount=7+s.wave*2+Math.floor(s.index/2);s.spawned=0;s.spawnClock=.4;return true;}
 function position(s,e){const n=Math.max(0,Math.min(s.path.length-1,e.progress)),i=Math.floor(n),a=s.path[i],b=s.path[Math.min(i+1,s.path.length-1)],f=n-i;return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,angle:Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2};}
 function spawn(s){const kind=s.spawned%5===4?2:s.spawned%3===1?1:0;const hp=(30+s.wave*13+s.index*7)*(kind===2?1.65:kind===1?.75:1);s.enemies.push({id:s.nextId++,progress:0,hp,maxHp:hp,speed:(kind===1?1.04:kind===2?.58:.75)+s.wave*.025,kind,slowFor:0,slow:1});s.spawned++;}
 function step(s,dt){
  s.elapsed+=dt;s.shots=s.shots.filter(p=>(p.life-=dt)>0);
  if(s.breathing>0){s.breathing=Math.max(0,s.breathing-dt);return;}
  s.spawnClock-=dt;while(s.spawned<s.waveCount&&s.spawnClock<=0){spawn(s);s.spawnClock+=.85;}
  for(const e of s.enemies){e.slowFor=Math.max(0,e.slowFor-dt);e.progress+=e.speed*(e.slowFor>0?e.slow:1)*dt;}
  for(const tower of s.towers){
   tower.cooldown=Math.max(0,tower.cooldown-dt);const spec=TOWERS[tower.kind],range=spec.range+(tower.level-1)*.23;
   const targets=s.enemies.filter(e=>e.hp>0&&Math.hypot(position(s,e).x-tower.x,position(s,e).y-tower.y)<=range).sort((a,b)=>b.progress-a.progress);
   const enemy=targets[0];if(!enemy)continue;const p=position(s,enemy);tower.angle=Math.atan2(p.y-tower.y,p.x-tower.x)+Math.PI/2;
   if(tower.cooldown>0)continue;tower.cooldown=spec.period/(1+(tower.level-1)*.18);s.shotsFired++;
   s.shots.push({x:tower.x,y:tower.y,tx:p.x,ty:p.y,kind:tower.kind,life:.17,maxLife:.17,angle:tower.angle});
   const hit=spec.splash?s.enemies.filter(e=>e.hp>0&&Math.hypot(position(s,e).x-p.x,position(s,e).y-p.y)<=spec.splash):[enemy];
   for(const e of hit){e.hp-=spec.damage*(1+(tower.level-1)*.55);if(spec.slow){e.slow=spec.slow;e.slowFor=1.7+(tower.level-1)*.3;}}
  }
  const left=[];for(const e of s.enemies){if(e.hp<=0){s.coins+=e.kind===2?15:10;s.kills++;}else if(e.progress>=s.path.length-1){s.lives=Math.max(0,s.lives-(e.kind===2?2:1));}else left.push(e);}s.enemies=left;
  if(!s.lives){s.phase='lost';s.shots=[];return;}
  if(s.spawned===s.waveCount&&!s.enemies.length){s.coins+=35+s.wave*5;s.phase=s.wave===s.totalWaves?'won':'build';}
 }
 function tick(s,dt){if(s.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,1);while(left>1e-8&&s.phase==='playing'){const chunk=Math.min(.05,left);step(s,chunk);left-=chunk;}}
 function pause(s){if(!active(s))return false;s.resumePhase=s.phase;s.phase='paused';return true;}
 function resume(s){if(s.phase!=='paused')return false;s.phase=s.resumePhase==='build'?'build':'playing';s.resumePhase=null;return true;}
 function revive(s){if(s.phase!=='lost'||s.revives>=2)return false;s.revives++;s.lives=s.maxLives;s.enemies=[];s.shots=[];s.breathing=3;s.spawnClock=Math.max(s.spawnClock,1.5);s.phase='paused';s.resumePhase='playing';return true;}
 function normalizeSave(raw){raw=raw&&typeof raw==='object'?raw:{};const unlocked=Number.isInteger(raw.unlocked)?Math.max(1,Math.min(maps.length,raw.unlocked)):1,selected=Number.isInteger(raw.selected)?Math.max(0,Math.min(unlocked-1,raw.selected)):0,bestLives={};for(let i=0;i<maps.length;i++){const n=raw.bestLives?.[i];if(Number.isInteger(n)&&n>=1&&n<=8)bestLives[i]=n;}return {unlocked,selected,bestLives};}
 function complete(raw,index,lives){const save=normalizeSave(raw);if(Number.isInteger(index)&&maps[index]){save.unlocked=Math.max(save.unlocked,Math.min(maps.length,index+2));if(Number.isInteger(lives)&&lives>0&&lives<=8)save.bestLives[index]=Math.max(save.bestLives[index]||0,lives);}return save;}
 function load(storage){try{return normalizeSave(JSON.parse(storage.getItem(SAVE_KEY)));}catch(_){return normalizeSave(null);}}
 function persist(storage,save){try{storage.setItem(SAVE_KEY,JSON.stringify(normalizeSave(save)));return true;}catch(_){return false;}}
 return {SAVE_KEY,TOWERS,maps,create,canBuild,build,upgradeCost,upgrade,startWave,position,tick,pause,resume,revive,normalizeSave,complete,load,persist};
});
