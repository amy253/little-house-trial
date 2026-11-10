import * as THREE from './three.module.min.js';

const Core=window.BuliHop,$=id=>document.getElementById(id),stage=$('stage'),canvas=$('scene');
const island=window.IslandRevive?.create({id:'buli-hop'});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let game=Core.create(),best=0,seen=0,elapsed=0,last=performance.now(),feedbackUntil=0,landingPulse=0,renderReady=false;
try{best=Math.max(0,Number(localStorage.getItem('buli-hop-best'))||0);}catch{}
$('best').textContent=best;
const sound=window.BuliHopSound.create({onError:()=>{$('audio-error').hidden=false;}});
const input=window.BuliHopInput.create({getGame:()=>game,sound});
const scene=new THREE.Scene();scene.background=new THREE.Color('#fff4dd');
const camera=new THREE.OrthographicCamera(-195,195,195,-195,.1,2500);
const focus=new THREE.Vector3(90,35,0),desired=new THREE.Vector3();
let renderer;
try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor('#fff4dd');renderReady=true;
}catch{$('render-error').hidden=false;}
scene.add(new THREE.HemisphereLight(0xffffff,0x8f9faa,2.3));
const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-320;sun.shadow.camera.right=320;sun.shadow.camera.top=320;sun.shadow.camera.bottom=-320;sun.shadow.camera.near=1;sun.shadow.camera.far=1200;sun.shadow.bias=-.001;sun.shadow.normalBias=.4;sun.shadow.radius=4;scene.add(sun,sun.target);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshBasicMaterial({color:'#fff4dd'}));ground.rotation.x=-Math.PI/2;scene.add(ground);
const groundShadow=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.ShadowMaterial({color:'#334856',opacity:.22}));groundShadow.rotation.x=-Math.PI/2;groundShadow.receiveShadow=true;scene.add(groundShadow);
const blocks=new Map();
function material(color){return new THREE.MeshToonMaterial({color});}
function mesh(group,geo,color,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geo,25),new THREE.LineBasicMaterial({color:'#735243',transparent:true,opacity:.7}));m.add(outline);return m;}
function box(group,w,h,d,color,x=0,y=0,z=0){return mesh(group,new THREE.BoxGeometry(w,h,d),color,x,y,z);}
function disk(group,r,h,color,y,x=0,z=0){return mesh(group,new THREE.CylinderGeometry(r,r,h,48),color,x,y,z);}
function ring(group,r,color,y){const m=mesh(group,new THREE.TorusGeometry(r,.55,6,48),color,0,y,0);m.rotation.x=Math.PI/2;return m;}
function makeBlock(p){
 const g=new THREE.Group(),s=p.size;g.position.set(p.x,0,p.z);g.userData.platform=p;g.userData.rotor=null;
 const colors={plain:'#e5a184',parcel:'#f2be8d',cube:'#ad97c2',shop:'#fff0d4',music:'#85b7bb',round:'#a6c992',drain:'#89bfbd'};
 if(p.kind==='round'||p.kind==='drain')disk(g,s/2,40,colors[p.kind],20);else box(g,s,40,s,colors[p.kind],0,20);
 if(p.kind==='round'){disk(g,s/2-2,1,'#b6d2b6',40.5);ring(g,7,'#f0f5e7',41.3);}
 else if(p.kind==='drain'){disk(g,s/2-2,1,'#52747c',40.5);ring(g,s*.31,'#94aeb2',41.3);ring(g,s*.18,'#94aeb2',41.3);for(let i=-1;i<=1;i++)box(g,2,1,s*.42,'#294c59',i*8,41.5);}
 else if(p.kind==='parcel'){box(g,s*.16,.8,s,'#e9d4ab',0,40.5);box(g,s,.9,s*.16,'#e9d4ab',0,40.6);box(g,s*.16,40.5,.6,'#e9d4ab',0,20,s/2+.4);}
 else if(p.kind==='cube'){
  const cap=new THREE.Group();g.add(cap);g.userData.rotor=cap;const palette=['#dc7664','#efe2a0','#7ea9bb','#afd0a6','#efe2a0','#dc7664','#7ea9bb','#dc7664','#afd0a6'];
  for(let i=0;i<9;i++){const x=(i%3-1)*s/3,z=(Math.floor(i/3)-1)*s/3;box(cap,s/3-3,1.2,s/3-3,palette[i],x,40.7,z);box(g,s/3-3,10,.8,palette[i],x,6+Math.floor(i/3)*13,s/2+.4);}
 }else if(p.kind==='shop'){
  for(let i=0;i<6;i++)box(g,s/6,.8,s,i%2?'#fff4df':'#d97168',-s/2+s/12+i*s/6,40.6);
  box(g,s*.34,27,1,'#566e76',-s*.12,15,s/2+.8);box(g,s*.2,15,1,'#b3c9cd',s*.29,25,s/2+.9);
  const door=box(g,s*.28,26,1.2,'#bd7968',-s*.12,15,s/2+2);g.userData.door=door;
 }else if(p.kind==='music'){
  const cap=new THREE.Group();g.add(cap);g.userData.rotor=cap;disk(cap,s*.4,1,'#202d38',40.8);ring(cap,s*.31,'#465565',41.5);ring(cap,s*.24,'#465565',41.5);disk(cap,s*.095,1.3,'#dd9d7c',41.5);box(g,2,1.5,s*.25,'#d6ddd7',s*.32,42,-s*.15);
 }else{box(g,s,.8,s,'#ffd6b3',0,40.5);ring(g,5,'#85919a',41.5);}
 scene.add(g);blocks.set(p.id,g);return g;
}
function disposeGroup(group){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});}
function syncBlocks(){for(const p of game.platforms)if(!blocks.has(p.id))makeBlock(p);const ids=new Set(game.platforms.map(p=>p.id));for(const [id,b]of blocks)if(!ids.has(id)){disposeGroup(b);blocks.delete(id);}}
syncBlocks();
const catMaterial=new THREE.SpriteMaterial({transparent:true,depthWrite:false,alphaTest:.025});
const cat=new THREE.Sprite(catMaterial);cat.center.set(.55,.0215);cat.scale.set(48,72,1);cat.visible=false;scene.add(cat);
new THREE.TextureLoader().load('buli-hop-standing.png',texture=>{if(window.GameArt?.spriteUrl('cat')){texture.dispose();comicCat();return;}texture.colorSpace=THREE.SRGBColorSpace;catMaterial.map=texture;catMaterial.needsUpdate=true;cat.visible=true;},undefined,()=>{$('render-error').textContent='卟哩图片没加载好，请刷新再试。';$('render-error').hidden=false;});
const shadow=new THREE.Mesh(new THREE.CircleGeometry(14,32),new THREE.MeshBasicMaterial({color:'#263640',transparent:true,opacity:.23,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,.6,1);scene.add(shadow);
const halo=new THREE.Mesh(new THREE.RingGeometry(7,9,48),new THREE.MeshBasicMaterial({color:'#f3f8dd',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;scene.add(halo);
function comicCat(){const url=window.GameArt?.spriteUrl('cat');if(!url)return;new THREE.TextureLoader().load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const previous=catMaterial.map;catMaterial.map=texture;catMaterial.needsUpdate=true;cat.visible=true;previous?.dispose();});}
document.addEventListener('game-art-ready',comicCat);comicCat();
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight,worldWidth=w<500?330:390;camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=worldWidth*h/w/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
new ResizeObserver(resize).observe(stage);resize();
function message(text){$('feedback').textContent=text;$('feedback').classList.remove('show');void $('feedback').offsetWidth;$('feedback').classList.add('show');feedbackUntil=elapsed+1.2;}
function saveBest(){if(game.score<=best)return;best=game.score;$('best').textContent=best;try{localStorage.setItem('buli-hop-best',String(best));}catch{}}
function handleEvent(){
 if(seen===game.event)return;seen=game.event;const e=game.lastEvent;if(!e)return;
 if(e.kind==='jump'){$('first-hint').hidden=true;}
 if(e.kind==='center'||e.kind==='land'){syncBlocks();landingPulse=.25;sound.chime(e.kind==='center');saveBest();$('score').textContent=game.score;message(e.kind==='center'?`中心！+${e.points}`:`+${e.points}`);halo.position.set(game.cat.x,41.5,game.cat.z);}
 if(e.kind==='stay')message('还在原平台，再稍微按久一点');
 if(e.kind==='bonus'){saveBest();$('score').textContent=game.score;sound.chime(true);const names={drain:'井盖',cube:'魔方',shop:'小店',music:'唱片'};message(`${names[game.current.kind]}奖励 +${e.points}`);}
 if(e.kind==='lost'){input.cancel();$('overlay').hidden=false;$('resume').hidden=true;$('result-label').textContent='这次跳了';$('result-score').textContent=game.score;$('result-title').textContent=game.score===best&&best>0?'新的最好成绩！':'再跳一次？';$('result-text').textContent='按住蓄力，松开就跳。每次只差一点点手感。';$('restart').textContent='再来一局';$('restart').focus();const failed=game;island?.offer($('overlay').querySelector?.('.result')||$('overlay'),()=>{if(game!==failed||!Core.revive(game))return false;input.cancel();seen=game.event;landingPulse=0;feedbackUntil=0;last=performance.now();$('overlay').hidden=true;island?.hide();syncBlocks();canvas.focus({preventScroll:true});return true;},()=>game===failed&&game.phase==='lost');}
}
function pause(){if(game.phase==='lost'||!renderReady)return;input.cancel();Core.setPaused(game,true);$('overlay').hidden=false;$('resume').hidden=false;$('result-label').textContent='当前得分';$('result-score').textContent=game.score;$('result-title').textContent='休息一下';$('result-text').textContent='继续后，从刚才的位置接着跳。';$('restart').textContent='重新开始';$('resume').focus();}
function resume(){Core.setPaused(game,false);last=performance.now();$('overlay').hidden=true;canvas.focus({preventScroll:true});}
function restart(){input.cancel();island?.reset();for(const b of blocks.values())disposeGroup(b);blocks.clear();game=Core.create();seen=0;landingPulse=0;focus.set(90,35,0);syncBlocks();$('score').textContent='0';$('overlay').hidden=true;$('first-hint').hidden=false;$('feedback').classList.remove('show');last=performance.now();canvas.focus({preventScroll:true});}
$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('restart').addEventListener('click',restart);
let muted=false;$('sound').addEventListener('click',()=>{muted=!muted;sound.setMuted(muted);$('sound').textContent=muted?'声音关':'声音开';$('sound').setAttribute('aria-pressed',String(muted));$('sound').setAttribute('aria-label',muted?'打开声音':'关闭声音');});
canvas.addEventListener('pointerdown',e=>{if(!renderReady||!cat.visible||e.button!==0||e.isPrimary===false)return;e.preventDefault();canvas.focus({preventScroll:true});if(input.press(`pointer:${e.pointerId}`)){canvas.setPointerCapture(e.pointerId);$('first-hint').hidden=true;}});
canvas.addEventListener('pointerup',e=>{e.preventDefault();input.release(`pointer:${e.pointerId}`);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);handleEvent();});
canvas.addEventListener('pointercancel',e=>input.cancel(`pointer:${e.pointerId}`));canvas.addEventListener('lostpointercapture',e=>input.cancel(`pointer:${e.pointerId}`));canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(e.code==='Escape'){if(game.paused)resume();else pause();return;}if(!window.BuliHopInput.isGameKey(e)||!renderReady||!cat.visible)return;e.preventDefault();if(!e.repeat&&input.press('space'))$('first-hint').hidden=true;});
document.addEventListener('keyup',e=>{if(e.code==='Space'&&input.release('space')){e.preventDefault();handleEvent();}});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();input.cancel();Core.setPaused(game,true);renderReady=false;$('render-error').hidden=false;});
canvas.addEventListener('webglcontextrestored',()=>location.reload());
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!renderReady)return;
 if(!game.paused){elapsed+=dt;Core.update(game,dt);handleEvent();landingPulse=Math.max(0,landingPulse-dt);}
 const charging=game.phase==='charging',compression=charging?1-Math.min(.27,game.charge*.2):1;
 for(const [id,b]of blocks){const p=b.userData.platform;b.scale.y=id===game.current.id?compression:1;
  if(b.userData.rotor&&p.bonusClaimed&&!game.paused&&!reduced.matches)b.userData.rotor.rotation.y+=dt*(p.kind==='music'?2.8:1);
  if(b.userData.door&&p.bonusClaimed)b.userData.door.rotation.y=-.75;
 }
 cat.position.set(game.cat.x,game.cat.y-(charging?40*(1-compression):0),game.cat.z);
 const squash=charging?1-Math.min(.33,game.charge*.22):1-(landingPulse>0?Math.sin(landingPulse/.25*Math.PI)*.16:0);
 cat.scale.set(48*(1+(1-squash)*.3),72*squash,1);
 catMaterial.rotation=game.phase==='jumping'&&!reduced.matches?Math.sin(game.flight.t/Core.FLIGHT_TIME*Math.PI)*.12:game.phase==='falling'?.6*Math.min(1,game.fall/.4):0;
 cat.visible=!!catMaterial.map&&game.phase!=='lost';
 const support=Core.contains(game.current,game.cat)?game.current:Core.contains(game.next,game.cat)?game.next:null;
 shadow.position.set(game.cat.x,support?(support.id===game.current.id?40*compression:40)+1:1,game.cat.z);shadow.material.opacity=game.phase==='lost'?0:.22*Math.max(.2,1-(game.cat.y-40)/180);shadow.scale.set(1+(game.cat.y-40)/200,.6+(game.cat.y-40)/300,1);
 if(landingPulse>0&&!reduced.matches){halo.visible=true;halo.scale.setScalar(1+(.25-landingPulse)*12);halo.material.opacity=landingPulse*2;}else halo.visible=false;
 if(!game.paused&&feedbackUntil<elapsed)$('feedback').classList.remove('show');
 sound.update(game.charge);
 desired.set((game.current.x+game.next.x)/2,35,(game.current.z+game.next.z)/2);if(game.phase!=='falling'&&game.phase!=='lost')focus.lerp(desired,reduced.matches?1:1-Math.exp(-dt*5));
 camera.position.set(focus.x-330,focus.y+380,focus.z+330);camera.lookAt(focus);ground.position.set(focus.x,0,focus.z);groundShadow.position.set(focus.x,.1,focus.z);sun.position.set(focus.x-140,360,focus.z+220);sun.target.position.set(focus.x,0,focus.z);renderer.render(scene,camera);
 stage.dataset.phase=game.paused?'paused':game.phase;stage.dataset.jumps=game.jumps;stage.dataset.platform=game.current.kind;stage.dataset.platforms=blocks.size;
}
requestAnimationFrame(animate);
