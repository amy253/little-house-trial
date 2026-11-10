(()=>{
  const island=window.IslandRevive?.create({id:'buli-snake'});
  function reviveIsland(){if(!BuliSnake.revive(g))return false;active=true;paused=false;last=performance.now();elapsed=0;previous=g.body.map(p=>({...p}));particles=[];pointer=null;$('overlay').hidden=true;$('pause').textContent='暂停';sync();island?.hide();canvas.focus();return true;}
  function offerIsland(){if(g.status==='lost')island?.offer($('start').parentElement,reviveIsland,()=>g.status==='lost');else island?.hide();}
  const $=id=>document.getElementById(id),canvas=$('snake'),ctx=canvas.getContext('2d'),cat=new Image();window.GameArt?.bind?window.GameArt.bind(cat,'catHead'):cat.src='merge-tier-1.png';
  let g=BuliSnake.create(),active=false,paused=false,last=0,elapsed=0,previous=g.body.map(p=>({...p})),particles=[],pointer=null,best=0;
  try{best=Number(localStorage.getItem('buli-snake-best'))||0;}catch{}
  function sync(){$('score').textContent=g.score;$('length').textContent=g.body.length;$('best').textContent=Math.max(best,g.score);$('speed').textContent=g.score<6?'慢慢走':g.score<18?'小跑起来':'越来越快';}
  function start(){island?.reset();g=BuliSnake.create();previous=g.body.map(p=>({...p}));active=true;paused=false;elapsed=0;particles=[];$('overlay').hidden=true;$('pause').textContent='暂停';sync();}
  function turn(d){if(active&&!paused)BuliSnake.turn(g,d);}
  function end(){active=false;best=Math.max(best,g.score);try{localStorage.setItem('buli-snake-best',best);}catch{}$('title').textContent=g.status==='full'?'卟哩吃满花园啦':'卟哩撞到了';$('description').textContent=`吃到 ${g.score} 份点心，长度 ${g.body.length}。留出转弯空间，再来一次！`;$('start').textContent='再试一次';$('overlay').hidden=false;sync();offerIsland();}
  function drawHead(x,y){
    if(window.GameArt?.draw(ctx,'catHead',x-20,y-18,40,36))return;
    if(!cat.complete||!cat.naturalWidth)return;
    ctx.save();ctx.translate(x-21,y-18);ctx.scale(42/1070,36/915);ctx.translate(-90,-65);
    ctx.beginPath();ctx.moveTo(170,355);ctx.bezierCurveTo(185,220,180,70,250,70);ctx.bezierCurveTo(315,70,400,130,470,182);ctx.bezierCurveTo(565,165,700,165,790,182);ctx.bezierCurveTo(850,140,965,65,1015,70);ctx.bezierCurveTo(1080,75,1070,250,1085,355);ctx.bezierCurveTo(1180,445,1200,700,1120,810);ctx.bezierCurveTo(1010,945,810,980,625,980);ctx.bezierCurveTo(415,980,230,940,140,810);ctx.bezierCurveTo(65,700,85,465,170,355);ctx.closePath();ctx.clip();
    ctx.drawImage(cat,0,0,1254,1254);ctx.restore();
  }
  function draw(time){ctx.fillStyle='#eaf0e4';ctx.fillRect(0,0,432,486);for(let y=0;y<18;y++)for(let x=0;x<16;x++){ctx.fillStyle=(x+y)%2?'#f9edcf':'#bdcfa4';ctx.fillRect(x*27+1,y*27+1,25,25);
      if((x+y*3)%31===0){ctx.save();ctx.globalAlpha=.17;window.GameArt?.draw(ctx,'paw',x*27+7,y*27+7,13,13);ctx.restore();}}const t=Math.min(1,elapsed/BuliSnake.interval(g));
    for(let i=g.body.length-1;i>=0;i--){
      const p=g.body[i],old=previous[i]||p,x=(old.x+(p.x-old.x)*t)*27+13.5,y=(old.y+(p.y-old.y)*t)*27+13.5;
      if(i===0){drawHead(x,y);continue;}
      ctx.save();ctx.translate(x,y);
      if(i===g.body.length-1){
        const before=g.body[i-1];ctx.rotate(Math.atan2(p.y-before.y,p.x-before.x));
        ctx.strokeStyle='#302419';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-7,0);ctx.quadraticCurveTo(1,7,9,0);ctx.stroke();
        ctx.strokeStyle='#897052';ctx.lineWidth=6;ctx.stroke();
      }else{
        const fur=ctx.createRadialGradient(-4,-5,1,0,0,12);fur.addColorStop(0,'#ae9570');fur.addColorStop(1,'#796247');ctx.fillStyle=fur;ctx.strokeStyle='#34281d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,11.5,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.strokeStyle='#fff1cb';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-1,-1,8,Math.PI,Math.PI*1.6);ctx.stroke();
        ctx.strokeStyle='#403326';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(-3,-4);ctx.moveTo(0,-10);ctx.lineTo(0,-6);ctx.moveTo(7,-7);ctx.lineTo(3,-4);ctx.stroke();
      }
      ctx.restore();
    }
    if(g.food){const x=g.food.x*27+13.5,y=g.food.y*27+13.5;ctx.save();ctx.translate(x,y);ctx.scale(1+Math.sin(time/200)*.08,1+Math.sin(time/200)*.08);if(!window.GameArt?.draw(ctx,'candy',-11,-11,22,22)){ctx.fillStyle='#d98999';ctx.strokeStyle='#775441';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff4e3';ctx.beginPath();ctx.arc(-3,-3,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();}
    for(const p of particles){ctx.globalAlpha=p.life/.6;ctx.fillStyle='#dc9aac';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.strokeStyle='#8e6744';ctx.lineWidth=7;ctx.strokeRect(3.5,3.5,425,479);ctx.strokeStyle='#e9c990';ctx.lineWidth=2;ctx.strokeRect(5.5,5.5,421,475);
  }
  function frame(time){const dt=Math.min(.04,(time-last)/1000||0);last=time;if(active&&!paused){elapsed+=dt;if(elapsed>=BuliSnake.interval(g)){elapsed-=BuliSnake.interval(g);previous=g.body.map(p=>({...p}));const event=BuliSnake.step(g);if(event==='eat'){for(let i=0;i<12;i++)particles.push({x:g.body[0].x*27+13.5,y:g.body[0].y*27+13.5,vx:(Math.random()-.5)*100,vy:(Math.random()-.5)*100,life:.6});sync();}if(g.status!=='playing')end();}}for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);draw(time);requestAnimationFrame(frame);}
  canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.max(Math.abs(dx),Math.abs(dy))<14)return;turn(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');pointer={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
  window.addEventListener('keydown',e=>{const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(d){e.preventDefault();turn(d);}});
  function pause(){if(!active)return;paused=!paused;$('pause').textContent=paused?'继续':'暂停';$('status').textContent=paused?'已暂停，点继续再玩':'↑ ↓ ← → 滑动转向 · 电脑也可以用方向键';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)pause();});$('start').onclick=start;$('restart').onclick=start;$('pause').onclick=pause;sync();requestAnimationFrame(frame);
})();
