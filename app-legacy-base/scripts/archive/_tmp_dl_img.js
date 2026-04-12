const http=require('http'),fs=require('fs'),path=require('path');
const { createPrismaClient } = require('./prisma-client.cjs');
const p=createPrismaClient();
const url='http://www.cctek.com.tw/proimages/photo/A600D.png';
const dest='/app/public/uploads/products/CCTEK_B600D.png';
function dl(u,d){return new Promise((res,rej)=>{const f=fs.createWriteStream(d);http.get(u,{headers:{'User-Agent':'Mozilla/5.0'},timeout:15000},r=>{if(r.statusCode!==200)return rej(new Error('HTTP '+r.statusCode));r.pipe(f);f.on('finish',()=>{f.close();res();});}).on('error',rej);});}
(async()=>{
  await dl(url,dest);
  const st=fs.statSync(dest);
  console.log('Downloaded: '+(st.size/1024).toFixed(0)+' KB');
  const pr=await p.product.findFirst({where:{seoSlug:'cctek-b600d'}});
  if(!pr){console.log('Product not found');return;}
  const admin=await p.user.findFirst({where:{role:'admin',isActive:true}});
  const ex=await p.uploadedFile.findFirst({where:{entityType:'product_website',entityId:pr.id}});
  if(ex){await p.uploadedFile.update({where:{id:ex.id},data:{filename:'CCTEK_B600D.png',filepath:'/api/uploads/products/CCTEK_B600D.png',mimetype:'image/png',size:st.size}});console.log('Updated image record');return;}
  await p.uploadedFile.create({data:{filename:'CCTEK_B600D.png',filepath:'/api/uploads/products/CCTEK_B600D.png',mimetype:'image/png',size:st.size,entityType:'product_website',entityId:pr.id,uploadedBy:admin.id,sortOrder:0}});
  console.log('Image linked OK');
})().catch(e=>console.error(e)).finally(()=>p.$disconnect());

