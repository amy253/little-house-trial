(function(root){
 'use strict';
 const COLORS=root.SandSlide.COLORS;
 const SCENES=[{kind:'jiajia',index:0},{kind:'cat',index:1},{kind:'item',index:3},{kind:'jiajia',index:3},{kind:'cat',index:3},{kind:'jiajia',index:0},{kind:'item',index:2},{kind:'jiajia',index:1},{kind:'item',index:29},{kind:'cat',index:0},{kind:'jiajia',index:0},{kind:'jiajia',index:2},{kind:'item',index:8},{kind:'cat',index:2}];
 function sceneFor(level){return level<=2?SCENES[0]:SCENES[(level-2)%SCENES.length];}
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),RGB=COLORS.map(rgb);
 async function create(canvas){
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas unavailable');
  const sources=['jiajia-bonnet-20261021.webp','jiajia-blazer-20261021.webp','jiajia-white-20261021.webp','jiajia-orange-20261029.webp','buli-canonical-20261019.png','comic-items.png'];
  const images=await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;})));
  const surface=document.createElement('canvas');surface.width=84;surface.height=72;const sc=surface.getContext('2d'),pictures=new Map();
  const cut=document.createElement('canvas'),cc=cut.getContext('2d'),trims=new Map(),columns=[0,238,437,644,840,1038,1254],rows=[0,292,475,681,863,1052,1254],catRects=[[0,0,.555,.54],[.555,0,.445,.558],[0,.54,.555,.46],[.555,.558,.445,.442]];
  let width=0,height=0,geometry,disposed=false,previous=null,lastTick=-1,lastRaster=-1,grainImage=null,streams=[];
  const color=(c,f=1,white=0)=>'rgb('+RGB[c].map(v=>Math.round(Math.max(0,Math.min(255,v*f+(255-v)*white)))).join(',')+')',fillPatterns=new Map();
  function sandPattern(c){if(fillPatterns.has(c))return fillPatterns.get(c);const p=document.createElement('canvas');p.width=p.height=24;const pc=p.getContext('2d');pc.fillStyle=COLORS[c];pc.fillRect(0,0,24,24);for(let i=0;i<100;i++){const x=(i*17+3)%24,y=(i*11+Math.floor(i/24)*7)%24;pc.fillStyle=color(c,i%3===0?.82:1,i%3===1?.20:0);pc.fillRect(x,y,1,1);}const pattern=ctx.createPattern(p,'repeat');fillPatterns.set(c,pattern);return pattern;}

  function drawFit(image,rect,x,y,w,h){
   const key=image.src+':'+rect.join(',');let bounds=trims.get(key);
   if(!bounds){const [sx,sy,sw,sh]=rect;cut.width=sw;cut.height=sh;cc.drawImage(image,...rect,0,0,sw,sh);const data=cc.getImageData(0,0,sw,sh).data;let left=sw,top=sh,right=-1,bottom=-1;
    for(let cy=0;cy<sh;cy++)for(let cx=0;cx<sw;cx++)if(data[(cy*sw+cx)*4+3]>24){left=Math.min(left,cx);top=Math.min(top,cy);right=Math.max(right,cx);bottom=Math.max(bottom,cy);}
    bounds=right>=left?[sx+left,sy+top,right-left+1,bottom-top+1]:rect;trims.set(key,bounds);
   }
   const scale=Math.min(w/bounds[2],h/bounds[3]),dw=bounds[2]*scale,dh=bounds[3]*scale;sc.drawImage(image,...bounds,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }
  function item(index,x,y,w,h){const col=index%6,row=Math.floor(index/6);drawFit(images[5],[columns[col],rows[row],columns[col+1]-columns[col],rows[row+1]-rows[row]],x,y,w,h);}
  function picture(level){
   const palette=window.SandSlide.settings(level).palette,scene=sceneFor(level),key=palette.join(',')+':'+scene.kind+scene.index;if(pictures.has(key))return pictures.get(key);
   sc.fillStyle=COLORS[1];sc.fillRect(0,0,84,72);
   if(level>=3){const stickers=[4,6,7,29,8,9,3,2],offset=scene.index%stickers.length;for(const [n,x,y] of [[0,0,5],[1,67,5],[2,0,53],[3,67,52]])item(stickers[(offset+n)%stickers.length],x,y,17,18);}
   if(scene.kind==='jiajia'){const image=images[scene.index];drawFit(image,[0,0,image.naturalWidth,image.naturalHeight],level<=2?3:15,5,level<=2?78:54,66);}
   else if(scene.kind==='cat'){const image=images[4],[x,y,w,h]=catRects[scene.index];drawFit(image,[Math.round(x*image.naturalWidth),Math.round(y*image.naturalHeight),Math.min(image.naturalWidth-Math.round(x*image.naturalWidth),Math.round(w*image.naturalWidth)),Math.min(image.naturalHeight-Math.round(y*image.naturalHeight),Math.round(h*image.naturalHeight))],15,6,54,65);}
   else item(scene.index,15,7,54,62);
   if(level>=3)palette.forEach((c,i)=>{sc.fillStyle=COLORS[c];sc.fillRect(4+i*10,1,3,3);});
   const data=sc.getImageData(0,0,84,72).data,grid=Array.from({length:72},()=>Array(84));
   for(let y=0;y<72;y++)for(let x=0;x<84;x++){const i=(y*84+x)*4;let best=palette[0],distance=Infinity;for(const c of palette){const r=data[i]-RGB[c][0],g=data[i+1]-RGB[c][1],b=data[i+2]-RGB[c][2],d=r*r*.3+g*g*.5+b*b*.2;if(d<distance){distance=d;best=c;}}grid[y][x]=best;}
   pictures.set(key,grid);return grid;
  }
  function layout(){
   const w=canvas.clientWidth,h=canvas.clientHeight;if(w===width&&h===height&&geometry)return geometry;width=w;height=h;
   const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   if(w/h>1.4){const tile=Math.min((w*.48-24)/7,(h-30)/6),bw=tile*7,available=w-bw-44,sw=Math.min(available,(h-28)*84/72),sh=sw*72/84;geometry={board:{x:w-bw-15,y:(h-tile*6)/2,tile},sand:{x:14+(available-sw)/2,y:(h-sh)/2,w:sw,h:sh}};}
   else{const tile=Math.min((w-28)/7,(h-28)/11.2),bw=tile*7,by=h-tile*6-12;geometry={board:{x:(w-bw)/2,y:by,tile},sand:{x:(w-bw)/2,y:10,w:bw,h:by-22}};}
   return geometry;
  }
  function round(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function boxPath(b,ox,oy,tile){
   const cells=new Set(b.cells.map(([x,y])=>x+','+y)),segments=[];
   for(const [x,y] of b.cells){if(!cells.has(x+','+(y-1)))segments.push([[x,y],[x+1,y]]);if(!cells.has((x+1)+','+y))segments.push([[x+1,y],[x+1,y+1]]);if(!cells.has(x+','+(y+1)))segments.push([[x+1,y+1],[x,y+1]]);if(!cells.has((x-1)+','+y))segments.push([[x,y+1],[x,y]]);}
   const starts=new Map(segments.map(s=>[s[0].join(','),s])),points=[];let edge=segments[0];for(let i=0;i<segments.length;i++){points.push([ox+edge[0][0]*tile,oy+edge[0][1]*tile]);edge=starts.get(edge[1].join(','));if(!edge)break;}
   const corners=points.filter((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);});
   ctx.beginPath();const first=corners[0],last=corners.at(-1);ctx.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);for(let i=0;i<corners.length;i++){const p=corners[i],next=corners[(i+1)%corners.length];ctx.arcTo(p[0],p[1],next[0],next[1],tile*.105);}ctx.closePath();
  }
  function drawBox(b,board,selected,g){
   const t=board.tile,rim=Math.max(3.4,Math.min(5.5,t*.11)),x=board.x+b.x*t+2,y=board.y+b.y*t+2,scale=(t-3)/t,w=(Math.max(...b.cells.map(c=>c[0]))+1)*t,h=(Math.max(...b.cells.map(c=>c[1]))+1)*t;
   ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
   ctx.save();ctx.translate(0,3);boxPath(b,0,0,t);ctx.fillStyle=color(b.color,.55);ctx.shadowColor='#21163c65';ctx.shadowBlur=4;ctx.shadowOffsetY=2;ctx.fill();ctx.restore();
   boxPath(b,0,0,t);ctx.save();ctx.clip();ctx.fillStyle=color(b.color,.39);ctx.fill();
   const inset=ctx.createLinearGradient(0,0,w,h);inset.addColorStop(0,'#080b2355');inset.addColorStop(.45,'#ffffff00');inset.addColorStop(1,'#ffffff14');ctx.fillStyle=inset;ctx.fillRect(0,0,w,h);
   if(b.fill>0){ctx.fillStyle=sandPattern(b.color);const fillHeight=h*Math.min(1,b.fill/b.capacity);ctx.fillRect(0,h-fillHeight,w,fillHeight);ctx.fillStyle='#ffffff48';ctx.fillRect(rim,h-fillHeight,w-rim*2,1);}
   const plastic=ctx.createLinearGradient(0,0,w,h);plastic.addColorStop(0,color(b.color,1,.27));plastic.addColorStop(.38,color(b.color,1,.06));plastic.addColorStop(1,color(b.color,.76));
   boxPath(b,0,0,t);ctx.lineWidth=rim*2;ctx.strokeStyle=plastic;ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#ffffff7a';ctx.stroke();ctx.restore();
   boxPath(b,0,0,t);ctx.strokeStyle=selected===b.id?'#fff2b6':color(b.color,.65);ctx.lineWidth=selected===b.id?2.6:1;ctx.stroke();
   const top=b.cells.filter(c=>c[1]===0).sort((a,b)=>a[0]-b[0])[0],cx=(top[0]+.5)*t;
   ctx.save();ctx.textAlign='center';ctx.textBaseline='top';ctx.font='700 '+Math.max(10,Math.min(12,t*.25))+'px system-ui,sans-serif';ctx.shadowColor='#141426bb';ctx.shadowBlur=2;ctx.fillStyle='#fffef5';ctx.fillText(Math.floor(b.fill/b.capacity*100)+'%',cx,rim+2);ctx.restore();
   if(b.y===0&&g.status==='playing'){ctx.strokeStyle='#fff3b9';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-4,-5);ctx.lineTo(cx,0);ctx.lineTo(cx+4,-5);ctx.stroke();}
   ctx.restore();
  }
  function draw(g,selected,dt){
   if(disposed)return;const {board,sand}=layout();if(previous!==g){previous=g;streams=[];lastTick=-1;lastRaster=-1;}
   ctx.fillStyle='#4c367e';ctx.fillRect(0,0,width,height);
   round(sand.x-7,sand.y-7,sand.w+14,sand.h+14,8);ctx.fillStyle='#cdc5f0';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f6f0ff';ctx.stroke();
   ctx.fillStyle='#65558c';ctx.fillRect(sand.x,sand.y,sand.w,sand.h);
   const gw=g.grid[0].length,gh=g.grid.length,fine=2;
   if(lastRaster!==g.tick||surface.width!==gw*fine||surface.height!==gh*fine){lastRaster=g.tick;if(surface.width!==gw*fine||surface.height!==gh*fine||!grainImage){surface.width=gw*fine;surface.height=gh*fine;grainImage=sc.createImageData(surface.width,surface.height);}
    for(let y=0;y<gh*fine;y++)for(let x=0;x<gw*fine;x++){const c=g.grid[Math.floor(y/fine)][Math.floor(x/fine)],i=(y*surface.width+x)*4,seed=((x*73856093)^(y*19349663))>>>0,shade=(seed%21-10)*.95,base=c?RGB[c]:[101,85,140];for(let k=0;k<3;k++)grainImage.data[i+k]=Math.max(0,Math.min(255,base[k]+(c?shade:0)));grainImage.data[i+3]=255;}sc.putImageData(grainImage,0,0);
   }
   ctx.imageSmoothingEnabled=false;ctx.drawImage(surface,sand.x,sand.y,sand.w,sand.h);
   round(board.x-8,board.y-8,board.tile*7+16,board.tile*6+20,8);ctx.fillStyle='#c2b5ed';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#f2eaff';ctx.stroke();
   round(board.x-2,board.y-2,board.tile*7+4,board.tile*6+5,3);ctx.fillStyle='#342b58';ctx.fill();
   for(let y=0;y<6;y++)for(let x=0;x<7;x++){round(board.x+x*board.tile+1,board.y+y*board.tile+1,board.tile-2,board.tile-2,3);ctx.fillStyle=(x+y)%2?'#514473':'#564978';ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='#27235370';ctx.stroke();}
   const guide=g.level<=2&&g.status==='playing'?window.SandSlide.hint(g):null;
   const focus=g.boxes.some(b=>b.id===selected)?selected:guide?.id;for(const b of g.boxes)drawBox(b,board,focus,g);
   if(guide?.path.length){
    const b=g.boxes.find(v=>v.id===guide.id);let bx=b.x,by=b.y;ctx.save();ctx.strokeStyle='#fff2a5';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(board.x+(bx+.5)*board.tile,board.y+(by+.5)*board.tile);
    for(const [dx,dy] of guide.path){bx+=dx;by+=dy;ctx.lineTo(board.x+(bx+.5)*board.tile,board.y+(by+.5)*board.tile);}ctx.stroke();ctx.setLineDash([]);const x=board.x+(bx+.5)*board.tile,to=board.y+board.tile*.38;ctx.beginPath();ctx.moveTo(x-6,to+8);ctx.lineTo(x,to);ctx.lineTo(x+6,to+8);ctx.stroke();
    ctx.font='bold 12px Microsoft YaHei,sans-serif';ctx.textAlign='center';const lx=Math.max(board.x+44,Math.min(board.x+board.tile*7-44,x));round(lx-42,to-23,84,20,5);ctx.fillStyle='#fff2c5';ctx.fill();ctx.fillStyle='#49335e';ctx.fillText('拖到这里接沙',lx,to-9);ctx.restore();
   }
   if(g.tick!==lastTick){lastTick=g.tick;for(const e of g.effects.slice(0,12)){const b=g.boxes.find(b=>b.id===e.to);if(b)streams.push({x:sand.x+(e.x+.5)/gw*sand.w,y:sand.y+(e.y+.5)/gh*sand.h,tx:board.x+(b.x+.5)*board.tile,ty:board.y+board.tile*.35,color:e.color,age:0});}streams=streams.slice(-120);}
   if(!g.paused&&g.status==='playing')streams.forEach(p=>p.age+=dt);
   for(const p of streams){const t=Math.min(1,p.age/.28),curve=Math.sin(t*Math.PI)*12;ctx.fillStyle=COLORS[p.color];ctx.fillRect(p.x+(p.tx-p.x)*t+curve,p.y+(p.ty-p.y)*t,2.5,2.5);}
   streams=streams.filter(p=>p.age<.28);
  }
  return {picture,layout,draw,dispose(){disposed=true;streams=[];pictures.clear();trims.clear();fillPatterns.clear();}};
 }
 root.SandSlideArt={create,sceneFor};
})(window);
