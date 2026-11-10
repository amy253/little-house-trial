(function(root){
  const POWER_TYPES=['shield','revive','magnet','invincible','slow'];

  function random(game){
    game.seed=(Math.imul(game.seed,1664525)+1013904223)>>>0;
    return game.seed/4294967296;
  }

  function shuffledLanes(game){
    const lanes=[0,1,2];
    for(let index=2;index>0;index--){
      const other=Math.floor(random(game)*(index+1));
      [lanes[index],lanes[other]]=[lanes[other],lanes[index]];
    }
    return lanes;
  }

  function addWaves(game){
    while(game.nextAt<game.distance+450){
      const difficulty=Math.floor(game.nextAt/360);
      const forcedVertical=game.waveIndex>1&&random(game)<Math.min(.4,.16+difficulty*.025);
      let blocks;
      let safe;
      if(forcedVertical){
        const kind=random(game)<.52?'cable':'beam';
        blocks=[0,1,2].map(lane=>({lane,kind}));
      }else{
        const lanes=shuffledLanes(game);
        safe=lanes[0];
        const count=game.nextAt<330?1:2;
        blocks=lanes.slice(1,count+1).map(lane=>({
          lane,
          kind:['speaker','cable','beam'][Math.floor(random(game)*3)]
        }));
      }
      const wave={at:game.nextAt,blocks};
      if(random(game)<.29)wave.pickup=forcedVertical?Math.floor(random(game)*3):safe;
      game.waves.push(wave);
      game.waveIndex++;
      const gap=Math.max(104,154-difficulty*4)+Math.floor(random(game)*22);
      game.nextAt+=gap;
    }
  }

  function createGame(seed){
    const initialSeed=seed===undefined?(Math.random()*0xffffffff)>>>0:seed>>>0;
    const game={speed:110,distance:0,nextAt:145,waveIndex:0,waves:[],lane:1,
      jumpTime:0,slideTime:0,status:'playing',seed:initialSeed||1,
      buli:0,totalBuli:0,shields:0,revives:0,magnetTime:0,
      invincibleTime:0,slowTime:0,islandRevived:false,islandRevives:0};
    addWaves(game);
    return game;
  }

  function moveLane(game,direction){
    if(game.status==='playing')game.lane=Math.max(0,Math.min(2,game.lane+Math.sign(direction)));
  }

  function jump(game){
    if(game.status==='playing'){game.jumpTime=.72;game.slideTime=0;}
  }

  function slide(game){
    if(game.status==='playing'){game.slideTime=.72;game.jumpTime=0;}
  }

  function grantPower(game){
    const type=POWER_TYPES[Math.floor(random(game)*POWER_TYPES.length)];
    if(type==='shield')game.shields++;
    else if(type==='revive')game.revives++;
    else if(type==='magnet')game.magnetTime=Math.max(game.magnetTime,8);
    else if(type==='invincible')game.invincibleTime=Math.max(game.invincibleTime,5);
    else game.slowTime=Math.max(game.slowTime,7);
    return type;
  }

  function step(game,dt){
    if(game.status!=='playing'||dt<=0)return [];
    const events=[];
    const baseSpeed=Math.min(238,110+Math.floor(game.distance/210)*9);
    game.speed=game.slowTime>0?baseSpeed*.72:baseSpeed;
    game.distance+=game.speed*dt;
    game.jumpTime=Math.max(0,game.jumpTime-dt);
    game.slideTime=Math.max(0,game.slideTime-dt);
    game.magnetTime=Math.max(0,game.magnetTime-dt);
    game.invincibleTime=Math.max(0,game.invincibleTime-dt);
    game.slowTime=Math.max(0,game.slowTime-dt);
    while(game.waves.length&&game.waves[0].at<=game.distance){
      const wave=game.waves.shift();
      const block=wave.blocks.find(item=>item.lane===game.lane);
      const cleared=block&&((block.kind==='cable'&&game.jumpTime>0)||(block.kind==='beam'&&game.slideTime>0));
      if(block&&!cleared){
        if(game.invincibleTime>0)events.push({type:'protected',power:'invincible'});
        else if(game.shields>0){game.shields--;events.push({type:'protected',power:'shield'});}
        else if(game.revives>0){game.revives--;game.shields=1;events.push({type:'revive',source:'token'});}
        else{game.status='lost';events.push({type:'hit',kind:block.kind});break;}
      }else events.push({type:'dodge'});
      if(wave.pickup!==undefined&&(wave.pickup===game.lane||game.magnetTime>0)){
        game.buli++;game.totalBuli++;events.push({type:'buli'});
        if(game.buli>=5){game.buli-=5;events.push({type:'power',power:grantPower(game)});}
      }
    }
    if(game.status==='playing')addWaves(game);
    return events;
  }

  function revive(game){
    if(game.status!=='lost'||game.islandRevives>=2)return false;
    game.status='playing';game.islandRevived=true;game.islandRevives++;game.shields=Math.max(1,game.shields);
    game.jumpTime=0;game.slideTime=0;
    addWaves(game);
    return true;
  }

  const api={createGame,moveLane,jump,slide,step,revive,POWER_TYPES};
  if(typeof module!=='undefined')module.exports=api;else root.StageRunner=api;
})(typeof window==='undefined'?globalThis:window);
