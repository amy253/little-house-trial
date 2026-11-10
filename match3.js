(function(root){
  const SIZE=6;
  const COLORS=5;
  const LEVEL_COUNT=5;

  function createBoard(random=Math.random,colorCount=COLORS){
    for(let attempt=0;attempt<100;attempt++){
      const board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
      for(let row=0;row<SIZE;row++) for(let column=0;column<SIZE;column++){
        const candidate=Math.floor(random()*colorCount);
        for(let offset=0;offset<colorCount;offset++){
          const value=(candidate+offset)%colorCount;
          const horizontal=column>=2&&board[row][column-1]===value&&board[row][column-2]===value;
          const vertical=row>=2&&board[row-1][column]===value&&board[row-2][column]===value;
          if(!horizontal&&!vertical){board[row][column]=value;break;}
        }
      }
      if(hasValidMove(board)) return board;
    }
    throw new Error('Unable to create a playable match-three board');
  }

  function cloneBoard(board){return board.map(row=>row.slice());}
  function inside(point){return point&&point.row>=0&&point.row<SIZE&&point.column>=0&&point.column<SIZE;}
  function adjacent(a,b){return inside(a)&&inside(b)&&Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1;}

  function findMatches(board){
    const found=new Set();
    for(let row=0;row<SIZE;row++){
      let start=0;
      while(start<SIZE){
        let end=start+1;
        while(end<SIZE&&board[row][end]===board[row][start]) end++;
        if(board[row][start]!==null&&end-start>=3) for(let column=start;column<end;column++) found.add(`${row}:${column}`);
        start=end;
      }
    }
    for(let column=0;column<SIZE;column++){
      let start=0;
      while(start<SIZE){
        let end=start+1;
        while(end<SIZE&&board[end][column]===board[start][column]) end++;
        if(board[start][column]!==null&&end-start>=3) for(let row=start;row<end;row++) found.add(`${row}:${column}`);
        start=end;
      }
    }
    return [...found].map(key=>{const [row,column]=key.split(':').map(Number);return {row,column};});
  }

  function swap(board,a,b){
    const value=board[a.row][a.column];
    board[a.row][a.column]=board[b.row][b.column];
    board[b.row][b.column]=value;
  }

  function collapse(board,nextValue,colorCount){
    for(let column=0;column<SIZE;column++){
      let write=SIZE-1;
      for(let row=SIZE-1;row>=0;row--) if(board[row][column]!==null) board[write--][column]=board[row][column];
      while(write>=0){
        const candidate=nextValue()%colorCount;
        for(let attempt=0;attempt<colorCount;attempt++){
          const value=(candidate+attempt)%colorCount;
          const vertical=write<=SIZE-3&&board[write+1][column]===value&&board[write+2][column]===value;
          const horizontal=column>=2&&board[write][column-1]===value&&board[write][column-2]===value;
          if(!vertical&&!horizontal){board[write--][column]=value;break;}
        }
      }
    }
  }

  function resolve(board,nextValue,colorCount){
    let removed=0;
    const cleared=[];
    const falling=new Map();
    for(let round=0;round<20;round++){
      const matches=findMatches(board);
      if(!matches.length) break;
      const columns=new Map();
      for(const point of matches){
        const entry=columns.get(point.column)||{bottom:-1,count:0};
        entry.bottom=Math.max(entry.bottom,point.row);
        entry.count++;
        columns.set(point.column,entry);
      }
      for(const [column,{bottom,count}] of columns){
        for(let row=0;row<=bottom;row++){
          const key=`${row}:${column}`;
          falling.set(key,Math.max(falling.get(key)||0,count));
        }
      }
      for(const point of matches) board[point.row][point.column]=null;
      cleared.push(...matches);
      removed+=matches.length;
      collapse(board,nextValue,colorCount);
    }
    const fallCells=[...falling].map(([key,steps])=>{
      const [row,column]=key.split(':').map(Number);
      return {row,column,steps};
    });
    return {removed,cleared,fallCells};
  }

  function trySwap(board,a,b,nextValue,colorCount=COLORS){
    if(!adjacent(a,b)) return {ok:false,removed:0,cleared:[],fallCells:[],score:0};
    swap(board,a,b);
    if(!findMatches(board).length){swap(board,a,b);return {ok:false,removed:0,cleared:[],fallCells:[],score:0};}
    const resolved=resolve(board,nextValue,colorCount);
    return {ok:true,removed:resolved.removed,cleared:resolved.cleared,fallCells:resolved.fallCells,score:resolved.removed*10};
  }

  function findValidMove(board,preferBest=false,goalCells=[]){
    const goals=new Set(goalCells.map(point=>`${point.row}:${point.column}`));
    let best=null,bestCount=0;
    for(let row=0;row<SIZE;row++) for(let column=0;column<SIZE;column++){
      const a={row,column};
      for(const b of [{row:row+1,column},{row,column:column+1}]){
        if(!inside(b)) continue;
        swap(board,a,b);
        const matches=findMatches(board),count=matches.length;
        const value=count+matches.filter(point=>goals.has(`${point.row}:${point.column}`)).length*100;
        swap(board,a,b);
        if(value>bestCount){best=[a,b];bestCount=value;}
        if(count&&!preferBest) return [a,b];
      }
    }
    return best;
  }
  function hasValidMove(board){return findValidMove(board)!==null;}

  function createGame(random=Math.random,level=0){
    level=Number.isInteger(level)?Math.max(0,Math.min(LEVEL_COUNT-1,level)):0;
    const targets=[470,540,650,0,0],limits=[12,13,15,24,26];
    const colorCount=[4,5,6,5,4][level],goalCells=[];
    for(let row=0;row<SIZE;row++) for(let column=0;column<SIZE;column++){
      if(level===3&&row>=1&&row<=4&&column>=1&&column<=4||level===4&&(row<2||row>3)&&(column<2||column>3)) goalCells.push({row,column});
    }
    return {board:createBoard(random,colorCount),level,colorCount,goalCells,targetCells:goalCells.length,score:0,targetScore:targets[level],moves:limits[level],status:'playing',random};
  }
  function play(game,a,b){
    if(game.status!=='playing') return {ok:false,removed:0,cleared:[],fallCells:[],score:0};
    const result=trySwap(game.board,a,b,()=>Math.floor(game.random()*game.colorCount),game.colorCount);
    if(result.ok){
      game.score+=result.score;game.moves--;
      if(game.targetCells){
        const cleared=new Set(result.cleared.map(point=>`${point.row}:${point.column}`)),before=game.goalCells.length;
        game.goalCells=game.goalCells.filter(point=>!cleared.has(`${point.row}:${point.column}`));
        result.goalsCleared=before-game.goalCells.length;
      }
      if(game.targetCells?game.goalCells.length===0:game.score>=game.targetScore) game.status='won';
      else if(game.moves<=0) game.status='over';
      else if(!hasValidMove(game.board)) game.status='stuck';
    }
    return result;
  }

  function revive(game){
    if(!['over','stuck'].includes(game.status))return false;
    if(!hasValidMove(game.board))game.board=createBoard(game.random,game.colorCount);
    game.moves=Math.max(0,game.moves)+5;game.status='playing';return true;
  }
const api={revive,SIZE,COLORS,LEVEL_COUNT,createBoard,cloneBoard,findMatches,findValidMove,hasValidMove,trySwap,createGame,play};
  if(typeof module!=='undefined') module.exports=api; else root.Match3Game=api;
})(typeof window==='undefined'?globalThis:window);
