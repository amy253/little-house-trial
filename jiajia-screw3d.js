(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Screw3D=factory();})(globalThis,function(){
 'use strict';
 const palette=[{name:'粉',hex:'#ee45d1'},{name:'蓝',hex:'#316ff1'},{name:'绿',hex:'#83d42c'},{name:'黄',hex:'#f6d72d'},{name:'紫',hex:'#8a46dc'},{name:'青',hex:'#22cddd'},{name:'红',hex:'#ef4b53'}];
 function rotate(v,r){let[x,y,z]=v;const[a,b,c]=r;[y,z]=[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];[x,z]=[x*Math.cos(b)+z*Math.sin(b),-x*Math.sin(b)+z*Math.cos(b)];return[x*Math.cos(c)-y*Math.sin(c),x*Math.sin(c)+y*Math.cos(c),z];}
 function create(level){const parts=[],type=level%2?'cosmetics':'cube';function add(kind,position,size,color,count,normal=[0,0,1],rotation=[0,0,0],layer=0,data={}){const p={id:parts.length,name:kind,kind,shape:kind,position,size,color,count,normal,rotation,requires:[],layer,...data};parts.push(p);return p;}
  if(type==='cosmetics'){
   for(let i=0;i<4;i++)add('shell',[0,-.49,0],[2.64,1.32,2.64],'#c382d7',5,[Math.sin(i*Math.PI/2+.7),0,Math.cos(i*Math.PI/2+.7)],[0,0,0],-1,{arc:i*Math.PI/2});
   for(let i=0;i<4;i++)add('arc',[0,-1.18,0],[2.64,.08,2.64],'#ce99db',3,[0,-1,0],[0,0,0],-2,{arc:i*Math.PI/2});
   const recipes=[
    ['brush',[-.94,.0,-.02],[.19,2.10,.16],2,[0,.12,.12],'#26252b'],
    ['brush',[-.73,-.08,-.18],[.16,1.92,.15],2,[0,-.15,-.05],'#29272d'],
    ['brush',[-.52,-.12,-.25],[.17,1.84,.16],2,[0,.24,.04],'#26252b'],
    ['brush',[.23,-.05,-.67],[.33,2.02,.25],2,[0,-.10,-.06],'#cd8c79'],
    ['tube',[-1.02,-.28,.18],[.37,1.58,.23],4,[0,-.05,.13],'#8ed9e3'],
    ['comb',[1.01,-.04,-.43],[.40,1.84,.07],3,[0,-.40,-.06],'#a9e7df'],
    ['lipstick',[-.26,-.42,.23],[.29,1.24,.29],3,[0,.10,.04],'#f37a9c'],
    ['lipstick',[.40,-.28,-.12],[.27,1.51,.27],3,[0,-.10,-.09],'#ee6d96'],
    ['lipstick',[.80,-.54,.30],[.27,1.04,.27],3,[0,.25,-.43],'#dc7997'],
    ['bottle',[.52,-.51,.67],[.37,1.02,.34],4,[0,-.05,0],'#b78e77'],
    ['bottle',[.86,-.28,-.04],[.32,1.35,.33],4,[0,-.17,.03],'#d4ac8c'],
    ['bottle',[.16,-.74,.80],[.34,.78,.34],4,[0,-.16,-.02],'#dcae94'],
    ['mascara',[-.62,-.28,.29],[.11,1.57,.11],2,[0,.20,.01],'#272a2b'],
    ['mascara',[-.39,-.40,.16],[.13,1.35,.13],2,[0,-.20,.02],'#222c2c'],
    ['wand',[.67,-.07,-.54],[.16,1.77,.12],2,[0,-.15,.02],'#ef59d0'],
    ['palette',[-.20,.39,-.51],[.78,.68,.11],5,[-.91,.04,.16],'#d6b28d'],
    ['palette',[.70,-.03,-.78],[.50,1.62,.12],5,[0,-.04,.05],'#cda47e'],
    ['compact',[.06,-.49,.09],[.61,.30,.61],4,[.12,.03,0],'#e5aac8'],
    ['compact',[-.31,.36,-.34],[.54,.13,.52],4,[-.48,0,.10],'#efce9e'],
    ['compact',[-.26,-.83,.67],[.59,.28,.56],4,[.03,.12,0],'#e7b0c9'],
    ['tube',[.01,-.45,-.25],[.32,1.28,.21],4,[0,.11,-.10],'#f1e4cc'],
    ['wand',[-.81,-.46,.55],[.11,1.30,.10],2,[0,.06,.03],'#9b947f'],
    ['jar',[.56,-.88,.08],[.56,.43,.54],3,[0,.08,0],'#e7afcc']
   ];
   for(const [kind,position,size,count,rotation,color]of recipes)add(kind,position,size,color,count,[0,0,1],rotation,2);
   for(const [inside,cover]of [[20,12],[25,19],[28,15],[30,17]])parts[inside].requires=[cover];
  }else{
   const blocks=[];for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){const normal=z?[0,0,z]:x?[x,0,0]:y?[0,y,0]:[0,0,1],p=add('block',[x*.60,y*.60,z*.60],[.57,.57,.57],['#9cdae0','#b8e8d4','#bccbe5'][(x-y+z+6)%3],2,normal,[0,0,0],Math.max(Math.abs(x),Math.abs(y),Math.abs(z)),{grid:[x,y,z]});blocks.push(p);}
   const strips=[];for(let axis=0;axis<3;axis++)for(const sign of [-1,1])for(const offset of [-.43,.43]){const position=[0,0,0],size=[.18,.18,.18],normal=[0,0,0];position[axis]=sign*.97;normal[axis]=sign;size[axis]=.08;const side=(axis+1)%3,long=(axis+2)%3;position[side]=offset;size[side]=.20;size[long]=1.88;strips.push(add('strap',position,size,'#f1ca66',strips.length<9?2:3,normal,[0,0,0],3,{sideAxis:side,longAxis:long}));}
   for(const p of blocks){if(p.grid.every(n=>n===0)){p.requires=[blocks.find(p=>p.grid[0]===0&&p.grid[1]===0&&p.grid[2]===1).id];continue;}const axis=p.normal.findIndex(n=>n!==0),strip=strips.find(s=>s.normal[axis]===p.normal[axis]&&Math.abs(s.position[s.sideAxis]-p.position[s.sideAxis])<.28);if(strip)p.requires=[strip.id];}
  }
  const screws=[];for(const p of parts){const anchors=[];if(p.kind==='shell'){for(let k=0;k<p.count;k++){const a=p.arc+(.14+k*.18)*Math.PI/2,n=[Math.sin(a),0,Math.cos(a)];anchors.push({position:[n[0]*1.36,[-.36,.26,-.15,.42,-.47][k],n[2]*1.36],normal:n});}}
   else if(p.kind==='arc'){for(let k=0;k<p.count;k++){const a=p.arc+(.20+k*.30)*Math.PI/2;anchors.push({position:[Math.sin(a)*.92,-.07,Math.cos(a)*.92],normal:[0,-1,0]});}}
   else if(type==='cosmetics'){
    const[w,h,d]=p.size,front=(x,y)=>({position:[x*w,y*h,d/2+.035],normal:[0,0,1]}),back=(x,y)=>({position:[x*w,y*h,-d/2-.035],normal:[0,0,-1]}),side=(x,y)=>({position:[x*(w/2+.035),y*h,0],normal:[x,0,0]}),top=(x,z)=>({position:[x*w,h/2+.035,z*d],normal:[0,1,0]});let list;
    if(['brush','mascara','wand'].includes(p.kind))list=[front(0,-.28),back(0,.15)];
    else if(p.kind==='comb')list=[front(-.32,.31),front(-.32,-.26),back(-.32,0)];
    else if(p.kind==='bottle')list=[front(0,-.12),top(0,0),side(1,-.23),back(0,0)];
    else if(p.kind==='lipstick')list=[front(0,-.31),side(1,-.24),back(0,-.16)];
    else if(p.kind==='tube')list=[front(0,-.10),front(0,.25),side(-1,-.30),back(0,.12)];
    else if(p.kind==='palette')list=[front(-.30,.34),front(.30,.34),front(0,-.28),back(-.25,0),back(.25,-.25)];
    else if(p.kind==='compact')list=[top(-.24,-.15),top(.24,-.15),side(1,0),top(0,.26)];
    else list=[front(0,0),side(1,0),back(0,0)];
    for(const a of list)anchors.push({position:rotate(a.position,p.rotation),normal:rotate(a.normal,p.rotation)});
   }
   else{const axis=p.normal.findIndex(n=>Math.abs(n)>.5),other=[0,1,2].filter(i=>i!==axis),span=other.map(i=>p.size[i]);let spots=p.count===1?[[0,0]]:p.count===2?[[-.23,-.23],[.23,.23]]:p.count===3?[[-.26,.26],[.26,.26],[0,-.26]]:[[-.26,.26],[.26,.26],[-.26,-.26],[.26,-.26]];if(Math.min(...span)<.33||p.kind==='brush'){const long=span[0]>span[1]?0:1;spots=Array.from({length:p.count},(_,k)=>{const a=[0,0];a[long]=p.count===1?0:(k/(p.count-1)-.5)*.66;return a;});}
    for(const spot of spots){const q=[0,0,0];if(p.kind==='comb')spot[0]=-.31;q[axis]=(p.size[axis]/2+.035)*p.normal[axis];q[other[0]]=spot[0]*span[0];q[other[1]]=spot[1]*span[1];anchors.push({position:rotate(q,p.rotation),normal:rotate(p.normal,p.rotation)});}}
   anchors.forEach((a,k)=>screws.push({id:'s'+p.id+'-'+k,part:p.id,position:a.position.map((n,i)=>n+p.position[i]),normal:a.normal,color:0,removed:false}));}
  const ordered=[],left=parts.slice();while(left.length){const available=left.filter(p=>p.requires.every(id=>ordered.some(p=>p.id===id))).sort((a,b)=>b.layer-a.layer||b.position[2]-a.position[2]||a.id-b.id);if(!available.length)throw Error('Invalid shell dependencies');const p=available[0];ordered.push(p);left.splice(left.indexOf(p),1);}
  const solution=ordered.flatMap(p=>screws.filter(s=>s.part===p.id).map(s=>s.id)),targets=[];for(let i=0;i<solution.length;i+=6){const a=(i/3)%palette.length,b=(a+1)%palette.length;if(i+5<solution.length){targets.push(a,b);for(let k=0;k<6;k++)screws.find(s=>s.id===solution[i+k]).color=k%2?b:a;}else{targets.push(a);for(let k=i;k<solution.length;k++)screws.find(s=>s.id===solution[k]).color=a;}}
  return{objectType:type,objectName:type==='cosmetics'?'密集零件·彩妆收纳筒':'多层拼装·搭扣方块',parts,screws,solution,targets,palette};
 }
 function accessible(g,id){const s=g.screws.find(s=>s.id===id);if(!s||s.removed)return false;const p=g.parts.find(p=>p.id===s.part);return p.requires.every(id=>g.screws.filter(s=>s.part===id).every(s=>s.removed));}
 return{create,accessible};
});
