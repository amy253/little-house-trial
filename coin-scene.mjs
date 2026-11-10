import * as THREE from './three.module.min.js';
import {RADIUS,THICKNESS} from './coin-physics.mjs';

// Common arcade-machine construction; no assets or code from the unlicensed reference.
export function buildCabinet(){
 const root=new THREE.Group(),cabinet=new THREE.MeshStandardMaterial({color:0x91c3d1,roughness:.52,metalness:.12}),brass=new THREE.MeshStandardMaterial({color:0xe3ba68,roughness:.38,metalness:.38}),steel=new THREE.MeshStandardMaterial({color:0xd3e4e4,roughness:.36,metalness:.26}),recess=new THREE.MeshStandardMaterial({color:0xb5d2cd,roughness:.62}),light=new THREE.MeshStandardMaterial({color:0xf8e4b4,emissive:0xf0d899,emissiveIntensity:.2});
 function box(x,y,z,w,h,d,material=cabinet,parent=root){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 box(0,-.5,-.22,7.32,.82,7.75);box(0,-.12,-.35,6.9,.24,7,steel);
 box(0,2.53,-4.07,7.35,5.86,.3);box(0,2.7,-3.88,6.65,4.55,.12,recess);
 box(0,4.95,-3.75,6.65,.12,.16,light);box(0,4.53,-3.76,4.6,.07,.12,brass);
 // Backboard coin rails, ending above the same physical drop position.
 for(const x of [-2.95,2.95])box(x,3.12,-2.56,.06,2.3,.08,brass);
 box(0,4.2,-2.56,5.96,.09,.13,steel);box(0,1.98,-2.56,5.96,.08,.13,steel);
 for(const x of [-3.55,3.55]){box(x,.36,-1.25,.2,1,5.4);box(x,.9,-1.25,.13,.1,5.4,brass);box(x,2.55,-3.84,.16,5.8,.18,brass);}
 // Open front/side gutters and collector: the lip stays below the falling coins.
 box(0,-1.04,3.69,7.35,.13,1.25,recess);box(0,-1.35,3.84,7.35,.48,1.2);
 box(0,-1.1,4.37,7.35,.26,.14,brass);box(0,-.88,4.28,6.94,.04,.09,light);
 for(const x of [-3.63,3.63])box(x,-.83,3.75,.14,.55,1.2,brass);
 for(let i=-6;i<=6;i++)box(i*.48,-1.105,3.85,.045,.03,.68,steel);
 const deck=new THREE.Group();box(0,0,0,6.8,.32,2.8,steel,deck);box(0,.167,.05,6.62,.014,2.58,cabinet,deck);box(0,.17,1.36,6.8,.035,.07,brass,deck);root.add(deck);
 const aim=new THREE.Group();box(0,0,0,.64,.11,.18,brass,aim);box(0,-.15,0,.07,.24,.08,light,aim);aim.position.set(0,2.55,-2.25);root.add(aim);
 root.updateMatrixWorld(true);return{root,deck,aim};
}

export function fitCamera(width,height,bounds){
 const aspect=Math.max(1,width)/Math.max(1,height),camera=new THREE.OrthographicCamera(-aspect,aspect,1,-1,.1,100);
 const center=bounds.getCenter(new THREE.Vector3());camera.position.copy(center).add(new THREE.Vector3(0,10,16));camera.lookAt(center);camera.updateMatrixWorld(true);
 const inverse=camera.matrixWorldInverse,points=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new THREE.Vector3(x,y,z).applyMatrix4(inverse));
 const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y)),halfY=Math.max(Math.abs(minY),Math.abs(maxY)),halfX=Math.max(...points.map(p=>Math.abs(p.x))),half=Math.max(halfY,halfX/aspect)/.93;
 camera.top=half;camera.bottom=-half;camera.right=half*aspect;camera.left=-half*aspect;camera.updateProjectionMatrix();return camera;
}

// Cannon exposes x/y/z/w; Three's compose reads Quaternion's internal fields.
export function coinMatrix(body,matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1)){
 rotation.set(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);return matrix.compose(body.position,rotation,scale);
}

export function createScene(canvas,physics){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(1.5,globalThis.devicePixelRatio||1));renderer.setClearColor(0xf4f1e8);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),machine=buildCabinet();scene.add(machine.root);scene.add(new THREE.HemisphereLight(0xffffff,0xa7bcc6,2.3));
 const key=new THREE.DirectionalLight(0xfff6df,3);key.position.set(-4,9,7);scene.add(key);const fill=new THREE.DirectionalLight(0xd8ecff,1.7);fill.position.set(5,6,-3);scene.add(fill);
 const baseGeometry=new THREE.CylinderGeometry(RADIUS,RADIUS,THICKNESS,28),rimGeometry=new THREE.TorusGeometry(.232,.009,5,28);rimGeometry.rotateX(Math.PI/2);rimGeometry.translate(0,THICKNESS/2+.003,0);
 const markGeometry=new THREE.BoxGeometry(.027,.011,.2);markGeometry.translate(0,THICKNESS/2+.006,0);
 const star=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.066:.145;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?star.lineTo(x,y):star.moveTo(x,y);}star.closePath();const starGeometry=new THREE.ExtrudeGeometry(star,{depth:.008,bevelEnabled:false});starGeometry.rotateX(-Math.PI/2);starGeometry.translate(0,THICKNESS/2+.004,0);
 const coinSets=[0xd9a63e,0xdce8f1].map((color,i)=>{const body=new THREE.MeshStandardMaterial({color,metalness:.62,roughness:.29}),rim=new THREE.MeshStandardMaterial({color:i?0xf5f9ff:0xffdb80,metalness:.58,roughness:.28});return[baseGeometry,rimGeometry,i?starGeometry:markGeometry].map((g,j)=>{const mesh=new THREE.InstancedMesh(g,j?rim:body,160);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);return mesh;});});
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1),bounds=new THREE.Box3().setFromObject(machine.root);let camera=null;
 function resize(){const {width,height}=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,width),Math.max(1,height),false);camera=fitCamera(width,height,bounds);}
 function render(aimX=0){if(!camera)resize();machine.deck.position.copy(physics.pusher.position);machine.aim.position.x=aimX;const counts=[0,0];for(const [id,b]of physics.bodies){const type=id%17===16?1:0,index=counts[type]++;coinMatrix(b,matrix,rotation,scale);for(const mesh of coinSets[type])mesh.setMatrixAt(index,matrix);}for(let t=0;t<2;t++)for(const mesh of coinSets[t]){mesh.count=counts[t];mesh.instanceMatrix.needsUpdate=true;}renderer.render(scene,camera);}
 function aimAt(clientX){const r=canvas.getBoundingClientRect();return((clientX-r.left)/Math.max(1,r.width)-.5)*(camera.right-camera.left);}
 function dispose(){const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();}
 resize();render();return{resize,render,aimAt,dispose};
}
