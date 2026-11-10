(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./buli-hop.js'):root.BuliHop);if(typeof module==='object'&&module.exports)module.exports=api;root.BuliHopInput=api;})(typeof window==='undefined'?globalThis:window,function(Core){
 'use strict';
 function isGameKey(e){const t=e.target||{};return e.code==='Space'&&!t.isContentEditable&&!/^(BUTTON|INPUT|SELECT|TEXTAREA|A|SUMMARY)$/.test(t.tagName||'');}
 function create({getGame,now=()=>performance.now(),sound}){
  let owner=null,started=0;
  return {
   press(id){if(owner!==null||!Core.beginCharge(getGame()))return false;owner=id;started=now();sound.startCharge();return true;},
   release(id){if(owner!==id)return false;owner=null;sound.stopCharge();const g=getGame();if(g.phase!=='charging'||g.paused)return false;g.charge=Math.max(0,(now()-started)/1000);return Core.release(g);},
   cancel(id){if(id!==undefined&&id!==owner)return false;owner=null;sound.stopCharge();Core.cancelCharge(getGame());return true;},
   held(){return owner!==null;}
  };
 }
 return {create,isGameKey};
});
