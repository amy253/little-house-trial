(function(){
  'use strict';
  const G=window.BuliTug,$=id=>document.getElementById(id),canvas=$('scene'),c=canvas.getContext('2d'),key='little-house-buli-tug-v1';
  const island=window.IslandRevive?.create({id:'buli-tug'});island?.reset();
  let save=G.readSave(null);try{save=G.readSave(JSON.parse(localStorage.getItem(key)));}catch(_){}
  let state=G.create(0,{tutorial:!save.learned}),last=0,finished=false,pointer=null,keyboard=false,muted=false,audio=null,lastBurst=0,lastPhase='',cueKey='',visualTime=0,resultDelay=0,lastGuide=state.guide;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const standing=new Image();window.GameArt?.bind?window.GameArt.bind(standing,'catStanding'):standing.src='buli-hop-standing.png';
  function sound(kind){if(muted)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio??=new AC();if(audio.state==='suspended')audio.resume();const n=audio.currentTime;const tones=kind==='win'?[523,659,784]:kind==='burst'?[330,660]:kind==='lose'?[220,165]:[110];tones.forEach((f,i)=>{const o=audio.createOscillator(),v=audio.createGain();o.type=kind==='pull'?'triangle':'sine';o.frequency.setValueAtTime(f,n+i*.1);o.frequency.exponentialRampToValueAtTime(f*.85,n+i*.1+.16);v.gain.setValueAtTime(.035,n+i*.1);v.gain.exponentialRampToValueAtTime(.001,n+i*.1+.19);o.connect(v);v.connect(audio.destination);o.start(n+i*.1);o.stop(n+i*.1+.2);});}catch(_){}
  }
  function persist(){try{localStorage.setItem(key,JSON.stringify(save));}catch(_){$('storage-note').hidden=false;}}
  function release(){pointer=null;keyboard=false;G.hold(state,false);$('pull').classList.toggle('is-held',false);$('pull').setAttribute('aria-pressed','false');}
  function input(on){G.hold(state,on);$('pull').classList.toggle('is-held',state.held);$('pull').setAttribute('aria-pressed',String(state.held));if(on)sound('pull');}
  function choose(level,practice){island?.reset();release();state=G.create(level,{tutorial:practice===true||!save.learned});finished=false;last=0;lastBurst=0;lastPhase='';cueKey='';resultDelay=0;lastGuide=state.guide;refreshRounds();sync();}
  function refreshRounds(){$('rounds').replaceChildren();G.opponents.forEach((o,i)=>{const b=document.createElement('button');b.type='button';const n=document.createElement('b');n.textContent=String(i+1).padStart(2,'0');const text=document.createElement('span');text.textContent=i>save.unlocked?'未解锁':o.name;b.append(n,text);b.disabled=i>save.unlocked||state.status==='playing';b.setAttribute('aria-current',String(i===state.level));b.setAttribute('aria-label',(i+1)+' · '+o.name+(i>save.unlocked?'，未解锁':''));b.onclick=()=>{if(i<=save.unlocked&&state.status!=='playing')choose(i);};$('rounds').append(b);});}
  function start(){G.start(state);last=0;refreshRounds();sync();sound('pull');}
  function pause(){release();G.pause(state);last=0;refreshRounds();sync();}
  function resume(){release();G.resume(state);last=0;refreshRounds();sync();}
  $('action').onclick=()=>{if(state.status==='paused')resume();else if(state.status==='ready')start();else if(state.status==='won'){choose(Math.min(5,state.level+1));start();}else{choose(state.level);start();}};
  $('retry').onclick=()=>{choose(state.level);start();};
  $('teach').onclick=()=>{if(state.status!=='playing'){choose(state.level,true);start();}};
  $('pause').onclick=()=>state.status==='playing'?pause():state.status==='paused'?resume():null;
  $('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'音效：关':'音效：开';$('sound').setAttribute('aria-pressed',String(muted));};
  $('pull').addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false||state.status!=='playing'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;try{$('pull').setPointerCapture(pointer);}catch(_){}input(true);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])$('pull').addEventListener(name,e=>{if(e.pointerId===pointer){pointer=null;input(keyboard);}});
  $('pull').addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('keydown',e=>{if(e.repeat)return;if(e.target.closest&&e.target.closest('input,textarea,select,summary,a'))return;if(e.code==='KeyP'||e.key==='Escape'){if(state.status==='playing'||state.status==='paused'){e.preventDefault();state.status==='playing'?pause():resume();}}else if(e.code==='Space'){if(e.target.closest&&e.target.closest('button')&&e.target!==$('pull'))return;if(state.status==='playing'){e.preventDefault();keyboard=true;input(true);}}});
  document.addEventListener('keyup',e=>{if(e.code==='Space'){keyboard=false;input(pointer!==null);}});
  window.addEventListener('blur',()=>{if(state.status==='playing')pause();else release();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state.status==='playing')pause();else release();}});
  function settle(){if(finished)return;finished=true;resultDelay=1.2;release();if(state.status==='won'){save.unlocked=Math.max(save.unlocked,Math.min(5,state.level+1));save.best[state.level]=save.best[state.level]===null?state.time:Math.min(save.best[state.level],state.time);persist();sound('win');}else sound('lose');refreshRounds();}
  function sync(){
    $('pause').setAttribute('aria-label',state.status==='paused'?'继续游戏':'暂停游戏');
    $('pause').textContent=state.status==='paused'?'▶':'Ⅱ';
    if(state.status==='lost'&&resultDelay<=0)island?.offer($('panel'),()=>{if(!G.revive(state))return false;release();finished=false;resultDelay=0;last=0;lastBurst=state.bursts;lastPhase=state.phase;cueKey='';refreshRounds();sync();$('pull').focus({preventScroll:true});return true;},()=>state.status==='lost');else island?.hide();
    const o=G.opponents[state.level],cue=G.cue(state);$('rival').textContent=o.name;$('round-title').textContent=state.guide>=0?'先试三步 · 不会输':o.title;$('round-hint').textContent=o.hint;$('time').textContent=state.guide>=0?'练习中':state.time.toFixed(1)+' 秒';$('best').textContent=save.best[state.level]===null?'—':save.best[state.level].toFixed(1)+'s';
    $('marker').style.left=(50-state.position*45)+'%';$('track').setAttribute('aria-valuenow',String(Math.round(state.position*100)));$('track').setAttribute('aria-valuetext','猫条向卟哩一侧 '+Math.round(state.position*100)+'%');
    $('energy').value=state.stamina;$('energy-label').textContent=Math.round(state.stamina)+'%';$('energy').classList.toggle('low',state.stamina<30);$('effort').textContent=state.exhausted>0?'累了！松手歇一歇':state.held?'发力中 · 体力正在减少':'松手就能恢复';$('pull').disabled=state.status!=='playing'||state.guide===3;$('pause').disabled=state.status!=='playing'&&state.status!=='paused';$('teach').disabled=state.status==='playing';
    const guided=state.guide>=0&&state.status==='playing',windowOpen=G.counterWindow(state)||guided&&state.guide===2;
    $('counter-window').hidden=!windowOpen;$('counter-fill').style.width=(guided?100:Math.max(0,1-state.phaseTime/.85)*100)+'%';$('counter-label').textContent=guided?'等你按下 · 一把抢回':'抢拉机会 · 趁现在按下';
    $('combo').textContent=state.combo>0?'✦ 连续抢拉 '+state.combo+' 次':'抢拉 '+state.bursts+' 次';$('guide-label').textContent=guided?'亲手试 '+Math.min(3,state.guide+1)+' / 3 步':'连着抓准，会拉得更远';
    $('pull').setAttribute('data-kind',cue.action==='release'?'pull':cue.kind);$('pull-title').textContent=cue.action==='release'?'松手！先别拉':cue.action==='press'?'现在按下，抢一把！':'按住，拉猫条';$('pull-tip').textContent=cue.action==='release'?'松开按钮，卟哩会蹲稳恢复':cue.action==='press'?'抓到机会，比一直按更有劲':'拉到左边，猫条归卟哩';
    $('coach').hidden=state.status!=='playing';$('coach').setAttribute('data-kind',cue.kind);$('coach-title').textContent=cue.title;$('coach-tip').textContent=guided?cue.tip:cue.action==='release'?'松开下面的按钮':cue.action==='press'?'按下下面的按钮':'按住下面的按钮';
    const nextCue=cue.kind+cue.title+cue.tip;if(nextCue!==cueKey){$('cue').setAttribute('data-kind',cue.kind);$('cue-title').textContent=cue.title;$('cue-tip').textContent=cue.tip;cueKey=nextCue;}
    $('panel').hidden=state.status==='playing'||resultDelay>0;$('retry').hidden=state.status!=='won';$('panel-tag').textContent=String(state.level+1).padStart(2,'0')+' · '+o.name;
    if(state.status==='paused'){$('panel-title').textContent='猫条先别松开';$('panel-copy').textContent='比赛已暂停，体力和位置都保留。';$('action').textContent='继续抢猫条 →';}
    else if(state.status==='won'){$('panel-title').textContent=state.level===5?'卟哩就是猫条大王！':'猫条归卟哩啦！';$('panel-copy').textContent=state.time.toFixed(1)+' 秒抢到 · '+state.bursts+' 次抢拉 · 最高 '+state.bestCombo+' 连击'+(state.level===5?' · 全部拿下':' · 下一只猫已解锁');$('action').textContent=state.level===5?'再挑战猫条大王 →':'挑战 '+G.opponents[state.level+1].name+' →';}
    else if(state.status==='lost'){$('panel-title').textContent='它把猫条抢走了';$('panel-copy').textContent=state.overworks?'卟哩累趴了 '+state.overworks+' 次。红色猛拉时松手，绿色喘气时按住，再试试！':'红色时松手蹲稳，绿色时再按住，把猫条拉回来。';$('action').textContent='再抢一次 →';}
    else{$('panel-title').textContent=state.guide>=0?'先亲手试三步':'帮卟哩抢到猫条';$('panel-copy').textContent=state.guide>=0?'按住试试 → 松手喘气 → 趁它累了抢一把。练习不会输，做一次就懂。':'把猫条拉到左边。它猛拉就松手，开始喘气就按下抢回来！';$('action').textContent=state.guide>=0?'先试试怎么玩 →':'开始抢猫条 →';}
  }
  function ellipse(x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function box(x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function line(x1,y1,x2,y2,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function background(){
    if(window.GameArt?.scene(c,'wood',0,0,640,420)){ellipse(320,357,265,49,'#fff0cbcc');return;}
    let g=c.createLinearGradient(0,0,0,420);g.addColorStop(0,'#e7d5b6');g.addColorStop(.68,'#efdfc5');g.addColorStop(1,'#c29970');c.fillStyle=g;c.fillRect(0,0,640,420);
    // Sunlit window, plants and the little snack shelf form a quiet, warm room.
    box(229,-16,183,220,75,'#b7986f');box(240,-13,160,208,65,'#e5eee3');g=c.createLinearGradient(240,0,400,198);g.addColorStop(0,'#bad4cd');g.addColorStop(1,'#faf3d1');c.fillStyle=g;c.fillRect(248,49,144,141);line(320,2,320,191,'#c8ae89',8);line(245,107,396,107,'#c8ae89',8);
    ellipse(348,64,21,21,'#fff5ca');box(234,190,176,13,5,'#ae895f');c.fillStyle='#d0bf9f';c.beginPath();c.moveTo(415,80);c.lineTo(605,303);c.lineTo(170,303);c.closePath();c.globalAlpha=.2;c.fill();c.globalAlpha=1;
    box(42,49,102,88,8,'#b48d64');box(48,55,90,76,4,'#f8edce');c.fillStyle='#b88655';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('抢吃俱乐部',93,83);c.font='10px sans-serif';c.fillText('一口也不让',93,107);ellipse(73,117,3,3,'#c88865');ellipse(113,117,3,3,'#c88865');
    box(462,145,134,11,4,'#a7815b');for(let i=0;i<3;i++){box(473+i*36,114,27,29,4,['#c39175','#97a68c','#d6b663'][i]);c.fillStyle='#fff0d3';c.font='9px sans-serif';c.fillText('猫条',486+i*36,132);}
    box(60,229,38,64,11,'#9b8664');line(77,236,76,169,'#829176',4);for(let i=0;i<5;i++)ellipse(70+(i%2?17:-5),183+i*10,13,6,'#7f9779');
    line(0,295,640,295,'#c3a57c',5);box(0,299,640,121,0,'#cea881');for(let i=0;i<8;i++)line(0,310+i*18,640,310+i*18,'#b9885d55',1);for(let i=0;i<8;i++)line(i*90,300,(i-1)*108,420,'#a7785050',1);
    ellipse(320,357,265,49,'#b47a5345');ellipse(320,354,251,43,'#e7cb9e');ellipse(320,354,233,34,'#d8b587');c.setLineDash([3,6]);c.strokeStyle='#a98058';c.lineWidth=2;c.beginPath();c.ellipse(320,354,241,38,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
    box(516,277,69,33,14,'#9b9c7c');box(521,274,61,27,13,'#b3b397');box(25,293,73,33,11,'#d69b82');box(31,288,60,28,10,'#e8b5a0');
    c.globalAlpha=.28;ellipse(320,359,2,2,'#78553b');c.globalAlpha=1;
  }
  function vectorCat(x,foot,right,pose){
    c.save();c.translate(x,foot);if(right)c.scale(-1,1);const tired=pose===2,lean=pose===1?-.07:0;c.rotate(lean);
    // Fallback art is drawn locally only if the generated sheet is unavailable.
    const coat=[['#fff7e7','#cdb89b','#c79964'],['#f5d8a1','#c58c4f','#a56a36'],['#cbd2d1','#939c98','#667872'],['#f9e8d4','#c89f7b','#805f49'],['#d7c0a1','#937453','#705c45'],['#8c8e88','#505e59','#394e48']][right?state.level:0];
    let fur=c.createRadialGradient(-15,-130,10,0,-125,85);fur.addColorStop(0,coat[0]);fur.addColorStop(1,coat[1]);
    c.strokeStyle=coat[2];c.lineWidth=23;c.lineCap='round';c.beginPath();c.moveTo(-37,-40);c.bezierCurveTo(-104,-32,-103,-103,-74,-122);c.stroke();
    ellipse(-21,-20,22,16,'#d8c3a5');ellipse(25,-18,24,15,'#ded0b7');ellipse(0,-88,55,81,fur);ellipse(9,-86,31,59,'#faf2de');
    for(const ex of [-35,36]){c.fillStyle='#d2ac7d';c.beginPath();c.moveTo(ex-19,-196);c.lineTo(ex-14,-251);c.lineTo(ex+24,-218);c.closePath();c.fill();c.fillStyle='#d0a6a0';c.beginPath();c.moveTo(ex-10,-207);c.lineTo(ex-10,-240);c.lineTo(ex+13,-218);c.closePath();c.fill();}
    ellipse(0,-193,64,55,fur);ellipse(7,-172,36,23,'#fff9e8');ellipse(7,-220,23,20,coat[2]);
    if(right&&state.level>0){c.save();c.beginPath();c.ellipse(0,-193,64,55,0,0,Math.PI*2);c.clip();for(let i=0;i<3;i++){line(-39,-220+i*11,-20,-212+i*11,coat[2],4);line(42,-217+i*10,55,-224+i*10,coat[2],4);}c.restore();}
    for(const ex of [-24,29]){if(tired){line(ex-12,-194,ex+12,-190,'#594536',4);}else{ellipse(ex,-195,18,21,'#5b4d38');ellipse(ex,-195,15,18,'#c7ac49');ellipse(ex+3,-195,8,14,'#27332a');ellipse(ex+7,-202,4,5,'#fff8df');}}
    ellipse(9,-173,6,4,'#ab796a');line(9,-170,9,-166,'#926d61',1.6);line(9,-166,3,-164,'#926d61',1.6);line(9,-166,15,-165,'#926d61',1.6);
    for(let i=0;i<3;i++){line(-14,-168+i*6,-65,-171+i*10,'#fff7e0',1.2);line(27,-169+i*6,72,-174+i*10,'#fff7e0',1.2);}
    c.restore();
  }
  function drawCat(x,foot,right,pose,effort){
    ellipse(x,foot+1,49,9,'#72523430');
    c.save();c.translate(x,foot);const wiggle=reduced?0:effort?Math.sin(visualTime*31)*.016:Math.sin(visualTime*2)*.006;c.rotate((right?1:-1)*(pose===1?.08:0)+wiggle);
    if(!right&&window.GameArt?.draw(c,'cat',-91,-275,182,275)){if(pose===2){line(-20,-167,5,-163,'#6e5942',4);line(21,-167,42,-163,'#6e5942',4);}}else if(!right&&standing.complete&&standing.naturalWidth){c.drawImage(standing,0,10,996,1504,-91,-275,182,275);
      if(pose===2||!reduced&&visualTime%6>5.85){line(7,-228,20,-224,'#80745a',5);line(31,-218,44,-213,'#80745a',5);}
      if(pose===1){line(8,-239,20,-233,'#403b30',2);line(33,-229,43,-230,'#403b30',2);}
      if(pose===2&&!reduced){const breath=visualTime%1.4;ellipse(76+breath*13,-202-breath*8,3+breath*5,2+breath*3,'#fff4dd80');}
    }
    else vectorCat(0,0,right,pose);
    c.restore();
  }
  function arms(x,foot,right,gripY,effort,gripX){const d=right?-1:1,bodyX=x+d*25,end=gripX===undefined?x+d*80:gripX;const fur=c.createLinearGradient(0,gripY-15,0,gripY+20);fur.addColorStop(0,right?'#f9efdb':'#b1a184');fur.addColorStop(1,right?'#b4a68d':'#6b6853');line(bodyX,foot-127,end-d*6,gripY+6,fur,19);line(bodyX,foot-144,end-d*4,gripY-6,fur,17);if(!right){for(let i=0;i<4;i++){const px=bodyX+(end-bodyX)*(i+1)/5;line(px,gripY-5,px-2,gripY+5,'#403e32',3);}for(let i=0;i<12;i++){const px=bodyX+(end-bodyX)*i/12;line(px,gripY+(i%3)-4,px+2,gripY+(i%3)+2,'#c4b49688',.7);}}ellipse(end,gripY+4,13,11,fur);ellipse(end-d*2,gripY-6,12,10,fur);for(let i=0;i<3;i++)line(end+(i-1)*4,gripY+6,end+(i-1)*4,gripY+10,'#645b4e88',1);}
  function snack(x,y,win){c.save();c.translate(x,y);c.rotate(reduced?0:Math.sin(visualTime*18)*(state.held?.035:.01));let g=c.createLinearGradient(-50,-8,50,10);g.addColorStop(0,'#b7484f');g.addColorStop(.5,'#e68782');g.addColorStop(1,'#ae414b');box(-52,-11,104,22,5,g);for(let i=0;i<4;i++){line(-50+i*2,-9,-50+i*2,9,'#f4a198',1);line(44+i*2,-9,44+i*2,9,'#f4a198',1);}c.fillStyle='#fff8df';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('猫 条',0,4);c.restore();if(win&&!reduced){for(let i=0;i<9;i++){const a=visualTime*2+i*.8,r=40+(i%3)*13;ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,2,4,['#e1b057','#c76b56','#88a485'][i%3]);}}}
  function draw(){c.save();if(state.burst>0&&!reduced&&state.guide<0)c.translate(Math.sin(visualTime*43)*2,Math.cos(visualTime*38));background();const packet=320-state.position*106,foot=354,left=216-state.position*31,right=424-state.position*31;const active=state.status==='playing',pulling=active&&state.held&&state.exhausted<=0,rivalPull=active&&state.phase==='pull',sleepy=state.exhausted>0,win=state.status==='won',lose=state.status==='lost';
    const leftPose=sleepy||lose?2:pulling?1:0,rightPose=win||active&&state.phase==='rest'?2:rivalPull?1:0;
    drawCat(left,foot,false,leftPose,pulling);drawCat(right,foot,true,rightPose,rivalPull);
    const y=225+(reduced?0:pulling||rivalPull?Math.sin(visualTime*20)*2:0);
    if(win){const bite=reduced?0:Math.sin(visualTime*13)*2;arms(left,foot,false,157+bite,false);snack(left+60,156+bite,true);ellipse(left+12,151,2,2,'#cf786b');}
    else if(lose){arms(right,foot,true,181,false);snack(right-50,180,false);}
    else{line(packet-42,y,packet+42,y,'#8b6952',3);snack(packet,y,false);arms(left,foot,false,y,pulling,packet-33);arms(right,foot,true,y,rivalPull,packet+33);}
    c.textAlign='center';c.font='bold 11px sans-serif';c.fillStyle='#7c6048';c.fillText('卟哩',left,390);c.fillText(G.opponents[state.level].name,right,390);
    if(active){const cue=G.cue(state),color=cue.kind==='pull'?'#b85050':cue.kind==='rest'?'#4a846a':cue.kind==='charge'?'#b28a40':'#a58a70';box(right-35,35,70,26,13,'#fff9e8eb');c.fillStyle=color;c.font='bold 11px sans-serif';c.fillText(state.phase==='pull'?'猛拉！':state.phase==='rest'?'喘口气…':state.phase==='charge'?'蓄力中':state.phase==='feint'?'嘿，骗你的':'盯——',right,52);
      if(state.burst>0){c.strokeStyle='#fff3c3';c.lineWidth=3;for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=22+(1-state.burst/.9)*20;c.beginPath();c.moveTo(packet+Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(packet+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12));c.stroke();}box(left-52,foot-8,104,27,12,'#fff7df');c.fillStyle='#58845d';c.font='bold 15px sans-serif';c.fillText(state.combo>1?state.combo+' 连击！':'一把抢回！',left,foot+10);}if(sleepy){c.fillStyle='#ba6554';c.font='bold 13px sans-serif';c.fillText('累趴了…',left,60);}
      if((pulling||rivalPull)&&!reduced){for(let i=0;i<3;i++){const dust=(visualTime*3+i/3)%1;ellipse((pulling?left-36:right+36)+(pulling?-1:1)*dust*35,foot-4-dust*9,5-dust*3,2,'#d6bc9666');}}
    }c.restore();
  }
  function frame(now){const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;if(!reduced&&state.status!=='paused')visualTime+=dt;resultDelay=Math.max(0,resultDelay-dt);G.tick(state,dt);if(lastGuide>=0&&state.guide<0){release();if(!save.learned){save.learned=true;persist();}sound('burst');}lastGuide=state.guide;if(state.bursts>lastBurst){lastBurst=state.bursts;sound('burst');}if(state.phase!==lastPhase){lastPhase=state.phase;if(state.phase==='pull'&&state.status==='playing')sound('pull');}if(state.status==='won'||state.status==='lost')settle();sync();draw();requestAnimationFrame(frame);}
  refreshRounds();sync();draw();requestAnimationFrame(frame);
})();
