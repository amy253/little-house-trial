(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else{
  const script=root.document.currentScript;
  root.MobileScreen=factory();
  root.MobileScreen.protectTouch(root.document);
  if(!script?.hasAttribute('data-touch-only'))root.MobileScreen.mount();
 }
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function protectTouch(doc){
  if(doc.getElementById('site-touch-guard'))return;
  const style=doc.createElement('style');
  style.id='site-touch-guard';
  style.textContent=`
   :where(*) {
    touch-action: manipulation;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
   }
   :where(input, textarea, select, [contenteditable]:not([contenteditable="false"]),
     [contenteditable]:not([contenteditable="false"]) *) {
    -webkit-user-select: text;
    user-select: text;
    -webkit-touch-callout: default;
   }`;
  doc.head.append(style);
  const protect=(event)=>{
   const target=event.target;
   if(target?.isContentEditable||target?.closest?.('input,textarea,select'))return;
   event.preventDefault();
  };
  doc.addEventListener('selectstart',protect);
  doc.addEventListener('dblclick',protect);
 }
 function fit({width,height,chrome,ratio}){
  width=Math.max(0,width);height=Math.max(1,height);chrome=Math.max(0,chrome);ratio=Math.max(.1,ratio);
  const boardWidth=Math.min(width,Math.max(Math.min(120,width),(height-chrome)/ratio));
  return {boardWidth,scale:Math.min(1,height/Math.max(1,chrome+boardWidth*ratio))};
 }
 function shouldFit({width,height,homeVisible=false,gardenVisible=false}){return(width<=900||(height<=600&&width<=1200))&&!homeVisible&&!gardenVisible;}
 function pauseCurrent(main){
  const pause=[...main.querySelectorAll('#pause,#pause-button,#stars-pause,#merge-pause,#kitchen-pause')].find(e=>{
   const r=e.getBoundingClientRect(),label=e.textContent+' '+e.getAttribute('aria-label')+' '+e.title;
   return !e.disabled&&r.width>0&&r.height>0&&!e.closest('[hidden]')&&!/[▶▷]|继续/.test(label)&&/暂停|Ⅱ/.test(label);
  });
  if(pause)pause.click();
 }
 function isolateKeys(event){event.stopPropagation();}
 function mount(){
  const main=document.querySelector('main');if(!main)return;
  const root=main.closest('.page-shell')||main,home=document.getElementById('home-view');
  const garden=document.getElementById('flower-view'),page=location.pathname.split('/').pop(),records=[];
  const extraSelectors=[
   'main > .intro:not(:has(h1))','main > .subtitle','main > .arcade-intro',
   'main > .footnote','main > .storage-note','main > .lake-footnote',
   'main > .save-note:not(#bait-summary)','main > .keyboard-note',
   'main > footer:not(:has(button))','main > .record','main > .leaderboard',
   '.little-notes','.collection-area','.notebook','.lake-companion',
   '.score-section','.upgrades','.how-to','.cabinet-bottom','.fine-controls',
   '.adventure-goal','.task-stages',
   '.match3-intro','.stars-intro','.merge-intro','.merge-chain','.game>div>footer',
   '.cat-card','.guide:not(:has(.dpad,.direction-pad))'
  ];
  if(home)extraSelectors.push('main > aside.intro');
  if(page==='buli-2048.html')extraSelectors.push('.guide-card > :not(.direction-pad)');
  if(page==='buli-mines.html')extraSelectors.push('main aside','.clue');
  if(page==='buli-roll.html')extraSelectors.push('.motion-panel');
  if(page==='buli-pacman.html')extraSelectors.push('.side>.mission','.side>.legend','.side>.tips','.cabinet-footer');
  const extras=[...main.querySelectorAll(extraSelectors.join(','))].filter(e=>
   !e.closest('[role="dialog"]')&&!e.parentElement.closest(extraSelectors.join(',')));
  const button=document.createElement('button');button.type='button';button.className='screen-more';
  button.hidden=true;
  button.textContent='更多 / 说明';button.setAttribute('aria-haspopup','dialog');
  const drawer=document.createElement('dialog');drawer.className='screen-drawer';
  drawer.setAttribute('aria-label','游戏说明、纪录与收藏');
  const close=document.createElement('button');close.type='button';close.textContent='返回游戏 ×';
  close.className='screen-drawer-close';const contents=document.createElement('div');
  contents.className='screen-drawer-content '+main.className;
  drawer.append(close,contents);document.body.append(button,drawer);
  button.addEventListener('click',()=>{
   pauseCurrent(main);
   document.dispatchEvent(new CustomEvent('mobile-screen-drawer',{detail:{open:true}}));
   drawer.showModal();close.focus();
  });
  close.addEventListener('click',()=>drawer.close());
  drawer.addEventListener('close',()=>{document.dispatchEvent(new CustomEvent('mobile-screen-drawer',{detail:{open:false}}));button.focus({preventScroll:true});});
  drawer.addEventListener('keydown',isolateKeys);drawer.addEventListener('keyup',isolateKeys);
  drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)drawer.close();}});
  let active=false,queued=false,lastSignature='';
  function restore(){
   for(const {element,placeholder} of records){placeholder.replaceWith(element);}records.length=0;
   root.classList.remove('one-screen-root');document.body.classList.remove('one-screen-game');
   root.style.removeProperty('zoom');root.style.removeProperty('--screen-height');
   for(const e of root.querySelectorAll('.one-screen-board')){e.classList.remove('one-screen-board');e.style.removeProperty('--screen-board-width');e.style.removeProperty('--screen-board-aspect');}
   button.hidden=true;if(drawer.open)drawer.close();active=false;
  }
  function refresh(){
   queued=false;
   const viewport=window.visualViewport,viewWidth=viewport?.width||innerWidth,viewHeight=viewport?.height||innerHeight;
   const signature=[viewWidth,viewHeight,document.fonts?.status,home?.hidden,document.documentElement.classList.contains('home-pagination-active'),
    [...main.querySelectorAll('[hidden]')].map(e=>e.id||e.className).join('|'),
    [...main.querySelectorAll('.status,.hint,.tip,.fishing-hint,#motion-status,[data-mode]')].map(e=>e.textContent+'|'+e.dataset.mode).join('|'),
    [...main.querySelectorAll('details')].map(e=>e.open).join('|'),
    [...main.querySelectorAll('.board,.memory-stage,.code-stage,#history')].map(e=>e.childElementCount).join('|')].join(';');
   if(signature===lastSignature)return;lastSignature=signature;
   const enabled=shouldFit({width:viewWidth,height:viewHeight,homeVisible:home&&!home.hidden,gardenVisible:garden&&!garden.hidden});
   if(!enabled){if(active)restore();return;}
   if(!active){
    for(const element of extras){const placeholder=document.createComment('mobile auxiliary content');element.before(placeholder);contents.append(element);records.push({element,placeholder});}
    root.classList.add('one-screen-root');document.body.classList.add('one-screen-game');active=true;
   }
   button.hidden=records.length===0;
   root.style.zoom='1';
   root.style.setProperty('--screen-height',viewHeight+'px');
   // Floating controls no longer reserve a footer; CSS fills the play viewport.
   if(document.body.classList.contains('floating-game'))return;
   const canvas=[...root.querySelectorAll('canvas')].find(e=>e.getBoundingClientRect().width>0);
   let board=canvas?(canvas.parentElement.matches('.canvas-wrap,.scene-wrap,.arcade-frame,.stage,.scene-shell,.fly-stage,.hop-stage,.arena,.map-wrap,.kitchen-stage,.scene,.board,.playfield')?canvas.parentElement:canvas):
    [...root.querySelectorAll('#board,#scene,#claw-stage,.match3-board,.memory-stage,.code-stage')].find(e=>e.getBoundingClientRect().width>0);
   for(const e of root.querySelectorAll('.one-screen-board')){e.classList.remove('one-screen-board');e.style.removeProperty('--screen-board-width');e.style.removeProperty('--screen-board-aspect');}
   let r=root.getBoundingClientRect();
   const safe=getComputedStyle(document.body),available=Math.max(1,viewHeight-parseFloat(safe.paddingTop||0)-parseFloat(safe.paddingBottom||0)-8);
   if(board){
    const b=board.getBoundingClientRect(),ratio=b.height/Math.max(1,b.width);
    const size=fit({width:b.width,height:available,chrome:r.height-b.height,ratio});
    board.style.setProperty('--screen-board-width',size.boardWidth+'px');
    board.style.setProperty('--screen-board-aspect',String(1/Math.max(.1,ratio)));
    board.classList.add('one-screen-board');
    // Columns share height; measure the layout instead of adding both columns.
    let low=0,high=b.width;
    for(let i=0;i<8;i++){
     const candidate=(low+high)/2;board.style.setProperty('--screen-board-width',candidate+'px');
     if(root.getBoundingClientRect().height<=available)low=candidate;else high=candidate;
    }
    board.style.setProperty('--screen-board-width',Math.max(Math.min(120,b.width),low)+'px');
   }
   r=root.getBoundingClientRect();
   let scale=Math.min(1,available/Math.max(1,r.height),(viewWidth-8)/Math.max(1,r.width));
   root.style.zoom=String(scale);
   // Zoom can reflow text; check the actual size after scaling.
   for(let i=0;i<4;i++){
    r=root.getBoundingClientRect();
    const correction=Math.min(1,available/Math.max(1,r.height),(viewWidth-8)/Math.max(1,r.width));
    if(correction>=.999)break;
    scale*=correction;root.style.zoom=String(scale);
   }
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(refresh);}}
  window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
  window.addEventListener('orientationchange',schedule);window.addEventListener('load',schedule);
  const observer=new MutationObserver(schedule);
  observer.observe(main,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','data-mode','open']});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  document.fonts?.ready.then(schedule);schedule();
 }
 return {fit,shouldFit,mount,pauseCurrent,isolateKeys,protectTouch};
});
