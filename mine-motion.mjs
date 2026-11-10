const targets = {
  mine: { zone: 'mine', x: 1.5, z: -2 },
  factory: { zone: 'factory', x: 17, z: -1 },
  dock: { zone: 'dock', x: 27, z: 1 },
};

export function cameraTargetFor(x, z, currentZone = 'mine') {
  let zone = currentZone;
  if (zone === 'mine' && x > 9) zone = 'factory';
  else if (zone === 'factory' && x < 7.5) zone = 'mine';
  else if (zone === 'factory' && x > 23) zone = 'dock';
  else if (zone === 'dock' && x < 21.5) zone = 'factory';
  return targets[zone] || targets.mine;
}

export function advanceMiningCycle(clock, delta, interval) {
  const total = clock + delta;
  const hits = Math.floor((total + Number.EPSILON) / interval);
  const nextClock = hits ? total - hits * interval : total;
  return {
    clock: Math.abs(nextClock) < 1e-9 ? 0 : nextClock,
    hits,
    phase: hits ? 'impact' : 'swing',
    progress: hits ? 1 : nextClock / interval,
  };
}

export function missionFor(state, capacity) {
  if (state.vehicle && state.cargo) {
    return { step: 4, title: '把成品卖到码头', detail: '沿箭头开到最右边的水边码头，靠近后会自动卖出。', chip: '④ 开到水边码头' };
  }
  if (state.vehicle && (state.goods || state.raw)) {
    return { step: 3, title: '到加工机旁装货', detail: state.goods ? '把叉车开到灰色加工机旁，成品会自动装上车。' : '机器正在加工，先把叉车开到灰色加工机旁等一会儿。', chip: '③ 去加工机装货' };
  }
  if (state.vehicle) {
    return { step: 5, title: '回矿坑继续采矿', detail: '沿箭头开回左边矿坑，再点绿色按钮下车。', chip: '⑤ 回矿坑下车' };
  }
  if (state.bag) {
    return { step: 2, title: '把矿石送去加工', detail: state.bag >= capacity ? '背包满了。沿箭头向右走到灰色加工机旁，矿石会自动倒进去。' : '可以继续采矿；想送货时，沿箭头向右走到灰色加工机旁。', chip: '② 去灰色加工机' };
  }
  if (state.goods || state.raw) {
    return { step: 3, title: '去黄色叉车旁上车', detail: '走到黄色叉车旁，再点下方绿色按钮“上车”。', chip: '③ 找黄色叉车' };
  }
  return { step: 1, title: '先去白色矿石旁', detail: '按住画面，朝白色矿石方向拖动。走近后家家会自动挥镐。', chip: '① 去白色矿石旁' };
}
