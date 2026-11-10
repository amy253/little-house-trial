// Soft brush kernel / visible-cell progress adapted from Spotless CleanMask.gd.
// Copyright (c) 2026 Matswm86, MIT. See vendor/wash/SPOTLESS-LICENSE.txt.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BuliWash=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const SIZE=64,DONE=.88,SAVE_KEY='little-house-buli-wash-v1',ASSETS=['bathroomSink','sedan','loungeChair','truck','televisionVintage'],NAMES=['洗手台','小轿车','扶手椅','小货车','复古电视'];
 const NOZZLES={fan:{name:'扇形',radius:.115,power:3.2,cost:2.2},jet:{name:'细柱',radius:.055,power:6.5,cost:1.1},shower:{name:'花洒',radius:.16,power:1.7,cost:3.4}};
 const UPGRADE_COSTS=[150,350,700];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function create(seed=1,order=1,credits=0,profile={}){const i=(order-1)%ASSETS.length;return{seed:seed>>>0,order,credits,upgrades:profile.upgrades||0,collection:{...(profile.collection||{})},asset:ASSETS[i],name:NAMES[i],water:100,nozzle:'fan',cleaned:Array(SIZE*SIZE).fill(0),coverage:Array(SIZE*SIZE).fill(0),loaded:false,paused:true,status:'playing',revives:0,paid:false,revision:0};}
 function upgrade(g){const cost=UPGRADE_COSTS[g.upgrades];if(!g.paused||g.status==='lost'||cost===undefined||g.credits<cost)return false;g.credits-=cost;g.upgrades++;return true;}
 function bind(g,coverage){if(!Array.isArray(coverage)||coverage.length!==SIZE*SIZE||!coverage.every(v=>v===0||v===1)||coverage.reduce((a,v)=>a+v,0)<16)return false;g.coverage=[...coverage];g.loaded=true;g.revision++;return true;}
 function kernel(d){const w=clamp(1-d,0,1);return w*w*(3-2*w);}
 function hardness(g,i){let n=Math.imul((i+g.seed)^Math.imul(g.order,2654435761),1597334677);n^=n>>>16;return .75+((n>>>0)%1000)/2000;}
 function progress(g){let total=0,done=0;for(let i=0;i<g.cleaned.length;i++)if(g.coverage[i]){total++;if(g.cleaned[i]>=DONE)done++;}return total?done/total:0;}
 function dirtiest(g){const counts=Array(9).fill(0),names=['左下方','下方','右下方','左侧','中间','右侧','左上方','上方','右上方'];for(let i=0;i<g.cleaned.length;i++)if(g.coverage[i]&&g.cleaned[i]<DONE){const x=i%SIZE,y=Math.floor(i/SIZE);counts[Math.min(2,Math.floor(y/SIZE*3))*3+Math.min(2,Math.floor(x/SIZE*3))]++;}return names[counts.indexOf(Math.max(...counts))];}
 function setNozzle(g,id){if(!Object.hasOwn(NOZZLES,id)||g.status!=='playing')return false;g.nozzle=id;return true;}
 function spray(g,point,seconds){
  const result={changed:false,removed:0};if(!g.loaded||g.paused||g.status!=='playing'||!Number.isFinite(seconds)||seconds<=0)return result;
  if(point!==null&&(!point||![point.u,point.v].every(Number.isFinite)||point.u<0||point.u>1||point.v<0||point.v>1))return result;
  const nozzle=NOZZLES[g.nozzle],dt=Math.min(.05,seconds,g.water/nozzle.cost);g.water=Math.max(0,g.water-dt*nozzle.cost);if(g.water<1e-8)g.water=0;
  if(point){const cx=point.u*SIZE,cy=point.v*SIZE,r=nozzle.radius*SIZE;
   for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(SIZE,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(SIZE,Math.ceil(cx+r));x++){const i=y*SIZE+x;if(!g.coverage[i])continue;const weight=kernel(Math.hypot(x+.5-cx,y+.5-cy)/r),old=g.cleaned[i];g.cleaned[i]=Math.min(1,old+weight*dt*nozzle.power*(1+g.upgrades*.2)/hardness(g,i));result.removed+=g.cleaned[i]-old;}
  }
  result.changed=result.removed>0;if(result.changed)g.revision++;
  if(progress(g)>=.96){g.cleaned.fill(1);g.revision++;g.status='won';g.paused=true;if(!g.paid){g.reward=80+g.order*12+Math.round(g.water*2);g.credits=Math.min(1e12,g.credits+g.reward);g.collection[g.asset]=Math.min(1e8,(g.collection[g.asset]||0)+1);g.paid=true;}}
  else if(g.water<=0){g.status='lost';g.paused=true;}return result;
 }
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.water=55;g.status='playing';g.paused=true;return true;}
 function next(g){return g.status==='won'?create(g.seed,g.order+1,g.credits,g):null;}
 function retry(g){return create(g.seed,g.order,g.credits,g);}
 function save(g){const {name,revision,...data}=g;data.cleaned=g.cleaned.map(v=>Math.round(v*10000)/10000);return JSON.stringify({version:1,game:data});}
 function restore(json){try{if(typeof json!=='string'||json.length>180000)return null;const data=JSON.parse(json),s=data.game;if(data.version!==1||!s)return null;
  const int=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b,arr=(a,fn)=>Array.isArray(a)&&a.length===SIZE*SIZE&&a.every(fn);
  if(!int(s.seed,0,4294967295)||!int(s.order,1,100000000)||!int(s.credits,0,1e12)||!int(s.revives,0,2)||typeof s.water!=='number'||!Number.isFinite(s.water)||s.water<0||s.water>100||!Object.hasOwn(NOZZLES,s.nozzle)||typeof s.loaded!=='boolean'||typeof s.paid!=='boolean')return null;
  if(!arr(s.cleaned,v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)||!arr(s.coverage,v=>v===0||v===1)||!['playing','lost','won'].includes(s.status))return null;
  if(s.upgrades!==undefined&&!int(s.upgrades,0,3)||s.collection!==undefined&&(!s.collection||typeof s.collection!=='object'||Array.isArray(s.collection)||!Object.entries(s.collection).every(([k,v])=>ASSETS.includes(k)&&int(v,0,1e8))))return null;
  const g=create(s.seed,s.order,s.credits,s);if(s.asset!==g.asset)return null;for(const k of ['water','nozzle','cleaned','coverage','loaded','status','revives','paid'])g[k]=s[k];
  const count=g.coverage.reduce((a,v)=>a+v,0);if(g.loaded&&count<16||!g.loaded&&(count||g.cleaned.some(v=>v!==0)||g.status!=='playing'||g.paid))return null;
  if(g.paid!==(g.status==='won')||g.status==='won'&&progress(g)<.96||g.status==='lost'&&(g.water!==0||progress(g)>=.96)||g.status==='playing'&&g.water===0)return null;
  if(g.status==='won'){g.reward=80+g.order*12+Math.round(g.water*2);if(s.collection===undefined)g.collection[g.asset]=1;}return g;
 }catch(_){return null;}}
 return{SIZE,DONE,SAVE_KEY,ASSETS,NAMES,NOZZLES,UPGRADE_COSTS,create,upgrade,bind,kernel,progress,dirtiest,setNozzle,spray,revive,next,retry,save,restore};
});
