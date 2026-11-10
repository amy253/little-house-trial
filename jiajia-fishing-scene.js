(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JiajiaFishingScene = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, n) => a + (b - a) * n;
  // Device-local civil time; never tied to save data, purchases or game speed.
  function ambienceAt(date) {
    const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
    const dusk=hour>=17&&hour<19,dawn=hour>=5&&hour<6.5;
    const u=dusk?(hour-17)/2:dawn?(6.5-hour)/1.5:hour>=19||hour<5?1:0;
    return {period:dusk?'dusk':dawn?'dawn':u?'night':'day',darkness:u*u*(3-2*u),warmth:dusk?Math.sin(u*Math.PI):dawn?Math.sin(u*Math.PI)*.5:0};
  }
  function colorMix(a,b,n) {
    return '#'+[1,3,5].map(i=>Math.round(mix(parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),clamp(n))).toString(16).padStart(2,'0')).join('');
  }
  function firefliesAt(time,spot,still=false) {
    const t=still?0:time,count=spot==='reeds'?12:8;
    return Array.from({length:count},(_,i)=>({x:32+(i*73)%368+Math.sin(t*.28+i*2.1)*17,y:145+(i*47)%212+Math.sin(t*.36+i)*13,alpha:.48+.26*Math.sin(t*.7+i*1.8)}));
  }
  // Hand anchors in each 512px cell of the generated seated angler sheet.
  const hands = [[405,370],[137,290],[340,385],[374,272],[348,345],[300,377]];
  // Measured opaque bounds: generated figures extend outside nominal grid cells.
  // Source polygons separate neighboring cat heads and tails.
  const ATLAS={hero:[{"x":65,"y":15,"w":425,"h":498},{"x":551,"y":14,"w":440,"h":499},{"x":1058,"y":21,"w":416,"h":493},{"x":66,"y":515,"w":463,"h":492},{"x":559,"y":519,"w":422,"h":487},{"x":1077,"y":520,"w":418,"h":484}]};
  // One photo-referenced sheet locks Buli's face, markings and physical scale.
  // Measured bounds, rather than assumed cells, retain tails and whiskers.
  ATLAS.cat=[{x:11,y:11,w:293,h:326},{x:354,y:15,w:419,h:314},{x:788,y:17,w:365,h:312},{x:1123,y:92,w:398,h:229},{x:6,y:444,w:348,h:210},{x:402,y:327,w:236,h:328}];
  ATLAS.life=[{x:716,y:379,w:388,h:269},{x:1142,y:339,w:381,h:290},{x:20,y:656,w:327,h:331},{x:342,y:779,w:453,h:210},{x:792,y:648,w:433,h:339},{x:1232,y:649,w:299,h:326}];
  ATLAS.cat[0].neck=[225,171];ATLAS.cat[4].neck=[291,589];ATLAS.cat[4].mouth=[292,612];ATLAS.cat[5].neck=[537,480];
  ATLAS.cat[2].clip=[[788,17],[1156,17],[1110,92],[1110,97],[1143,98],[1143,99],[1139,100],[1140.5,101],[1139,102],[1138,103],[1138,104],[1137,105],[1138,106],[1136.5,107],[1135.5,108],[1136.5,109],[1137,110],[1136,112],[1136.5,113],[1135.5,114],[1136.5,115],[1136.5,117],[1137,118],[1136.5,119],[1137.5,120],[1137,121],[1136,122],[1136,124],[1136.5,125],[1136.5,127],[1137,128],[1136.5,129],[1137.5,130],[1138,131],[1139,132],[1138.5,133],[1138.5,135],[1139.5,137],[1139.5,140],[1140.5,142],[1140.5,145],[1141.5,146],[1110,147],[1110,178],[1110.5,179],[1110.5,180],[1112,183],[1112,185],[1113,186],[1114.5,189],[1114.5,190],[1115.5,191],[1115.5,192],[1116.5,193],[1118.5,197],[1118.5,198],[1119,199],[1120,200],[1122,204],[1123,205],[1123,206],[1126,209],[1126.5,210],[1129.5,213],[1131,214],[1148,215],[1150,217],[1150.5,218],[1152.5,220],[1152.5,221],[1153,222],[1154.5,223],[1155.5,224],[1156,225],[1156,314],[1150.5,315],[1151.5,316],[1152,317],[1152,318],[1146,320],[1141.5,321],[1138.5,322],[1140,323],[1140,329],[788,329]];
  ATLAS.cat[3].clip=[[1156,92],[1521,92],[1521,329],[1140,329],[1140,323],[1138.5,322],[1141.5,321],[1146,320],[1152,318],[1152,317],[1151.5,316],[1150.5,315],[1156,314],[1156,225],[1155.5,224],[1154.5,223],[1153,222],[1152.5,221],[1152.5,220],[1150.5,218],[1150,217],[1148,215],[1131,214],[1129.5,213],[1126.5,210],[1126,209],[1123,206],[1123,205],[1122,204],[1120,200],[1119,199],[1118.5,198],[1118.5,197],[1116.5,193],[1115.5,192],[1115.5,191],[1114.5,190],[1114.5,189],[1113,186],[1112,185],[1112,183],[1110.5,180],[1110.5,179],[1110,178],[1110,147],[1141.5,146],[1140.5,145],[1140.5,142],[1139.5,140],[1139.5,137],[1138.5,135],[1138.5,133],[1139,132],[1138,131],[1137.5,130],[1136.5,129],[1137,128],[1136.5,127],[1136.5,125],[1136,124],[1136,122],[1137,121],[1137.5,120],[1136.5,119],[1137,118],[1136.5,117],[1136.5,115],[1135.5,114],[1136.5,113],[1136,112],[1137,110],[1136.5,109],[1135.5,108],[1136.5,107],[1138,106],[1137,105],[1138,104],[1138,103],[1139,102],[1140.5,101],[1139,100],[1143,99],[1143,98],[1110,97],[1110,92]];
  // Ambient life uses a separate clock: a new cast does not restart the cat's day.
  function ambientCat(game, options, still) {
    const bond=game.save.pet.affection;
    const level=[20,50,100,200].filter(n=>bond>=n).length;
    const period=[36,32,30,30,28][level],napEnd=level>=3?19:21,visitStart=napEnd+1;
    const raw=still?0:game.paused&&!options.allowAmbient?game.phaseTime:options.ambientTime??options.visualTime??game.phaseTime;
    const time=Number.isFinite(raw)?Math.max(0,raw):0, age=time%period;
    const p={catFrame:0,catX:12,catY:299,catSheet:'meal',catActivity:'idle',catFlip:false};
    if(still)return p;
    if(age>=5&&age<7){p.catFrame=1;p.catActivity='walk';p.catX=mix(12,42,(age-5)/2);}
    else if(age>=7&&age<11){
      p.catSheet='life';p.catActivity='jump';
      const hops=level?2:1,elapsed=age-7,span=4/hops,index=Math.min(hops-1,Math.floor(elapsed/span)),u=(elapsed-index*span)/span;
      const flight=clamp((u-.12)/.7),travel=(index+flight)/hops;
      p.catX=mix(42,94,travel);p.catY=299-Math.sin(flight*Math.PI)*(level?28:22);
      p.catFrame=u<.12?0:u<.82?1:2;
    }
    else if(age>=11&&age<13){p.catFrame=1;p.catActivity='walk';p.catFlip=true;p.catX=mix(94,12,(age-11)/2);}
    else if(age>=13&&age<13.6){p.catSheet='life';p.catFrame=0;p.catActivity='settle';}
    else if(age>=13.6&&age<napEnd){p.catSheet='life';p.catFrame=3;p.catActivity='sleep';p.catY+=Math.sin(time*1.5)*.6;}
    else if(age>=napEnd&&age<visitStart){p.catSheet='life';p.catFrame=4;p.catActivity='stretch';}
    else if(level>=2&&age>=visitStart&&age<period-1){
      const span=period-1-visitStart,u=age-visitStart;p.catActivity='nuzzle';
      p.catX=u<1.3?mix(12,56,u/1.3):u>span-1.3?mix(56,12,(u-span+1.3)/1.3):56;
      p.catFlip=u>span-1.3;
      p.catFrame=u<1.3||u>span-1.3?1:5;p.catSheet=p.catFrame===5?'life':'meal';
    } else {p.catX+=Math.sin(time*.45)*2;if(time%8>7.6)p.catFrame=4;}
    return p;
  }
  function poseAt(game, options = {}) {
    const still = !!options.reducedMotion;
    const t = still ? 0 : game.paused ? game.phaseTime : options.visualTime ?? game.phaseTime;
    const age = options.snackAge ?? Infinity;
    const cast = !still && game.phase === 'waiting' && game.phaseTime < .8;
    const flight = clamp((game.phaseTime - .18) / .62);
    let heroFrame = game.phase === 'reeling' ? (game.tension > game.rules.high || game.tension < game.rules.low ? 3 : 2) : game.phase === 'caught' ? 4 : game.phase === 'escaped' ? 5 : game.phase === 'bite' ? 2 : 0;
    if (cast) heroFrame = game.phaseTime < .3 ? 1 : 2;
    const sway = still ? 0 : game.phase === 'reeling' ? Math.sin(t * 4) * (game.held ? 1.8 : .8) : Math.sin(t * 1.2) * .6;
    const heroX = 8 + sway, heroSize=200,heroY = 355-heroSize;
    const hand = hands[heroFrame];
    const rodBase = { x: heroX + hand[0] / 512 * heroSize, y: heroY + hand[1] / 512 * heroSize };
    const pulling = game.phase === 'reeling' && game.held;
    const swing=clamp((game.phaseTime-.13)/.46),swingEase=swing*swing*(3-2*swing);
    const rodTip = cast ? {x:mix(83,242,swingEase),y:mix(157,210,swingEase)-Math.sin(swing*Math.PI)*30} : {x:242 + sway, y:pulling ? 180 + Math.sin(t*4)*3 : 210 + sway};
    // A stable release origin avoids a float jump when the hand sprite changes.
    const bobber = cast ? {x:mix(83,287,flight),y:mix(236,279,flight)-Math.sin(flight*Math.PI)*112} : {x:287+(game.phase==='reeling'?Math.sin(t*4.5)*Math.min(12,Math.abs(game.fight)/2):0),y:279+(game.phase==='bite'?8+Math.sin(t*12)*3:Math.sin(t*2)*1.5)};
    const ambient=ambientCat(game,options,still);
    let {catFrame,catX,catY,catSheet,catActivity,catFlip}=ambient;
    if (age >= 0 && age < 5) {
      catSheet='meal';catActivity='meal';catY=299;catFlip=age>=4.2;
      catX = age < .8 ? mix(12,68,clamp(age/.8)) : age < 4.2 ? 68 : mix(68,12,clamp((age-4.2)/.8));
      catFrame = age < .8 ? 1 : age < 1.35 ? 2 : age < 1.9 ? 3 : age < 3.2 ? (still ? 4 : Math.floor(age*5)%3===0 ? 3 : 4) : age < 4.2 ? 5 : 1;
      if(still){catX=68;if(age<.8||age>=4.2)catFrame=0;}
    }
    const chew = still || catFrame !== 4 || !Number.isFinite(age) || age>=3.2 ? 0 : Math.sin(age*15)*.8;
    return {heroFrame,heroX,heroY,heroSize,rodBase,rodTip,bobber,castFlight:cast,landing:clamp((options.resultAge ?? game.phaseTime)/.9),catFrame,catX,catSheet,catActivity,catFlip,catY:catY+(still?0:Math.sin(t*1.4)*.35)+chew,foodVisible:age>=0&&age<3.2,foodScale:clamp(1-(age-1.6)/1.6),chew};
  }
  return {poseAt,ATLAS,ambienceAt,colorMix,firefliesAt};
});
