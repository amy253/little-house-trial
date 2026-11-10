import * as THREE from './three.module.min.js';
import { createPile } from './catch-physics.mjs';

const Core=window.CatchDemoCore;
const island=window.IslandRevive?.create({id:'catch-jiajia'});
let failureReason='full';
const $=id=>document.getElementById(id);
const sceneBox=$('scene'),canvas=$('game'),tray=$('tray'),hint=$('hint');
const labels={flower:'🌼',house:'🏠',mic:'🎤',bow:'🎀',note:'🎵',star:'⭐',buli:'🐈',ticket:'🎟️',gift:'🎁'};
let level=1,kinds=[],game,pile,items=[],pickables=[],pointer=null,busy=false,deadline=0,roundToken=0;
let toolsUsed={remove:false,match:false,shuffle:false};
let highestPassed=0;
try{highestPassed=Math.min(Core.maxLevel,Math.max(0,Number(localStorage.getItem('catch-jiajia-passed')||0)));}catch{}
level=Math.min(Core.maxLevel,highestPassed+1);

let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
}catch{
  sceneBox.innerHTML='<p style="padding:40px;text-align:center">这个浏览器没有开启 3D 图形功能，请换一个手机浏览器试玩。</p>';
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,1,.1,100);
camera.position.set(0,8.8,3.3);
camera.lookAt(0,-.2,0);
scene.add(new THREE.HemisphereLight(0xffffff,0xb8cbb6,1.35));
const sun=new THREE.DirectionalLight(0xfff4dc,1.8);
sun.position.set(-3,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xb6d8e1,.55);fill.position.set(5,3,-4);scene.add(fill);
const world=new THREE.Group();scene.add(world);

function material(color,metalness=.02){return new THREE.MeshToonMaterial({color});}
const cream=material('#fff4df'),roof=material('#cc866e'),roofGreen=material('#8eaf92');
const gold=material('#f8cb68',.12),pink=material('#f6aabd'),blue=material('#8aaed1');
const dark=material('#3d4d52'),white=material('#fffdf6'),green=material('#83b28b');
function part(group,geometry,mat,x=0,y=0,z=0){
  const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);
  mesh.castShadow=true;mesh.receiveShadow=true;
  if(!mat.map){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,38),new THREE.LineBasicMaterial({color:'#554536',transparent:true,opacity:.58}));mesh.add(edge);}
  group.add(mesh);return mesh;
}
function sphere(group,mat,x,y,z,sx,sy=sx,sz=sx){
  const mesh=part(group,new THREE.SphereGeometry(1,14,10),mat,x,y,z);
  mesh.scale.set(sx,sy,sz);return mesh;
}
function house(group){
  part(group,new THREE.BoxGeometry(.74,.58,.65),cream,0,.12,0);
  const top=part(group,new THREE.ConeGeometry(.57,.53,4),roofGreen,0,.66,0);top.rotation.y=Math.PI/4;
  part(group,new THREE.BoxGeometry(.17,.27,.025),roof,0,-.04,.34);
  sphere(group,gold,-.21,.18,.35,.075,.09,.018);
  sphere(group,gold,.21,.18,.35,.075,.09,.018);
}
function flower(group){
  part(group,new THREE.CylinderGeometry(.05,.07,.55,9),green,0,-.08,0);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    sphere(group,pink,Math.cos(a)*.28,.28,Math.sin(a)*.28,.21,.15,.19);
  }
  sphere(group,gold,0,.31,0,.18,.17,.18);
  sphere(group,green,-.18,-.22,0,.19,.08,.1);
}
function mic(group){
  const handle=part(group,new THREE.CylinderGeometry(.1,.14,.62,14),blue,0,-.12,0);
  handle.rotation.z=-.25;
  sphere(group,dark,.08,.31,0,.27,.3,.26);
  part(group,new THREE.TorusGeometry(.23,.045,8,20),gold,.08,.31,.01);
  sphere(group,white,.02,.38,.23,.055,.08,.03);
}
function bow(group){
  sphere(group,pink,-.3,.22,0,.31,.21,.14);
  sphere(group,pink,.3,.22,0,.31,.21,.14);
  sphere(group,roof,0,.22,.04,.14,.15,.17);
  sphere(group,pink,-.12,-.13,0,.13,.27,.11);
  sphere(group,pink,.12,-.13,0,.13,.27,.11);
}
function note(group){
  sphere(group,gold,-.23,-.14,.02,.22,.14,.15);
  sphere(group,gold,.22,-.05,.02,.22,.14,.15);
  part(group,new THREE.CylinderGeometry(.055,.055,.62,10),gold,-.02,.23,.01);
  part(group,new THREE.CylinderGeometry(.055,.055,.58,10),gold,.43,.31,.01);
  part(group,new THREE.BoxGeometry(.47,.12,.12),gold,.2,.56,.01);
}
function star(group){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){
    const a=Math.PI/2+i*Math.PI/5,r=i%2?.22:.48;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
  }
  shape.closePath();
  const mesh=part(group,new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.05,bevelThickness:.05}),gold,0,.19,-.08);
  mesh.rotation.x=-.3;
}
function ticket(group){
  part(group,new THREE.BoxGeometry(.78,.5,.12),blue,0,.15,0);
  part(group,new THREE.BoxGeometry(.5,.12,.14),white,0,.18,.02);
  sphere(group,gold,-.25,.15,.08,.07,.07,.025);
  sphere(group,gold,.25,.15,.08,.07,.07,.025);
}
function gift(group){
  part(group,new THREE.BoxGeometry(.68,.58,.58),pink,0,.08,0);
  part(group,new THREE.BoxGeometry(.15,.62,.61),gold,0,.1,0);
  part(group,new THREE.BoxGeometry(.72,.12,.6),gold,0,.39,0);
  sphere(group,roof,-.17,.54,0,.2,.12,.09);
  sphere(group,roof,.17,.54,0,.2,.12,.09);
}
const buliTexture=new THREE.Texture(),buliPortrait=new Image();
buliPortrait.onload=()=>{buliTexture.image=buliPortrait;buliTexture.needsUpdate=true;iconImages.buli=buliPortrait.src;scene.traverse(object=>{if(object.userData?.buliPortrait)object.scale.x=buliPortrait.naturalWidth/buliPortrait.naturalHeight;});};
if(window.GameArt?.bind)window.GameArt.bind(buliPortrait,'cat');else buliPortrait.src='catch-buli-milktea-plush.png';
buliTexture.colorSpace=THREE.SRGBColorSpace;
function buli(group){
  const base=part(group,new THREE.CylinderGeometry(.44,.44,.16,24),cream,0,-.08,0);
  base.receiveShadow=true;
  const toy=part(group,new THREE.PlaneGeometry(1.16,1.16),new THREE.MeshBasicMaterial({map:buliTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}),0,.35,0);
  toy.rotation.x=-Math.PI/2;toy.userData.buliPortrait=true;toy.scale.x=buliPortrait.naturalWidth/buliPortrait.naturalHeight||1;
}
const builders={flower,house,mic,bow,note,star,buli,ticket,gift};
const iconImages={buli:'catch-buli-milktea-plush.png'};
const iconCanvas=document.createElement('canvas');
const iconRenderer=new THREE.WebGLRenderer({canvas:iconCanvas,antialias:true,alpha:true});
iconRenderer.setSize(96,96,false);
iconRenderer.outputColorSpace=THREE.SRGBColorSpace;
iconRenderer.setClearColor(0x000000,0);
const iconScene=new THREE.Scene();
iconScene.add(new THREE.HemisphereLight(0xffffff,0xb8cbb6,2));
const iconLight=new THREE.DirectionalLight(0xfff4dc,2);iconLight.position.set(-2,4,5);iconScene.add(iconLight);
const iconCamera=new THREE.OrthographicCamera(-.8,.8,.8,-.8,.1,10);
iconCamera.position.set(1.6,2.2,2.5);iconCamera.lookAt(0,.1,0);
for(const kind of ['flower','house','mic','bow','note','star','ticket','gift']){
  const group=new THREE.Group();builders[kind](group);iconScene.add(group);
  iconRenderer.render(iconScene,iconCamera);
  iconImages[kind]=iconCanvas.toDataURL('image/png');
  iconScene.remove(group);
  group.traverse(object=>{if(object.isMesh)object.geometry.dispose();});
}
iconRenderer.dispose();

const base=part(world,new THREE.CylinderGeometry(2.62,2.62,.18,64),material('#39433d'),0,-1.23,0);
base.receiveShadow=true;
const bottom=part(world,new THREE.CircleGeometry(2.62,64),material('#4a5349'),0,-1.12,0);
bottom.rotation.x=-Math.PI/2;bottom.receiveShadow=true;
const wok=part(world,new THREE.LatheGeometry([
  new THREE.Vector2(2.57,-1.15),new THREE.Vector2(2.73,-1.05),
  new THREE.Vector2(2.9,-.83),new THREE.Vector2(3.1,-.43)
],64),new THREE.MeshToonMaterial({color:'#39433d',side:THREE.DoubleSide}));
wok.receiveShadow=true;
const rim=part(world,new THREE.TorusGeometry(3.12,.085,10,64),material('#697065',.28),0,-.42,0);
rim.rotation.x=Math.PI/2;
for(const side of [-1,1]){
  const handle=part(world,new THREE.TorusGeometry(.38,.095,10,24),material('#39433d',.25),side*3.28,-.57,0);
  handle.rotation.x=Math.PI/2;
  handle.scale.set(.7,1,1);
}
new THREE.TextureLoader().load('catch-aijia-grimace.png',texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;
  const portrait=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.85),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  portrait.rotation.x=-Math.PI/2;
  portrait.position.set(0,-1.09,0);
  world.add(portrait);
});

function initialPosition(index){
  if(level>=2){
    const layer=Math.floor(index/24),slot=index%24;
    const outer=slot<16,angle=(outer?slot/16:(slot-16)/8)*Math.PI*2+layer*.29;
    const radius=outer?1.93:.87;
    return new THREE.Vector3(Math.cos(angle)*radius,-.63+layer*.58,Math.sin(angle)*radius);
  }
  const layer=Math.floor(index/18),slot=index%18;
  const outer=slot<12,angle=(outer?slot/12:(slot-12)/6)*Math.PI*2+layer*.23;
  const radius=outer?2.02:.87;
  return new THREE.Vector3(Math.cos(angle)*radius,-.58+layer*.83,Math.sin(angle)*radius);
}
function newRound(){
  island?.reset();failureReason='full';pointer=null;
  roundToken++;
  sceneBox.classList.remove('stirring');
  canvas.classList.remove('dragging');
  canvas.style.transform='';
  for(const item of items)world.remove(item.group);
  items=[];pickables=[];pile=createPile();busy=false;
  toolsUsed={remove:false,match:false,shuffle:false};
  deadline=level>=2?Date.now()+10*60*1000:0;
  $('timer').hidden=level<2;
  $('timer').textContent='10:00';
  $('skill-tools').hidden=level<2;
  updateTools();
  kinds=Core.levelKinds(level);
  game=Core.create(kinds);
  kinds.forEach((kind,id)=>{
    const group=new THREE.Group();builders[kind](group);
    const radius=level===1?.48:(kind==='buli'||kind==='house'?.42:.37);
    const position=initialPosition(id),body=pile.add(id,position,radius);
    body.quaternion.setFromEuler((id%3-1)*.18,id*.62,(id%4-2)*.11);
    group.position.copy(position);
    group.scale.setScalar(level===1?1.04:1.04*radius/.48);
    group.traverse(object=>{
      if(object.isMesh){object.userData.itemId=id;pickables.push(object);}
    });
    world.add(group);
    items.push({group,body,kind,removing:false});
  });
  for(let i=0;i<90;i++)pile.step(1/60);
  $('overlay').hidden=true;
  $('prize-catch').hidden=true;
  $('level-label').textContent=`第 ${level} / ${Core.maxLevel} 关`;
  $('previous').hidden=level<=1;
  $('previous').disabled=level<=1;
  $('forward').hidden=level>=Math.min(Core.maxLevel,highestPassed+1);
  $('remaining').textContent=String(kinds.length);
  hint.textContent=level===1?'轻点物件收集；按住锅来回拖动，翻找下面的同款。':'十分钟内清空锅；按住锅来回拖动，翻找下面的同款。';
  $('scene-note').textContent=level===1?'找到 3 只小卟哩，凑齐相同玩偶':'按住锅左右翻动，找到相同的 3 件';
  drawTray();
}
function updateTools(){
  $('move-out').disabled=toolsUsed.remove||!game?.tray.length;
  $('match-up').disabled=toolsUsed.match||game?.status!=='playing';
  $('shuffle').disabled=toolsUsed.shuffle||game?.status!=='playing';
}

function drawTray(){
  tray.replaceChildren();
  for(let i=0;i<7;i++){
    const slot=document.createElement('div');slot.className='slot';
    if(game.tray[i]){
      slot.classList.add('filled');
      const icon=document.createElement('img');
      icon.src=iconImages[game.tray[i].kind];
      icon.alt=game.tray[i].kind==='buli'?'奶茶卟哩':game.tray[i].kind;
      slot.append(icon);
    }
    tray.append(slot);
  }
  $('count').textContent=String(game.tray.length);
  updateTools();
}
function showResult(won,reason='full'){
  failureReason=reason;
  if(!won&&game.status==='lost')island?.offer($('overlay').querySelector('.result-actions'),reviveIsland,()=>game.status==='lost');else island?.hide();
  if(won&&level>highestPassed){
    highestPassed=level;
    try{localStorage.setItem('catch-jiajia-passed',String(highestPassed));}catch{}
  }
  $('result-title').textContent=won?'抓到家家啦！':reason==='time'?'时间到啦':'暂存区满啦';
  $('result-text').textContent=won?(level===2?'话筒玩偶家家抓到啦！第二关通关。':`第 ${level} 关通关啦！`):reason==='time'?'十分钟内没清空锅，再试一次！':'七格都装满又没凑齐三个，可以移出三件继续。';
  $('result-image').src=level===2?'catch-aijia-mic-plush.png':'jiajia-white-20261021.webp';
  $('result-image').hidden=!won;
  $('next-level').hidden=!won||level===Core.maxLevel;
  $('revive').hidden=won||reason!=='full'||level===1||toolsUsed.remove;
  $('retry').textContent=won?'重玩本关':'再试一次';
  $('overlay').hidden=false;
}
function reviveIsland(){
  const ids=Core.revive(game,failureReason);
  if(ids===false)return false;
  ids.forEach(restoreItem);
  if(deadline&&deadline<=Date.now())deadline=Date.now()+120000;
  busy=false;pointer=null;canvas.classList.remove('dragging');tray.classList.remove('lost','matched');
  $('overlay').hidden=true;island?.hide();
  $('remaining').textContent=String(game.items.filter(entry=>!entry.removed).length);
  if(deadline){const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
  drawTray();canvas.focus();return true;
}
function bubble(text,x,y){
  const node=document.createElement('span');node.className='pick-float';node.textContent=text;
  const rect=sceneBox.getBoundingClientRect();
  node.style.left=`${x-rect.left-12}px`;node.style.top=`${y-rect.top-18}px`;
  sceneBox.append(node);setTimeout(()=>node.remove(),720);
}
function hitIdAt(event){
  const rect=canvas.getBoundingClientRect();
  const point=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(point,camera);
  const hits=ray.intersectObjects(pickables,false);
  return hits.length?hits[0].object.userData.itemId:null;
}
function collectItem(id,x,y){
  const result=Core.pick(game,id);
  if(result.kind==='ignored')return;
  const item=items[id];item.removing=true;
  pile.remove(id);
  pickables=pickables.filter(mesh=>mesh.userData.itemId!==id);
  bubble(labels[kinds[id]],x,y);
  $('remaining').textContent=String(game.items.filter(entry=>!entry.removed).length);
  drawTray();
  if(result.kind==='matched'||result.kind==='won'){
    busy=true;tray.classList.add('matched');
    $('scene-note').textContent='三个相同的消掉啦！';
    hint.textContent='继续翻找，下面还有物件。';
    setTimeout(()=>{busy=false;tray.classList.remove('matched');},500);
  }
  if(result.kind==='lost'){
    const token=roundToken;tray.classList.add('lost');setTimeout(()=>{if(token!==roundToken)return;tray.classList.remove('lost');if(game.status==='lost')showResult(false);},600);
  }else if(result.kind==='won'){
    if(level===2)setTimeout(()=>{
      $('prize-catch').hidden=false;
      $('scene-note').textContent='话筒家家出现啦！点玩偶抓住她';
      hint.textContent='点锅里的话筒家家，完成这一关。';
    },650);
    else setTimeout(()=>showResult(true),650);
  }
}
function chooseAt(event){
  if(game.status!=='playing'||busy)return;
  const id=hitIdAt(event);
  if(id!==null)collectItem(id,event.clientX,event.clientY);
}
function restoreItem(id){
  const item=items[id];
  item.removing=false;
  const radius=level===1?.48:(item.kind==='buli'||item.kind==='house'?.42:.37);
  const position=new THREE.Vector3((id%7-3)*.46,1.1+Math.floor(id%3)*.22,(id%5-2)*.34);
  item.body=pile.add(id,position,radius);
  item.group.position.copy(position);
  item.group.scale.setScalar(level===1?1.04:1.04*radius/.48);
  if(!item.group.parent)world.add(item.group);
  item.group.traverse(object=>{if(object.isMesh)pickables.push(object);});
}
function moveOut(){
  if(toolsUsed.remove)return;
  const ids=Core.moveOut(game);
  if(!ids.length)return;
  toolsUsed.remove=true;
  ids.forEach(restoreItem);
  $('overlay').hidden=true;island?.hide();
  $('remaining').textContent=String(game.items.filter(entry=>!entry.removed).length);
  $('scene-note').textContent='移出三件，继续找同款！';
  drawTray();
}

canvas.addEventListener('pointerdown',event=>{
  if(game.status!=='playing'||busy)return;
  pointer={id:event.pointerId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,lastDirection:0,lastToss:0};
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>7)pointer.moved=true;
  if(pointer.moved){
    const dx=event.clientX-pointer.lastX,dy=event.clientY-pointer.lastY;
    const direction=Math.abs(dx)>3?Math.sign(dx):0;
    pile.shove(dx,dy);
    if(direction&&pointer.lastDirection&&direction!==pointer.lastDirection&&performance.now()-pointer.lastToss>250){
      pile.flip();pointer.lastToss=performance.now();
    }
    if(direction)pointer.lastDirection=direction;
    const tilt=Math.max(-11,Math.min(11,(event.clientX-pointer.startX)*.14));
    canvas.classList.add('dragging');
    canvas.style.transform=`translateY(-${Math.min(8,Math.abs(tilt)*.45)}px) rotate(${tilt}deg)`;
  }
  pointer.lastX=event.clientX;pointer.lastY=event.clientY;
});
canvas.addEventListener('pointerup',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  if(!pointer.moved)chooseAt(event);
  canvas.classList.remove('dragging');canvas.style.transform='';
  pointer=null;
});
canvas.addEventListener('pointercancel',()=>{canvas.classList.remove('dragging');canvas.style.transform='';pointer=null;});
$('move-out').onclick=moveOut;
$('revive').onclick=moveOut;
$('shuffle').onclick=()=>{
  if(game.status!=='playing'||toolsUsed.shuffle||busy)return;
  toolsUsed.shuffle=true;busy=true;updateTools();
  const token=roundToken;
  sceneBox.classList.add('stirring');
  $('scene-note').textContent='家家来了，起锅翻炒！';
  for(const delay of [430,1630])setTimeout(()=>{if(roundToken===token)pile.flip();},delay);
  setTimeout(()=>{if(roundToken===token)pile.shuffle();},1030);
  setTimeout(()=>{
    if(roundToken!==token)return;
    sceneBox.classList.remove('stirring');
    busy=false;
    $('scene-note').textContent='翻炒好啦，继续找同款！';
  },2400);
};
$('match-up').onclick=()=>{
  if(game.status!=='playing'||busy||toolsUsed.match)return;
  const counts=new Map();
  for(const entry of game.tray)counts.set(entry.kind,(counts.get(entry.kind)||0)+1);
  const remaining=new Map();
  for(const entry of game.items)if(!entry.removed){
    const list=remaining.get(entry.kind)||[];list.push(entry.id);remaining.set(entry.kind,list);
  }
  const kind=[...new Set([...counts.keys(),...remaining.keys()])].find(name=>{
    const needed=3-(counts.get(name)||0);
    return needed<=remaining.get(name)?.length&&game.tray.length+needed<=7;
  });
  if(!kind){$('scene-note').textContent='现在没有能凑齐的一组';return;}
  toolsUsed.match=true;
  const needed=3-(counts.get(kind)||0);
  const rect=sceneBox.getBoundingClientRect();
  for(const id of remaining.get(kind).slice(0,needed))collectItem(id,rect.left+rect.width/2,rect.top+rect.height/2);
  updateTools();
};
$('retry').onclick=newRound;
$('next-level').onclick=()=>{if(level<Core.maxLevel){level++;newRound();}};
$('previous').onclick=()=>{if(level>1){level--;newRound();}};
$('forward').onclick=()=>{if(level<Math.min(Core.maxLevel,highestPassed+1)){level++;newRound();}};
$('prize-catch').onclick=()=>{if(level===2&&game.status==='won'){$('prize-catch').hidden=true;showResult(true);}};

function resize(){
  const width=sceneBox.clientWidth,height=sceneBox.clientHeight;
  renderer.setSize(width,height,false);
  camera.aspect=width/height;
  camera.fov=Math.max(42,2*Math.atan(3.9/(9.7*camera.aspect))*180/Math.PI);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(sceneBox);resize();
function frame(){
  requestAnimationFrame(frame);
  if(deadline&&game.status==='playing'){
    const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    $('timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    if(seconds===0){game.status='lost';showResult(false,'time');}
  }
  pile.step(1/60);
  for(const item of items){
    if(item.removing){
      item.group.scale.multiplyScalar(.8);
      item.group.position.y+=.045;
      if(item.group.scale.x<.04){world.remove(item.group);item.removing=false;}
    }else{
      item.group.position.copy(item.body.position);
      if(item.kind==='buli')item.group.quaternion.identity();
      else item.group.quaternion.copy(item.body.quaternion);
    }
  }
  renderer.render(scene,camera);
}
newRound();frame();
