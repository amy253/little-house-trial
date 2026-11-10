import * as T from './three.module.min.js';
import { advanceMiningCycle, cameraTargetFor, missionFor } from './mine-motion.mjs';

const $=id=>document.getElementById(id), canvas=$('mine-map');
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setSize(432,720,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene();scene.background=new T.Color('#edd6a4');scene.fog=new T.Fog('#edd6a4',42,85);
const camera=new T.OrthographicCamera(-8.5,8.5,14.17,-14.17,.1,120);
scene.add(new T.HemisphereLight('#fff1da','#754331',2.2));
const sun=new T.DirectionalLight('#fff4dc',2.8);sun.position.set(-9,20,8);scene.add(sun);
const material=c=>new T.MeshToonMaterial({color:c});
const sand=material('#d99961'),terrace=material('#edb076'),wall=material('#b9764e'),floor=material('#9a674c'),white=material('#f4eee0'),shade=material('#cfc5b4'),grey=material('#999995'),dark=material('#454344'),yellow=material('#f2aa21');
function add(g,m,parent=scene){const o=new T.Mesh(g,m);
  if(m.isMeshToonMaterial&&['BoxGeometry','ConeGeometry','DodecahedronGeometry'].includes(g.type)){const outline=new T.LineSegments(new T.EdgesGeometry(g,35),new T.LineBasicMaterial({color:'#654a35',transparent:true,opacity:.55}));o.add(outline);}
  parent.add(o);return o;}
function box(w,h,d,m,x,y,z,p=scene){const o=add(new T.BoxGeometry(w,h,d),m,p);o.position.set(x,y,z);return o;}
function disk(r,m,x,y,z){const o=add(new T.CylinderGeometry(r,r,.06,40),m);o.position.set(x,y,z);return o;}
function ring(outer,inner,top,bottom,m,side,x=0,z=0){const slope=[],edge=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16,ox=x+outer*Math.cos(a),oz=z+outer*Math.sin(a),px=x+outer*Math.cos(b),pz=z+outer*Math.sin(b),ix=x+inner*Math.cos(a),iz=z+inner*Math.sin(a),jx=x+inner*Math.cos(b),jz=z+inner*Math.sin(b);slope.push(ox,top,oz,ix,bottom,iz,px,top,pz,px,top,pz,ix,bottom,iz,jx,bottom,jz);edge.push(ix,bottom,iz,jx,bottom,jz,ix,bottom-.17,iz,jx,bottom,jz,jx,bottom-.17,jz,ix,bottom-.17,iz);}for(const [v,mat] of [[slope,m],[edge,side]]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();add(g,mat);}}
const rnd=i=>{const n=Math.sin(i*127.1+78.2)*43758.5;return n-Math.floor(n);};
function rocks(x,z,blue=false,scale=1){const g=new T.Group();g.position.set(x,-1.15,z);scene.add(g);for(let i=0;i<4;i++){const h=(.55+rnd(i*25+x*4+z*8)*.7)*scale;const rock=add(new T.ConeGeometry((.35+rnd(i+x)*.17)*scale,h,5),blue?material(i%3?'#5487a3':'#b6e1ed'):(i%3?white:shade),g);rock.position.set((rnd(i*11+x)-.5)*.9,h/2,(rnd(i*7+z)-.5)*.9);rock.rotation.z=(rnd(i*4+x)-.5)*.25;}return g;}
// Terraced orange quarry, dense pale ore, paved processing yard and waterfront.
box(85,.4,70,sand,13,-1.6,0);const desert=add(new T.RingGeometry(7.2,65,64),sand);desert.rotation.x=-Math.PI/2;desert.position.y=.02;ring(7.2,6.25,.08,-.45,terrace,wall);ring(6.25,5.25,-.45,-1.17,sand,floor);disk(5.26,floor,0,-1.2,0);
const oreNodes=[];
for(let i=0;i<32;i++){const a=rnd(i+3)*6.283,r=Math.sqrt(rnd(i+331))*4.7,x=Math.cos(a)*r,z=Math.sin(a)*r;oreNodes.push({x,z,group:rocks(x,z,false,.65+rnd(i+130)*.3),left:3+i%3,max:3+i%3,rest:0});}
ring(3.1,2.35,.08,-1.05,wall,floor,-5.6,-10.8);disk(2.36,material('#55403b'),-5.6,-1.1,-10.8);
for(let i=0;i<15;i++){const a=rnd(i+81)*6.283,r=Math.sqrt(rnd(i+130))*2.1,x=-5.6+Math.cos(a)*r,z=-10.8+Math.sin(a)*r;oreNodes.push({x,z,group:rocks(x,z,true,.7),left:5,max:5,rest:0,blue:true});}
const ramp=box(3.4,.18,2.5,terrace,5.9,-.01,1);ramp.rotation.z=.08;
box(21,.14,21,grey,19,.15,0);
// Paved processing yard: drawn seams follow the existing ground plane.
for(let i=0;i<8;i++){box(21,.01,.025,shade,19,.23,-9+i*2.8);box(.025,.01,21,shade,9+i*2.8,.23,0);}
for(let i=0;i<9;i++){box(.25,1,.25,white,10+i*2.2,.75,-9.6);box(2.05,.12,.18,white,10+i*2.2,1.13,-9.6);}
const factory=new T.Group();factory.position.set(13,.25,-2);scene.add(factory);
box(3,1.35,2.3,material('#dbad6e'),0,.7,0,factory);box(3.2,.16,2.45,dark,0,1.46,0,factory);
for(let i=-1;i<=1;i++)box(.67,.47,.07,material('#a6c9bf'),i*.8,1.02,1.18,factory);
box(1.4,.36,.7,dark,0,.28,1.3,factory);for(let i=0;i<4;i++)box(.52,.22,.72,dark,-.8+i*.53,.32,2+i*.22,factory);
box(1.7,1.15,1.2,material('#c7b095'),17,.73,-2);box(1.9,.13,1.45,white,17,1.34,-2);
box(18,.08,38,material('#30a6d2'),35,.1,0);box(3,.28,8,material('#a67b55'),27,.34,2);
for(let i=0;i<8;i++)box(2.8,.02,.05,material('#d5a36f'),27,.5,-1.3+i*.95);
const boat=new T.Group();boat.position.set(30,.1,0);scene.add(boat);const hull=add(new T.CylinderGeometry(1.5,1.16,.64,8),white,boat);hull.scale.z=1.8;hull.position.y=.33;box(1.3,.7,1.1,dark,0,.93,-.2,boat);
for(let i=0;i<22;i++){const x=-11+rnd(i+18)*42,z=-19+rnd(i+73)*37;if(Math.hypot(x,z)<10||x>9&&x<29&&z>-10&&z<11)continue;const h=.7+rnd(i+81);const cactus=add(new T.CylinderGeometry(.12,.2,h,5),material('#67a368'));cactus.position.set(x,h/2,z);box(.6,.3,.52,wall,x+.7,.15,z+.3);}
for(let i=0;i<14;i++){const a=i*6.283/14,r=8+rnd(i+44)*1.8,x=Math.cos(a)*r,z=Math.sin(a)*r;box(.42+rnd(i+21)*.45,.28,.35,wall,x,.16,z);}
const route=material('#9aca6b');for(let i=0;i<6;i++){const arrow=add(new T.ConeGeometry(.25,.64,3),route);arrow.rotation.z=-Math.PI/2;arrow.position.set(7.2+i*.8,.28,1.3-i*.48);}

// Existing fan-art character is used as a transparent sprite in the 3D scene.
const character=new T.Group();scene.add(character);const portrait=new T.TextureLoader().load('jiajia-bonnet-20261021.webp');portrait.colorSpace=T.SRGBColorSpace;
const sprite=new T.Sprite(new T.SpriteMaterial({map:portrait,transparent:true,depthTest:false,depthWrite:false}));sprite.scale.set(1.8,2.2,1);sprite.position.y=1.65;sprite.renderOrder=10;character.add(sprite);
const backpack=new T.Group();backpack.position.set(.52,.88,-.4);character.add(backpack);
const pickaxe=new T.Group();pickaxe.position.set(.92,.82,.7);pickaxe.scale.setScalar(1.22);character.add(pickaxe);
const toolHandle=add(new T.BoxGeometry(.1,1,.1),new T.MeshBasicMaterial({color:'#8c5934',depthTest:false}),pickaxe);toolHandle.position.y=.46;toolHandle.renderOrder=11;
const toolHead=add(new T.BoxGeometry(.72,.13,.15),new T.MeshBasicMaterial({color:'#50545a',depthTest:false}),pickaxe);toolHead.position.set(0,.92,0);toolHead.renderOrder=11;pickaxe.visible=false;
const forklift=new T.Group();scene.add(forklift);
box(1.9,.58,1.45,yellow,0,.55,0,forklift);box(1.05,.16,.93,dark,-.28,.97,-.14,forklift);
for(const x of [-.75,.75])for(const z of [-.55,.55]){const w=add(new T.CylinderGeometry(.28,.28,.22,12),dark,forklift);w.rotation.z=Math.PI/2;w.position.set(x,.27,z);}
for(const x of [-.75,.44])box(.11,1.6,.11,dark,x,1.35,-.53,forklift);
box(1.35,.12,.84,dark,-.15,2.12,-.53,forklift);box(.13,1.1,.13,dark,1.1,.75,0,forklift);box(.13,.13,1.7,dark,1.12,.25,.4,forklift);
const cargoObjects=new T.Group();forklift.add(cargoObjects);

const storageKey='little-house-mine-v5';
const fresh=()=>({cash:0,bag:0,raw:0,goods:0,cargo:0,bagLv:0,pickLv:0,factoryLv:0,helpers:0,earned:0,x:0,z:5.7,vehicle:false,blueUnlocked:false});
let loaded;try{loaded=JSON.parse(localStorage.getItem(storageKey));}catch{}
let s=Object.assign(fresh(),loaded||{}),started=false,pointer=null,keys=new Set(),mineClock=0,processClock=0,helperClock=0,saveClock=0,toastUntil=0,last=0,lastBag=-1,lastCargo=-1,activeOre=null,miningMotion={phase:'idle',progress:0};
const chips=[];
let cameraState=cameraTargetFor(s.x,s.z),cameraFocus=new T.Vector3(cameraState.x,0,cameraState.z),cameraGoal=new T.Vector3();
if(s.cash||s.bag||s.raw||s.goods||s.cargo||s.earned){$('intro-card').querySelector('h2').textContent='继续经营小矿场';$('intro-card').querySelector('p').textContent='上次进度已保存在这台设备。点击继续，按画面右下角的目标行动。';$('start').textContent='继续经营';}
const bagMax=()=>12+s.bagLv*8,near=(x,z,d=2.6)=>Math.hypot(s.x-x,s.z-z)<d,costs=()=>({bag:25+25*s.bagLv,pick:30+35*s.pickLv,factory:40+45*s.factoryLv,helper:85+90*s.helpers});
const save=()=>localStorage.setItem(storageKey,JSON.stringify(s));
function announce(text){$('guide').textContent=text;toastUntil=performance.now()+2800;}
function updateUI(){$('cash').textContent=s.cash;$('bag').textContent=`${s.bag} / ${bagMax()}`;$('raw').textContent=s.raw;$('goods').textContent=s.goods;$('cargo').textContent=`${s.cargo} / ${bagMax()}`;$('vehicle').textContent=s.vehicle?'🚜 开车中 · 点我下车':'🚶 步行中 · 到叉车旁上车';const c=costs();for(const [id,name,n,price] of [['bag-upgrade','🎒 背包与车斗',s.bagLv,c.bag],['pick-upgrade','⛏️ 采矿速度',s.pickLv,c.pick],['factory-upgrade','⚙️ 加工速度',s.factoryLv,c.factory],['helper-upgrade','👷 雇采矿帮手',s.helpers,c.helper]]){const b=$(id);b.innerHTML=`<b>${name} · ${n}级</b><span>升级需要 <em>💵 ${price}</em></span>`;b.disabled=s.cash<price;}$('task-chip').textContent=s.vehicle?s.cargo?'④ 开到码头交货':s.goods||s.raw?'③ 回加工机装货':'⑤ 开回矿坑下车':s.bag?'② 到加工机卸矿':s.goods||s.raw?'③ 到黄色叉车上车':'① 靠近白色矿石';}
function upgrade(type){const price=costs()[type];if(s.cash<price)return;s.cash-=price;if(type==='bag')s.bagLv++;if(type==='pick')s.pickLv++;if(type==='factory')s.factoryLv++;if(type==='helper')s.helpers++;announce(type==='helper'?'帮手开始自动采矿啦！':'升级完成，继续经营吧！');updateUI();save();}
for(const type of ['bag','pick','factory','helper'])$(type+'-upgrade').onclick=()=>upgrade(type);
$('start').addEventListener('click',()=>{started=true;$('intro-card').hidden=true;joystick.refresh();});
$('help').addEventListener('click',()=>{started=false;joystick.reset();keys.clear();$('intro-card').querySelector('h2').textContent='你要做什么？';$('intro-card').querySelector('p').textContent='先按住画面，朝白色矿石方向拖动。之后跟着画面下方的“第几步”提示走。';$('start').textContent='知道了，继续玩';$('intro-card').hidden=false;});
$('reset').onclick=()=>{joystick.reset();keys.clear();$('reset-card').hidden=false;};
$('reset-cancel').onclick=()=>{$('reset-card').hidden=true;};
$('reset-confirm').onclick=()=>{$('reset-card').hidden=true;s=fresh();mineClock=processClock=helperClock=0;activeOre=null;miningMotion={phase:'idle',progress:0};cameraState=cameraTargetFor(s.x,s.z);cameraFocus.set(cameraState.x,0,cameraState.z);for(const node of oreNodes){node.left=node.max;node.rest=0;node.hit=0;node.group.rotation.y=0;node.group.scale.setScalar(1);node.group.visible=true;}$('intro-card').querySelector('h2').textContent='从一块矿石开始';$('intro-card').querySelector('p').textContent='按住画面拖动来走路。靠近一堆白色矿石就会自动采集，采完再找下一堆。';$('start').textContent='开始经营';save();updateUI();announce('矿场已重开，去白色矿石旁采矿吧。');};
$('vehicle').onclick=()=>{if(!started)return;if(s.vehicle){s.vehicle=false;announce('已下车，回矿坑继续采矿。');}else if(near(16,3.2,3.1)){s.vehicle=true;announce('开到加工机旁装货，再去水边交货。');}else announce('先走到灰色地面上的黄色叉车旁。');updateUI();save();};
const joystick=window.TouchJoystick.create({element:$('joystick'),thumb:$('stick'),analog:true,enabled:()=>started&&$('reset-card').hidden&&$('intro-card').hidden,onChange:v=>{pointer=v.direction?{dx:v.x*45,dy:v.y*45}:null;}});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase());}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function refreshObjects(){if(s.bag!==lastBag){backpack.clear();for(let i=0;i<Math.min(12,Math.ceil(s.bag/2));i++){const o=add(new T.DodecahedronGeometry(.21,0),white,backpack);o.position.set((i%2)*.27,Math.floor(i/2)*.25,0);}lastBag=s.bag;}if(s.cargo!==lastCargo){cargoObjects.clear();for(let i=0;i<Math.min(8,Math.ceil(s.cargo/2));i++)box(.43,.4,.43,shade,1.44,.42+Math.floor(i/2)*.43,(i%2)*.48-.25,cargoObjects);lastCargo=s.cargo;}}
function nearbyOre(){let best=null,distance=1.5;for(const node of oreNodes){if(node.rest||node.blue&&!s.blueUnlocked)continue;const d=Math.hypot(s.x-node.x,s.z-node.z);if(d<distance){best=node;distance=d;}}return best;}
function mine(node){const amount=Math.min(node.blue?2:1,bagMax()-s.bag);s.bag+=amount;node.left--;node.group.scale.setScalar(.5+.5*node.left/node.max);if(!node.left){node.group.visible=false;node.rest=12;}for(let i=0;i<3;i++){const chip=add(new T.DodecahedronGeometry(.09,0),new T.MeshBasicMaterial({color:node.blue?'#b6e1ed':'#fff5dd'}));chip.position.set(node.x+(i-1)*.13,-.42,node.z);chips.push({mesh:chip,life:.38,vx:(i-1)*.55,vy:1.15+i*.16,vz:(i%2?-.45:.45)});}const pop=$('ore-pop');pop.textContent=node.blue?`蓝矿 +${amount}`:'矿石 +1';pop.classList.remove('show');void pop.offsetWidth;pop.classList.add('show');updateUI();}
function tick(dt){let dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),dz=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);if(pointer){dx+=pointer.dx/45;dz+=pointer.dy/45;}const n=Math.hypot(dx,dz);if(n>.13){const speed=s.vehicle?9:6.8;s.x=Math.max(-8,Math.min(28,s.x+dx/Math.max(1,n)*speed*dt));s.z=Math.max(-13,Math.min(10,s.z+dz/Math.max(1,n)*speed*dt));}
  for(let i=chips.length-1;i>=0;i--){const chip=chips[i];chip.life-=dt;chip.mesh.position.x+=chip.vx*dt;chip.mesh.position.y+=chip.vy*dt;chip.mesh.position.z+=chip.vz*dt;chip.vy-=4.2*dt;if(chip.life<=0){scene.remove(chip.mesh);chip.mesh.geometry.dispose();chip.mesh.material.dispose();chips.splice(i,1);}}
  for(const node of oreNodes){if(node.rest){node.rest=Math.max(0,node.rest-dt);if(!node.rest){node.left=node.max;node.group.scale.setScalar(1);node.group.visible=true;}}if(node.hit){node.hit=Math.max(0,node.hit-dt);node.group.rotation.y=Math.sin(node.hit*90)*.18;if(!node.hit)node.group.rotation.y=0;}}
  activeOre=!s.vehicle&&s.bag<bagMax()?nearbyOre():null;if(activeOre){const cycle=advanceMiningCycle(mineClock,dt,Math.max(.32,.82-.1*s.pickLv));mineClock=cycle.clock;miningMotion=cycle;if(cycle.hits){activeOre.hit=.18;mine(activeOre);}}else{mineClock=0;miningMotion={phase:'idle',progress:0};}
  if(!s.vehicle&&near(13,-2)&&s.bag){s.raw+=s.bag;s.bag=0;announce('矿石送进加工机！去叉车旁准备运货。');updateUI();}
  if(s.raw&&s.goods<40){processClock+=dt;if(processClock>=Math.max(.25,1.35-.18*s.factoryLv)){processClock=0;s.raw--;s.goods++;updateUI();}}
  if(s.helpers){helperClock+=dt;if(helperClock>=Math.max(.5,3.6/(s.helpers+.5))){helperClock=0;s.raw+=s.helpers;updateUI();}}
  if(s.vehicle&&near(13,-2,2.9)&&s.goods&&s.cargo<bagMax()){const amount=Math.min(s.goods,bagMax()-s.cargo);s.goods-=amount;s.cargo+=amount;announce(`叉车装上 ${amount} 件成品，送到右边码头。`);updateUI();}
  if(s.vehicle&&near(27,2,3.3)&&s.cargo){const money=s.cargo*4;s.cash+=money;s.earned+=money;s.cargo=0;if(s.earned>=120)s.blueUnlocked=true;announce(`交货获得 💵 ${money}！${s.blueUnlocked?'蓝矿坑已解锁，每次可采 2 块。':'继续升级矿场吧。'}`);updateUI();save();}
  refreshObjects();if(performance.now()>toastUntil){const msg=s.vehicle?(s.cargo?'沿灰色地面向右开，到水边码头交货。':s.goods?'回到加工机旁装成品。':s.raw?'机器还在加工，开回加工机等一会儿。':'开回矿坑，点“下车”再采矿。'):(s.bag>=bagMax()?'背包装满了，往右走到灰色加工区卸货。':s.bag?'继续找矿石，或往右走去加工机卸货。':s.goods||s.raw?'到黄色叉车旁点“上车”，再返回加工机装货。':activeOre?'采矿中：这一堆采完后，走向旁边的矿石。':'走近一堆白色矿石，靠近后自动采集。');if($('guide').textContent!==msg)$('guide').textContent=msg;}
  saveClock+=dt;if(saveClock>2){saveClock=0;save();}}
function frame(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(started)tick(dt);character.visible=!s.vehicle;character.position.set(s.x,Math.hypot(s.x,s.z)<5.28?-1.08:.23,s.z);sprite.position.y=1.65;forklift.position.set(s.vehicle?s.x:16,.23,s.vehicle?s.z:3.2);
  pickaxe.visible=started&&!s.vehicle&&!!activeOre;if(pickaxe.visible){const swing=Math.min(miningMotion.progress/.86,1);pickaxe.rotation.z=-1.05+swing*1.75;sprite.material.rotation=-Math.sin(swing*Math.PI)*.045;}else sprite.material.rotation=0;
  cameraState=cameraTargetFor(s.x,s.z,cameraState.zone);cameraGoal.set(cameraState.x,0,cameraState.z);cameraFocus.lerp(cameraGoal,1-Math.exp(-8*dt));if(cameraFocus.distanceTo(cameraGoal)<.015)cameraFocus.copy(cameraGoal);camera.position.set(cameraFocus.x,24,cameraFocus.z+19);camera.lookAt(cameraFocus.x,0,cameraFocus.z);
  const mission=missionFor(s,bagMax());$('task-chip').textContent=mission.chip;if(performance.now()>toastUntil){const msg=`第${mission.step}步｜${mission.title}\n${mission.detail}`;if($('guide').textContent!==msg)$('guide').textContent=msg;}
  const goal=s.vehicle?(s.cargo?{x:27,z:2}:s.goods||s.raw?{x:13,z:-2}:{x:0,z:0}):(s.bag?{x:13,z:-2}:s.goods||s.raw?{x:16,z:3.2}:{x:0,z:0});$('arrow').style.transform=`rotate(${Math.atan2(goal.z-s.z,goal.x-s.x)*180/Math.PI+45}deg)`;
  renderer.render(scene,camera);requestAnimationFrame(frame);}
updateUI();refreshObjects();requestAnimationFrame(frame);

function clearMovement(){pointer=null;keys.clear();joystick.reset();}
window.addEventListener('blur',clearMovement);window.addEventListener('orientationchange',clearMovement);document.addEventListener('visibilitychange',clearMovement);document.addEventListener('mobile-screen-drawer',clearMovement);

function fitMineView(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);const aspect=r.width/r.height,halfHeight=aspect<1?8.5/aspect:8.5;camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();}
new ResizeObserver(fitMineView).observe(canvas.parentElement);window.addEventListener('resize',fitMineView);fitMineView();
