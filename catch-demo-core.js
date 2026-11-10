(function(root){
  const levelPlans=[
    {flower:6,house:6,buli:6},
    {flower:9,house:9,bow:9,note:9,star:9,buli:9,ticket:9,gift:9},
    {flower:9,house:9,mic:9,bow:9,note:9,star:9,buli:9,ticket:9,gift:9},
    {flower:12,house:12,mic:12,bow:9,note:9,star:9,buli:9,ticket:9,gift:9},
    {flower:12,house:12,mic:12,bow:12,note:12,star:12,buli:9,ticket:9,gift:9},
  ];
  function levelKinds(level){
    const plan=levelPlans[level-1];
    if(!plan)throw new RangeError('Unknown catch level');
    const kinds=Object.entries(plan).flatMap(([kind,count])=>Array(count).fill(kind));
    let seed=level*7919;
    for(let i=kinds.length-1;i>0;i--){
      seed=(seed*1664525+1013904223)>>>0;
      const j=seed%(i+1);
      [kinds[i],kinds[j]]=[kinds[j],kinds[i]];
    }
    return kinds;
  }
  function create(kinds){
    return {items:kinds.map((kind,id)=>({id,kind,removed:false})),tray:[],status:'playing'};
  }

  function pick(game,id){
    const item=game.items[id];
    if(game.status!=='playing'||!item||item.removed) return {kind:'ignored'};
    item.removed=true;
    game.tray.push({id,kind:item.kind});
    const matching=game.tray.filter(entry=>entry.kind===item.kind);
    if(matching.length===3){
      const matchedIds=matching.map(entry=>entry.id);
      game.tray=game.tray.filter(entry=>entry.kind!==item.kind);
      if(game.items.every(entry=>entry.removed)){
        game.status='won';
        return {kind:'won',matchedIds};
      }
      return {kind:'matched',matchedIds};
    }
    if(game.tray.length===7){
      game.status='lost';
      return {kind:'lost',id};
    }
    return {kind:'added',id};
  }

  function moveOut(game){
    if(game.status!=='playing'&&game.status!=='lost')return [];
    const entries=game.tray.splice(-3);
    for(const entry of entries)game.items[entry.id].removed=false;
    if(entries.length)game.status='playing';
    return entries.map(entry=>entry.id);
  }

  function revive(game,reason='full'){
    if(game.status!=='lost')return false;
    if(reason==='time'){game.status='playing';return [];}
    const ids=moveOut(game);return ids.length?ids:false;
  }
const api={revive,create,pick,moveOut,levelKinds,maxLevel:levelPlans.length};
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CatchDemoCore=api;
})(typeof window==='undefined'?globalThis:window);
