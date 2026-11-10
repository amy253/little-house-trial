(function(root){
  const COLS=7;
  const DANGER_ROW=8;
  const BONUS_TYPES=['ball','bomb','pierce'];

  function random(game){
    game.seed=(Math.imul(game.seed,1664525)+1013904223)>>>0;
    return game.seed/4294967296;
  }

  function shuffledColumns(game){
    const columns=Array.from({length:COLS},(_,index)=>index);
    for(let index=columns.length-1;index>0;index--){
      const other=Math.floor(random(game)*(index+1));
      [columns[index],columns[other]]=[columns[other],columns[index]];
    }
    return columns;
  }

  function makeRow(game){
    let count;
    if(game.round<=2)count=1;
    else if(game.round<=6)count=2;
    else if(game.round<=10)count=3;
    else count=Math.min(6,3+Math.floor((game.round-7)/5)+(random(game)<.35?1:0));
    const columns=shuffledColumns(game).slice(0,count);
    const minimum=game.round<=2?1:Math.max(2,Math.floor(game.round*.65));
    const row=columns.map((col,index)=>{
      const spread=game.round<=2?0:Math.max(1,Math.floor(game.round*.28));
      const hp=minimum+Math.floor(random(game)*(spread+1))+(game.round>=15&&index===0?7:0);
      return {id:game.nextId++,col,row:0,hp,maxHp:hp};
    });
    game.blocks.push(...row);
    const empty=shuffledColumns(game).find(col=>!columns.includes(col));
    const guaranteed=game.round===1||game.round%4===0;
    if(empty!==undefined&&(guaranteed||random(game)<Math.min(.58,.24+game.round*.014))){
      const type=game.round===1?'ball':BONUS_TYPES[Math.floor(random(game)*BONUS_TYPES.length)];
      game.bonuses.push({id:game.nextId++,col:empty,row:0,type});
    }
    return row;
  }

  function createGame(seed){
    const initialSeed=(seed===undefined?(Math.random()*0xffffffff):seed)>>>0||1;
    const game={seed:initialSeed,initialSeed,round:1,balls:4,pendingBalls:0,
      pierceBalls:0,pendingPierce:0,launchX:216,blocks:[],bonuses:[],nextId:1,
      score:0,status:'aiming'};
    makeRow(game);
    return game;
  }

  function hitBlock(game,id,damage=1){
    const block=game.blocks.find(item=>item.id===id);
    if(!block)return {destroyed:false,missing:true};
    const dealt=Math.min(block.hp,Math.max(0,damage));
    block.hp-=dealt;
    game.score+=dealt;
    if(block.hp<=0){
      game.blocks=game.blocks.filter(item=>item.id!==id);
      game.score+=2;
      return {destroyed:true,block};
    }
    return {destroyed:false,block};
  }

  function explode(game,id){
    const center=game.blocks.find(item=>item.id===id);
    if(!center)return [];
    const targets=game.blocks.filter(item=>Math.abs(item.col-center.col)+Math.abs(item.row-center.row)<=1).map(item=>item.id);
    return targets.map(target=>hitBlock(game,target,3));
  }

  function collectBonus(game,type){
    if(type==='ball')game.pendingBalls++;
    if(type==='pierce')game.pendingPierce+=3;
    if(type==='bomb'){
      const ids=game.blocks.map(item=>item.id);
      for(const id of ids)hitBlock(game,id,2);
    }
    return type;
  }

  function removeBonus(game,id){
    const bonus=game.bonuses.find(item=>item.id===id);
    if(!bonus)return null;
    game.bonuses=game.bonuses.filter(item=>item.id!==id);
    collectBonus(game,bonus.type);
    return bonus;
  }

  function finishVolley(game,landingX){
    if(game.status==='lost')return {type:'game-over'};
    game.launchX=Math.max(18,Math.min(414,landingX));
    game.balls+=game.pendingBalls;
    game.pendingBalls=0;
    game.pierceBalls=game.pendingPierce;
    game.pendingPierce=0;
    for(const item of game.blocks)item.row++;
    for(const item of game.bonuses)item.row++;
    game.bonuses=game.bonuses.filter(item=>item.row<DANGER_ROW);
    if(game.blocks.some(item=>item.row>=DANGER_ROW)){
      game.status='lost';
      return {type:'game-over'};
    }
    game.round++;
    makeRow(game);
    game.status='aiming';
    return {type:'next-round',round:game.round};
  }

  function restart(game){
    return createGame(game&&game.initialSeed);
  }

  function revive(game){
    if(game.status!=='lost')return false;
    game.blocks=game.blocks.filter(item=>item.row<DANGER_ROW-1);
    game.bonuses=game.bonuses.filter(item=>item.row<DANGER_ROW-1);
    game.status='aiming';return true;
  }
const api={revive,COLS,DANGER_ROW,BONUS_TYPES,createGame,makeRow,hitBlock,explode,collectBonus,removeBonus,finishVolley,restart};
  if(typeof module!=='undefined')module.exports=api;else root.BounceJiajia=api;
})(typeof window==='undefined'?globalThis:window);
