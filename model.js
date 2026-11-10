(function(root){
  const LEVEL_COUNT=5;
  function collect(grid,bucket){
    let taken=0;
    const start=Math.floor(bucket.x);
    for(let x=Math.max(0,start);x<Math.min(grid[0].length,start+4);x++){
      if(bucket.fill>=bucket.capacity) break;
      // A bucket cannot reach through a different exposed color.
      for(let y=grid.length-1;y>=0;y--){
        if(!grid[y][x]) continue;
        if(grid[y][x]===bucket.color){grid[y][x]=0;bucket.fill++;taken++;}
        break;
      }
    }
    return taken;
  }
  function gravity(grid,tick){
    let moved=0;
    const w=grid[0].length;
    for(let y=grid.length-2;y>=0;y--){
      for(let i=0;i<w;i++){
        const x=tick%2? w-1-i:i;
        if(!grid[y][x]) continue;
        const choices=tick%2?[x,x+1,x-1]:[x,x-1,x+1];
        for(const nx of choices){
          if(nx>=0&&nx<w&&!grid[y+1][nx]){
            grid[y+1][nx]=grid[y][x];grid[y][x]=0;moved++;break;
          }
        }
      }
    }
    return moved;
  }
  function makeLevel(level){
    const grid=Array.from({length:24},()=>Array(24).fill(1));
    for(let y=0;y<24;y++) for(let x=0;x<24;x++){
      let c=1;
      if(y>=21) c=5;
      if(y>=5&&y<=12&&Math.abs(x-11.5)<=(y-4)*1.2) c=3;
      if(y>=12&&y<=20&&x>=5&&x<=18) c=4;
      if(y>=16&&y<=20&&x>=10&&x<=13) c=2;
      if(y>=14&&y<=16&&((x>=7&&x<=8)||(x>=15&&x<=16))) c=5;
      if(y>=3&&y<=5&&x>=18&&x<=20) c=2;
      if(level===1){
        c=1;
        // Distinct portrait silhouette: veil, black hair, face, white dress, candle pixels.
        if(y>=3&&y<=18&&(x<=4||x>=19)) c=4; // wide veil
        if(y>=4&&y<=10&&x>=7&&x<=16) c=3; // hair cap
        if(y>=6&&y<=11&&x>=9&&x<=14) c=4; // face
        if(y>=8&&y<=9&&(x===9||x===14)) c=1; // eyes
        if(y===10&&x>=11&&x<=12) c=3; // mouth
        if(y>=11&&y<=19&&x>=5&&x<=18) c=4; // layered white dress
        if(y>=13&&y<=14&&x>=7&&x<=16) c=2; // lace trim
        if(y>=16&&y<=18&&x>=4&&x<=19) c=4; // skirt
        if(y>=20) c=5; // floor
        if((y===5||y===15)&&(x===2||x===21)) c=2; // candles
      }
      if(level===2&&y>=19) c=[5,2,3][Math.floor(x/8)];
      if(level===3) c=[5,2,4,3,1][Math.floor((x+y)/5)%5];
      if(level===4) c=[5,4,3,2,1][Math.floor(Math.min(x,y,23-x,23-y)/2)%5];
      grid[y][x]=c;
    }
    const inventory=[];
    for(const color of [5,1,2,3,4]){
      let count=grid.flat().filter(c=>c===color).length;
      while(count){const capacity=Math.min(48,count);inventory.push({id:inventory.length,color,capacity,used:false});count-=capacity;}
    }
    // Interleave colors so players see their choices without scrolling.
    inventory.sort((a,b)=> (a.id%3)-(b.id%3));
    inventory.forEach((b,i)=>b.id=i);
    return {grid,inventory};
  }
  function createGame(level=0){
    level=Number.isInteger(level)?Math.max(0,Math.min(LEVEL_COUNT-1,level)):0;
    return {...makeLevel(level),level,active:[],collected:0,total:576,status:'playing',tick:0,phase:0,completed:0,departed:[]};
  }
  function queueHeads(game){
    return [0,1,2].map(column=>game.inventory.findIndex((b,i)=>i%3===column&&!b.used));
  }
  function dispatch(game,index){
    const item=game.inventory[index];
    if(game.status!=='playing'||game.active.length>=6||!item||item.used) return false;
    if(!queueHeads(game).includes(index)) return false;
    const slot=[0,1,2,3,4,5].find(s=>!game.active.some(b=>b.slot===s));
    item.used=true;
    game.active.push({...item,slot,fill:0,x:((game.phase+slot*32/6)%32)-4});
    return true;
  }
  function step(game,dt){
    if(game.status!=='playing') return;
    game.tick++;game.phase=(game.phase+dt*4.8)%32;game.departed=[];
    const moved=gravity(game.grid,game.tick);
    for(const b of game.active){
      b.x+=dt*4.8;if(b.x>=28) b.x-=32;
      game.collected+=collect(game.grid,b);
    }
    game.active=game.active.filter(b=>{
      if(b.fill<b.capacity) return true;
      game.completed++;game.departed.push({...b});return false;
    });
    if(game.grid.every(row=>row.every(c=>!c))) game.status='won';
    else if(!moved&&game.active.length===6){
      const exposed=new Set();
      for(let x=0;x<game.grid[0].length;x++){
        for(let y=game.grid.length-1;y>=0;y--) if(game.grid[y][x]){exposed.add(game.grid[y][x]);break;}
      }
      if(!game.active.some(b=>exposed.has(b.color))) game.status='blocked';
    }
  }
  function revive(game){
    if(game.status!=='blocked')return false;
    for(const bucket of game.active){const item=game.inventory[bucket.id];if(item){item.capacity=bucket.capacity-bucket.fill;item.used=false;}}
    game.active=[];game.departed=[];
    const exposed=new Set();
    for(let x=0;x<game.grid[0].length;x++)for(let y=game.grid.length-1;y>=0;y--)if(game.grid[y][x]){exposed.add(game.grid[y][x]);break;}
    if(!queueHeads(game).some(i=>i>=0&&exposed.has(game.inventory[i].color))){
      const needed=game.inventory.findIndex(item=>!item.used&&exposed.has(item.color));
      const head=queueHeads(game).find(i=>i>=0);
      if(needed>=0&&head>=0){[game.inventory[needed],game.inventory[head]]=[game.inventory[head],game.inventory[needed]];game.inventory.forEach((item,i)=>item.id=i);}
    }
    game.status='playing';return true;
  }
const api={revive,LEVEL_COUNT,collect,gravity,makeLevel,createGame,queueHeads,dispatch,step};
  if(typeof module!=='undefined') module.exports=api;
  else root.SandGame=api;
})(typeof window==='undefined'?globalThis:window);
