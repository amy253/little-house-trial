(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BuliRollMotion=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const messages={idle:'先点“启用重力”，平稳握住手机。',requesting:'请在系统提示中允许使用方向传感器。',waiting:'平稳握住手机，正在等待倾斜读数…',ready:'已校准。轻轻倾斜手机移动，点“开始 / 继续”出发。',paused:'重力已暂停。平稳握住手机，点“启用重力”重新校准。',insecure:'重力需要 HTTPS 安全连接；当前地址可用触控模式试玩。',unsupported:'浏览器没有方向传感器接口，请用触控模式。',denied:'未获得传感器权限，请用触控模式；也可在浏览器设置中允许后重试。',error:'无法读取方向传感器，请重试或切换触控模式。',timeout:'没有收到有效倾斜读数，请重试或使用触控模式。'};
 function mapTilt(beta,gamma,angle){switch(((Math.round(angle/90)*90)%360+360)%360){case 90:return {x:beta,y:-gamma};case 180:return {x:-gamma,y:-beta};case 270:return {x:-beta,y:gamma};default:return {x:gamma,y:beta};}}
 function create(options={}){
  const win=options.window||window,onInput=options.onInput||(()=>{}),onState=options.onState||(()=>{}),setTimer=options.setTimeout||win.setTimeout.bind(win),clearTimer=options.clearTimeout||win.clearTimeout.bind(win);
  const smoothing=options.smoothing??.22;let state='idle',generation=0,timer=null,baseline=null,baselineAngle=null,lastReading=null,lastSampleTime=null,value={x:0,y:0};
  function status(next){state=next;onState(next);}
  function zero(){value={x:0,y:0};onInput({...value});}
  function detach(){win.removeEventListener('deviceorientation',reading);if(timer!==null)clearTimer(timer);timer=null;baseline=null;baselineAngle=null;lastReading=null;lastSampleTime=null;zero();}
  function watchdog(){if(timer!==null)clearTimer(timer);timer=setTimer(()=>{generation++;detach();status('timeout');},options.timeoutMs??3500);}
  function axis(v){const delta=((v+180)%360+360)%360-180;return Math.abs(delta)<=3?0:Math.sign(delta)*Math.pow(Math.min(1,(Math.abs(delta)-3)/30),1.35);}
  function reading(event){
   if(!['waiting','ready'].includes(state))return;
   if(!Number.isFinite(event.beta)||!Number.isFinite(event.gamma)){lastSampleTime=null;zero();return;}
   const angle=((win.screen?.orientation?.angle??win.orientation??0)%360+360)%360;
   // A deviceorientation sample can arrive before orientationchange.
   // Never apply a new screen axis to the previous screen's calibration.
   if(baselineAngle!==null&&angle!==baselineAngle){suspend();return;}
   lastReading=mapTilt(event.beta,event.gamma,angle);watchdog();
   const now=Number.isFinite(event.timeStamp)?event.timeStamp:null,elapsed=now!==null&&lastSampleTime!==null?Math.max(0,Math.min(100,now-lastSampleTime)):1000/60;
   lastSampleTime=now;
   if(!baseline){baseline={...lastReading};baselineAngle=angle;zero();status('ready');return;}
   const x=axis(lastReading.x-baseline.x),y=axis(lastReading.y-baseline.y);
   const blend=1-Math.pow(1-smoothing,elapsed/(1000/60));
   value={x:x===0?0:value.x+(x-value.x)*blend,y:y===0?0:value.y+(y-value.y)*blend};onInput({...value});
  }
  async function enable(){
   const token=++generation;detach();
   if(win.isSecureContext!==true){status('insecure');return false;}
   const Event=win.DeviceOrientationEvent;if(!Event){status('unsupported');return false;}
   try{
    if(typeof Event.requestPermission==='function'){
     status('requesting');const permission=await Event.requestPermission();
     if(token!==generation)return false;
     if(permission!=='granted'){status('denied');return false;}
    }
    if(token!==generation)return false;
    status('waiting');win.addEventListener('deviceorientation',reading);watchdog();return true;
   }catch(e){if(token!==generation)return false;detach();status('error');return false;}
  }
  function suspend(){generation++;detach();status('paused');}
  function calibrate(){if(state!=='ready')return false;baseline=lastReading?{...lastReading}:null;zero();status('ready');return true;}
  return {enable,suspend,calibrate,get state(){return state;}};
 }
 return {create,mapTilt,message:state=>messages[state]||messages.idle};
});
