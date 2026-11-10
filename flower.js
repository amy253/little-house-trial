(function(root){
  const DAILY_LIMIT=2,BONUS_LIMIT=3,VISIT_MS=10000,SPROUT=1,BUD=30,BLOOM=60,LEGACY_MAX=120,WITHER_DAYS=3;

  function dayKey(date=new Date()){
    const pad=value=>String(value).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  }

  function validDay(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'));}
  function start(saved,today=dayKey()){
    return {
      total:Math.max(0,Math.min(LEGACY_MAX,Math.floor(Number(saved?.total)||0))),
      day:typeof saved?.day==='string'?saved.day:'',
      used:Math.max(0,Math.min(DAILY_LIMIT,Math.floor(Number(saved?.used)||0))),
      bonusEarned:Math.max(0,Math.min(BONUS_LIMIT,Math.floor(Number(saved?.bonusEarned)||0))),
      bonusUsed:Math.max(0,Math.min(BONUS_LIMIT,Math.floor(Number(saved?.bonusUsed)||0))),
      visitDay:typeof saved?.visitDay==='string'?saved.visitDay:'',
      visitStartedAt:Number.isFinite(Number(saved?.visitStartedAt))?Number(saved.visitStartedAt):0,
      visitLeftAt:Number.isFinite(Number(saved?.visitLeftAt))?Number(saved.visitLeftAt):0,
      lastWaterDay:validDay(saved?.lastWaterDay)?saved.lastWaterDay:Number(saved?.total)>0?today:'',
      resetDay:validDay(saved?.resetDay)?saved.resetDay:'',
      withered:saved?.withered===true
    };
  }

  function forDay(state,day){
    const current=start(state,day);
    return current.day===day?current:{...current,day,used:0,bonusEarned:0,bonusUsed:0,visitDay:'',visitStartedAt:0,visitLeftAt:0};
  }

  function advance(state,day=dayKey()){
    const current=forDay(state,day);
    return !current.withered&&current.total>0&&dryDays(current,day)>=WITHER_DAYS?{...current,total:0,withered:true,resetDay:day}:current;
  }
  function dryDays(state,day){return state.lastWaterDay?Math.max(0,Math.round((Date.parse(day+'T00:00:00Z')-Date.parse(state.lastWaterDay+'T00:00:00Z'))/86400000)):0;}

  function view(state,day=dayKey()){
    const current=advance(state,day),total=current.total,used=current.used;
    const bonusRemaining=Math.max(0,current.bonusEarned-current.bonusUsed);
    const stage=total>=BLOOM?3:total>=BUD?2:total>=SPROUT?1:0;
    const goals=[{at:1,label:'发芽'},{at:4,label:'小苗长高'},{at:8,label:'枝叶舒展'},{at:18,label:'枝叶茂盛'},{at:BUD,label:'长出花苞'},{at:BLOOM,label:'开花'}],index=goals.findIndex(g=>g.at>total);
    const next=index<0?null:{...goals[index],from:index?goals[index-1].at:0,remaining:goals[index].at-total};
    const visual=stage===0?0:stage===1?.36+.64*(total-SPROUT)/(BUD-SPROUT):1,bloom=stage<2?0:stage===2?.42+.58*(total-BUD)/(BLOOM-BUD):1;
    return {total,stage,visual,bloom,next,withered:current.withered,lastWaterDay:current.lastWaterDay,daysUntilWither:current.withered?0:total>0?Math.max(0,WITHER_DAYS-dryDays(current,day)):null,phaseProgress:next?(total-next.from)/(next.at-next.from):1,remainingToday:DAILY_LIMIT-used+bonusRemaining,bonusRemaining,bonusEarned:current.bonusEarned};
  }

  function water(state,day=dayKey()){
    const current=advance(state,day),summary=view(current,day);
    if(summary.remainingToday===0) return current;
    const cared={...current,total:current.total>=BLOOM?current.total:current.total+1,lastWaterDay:day,withered:false};
    if(current.used<DAILY_LIMIT) return {...cared,used:current.used+1};
    return {...cared,bonusUsed:current.bonusUsed+1};
  }

  function beginIslandVisit(state,startedAt=Date.now(),day=dayKey(new Date(startedAt))){
    const current=advance(state,day);
    if(current.bonusEarned>=BONUS_LIMIT) return current;
    return {...current,visitDay:day,visitStartedAt:startedAt,visitLeftAt:0};
  }

  function markIslandLeft(state,leftAt=Date.now(),day=dayKey(new Date(leftAt))){
    const current=advance(state,day);
    if(current.visitDay!==day||!current.visitStartedAt||current.visitLeftAt) return current;
    return {...current,visitLeftAt:leftAt};
  }

  function finishIslandVisit(state,finishedAt=Date.now(),day=dayKey(new Date(finishedAt))){
    const current=advance(state,day);
    if(!current.visitLeftAt) return current;
    const valid=current.visitDay===day&&finishedAt-current.visitLeftAt>=VISIT_MS;
    if(!valid) return {...current,visitDay:'',visitStartedAt:0,visitLeftAt:0};
    return {...current,bonusEarned:Math.min(BONUS_LIMIT,current.bonusEarned+1),visitDay:'',visitStartedAt:0,visitLeftAt:0};
  }

  const api={dayKey,start,advance,view,water,beginIslandVisit,markIslandLeft,finishIslandVisit,DAILY_LIMIT,BONUS_LIMIT,VISIT_MS,BUD,BLOOM,WITHER_DAYS};
  if(typeof module!=='undefined') module.exports=api; else root.FlowerGrowth=api;
})(typeof window==='undefined'?globalThis:window);
