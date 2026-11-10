(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TouchJoystick=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function create({element,thumb,onChange,enabled=()=>true,analog=false,axis='both'}){
  const doc=element.ownerDocument,win=doc?.defaultView,zone=doc?.body||element,floating=zone!==element;
  let owner=null,origin=null,current={x:0,y:0,direction:null};
  if(floating){
   element.closest('.touch-pad,.stick-control,.pad')?.classList.add('floating-pad');
   element.classList.add('floating-stick');element.setAttribute('tabindex','-1');
   zone.classList.add('floating-game');zone.append(element);
  }
  function send(value){const changed=value.direction!==current.direction||analog&&(value.x!==current.x||value.y!==current.y);current=value;if(changed)onChange(value);}
  function reset(){const id=owner;owner=origin=null;if(floating)element.classList.toggle('floating-active',false);thumb.style.transform='translate(0%, 0%)';send({x:0,y:0,direction:null});if(id!==null)try{zone.releasePointerCapture(id);}catch(_){} }
  function refresh(){element.disabled=!enabled();if(element.disabled)reset();}
  function slide(e){
   const r=element.getBoundingClientRect();if(!r.width||!r.height)return;
   let x=floating?(e.clientX-origin.x)/96:(e.clientX-r.left)/r.width*2-1,y=floating?(e.clientY-origin.y)/96:(e.clientY-r.top)/r.height*2-1;
   if(axis==='forward'){x=Math.max(0,x);y=0;}
   const mag=Math.hypot(x,y),limit=Math.max(1,mag);x/=limit;y/=limit;
   if(mag<(floating?20/96:.22)){x=y=0;}
   else if(floating){const strength=Math.min(.7,(mag-20/96)/(1-20/96)*.7),length=Math.hypot(x,y);x=x/length*strength;y=y/length*strength;}
   thumb.style.transform='translate('+x*70+'%, '+y*70+'%)';
   let direction=x||y?(Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up'):null;
   if(floating&&direction&&current.direction){const old=current.direction,horizontal=old==='left'||old==='right';if(horizontal&&Math.abs(x)*1.3>=Math.abs(y)&&Math.sign(x)===(old==='right'?1:-1)||!horizontal&&Math.abs(y)*1.3>=Math.abs(x)&&Math.sign(y)===(old==='down'?1:-1))direction=old;}
   send({x,y,direction});
  }
  function consume(e){e.preventDefault();if(floating)e.stopPropagation();}
  zone.addEventListener('pointerdown',e=>{
   if(e.button!==0||owner!==null||!enabled()||floating&&doc?.hidden)return;
   if(floating&&(e.target.closest?.('button,a,input,select,textarea,summary,[contenteditable],[data-car],#claw-stage,dialog,[role="dialog"],.overlay,.hole-dialog,.intro-card,.reset-card')||doc.querySelector?.('dialog[open]')))return;
   consume(e);owner=e.pointerId;origin={x:e.clientX,y:e.clientY};
   if(floating){element.style.left=origin.x-52+'px';element.style.top=origin.y-52+'px';element.classList.toggle('floating-active',true);}
   try{zone.setPointerCapture(owner);}catch(_){}slide(e);
  },true);
  zone.addEventListener('pointermove',e=>{if(owner!==e.pointerId)return;if(!enabled()){reset();return;}consume(e);slide(e);},true);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(type,e=>{if(owner===e.pointerId){consume(e);reset();}},true);
  element.addEventListener('contextmenu',e=>e.preventDefault());
  doc?.addEventListener('visibilitychange',()=>{if(doc.hidden)reset();});doc?.addEventListener('mobile-screen-drawer',reset);
  win?.addEventListener('blur',reset);win?.addEventListener('orientationchange',reset);
  refresh();return{reset,refresh,get active(){return owner!==null;}};
 }
 return{create};
});
