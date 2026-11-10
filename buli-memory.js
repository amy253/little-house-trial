(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BuliMemory=api;})(typeof window==='undefined'?globalThis:window,function(){
  function create(random=Math.random){return {random,sequence:[Math.floor(random()*4)],position:0,score:0,status:'playing'};}
  function revive(g){if(g.status!=='lost')return false;g.status='playing';return true;}
  function playback(g){return {flash:Math.max(280,540-g.score*12),gap:Math.max(140,220-g.score*4)};}
  function input(g,value){if(g.status!=='playing')return 'lost';if(value!==g.sequence[g.position]){g.status='lost';return 'lost';}g.position++;if(g.position===g.sequence.length){g.score++;g.position=0;g.sequence.push(Math.floor(g.random()*4));return 'round';}return 'correct';}return {create,input,playback,revive};
});
