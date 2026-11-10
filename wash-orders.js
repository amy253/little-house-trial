(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./buli-wash'):root.BuliWash);if(typeof module==='object'&&module.exports)module.exports=api;root.BuliWash=api;})(typeof globalThis==='object'?globalThis:this,function(B){
 'use strict';
 const OBJECTS=[['bathroomSink','洗手台',['wash','scrub','polish']],['sedan','小轿车',['foam','wash','polish']],['loungeChair','扶手椅',['wash','scrub']],['truck','小货车',['wash','sand','polish']],['televisionVintage','复古电视',['wash','scrub','polish']],['taxi','出租车',['foam','wash','polish']],['dumpster','垃圾箱',['wash','sand','polish']],['planter','花箱',['wash','scrub']]];
 const TOOLS={wash:{name:'冲洗',action:'冲掉泥污',cost:2.2,radius:.115,power:3.2},foam:{name:'泡沫',action:'覆上泡沫软化油污',cost:.9,radius:.16,power:5},scrub:{name:'刷洗',action:'擦掉深色顽固污渍',cost:0,radius:.1,power:8},sand:{name:'除锈',action:'磨掉橙色锈斑',cost:0,radius:.085,power:9},polish:{name:'抛光',action:'擦亮已经洗净的表面',cost:0,radius:.14,power:5}};
 const COSTS={pressure:B.UPGRADE_COSTS,tank:[160,400,800],tools:[180,420,850]},FREE_SAVE_KEY='little-house-buli-wash-free-v2',JOB_SAVE_KEY='little-house-buli-wash-orders-v2';
 function stage(g){return g.rules===2?TOOLS[g.stages[g.stageIndex]]:{...TOOLS.wash,tool:'wash'};}
 // Recipes use the tool id as well as its visible name.
 for(const [id,t]of Object.entries(TOOLS))t.tool=id;
 function dirtAt(g,i){if(g.dirtVersion===1){const x=i%64,y=Math.floor(i/64),n=(Math.imul(Math.floor(x/6)+Math.floor(y/6)*17+g.seed+g.order*31,1597334677)>>>0)%7;return n<3?(g.stages.includes('sand')?2:g.stages.includes('scrub')?1:0):0;}const x=(i%64)/11,y=Math.floor(i/64)/11,ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,fx=u*u*(3-2*u),fy=v*v*(3-2*v),hash=(a,b)=>{let n=Math.imul(a+b*71+g.seed+g.order*31,1597334677);n^=n>>>16;return(n>>>0)/4294967295;},bottom=hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx,top=hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx,n=bottom*(1-fy)+top*fy;return n<.46?(g.stages.includes('sand')?2:g.stages.includes('scrub')?1:0):0;}

 function targets(g){const kind=g.stages[g.stageIndex],type=kind==='scrub'?1:kind==='sand'?2:0;g.targets=g.coverage.map((v,i)=>v&&(!type||dirtAt(g,i)===type)?1:0);if(!g.targets.some(Boolean))g.targets=[...g.coverage];}
 function createJob(seed=1,order=1,credits=0,profile={},choice=0,mode='standard'){
  const g=B.create(seed,order,credits,profile),entry=OBJECTS[(order-1+choice)%OBJECTS.length];
  Object.assign(g,{rules:2,dirtVersion:2,mode,choice,asset:entry[0],name:entry[1],stages:[...entry[2]],stageIndex:0,tool:entry[2][0],tankLevel:profile.tankLevel||0,toolLevel:profile.toolLevel||0,work:0,waste:0,stars:0,best:{...(profile.best||{})},lastAction:'ready'});
  g.maxWater=100+g.tankLevel*20;g.water=g.maxWater;targets(g);return g;
 }
 function bind(g,coverage){if(!B.bind(g,coverage))return false;if(g.rules===2)targets(g);return true;}
 function stageProgress(g){let all=0,done=0;for(let i=0;i<4096;i++)if(g.targets[i]){all++;done+=Math.min(1,g.cleaned[i]/B.DONE);}return all?done/all:0;}
 function progress(g){return g.rules===2?g.status==='won'?1:(g.stageIndex+stageProgress(g))/g.stages.length:B.progress(g);}
 function rating(g){const effective=1-g.waste/Math.max(.001,g.work);return effective>=.8&&g.water/g.maxWater>=.3&&!g.revives?3:effective>=.5&&g.water/g.maxWater>=.1&&g.revives<2?2:1;}
 function pay(g){g.status='won';g.paused=true;g.stars=g.mode==='free'?0:rating(g);if(!g.paid){g.reward=g.mode==='free'?0:80+g.order*12+g.stars*30+Math.round(g.water/2);g.credits=Math.min(1e12,g.credits+g.reward);if(g.mode!=='free'){g.collection[g.asset]=Math.min(1e8,(g.collection[g.asset]||0)+1);g.best[g.asset]=Math.max(g.best[g.asset]||0,g.stars);}g.paid=true;}}
 function spray(g,point,seconds){
  if(g.rules!==2)return B.spray(g,point,seconds);
  const result={changed:false,removed:0};if(!g.loaded||g.paused||g.status!=='playing'||!Number.isFinite(seconds)||seconds<=0)return result;
  if(point!==null&&(!point||![point.u,point.v].every(Number.isFinite)||point.u<0||point.u>1||point.v<0||point.v>1))return result;
  const t=g.tool==='wash'?{...TOOLS.wash,...B.NOZZLES[g.nozzle]}:TOOLS[g.tool],cost=t.cost/(1+g.toolLevel*.12),dt=Math.min(.05,seconds,(g.mode==='free'||cost===0)?0.05:g.water/cost);
  if(g.mode!=='free')g.water=Math.max(0,g.water-dt*cost);if(g.water<1e-8)g.water=0;g.work+=dt;g.lastAction=!point?'miss':g.tool!==stage(g).tool?'wrong-tool':'clean';
  if(point&&g.tool===stage(g).tool){const cx=point.u*64,cy=point.v*64,r=t.radius*64,power=t.power*(g.tool==='wash'?1.5:1.25)*(1+(g.tool==='wash'?g.upgrades*.2:g.toolLevel*.2));
   for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(64,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(64,Math.ceil(cx+r));x++){const i=y*64+x;if(!g.targets[i])continue;const old=g.cleaned[i];g.cleaned[i]=Math.min(1,old+B.kernel(Math.hypot(x+.5-cx,y+.5-cy)/r)*dt*power);result.removed+=g.cleaned[i]-old;}
  }
  result.changed=result.removed>0;if(result.changed)g.revision++;else{g.waste+=dt;if(g.lastAction==='clean')g.lastAction='already-clean';}
  if(stageProgress(g)>=.96){g.cleaned.fill(1);g.revision++;if(g.stageIndex===g.stages.length-1)pay(g);else{g.stageIndex++;g.cleaned.fill(0);targets(g);g.lastAction='stage-done';}}
  if(g.status==='playing'&&g.mode!=='free'&&g.water<=0){g.status='lost';g.paused=true;}
  return result;
 }
 function stroke(g,from,to,seconds){
  if(!from||!to||!Number.isFinite(seconds)||seconds<=0)return spray(g,to,seconds);
  if(![from.u,from.v,to.u,to.v].every(v=>Number.isFinite(v)&&v>=0&&v<=1))return{changed:false,removed:0};
  const radius=g.rules===2&&g.tool!=='wash'?TOOLS[g.tool].radius:B.NOZZLES[g.nozzle].radius,count=Math.max(1,Math.min(32,Math.ceil(Math.hypot(to.u-from.u,to.v-from.v)/(radius*.35)))),dt=Math.min(.05,seconds)/count,phase=g.stageIndex;
  const result={changed:false,removed:0};for(let n=1;n<=count;n++){const r=spray(g,{u:from.u+(to.u-from.u)*n/count,v:from.v+(to.v-from.v)*n/count},dt);result.changed=result.changed||r.changed;result.removed+=r.removed;if(g.paused||g.status!=='playing'||g.stageIndex!==phase)break;}return result;
 }
 function setTool(g,id){if(g.rules!==2||!Object.hasOwn(TOOLS,id)||g.status!=='playing')return false;g.tool=id;g.lastAction='ready';return true;}
 function buy(g,kind){const key={pressure:'upgrades',tank:'tankLevel',tools:'toolLevel'}[kind],cost=COSTS[kind]?.[g[key]];if(g.rules!==2||g.mode==='free'||!g.paused||g.status==='lost'||cost===undefined||g.credits<cost)return false;g.credits-=cost;g[key]++;return true;}
 function revive(g){if(g.rules!==2)return B.revive(g);if(g.status!=='lost'||g.revives>=2||g.mode==='free')return false;g.revives++;g.water=55;g.status='playing';g.paused=true;return true;}
 function offers(g){return[0,1,2].map(choice=>{const e=OBJECTS[(g.order+choice)%OBJECTS.length];return{choice,asset:e[0],name:e[1],steps:e[2].map(id=>TOOLS[id].name).join(' → '),base:80+(g.order+1)*12};});}
 function next(g){return g.status==='won'?(g.rules===2?createJob(g.seed,g.order+1,g.credits,g,0,g.mode):B.next(g)):null;}
 function retry(g){return g.rules===2?createJob(g.seed,g.order,g.credits,g,g.choice,g.mode):B.retry(g);}
 function save(g){if(g.rules!==2)return B.save(g);const {name,revision,stages,targets,lastAction,...data}=g;data.cleaned=g.cleaned.map(v=>Math.round(v*10000)/10000);return JSON.stringify({version:2,game:data});}
 function restore(raw){
  try{if(typeof raw!=='string'||raw.length>200000)return null;const data=JSON.parse(raw);if(data.version!==2)return B.restore(raw);const s=data.game;if(!s||s.rules!==2)return null;
   const integer=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b,num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
   if(!integer(s.seed,0,4294967295)||!integer(s.order,1,1e8)||!integer(s.credits,0,1e12)||!integer(s.choice,0,2)||!['standard','free'].includes(s.mode)||!integer(s.upgrades,0,3)||!integer(s.tankLevel,0,3)||!integer(s.toolLevel,0,3)||!integer(s.revives,0,2)||!['playing','won','lost'].includes(s.status)||typeof s.loaded!=='boolean'||typeof s.paid!=='boolean'||!Object.hasOwn(TOOLS,s.tool)||!Object.hasOwn(B.NOZZLES,s.nozzle)||!num(s.work,0,1e9)||!num(s.waste,0,s.work)||!integer(s.stars,0,3))return null;
   const record=(r,max)=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.entries(r).every(([k,v])=>OBJECTS.some(e=>e[0]===k)&&integer(v,0,max));if(!record(s.collection,1e8)||!record(s.best,3))return null;
   const g=createJob(s.seed,s.order,s.credits,s,s.choice,s.mode);if(s.asset!==g.asset||!integer(s.stageIndex,0,g.stages.length-1)||![100,120,140,160].includes(s.maxWater)||s.maxWater>g.maxWater||!num(s.water,0,s.maxWater))return null;g.maxWater=s.maxWater;if(s.dirtVersion!==undefined&&s.dirtVersion!==1&&s.dirtVersion!==2)return null;g.dirtVersion=s.dirtVersion||(['scrub','sand'].includes(g.stages[s.stageIndex])?1:2);
   if(!Array.isArray(s.cleaned)||s.cleaned.length!==4096||!s.cleaned.every(v=>num(v,0,1))||!Array.isArray(s.coverage)||s.coverage.length!==4096||!s.coverage.every(v=>v===0||v===1))return null;
   for(const k of ['stageIndex','water','tool','nozzle','cleaned','coverage','loaded','status','revives','paid','work','waste','stars'])g[k]=s[k];targets(g);
   if(g.loaded&&g.coverage.reduce((a,v)=>a+v,0)<16||g.paid!==(g.status==='won')||g.status==='won'&&(g.stageIndex!==g.stages.length-1||stageProgress(g)<.96)||g.status==='lost'&&(g.water!==0||g.mode==='free')||g.status==='playing'&&g.mode!=='free'&&g.water===0||!g.loaded&&(g.stageIndex||g.cleaned.some(Boolean)||g.coverage.some(Boolean)||g.status!=='playing'))return null;
   if(g.status==='won')g.reward=g.mode==='free'?0:80+g.order*12+g.stars*30+Math.round(g.water/2);return g;
  }catch(_){return null;}
 }
 function dirtiest(g){return g.rules===2?B.dirtiest({...g,coverage:g.targets}):B.dirtiest(g);}
 return{...B,OBJECTS,TOOLS,COSTS,FREE_SAVE_KEY,JOB_SAVE_KEY,createJob,stage,stageProgress,dirtAt,bind,progress,rating,spray,stroke,setTool,buy,revive,offers,next,retry,save,restore,dirtiest};
});
