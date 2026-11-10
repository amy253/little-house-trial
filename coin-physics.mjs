import * as CANNON from './cannon-es.mjs';
export const PERIOD=4.8,FRONT=3.15,RADIUS=.29,THICKNESS=.085,STEP=1/60;
export function createPhysics(game,saved){
 const world=new CANNON.World({gravity:new CANNON.Vec3(0,-12,0),allowSleep:true});world.broadphase=new CANNON.SAPBroadphase(world);world.solver.iterations=7;
 const metal=new CANNON.Material('metal');world.defaultContactMaterial.friction=.22;world.defaultContactMaterial.restitution=.015;
 world.addContactMaterial(new CANNON.ContactMaterial(metal,metal,{friction:.22,restitution:.015}));
 function box(x,y,z,hx,hy,hz,type=CANNON.Body.STATIC){const b=new CANNON.Body({type,material:metal,shape:new CANNON.Box(new CANNON.Vec3(hx,hy,hz)),position:new CANNON.Vec3(x,y,z)});world.addBody(b);return b;}
 box(0,-.12,-.35,3.45,.12,3.5);box(0,.55,-3.98,3.6,.65,.12);box(-3.55,.36,-1.25,.1,.5,2.7);box(3.55,.36,-1.25,.1,.5,2.7);
 const pusher=box(0,.20,-2.35,3.4,.16,1.4,CANNON.Body.KINEMATIC),bodies=new Map(),shape=new CANNON.Cylinder(RADIUS,RADIUS,THICKNESS,10);
 let phase=saved?.phase||0,accumulator=saved?.accumulator||0;
 const target=t=>-2.35+(1-Math.cos(2*Math.PI*t/PERIOD))*.75;
 pusher.position.z=target(phase);
 function make(c){const b=new CANNON.Body({mass:c.kind==='silver'?.12:.1,material:metal,shape,linearDamping:.12,angularDamping:.35,sleepSpeedLimit:.025,sleepTimeLimit:2});bodies.set(c.id,b);world.addBody(b);return b;}
 if(saved){for(const data of saved.bodies){const c=game.coins.find(c=>c.id===data.id);if(!c)continue;const b=make(c);b.position.set(...data.p);b.quaternion.set(...data.q);b.velocity.set(...data.v);b.angularVelocity.set(...data.w);b.sleepState=data.sleep;b.previousPosition.copy(b.position);b.interpolatedPosition.copy(b.position);b.previousQuaternion.copy(b.quaternion);b.interpolatedQuaternion.copy(b.quaternion);}}
 else for(let i=0;i<game.coins.length;i++){const b=make(game.coins[i]),upper=i>=70,n=upper?i-70:i,row=Math.floor(n/10),col=n%10,j=((game.seed+i*73)%101)/101-.5;b.position.set((col-4.5)*.61+j*.012,upper?.41:.05,(upper?-2.7:-.55)+row*.60+j*.012);}
 function add(c,aim){if(bodies.size>=160||bodies.has(c.id)||!Number.isFinite(aim))return false;const b=make(c);b.position.set(Math.max(-2.95,Math.min(2.95,aim)),2.35,-2.25);b.quaternion.setFromEuler(1.05,0,.16);for(const body of bodies.values())body.wakeUp();return true;}
 function step(ms){const events=[];if(!Number.isFinite(ms)||ms<=0)return{events,advancedMs:0};accumulator+=Math.min(ms,100)/1000;let steps=0;
  while(accumulator+1e-10>=STEP){phase=(phase+STEP)%PERIOD;const z=target(phase);pusher.velocity.set(0,0,(z-pusher.position.z)/STEP);world.step(STEP);accumulator=Math.max(0,accumulator-STEP);steps++;
   for(const [id,b]of bodies)if(b.position.y<-.7){events.push({id,front:b.position.z>=FRONT-.15&&Math.abs(b.position.x)<3.5});world.removeBody(b);bodies.delete(id);}
  }return{events,advancedMs:steps*STEP*1000};
 }
 function snapshot(){const arr=v=>[v.x,v.y,v.z];return{phase,accumulator,bodies:[...bodies].map(([id,b])=>({id,p:arr(b.position),q:[b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w],v:arr(b.velocity),w:arr(b.angularVelocity),sleep:b.sleepState}))};}
 return{bodies,pusher,add,step,snapshot};
}
