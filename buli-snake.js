(function(root){
  const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  function food(g){const empty=[];for(let y=0;y<18;y++)for(let x=0;x<16;x++)if(!g.body.some(p=>p.x===x&&p.y===y))empty.push({x,y});g.food=empty[Math.floor(Math.random()*empty.length)]||null;}
  function create(){return {body:[{x:6,y:9},{x:5,y:9}],direction:'right',pending:'right',turned:false,food:{x:10,y:9},score:0,status:'playing'};}
  function turn(g,d){if(g.status!=='playing'||g.turned||!directions[d])return false;const a=directions[g.direction],b=directions[d];if(a[0]+b[0]===0&&a[1]+b[1]===0)return false;g.pending=d;g.turned=true;return true;}
  function interval(g){return Math.max(.105,.3-Math.floor(g.score/3)*.014-g.score*.002);}
  function step(g){if(g.status!=='playing')return;g.direction=g.pending;g.turned=false;const [dx,dy]=directions[g.direction],head={x:g.body[0].x+dx,y:g.body[0].y+dy};const eat=g.food&&head.x===g.food.x&&head.y===g.food.y;const body=eat?g.body:g.body.slice(0,-1);if(head.x<0||head.x>=16||head.y<0||head.y>=18||body.some(p=>p.x===head.x&&p.y===head.y)){g.status='lost';return 'lost';}g.body.unshift(head);if(eat){g.score++;food(g);if(!g.food)g.status='full';return 'eat';}g.body.pop();return 'move';}
  function revive(g){
    if(g.status!=='lost')return false;
    const head=g.body[0],old=directions[g.direction];
    const safe=Object.keys(directions).find(d=>{const [dx,dy]=directions[d],x=head.x+dx,y=head.y+dy;return !(dx+old[0]===0&&dy+old[1]===0)&&x>=0&&x<16&&y>=0&&y<18&&!g.body.slice(0,-1).some(p=>p.x===x&&p.y===y)&&!(g.food&&g.food.x===x&&g.food.y===y&&g.body.at(-1).x===x&&g.body.at(-1).y===y);});
    if(safe)g.direction=g.pending=safe;
    else{
      const path=[];for(let y=0;y<18;y++)for(let i=0;i<16;i++)path.push({x:y%2?15-i:i,y});
      const length=g.body.length;g.body=path.slice(0,length).reverse();
      const a=g.body[0],b=path[length];g.direction=g.pending=Object.keys(directions).find(d=>directions[d][0]===b.x-a.x&&directions[d][1]===b.y-a.y);
    }
    if(!g.food||g.body.some(p=>p.x===g.food.x&&p.y===g.food.y))food(g);
    g.turned=false;g.status='playing';return true;
  }
const api={revive,create,turn,step,interval};if(typeof module!=='undefined')module.exports=api;else root.BuliSnake=api;
})(typeof window==='undefined'?globalThis:window);
