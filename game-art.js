(function(){
 'use strict';
 const names=['cat','jiajia','house','fish','star','paw','heart','flower','blueGem','purpleGem','leaf','sun','crate','stone','bomb','flame','pinkGhost','blueGhost','drum','mic','lightstick','music','key','envelope','fishDish','soup','toast','milktea','bowl','candy','redTrain','blueTrain','yellowTrain','blueStation','pinkStation','yellowStation'];
 const scenes=['garden','wood','sky','stage','kitchen','city'];
 const items=new Image(),backgrounds=new Image(),daySky=new Image(),cats=new Image(),frames=new Map(),catFrames=new Map(),urls=new Map(),sceneUrls=new Map(),pendingCats=[];
 const catAliases={'merge-tier-1.png':'catHead','buli-head-snack.png':'catHead','buli-hop-standing.png':'catStanding','catch-buli-milktea-plush.png':'cat'};
 const columns=[0,238,437,644,840,1038,1254],rows=[0,292,475,681,863,1052,1254];
 const jiajia=new Image();let jiajiaReady=false;
 jiajia.onload=()=>{jiajiaReady=true;urls.set('jiajia',jiajia.src);document.documentElement.style.setProperty('--art-jiajia',`url("${jiajia.src}")`);announce();};
 jiajia.src=document.body?.dataset?.gameArt==='17'?'jiajia-orange-20261029.webp':['11','14'].includes(document.body?.dataset?.gameArt)?'jiajia-bonnet-20261021.webp':'jiajia-white-20261021.webp';
 let catsFailed=false;
 function bind(image,name='catHead'){const url=urls.get(name);if(url){if(image.src!==url)image.src=url;return image.decode?image.decode().then(()=>true,()=>false):Promise.resolve(true);}if(catsFailed)return Promise.resolve(false);return new Promise(resolve=>pendingCats.push([image,name,resolve]));}
 function announce(){if(catFrames.size)for(const image of document.querySelectorAll('img[src]')){const name=catAliases[(image.getAttribute('src')||'').split('?')[0]];if(name)bind(image,name);}document.dispatchEvent(new CustomEvent('game-art-ready'));}
 function frame(image,column,row,columns,rows){return [Math.round(column*image.naturalWidth/columns),Math.round(row*image.naturalHeight/rows),Math.round((column+1)*image.naturalWidth/columns)-Math.round(column*image.naturalWidth/columns),Math.round((row+1)*image.naturalHeight/rows)-Math.round(row*image.naturalHeight/rows)];}
 items.onload=()=>{
  const crop=document.createElement('canvas'),ctx=crop.getContext('2d');
  for(let i=0;i<names.length;i++){
   if(names[i]==='cat'||(names[i]==='jiajia'&&jiajiaReady))continue;
   const col=i%6,row=Math.floor(i/6),f=[columns[col],rows[row],columns[col+1]-columns[col],rows[row+1]-rows[row]];crop.width=f[2];crop.height=f[3];ctx.drawImage(items,...f,0,0,f[2],f[3]);
   const data=ctx.getImageData(0,0,f[2],f[3]).data;let left=f[2],top=f[3],right=-1,bottom=-1;
   for(let y=0;y<f[3];y++)for(let x=0;x<f[2];x++)if(data[(y*f[2]+x)*4+3]>24){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   if(right<left)continue;
   const bounds=[f[0]+left,f[1]+top,right-left+1,bottom-top+1];frames.set(names[i],bounds);
   crop.width=bounds[2];crop.height=bounds[3];ctx.drawImage(items,...bounds,0,0,bounds[2],bounds[3]);
   const url=crop.toDataURL('image/png');urls.set(names[i],url);document.documentElement.style.setProperty('--art-'+names[i],`url("${url}")`);
  }
  announce();
 };
 // One sheet derived from the user's two original Buli photographs.
 cats.onload=()=>{
  const crop=document.createElement('canvas'),ctx=crop.getContext('2d');
  const poses=[['catHead',0,0,.555,.54],['cat',.555,0,.445,.558],['catStanding',0,.54,.555,.46],['catResting',.555,.558,.445,.442]];
  for(const [name,x,y,w,h] of poses){
   const sx=Math.round(x*cats.naturalWidth),sy=Math.round(y*cats.naturalHeight),sw=Math.min(cats.naturalWidth-sx,Math.round(w*cats.naturalWidth)),sh=Math.min(cats.naturalHeight-sy,Math.round(h*cats.naturalHeight));
   crop.width=sw;crop.height=sh;ctx.drawImage(cats,sx,sy,sw,sh,0,0,sw,sh);
   const data=ctx.getImageData(0,0,sw,sh).data;let left=sw,top=sh,right=-1,bottom=-1;
   for(let py=0;py<sh;py++)for(let px=0;px<sw;px++)if(data[(py*sw+px)*4+3]>24){left=Math.min(left,px);top=Math.min(top,py);right=Math.max(right,px);bottom=Math.max(bottom,py);}
   if(right<left)continue;
   const bounds=[sx+left,sy+top,right-left+1,bottom-top+1];catFrames.set(name,bounds);
   crop.width=bounds[2];crop.height=bounds[3];ctx.drawImage(cats,...bounds,0,0,bounds[2],bounds[3]);
   const url=crop.toDataURL('image/png');urls.set(name,url);document.documentElement.style.setProperty('--art-'+name,`url("${url}")`);
  }
  for(const [image,name,resolve] of pendingCats.splice(0))bind(image,name).then(resolve);
  announce();
 };
 cats.onerror=()=>{catsFailed=true;for(const [image,name,resolve] of pendingCats.splice(0))resolve(false);};
 backgrounds.onload=()=>{
  const crop=document.createElement('canvas'),ctx=crop.getContext('2d');
  scenes.forEach((name,i)=>{const f=frame(backgrounds,i%3,Math.floor(i/3),3,2);crop.width=f[2];crop.height=f[3];ctx.drawImage(backgrounds,...f,0,0,f[2],f[3]);const url=crop.toDataURL('image/png');sceneUrls.set(name,url);document.documentElement.style.setProperty('--scene-'+name,`url("${url}")`);});announce();
 };
 daySky.onload=()=>{sceneUrls.set('daySky',daySky.src);document.documentElement.style.setProperty('--scene-daySky',`url("${daySky.src}")`);announce();};
 window.GameArt={
  draw(ctx,name,x,y,w,h){if(name==='jiajia'&&jiajiaReady&&ctx&&w>0&&h>0){const scale=Math.min(w/jiajia.naturalWidth,h/jiajia.naturalHeight),dw=jiajia.naturalWidth*scale,dh=jiajia.naturalHeight*scale;ctx.save();ctx.drawImage(jiajia,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();return true;}const f=catFrames.get(name)||frames.get(name);if(!f||!ctx||w<=0||h<=0)return false;const scale=Math.min(w/f[2],h/f[3]),dw=f[2]*scale,dh=f[3]*scale;ctx.save();ctx.drawImage(catFrames.has(name)?cats:items,...f,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();return true;},
  bind,
  scene(ctx,name,x,y,w,h){const i=scenes.indexOf(name),image=name==='daySky'?daySky:backgrounds;if((i<0&&name!=='daySky')||!image.naturalWidth||!ctx||w<=0||h<=0)return false;const f=name==='daySky'?[0,0,image.naturalWidth,image.naturalHeight]:frame(image,i%3,Math.floor(i/3),3,2),scale=Math.max(w/f[2],h/f[3]),sw=w/scale,sh=h/scale;ctx.save();ctx.drawImage(image,f[0]+(f[2]-sw)/2,f[1]+(f[3]-sh)/2,sw,sh,x,y,w,h);ctx.restore();return true;},
  spriteUrl(name){return urls.get(name)||'';},
  sceneUrl(name){return sceneUrls.get(name)||'';}
 };
 items.src='comic-items.png';backgrounds.src='comic-scenes.png';cats.src='buli-canonical-20261019.png';if(['14','19','29'].includes(document.body?.dataset?.gameArt))daySky.src='comic-day-sky.png';
 function syncIndex(){if(!document.getElementById('home-view'))return;for(const [id,key] of [['sand-view','01'],['match3-view','02'],['stars-view','03'],['merge-view','04']]){const view=document.getElementById(id);if(view&&!view.hidden){document.body.dataset.gameArt=key;break;}}}
 if(document.getElementById('home-view')){const observer=new MutationObserver(syncIndex);document.querySelectorAll('#home-view,#sand-view,#match3-view,#stars-view,#merge-view').forEach(v=>observer.observe(v,{attributes:true,attributeFilter:['hidden']}));syncIndex();}
})();
