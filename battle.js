import { hashString, makeSpecimen } from './genetics.js';

export const ROUND_SECONDS=20;
export const REPLAY_HZ=5;
export const REPLAY_FRAMES=ROUND_SECONDS*REPLAY_HZ+1;

export function dailySeed(){
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return hashString(`AMZ-PETRI-ARENA-1|${date}`);
}

export function encodeReplay(frames){
  if(!Array.isArray(frames)||frames.length!==REPLAY_FRAMES)throw new Error('一局完整的挑战才能分享');
  const bytes=new Uint8Array(frames.length*4);
  frames.forEach((f,i)=>{
    if(!Array.isArray(f)||f.length!==3||!f.every(Number.isFinite))throw new Error('轨迹数据无效');
    const score=Math.max(0,Math.min(9999,Math.round(f[2])));
    bytes[i*4]=Math.round((Math.max(-1,Math.min(1,f[0]))+1)*127.5);
    bytes[i*4+1]=Math.round((Math.max(-1,Math.min(1,f[1]))+1)*127.5);
    bytes[i*4+2]=score>>8;bytes[i*4+3]=score&255;
  });
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

export function decodeReplay(text){
  if(typeof text!=='string'||text.length>600||!/^[A-Za-z0-9_-]+$/.test(text))return null;
  try{
    const raw=atob(text.replaceAll('-','+').replaceAll('_','/'));
    if(raw.length!==REPLAY_FRAMES*4)return null;
    const frames=[];
    for(let i=0;i<raw.length;i+=4){const score=raw.charCodeAt(i+2)*256+raw.charCodeAt(i+3);if(score>9999)return null;frames.push([raw.charCodeAt(i)/127.5-1,raw.charCodeAt(i+1)/127.5-1,score]);}
    return frames;
  }catch{return null;}
}

export function makeMatchLink(href,result,specimen){
  const url=new URL(href);url.search='';url.hash='';
  url.searchParams.set('a',specimen.name);url.searchParams.set('m',specimen.mood);
  url.searchParams.set('seed',String(result.seed>>>0));url.searchParams.set('r',encodeReplay(result.frames));
  return url.toString();
}

export function readMatch(search){
  const p=new URLSearchParams(search),frames=decodeReplay(p.get('r'));
  if(!frames||!/^\d{1,10}$/.test(p.get('seed')||''))return null;
  const seed=Number(p.get('seed'));if(seed<0||seed>4294967295)return null;
  try{return {specimen:makeSpecimen(p.get('a'),p.get('m')),seed,frames,score:frames.at(-1)[2]};}catch{return null;}
}

export function sampleReplay(frames,time){
  const index=Math.max(0,Math.min(frames.length-1,time*REPLAY_HZ)),a=frames[Math.floor(index)],b=frames[Math.min(Math.floor(index)+1,frames.length-1)],u=index%1;
  return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,score:a[2]};
}

export function scoreTitle(score){return score>=900?'培养皿霸主':score>=650?'抢食天花板':score>=400?'水下狠角色':score>=200?'进化中选手':'刚刚学会游泳';}
