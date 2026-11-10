(function(root){
  const WIDTH=432;
  const BASKET_Y=438;
  const BASKET_HALF=40;
  const LEVELS=[
    {name:'第一间小屋',tip:'先熟悉左右接取。',target:8,maxMisses:4,speed:165,spawnEvery:1.35,hazardChance:0},
    {name:'夜空小径',tip:'快速落物与密集乌云，原版进阶挑战。',target:18,maxMisses:2,speed:290,spawnEvery:.65,hazardChance:.48},
    {name:'地狱夜雨',tip:'原版地狱关，失误一次即结束。',target:30,maxMisses:1,speed:465,spawnEvery:.36,hazardChance:.68}
  ];
  const NORMAL_LEVELS=[
    {...LEVELS[0]},
    {name:'轻快落下',tip:'落速稍快，仍然没有乌云。',target:12,maxMisses:4,speed:195,spawnEvery:1.35,hazardChance:0},
    {name:'留意乌云',tip:'速度不变，开始出现少量乌云。',target:16,maxMisses:4,speed:195,spawnEvery:1.35,hazardChance:.18},
    {name:'小屋接力',tip:'速度不变，小房子来得更密一些。',target:20,maxMisses:4,speed:195,spawnEvery:1.05,hazardChance:.18},
    {name:'夜空巡游',tip:'落速再次稍快，乌云比例不增加。',target:24,maxMisses:4,speed:230,spawnEvery:1.05,hazardChance:.18}
  ];
  function getLevels(mode='normal'){return mode==='challenge'?LEVELS:NORMAL_LEVELS;}

  function createGame(level=0,random=Math.random,mode='normal'){
    mode=mode==='challenge'?'challenge':'normal';
    const levels=getLevels(mode);
    level=Number.isInteger(level)?Math.max(0,Math.min(levels.length-1,level)):0;
    const config=levels[level];
    return {
      level,mode,...config,random,basketX:WIDTH/2,items:[],spawnTimer:.45,
      caught:0,misses:0,status:'playing'
    };
  }

  function moveBasket(game,x){
    game.basketX=Math.max(BASKET_HALF,Math.min(WIDTH-BASKET_HALF,x));
  }

  function step(game,dt){
    if(game.status!=='playing'||dt<=0) return [];
    const events=[];
    game.spawnTimer-=dt;
    while(game.spawnTimer<=0){
      game.items.push({
        kind:game.random()<game.hazardChance?'cloud':'star',
        x:28+game.random()*(WIDTH-56),y:-22,
        speed:game.speed*(.92+.16*game.random())
      });
      game.spawnTimer+=game.spawnEvery;
    }
    const remaining=[];
    for(const item of game.items){
      item.y+=item.speed*dt;
      if(item.y<BASKET_Y){remaining.push(item);continue;}
      const caught=Math.abs(item.x-game.basketX)<=BASKET_HALF+8;
      if(item.kind==='star'){
        if(caught){game.caught++;events.push({type:'catch',x:item.x,y:BASKET_Y});}
        else{game.misses++;events.push({type:'miss',x:item.x,y:BASKET_Y});}
      }else if(caught){
        game.misses++;events.push({type:'hit',x:item.x,y:BASKET_Y});
      }else events.push({type:'dodge',x:item.x,y:BASKET_Y});
      if(game.caught>=game.target){game.status='won';break;}
      if(game.misses>=game.maxMisses){game.status='lost';break;}
    }
    game.items=remaining;
    return events;
  }

  function revive(game){
    if(game.status!=='lost')return false;
    game.misses=0;game.items=[];game.spawnTimer=.6;game.status='playing';return true;
  }
const api={revive,WIDTH,BASKET_Y,BASKET_HALF,LEVELS,NORMAL_LEVELS,getLevels,createGame,moveBasket,step};
  if(typeof module!=='undefined') module.exports=api; else root.StarCatch=api;
})(typeof window==='undefined'?globalThis:window);
