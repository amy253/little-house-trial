(()=>{
 'use strict';
 const T=window.JiajiaTurtle,$=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let storage=null,game=null,paused=true,busy=false,epoch=0,choice=0,storageFailed=false,selected=[];
 try{storage=localStorage;game=T.restore(storage.getItem(T.SAVE_KEY));}catch(_){storageFailed=true;}
 const island=window.IslandRevive?.create({id:'jiajia-turtle'}),animations=new Set(),slots=[];
 for(let i=0;i<9;i++){const el=document.createElement('button');el.type='button';el.className='slot';el.addEventListener('click',()=>select(i));$('slots').append(el);slots.push(el);}
 function piece(color,tag=true){
  const c=T.COLORS[color],el=document.createElement('span');el.className='turtle-piece';el.style.setProperty('--hue',c.hue+'deg');el.style.setProperty('--color',c.hex);
  const img=document.createElement('img');img.src='assets/turtle/turtle.png';img.alt=c.name+'乌龟';img.draggable=false;el.append(img);
  if(tag){const mark=document.createElement('span');mark.className='color-tag';mark.textContent=c.mark;mark.setAttribute('aria-hidden','true');el.append(mark);el.dataset.lucky=String(color===game?.lucky);}
  return el;
 }
 function persist(){if(!game)return;try{if(!storage)throw Error();storage.setItem(T.SAVE_KEY,T.save(game));}catch(_){storageFailed=true;}}
 function feedback(text,reward=false){$('feedback').textContent=text;$('feedback').classList.toggle('reward',reward);}
 function paint(board=game?.board||Array(9).fill(null),bags=game?.bags||0){
  const options=game?.stage==='match'?T.moves(game):[],triple=options.find(m=>m.kind==='triple'),hinted=new Set(triple?.indices||[]),picked=game?T.selection(game,selected):null;
  const waitingTriple=picked?.kind==='pair'&&options.some(m=>m.kind==='triple'&&selected.every(i=>m.indices.includes(i)));
  slots.forEach((el,i)=>{
   el.classList.remove('revealed');el.replaceChildren();if(board[i]!==null)el.append(piece(board[i]));
   const number=document.createElement('span');number.className='slot-number';number.textContent=i+1;number.setAttribute('aria-hidden','true');el.append(number);
   el.dataset.empty=String(board[i]===null);el.disabled=!game||paused||busy||game.stage!=='match'||board[i]===null;
   el.classList.toggle('selected',selected.includes(i));el.classList.toggle('triple-hint',hinted.has(i));el.setAttribute('aria-pressed',String(selected.includes(i)));
   el.setAttribute('aria-label','第'+(i+1)+'格 '+(board[i]===null?'空位':T.COLORS[board[i]].name+'乌龟')+(hinted.has(i)?'，可三连':''));
  });
  $('combo-hint').textContent=triple?'三连提示：第'+triple.indices.map(i=>i+1).join('、')+'格 · 选3只加3袋':game?.stage==='match'?'点中两只同色，自动碰对':'先拆袋铺盘，同色暂时保留';
  $('combo-hint').classList.toggle('has-triple',!!triple);
  $('bags').textContent=game?bags:9;$('pairs').textContent=(game?.pairs||0)+(game?.triples||0);$('opened').textContent=game?.opened||0;$('best').textContent=game?.best||0;
  const lucky=game?.lucky??choice;$('wish-dot').style.background=T.COLORS[lucky].hex;$('wish-name').textContent=T.COLORS[lucky].name;
  $('open').disabled=!game||paused||busy||game.status!=='playing'||game.stage==='match'&&(!picked||waitingTriple);
  $('open-label').textContent=busy?'处理中…':game?.status==='lost'?'这轮拆完啦':game?.stage==='match'?(picked?.kind==='triple'?'三连碰！ +3袋':waitingTriple?'再选第3只':'点两只同色即碰'):game?.opened?'拆袋补空位':'拆袋铺盘';
  $('open-note').textContent=game?.stage==='match'?'两只自动碰 · 三连点按钮确认':'先补齐盘面，再由你点选乌龟';
  const counts=game?.collection||Array(8).fill(0);$('collected').textContent=counts.filter(n=>n>0).length+' / 8';
  $('mini-collection').replaceChildren();T.COLORS.forEach((_,i)=>{const el=piece(i,false);if(!counts[i])el.classList.add('unowned');$('mini-collection').append(el);});
 }
 function modal(mode,title,copy,label,action,canClose=false){
  $('overlay').dataset.mode=mode;$('modal-title').textContent=title;$('modal-copy').textContent=copy;
  $('modal-content').replaceChildren();$('revive-host').replaceChildren();$('modal-action').textContent=label;$('modal-action').onclick=action;
  $('storage-note').textContent=storageFailed?'浏览器暂时无法保存，本次仍可玩。':'';
  $('close').hidden=!canClose;$('overlay').hidden=false;$('game').inert=true;$('modal-action').focus({preventScroll:true});
 }
 function hideModal(){$('overlay').hidden=true;$('game').inert=false;}
 function cancelMotion(){epoch++;for(const a of animations)a.cancel();animations.clear();busy=false;selected=[];$('open').classList.remove('opening');$('gain').hidden=true;}
 function guide(){feedback(game?.stage==='match'?'点两只同色就碰；三连选3只再确认':'点下方拆袋，先把空位铺起来');}
 function resume(){hideModal();paused=false;paint();guide();if(!$('open').disabled)$('open').focus({preventScroll:true});else slots.find(el=>!el.disabled)?.focus({preventScroll:true});}
 function select(i){
  if(!game||paused||busy||game.stage!=='match'||game.board[i]===null)return;
  if(selected.includes(i))selected=selected.filter(n=>n!==i);
  else if(selected.length>=3||selected.length&&game.board[selected[0]]!==game.board[i])selected=[i];
  else selected.push(i);
  paint();const combo=T.selection(game,selected),third=T.moves(game).find(m=>m.kind==='triple'&&selected.length===2&&selected.every(n=>m.indices.includes(n)));
  if(combo?.kind==='pair'&&!third)return openBag();
  feedback(third?'再选第'+(third.indices.find(n=>!selected.includes(n))+1)+'格可凑三连，加3袋':combo?combo.kind==='triple'?'三连选好了，点下方“三连碰”':'两只选好了，点下方“碰一碰”':selected.length===3?'三连要横竖斜成直线，请重新选':selected.length?'再选一只同色；三连可以选3只':'点选同色乌龟，再点下方碰一碰',!!combo);
 }
 function results(){
  paused=true;
  modal('lost','这轮拆完啦',`拆开 ${game.opened} 袋，碰出 ${game.pairs} 对、${game.triples} 次三连。\n复活可补5袋，盘里的乌龟会保留。`,'再拆一轮 · 免费',choose);
  const score=document.createElement('div');score.className='round-result';score.innerHTML='<strong>'+(game.pairs+game.triples)+'</strong><span>组 · 最高 '+game.best+' 组</span>';$('modal-content').append(score);
  island?.offer($('revive-host'),()=>{
   if(!T.revive(game))return false;persist();hideModal();paused=false;paint();feedback('加回5袋，接着拆！',true);$('open').focus({preventScroll:true});return true;
  },()=>game?.status==='lost'&&$('overlay').dataset.mode==='lost');
 }
 function choose(){
  island?.hide();cancelMotion();paused=true;choice=game?.lucky??0;
  modal('choose','先选你的许愿色','先铺盘，点两只同色即碰；三连选3只确认。\n碰对 +1袋，三连 +3袋，清台 +5袋。','开始拆袋',()=>{
   game=T.create(choice,game);island?.reset(0);persist();resume();
  });
  const picker=document.createElement('div');picker.className='color-picker';picker.setAttribute('role','group');picker.setAttribute('aria-label','选择许愿色');
  T.COLORS.forEach((color,i)=>{
   const b=document.createElement('button');b.className='color-choice';b.type='button';b.style.setProperty('--hue',color.hue+'deg');b.setAttribute('aria-label',color.name);b.setAttribute('aria-pressed',String(i===choice));
   const art=piece(i,false);b.append(art.firstChild);const name=document.createElement('span');name.textContent=color.name;b.append(name);const mark=document.createElement('i');mark.textContent=color.mark;b.append(mark);
   b.addEventListener('click',()=>{choice=i;for(const [n,item]of [...picker.children].entries())item.setAttribute('aria-pressed',String(n===choice));});picker.append(b);
  });$('modal-content').append(picker);
 }
 function pauseMenu(){
  paused=true;cancelMotion();paint();persist();
 }
 function showHelp(){
  pauseMenu();island?.hide();
  modal('help','点两只就碰，三连先留着','点“拆袋铺盘”补满九宫格，再点选同色乌龟。袋子不足时，有可碰组合仍可继续。','知道了，继续拆',()=>game?.status==='lost'?results():game?resume():choose(),true);
  const list=document.createElement('ul');list.className='rules-list';
  for(const text of ['点选两只同色，自动碰掉加1袋，无需再按确认','如果这两只可组成三连，先保留，提示你点第3只','横竖斜三只同色成线：选3只后按“三连碰”，加3袋；金色描边会提示','盘中可碰的处理完，再拆奖励袋补空位','拆中许愿色加1袋，清台额外加5袋','没袋且没可碰组合才结束；每局两次比邻岛复活，各补5袋','收藏、最高记录和已用复活次数都保存在本机']){
   const li=document.createElement('li');li.textContent=text;list.append(li);
  }
  const credit=document.createElement('li'),link=document.createElement('a');link.textContent='乌龟素材：Microsoft Fluent Emoji · MIT';link.href='https://github.com/microsoft/fluentui-emoji';link.target='_blank';link.rel='noopener noreferrer';credit.append(link);list.append(credit);$('modal-content').append(list);
 }
 function showCollection(){
  pauseMenu();island?.hide();const counts=game?.collection||Array(8).fill(0);
  modal('collection','我的龟龟收藏','拆到就记入收藏，下一轮也会保留。','继续拆袋',()=>game?.status==='lost'?results():game?resume():choose(),true);
  const grid=document.createElement('div');grid.className='collection-grid';
  T.COLORS.forEach((c,i)=>{const el=document.createElement('div');el.className='collection-item';const art=piece(i,false);el.style.setProperty('--hue',c.hue+'deg');el.append(art.firstChild);const name=document.createElement('span');name.textContent=c.name;const count=document.createElement('b');count.textContent=counts[i]?'× '+counts[i]:'还没拆到';el.append(name,count);grid.append(el);});$('modal-content').append(grid);
 }
 async function motion(el,frames,duration,token){
  if(reduced.matches||token!==epoch||!el?.animate)return;
  const a=el.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});animations.add(a);
  try{await a.finished;}catch(_){}finally{animations.delete(a);}
 }
 async function openBag(){
  if(!game||paused||busy||game.status!=='playing')return;
  if(game.stage==='deal'){
   busy=true;selected=[];const token=++epoch;paint();$('open').classList.add('opening');
   while(game.stage==='deal'&&game.status==='playing'){
    const event=T.open(game);if(!event)break;
    persist();paint();slots[event.slot].classList.add('revealed');feedback('拆到了 · '+T.COLORS[event.color].name+(event.lucky?' · 许愿 +1袋':''),event.lucky);
    await motion(slots[event.slot].firstElementChild,[{opacity:0,transform:'translateY(16px) scale(.35)'},{opacity:1,transform:'translateY(0) scale(1)'}],190,token);
    if(token!==epoch)return;
   }
   busy=false;$('open').classList.remove('opening');paint();guide();if(game.status==='lost')results();return;
  }
  const before=[...game.board],event=T.match(game,selected);if(!event)return;
  busy=true;selected=[];const token=++epoch;persist();paint(before);
  const pieces=event.indices.map(i=>slots[i].firstElementChild),rects=pieces.map(el=>el.getBoundingClientRect());
  const x=rects.reduce((sum,r)=>sum+r.left+r.width/2,0)/rects.length,y=rects.reduce((sum,r)=>sum+r.top+r.height/2,0)/rects.length;
  await Promise.all(pieces.map((el,i)=>{
   const dx=x-rects[i].left-rects[i].width/2,dy=y-rects[i].top-rects[i].height/2;el.style.zIndex=10;
   return motion(el,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(1.08)`,opacity:1,offset:.65},{transform:`translate(${dx}px,${dy}px) scale(.2)`,opacity:0}],430,token);
  }));
  if(token!==epoch)return;
  paint();$('gain').textContent=(event.kind==='triple'?'三连！ ':'碰对！ ')+(event.cleared?'清台 ':'')+'+'+event.reward+'袋';$('gain').hidden=false;
  await motion($('gain'),[{opacity:0,transform:'translate(-50%,-30%) scale(.8)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.3},{opacity:0,transform:'translate(-50%,-80%) scale(1)'}],650,token);
  if(token!==epoch)return;
  busy=false;$('gain').hidden=true;paint();feedback((event.kind==='triple'?'三连 +3袋':'碰对 +1袋')+(event.cleared?' · 清台 +5袋':'')+(game.stage==='deal'?'，可以补空位了':'，继续选同色'),true);
  if(game.status==='lost')results();
 }
 $('open').addEventListener('click',openBag);$('help').addEventListener('click',showHelp);$('collection').addEventListener('click',showCollection);
 $('close').addEventListener('click',()=>{$('modal-action').click();});
 $('overlay').addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('close').hidden){e.preventDefault();$('modal-action').click();}
  if(e.key==='Tab'){
   const buttons=[...$('overlay').querySelectorAll('button,a')].filter(el=>!el.disabled&&el.getBoundingClientRect().height>0),i=buttons.indexOf(document.activeElement);
   if(e.shiftKey&&i<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0]?.focus();}
  }
 });
 function freeze(){
  if(!game)return;const showing=$('overlay').hidden;
  pauseMenu();if(!showing)return;
  if(game.status==='lost')results();else modal('resume','先歇一会儿','进度和加送盲袋都已保留。','继续拆袋',resume);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)freeze();});window.addEventListener('pagehide',freeze);window.addEventListener('blur',freeze);
 paint();
 if(game){
  island?.reset(game.revives);
  if(game.status==='lost')results();else modal('resume','接着上次拆','盘里的乌龟、剩余盲袋和复活次数都保留了。','继续拆袋',resume);
 }else choose();
})();
