(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Handwork=factory();})(globalThis,function(){
 'use strict';
 const S3=typeof module==='object'&&module.exports?require('./jiajia-screw3d.js'):globalThis.Screw3D;
 const PALETTE=[{name:'红',hex:'#ff5d5d'},{name:'蓝',hex:'#4da3ff'},{name:'绿',hex:'#5ecf7a'},{name:'橙',hex:'#ffb545'},{name:'紫',hex:'#c06cff'}];
 const HOUSE=[{name:'蓝',hex:'#7ec8e3'},{name:'绿',hex:'#a8d5a2'},{name:'橙',hex:'#f4b183'},{name:'红',hex:'#e88b8b'},{name:'紫',hex:'#c4a8e0'}],TREE=[{name:'棕',hex:'#c9a870'},{name:'浅绿',hex:'#8fbf7a'},{name:'深绿',hex:'#5a9e4b'},{name:'红',hex:'#e88b8b'},{name:'黄',hex:'#f0d080'}];
 const YARN_TIME={unravel:.85,gather:.60,fly:.35,total:1.80};
 function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function house(){return [
  ['wall',[0,0,.70],[2.2,1.6,.12],0,5],['wall',[0,0,-.70],[2.2,1.6,.12],0,5],
  ['side',[-1.10,0,0],[.12,1.6,1.4],0,5],['side',[1.10,0,0],[.12,1.6,1.4],0,5],
  ['floor',[-.55,-.83,0],[1.10,.10,1.5],0,4],['floor',[.55,-.83,0],[1.10,.10,1.5],0,4],
  ['roof',[-.57,1.13,0],[1.38,.10,1.65],1,5,[0,0,.54]],['roof',[.57,1.13,0],[1.38,.10,1.65],1,5,[0,0,-.54]],
  ['gable',[0,.80,.70],[2.2,.66,.10],1,3],['gable',[0,.80,-.70],[2.2,.66,.10],1,3],
  ['chimney',[.55,1.30,.18],[.18,.24,.18],1,3],['door',[0,-.48,.80],[.44,.62,.10],2,5],
  ['window',[-.52,.22,.80],[.30,.30,.10],2,4],['window',[.52,.22,.80],[.30,.30,.10],2,4]
 ];}
 function tree(){return [
  ['trunk',[0,-.55,0],[.30,1.15,.30],0,5],['trunk',[0,.23,0],[.24,.75,.24],0,5],
  ['branch',[-.34,.42,0],[.13,.85,.13],0,3,[0,0,.85]],['branch',[.34,.48,0],[.13,.85,.13],0,3,[0,0,-.85]],
  ['branch',[-.20,.65,-.27],[.10,.70,.10],0,3,[.6,0,.7]],['branch',[.20,.66,-.27],[.10,.70,.10],0,3,[.6,0,-.7]],
  ['leaf',[-.50,.90,.12],[1.05,.94,.90],1,5],['leaf',[.48,1.02,-.16],[.88,.83,.80],2,5],
  ['leaf',[-.03,1.37,.30],[.76,.80,.70],1,5],['leaf',[0,1.72,-.02],[.64,.68,.64],2,5],
  ['fruit',[-.62,.81,.60],[.25,.25,.25],3,3],['fruit',[.53,1.17,.43],[.25,.25,.25],3,3],['fruit',[.10,1.57,.58],[.23,.23,.23],4,3],
  ['root',[-.20,-1.08,0],[.18,.43,.20],0,3,[0,0,-.75]],['root',[.20,-1.08,0],[.18,.43,.20],0,3,[0,0,.75]],['crown',[0,2.02,0],[.42,.38,.42],2,3]
 ];}
 function yarnIntro(isTree){const parts=isTree?tree():house(),layers=isTree?[[0,[0]],[1,[0]],[2,[0]],[3,[0]],[13,[0]],[14,[0]],[6,[3,1]],[7,[3,1]],[8,[3,1]],[10,[3]],[11,[3]],[12,[3]]]:[[0,[0]],[4,[0]],[6,[1]],[7,[1]],[8,[1]],[10,[0]],[11,[2]],[12,[2]],[13,[2]]];return layers.map(([i,colors])=>{const p=parts[i],porch=!isTree&&i===4;return{id:'y'+i,part:p[0],position:porch?[0,-.83,.88]:p[1],size:porch?[.90,.12,.28]:p[2],surface:colors.at(-1),colors,rotation:p[5]||[0,0,0]};});}
 function remaining(g){const counts=Array(g.palette.length).fill(0);for(const c of [...g.buffer,...(g.cleared||[])])counts[c]++;if(g.mode==='screw'){for(const s of g.screws)if(!s.removed)counts[s.color]++;}else for(const s of g.stacks)for(const c of s.colors)counts[c]++;return counts;}
 function nextColor(g,box){const counts=remaining(g);for(const b of g.boxes)if(b!==box&&b.color!==null)counts[b.color]=0;let color=null,n=0;counts.forEach((v,c)=>{if(v>n){n=v;color=c;}});return color;}
 function position(g,s){if(s.position)return{x:s.position[0],y:s.position[1],z:s.position[2]};const b=g.boards.find(b=>b.id===s.board),c=Math.cos(b.angle),n=Math.sin(b.angle);return{x:b.x+s.lx*c-s.ly*n,y:b.y+s.lx*n+s.ly*c};}
 function supports(g,b){return g.screws.filter(s=>(s.part??s.board)===b.id&&!s.removed).length;}
 function accessible(g,id){return g.mode==='yarn'?!!g.stacks.find(s=>s.id===id&&s.colors.length):S3.accessible(g,id);}
 function visible(g){return g.mode==='screw'?g.screws.filter(s=>accessible(g,s.id)):g.stacks.filter(s=>s.colors.length);}
 function nextTarget(g){const count=remaining(g);let color;do{color=g.targets[g.targetIndex++]??null;}while(color!==null&&!count[color]);return color;}
 function refill(g,b){const exhausted=g.mode==='screw'&&g.props.clear===0&&b.count>0&&!remaining(g)[b.color];if(b.count===3||exhausted){g.completedBoxes++;b.count=0;b.color=g.mode==='screw'?nextTarget(g):nextColor(g,b);}}
 function drain(g){let progress=true;while(progress){progress=false;for(const box of g.boxes){if(box.color===null)continue;const pile=g.cleared?.includes(box.color)?g.cleared:g.buffer,i=pile.indexOf(box.color);if(i>=0){pile.splice(i,1);box.count++;refill(g,box);progress=true;}}}}
 function deliver(g,color){const b=g.boxes.find(b=>b.color===color);let destination;if(b){destination={type:'box',index:b.id,slot:b.count};b.count++;refill(g,b);}else{destination={type:'buffer',index:g.buffer.length};g.buffer.push(color);}drain(g);return destination;}
 function start(g){if(g.status==='ready')g.status='playing';}
 function pick(g,id){if(g.status!=='playing'||g.paused||!accessible(g,id))return{ok:false};let color,source;if(g.mode==='screw'){const s=g.screws.find(s=>s.id===id);color=s.color;source=position(g,s);s.removed=true;}else{const s=g.stacks.find(s=>s.id===id);color=s.colors.pop();source={position:s.position.slice()};}g.removed++;const destination=deliver(g,color);if(g.buffer.length>=g.capacity)g.status='lost';else if(g.removed===g.total&&(g.buffer.length===0||g.props.clear===0))g.status='won';return{ok:true,id,color,source,destination};}
 function solve(initial,limit=12000){const memo=new Set();let nodes=0;function search(g,path){if(g.status==='won')return path;if(g.status==='lost'||++nodes>limit)return null;const key=(g.mode==='yarn'?g.stacks.map(s=>s.colors.length):g.screws.map(s=>+s.removed)).join(',')+';'+g.boxes.map(b=>b.color+':'+b.count).join(',')+';'+[...g.buffer].sort().join(',')+';'+[...(g.cleared||[])].sort().join(',');if(memo.has(key))return null;memo.add(key);const choices=visible(g).sort((a,b)=>{const ca=g.mode==='screw'?a.color:a.colors.at(-1),cb=g.mode==='screw'?b.color:b.colors.at(-1);return Number(g.boxes.some(b=>b.color===cb))-Number(g.boxes.some(b=>b.color===ca));});for(const p of choices){const copy=JSON.parse(JSON.stringify(g));pick(copy,p.id);const answer=search(copy,path.concat(p.id));if(answer)return answer;}return null;}const g=JSON.parse(JSON.stringify(initial));start(g);return search(g,[]);}
 function create(mode,level=1){level=Math.max(1,Math.min(999,Math.floor(Number(level)||1)));if(!['screw','yarn'].includes(mode))throw Error('Unknown game');const isTree=mode==='yarn'&&level%2===0,g={mode,level,structure:mode==='yarn'?(isTree?'tree':'house'):null,palette:mode==='screw'?PALETTE:isTree?TREE:HOUSE,status:'ready',paused:false,capacity:5,buffer:[],boxes:[],targets:[],completedBoxes:0,removed:0,total:0,usedRevives:0,props:{add:1,clear:1},solution:[],boards:[],screws:[],stacks:[]};
  if(mode==='screw'){Object.assign(g,S3.create(level));g.props.box=2;}
  else if(level<=2)g.stacks=yarnIntro(isTree);
  else{const parts=isTree?tree():house();for(let attempt=0;attempt<40;attempt++){const rng=random(level*9173+attempt*631),quota=isTree?[18,12,12,9,9]:[18,15,12,9,6];g.stacks=parts.map((p,i)=>({id:'y'+i,part:p[0],position:p[1],size:p[2],surface:p[3],colors:Array(p[4]).fill(null),rotation:p[5]||[0,0,0]}));for(const s of g.stacks){s.colors[s.colors.length-1]=s.surface;quota[s.surface]--;}if(!isTree){g.stacks[0].colors[g.stacks[0].colors.length-2]=3;quota[3]--;}let valid=true;for(const s of g.stacks){for(let d=s.colors.length-2;d>=0;d--){if(s.colors[d]!==null)continue;const options=quota.map((n,c)=>({n,c,t:rng()})).filter(o=>o.n>0&&o.c!==s.colors[d+1]).sort((a,b)=>b.n-a.n||a.t-b.t);if(!options.length){valid=false;break;}s.colors[d]=options[0].c;quota[options[0].c]--;}if(!valid)break;}if(valid)break;if(attempt===39)throw Error('Yarn layer allocation failed');}}
  g.total=mode==='screw'?g.screws.length:g.stacks.reduce((n,s)=>n+s.colors.length,0);const counts=remaining(g);if(mode==='yarn') for(let c=0;c<counts.length;c++)for(let n=0;n<counts[c]/3;n++)g.targets.push(c);g.targetIndex=0;for(let id=0;id<2;id++){const b={id,color:null,count:0};b.color=mode==='screw'?(g.targets[g.targetIndex++]??null):nextColor(g,b);g.boxes.push(b);}const answer=mode==='screw'?g.solution:solve(g);if(!answer)throw Error('Could not generate a solvable '+mode+' level '+level);g.solution=answer;return g;
 }
 function revive(g){if(g.status!=='lost'||g.usedRevives>=2)return false;g.usedRevives++;g.capacity+=2;g.status='playing';g.paused=false;return true;}
 function useProp(g,id){if(g.mode!=='screw'||g.status!=='playing'||g.paused||!g.props[id])return false;if(id==='add'){g.capacity++;g.props.add--;}else if(id==='clear'&&g.buffer.length){g.cleared=[...(g.cleared||[]),...g.buffer];g.buffer=[];g.props.clear--;for(const b of g.boxes)refill(g,b);drain(g);}else if(id==='box'&&g.boxes.length<4){const color=nextTarget(g);if(color===null)return false;g.boxes.push({id:g.boxes.length,color,count:0});g.props.box--;drain(g);}else return false;return true;}

 return{PALETTE,YARN_TIME,create,start,pick,accessible,visible,position,supports,revive,solve,useProp};
});
