(() => {
  const $=id=>document.getElementById(id);
  const bridge=window.FlowerSaveBridge,cloud=window.FlowerCloud,config=window.FlowerCloudConfig||{};
  const status=$('flower-cloud-status'),login=$('flower-cloud-login');
  const retry=$('flower-cloud-retry'),logout=$('flower-cloud-logout');
  if(!bridge||!cloud||!config.publishableKey){
    login.disabled=true;
    status.textContent='游客进度暂存在这台设备。云端存档将在连接服务后开放。';
    return;
  }

  let clerk,user=null,lastSynced='',queue=Promise.resolve();
  const setStatus=message=>{status.textContent=message;};
  const errorMessage=error=>error?.errors?.[0]?.longMessage||error?.errors?.[0]?.message||error?.message||'请检查网络后重试。';

  function loadScript(src,attributes={}){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;script.crossOrigin='anonymous';
      for(const [name,value] of Object.entries(attributes)) script.setAttribute(name,value);
      script.onload=resolve;
      script.onerror=()=>reject(new Error('登录工具未能加载'));
      document.head.append(script);
    });
  }

  async function loadClerk(){
    const domain=atob(config.publishableKey.split('_')[2]||'').slice(0,-1);
    if(!/^[a-z0-9.-]+$/i.test(domain)) throw new Error('云存档配置有误');
    await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,{'data-clerk-publishable-key':config.publishableKey});
    if(!window.Clerk||!window.__internal_ClerkUICtor) throw new Error('登录工具未能加载');
    await window.Clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor}});
    return window.Clerk;
  }

  function showGuest(){
    user=null;lastSynced='';login.hidden=false;login.disabled=false;logout.hidden=true;retry.hidden=true;
    setStatus('游客也能玩：进度暂存在这台设备。登录后会自动保存到云端。');
  }

  function syncNow(){
    if(!user) return queue;
    queue=queue.then(async()=>{
      const activeUser=user;
      const store={
        read:async()=>{const fresh=await activeUser.reload();return fresh.unsafeMetadata?.houseFlower;},
        write:async value=>{await activeUser.updateMetadata({unsafeMetadata:{houseFlower:value}});}
      };
      const selected=await cloud.sync(store,bridge.read());
      if(user!==activeUser) return;
      const local=bridge.read();
      const current=cloud.choose(local,selected);
      if(JSON.stringify(cloud.snapshot(local))!==JSON.stringify(current)) bridge.restore({...local,...current});
      lastSynced=JSON.stringify(selected);
      retry.hidden=true;
      const email=user.primaryEmailAddress?.emailAddress||user.emailAddresses?.[0]?.emailAddress||'邮箱用户';
      setStatus(`已登录 ${email} · 进度已保存到云端`);
      if(JSON.stringify(current)!==lastSynced) syncNow();
    }).catch(error=>{
      retry.hidden=false;
      setStatus(`云端保存失败，本机进度还在。${errorMessage(error)}`);
    });
    return queue;
  }

  function showAccount(accountUser){
    user=accountUser;login.hidden=true;logout.hidden=false;
    setStatus('正在同步养花进度…');
    syncNow();
  }

  window.addEventListener('flower-save-changed',()=>{
    if(user&&JSON.stringify(cloud.snapshot(bridge.read()))!==lastSynced) syncNow();
  });
  window.addEventListener('online',()=>{if(user) syncNow();});

  login.onclick=()=>clerk.openSignIn();
  retry.onclick=()=>{retry.hidden=true;setStatus('正在重试云端保存…');syncNow();};
  logout.onclick=async()=>{
    logout.disabled=true;
    try{await queue;await clerk.signOut();showGuest();}
    catch(error){setStatus(`退出失败：${errorMessage(error)}`);}
    finally{logout.disabled=false;}
  };

  login.disabled=true;setStatus('正在检查云端存档…');
  loadClerk().then(instance=>{
    clerk=instance;
    if(clerk.user) showAccount(clerk.user); else showGuest();
    clerk.addListener(({user:nextUser})=>{
      if(nextUser===undefined) return;
      if(!nextUser){if(user) showGuest();return;}
      if(nextUser.id!==user?.id) showAccount(nextUser);
    },{skipInitialEmit:true});
  }).catch(error=>{
    login.disabled=true;
    setStatus(`云端暂时不可用，本机进度仍可继续。${errorMessage(error)}`);
  });
})();
