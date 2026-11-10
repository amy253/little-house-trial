(function(root){
  const Growth=typeof module!=='undefined'?require('./flower.js'):root.FlowerGrowth;

  function snapshot(value){
    const state=Growth.start(value);
    return {total:state.total,day:state.day,used:state.used,bonusEarned:state.bonusEarned,bonusUsed:state.bonusUsed,lastWaterDay:state.lastWaterDay,resetDay:state.resetDay,withered:state.withered};
  }

  function choose(local,remote){
    if(!remote) return snapshot(local);
    if(!local) return snapshot(remote);
    const a=snapshot(local),b=snapshot(remote);
    if(a.resetDay!==b.resetDay){const newer=a.resetDay>b.resetDay?a:b;return a.day===b.day?{...newer,used:Math.max(a.used,b.used),bonusEarned:Math.max(a.bonusEarned,b.bonusEarned),bonusUsed:Math.max(a.bonusUsed,b.bonusUsed)}:newer;}
    if(a.day===b.day) return {
      total:Math.max(a.total,b.total),day:a.day,
      used:Math.max(a.used,b.used),
      bonusEarned:Math.max(a.bonusEarned,b.bonusEarned),
      bonusUsed:Math.max(a.bonusUsed,b.bonusUsed),
      lastWaterDay:a.lastWaterDay>b.lastWaterDay?a.lastWaterDay:b.lastWaterDay,
      resetDay:a.resetDay,withered:a.withered&&b.withered
    };
    if(a.total!==b.total) return a.total>b.total?a:b;
    return a.day>b.day?a:b;
  }

  async function sync(store,local){
    const remote=await store.read();
    const selected=choose(local,remote);
    if(!remote||JSON.stringify(selected)!==JSON.stringify(snapshot(remote))){
      await store.write(selected);
    }
    return selected;
  }

  const api={snapshot,choose,sync};
  if(typeof module!=='undefined') module.exports=api; else root.FlowerCloud=api;
})(typeof window==='undefined'?globalThis:window);
