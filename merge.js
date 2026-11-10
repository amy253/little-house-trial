// Physics and collision approach adapted from https://github.com/moonfloof/suika-game
(function(root){
  const Matter=typeof module!=='undefined'?require('./matter.js'):root.Matter;
  const {Engine,Bodies,Body,Composite,Events}=Matter;
  const WIDTH=432,FLOOR=486,LINE=113,WALL=18;
  const RADII=[18,25,34,46,62,84];
  const SCORES=[1,3,6,10,15,21];
  const MAX_SPAWN_TIER=2;
  const friction={friction:.006,frictionStatic:.006,frictionAir:0,restitution:.1};

  function addPiece(game,x,y,tier){
    const r=RADII[tier];
    const body=Bodies.circle(x,y,r,friction);
    const piece={body,tier,r,age:0,get x(){return body.position.x;},get y(){return body.position.y;}};
    body.gamePiece=piece;
    game.pieces.push(piece);
    Composite.add(game.engine.world,body);
    return piece;
  }

  function createGame(random=Math.random){
    const engine=Engine.create();
    const game={engine,random,wall:WALL,pieces:[],nextTier:0,drops:0,score:0,highestTier:0,cooldown:0,overflow:0,status:'playing',events:[]};
    Composite.add(engine.world,[
      Bodies.rectangle(WALL/2,FLOOR/2,WALL,FLOOR*2,{isStatic:true}),
      Bodies.rectangle(WIDTH-WALL/2,FLOOR/2,WALL,FLOOR*2,{isStatic:true}),
      Bodies.rectangle(WIDTH/2,FLOOR+15,WIDTH,30,{isStatic:true})
    ]);
    Events.on(engine,'collisionStart',event=>{
      const used=new Set();
      for(const pair of event.pairs){
        const a=pair.bodyA.gamePiece,b=pair.bodyB.gamePiece;
        if(!a||!b||a.tier!==b.tier||a.tier===RADII.length-1||used.has(a)||used.has(b)) continue;
        used.add(a);used.add(b);
        const x=(a.x+b.x)/2,y=(a.y+b.y)/2,tier=a.tier+1;
        Composite.remove(engine.world,[a.body,b.body]);
        game.pieces.splice(game.pieces.indexOf(a),1);
        game.pieces.splice(game.pieces.indexOf(b),1);
        const piece=addPiece(game,x,y,tier);
        Body.setVelocity(piece.body,{x:(a.body.velocity.x+b.body.velocity.x)/2,y:Math.min(a.body.velocity.y,b.body.velocity.y)-1.2});
        game.score+=SCORES[tier];
        game.highestTier=Math.max(game.highestTier,tier);
        game.events.push({type:'merge',x,y,tier});
      }
    });
    return game;
  }

  function drop(game,x){
    if(game.status!=='playing'||game.cooldown>0) return false;
    const tier=game.nextTier,r=RADII[tier];
    addPiece(game,Math.max(WALL+r,Math.min(WIDTH-WALL-r,x)),52,tier);
    game.drops++;
    game.nextTier=Math.floor(game.random()*(MAX_SPAWN_TIER+1));
    game.cooldown=.46;
    return true;
  }

  function step(game,dt){
    if(game.status!=='playing'||dt<=0) return [];
    dt=Math.min(dt,.04);
    game.cooldown=Math.max(0,game.cooldown-dt);
    for(const piece of game.pieces) piece.age+=dt;
    Engine.update(game.engine,dt*1000);
    const above=game.pieces.some(piece=>piece.age>1.3&&piece.y-piece.r<LINE);
    game.overflow=above?game.overflow+dt:0;
    if(game.overflow>1.2){
      game.status='lost';
      game.events.push({type:'lose',reason:'overflow'});
    }
    return game.events.splice(0);
  }

  function revive(game){
    if(game.status!=='lost')return false;
    const removed=game.pieces.filter(piece=>piece.y-piece.r<LINE+40);
    Composite.remove(game.engine.world,removed.map(piece=>piece.body));
    game.pieces=game.pieces.filter(piece=>!removed.includes(piece));
    game.overflow=0;game.cooldown=0;game.events=[];game.status='playing';return true;
  }
const api={revive,WIDTH,FLOOR,LINE,RADII,createGame,drop,step};
  if(typeof module!=='undefined') module.exports=api; else root.MergeGame=api;
})(typeof window==='undefined'?globalThis:window);
