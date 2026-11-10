import * as CANNON from './cannon-es.mjs';

export function createPile() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
  world.allowSleep = true;
  world.solver.iterations = 12;
  world.defaultContactMaterial.friction = 0.55;
  world.defaultContactMaterial.restitution = 0.08;
  const bodies = new Map();
  let simulationTime = 0, lastFlipTime = -Infinity;

  const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  floor.position.y = -1.16;
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floor);

  const sides = 18;
  const potRadius = 2.72, wallBottom = -1.16, wallTop = 2.2;
  for (let i = 0; i < sides; i++) {
    const angle = i * Math.PI * 2 / sides;
    const wall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(Math.PI * potRadius / sides + 0.08, (wallTop - wallBottom) / 2, 0.18)),
    });
    wall.position.set(Math.cos(angle) * potRadius, (wallTop + wallBottom) / 2, Math.sin(angle) * potRadius);
    wall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -angle - Math.PI / 2);
    world.addBody(wall);
  }
  const lid = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  lid.position.y = wallTop;
  lid.quaternion.setFromEuler(Math.PI / 2, 0, 0);
  world.addBody(lid);

  return {
    add(id, position, radius = 0.48) {
      const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(radius) });
      body.position.set(position.x, position.y, position.z);
      body.linearDamping = 0.33;
      body.angularDamping = 0.5;
      world.addBody(body);
      bodies.set(id, body);
      return body;
    },
    get(id) { return bodies.get(id); },
    remove(id) {
      const body = bodies.get(id);
      if (!body) return;
      world.removeBody(body);
      bodies.delete(id);
      for (const other of bodies.values()) other.wakeUp();
    },
    flip() {
      if (simulationTime - lastFlipTime < 0.85) return false;
      lastFlipTime = simulationTime;
      const highest=Math.max(...[...bodies.values()].map(body=>body.position.y));
      const movableAbove=bodies.size<3?-Infinity:Math.max(-0.35,Math.min(0.6,highest-0.85));
      let i = 0;
      for (const body of bodies.values()) {
        if(body.position.y<movableAbove)continue;
        const angle = Math.atan2(body.position.z, body.position.x) + i++ * 0.025;
        const lift = Math.max(2, 3.35 - Math.max(0, body.position.y) * 0.58);
        body.wakeUp();
        body.applyImpulse(new CANNON.Vec3(-Math.sin(angle) * 1.3, lift, Math.cos(angle) * 1.3));
        body.angularVelocity.set(Math.sin(angle) * 1.2, Math.cos(angle) * 1.2, 0.8);
      }
      return true;
    },
    shuffle() {
      const stacked=[...bodies.values()].sort((a,b)=>a.position.y-b.position.y);
      const places=stacked.map(body=>body.position.clone());
      const offset=Math.floor(stacked.length/2);
      stacked.forEach((body,index)=>{
        const place=places[(index+offset)%places.length];
        body.position.set(-place.z,place.y,place.x);
        body.previousPosition.copy(body.position);
        body.interpolatedPosition.copy(body.position);
        body.velocity.set(0,0,0);
        body.angularVelocity.set(0,0,0);
        body.aabbNeedsUpdate=true;
      });
      let i=0;
      for(const body of bodies.values()){
        const angle=(i++*2.399963229728653)% (Math.PI*2);
        body.wakeUp();
        body.applyImpulse(new CANNON.Vec3(Math.cos(angle)*1.8,1.2,Math.sin(angle)*1.8));
      }
    },
    shove(dx, dz, id) {
      const push = new CANNON.Vec3(Math.max(-0.9, Math.min(0.9, dx * 0.065)), 0.04, Math.max(-0.9, Math.min(0.9, dz * 0.065)));
      const touched=id===undefined?null:bodies.get(id);
      if(id!==undefined&&!touched)return;
      for (const body of bodies.values()) {
        if(touched&&body!==touched){
          if(Math.hypot(body.position.x-touched.position.x,body.position.z-touched.position.z)>1.1)continue;
          body.applyImpulse(push.scale(0.18));
          continue;
        }
        body.wakeUp();
        body.applyImpulse(push);
      }
    },
    step(delta) {
      const elapsed = Math.min(delta, 0.05);
      simulationTime += elapsed;
      world.step(1 / 60, elapsed, 4);
    },
  };
}
