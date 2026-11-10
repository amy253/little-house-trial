(function(root){
  const WIDTH=432;
  const TOLERANCE=16;

  function createGame(){
    const baseWidth=220,baseX=(WIDTH-baseWidth)/2;
    return {baseWidth,baseX,top:{x:baseX,width:baseWidth},
      moving:{x:-baseWidth,width:baseWidth,direction:1},placed:[],status:'playing'};
  }

  function step(game,dt){
    if(game.status!=='playing'||dt<=0)return;
    const moving=game.moving;
    moving.x+=moving.direction*(190+Math.min(game.placed.length*10,180))*dt;
    if(moving.x>WIDTH){moving.x=WIDTH-(moving.x-WIDTH);moving.direction=-1;}
    if(moving.x<-moving.width){moving.x=-moving.width+(-moving.width-moving.x);moving.direction=1;}
  }

  function drop(game){
    if(game.status!=='playing')return {type:'ignored'};
    const {moving,top}=game;
    const perfect=Math.abs(moving.x-top.x)<=TOLERANCE;
    const left=perfect?top.x:Math.max(moving.x,top.x);
    const right=perfect?top.x+top.width:Math.min(moving.x+moving.width,top.x+top.width);
    const width=right-left;
    if(width<24){game.status='lost';return {type:'miss'};}
    game.top={x:left,width};
    game.placed.push({x:left,width,perfect});
    const fromRight=game.placed.length%2===1;
    game.moving={x:fromRight?WIDTH:-width,width,direction:fromRight?-1:1};
    return {type:'placed',perfect,trimmed:top.width-width};
  }

  function revive(game){
    if(game.status!=='lost')return false;
    game.moving={x:game.top.x,width:game.top.width,direction:game.placed.length%2?-1:1};
    game.status='playing';return true;
  }
const api={revive,WIDTH,createGame,step,drop};
  if(typeof module!=='undefined')module.exports=api;else root.StageStack=api;
})(typeof window==='undefined'?globalThis:window);
