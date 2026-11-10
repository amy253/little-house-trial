(function(root,factory){
 const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.IslandRevive=api;
})(typeof window==='object'?window:globalThis,function(root){
 'use strict';
 const URL='https://www.homielands.com/',WAIT=10000,LIMIT=2;
 function createState(){return {used:0,round:0,sequence:0,pending:null,consuming:false};}
 const remaining=s=>Math.max(0,LIMIT-s.used);
 function cancel(s){s.pending=null;s.sequence++;}
 function reset(s,used=0){cancel(s);s.used=Number.isInteger(used)&&used>=0&&used<=LIMIT?used:0;s.round++;s.consuming=false;}
 function begin(s,now){if(!remaining(s)||s.consuming||!Number.isFinite(now))return false;s.pending={awayAt:null,ready:false};s.sequence++;return true;}
 function leave(s,now){const p=s.pending;if(p&&!p.ready&&p.awayAt===null&&Number.isFinite(now))p.awayAt=now;}
 function returnVisit(s,now){
  const p=s.pending;if(!p)return {kind:'none'};if(p.ready)return {kind:'ready'};if(p.awayAt===null)return {kind:'not-left'};
  const elapsed=Number.isFinite(now)?Math.max(0,now-p.awayAt):0;
  if(elapsed<WAIT){p.awayAt=null;return {kind:'early',remainingMs:WAIT-elapsed};}
  p.ready=true;return {kind:'ready'};
 }
 function consume(s,restore){
  if(!s.pending?.ready||!remaining(s)||s.consuming)return false;
  const round=s.round,sequence=s.sequence;s.consuming=true;
  function settle(value){if(value!==true||s.round!==round||s.sequence!==sequence)return false;s.used++;cancel(s);return true;}
  function done(){if(s.round===round)s.consuming=false;}
  try{const result=restore();if(result&&typeof result.then==='function')return Promise.resolve(result).then(settle,()=>false).finally(done);const ok=settle(result);done();return ok;}
  catch(_){done();return false;}
 }
 function create(options={}){
  const doc=options.document||root.document,win=options.window||root,now=options.now||(()=>Date.now()),open=options.open||((url)=>win.open(url,'_blank','noopener,noreferrer'));
  const state=createState();let host=null,restore=null,guard=null,widget=null,note=null,button=null,retry=null,notice='';
  function valid(){try{return !!guard&&guard()===true;}catch(_){return false;}}
  function remove(){if(widget)widget.remove();widget=note=button=retry=null;}
  function hide(){remove();if(!state.consuming)cancel(state);notice='';}
  function safe(){if(valid())return true;hide();return false;}
  function render(){
   if(!host||!safe())return;
   if(!widget){
    widget=doc.createElement('section');widget.className='island-revive-widget';widget.setAttribute('aria-label','比邻岛复活机会');widget.dataset&&(widget.dataset.game=options.id||'game');
    note=doc.createElement('p');note.className='island-revive-note';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
    button=doc.createElement('button');button.type='button';button.className='island-revive-action';button.addEventListener('click',click);
    retry=doc.createElement('a');retry.href=URL;retry.target='_blank';retry.rel='noopener noreferrer';retry.className='island-revive-retry';retry.textContent='重新打开比邻岛 ↗';retry.addEventListener('click',event=>{event.preventDefault();if(!state.consuming)visit();});
    widget.appendChild(note);widget.appendChild(button);widget.appendChild(retry);
    widget.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')event.stopPropagation();});
    widget.addEventListener('click',event=>event.stopPropagation());
   }
   if(!host.contains(widget))host.appendChild(widget);
   const left=remaining(state);
   note.textContent=!left?'本局两次复活已用完，可以重新开始新的一局。':notice||`本局剩余 ${left} 次复活。去岛上说说话，离开游戏满10秒再回来。`;
   button.hidden=!left;button.disabled=state.consuming||!!state.pending&&!state.pending.ready;
   button.textContent=state.consuming?'准备继续…':state.pending?.ready?'复活继续 →':state.pending?'返回后再继续':'去云外比邻岛找家家说话';
   retry.hidden=!left||!state.pending||state.consuming;
  }
  function visit(){
   if(!safe()||!begin(state,now()))return;
   notice='离开游戏满10秒，再回到这里点“复活继续”。';render();
   try{open(URL);}catch(_){cancel(state);notice='暂时无法打开比邻岛，请再试一次；复活次数没有扣除。';render();}
  }
  function completed(ok){
   if(ok){notice='';remove();}else if(valid()){notice='暂时无法继续，请再试一次；复活次数没有扣除。';render();}
  }
  function click(){
   if(!safe()||state.consuming)return;
   if(!state.pending?.ready){if(!state.pending)visit();return;}
   const round=state.round,result=consume(state,()=>{if(!valid())return false;return restore();});
   if(result&&typeof result.then==='function'){render();result.then(ok=>{if(state.round===round)completed(ok);});}else completed(result);
  }
  function returned(){
   if(doc.hidden||!state.pending||state.consuming||!safe())return;
   const result=returnVisit(state,now());
   if(result.kind==='ready')notice='回来啦！点“复活继续”，这次复活才会扣除。';
   else if(result.kind==='early')notice=`离开还不到10秒，还差 ${Math.ceil(result.remainingMs/1000)} 秒；请重新打开比邻岛再去一次。`;
   render();
  }
  function departed(){if(state.pending&&safe())leave(state,now());}
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)departed();else returned();});
  win.addEventListener('blur',departed);win.addEventListener('focus',returned);
  win.addEventListener('pagehide',departed);win.addEventListener('pageshow',returned);
  return {
   reset(used=0){remove();reset(state,used);notice='';host=restore=guard=null;},hide,
   offer(nextHost,onRevive,isFailed){host=nextHost;if(host&&host.classList)host.classList.add('island-revive-host');restore=onRevive;guard=isFailed;render();},
   remaining:()=>remaining(state)
  };
 }
 return {URL,WAIT,LIMIT,createState,remaining,reset,cancel,begin,leave,returnVisit,consume,create};
});
