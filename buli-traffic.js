(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BuliTraffic=factory();})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const SIZE=6,SAVE_KEY='buli-traffic-save';
  const levels=[
    {"title":"出发去野餐","par":2,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":3,"y":0,"len":3}]},
    {"title":"巷口小转弯","par":3,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":2,"y":1,"len":2},{"id":"C","axis":"v","x":1,"y":3,"len":2},{"id":"D","axis":"h","x":0,"y":1,"len":2},{"id":"E","axis":"v","x":3,"y":1,"len":2},{"id":"F","axis":"h","x":1,"y":5,"len":2},{"id":"G","axis":"v","x":0,"y":4,"len":2},{"id":"H","axis":"v","x":5,"y":0,"len":2},{"id":"I","axis":"v","x":5,"y":4,"len":2},{"id":"J","axis":"v","x":4,"y":4,"len":2}]},
    {"title":"让一让牛奶车","par":3,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":2,"y":5,"len":2},{"id":"C","axis":"h","x":4,"y":3,"len":2},{"id":"D","axis":"v","x":5,"y":4,"len":2},{"id":"E","axis":"v","x":1,"y":0,"len":2},{"id":"F","axis":"h","x":1,"y":3,"len":2},{"id":"G","axis":"h","x":0,"y":4,"len":2},{"id":"H","axis":"v","x":2,"y":1,"len":2},{"id":"I","axis":"v","x":5,"y":0,"len":2},{"id":"J","axis":"h","x":2,"y":0,"len":2},{"id":"K","axis":"h","x":3,"y":1,"len":2}]},
    {"title":"鱼鱼快递","par":4,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":2,"y":0,"len":2},{"id":"C","axis":"v","x":5,"y":0,"len":2},{"id":"D","axis":"h","x":2,"y":1,"len":3},{"id":"E","axis":"h","x":1,"y":5,"len":3},{"id":"F","axis":"v","x":3,"y":2,"len":2},{"id":"G","axis":"h","x":0,"y":3,"len":2},{"id":"H","axis":"h","x":4,"y":4,"len":2},{"id":"I","axis":"v","x":2,"y":3,"len":2},{"id":"J","axis":"v","x":0,"y":0,"len":2},{"id":"K","axis":"h","x":4,"y":5,"len":2},{"id":"L","axis":"v","x":4,"y":2,"len":2}]},
    {"title":"薄荷小街","par":4,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":4,"y":0,"len":2},{"id":"C","axis":"h","x":2,"y":5,"len":3},{"id":"D","axis":"v","x":2,"y":2,"len":2},{"id":"E","axis":"h","x":1,"y":0,"len":2},{"id":"F","axis":"h","x":2,"y":4,"len":2},{"id":"G","axis":"v","x":0,"y":3,"len":2},{"id":"H","axis":"v","x":3,"y":2,"len":2},{"id":"I","axis":"v","x":1,"y":3,"len":2},{"id":"J","axis":"v","x":3,"y":0,"len":2},{"id":"K","axis":"h","x":4,"y":3,"len":2},{"id":"L","axis":"h","x":0,"y":5,"len":2},{"id":"M","axis":"h","x":4,"y":1,"len":2},{"id":"N","axis":"v","x":0,"y":0,"len":2}]},
    {"title":"午后咖啡馆","par":5,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":4,"y":1,"len":2},{"id":"C","axis":"h","x":0,"y":0,"len":2},{"id":"D","axis":"v","x":2,"y":3,"len":2},{"id":"E","axis":"v","x":3,"y":0,"len":2},{"id":"F","axis":"h","x":4,"y":5,"len":2},{"id":"G","axis":"v","x":5,"y":1,"len":3},{"id":"H","axis":"h","x":4,"y":4,"len":2},{"id":"I","axis":"v","x":0,"y":3,"len":2},{"id":"J","axis":"v","x":2,"y":0,"len":2},{"id":"K","axis":"h","x":0,"y":1,"len":2}]},
    {"title":"花店门前","par":5,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":4,"y":4,"len":2},{"id":"C","axis":"v","x":3,"y":1,"len":2},{"id":"D","axis":"v","x":3,"y":3,"len":3},{"id":"E","axis":"h","x":1,"y":0,"len":2},{"id":"F","axis":"v","x":2,"y":2,"len":2},{"id":"G","axis":"h","x":1,"y":4,"len":2},{"id":"H","axis":"h","x":4,"y":3,"len":2},{"id":"I","axis":"h","x":0,"y":3,"len":2},{"id":"J","axis":"h","x":0,"y":1,"len":3},{"id":"K","axis":"v","x":5,"y":1,"len":2},{"id":"L","axis":"v","x":4,"y":0,"len":2},{"id":"M","axis":"h","x":1,"y":5,"len":2}]},
    {"title":"桥边的车队","par":6,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":1,"y":0,"len":2},{"id":"C","axis":"h","x":4,"y":5,"len":2},{"id":"D","axis":"h","x":2,"y":4,"len":3},{"id":"E","axis":"v","x":3,"y":1,"len":2},{"id":"F","axis":"v","x":5,"y":2,"len":2},{"id":"G","axis":"v","x":1,"y":4,"len":2},{"id":"H","axis":"h","x":1,"y":1,"len":2},{"id":"I","axis":"h","x":3,"y":3,"len":2},{"id":"J","axis":"v","x":0,"y":3,"len":2},{"id":"K","axis":"v","x":4,"y":0,"len":2},{"id":"L","axis":"v","x":2,"y":2,"len":2},{"id":"M","axis":"v","x":5,"y":0,"len":2},{"id":"N","axis":"h","x":2,"y":5,"len":2}]},
    {"title":"雨后的路口","par":6,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":2,"y":3,"len":2},{"id":"C","axis":"h","x":4,"y":5,"len":2},{"id":"D","axis":"v","x":2,"y":4,"len":2},{"id":"E","axis":"h","x":0,"y":5,"len":2},{"id":"F","axis":"v","x":3,"y":4,"len":2},{"id":"G","axis":"v","x":3,"y":0,"len":2},{"id":"H","axis":"v","x":2,"y":0,"len":2},{"id":"I","axis":"v","x":4,"y":1,"len":3},{"id":"J","axis":"h","x":0,"y":1,"len":2},{"id":"K","axis":"v","x":5,"y":3,"len":2}]},
    {"title":"面包香香","par":7,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":5,"y":3,"len":2},{"id":"C","axis":"v","x":0,"y":4,"len":2},{"id":"D","axis":"v","x":1,"y":3,"len":2},{"id":"E","axis":"v","x":4,"y":1,"len":2},{"id":"F","axis":"h","x":2,"y":3,"len":2},{"id":"G","axis":"h","x":1,"y":1,"len":2},{"id":"H","axis":"h","x":4,"y":5,"len":2},{"id":"I","axis":"v","x":3,"y":1,"len":2},{"id":"J","axis":"h","x":1,"y":0,"len":3},{"id":"K","axis":"h","x":3,"y":4,"len":2},{"id":"L","axis":"v","x":0,"y":0,"len":2},{"id":"M","axis":"h","x":4,"y":0,"len":2},{"id":"N","axis":"h","x":2,"y":5,"len":2}]},
    {"title":"树荫停车场","par":7,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":5,"y":2,"len":2},{"id":"C","axis":"h","x":3,"y":4,"len":2},{"id":"D","axis":"v","x":4,"y":1,"len":3},{"id":"E","axis":"h","x":2,"y":1,"len":2},{"id":"F","axis":"v","x":5,"y":4,"len":2},{"id":"G","axis":"v","x":2,"y":3,"len":2},{"id":"H","axis":"h","x":2,"y":5,"len":3},{"id":"I","axis":"h","x":0,"y":3,"len":2},{"id":"J","axis":"v","x":1,"y":0,"len":2}]},
    {"title":"海边小镇","par":8,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":1,"y":4,"len":3},{"id":"C","axis":"v","x":3,"y":2,"len":2},{"id":"D","axis":"v","x":5,"y":2,"len":2},{"id":"E","axis":"v","x":2,"y":1,"len":2},{"id":"F","axis":"h","x":2,"y":5,"len":2},{"id":"G","axis":"h","x":4,"y":5,"len":2},{"id":"H","axis":"v","x":0,"y":4,"len":2},{"id":"I","axis":"h","x":2,"y":0,"len":2},{"id":"J","axis":"h","x":4,"y":4,"len":2},{"id":"K","axis":"v","x":1,"y":0,"len":2},{"id":"L","axis":"h","x":3,"y":1,"len":2},{"id":"M","axis":"h","x":1,"y":3,"len":2}]},
    {"title":"猫爪广场","par":8,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":3,"y":1,"len":2},{"id":"C","axis":"v","x":5,"y":2,"len":2},{"id":"D","axis":"v","x":0,"y":3,"len":3},{"id":"E","axis":"h","x":1,"y":3,"len":2},{"id":"F","axis":"h","x":4,"y":4,"len":2},{"id":"G","axis":"h","x":4,"y":1,"len":2},{"id":"H","axis":"v","x":3,"y":4,"len":2},{"id":"I","axis":"h","x":1,"y":5,"len":2},{"id":"J","axis":"h","x":1,"y":1,"len":2},{"id":"K","axis":"v","x":4,"y":2,"len":2},{"id":"L","axis":"h","x":2,"y":0,"len":2},{"id":"M","axis":"h","x":0,"y":0,"len":2}]},
    {"title":"星光便利店","par":9,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":0,"y":3,"len":2},{"id":"C","axis":"h","x":0,"y":1,"len":2},{"id":"D","axis":"v","x":5,"y":1,"len":2},{"id":"E","axis":"h","x":0,"y":5,"len":2},{"id":"F","axis":"h","x":1,"y":0,"len":2},{"id":"G","axis":"v","x":3,"y":1,"len":2},{"id":"H","axis":"v","x":4,"y":0,"len":2},{"id":"I","axis":"h","x":4,"y":4,"len":2},{"id":"J","axis":"v","x":4,"y":2,"len":2},{"id":"K","axis":"v","x":2,"y":4,"len":2},{"id":"L","axis":"v","x":2,"y":2,"len":2}]},
    {"title":"绕个小圈","par":9,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":3,"y":0,"len":2},{"id":"C","axis":"v","x":5,"y":1,"len":2},{"id":"D","axis":"v","x":4,"y":1,"len":3},{"id":"E","axis":"h","x":3,"y":4,"len":3},{"id":"F","axis":"v","x":2,"y":2,"len":2},{"id":"G","axis":"v","x":1,"y":4,"len":2},{"id":"H","axis":"h","x":3,"y":5,"len":2},{"id":"I","axis":"h","x":1,"y":0,"len":2},{"id":"J","axis":"v","x":0,"y":4,"len":2}]},
    {"title":"胡萝卜农场","par":10,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":4,"y":1,"len":3},{"id":"C","axis":"v","x":5,"y":2,"len":3},{"id":"D","axis":"v","x":2,"y":3,"len":2},{"id":"E","axis":"h","x":2,"y":0,"len":2},{"id":"F","axis":"h","x":1,"y":1,"len":2},{"id":"G","axis":"v","x":3,"y":3,"len":2},{"id":"H","axis":"v","x":3,"y":1,"len":2},{"id":"I","axis":"v","x":1,"y":3,"len":3},{"id":"J","axis":"v","x":0,"y":0,"len":2},{"id":"K","axis":"h","x":4,"y":0,"len":2},{"id":"L","axis":"h","x":2,"y":5,"len":2},{"id":"M","axis":"h","x":4,"y":5,"len":2},{"id":"N","axis":"v","x":0,"y":3,"len":3}]},
    {"title":"小屋的邻居","par":10,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":2,"y":1,"len":2},{"id":"C","axis":"v","x":5,"y":2,"len":2},{"id":"D","axis":"h","x":2,"y":3,"len":3},{"id":"E","axis":"v","x":4,"y":4,"len":2},{"id":"F","axis":"h","x":1,"y":4,"len":3},{"id":"G","axis":"v","x":0,"y":0,"len":2},{"id":"H","axis":"h","x":4,"y":0,"len":2},{"id":"I","axis":"v","x":4,"y":1,"len":2},{"id":"J","axis":"h","x":2,"y":5,"len":2}]},
    {"title":"晚风慢慢","par":12,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":3,"y":1,"len":3},{"id":"C","axis":"v","x":5,"y":1,"len":2},{"id":"D","axis":"h","x":3,"y":5,"len":3},{"id":"E","axis":"h","x":0,"y":1,"len":2},{"id":"F","axis":"h","x":4,"y":3,"len":2},{"id":"G","axis":"h","x":1,"y":0,"len":3},{"id":"H","axis":"h","x":0,"y":3,"len":3},{"id":"I","axis":"v","x":0,"y":4,"len":2},{"id":"J","axis":"h","x":2,"y":4,"len":2}]},
    {"title":"纸风车车站","par":12,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":3,"y":2,"len":3},{"id":"C","axis":"v","x":5,"y":1,"len":2},{"id":"D","axis":"v","x":0,"y":4,"len":2},{"id":"E","axis":"h","x":0,"y":3,"len":2},{"id":"F","axis":"h","x":2,"y":5,"len":2},{"id":"G","axis":"v","x":4,"y":1,"len":2},{"id":"H","axis":"h","x":1,"y":4,"len":2},{"id":"I","axis":"v","x":2,"y":1,"len":2},{"id":"J","axis":"h","x":2,"y":0,"len":2},{"id":"K","axis":"v","x":0,"y":0,"len":2},{"id":"L","axis":"h","x":4,"y":0,"len":2}]},
    {"title":"好朋友来帮忙","par":13,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"h","x":2,"y":5,"len":2},{"id":"C","axis":"v","x":4,"y":2,"len":2},{"id":"D","axis":"v","x":1,"y":3,"len":2},{"id":"E","axis":"h","x":1,"y":1,"len":2},{"id":"F","axis":"v","x":4,"y":0,"len":2},{"id":"G","axis":"v","x":0,"y":0,"len":2},{"id":"H","axis":"v","x":5,"y":1,"len":2},{"id":"I","axis":"h","x":2,"y":0,"len":2},{"id":"J","axis":"h","x":4,"y":5,"len":2},{"id":"K","axis":"h","x":3,"y":4,"len":3},{"id":"L","axis":"v","x":2,"y":2,"len":2},{"id":"M","axis":"h","x":0,"y":5,"len":2}]},
    {"title":"城堡门口","par":14,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":3,"y":0,"len":3},{"id":"C","axis":"h","x":1,"y":0,"len":2},{"id":"D","axis":"v","x":1,"y":3,"len":2},{"id":"E","axis":"v","x":4,"y":3,"len":2},{"id":"F","axis":"v","x":0,"y":0,"len":2},{"id":"G","axis":"v","x":5,"y":1,"len":2},{"id":"H","axis":"h","x":2,"y":4,"len":2},{"id":"I","axis":"v","x":0,"y":4,"len":2},{"id":"J","axis":"v","x":4,"y":1,"len":2}]},
    {"title":"月亮小巷","par":14,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":2,"y":0,"len":3},{"id":"C","axis":"v","x":4,"y":0,"len":2},{"id":"D","axis":"v","x":5,"y":0,"len":2},{"id":"E","axis":"v","x":3,"y":1,"len":2},{"id":"F","axis":"v","x":5,"y":2,"len":3},{"id":"G","axis":"h","x":4,"y":5,"len":2},{"id":"H","axis":"v","x":4,"y":2,"len":2},{"id":"I","axis":"h","x":2,"y":4,"len":2},{"id":"J","axis":"v","x":1,"y":3,"len":2},{"id":"K","axis":"v","x":0,"y":4,"len":2}]},
    {"title":"回家的方向","par":15,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":0,"y":0,"len":2},{"id":"C","axis":"h","x":0,"y":4,"len":3},{"id":"D","axis":"v","x":3,"y":4,"len":2},{"id":"E","axis":"v","x":3,"y":1,"len":2},{"id":"F","axis":"h","x":1,"y":0,"len":2},{"id":"G","axis":"v","x":2,"y":2,"len":2},{"id":"H","axis":"h","x":1,"y":5,"len":2},{"id":"I","axis":"v","x":5,"y":0,"len":2},{"id":"J","axis":"h","x":4,"y":3,"len":2},{"id":"K","axis":"h","x":4,"y":5,"len":2},{"id":"L","axis":"h","x":1,"y":1,"len":2}]},
    {"title":"最后一段路","par":16,"cars":[{"id":"B","axis":"h","x":0,"y":2,"len":2},{"id":"A","axis":"v","x":2,"y":1,"len":2},{"id":"C","axis":"h","x":2,"y":3,"len":3},{"id":"D","axis":"v","x":3,"y":1,"len":2},{"id":"E","axis":"v","x":3,"y":4,"len":2},{"id":"F","axis":"h","x":1,"y":5,"len":2},{"id":"G","axis":"h","x":3,"y":0,"len":3},{"id":"H","axis":"v","x":0,"y":4,"len":2},{"id":"I","axis":"v","x":5,"y":2,"len":2},{"id":"J","axis":"h","x":4,"y":4,"len":2},{"id":"K","axis":"h","x":0,"y":3,"len":2},{"id":"L","axis":"h","x":4,"y":5,"len":2},{"id":"M","axis":"h","x":1,"y":4,"len":2}]}
  ];
  const copy=cars=>cars.map(c=>({...c}));
  function validLayout(cars){
    if(!Array.isArray(cars)||cars.length<1||cars.length>18)return false;
    const cells=new Set(),ids=new Set();let target=false;
    for(const c of cars){
      if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)||!['h','v'].includes(c.axis)||![2,3].includes(c.len)||!Number.isInteger(c.x)||!Number.isInteger(c.y))return false;
      ids.add(c.id);
      if(c.id==='B'){if(c.axis!=='h'||c.y!==2||c.len!==2)return false;target=true;}
      for(let i=0;i<c.len;i++){const x=c.x+(c.axis==='h'?i:0),y=c.y+(c.axis==='v'?i:0),key=y*SIZE+x;if(x<0||y<0||x>=SIZE||y>=SIZE||cells.has(key))return false;cells.add(key);}
    }
    return target;
  }
  function range(cars,id){
    const c=cars.find(c=>c.id===id);if(!c)return {min:0,max:0};
    const occupied=new Set();for(const other of cars)if(other!==c)for(let i=0;i<other.len;i++)occupied.add((other.y+(other.axis==='v'?i:0))*SIZE+other.x+(other.axis==='h'?i:0));
    const pos=c.axis==='h'?c.x:c.y;let low=pos,high=pos;
    const cell=p=>c.axis==='h'?c.y*SIZE+p:p*SIZE+c.x;
    while(low>0&&!occupied.has(cell(low-1)))low--;
    while(high+c.len<SIZE&&!occupied.has(cell(high+c.len)))high++;
    return {min:low-pos,max:high-pos};
  }
  function solve(cars,maxStates=250000){
    if(!validLayout(cars))return null;
    const target=cars.findIndex(c=>c.id==='B'),initial=cars.map(c=>c.axis==='h'?c.x:c.y);
    if(initial[target]===4)return [];
    const key=pos=>pos.join(''),nodes=[{pos:initial,parent:-1,move:null}],seen=new Set([key(initial)]);
    for(let head=0;head<nodes.length&&head<maxStates;head++){
      const node=nodes[head],board=new Int8Array(36).fill(-1);
      for(let j=0;j<cars.length;j++){const c=cars[j],x=c.axis==='h'?node.pos[j]:c.x,y=c.axis==='v'?node.pos[j]:c.y;for(let k=0;k<c.len;k++)board[(y+(c.axis==='v'?k:0))*6+x+(c.axis==='h'?k:0)]=j;}
      for(let j=0;j<cars.length;j++)for(const direction of [-1,1]){
        const c=cars[j],p=node.pos[j],cell=v=>c.axis==='h'?c.y*6+v:v*6+c.x;
        for(let delta=direction;;delta+=direction){
          const end=p+delta,edge=direction<0?end:end+c.len-1;
          if(edge<0||edge>=6||board[cell(edge)]!==-1)break;
          const next=node.pos.slice();next[j]=end;const hash=key(next);if(seen.has(hash))continue;seen.add(hash);
          const nextNode={pos:next,parent:head,move:{id:c.id,delta}};nodes.push(nextNode);
          if(next[target]===4){const route=[];let cursor=nodes.length-1;while(nodes[cursor].parent!==-1){route.push(nodes[cursor].move);cursor=nodes[cursor].parent;}return route.reverse();}
        }
      }
    }
    return null;
  }
  function normalizeSave(raw){
    raw=raw&&typeof raw==='object'&&raw.version===1?raw:{};
    const best=levels.map((_,i)=>Number.isInteger(raw.best?.[i])&&raw.best[i]>0&&raw.best[i]<10000?raw.best[i]:null);
    let unlocked=1;while(unlocked<levels.length&&best[unlocked-1]!==null)unlocked++;
    return {version:1,best,unlocked};
  }
  function createPuzzle(cars){if(!validLayout(cars))throw new Error('invalid parking layout');return {cars:copy(cars),initial:copy(cars),history:[],moves:0,status:'playing',index:-1,save:normalizeSave(null)};}
  function create(index=0,raw){const save=normalizeSave(raw);if(!Number.isInteger(index)||index<0||index>=levels.length||index>=save.unlocked)return null;const g=createPuzzle(levels[index].cars);g.index=index;g.save=save;return g;}
  function move(g,id,delta){
    if(g.status!=='playing'||!Number.isInteger(delta)||delta===0)return false;
    const c=g.cars.find(c=>c.id===id),r=range(g.cars,id);if(!c||delta<r.min||delta>r.max)return false;
    g.history.push(copy(g.cars));c[c.axis==='h'?'x':'y']+=delta;g.moves++;
    if(id==='B'&&c.x===4){g.status='won';if(g.index>=0){g.save.best[g.index]=Math.min(g.save.best[g.index]??Infinity,g.moves);g.save=normalizeSave(g.save);}}
    return true;
  }
  function undo(g){if(g.status==='won'||!g.history.length)return false;g.cars=g.history.pop();g.moves=g.history.length;return true;}
  function reset(g){g.cars=copy(g.initial);g.moves=0;g.history=[];g.status='playing';}
  function hint(g){return g.status==='playing'?solve(g.cars)?.[0]||null:null;}
  function stars(moves,par){return moves<=par?3:moves<=par+Math.max(2,Math.ceil(par*.35))?2:1;}
  function compatible(cars,base){return validLayout(cars)&&cars.length===base.length&&cars.every((c,i)=>c.id===base[i].id&&c.axis===base[i].axis&&c.len===base[i].len&&(c.axis==='h'?c.y===base[i].y:c.x===base[i].x));}
  function legalTransition(a,b){let changed=null;for(let i=0;i<a.length;i++){if(a[i].x!==b[i].x||a[i].y!==b[i].y){if(changed)return false;changed={id:a[i].id,delta:a[i].axis==='h'?b[i].x-a[i].x:b[i].y-a[i].y};}}if(!changed)return false;const r=range(a,changed.id);return changed.delta>=r.min&&changed.delta<=r.max&&a.find(c=>c.id==='B').x!==4;}
  function resume(raw){
    try{if(typeof raw==='string')raw=JSON.parse(raw);}catch(_){raw=null;}
    const save=normalizeSave(raw),current=raw?.version===1?raw.current:null;
    const fallback=()=>create(0,save);
    if(!current||!Number.isInteger(current.index)||current.index<0||current.index>=save.unlocked||!Array.isArray(current.history)||current.history.length>1000)return fallback();
    const g=create(current.index,save);if(!g)return fallback();
    const states=[...current.history,current.cars];
    if(!states.every(c=>compatible(c,g.initial)))return fallback();
    if(JSON.stringify(states[0])!==JSON.stringify(g.initial))return fallback();
    for(let i=1;i<states.length;i++)if(!legalTransition(states[i-1],states[i]))return fallback();
    g.cars=copy(current.cars);g.history=current.history.map(copy);g.moves=g.history.length;
    if(g.cars.find(c=>c.id==='B').x===4){g.status='won';g.save.best[g.index]=Math.min(g.save.best[g.index]??Infinity,g.moves||1);g.save=normalizeSave(g.save);}
    return g;
  }
  function serialize(g){return {...normalizeSave(g.save),current:{index:g.index,cars:copy(g.cars),history:g.history.map(copy)}};}
  function load(storage){try{return resume(storage.getItem(SAVE_KEY));}catch(_){return create(0);}}
  function persist(storage,g){try{storage.setItem(SAVE_KEY,JSON.stringify(serialize(g)));return true;}catch(_){return false;}}
  return {SIZE,SAVE_KEY,levels,validLayout,range,solve,normalizeSave,createPuzzle,create,move,undo,reset,hint,stars,resume,serialize,load,persist};
});
