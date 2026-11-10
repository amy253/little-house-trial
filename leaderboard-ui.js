(function(root){
  function mount(game){
    const $=id=>document.getElementById(id);
    const list=$('leaderboard-list'),status=$('leaderboard-status'),form=$('leaderboard-form');
    const input=$('leaderboard-name'),submit=$('leaderboard-submit');
    const endpoint='/.netlify/functions/leaderboard';
    const nameKey='little-house-leaderboard-name',idKey='little-house-leaderboard-id';
    let score=0,ready=false;
    try{input.value=localStorage.getItem(nameKey)||'';}catch{}

    function render(scores){
      list.replaceChildren();
      for(const entry of scores){
        const item=document.createElement('li');
        const name=document.createElement('span'),points=document.createElement('strong');
        name.textContent=entry.name;points.textContent=`${entry.score} ${game==='stack'?'层':'米'}`;
        item.append(name,points);list.append(item);
      }
      status.textContent=scores.length?'每个人只保留最高纪录。':'还没有人上榜，来拿第一名吧！';
    }
    async function refresh(){
      try{
        const response=await fetch(`${endpoint}?game=${game}`,{cache:'no-store'});
        if(!response.ok)throw Error('unavailable');
        const data=await response.json();
        render(data.scores);ready=true;submit.disabled=!score;
      }catch{
        status.textContent='当前只记录本机最佳；公开排行榜随网站服务上线后显示。';
        ready=false;submit.disabled=true;
      }
    }
    function setScore(value){
      score=Math.max(score,Math.floor(value)||0);
      form.hidden=score<1;
      submit.disabled=!ready||!score;
    }
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=input.value.trim();
      if(!name||name.length>12){status.textContent='昵称请填 1～12 个字。';return;}
      let playerId;
      try{playerId=localStorage.getItem(idKey);if(!playerId){playerId=crypto.randomUUID();localStorage.setItem(idKey,playerId);}localStorage.setItem(nameKey,name);}catch{status.textContent='浏览器无法保存身份，请检查隐私模式。';return;}
      submit.disabled=true;status.textContent='正在提交成绩…';
      try{
        const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({game,playerId,name,score})});
        if(!response.ok)throw Error('submit failed');
        render((await response.json()).scores);status.textContent='成绩已上榜！每个人只保留最高纪录。';
      }catch{status.textContent='提交失败，请稍后再试。';}
      submit.disabled=false;
    });
    refresh();
    return {setScore,refresh};
  }
  root.StageLeaderboard={mount};
})(window);
