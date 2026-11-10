(function(){
 'use strict';
 const M=window.BuliMines,$=id=>document.getElementById(id),board=$('board'),records={},key='little-house-buli-mines-best-v1';
 const island=window.IslandRevive?.create({id:'buli-mines'});
 let s,buttons=[],mode='reveal',selected=0,pointer=null,pressTimer=null,ignore=null,helpFocus=null,finished=false,sound=false,audio=null,lastFrame=performance.now();
 try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const level of Object.keys(M.levels)){const v=saved&&saved[level];if(typeof v==='number'&&Number.isFinite(v)&&v>0)records[level]=v;}}catch(e){if(e.name!=='SyntaxError')$('storage-note').hidden=false;}
 const time=t=>{const v=Math.floor(t);return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');};
 function tone(kind){
  if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});const n=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(kind==='lost'?170:kind==='flag'?620:kind==='won'?820:480,n);o.frequency.exponentialRampToValueAtTime(kind==='lost'?70:kind==='won'?1200:350,n+.14);g.gain.setValueAtTime(.04,n);g.gain.exponentialRampToValueAtTime(.001,n+.18);o.connect(g);g.connect(audio.destination);o.start();o.stop(n+.2);}catch(_){/* Sound is optional. */}
 }
 function stopHold(){if(pressTimer!==null)clearTimeout(pressTimer);pressTimer=null;}
 function cancelTouch(suppress=false){stopHold();if(suppress&&pointer)ignore={index:pointer.index,until:performance.now()+700};pointer=null;}
 function select(i,focus=false){
  selected=i;buttons.forEach((b,j)=>{b.tabIndex=j===i?0:-1;b.classList.toggle('selected',j===i);});
  const c=s.cells[i],near=new Set(c.open&&c.number?M.neighbors(s,i):[]);buttons.forEach((b,j)=>b.classList.toggle('near',near.has(j)));
  if(c.open&&c.number){const f=M.neighbors(s,i).filter(j=>s.cells[j].flag).length;$('clue').textContent='数字 '+c.number+'：周围八格有 '+c.number+' 颗雷，已插 '+f+' 面旗。'+(f===c.number?'确定旗的位置正确后，再点数字展开。':'先判断位置，别随便点。');}
  else $('clue').textContent=c.flag?'这格已插旗，只是你的标记。再插一次可取消。':c.open?'这格周围没有雷，空区已自动展开。':'数字 = 周围八格藏着的雷数。点「看例子」可以看图解。';
  if(focus){buttons[i].focus();buttons[i].scrollIntoView({block:'nearest',inline:'nearest'});}
 }
 document.addEventListener('game-art-ready',()=>{const img=$('cat')?.querySelector('img');if(img&&window.GameArt?.spriteUrl('cat'))img.src=window.GameArt.spriteUrl('cat');render();});
 function setMode(v){mode=v;for(const [id,m]of [['reveal-mode','reveal'],['flag-mode','flag']]){$(id).classList.toggle('active',mode===m);$(id).setAttribute('aria-pressed',mode===m);}$('status').textContent=s.phase==='ready'?'点任意一格开始，第一下和周围八格都安全。':mode==='flag'?'插旗模式：点格子标记有雷，再点一次取消。':'翻格模式：点未标记的格子，或点数字快速展开。';}
 function render(){
  if(s.phase==='lost')island?.offer($('result'),()=>{if(!M.revive(s))return false;cancelTouch();ignore=null;finished=false;lastFrame=performance.now();render();buttons[selected].focus();return true;},()=>s.phase==='lost');else island?.hide();
  const end=s.phase==='lost'||s.phase==='won';
  buttons.forEach((b,i)=>{
   const c=s.cells[i],mine=end&&c.mine,wrong=s.phase==='lost'&&c.flag&&!c.mine;
   b.className='cell'+(c.open?' open':'')+(c.open&&c.number&&!c.mine?' n'+c.number:'')+(c.flag||s.phase==='won'&&c.mine?' flagged':'')+(mine&&s.phase!=='won'?' mine':'')+(wrong?' wrong':'')+(i===s.exploded?' exploded':'');
   const artName=mine&&s.phase==='lost'?'bomb':!c.open&&!wrong&&!c.flag&&!(s.phase==='won'&&c.mine)?'leaf':null,artSrc=artName&&window.GameArt?.spriteUrl(artName);
   if(artSrc){if(b.dataset.comicFace!==artName)b.innerHTML='<img class="'+(artName==='bomb'?'comic-mine':'comic-grass')+'" src="'+artSrc+'" alt="">';b.dataset.comicFace=artName;}
   else{delete b.dataset.comicFace;if(mine&&s.phase==='lost')b.innerHTML='<span class="mine-icon" aria-hidden="true"></span>';else if(wrong)b.textContent='×';else if(c.flag||s.phase==='won'&&c.mine)b.innerHTML='<span aria-hidden="true">⚑</span>';else b.textContent=c.open?(c.number||''):'';}
   let label='未翻开';if(c.flag)label='已插旗';if(c.open)label=c.mine?'踩到地雷':c.number?'数字 '+c.number:'空白';if(mine&&end)label='地雷';if(wrong)label='插错旗';
   b.setAttribute('aria-label','第'+(Math.floor(i/s.cols)+1)+'行第'+(i%s.cols+1)+'列，'+label);
   b.setAttribute('aria-disabled',s.phase==='paused'||end);
  });
  select(selected);$('flags-left').textContent=s.phase==='won'?0:s.mines-s.flags;$('opened').textContent=s.opened;$('total').textContent=s.cells.length-s.mines;$('timer').textContent=time(s.elapsed);$('best').textContent=records[s.level]?time(records[s.level]):'—';
  $('result').hidden=s.phase!=='paused'&&!end;$('pause').disabled=end;$('pause').setAttribute('aria-label',s.phase==='paused'?'继续游戏':'暂停游戏');$('pause').textContent=s.phase==='paused'?'▶':'Ⅱ';
  $('cat').className='cat-card '+s.phase;$('cabinet').classList.toggle('lost',s.phase==='lost');$('cabinet').classList.toggle('won',s.phase==='won');
  if(s.phase==='paused'){$('result-title').textContent='卟哩歇一会儿';$('result-copy').textContent='棋盘和计时都已暂停。准备好了再继续。';$('result-action').textContent='继续扫雷 →';$('cat-caption').textContent='歇一会儿，脑袋更清楚。';}
  else if(end){
   $('result-title').textContent=s.phase==='won'?'安全清扫成功！':'哎呀，这格有雷';$('result-copy').textContent=s.phase==='won'?s.name+' · '+time(s.elapsed)+' · 所有安全格都找到了。':'一踩到雷，这局就结束了。再来一局，换个地方开始。';$('result-action').textContent='再来一局 →';$('cat-caption').textContent=s.phase==='won'?'太棒啦！给你一个小猫贴贴。':'卟哩吓了一跳，再陪你试一次。';$('status').textContent=s.phase==='won'?'安全格全部翻开，这局赢了！':'灰色圆点是雷，× 表示插错的旗。';
  }else $('cat-caption').textContent=mode==='flag'?'认真标记，卟哩帮你盯着。':'别急着点，先看看数字。';
 }
 function resultRecord(){if(s.phase==='won'&&!finished){finished=true;const t=Math.max(.001,s.elapsed);if(!records[s.level]||t<records[s.level]){records[s.level]=t;try{localStorage.setItem(key,JSON.stringify(records));}catch(_){$('storage-note').hidden=false;}}}else if(s.phase==='lost')finished=true;}
 function act(i,flagging=false){
  if(!Number.isInteger(i)||!s.cells[i]||!$('help').hidden||s.phase==='paused'||s.phase==='won'||s.phase==='lost')return;
  const wasOpen=s.cells[i].open,changed=flagging?M.flag(s,i):M.reveal(s,i);selected=i;
  if(changed){resultRecord();tone(s.last.type);render();if(s.phase==='won'||s.phase==='lost')$('result-action').focus();else if(s.phase==='playing')$('status').textContent=flagging?'旗子是判断，不是答案；确定后再展开周围。':'看数字判断下一步，翻开所有安全格就赢。';}
  else{select(i);if(flagging&&s.flags>=s.mines&&!s.cells[i].flag)$('status').textContent='旗子已经用完；取消一面，再标记新位置。';else if(!flagging&&s.cells[i].flag)$('status').textContent='这格插着旗，先取消旗子才能翻开。';else if(wasOpen)$('status').textContent='快速展开需要周围旗数与数字相同，而且旗的位置要正确。';}
 }
 function fresh(){
  island?.reset();cancelTouch();ignore=null;finished=false;selected=0;s=M.create($('difficulty').value);$('difficulty').value=s.level;buttons=Array.from({length:s.cells.length},(_,i)=>{const b=document.createElement('button');b.type='button';b.dataset.index=String(i);return b;});board.replaceChildren(...buttons);board.className='board '+s.level;board.style.setProperty('--cols',s.cols);board.style.setProperty('--base-cell',s.level==='easy'?'46px':s.level==='medium'?'40px':'32px');$('board-scroll').scrollLeft=0;$('scroll-note').hidden=s.level==='easy';setMode('reveal');lastFrame=performance.now();render();
 }
 const indexOf=e=>{const b=e.target.closest('[data-index]');return b?Number(b.dataset.index):-1;};
 board.addEventListener('click',e=>{const i=indexOf(e);if(ignore&&i===ignore.index&&performance.now()<ignore.until&&e.detail!==0){ignore=null;return;}act(i,mode==='flag');});
 board.addEventListener('contextmenu',e=>{
  e.preventDefault();const i=indexOf(e),held=pointer&&pointer.index===i&&pointer.held,touch=e.pointerType==='touch'||pointer&&pointer.type==='touch';
  if(held||ignore&&ignore.index===i&&performance.now()<ignore.until){stopHold();if(pointer)pointer.held=true;return;}
  if(touch&&pointer&&pointer.index===i){stopHold();pointer.held=true;ignore={index:i,until:performance.now()+700};act(i,true);return;}
  cancelTouch(touch);act(i,true);
 });
 board.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary)return;cancelTouch();const i=indexOf(e);if(i<0)return;select(i);const token=pointer={index:i,x:e.clientX,y:e.clientY,id:e.pointerId,type:e.pointerType,dragged:false,held:false};
  pressTimer=setTimeout(()=>{if(pointer===token&&!token.dragged){token.held=true;act(i,true);ignore={index:i,until:performance.now()+700};}},450);
 });
 function pointerMove(e){if(pointer&&e.pointerId===pointer.id&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>10){pointer.dragged=true;if(pressTimer!==null)clearTimeout(pressTimer);pressTimer=null;}}
 function pointerUp(e){if(pointer&&e.pointerId===pointer.id){const suppress=pointer.dragged||pointer.held;cancelTouch(suppress);}}
 for(const surface of [board,document]){surface.addEventListener('pointermove',pointerMove);surface.addEventListener('pointerup',pointerUp);surface.addEventListener('pointercancel',()=>cancelTouch(true));}
 board.addEventListener('keydown',e=>{
  if(s.phase==='paused'||!$('help').hidden)return;const from=indexOf(e);if(from<0)return;const x=from%s.cols,y=Math.floor(from/s.cols),moves={ArrowLeft:y*s.cols+Math.max(0,x-1),ArrowRight:y*s.cols+Math.min(s.cols-1,x+1),ArrowUp:Math.max(0,y-1)*s.cols+x,ArrowDown:Math.min(s.rows-1,y+1)*s.cols+x};
  if(moves[e.key]!==undefined){e.preventDefault();select(moves[e.key],true);}else if(e.key.toLowerCase()==='f'){e.preventDefault();act(from,true);}else if(e.key==='Enter'||e.key===' '){e.preventDefault();act(from,mode==='flag');}
 });
 $('reveal-mode').addEventListener('click',()=>{cancelTouch();setMode('reveal');render();});$('flag-mode').addEventListener('click',()=>{cancelTouch();setMode('flag');render();});
 $('restart').addEventListener('click',fresh);$('difficulty').addEventListener('change',fresh);
 function pause(){cancelTouch(true);if(M.pause(s))render();}
 function resume(){cancelTouch();M.resume(s);lastFrame=performance.now();render();buttons[selected].focus();}
 $('pause').addEventListener('click',()=>{if(s.phase==='paused')resume();else pause();});$('result-action').addEventListener('click',()=>{if(s.phase==='paused')resume();else{fresh();buttons[0].focus();}});
 $('help-open').addEventListener('click',()=>{helpFocus=document.activeElement;pause();$('help').hidden=false;$('help-close').focus();});
 function closeHelp(){$('help').hidden=true;render();if(helpFocus&&helpFocus.focus)helpFocus.focus();}
 $('help-close').addEventListener('click',closeHelp);
 document.addEventListener('keydown',e=>{if(!$('help').hidden){if(e.key==='Escape'){e.preventDefault();closeHelp();}else if(e.key==='Tab'){e.preventDefault();$('help-close').focus();}}else if(e.key==='Escape'){e.preventDefault();pause();}});
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 $('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent='音效：'+(sound?'开':'关');$('sound').setAttribute('aria-pressed',sound);if(sound)tone('open');});
 function frame(now){const dt=Math.max(0,(now-lastFrame)/1000);lastFrame=now;M.tick(s,dt);$('timer').textContent=time(s.elapsed);requestAnimationFrame(frame);}
 fresh();requestAnimationFrame(frame);
})();
