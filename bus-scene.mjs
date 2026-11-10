import * as THREE from './three.module.min.js';
import {GLTFLoader} from './vendor/hole/GLTFLoader.js';

export async function createScene(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#d6e5dc');scene.fog=new THREE.Fog('#d6e5dc',30,65);
 const camera=new THREE.OrthographicCamera(-5,5,6,-6,.1,90);camera.position.set(-10,10,14);camera.lookAt(0,.65,1.1);
 scene.add(new THREE.HemisphereLight('#fffaf0','#a3b1a0',2.6));
 const sun=new THREE.DirectionalLight('#fff4dc',2.7);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:60});sun.shadow.normalBias=.035;scene.add(sun);
 const resources=new Set(),materials=new Map();
 function material(color,options={}){const key=color+JSON.stringify(options);if(!materials.has(key)){const m=new THREE.MeshStandardMaterial({color,roughness:.85,...options});materials.set(key,m);resources.add(m);}return materials.get(key);}
 function mesh(geometry,mat,parent,x=0,y=0,z=0){resources.add(geometry);const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(parent,w,h,d,color,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),material(color),parent,x,y,z);}
 function label(text,w=512,h=64,bg='#fff6d8',fg='#234f45'){
  const surface=document.createElement('canvas');surface.width=w;surface.height=h;const c=surface.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.font=`bold ${h*.51}px Microsoft YaHei,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2);
  const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;resources.add(texture);const m=new THREE.MeshStandardMaterial({map:texture,roughness:1});resources.add(m);return m;
 }
 box(scene,80,.1,50,'#d4ceb9',0,-.15,2);
 box(scene,58,.12,7.1,'#788681',0,-.07,-.55);
 box(scene,58,.16,.28,'#f4edda',0,-.025,3.02);
 box(scene,58,.12,7,'#e0d5bd',0,-.07,6.6);
 box(scene,58,.12,1.0,'#d6dac7',0,-.07,-4.6);
 for(let x=-26;x<=26;x+=2.2){box(scene,1.1,.015,.07,'#e4ba55',x,.005,2.55);box(scene,1.1,.015,.07,'#f6f3e5',x,.005,-2.05);}
 for(let x=-24;x<=24;x+=3){box(scene,.018,.01,6.6,'#cabfa9',x,.005,6.6);}
 for(const z of [4.5,6.5,8.5])box(scene,54,.01,.018,'#cabfa9',0,.005,z);

 // A reference-shaped bus built from native geometry; no third-party bus artwork.
 const bus=new THREE.Group();scene.add(bus);
 function roundedBox(parent,w,h,d,color,x,y,z,r=.1){
  const s=new THREE.Shape(),a=-w/2,b=-h/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
  const geo=new THREE.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.035,bevelThickness:.035});geo.translate(0,0,-d/2);return mesh(geo,material(color),parent,x,y,z);
 }
 roundedBox(bus,6.8,1.0,2.14,'#e9bc4f',0,1.02,0,.16);
 roundedBox(bus,6.74,1.34,2.13,'#f9f2dc',0,2.12,0,.12);
 roundedBox(bus,7.0,.17,2.36,'#fff8e4',0,2.86,0,.08);
 box(bus,6.87,.12,2.22,'#5c6c63',0,.58,0);
 const glass=material('#78a5a3',{roughness:.25,metalness:.08});
 for(const side of [-1,1]){
  for(const x of [-2.72,-1.68,-.64,.4,1.44]){
   box(bus,.91,.96,.035,'#485b56',x,2.10,side*1.085);
   mesh(new THREE.BoxGeometry(.78,.83,.035),glass,bus,x,2.12,side*1.11);
   box(bus,.025,.83,.02,'#b4c8bd',x-.2,2.12,side*1.14);
  }
  box(bus,5.7,.04,.035,'#f7e9b0',-.35,1.42,side*1.105);
 }
 box(bus,.04,.97,1.82,'#415a55',3.4,2.09,0);mesh(new THREE.BoxGeometry(.025,.83,1.68),glass,bus,3.43,2.1,0);
 box(bus,.02,.9,.06,'#d6dbc7',3.45,2.1,0);
 for(const z of [-.76,.76]){box(bus,.08,.18,.35,'#fff5bd',3.45,1.08,z);box(bus,.08,.18,.23,'#d0754c',-3.45,.99,z);}
 for(const x of [-2.27,2.25])for(const z of [-1.13,1.13]){
  const tire=mesh(new THREE.CylinderGeometry(.48,.48,.23,22),material('#34413f'),bus,x,.49,z);tire.rotation.x=Math.PI/2;
  const rim=mesh(new THREE.CylinderGeometry(.26,.26,.242,18),material('#aab5ab',{metalness:.25}),bus,x,.49,z);rim.rotation.x=Math.PI/2;
  const hub=mesh(new THREE.CylinderGeometry(.1,.1,.25,12),material('#63766d'),bus,x,.49,z);hub.rotation.x=Math.PI/2;
 }
 const doorX=2.5;box(bus,1.04,1.95,.045,'#253f38',doorX,1.55,1.12);
 const doors=[];for(const side of [-1,1]){
  const hinge=new THREE.Group();hinge.position.set(doorX+side*.5,1.55,1.17);bus.add(hinge);
  box(hinge,.5,1.87,.045,'#f0c35d',-side*.25,0,0);
  mesh(new THREE.BoxGeometry(.37,1.1,.06),glass,hinge,-side*.25,.27,.025);
  box(hinge,.035,.35,.07,'#33564a',-side*.43,-.05,.05);doors.push({hinge,side});
 }
 box(bus,1.1,.12,.42,'#b7bca9',doorX,.55,1.2);
 mesh(new THREE.PlaneGeometry(2.95,.24),label('小屋线  ·  比邻岛'),bus,-.4,2.72,1.12);
 for(const x of [-.8,.8]){const vent=mesh(new THREE.CylinderGeometry(.17,.17,.04,16),material('#7b8980'),bus,x,2.98,0);vent.castShadow=false;}
 const mirror=box(bus,.11,.3,.36,'#405a50',3.04,2.04,1.5);mirror.rotation.z=-.08;box(bus,.46,.045,.04,'#405a50',3.0,2.22,1.32);
 const stop=new THREE.Group();stop.position.set(4.2,0,3.55);scene.add(stop);
 mesh(new THREE.CylinderGeometry(.045,.065,2.6,8),material('#477064'),stop,0,1.3,0);
 box(stop,.72,1.02,.09,'#315d4f',0,2.44,0);mesh(new THREE.PlaneGeometry(.62,.9),label('小屋站',192,256,'#fff5dc','#315d4f'),stop,0,2.44,.052);
 box(stop,1.45,.12,.42,'#d2b48a',1.45,.55,0);for(const x of [1.0,1.9])box(stop,.07,.55,.33,'#637466',x,.275,0);

 const runnerPivot=new THREE.Group();scene.add(runnerPivot);
 const loader=new GLTFLoader(),cityLoader=new GLTFLoader().setResourcePath('assets/hole/city-kit-suburban/');
 let runner,mixer,idle,walk,width=0,height=0,previous=null,lostTime=0,wonTime=0,disposed=false;
 function normalize(root,targetHeight){root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());const s=targetHeight/size.y;root.scale.multiplyScalar(s);root.position.set(-center.x*s,-bounds.min.y*s,-center.z*s);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;}
 function dispose(){if(disposed)return;disposed=true;const seen=new Set();scene.traverse(o=>{if(o.geometry)seen.add(o.geometry);for(const m of [].concat(o.material||[])){if(m.map)seen.add(m.map);seen.add(m);}});for(const x of resources)seen.add(x);seen.forEach(x=>x.dispose?.());renderer.dispose();}
 try{
  const [person,houseA,houseB,tree]=await Promise.all([
   loader.loadAsync('assets/bus/runner.glb'),cityLoader.loadAsync('assets/hole/building-type-a.glb'),cityLoader.loadAsync('assets/hole/building-type-b.glb'),cityLoader.loadAsync('assets/hole/tree-small.glb')
  ]);
  runner=normalize(person.scene,1.82);runner.rotation.y=Math.PI/2;runnerPivot.add(runner);
  mixer=new THREE.AnimationMixer(runner);idle=mixer.clipAction(THREE.AnimationClip.findByName(person.animations,'idle'));walk=mixer.clipAction(THREE.AnimationClip.findByName(person.animations,'walk'));idle.play();walk.play();walk.setEffectiveWeight(0);
  for(const [asset,x,h] of [[houseA,-8,5.4],[houseB,-2,5.0],[houseA,5.2,6.2],[houseB,12,4.8]]){const building=normalize(asset.scene.clone(true),h);const group=new THREE.Group();group.add(building);group.position.set(x,0,-6.3);scene.add(group);}
  for(const x of [-12,-5,3,9]){const plant=normalize(tree.scene.clone(true),3.5);plant.position.x+=x;plant.position.z-=4.25;scene.add(plant);}
  const backpack=box(runnerPivot,.22,.49,.39,'#386c68',-.19,1.06,0);backpack.rotation.z=-.1;
  box(runnerPivot,.25,.09,.25,'#5f9790',-.23,1.33,0);
 }catch(error){dispose();throw error;}
 function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h||width===w&&height===h)return;width=w;height=h;renderer.setSize(w,h,false);
  const aspect=w/h,spanX=aspect>1.25?12:9.4,spanY=spanX/aspect;camera.left=-spanX/2;camera.right=spanX/2;camera.top=spanY/2;camera.bottom=-spanY/2;camera.updateProjectionMatrix();
 }
 function render(g,dt=0){
  if(disposed)return;resize();
  const changed=previous!==g;if(changed){previous=g;lostTime=wonTime=0;runnerPivot.position.set(doorX-g.distance,0,2.05);}
  const target=doorX-g.distance,moving=Math.abs(runnerPivot.position.x-target)>.018;
  runnerPivot.position.x=THREE.MathUtils.lerp(runnerPivot.position.x,target,1-Math.exp(-15*dt));
  runnerPivot.position.z=2.05;runnerPivot.position.y=0;runnerPivot.rotation.z=0;runnerPivot.visible=g.status!=='won';
  if(g.stumble>0)runnerPivot.rotation.z=Math.sin((.65-g.stumble)/.65*Math.PI)*.7;
  if(g.status==='boarding'){const progress=1-g.boarding/.7;runnerPivot.position.z=2.05-progress*1.15;runnerPivot.position.y=Math.sin(progress*Math.PI)*.28;}
  const walking=!g.paused&&(moving||g.status==='boarding')&&g.stumble<=0;
  idle.setEffectiveWeight(walking?0:1);walk.setEffectiveWeight(walking?1:0);if(!g.paused)mixer.update(dt*(walking?1.8:1));
  if(!g.paused){if(g.status==='lost')lostTime+=dt;if(g.status==='won')wonTime+=dt;}
  bus.position.x=g.status==='lost'?Math.min(11,lostTime*3):g.status==='won'?Math.min(8,wonTime*2.5):0;
  const open=['lost','won'].includes(g.status)?0:g.status==='boarding'?1:Math.min(1,g.remaining/1.5);
  for(const {hinge,side} of doors)hinge.rotation.y=-side*open*1.25;
  renderer.render(scene,camera);
 }
 return {render,dispose};
}
