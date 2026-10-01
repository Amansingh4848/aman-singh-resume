'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'dist');
const oldOrigin='https://aman-singh-resume.vercel.app';
const supplied=process.env.SITE_ORIGIN||process.env.URL||oldOrigin;
const origin=new URL(supplied).origin;
if(!origin.startsWith('https://'))throw Error('The production origin must use HTTPS.');
// Strict publication allowlist: no source, auth state, environment files or dependencies.
const files=[];
for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(entry.isFile()&&/\.(html|css|js)$/.test(entry.name))files.push(entry.name);
  if(['robots.txt','sitemap.xml','Aman-Singh-Resume.pdf','Aman-Singh-Resume.docx'].includes(entry.name))files.push(entry.name);
}
function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const relative=dir+'/'+entry.name;
  if(entry.isDirectory()){if(relative==='trading/source')continue;walk(relative);}
  else if(/\.(html|css|js|svg|png|jpg|jpeg|webp|ico|webmanifest)$/i.test(entry.name))files.push(relative);
}}
walk('assets');walk('trading');
fs.mkdirSync(output,{recursive:true});
// Refuse a stale or unreviewed artifact rather than silently publishing extra files.
function existing(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?existing(path.join(dir,e.name)):[path.relative(output,path.join(dir,e.name)).replaceAll('\\','/')]);}
for(const file of existing(output))if(!files.includes(file)&&file!=='_redirects')throw Error('Unexpected file in publish directory: '+file);
for(const file of files){
  const destination=path.join(output,file);fs.mkdirSync(path.dirname(destination),{recursive:true});
  if(/\.(html|xml|txt|js|webmanifest)$/.test(file))fs.writeFileSync(destination,fs.readFileSync(path.join(root,file),'utf8').replaceAll(oldOrigin,origin));
  else fs.copyFileSync(path.join(root,file),destination);
}
const redirects=files.filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>'/'+f.slice(0,-5)+' /'+f+' 200').join('\n');
fs.writeFileSync(path.join(output,'_redirects'),redirects+'\n');
console.log('Prepared '+files.length+' public assets; private configuration and server source excluded.');
