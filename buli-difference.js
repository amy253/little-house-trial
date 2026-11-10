(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BuliDifference=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const LIMIT=120000,SAVE_KEY='little-house:buli-difference:aijia:v1';
 // Regions and donor patches use the same reference crop as the board.
 function scene(id,height,edits,width=320){
  return {id,regions:edits.map(([label,x,y,w,h,edit])=>({
   label,x:x/width,y:y/height,w:w/width,h:h/height,
   ...(Array.isArray(edit)?{copy:[edit[0]/width,edit[1]/height]}:{detail:edit})
  }))};
 }
 const additional=(id,edits)=>scene(id,100,edits,100);
 const LEVELS=[
  scene(1,320,[
   ['瓶盖不见了',157,3,28,34,[131,4]],
   ['粉色小盒多了搭扣',285,72,32,25,'case-clasp'],
   ['袖口少了一颗纽扣',42,268,25,34,[35,240]],
   ['蛋糕多了一颗草莓',178,281,34,35,[150,277]],
   ['制服多了一枚胸针',260,237,31,26,'wing-pin']
  ]),
  scene(2,320,[
   ['门边挂饰不见了',29,2,29,59,[58,2]],
   ['右边墙上的标签不见了',266,77,42,63,[266,10]],
   ['零食包装多了一行字',105,152,27,24,'packet-print'],
   ['蓝色袖子多了一枚织章',231,215,40,32,'sleeve-tag'],
   ['台阶少了一截白边',10,245,44,34,[3,277]]
  ]),
  scene(3,320,[
   ['左上角少了一张吊牌',65,0,24,35,[12,0]],
   ['左边叉子的齿不见了',25,21,30,43,[1,18]],
   ['左边的餐刀不见了',0,153,36,73,[32,143]],
   ['领带多了一枚夹子',143,274,34,29,'tie-clip'],
   ['外套多了一个口袋',247,220,43,32,'welt-pocket']
  ]),
  scene(4,240,[
   ['树后的灯不亮了',121,12,29,30,[151,12]],
   ['手链多了一个吊坠',79,141,26,24,'bracelet-charm'],
   ['远处的人影少了头部',242,92,31,35,[275,96]],
   ['背带多了一颗扣钉',227,172,27,27,'strap-stud'],
   ['左下的椅背多了一道缝线',15,214,45,25,'seat-stitch']
  ]),
  scene(5,320,[
   ['舞台上方多了一盏小灯',218,28,24,22,'stage-light'],
   ['琴头多了一颗调音钮',105,132,27,26,'tuning-peg'],
   ['舞台左边少了一个亮点',25,155,31,27,[38,178]],
   ['上衣多了一枚布章',229,227,36,32,'shirt-patch'],
   ['琴身多了一个旋钮',127,283,25,24,'guitar-knob']
  ]),
  scene(6,240,[
   ['左侧音箱多了一块铭牌',16,60,41,22,'speaker-plate'],
   ['海报少了一段印字',85,22,27,27,[68,18]],
   ['左肩多了一小排亮片',101,120,24,27,[92,102]],
   ['白袖口多了一颗纽扣',174,158,27,26,'cuff-button'],
   ['右边音箱多了三格指示灯',259,146,32,23,'speaker-lights']
  ]),
  additional(7,[
   ['头发多了一枚夹子',12,16,15,11,'hair-clip'],
   ['墙上的横线断了一截',82,43,16,13,[82,29]],
   ['耳旁多了一颗小珠',30,57,11,12,'pearl'],
   ['袖子多了一道缝线',6,83,18,13,'seat-stitch'],
   ['衣襟多了一枚胸针',64,76,16,15,'wing-pin']
  ]),
  additional(8,[
   ['墙上多了一条装饰边',4,9,15,12,'edge-seam'],
   ['手边多了一粒吊饰',24,22,12,13,'strap-stud'],
   ['垂下的白袖多了一个绣花',35,64,17,16,'flower-brooch'],
   ['肩上少了一小段金纹',82,37,13,13,[73,37]],
   ['腰间多了一枚珠扣',70,82,14,12,'pearl']
  ]),
  additional(9,[
   ['帽上的小标记不见了',32,16,15,13,[41,10]],
   ['门上多了一块铭牌',5,42,16,13,'speaker-plate'],
   ['手机背面多了一个环',87,61,12,14,'phone-ring'],
   ['肩带上多了一颗金扣',65,72,12,12,'strap-stud'],
   ['黑色泳衣多了一枚织标',36,87,17,13,'sleeve-tag']
  ]),
  additional(10,[
   ['背景的灯斑少了一块',76,12,20,16,[76,31]],
   ['头顶的小夹子少了',49,28,13,12,[56,35]],
   ['话筒架多了一道箍',16,65,15,13,'tie-clip'],
   ['袖边多了一枚蓝扣',62,63,13,13,'cuff-button'],
   ['衣襟多了一朵绣花',42,82,15,14,'flower-brooch']
  ]),
  additional(11,[
   ['左边多了一盏背景灯',12,23,14,12,[77,17]],
   ['右边少了一盏烛灯',78,13,16,14,[80,1]],
   ['头纱多了一枚发夹',59,18,13,11,'hair-clip'],
   ['袖口多了一颗珠子',33,61,13,14,'pearl'],
   ['裙边多了一小段缝线',60,87,19,12,'edge-seam']
  ]),
  additional(12,[
   ['右上少了一点红色舞台装饰',72,15,17,16,[75,1]],
   ['头发多了一枚发夹',18,27,14,12,'hair-clip'],
   ['肩带多了一颗金扣',72,62,13,12,'strap-stud'],
   ['衣襟多了一枚别针',40,83,16,13,'wing-pin'],
   ['右袖多了一道缝线',80,86,13,12,'edge-seam']
  ]),
  additional(13,[
   ['帘边的竖线少了一段',9,5,16,18,[22,5]],
   ['头发多了一枚夹子',68,26,14,11,'hair-clip'],
   ['靠垫多了一段缝线',7,43,17,13,'seat-stitch'],
   ['袖子多了一颗纽扣',8,70,15,13,'cuff-button'],
   ['卟哩旁边多了一枚爪印布章',78,86,16,13,'paw-badge']
  ]),
  additional(14,[
   ['街边招牌多了一条横杠',49,10,20,13,'edge-seam'],
   ['远处少了一点车尾灯',26,24,16,13,[18,18]],
   ['衣服多了一枚胸针',65,56,13,12,'wing-pin'],
   ['红机车多了一枚车标',19,77,18,15,'speaker-plate'],
   ['右边车尾多了一颗铆钉',84,81,13,12,'strap-stud']
  ]),
  additional(15,[
   ['卟哩背上少了一小段花纹',64,24,18,16,[66,43]],
   ['卟哩旁多了一枚小挂饰',43,44,13,11,'strap-stud'],
   ['地垫多了一枚爪印',26,76,17,15,'paw-badge'],
   ['地垫右边少了一个角',42,59,15,13,[21,45]],
   ['地板上多了一个逗猫球',72,84,18,14,'yarn-ball']
  ]),
  additional(16,[
   ['背景多了一盏灯',7,15,14,14,[8,49]],
   ['头发多了一枚发卡',65,15,15,12,'hair-clip'],
   ['话筒多了一道箍',41,57,15,12,'tie-clip'],
   ['左边蝴蝶结多了一粒珠子',17,77,12,12,'pearl'],
   ['右边衣袖多了一颗星形扣',80,83,14,13,'star-pin']
  ]),
  additional(17,[
   ['帽檐多了一枚星星扣',28,14,14,14,'star-pin'],
   ['帽顶的徽章少了一角',53,7,16,12,[35,7]],
   ['手机多了一个挂环',56,66,13,13,'phone-ring'],
   ['左袖多了一枚布章',28,75,16,14,'shirt-patch'],
   ['右边帽带多了一粒珠子',80,77,12,12,'pearl']
  ]),
  additional(18,[
   ['头发多了一枚发夹',24,20,16,13,'hair-clip'],
   ['发尾少了一道亮纹',72,38,15,14,[72,22]],
   ['衬衣领多了一枚领夹',49,68,16,12,'tie-clip'],
   ['袖口少了一颗金纽扣',31,78,12,13,[36,79]],
   ['西装多了一枚胸针',62,84,15,13,'wing-pin']
  ]),
  additional(19,[
   ['发间多了一枚花饰',63,20,15,14,'flower-brooch'],
   ['另一侧发尾少了一道亮纹',19,32,14,16,[24,21]],
   ['项链多了一颗小坠子',47,66,13,12,'bracelet-charm'],
   ['左袖多了一枚珍珠扣',28,75,14,13,'pearl'],
   ['裙摆多了一枚绣花',54,86,16,13,'flower-brooch']
  ]),
  additional(20,[
   ['礼帽多了一枚星星扣',54,12,15,14,'star-pin'],
   ['发梢少了一段亮纹',12,51,15,14,[18,36]],
   ['右辫子多了一个发扣',81,59,15,14,'hair-clip'],
   ['领结多了一颗珠子',51,68,12,10,'pearl'],
   ['袖口多了一小朵花',63,82,16,13,'flower-brooch']
  ]),
  additional(21,[
   ['头发多了一枚花饰',24,24,17,14,'flower-brooch'],
   ['右边发尾少了一道亮纹',76,56,14,13,[76,42]],
   ['领口多了一颗珠扣',52,66,13,12,'pearl'],
   ['左袖多了一枚布章',31,70,15,15,'shirt-patch'],
   ['裙边多了一道缝线',49,86,19,13,'edge-seam']
  ]),
  additional(22,[
   ['头发少了一道亮纹',26,18,15,14,[38,12]],
   ['发间多了一枚夹子',69,29,16,12,'hair-clip'],
   ['水壶多了一枚爪印',18,68,16,15,'paw-badge'],
   ['右袖多了一颗扣子',62,73,13,12,'strap-stud'],
   ['裙摆多了一枚花饰',44,85,15,13,'flower-brooch']
  ]),
  additional(23,[
   ['头发多了一枚蝴蝶结',21,20,17,15,'ribbon'],
   ['蛋糕多了一颗小莓果',54,76,12,13,'berry'],
   ['袖边少了一粒金纽扣',29,80,13,13,[24,76]],
   ['右侧头发少了一道亮纹',72,29,15,15,[72,42]],
   ['蛋糕盒多了一枚搭扣',69,88,15,11,'case-clasp']
  ]),
  additional(24,[
   ['左上头发少了一处亮纹',26,18,16,15,[34,10]],
   ['右边多了一枚发夹',73,26,15,13,'hair-clip'],
   ['包装多了一枚莓果图案',39,66,13,12,'berry'],
   ['蓝袖多了一枚小花',51,82,15,12,'flower-brooch'],
   ['右下头发多了一粒发扣',76,77,13,12,'strap-stud']
  ]),
  additional(25,[
   ['发间多了一枚星星夹',23,20,15,14,'star-pin'],
   ['右边头发少了一处亮纹',75,30,15,15,[71,18]],
   ['领带多了一枚夹子',47,82,13,12,'tie-clip'],
   ['西装多了一个口袋',66,79,17,12,'welt-pocket'],
   ['左袖多了一颗纽扣',30,79,13,12,'cuff-button']
  ]),
  additional(26,[
   ['泳帽少了原来的标记',24,19,15,15,[33,12]],
   ['泳帽多了一道缝线',63,15,16,14,'edge-seam'],
   ['泳镜边多了一枚小钉',79,42,12,13,'strap-stud'],
   ['手机多了一个挂环',68,67,13,13,'phone-ring'],
   ['泳衣多了一枚星形扣',44,76,13,13,'star-pin']
  ]),
  additional(27,[
   ['左耳多了一枚小耳扣',16,17,13,12,'strap-stud'],
   ['头顶少了一小段深花纹',47,16,15,14,[37,27]],
   ['右边胡须少了一小段',72,59,16,13,[74,48]],
   ['卟哩多了一枚蝴蝶结',42,77,17,13,'ribbon'],
   ['卟哩脚边多了毛线球',71,80,15,14,'yarn-ball']
  ]),
  additional(28,[
   ['左边月亮旁少了一颗星',5,32,13,13,[3,40]],
   ['发间多了一枚星形夹',59,16,16,14,'star-pin'],
   ['眼镜侧边多了一个金扣',69,52,13,13,'strap-stud'],
   ['毛衣多了一枚胸针',43,79,14,13,'wing-pin'],
   ['右侧星空多了一颗星',83,72,13,12,'star-pin']
  ]),
  additional(29,[
   ['头发少了一道亮纹',29,18,15,14,[34,11]],
   ['原有红色发饰旁多了一颗珠子',75,15,13,13,'pearl'],
   ['左边话筒杆多了一道箍',24,83,14,12,'tie-clip'],
   ['腰带多了一枚蝴蝶结',46,77,16,13,'ribbon'],
   ['右袖多了一枚小花',65,82,15,13,'flower-brooch']
  ]),
  additional(30,[
   ['街边的灯多亮了一格',6,20,13,14,[7,33]],
   ['头发多了一枚夹子',35,19,15,13,'hair-clip'],
   ['红机车多了一枚车标',20,74,14,13,'speaker-plate'],
   ['外套多了一枚布章',51,76,16,13,'shirt-patch'],
   ['后面的楼窗少亮了一格',84,35,12,12,[82,23]]
  ]),
  additional(31,[
   ['发间多了一枚蝴蝶结',26,23,16,14,'ribbon'],
   ['右边头发少了一道亮纹',74,25,14,14,[75,35]],
   ['耳饰多了一颗珠子',21,64,13,13,'pearl'],
   ['袖子多了一朵小花',39,77,14,13,'flower-brooch'],
   ['另一边袖口多了一颗扣子',63,83,15,12,'cuff-button']
  ])
 ];
 LEVELS.splice(0,16);
 function create(level=0){return {level:Number.isInteger(level)&&level>=0&&level<LEVELS.length?level:0,found:[],mistakes:0,remainingMs:LIMIT,elapsedMs:0,status:'playing',reason:null,paused:true,revives:0};}
 function pause(g){if(g.status==='playing')g.paused=true;}
 function resume(g){if(g.status==='playing')g.paused=false;}
 function spend(g,dt){if(!Number.isFinite(dt)||dt<0)return;const used=Math.min(g.remainingMs,dt);g.remainingMs-=used;g.elapsedMs+=used;}
 function lose(g,reason){g.status='lost';g.reason=reason;g.paused=true;}
 function tick(g,dt){if(g.status!=='playing'||g.paused)return;spend(g,dt);if(g.remainingMs<=0)lose(g,'time');}
 function hit(g,x,y,dt=0,tolerance=.015){
  if(g.status!=='playing'||g.paused||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return {kind:'ignored'};
  const before=g.remainingMs;spend(g,dt);
  if(Number.isFinite(dt)&&dt>before){lose(g,'time');return {kind:'ignored'};}
  const t=Number.isFinite(tolerance)?Math.max(0,Math.min(.015,tolerance)):.015;
  const index=LEVELS[g.level].regions.findIndex(r=>x>=r.x-t&&x<=r.x+r.w+t&&y>=r.y-t&&y<=r.y+r.h+t);
  if(index>=0){
   if(g.found.includes(index)){if(!g.remainingMs)lose(g,'time');return {kind:'duplicate',index};}
   g.found.push(index);
   if(g.found.length===5){g.status='won';g.paused=true;}
   else if(!g.remainingMs)lose(g,'time');
   return {kind:'found',index};
  }
  g.mistakes++;
  if(g.mistakes>=3)lose(g,'mistakes');else if(!g.remainingMs)lose(g,'time');
  return {kind:'wrong'};
 }
 function revive(g){if(g.status!=='lost'||g.revives>=2)return false;g.revives++;g.mistakes=0;g.remainingMs=Math.max(g.remainingMs,60000);g.status='playing';g.reason=null;g.paused=true;return true;}
 function emptyProgress(){return {unlocked:1,bests:{}};}
 function readProgress(raw){
  try{const p=typeof raw==='string'?JSON.parse(raw):raw;if(!p||!Number.isInteger(p.unlocked)||p.unlocked<1||p.unlocked>LEVELS.length||!p.bests||typeof p.bests!=='object'||Array.isArray(p.bests))return emptyProgress();
   const bests={};for(const key of Object.keys(p.bests)){const n=Number(key),value=p.bests[key];if(!Number.isInteger(n)||n<0||n>=LEVELS.length||!Number.isFinite(value)||value<0)return emptyProgress();bests[n]=value;}return {unlocked:p.unlocked,bests};
  }catch(_){return emptyProgress();}
 }
 function record(progress,g){const p=readProgress(progress);if(g.status!=='won')return p;p.unlocked=Math.max(p.unlocked,Math.min(LEVELS.length,g.level+2));p.bests[g.level]=Math.min(p.bests[g.level]??Infinity,g.elapsedMs);return p;}
 return {LIMIT,SAVE_KEY,LEVELS,create,pause,resume,tick,hit,revive,readProgress,record};
});
