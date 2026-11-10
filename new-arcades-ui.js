(()=>{'use strict';
  const type=document.body.dataset.game,$=id=>document.getElementById(id),score=$('score'),best=$('best'),tip=$('tip'),panel=$('panel'),title=$('panel-title'),description=$('panel-text');let game=null,active=false,runId=0;
  const island=window.IslandRevive?.create({id:'arcade-'+type});let onRevive=()=>{};
  const api={memory:window.BuliMemory,code:window.FanCode}[type];const key='little-house-best-'+type;let onStart=()=>{};
  function readBest(){try{return Number(localStorage.getItem(key))||0}catch{return 0}}function saveBest(){if(game.score>readBest()){try{localStorage.setItem(key,String(game.score))}catch{}}best.textContent=readBest()}
  function showEnd(){active=false;saveBest();title.textContent={memory:'记忆挑战结束',code:'暗号还差一点'}[type];description.textContent=`本次得分 ${game.score}，最高纪录 ${readBest()}。再试一次吧！`;panel.hidden=false;$('start').textContent='再玩一次';const failed=game;island?.offer(panel.querySelector?.('.panel-card')||panel,()=>{if(game!==failed||!api.revive(game))return false;runId++;active=true;panel.hidden=true;island?.hide();refresh();onRevive();return true;},()=>game===failed&&game.status==='lost');}
  function refresh(){score.textContent=game.score;saveBest();if(type==='memory'){$('length').textContent=game.sequence.length;$('round').textContent=game.score+1;}if(type==='code'){$('round').textContent=game.round;$('remaining').textContent=game.attemptLimit-game.attempts;}if(game.status==='lost'&&active)showEnd();}
  function start(){runId++;game=api.create();island?.reset();active=true;panel.hidden=true;tip.textContent={memory:'看清亮起顺序',code:'选择四个图案后提交'}[type];refresh();onStart();}
  $('start').addEventListener('click',start);$('restart').addEventListener('click',start);best.textContent=readBest();
  if(type==='memory'){
    const pads=[...document.querySelectorAll('[data-pad]')];let accepting=false;
    const padArt=['star',null,'flower','heart'];
    function paintPads(){pads.forEach((pad,i)=>{const url=padArt[i]&&window.GameArt?.spriteUrl(padArt[i]);if(!url||!pad.style)return;pad.style.setProperty('--pad-art',`url("${url}")`);pad.classList.add('comic-pad');});}
    paintPads();document.addEventListener?.('game-art-ready',paintPads);
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const setAccepting=value=>{accepting=value;pads.forEach(pad=>pad.disabled=!value);};
    async function playSequence(id){
      if(id!==runId||!active)return;
      setAccepting(false);pads.forEach(pad=>pad.classList.remove('flash'));
      const sequence=[...game.sequence],tempo=api.playback(game);
      tip.textContent=`第 ${game.score+1} 关 · 看清 ${sequence.length} 步顺序`;
      await wait(550);if(id!==runId||!active)return;
      for(const n of sequence){
        pads[n].classList.add('flash');await wait(tempo.flash);
        if(id!==runId||!active)return;
        pads[n].classList.remove('flash');await wait(tempo.gap);
        if(id!==runId||!active)return;
      }
      setAccepting(true);tip.textContent=game.position?`已保留 ${game.position} 步，从第 ${game.position+1} 步继续`:`轮到你！按顺序点 ${sequence.length} 次`;
    }
    onStart=()=>playSequence(runId);onRevive=()=>playSequence(runId);
    pads.forEach((pad,i)=>pad.addEventListener('click',()=>{
      if(!active||!accepting)return;
      const id=runId;pad.classList.add('flash');setTimeout(()=>{if(id===runId)pad.classList.remove('flash');},180);
      const result=api.input(game,i);refresh();
      if(result==='round'){setAccepting(false);tip.textContent='记对了！下一关多一步';setTimeout(()=>playSequence(id),600);}
      else if(result==='correct')tip.textContent=`已输入 ${game.position} / ${game.sequence.length}`;
      else setAccepting(false);
    }));
  }
  if(type==='code'){
    const symbols=['★','♥','☾','✿','◆','♫'];let selection=Array(4).fill(null),selected=0;const slots=$('slots'),choices=$('choices'),history=$('history');onStart=()=>{selection=Array(4).fill(null);selected=0;renderCode()};
    onRevive=()=>{renderCode();tip.textContent="暗号和记录已保留，继续猜吧";};
    const symbolArt=['star','heart',null,'flower','blueGem','music'];
    function symbol(node,index){const url=symbolArt[index]&&window.GameArt?.spriteUrl(symbolArt[index]);if(!url)return;const img=document.createElement('img');img.className='comic-symbol';img.src=url;img.alt='';img.setAttribute('aria-hidden','true');node.textContent='';node.appendChild(img);}
    document.addEventListener?.('game-art-ready',()=>renderCode());
    function renderCode(){if(!game)return;slots.innerHTML='';for(let i=0;i<4;i++){const b=document.createElement('button');b.className='slot'+(i===selected?' selected':'');b.textContent=selection[i]===null?'＋':symbols[selection[i]];if(selection[i]!==null)symbol(b,selection[i]);b.setAttribute('aria-label',`第 ${i+1} 格${selection[i]===null?'，空':`，${symbols[selection[i]]}，点此清空`}`);b.setAttribute('aria-pressed',String(i===selected));b.addEventListener('click',()=>{if(!active)return;selection[i]=null;selected=i;tip.textContent=`第 ${i+1} 格已选中，选下方图案填入`;renderCode()});slots.appendChild(b)}choices.innerHTML='';for(let i=0;i<game.pool;i++){const b=document.createElement('button');b.className='choice';b.textContent=symbols[i];symbol(b,i);b.setAttribute('aria-label',`选择${symbols[i]}`);b.addEventListener('click',()=>{if(!active)return;if(selected<0)selected=selection.indexOf(null);if(selected<0){tip.textContent='点上面要修改的那一格，再选图案';return;}selection[selected]=i;selected=selection.indexOf(null);tip.textContent=selected<0?'四格已填满，可以提交；点任意一格可修改':`接着填第 ${selected+1} 格`;renderCode()});choices.appendChild(b)}history.innerHTML='';for(const row of game.history){const item=document.createElement('div');item.className='history-row';const code=document.createElement('span'),feedback=document.createElement('small');code.textContent=row.answer.map(n=>symbols[n]).join(' ');if(window.GameArt){code.textContent='';row.answer.forEach(n=>{const chip=document.createElement('span');chip.textContent=symbols[n];symbol(chip,n);code.appendChild(chip);});}feedback.textContent=`位置对 ${row.exact} · 位置错 ${row.misplaced}`;item.append(code,feedback);history.appendChild(item)}}
    $('submit').addEventListener('click',()=>{if(!active)return;if(selection.some(value=>value===null)){tip.textContent='请先填满四个位置';return;}const result=api.guess(game,selection);if(!result)return;if(result.solved){tip.textContent='破译成功！下一题来了';selection=Array(4).fill(null);selected=0}else tip.textContent=`图案和位置都对：${result.exact} 个；图案对但位置错：${result.misplaced} 个。点上面的格子修改后再猜。`;renderCode();refresh()});
  }
})();
