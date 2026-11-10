importScripts('vendor/water-decanta.js','jiajia-water.js');
self.onmessage=event=>{
 const {round,level,seed}=event.data;
 try{self.postMessage({round,puzzle:self.JiajiaWater.generate(level,seed)});}catch(_){self.postMessage({round,error:true});}
};
