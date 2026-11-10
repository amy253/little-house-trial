import * as THREE from './three.module.min.js';
import {GLTFLoader} from './vendor/hole/GLTFLoader.js';

const ASSETS=['building-type-a','building-type-b','building-type-d','building-type-g','tree-small','tree-large','planter','construction-cone','dumpster','light-square','road-straight','road-crossroad','box','sedan','taxi','truck'];

export async function createScene(canvas,onProgress=()=>{}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#b7d5c4');scene.fog=new THREE.Fog('#b7d5c4',62,100);
 const camera=new THREE.OrthographicCamera(-12,12,20,-20,.1,130);let aspect=1,span=25;
 const ambient=new THREE.HemisphereLight('#ffffff','#7b9273',2.3);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#fff5de',3.2);sun.position.set(-18,35,22);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;sun.shadow.camera.near=.5;sun.shadow.camera.far=100;sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;scene.add(sun,sun.target);
 const holePosition={value:new THREE.Vector2()},holeRadius={value:.62};
 function cutMaterial(original){const m=original.clone();m.onBeforeCompile=shader=>{
  shader.uniforms.holePosition=holePosition;shader.uniforms.holeRadius=holeRadius;
  shader.vertexShader='varying vec3 vHoleWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvHoleWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader='uniform vec2 holePosition;uniform float holeRadius;varying vec3 vHoleWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(distance(vHoleWorld.xz,holePosition)<holeRadius)discard;');
 };m.customProgramCacheKey=()=> 'hole-ground-v1';return m;}
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(70,70),cutMaterial(new THREE.MeshStandardMaterial({color:'#a9c6a0',roughness:1})));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const roadGroup=new THREE.Group(),objectGroup=new THREE.Group();scene.add(roadGroup,objectGroup);
 const hole=new THREE.Group();scene.add(hole);
 const inside=new THREE.Mesh(new THREE.CylinderGeometry(1,1,4,64,1,true),new THREE.MeshBasicMaterial({color:'#171021',side:THREE.BackSide}));inside.position.y=-2;hole.add(inside);
 const bottom=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({color:'#090713'}));bottom.rotation.x=-Math.PI/2;bottom.position.y=-3.99;hole.add(bottom);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.025,8,64),new THREE.MeshStandardMaterial({color:'#ec69a6',roughness:.48,metalness:.05}));rim.rotation.x=Math.PI/2;rim.position.y=.12;hole.add(rim);
 const templates=new Map(),objects=new Map(),falling=new Map();let done=0,disposed=false,trackedGame=null,resourceFailed=false;
 const manager=new THREE.LoadingManager();manager.onError=()=>{resourceFailed=true;};
 const loaders=Object.fromEntries(['city-kit-suburban','city-kit-roads','car-kit'].map(pack=>[pack,new GLTFLoader(manager).setResourcePath('assets/hole/'+pack+'/')]));
 const suburban=new Set(ASSETS.slice(0,7)),roads=new Set(ASSETS.slice(7,12));
 try{await Promise.all(ASSETS.map(async name=>{const loader=loaders[suburban.has(name)?'city-kit-suburban':roads.has(name)?'city-kit-roads':'car-kit'];const gltf=await loader.loadAsync('assets/hole/'+name+'.glb'),root=gltf.scene;root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  root.position.x-=center.x;root.position.z-=center.z;root.position.y-=bounds.min.y;
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  templates.set(name,{root,size});onProgress(++done,ASSETS.length);
 }));if(resourceFailed)throw new Error('City texture did not load');}catch(error){renderer.dispose();throw error;}
 function road(name,x,z,rotation=0){const t=templates.get(name),mesh=t.root.clone(true),scale=6/Math.max(t.size.x,t.size.z);mesh.scale.setScalar(scale);mesh.position.set(x,.005,z);mesh.rotation.y=rotation;mesh.traverse(o=>{if(o.isMesh){o.castShadow=false;o.material=Array.isArray(o.material)?o.material.map(cutMaterial):cutMaterial(o.material);}});roadGroup.add(mesh);}
 road('road-crossroad',0,0);for(let i=-5;i<=5;i++){if(!i)continue;road('road-straight',0,i*6,Math.PI/2);road('road-straight',i*6,0);}
 const follow=new THREE.Vector3(),look=new THREE.Vector3();
 function resize(width,height){aspect=width/Math.max(1,height);renderer.setSize(width,height,false);updateCamera();}
 function updateCamera(){camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}
 function setGame(game){trackedGame=game;falling.clear();objects.clear();objectGroup.clear();const eaten=new Set(game.eaten);
  for(const item of game.items){if(eaten.has(item.id))continue;const template=templates.get(item.asset),group=new THREE.Group(),mesh=template.root.clone(true),scale=item.radius*2/Math.hypot(template.size.x,template.size.z);mesh.scale.setScalar(scale);group.add(mesh);group.position.set(item.x,0,item.z);group.rotation.y=item.angle;group.userData.height=template.size.y*scale;scene.updateMatrixWorld();objectGroup.add(group);objects.set(item.id,group);}
  follow.set(game.x,0,game.z);span=25+window.BuliHole.radius(game)*2;updateCamera();
  ground.material.color.set(['#a9c6a0','#b9cdb0','#9dbfc0'][(game.level-1)%3]);
 }
 function render(game,events=[],ms=16){if(disposed)return;if(game!==trackedGame)setGame(game);const r=window.BuliHole.radius(game),seconds=Math.min(ms,100)/1000;
  hole.position.set(game.x,0,game.z);inside.scale.set(r,1,r);bottom.scale.set(r,r,1);rim.scale.setScalar(r);holePosition.value.set(game.x,game.z);holeRadius.value=r;
  for(const item of events){const obj=objects.get(item.id);if(obj&&!falling.has(item.id))falling.set(item.id,{obj,item,t:0,rotation:obj.rotation.y});}
  for(const [id,f] of falling){f.t+=seconds/0.78;const t=Math.min(1,f.t),ease=t*t;
   f.obj.position.set(f.item.x+(game.x-f.item.x)*ease,-(f.obj.userData.height+4)*ease,f.item.z+(game.z-f.item.z)*ease);
   f.obj.rotation.x=.5*ease;f.obj.rotation.z=-.38*ease;f.obj.rotation.y=f.rotation+t*.35;f.obj.scale.setScalar(1-.65*ease);
   if(t>=1){objectGroup.remove(f.obj);objects.delete(id);falling.delete(id);}
  }
  follow.lerp(new THREE.Vector3(game.x,0,game.z),1-Math.exp(-seconds*9));const wanted=25+r*2.4;
  if(Math.abs(span-wanted)>.03){span+=(wanted-span)*(1-Math.exp(-seconds*3));updateCamera();}
  camera.position.set(follow.x+18,29,follow.z+22);look.set(follow.x,0,follow.z);camera.lookAt(look);renderer.render(scene,camera);
 }
 function dispose(){disposed=true;renderer.dispose();templates.forEach(t=>t.root.traverse(o=>{if(o.isMesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.map?.dispose();m.dispose();});}}));}
 return{setGame,render,resize,dispose};
}
