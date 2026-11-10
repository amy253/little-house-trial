(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.BuliHopSound=api;})(typeof window==='undefined'?globalThis:window,function(root){
 'use strict';
 function create(options={}){
  const makeContext=options.makeContext||(()=>{const C=root.AudioContext||root.webkitAudioContext;return C?new C():null;}),fetcher=options.fetch||root.fetch.bind(root);
  let ctx=null,loading=null,source=null,gain=null,token=0,muted=false,reported=false;
  function context(){if(!ctx)ctx=makeContext();return ctx;}
  function load(c){if(!loading)loading=fetcher('buli-hop-meow.wav').then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(b=>c.decodeAudioData(b));return loading;}
  function stopCharge(){token++;if(source){try{source.stop();}catch{}source.disconnect?.();source=null;}gain?.disconnect?.();gain=null;}
  async function startCharge(){
   stopCharge();const mine=token;if(muted)return false;
   try{const c=context();if(!c)return false;const resumed=c.resume();const [buffer]=await Promise.all([load(c),resumed]);if(mine!==token||muted)return false;
    gain=c.createGain();gain.gain.value=.20;gain.connect(c.destination);source=c.createBufferSource();source.buffer=buffer;source.loop=true;source.playbackRate.value=.9;source.connect(gain);source.start();return true;
   }catch(error){if(!reported){reported=true;options.onError?.(error);}return false;}
  }
  function update(seconds){if(source&&ctx)source.playbackRate.setTargetAtTime(.9+Math.min(1.8,Math.max(0,seconds))*.28,ctx.currentTime,.035);}
  function setMuted(value){muted=!!value;if(muted)stopCharge();return muted;}
  function chime(center=false){if(muted)return;try{const c=context();if(!c?.createOscillator)return;const o=c.createOscillator(),v=c.createGain();o.type='sine';o.frequency.setValueAtTime(center?830:390,c.currentTime);o.frequency.exponentialRampToValueAtTime(center?1245:195,c.currentTime+.13);v.gain.setValueAtTime(.055,c.currentTime);v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);o.connect(v);v.connect(c.destination);o.onended=()=>{o.disconnect();v.disconnect();};o.start();o.stop(c.currentTime+.19);}catch{}}
  return {startCharge,stopCharge,update,setMuted,chime};
 }
 return {create};
});
