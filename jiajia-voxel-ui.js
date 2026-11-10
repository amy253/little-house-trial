import * as THREE from './three.module.min.js';

const V=window.VoxelPop,$=id=>document.getElementById(id);
const host=$('game'),canvas=$('model'),effects=$('effects'),ctx=effects.getContext('2d');
const dialog=$('dialog'),island=window.IslandRevive.create({id:'jiajia-voxel'});
const saveKey='little-house:voxel-pop:v1';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const colorNames={lime:'亮黄',gold:'金黄',brown:'棕',red:'红',green:'绿',mint:'薄荷绿',teal:'青',gray:'灰',ivory:'米白',blue:'蓝',pink:'粉',purple:'紫'};
let save={level:1,coins:0,streak:0};
try{
 const value=JSON.parse(localStorage.getItem(saveKey));
 if(value&&Number.isSafeInteger(value.level)&&value.level>0&&Number.isSafeInteger(value.coins)&&value.coins>=0)
  save={level:value.level,coins:value.coins,streak:Number.isSafeInteger(value.streak)?Math.max(0,value.streak):0};
}catch{}
function persist(){try{localStorage.setItem(saveKey,JSON.stringify(save));}catch{}}

const world=new THREE.Scene(),pivot=new THREE.Group(),camera=new THREE.OrthographicCamera();
const box=new THREE.BoxGeometry(.925,.925,.925),matrix=new THREE.Matrix4(),tint=new THREE.Color();
const center=new THREE.Vector3(),vector=new THREE.Vector3(),view=new THREE.Vector3(),inverse=new THREE.Quaternion();
const keyLight=new THREE.DirectionalLight(0xffffff,1.85),rimLight=new THREE.DirectionalLight(0xb7d3ff,.65);
keyLight.position.set(-16,26,37);rimLight.position.set(18,-8,-11);
world.add(pivot,new THREE.AmbientLight(0xffffff,1.1),keyLight,rimLight);
camera.position.set(0,0,65);camera.near=.1;camera.far=140;camera.updateProjectionMatrix();
const hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
let renderer,game,shotAt=0,last=0,lastHit=0,lastTouch=0,combo=0,zoom=1,yaw=-.32,pitch=.22,span=34,spin=true,choosing=false,finishedAt=null;
let viewport,activeNodes=new Map(),nextShots=new Map(),meshes=new Map(),instances=new Map(),shots=[],pieces=[];
const pointers=new Map();
let audio=null,sound=true,hapticAt=0;

function armSound(){
 if(!sound)return;
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return;
 try{
  audio??=new Audio();
  if(audio.state==='suspended')audio.resume().catch(()=>{});
 }catch{}
}
function popSound(){
 if(!sound||audio?.state!=='running')return;
 const start=audio.currentTime,tone=audio.createOscillator(),volume=audio.createGain();
 tone.type='triangle';
 tone.frequency.setValueAtTime(280,start);
 tone.frequency.exponentialRampToValueAtTime(107,start+.072);
 volume.gain.setValueAtTime(.001,start);
 volume.gain.exponentialRampToValueAtTime(.15,start+.008);
 volume.gain.exponentialRampToValueAtTime(.001,start+.09);
 tone.connect(volume).connect(audio.destination);
 tone.start(start);tone.stop(start+.095);
}

function retireCannon(node,rect,color,now){
 const round=game;
 const delay=Math.max(0,hapticAt-now);
 hapticAt=now+delay+65;
 const playFeedback=()=>{
  if(game!==round||document.hidden||dialog.open)return;
  navigator.vibrate?.(28);
  popSound();
 };
 if(delay>0)setTimeout(playFeedback,delay);else playFeedback();

 const exit=node.cloneNode(false);
 exit.classList.add('cannon-exit');
 exit.setAttribute('aria-hidden','true');
 Object.assign(exit.style,{left:`${rect.left-viewport.left}px`,top:`${rect.top-viewport.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
 host.append(exit);
 const animation=exit.animate(reduced?[
  {opacity:1,filter:'brightness(1.35)'},{opacity:0}
 ]:[
  {opacity:1,transform:'scale(1)',filter:'brightness(1)'},
  {opacity:1,transform:'translateY(2px) scale(.88,1.08)',filter:'brightness(1.6)',offset:.28},
  {opacity:0,transform:'translateY(-13px) scale(1.28)',filter:'brightness(1.5)'}
 ],{duration:reduced?100:270,easing:'ease-out'});
 animation.onfinish=()=>exit.remove();
 if(!reduced)for(let i=0;i<7;i++){
  const angle=i*Math.PI*2/7,speed=45+Math.random()*47;
  pieces.push({x:rect.left+rect.width/2-viewport.left,y:rect.top+rect.height/2-viewport.top,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.25+Math.random()*.12,size:3+Math.random()*3,color:i%2?color:'#fff0b0'});
 }
}

function show(title,description,art,actions){
 island.hide();$('dialog-title').textContent=title;$('dialog-text').textContent=description;$('dialog-art').textContent=art;
 $('dialog-actions').replaceChildren(...actions.map(([label,action],i)=>{
  const button=document.createElement('button');button.type='button';button.textContent=label;button.classList.toggle('primary',i===0);button.onclick=action;return button;
 }));
 if(!dialog.open)dialog.showModal();
}
function close(){island.hide();if(dialog.open)dialog.close();last=0;}
function message(text){$('message').textContent=text;}
function resetView(){yaw=game?.stage.shape==='melon'?.62:-.32;pitch=.22;zoom=1;lastTouch=0;applyView();}
function applyView(){
 pivot.rotation.set(pitch,yaw,-.07,'YXZ');
 if(!viewport||camera.zoom===zoom)return;
 camera.zoom=zoom;camera.updateProjectionMatrix();
}
function resize(){
 if(!renderer)return;
 host.style.setProperty('--game-height',(visualViewport?.height||innerHeight)+'px');
 const rect=host.getBoundingClientRect(),stage=canvas.getBoundingClientRect(),aspect=Math.max(.01,stage.width/Math.max(1,stage.height));
 const height=span*Math.max(1,.75/aspect),width=height*aspect;
 camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
 const dpr=Math.min(devicePixelRatio||1,1.75);
 renderer.setPixelRatio(dpr);renderer.setSize(stage.width,stage.height,false);
 effects.width=Math.round(rect.width*dpr);effects.height=Math.round(rect.height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 viewport={width:rect.width,height:rect.height,left:rect.left,top:rect.top,x:stage.left-rect.left,y:stage.top-rect.top,w:stage.width,h:stage.height};
}
function setModel(){
 for(const mesh of meshes.values()){mesh.material.dispose();mesh.dispose();pivot.remove(mesh);}
 meshes.clear();instances.clear();
 const points=[...game.board.values()],bounds=new THREE.Box3();
 for(const point of points)bounds.expandByPoint(vector.set(point.x,point.y,point.z));
 bounds.getCenter(center);const size=bounds.getSize(vector);
 span=Math.max(size.y+1,Math.hypot(size.x,size.z)*.96+1)*1.27;
 for(const color of Object.keys(V.COLORS)){
  const group=points.filter(p=>p.color===color);
  if(!group.length)continue;
  const material=new THREE.MeshStandardMaterial({color:color==='gray'&&game.stage.shape==='melon'?'#373944':V.COLORS[color],roughness:.62,metalness:.02});
  const mesh=new THREE.InstancedMesh(box,material,group.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.forEach((point,index)=>{
   mesh.setMatrixAt(index,matrix.makeTranslation(point.x-center.x,point.y-center.y,point.z-center.z));
   const shade=.87+.13*Math.abs(Math.sin(point.x*41+point.y*19+point.z*73));
   mesh.setColorAt(index,tint.setRGB(shade,shade,shade));
   instances.set(point.key,{mesh,index});
  });
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();meshes.set(color,mesh);pivot.add(mesh);
 }
 resetView();resize();
}
function projected(point){
 vector.set(point.x-center.x,point.y-center.y,point.z-center.z).applyQuaternion(pivot.quaternion).project(camera);
 return {x:viewport.x+(vector.x*.5+.5)*viewport.w,y:viewport.y+(.5-vector.y*.5)*viewport.h};
}
function visibleTargets(){
 const bins=new Map();
 inverse.copy(pivot.quaternion).invert();
 view.set(0,0,1).applyQuaternion(inverse);
 const direction=[view.x,view.y,view.z];
 for(const point of game.board.values()){
  if(!V.shell(game,point,direction))continue;
  vector.set(point.x-center.x,point.y-center.y,point.z-center.z).applyQuaternion(pivot.quaternion);
  const key=`${Math.round(vector.x*1.24)}:${Math.round(vector.y*1.24)}`;
  if((bins.get(key)?.depth??-Infinity)<vector.z)bins.set(key,{point,depth:vector.z});
 }
 const colors=new Map();
 for(const {point} of bins.values()){
  if(!colors.has(point.color))colors.set(point.color,[]);
  colors.get(point.color).push(point);
 }
 return colors;
}
function cannonNode(cannon,queued){
 const node=document.createElement(queued?'button':'span');
 if(queued)node.type='button';
 node.className='cannon';node.dataset.tier=cannon.tier;node.style.setProperty('--c',V.COLORS[cannon.color]);
 updateAmmo(node,cannon);return node;
}
function updateAmmo(node,cannon){
 if(!node)return;
 node.textContent=cannon.ammo;node.setAttribute('aria-label',`${colorNames[cannon.color]}色炮台，剩 ${cannon.ammo} 发`);
}
function renderPanels(){
 const list=$('slots');list.style.setProperty('--slots',game.slots.length);activeNodes.clear();
 list.replaceChildren(...game.slots.map((cannon,i)=>{
  const slot=document.createElement('div');slot.className=cannon?'socket active':'socket';slot.dataset.slot=i;
  if(cannon){const node=cannonNode(cannon,false);activeNodes.set(cannon.id,node);slot.append(node);}
  return slot;
 }));
 $('queue').replaceChildren(...game.queue.map((lane,col)=>{
  const column=document.createElement('div');column.className='lane';
  lane.slice(0,3).forEach((cannon,row)=>{
   const node=cannonNode(cannon,true);node.dataset.col=col;node.dataset.row=row;
   node.disabled=(!choosing&&row!==0)||game.status!=='playing';
   column.append(node);
  });return column;
 }));
 for(const id of ['choose','shuffle','vacuum']){
  $(id).querySelector('b').textContent=game.boosts[id];$(id).disabled=game.boosts[id]===0||game.status!=='playing';
 }
 $('choose').setAttribute('aria-pressed',String(choosing));
 ['slot-add','slot-add-2'].forEach((id,index)=>{
  const button=$(id),unlocked=game.slots.length>6+index;
  button.disabled=unlocked||game.status!=='playing';button.querySelector('small').textContent=unlocked?'已开':'解锁';
 });
}
function renderProgress(){
 const percent=Math.round(100*(1-game.board.size/game.total));
 if($('fill').style.width===percent+'%')return;
 $('fill').style.width=percent+'%';$('level').setAttribute('aria-label',`关卡 ${game.level}，已清除 ${percent}%`);
}
function launch(col,row){
 const result=V.launch(game,col,row,choosing);
 if(!result){message(game.slots.includes(null)?'先点队首炮台':'发射槽已满，等炮台打完或合成');return;}
 if(choosing){choosing=false;game.boosts.choose--;}
 renderPanels();
 const newCannon=activeNodes.get((result.merged||result.cannon).id);
 newCannon?.animate([{transform:'translateY(30px) scale(.76)',opacity:.45},{transform:'translateY(-4px) scale(1.08)'},{transform:'none',opacity:1}],{duration:reduced?1:220,easing:'ease-out'});
 message(result.merged?'合成双炮台！弹量叠加':'炮台只打同色方块');
 if(V.blocked(game))finishedAt=performance.now()+400;
}
function fire(cannon,point,now){
 const slot=game.slots.indexOf(cannon),node=activeNodes.get(cannon.id);
 if(slot<0||!V.hit(game,cannon,point))return false;
 const rect=node.getBoundingClientRect();
 const from={x:rect.left+rect.width/2-viewport.left,y:rect.top-viewport.top};
 shots.push({point,from,age:0,duration:135+Math.random()*65});
 if(cannon.ammo===0){
  retireCannon(node,rect,V.COLORS[cannon.color],now);
  nextShots.delete(cannon.id);renderPanels();
 }
 else updateAmmo(node,cannon);
 if(game.status==='won')finishedAt=now+580;
 return true;
}
function volley(now){
 if(!game.slots.some(Boolean)||now-shotAt<27)return;
 shotAt=now;
 const targets=visibleTargets();
 for(const cannon of game.slots.slice()){
  if(!cannon||now<(nextShots.get(cannon.id)||0))continue;
  const pool=targets.get(cannon.color);
  if(!pool?.length)continue;
  const shotsPerVolley=cannon.tier===1?1:2;
  for(let i=0;i<shotsPerVolley&&pool.length&&cannon.ammo;i++){
   const point=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
   fire(cannon,point,now);
  }
  if(cannon.ammo)nextShots.set(cannon.id,now+(cannon.tier===1?28:30));
 }
 if(game.status==='playing'&&V.blocked(game))finishedAt=now+400;
}
function drawEffects(dt,now){
 ctx.clearRect(0,0,viewport.width,viewport.height);
 for(let i=shots.length-1;i>=0;i--){
  const shot=shots[i];shot.age+=dt*1000;
  const t=clamp(shot.age/shot.duration,0,1),to=projected(shot.point);
  const px=shot.from.x+(to.x-shot.from.x)*t,py=shot.from.y+(to.y-shot.from.y)*t;
  if(t===1){
   shots.splice(i,1);
   const entry=instances.get(shot.point.key);entry.mesh.setMatrixAt(entry.index,hiddenMatrix);entry.mesh.instanceMatrix.needsUpdate=true;
   combo=now-lastHit<800?combo+1:1;lastHit=now;
   for(let j=0;j<(reduced?1:5);j++){
    const a=Math.random()*Math.PI*2,s=25+Math.random()*90;
    pieces.push({x:to.x,y:to.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+Math.random()*.27,size:2+Math.random()*3,color:j?V.COLORS[shot.point.color]:'#fff7d6'});
   }
   continue;
  }
  const tail=Math.max(0,t-.28);
  ctx.strokeStyle='rgba(238,244,255,.5)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(shot.from.x+(to.x-shot.from.x)*tail,shot.from.y+(to.y-shot.from.y)*tail);ctx.lineTo(px,py);ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();
 }
 for(let i=pieces.length-1;i>=0;i--){
  const p=pieces[i];p.life-=dt;if(p.life<=0){pieces.splice(i,1);continue;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;ctx.globalAlpha=clamp(p.life*4,0,1);ctx.fillStyle=p.color;
  ctx.fillRect(p.x,p.y,p.size,p.size);
 }
 ctx.globalAlpha=1;
 $('combo').hidden=combo<3||now-lastHit>1100;
 if(!$('combo').hidden)$('combo').textContent=`连击 ×${combo}`;
 renderProgress();
}
function settle(){
 finishedAt=null;
 if(game.status==='won'){
  const coinsWon=30;
  save.streak++;save.coins+=coinsWon;save.level=Math.max(save.level,game.level+1);persist();
  show('恭喜通关',`第 ${game.level} 关 · +${coinsWon} 金币 · ${save.streak} 连胜`,game.stage.icon,
   [['下一关',()=>start(game.level+1)],['再玩一次',()=>start(game.level)]]);
 }else{
  const failed=game;
  show('发射槽卡住了','剩下的炮台打不到露在外面的颜色。复活后保留已消掉的方块，并腾出一个发射槽。','',
   [['重新挑战',()=>{save.streak=0;persist();start(game.level);}],[ '返回小屋',()=>location.assign('index.html')]]);
  island.offer($('revive'),()=>{
   if(game!==failed||!V.revive(game))return false;
   close();renderPanels();message('已腾出发射槽，继续吧');return true;
  },()=>game===failed&&game.status==='lost');
 }
}
function start(level){
 close();island.reset();game=V.create(level);shots=[];pieces=[];nextShots.clear();combo=0;lastHit=0;shotAt=0;hapticAt=0;finishedAt=null;choosing=false;pointers.clear();
 host.querySelectorAll('.cannon-exit').forEach(node=>node.remove());
 setModel();renderPanels();renderProgress();$('combo').hidden=true;$('level').textContent=`关卡 ${level}`;
 const startAt=level<=4?0:V.stages.length-4;
 $('models').replaceChildren(...V.stages.slice(startAt,startAt+4).map(stage=>{
  const span=document.createElement('span');span.textContent=stage.icon;span.title=stage.name;span.classList.toggle('active',stage===game.stage);return span;
 }));
 message(level===1?'点最前排的炮台':'选队首炮台，注意发射槽');
 if(level===2)show('合成炮台','三个同色炮台会合成双炮台，保留全部剩余弹量。双炮台还能继续合成。','🟢 + 🟢 + 🟢',[['点击继续',close]]);
}
function frame(now){
 requestAnimationFrame(frame);
 if(!game||!viewport||document.hidden)return;
 const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
 if(!dialog.open){
  if(spin&&pointers.size===0&&now-lastTouch>500){yaw+=dt*(reduced?.29:.62);applyView();}
  if(game.status==='playing')volley(now);
  drawEffects(dt,now);
  if(finishedAt!==null&&now>=finishedAt&&!shots.length)settle();
 }
 renderer.render(world,camera);
}

function gap(){
 const [a,b]=pointers.values();
 return Math.hypot(a.x-b.x,a.y-b.y);
}
canvas.addEventListener('pointerdown',e=>{
 if(pointers.size>=2)return;
 canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastTouch=performance.now();
});
canvas.addEventListener('pointermove',e=>{
 const prior=pointers.get(e.pointerId);if(!prior)return;
 const before=pointers.size===2?gap():0;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});lastTouch=performance.now();
 if(pointers.size===2&&before>0)zoom=clamp(zoom*gap()/before,.62,1.62);
 else{yaw+=(e.clientX-prior.x)*.014;pitch=clamp(pitch+(e.clientY-prior.y)*.012,-1.34,1.34);}
 applyView();
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>pointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.62,1.62);applyView();},{passive:false});
canvas.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;
 e.preventDefault();lastTouch=performance.now();
 if(e.key==='ArrowLeft'||e.key==='ArrowRight')yaw+=e.key==='ArrowLeft'?-.22:.22;
 if(e.key==='ArrowUp'||e.key==='ArrowDown')pitch=clamp(pitch+(e.key==='ArrowUp'?-.16:.16),-1.34,1.34);
 if(e.key==='+'||e.key==='-')zoom=clamp(zoom+(e.key==='+'?.1:-.1),.62,1.62);
 applyView();
});
$('center').onclick=resetView;
$('spin').onclick=()=>{spin=!spin;$('spin').setAttribute('aria-pressed',String(spin));};
host.addEventListener('click',armSound,{capture:true});
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));if(sound)armSound();};
$('queue').onclick=e=>{const button=e.target.closest('button[data-col]');if(button)launch(Number(button.dataset.col),Number(button.dataset.row));};
$('choose').onclick=()=>{choosing=!choosing;renderPanels();message(choosing?'任选一颗待发炮台':'点最前排的炮台');};
$('shuffle').onclick=()=>{if(V.shuffle(game)){renderPanels();message('已重新排列炮台');}};
$('vacuum').onclick=()=>{
 if(game.status!=='playing'||!game.boosts.vacuum)return;
 let cannon=game.slots.find(Boolean);
 if(!cannon){
  const col=game.queue.findIndex(lane=>lane.length);
  if(col<0)return;
  launch(col,0);cannon=game.slots.find(Boolean);
 }
 if(!cannon)return;
 const now=performance.now();
 const targets=[...game.board.values()].filter(point=>point.color===cannon.color).slice(0,24);
 for(const point of targets)if(cannon.ammo>0)fire(cannon,point,now);
 game.boosts.vacuum--;renderPanels();message('吸走一组同色方块');
};
function unlockSlot(){
 if(save.coins<30){message('解锁一格需 30 金币，通关可获得');return;}
 if(V.addSlot(game)){save.coins-=30;persist();renderPanels();message('已解锁一个发射槽');}
}
$('slot-add').onclick=unlockSlot;$('slot-add-2').onclick=unlockSlot;
$('pause').onclick=()=>{
 if(game.status!=='playing')return;
 show('已暂停','点最前排炮台，自动射击同色方块。滑动看另一面，双指调整大小。','',[['继续',close],['重新挑战',()=>start(game.level)]]);
};
dialog.addEventListener('cancel',e=>{e.preventDefault();if(game?.status==='playing')close();});
window.addEventListener('resize',resize);visualViewport?.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{last=0;pointers.clear();});
try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setClearColor(0,0);start(save.level);requestAnimationFrame(frame);
}catch{
 show('立体模型没能加载','用手机自带浏览器重新打开后再试。','',[['重新加载',()=>location.reload()],[ '返回小屋',()=>location.assign('index.html')]]);
}
