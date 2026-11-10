(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.JiajiaFlip=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const STORAGE_KEY='jiajia-flip-records-v1';
  const DIFFICULTIES=[6,8,10];
  const ASSETS=[
    {src:'jiajia-bonnet-20261021.webp',name:'格纹帽家家'},
    {src:'jiajia-blazer-20261021.webp',name:'西装家家'},
    {src:'merge-tier-4.png',name:'红色小摩托'},
    {src:'merge-tier-5.png',name:'星夜眼镜'},
    {src:'jiajia-orange-20261029.webp',name:'橙发礼帽家家'},
    {src:'jiajia-white-20261021.webp',name:'白裙家家'},
    {src:'aijia-watering.webp',name:'浇花家家'},
    {src:'jiajia-kitchen-chef.png',name:'家家下厨'},
    {src:'catch-aijia-mic-plush.png',name:'话筒玩偶'},
    {src:'catch-aijia-grimace.png',name:'眨眼家家'}
  ];
  function create(pairs=6,random=Math.random){
    if(!DIFFICULTIES.includes(pairs))pairs=6;
    const cards=[];
    for(let i=0;i<pairs;i++)for(let copy=0;copy<2;copy++)cards.push({picture:i,revealed:false,matched:false});
    for(let i=cards.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
    return {pairs,cards,phase:'ready',started:false,moves:0,flips:0,flipLimit:pairs*4,matched:0,elapsed:0,open:[],remaining:0};
  }
  function flip(g,index){
    if((g.phase!=='ready'&&g.phase!=='playing')||g.remaining>0||!Number.isInteger(index))return 'ignored';
    const card=g.cards[index];
    if(!card||card.revealed||card.matched)return 'ignored';
    if(g.flips>=g.flipLimit)return 'ignored';
    g.started=true;g.phase='playing';g.flips++;card.revealed=true;g.open.push(index);
    if(g.open.length===1)return 'first';
    g.moves++;
    const first=g.cards[g.open[0]];
    if(first.picture!==card.picture){g.remaining=850;return 'mismatch';}
    first.matched=true;card.matched=true;g.matched++;g.open=[];
    if(g.matched===g.pairs){g.phase='won';return 'won';}
    if(g.flips>=g.flipLimit){g.phase='lost';return 'lost';}
    return 'match';
  }
  function tick(g,ms){
    if(g.phase!=='playing'||!Number.isFinite(ms)||ms<=0)return;
    g.elapsed+=ms;
    if(g.remaining>0){
      g.remaining=Math.max(0,g.remaining-ms);
      if(g.remaining===0){for(const index of g.open)g.cards[index].revealed=false;g.open=[];if(g.flips>=g.flipLimit)g.phase='lost';}
    }
  }
  function pause(g){if(g.phase==='ready'||g.phase==='playing')g.phase='paused';}
  function resume(g){if(g.phase==='paused')g.phase=g.started?'playing':'ready';}
  function revive(g){
    if(g.phase!=='lost')return false;
    for(const index of g.open)if(!g.cards[index].matched)g.cards[index].revealed=false;
    g.open=[];g.remaining=0;g.flipLimit+=8;g.phase='paused';return true;
  }
  function parseRecords(raw){
    const records={6:null,8:null,10:null};
    if(raw===null||raw===undefined)return {records,ok:true};
    let value;
    try{value=JSON.parse(raw);}catch(_){return {records,ok:false};}
    if(!value||typeof value!=='object'||Array.isArray(value))return {records,ok:false};
    let ok=true;
    for(const pairs of DIFFICULTIES){
      const entry=value[pairs];
      if(entry===null||entry===undefined)continue;
      if(typeof entry==='object'&&Number.isSafeInteger(entry.moves)&&entry.moves>=pairs&&Number.isFinite(entry.time)&&entry.time>=0){records[pairs]={moves:entry.moves,time:entry.time};}
      else ok=false;
    }
    return {records,ok};
  }
  function updateRecord(records,g){
    if(g.phase!=='won')return false;
    const best=records[g.pairs];
    if(best&&(g.moves>best.moves||(g.moves===best.moves&&g.elapsed>=best.time)))return false;
    records[g.pairs]={moves:g.moves,time:g.elapsed};return true;
  }
  return {STORAGE_KEY,DIFFICULTIES,ASSETS,create,flip,tick,pause,resume,revive,parseRecords,updateRecord};
});
