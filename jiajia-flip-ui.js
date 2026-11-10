(function(){
  'use strict';
  const F=window.JiajiaFlip,$=id=>document.getElementById(id);
  const island=window.IslandRevive?.create({id:'jiajia-flip'});
  let records,storageOK=true,g,last=performance.now(),winHandled=false,modalKind='',opener=null,buttons=[];
  const time=ms=>{const sec=Math.floor(ms/1000);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;};
  function storageNote(){
    $('storage-note').textContent=storageOK?'最好纪录保存在当前浏览器 · 每档独立':'纪录未保存：存档不可用或已损坏，本局仍可正常玩。';
    $('storage-note').className=storageOK?'storage-note':'storage-note warning';
  }
  try{const parsed=F.parseRecords(localStorage.getItem(F.STORAGE_KEY));records=parsed.records;storageOK=parsed.ok;}
  catch(_){records=F.parseRecords(null).records;storageOK=false;}
  function sync(){const now=performance.now();F.tick(g,Math.max(0,now-last));last=now;}
  function render(){
    $('moves').textContent=Math.max(0,g.flipLimit-g.flips);
    $('elapsed').textContent=time(g.elapsed);
    $('pairs').textContent=`${g.matched} / ${g.pairs}`;
    $('progress').style.width=`${100*g.matched/g.pairs}%`;
    const best=records[g.pairs];
    $('best').textContent=best?`${best.moves*2} 次 · ${time(best.time)}`:'等你留下第一份纪录';
    $('pause').textContent=g.phase==='lost'?'查看失败 / 复活':g.phase==='paused'?'▶ 继续游戏':'Ⅱ 暂停';
    $('pause').disabled=g.phase==='won';
    g.cards.forEach((card,i)=>{
      const button=buttons[i],visible=card.revealed||card.matched;
      const mode=visible?(card.matched?'matched':'open'):'back';
      button.className=`card ${mode}`;
      button.disabled=card.matched;
      button.setAttribute('aria-disabled',String(g.phase==='paused'||g.phase==='won'||g.phase==='lost'||g.remaining>0||card.revealed));
      button.setAttribute('aria-label',`第 ${i+1} 张，${visible?F.ASSETS[card.picture].name+(card.matched?'，已配对':'，已翻开'):'未翻开'}`);
      if(button.dataset.mode!==mode){
        button.dataset.mode=mode;
        if(visible){
          const img=document.createElement('img');img.src=F.ASSETS[card.picture].src;img.alt='';img.draggable=false;
          const mark=document.createElement('span');mark.className='card-mark';mark.textContent=card.matched?'✓':String(i+1).padStart(2,'0');mark.setAttribute('aria-hidden','true');
          button.replaceChildren(img,mark);
        }else{
          const paw=window.GameArt?.spriteUrl('paw'),flower=document.createElement(paw?'img':'span');flower.className='card-flower';if(paw){flower.src=paw;flower.alt='';}else flower.textContent='✿';flower.setAttribute('aria-hidden','true');
          const number=document.createElement('span');number.className='card-number';number.textContent=String(i+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
          button.replaceChildren(flower,number);
        }
      }
    });
  }
  document.addEventListener('game-art-ready',()=>{buttons.forEach(b=>delete b.dataset.mode);render();});
  function message(text){$('status').textContent=text;}
  function closeDialog(){
    island?.hide();
    $('dialog').hidden=true;modalKind='';
    if(opener&&typeof opener.focus==='function')opener.focus();
    if(g.phase==='paused')message('已暂停。点「继续游戏」后再翻牌。');
  }
  function showDialog(kind,title,copy,action){
    island?.hide();opener=kind==='won'||kind==='loss'?$('restart'):document.activeElement;modalKind=kind;
    $('dialog-title').textContent=title;$('dialog-copy').textContent=copy;$('dialog-action').textContent=action;
    $('dialog').hidden=false;$('dialog-action').focus();
  }
  function start(){
    island?.reset();
    if(!$('dialog').hidden)closeDialog();
    g=F.create(Number($('difficulty').value));winHandled=false;last=performance.now();
    buttons=g.cards.map((_,i)=>{
      const button=document.createElement('button');button.type='button';
      button.addEventListener('click',()=>{
        if(!$('dialog').hidden)return;
        sync();if(g.phase==='lost'){lose();render();return;}const result=F.flip(g,i);
        if(result==='ignored')return;
        if(result==='first')message('记住这张家家，再翻一张看看。');
        if(result==='match')message('是一对！把这份小可爱留在相册里。');
        if(result==='mismatch')message('这两张不一样，记住位置，稍等就盖回。');
        if(result==='won')win();
        if(result==='lost')lose();
        render();
      });return button;
    });
    $('board').replaceChildren(...buttons);render();message('翻开第一张，开始收集家家的小瞬间。');
  }
  function win(){
    if(winHandled)return;winHandled=true;
    const improved=F.updateRecord(records,g);
    if(improved){
      try{localStorage.setItem(F.STORAGE_KEY,JSON.stringify(records));storageOK=true;}
      catch(_){storageOK=false;}
      storageNote();
    }
    const line=improved?(storageOK?'新纪录已收好。':'新纪录留在本次页面，暂时无法保存。'):'这次也把所有家家找齐啦。';
    message(`全部配对完成！${g.flips} 次翻开 · ${time(g.elapsed)}`);
    showDialog('won','相册收集完成',`找齐 ${g.pairs} 对家家，翻开 ${g.flips} 张，用时 ${time(g.elapsed)}。\n${line}\n想再翻一册吗？`,'再翻一册 →');
  }
  function lose(force=false){
    if(g.phase!=='lost'||(winHandled&&!force))return;winHandled=true;
    message(`翻开次数用完了，已配好 ${g.matched} / ${g.pairs} 对。可以复活或重新翻一册。`);
    showDialog('loss','翻开次数用完啦',`这一册已经翻开 ${g.flips} 张，找齐了 ${g.matched} / ${g.pairs} 对。\n去比邻岛找家家说话，回来后可复活，每次补 8 次翻开，已配好的照片会保留。每局最多复活 2 次。`,'重新翻一册 →');
    const failedGame=g;
    const valid=()=>g===failedGame&&g.phase==='lost'&&modalKind==='loss'&&!$('dialog').hidden;
    island?.offer($('dialog'),()=>{
      if(!valid()||!F.revive(g))return false;
      winHandled=false;last=performance.now();closeDialog();render();message('复活成功，补了 8 次翻开，已配好的照片保留。点「继续游戏」再翻牌。');return true;
    },valid);
  }
  function freeze(copy){
    sync();F.pause(g);last=performance.now();render();
    if(g.phase==='paused')message(copy);
  }
  function continueGame(){
    if(document.hidden)return;
    if(g.phase==='lost'||g.phase==='won'){closeDialog();return;}
    closeDialog();last=performance.now();F.resume(g);render();message('慢慢来，接着找相同的两张。');
  }
  $('restart').addEventListener('click',start);
  $('difficulty').addEventListener('change',start);
  $('pause').addEventListener('click',()=>{
    if(g.phase==='lost')lose(true);else if(g.phase==='paused')continueGame();else freeze('已经暂停，回来时点「继续游戏」。');
  });
  $('help-open').addEventListener('click',()=>{
    freeze('查看玩法时游戏已暂停。');
    showDialog('help','翻翻乐 · 玩法','每次翻两张，相同就留在相册里；不同在 0.85 秒后盖回。\n每翻开一张消耗 1 次：6 / 8 / 10 对分别有 24 / 32 / 40 次。用完还没找齐就失败，最后一次刚好配齐仍算通关。\n每局可去比邻岛找家家说话复活 2 次，每次补 8 次翻开，保留已配好的照片。\n第一张翻开后才计时，没有时间限制。暂停、查看玩法或切到后台会停住计时。Tab 选卡，Enter 或空格翻牌。','知道啦');
  });
  $('dialog-close').addEventListener('click',closeDialog);
  $('dialog-action').addEventListener('click',()=>{if(modalKind==='won'||modalKind==='loss')start();else continueGame();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)freeze('已切到后台，游戏暂停。回来后点「继续游戏」。');});
  window.addEventListener('blur',()=>freeze('窗口失去焦点，游戏暂停。点「继续游戏」接着玩。'));
  document.addEventListener('keydown',event=>{
    if($('dialog').hidden)return;
    if(event.key==='Escape'){event.preventDefault();closeDialog();}
    if(event.key==='Tab'){
      event.preventDefault();
      const nodes=[$('dialog-close'),$('dialog-action'),...Array.from($('dialog').querySelectorAll?.('.island-revive-widget button, .island-revive-widget a')||[]).filter(b=>!b.disabled&&!b.hidden)];
      const index=nodes.indexOf(document.activeElement);nodes[(index+(event.shiftKey?-1:1)+nodes.length)%nodes.length].focus();
    }
  });
  start();storageNote();
  function frame(){sync();if(g.phase==='lost'&&modalKind!=='help')lose();render();requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();
