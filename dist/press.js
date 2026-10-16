import { makeSpecimen,makeExperiment } from './genetics.js';
import { drawCreature,drawPoster,drawScorePoster } from './world.js';
import { readMatch } from './battle.js';
const canvas=document.getElementById('cover'),c=canvas.getContext('2d');
await document.fonts.ready;
c.fillStyle='#eaf0f1';c.fillRect(0,0,1200,675);
const glow=c.createRadialGradient(850,330,0,850,330,600);glow.addColorStop(0,'#fcffff');glow.addColorStop(.7,'#dcecef');glow.addColorStop(1,'#eaf0f1');c.fillStyle=glow;c.fillRect(300,0,900,675);
c.fillStyle='#183a46';c.font='bold 22px "Microsoft YaHei",sans-serif';c.fillText('推友斗菌场',52,63);c.font='10px Arial';c.fillText('20 SECONDS. ONE PETRI DISH. BY AMZ',52,89);
c.font='bold 61px "Microsoft YaHei",sans-serif';c.fillText('20 秒，',52,242);c.fillText('赢过我的残影。',52,327);
c.fillStyle='#456b78';c.font='21px "Microsoft YaHei",sans-serif';c.fillText('抢蓝泡，躲红菌，连击越吃越狠。',52,403);c.fillText('打一局，把真实残影甩给推友来追。',52,442);
const scenes=[['lurker',815,220,105],['chaos',1035,395,98],['soft',745,490,70]];
for(const [m,x,y,r]of scenes){const s=makeSpecimen('AmzTjh34230',m);drawCreature(c,s,x,y,r,1.8,{blink:1});}
// 封面中的营养泡泡和污染团沿用游戏的颜色，帮助一眼识别抢食玩法。
for(const [x,y]of [[665,280],[1028,180],[900,500]]){const g=c.createRadialGradient(x-4,y-6,0,x,y,18);g.addColorStop(0,'#f8ffff');g.addColorStop(.4,'#70d7e3');g.addColorStop(1,'#328b9e');c.beginPath();c.arc(x,y,15,0,Math.PI*2);c.fillStyle=g;c.fill();}
for(const [x,y]of [[1095,230],[620,520]]){c.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?19:26;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fillStyle='#c77182';c.fill();c.fillStyle='#76374c';c.beginPath();c.arc(x-5,y-2,2,0,Math.PI*2);c.arc(x+5,y-2,2,0,Math.PI*2);c.fill();}
c.fillStyle='#183a46';c.font='18px Arial';c.fillText('@AmzTjh34230',52,582);c.fillStyle='#506c77';c.font='15px Arial';c.fillText('yns34-hub.github.io/petri',52,616);c.textAlign='right';c.font='13px "Microsoft YaHei",sans-serif';c.fillText('虚构物种，纯属好玩。',1148,620);
async function download(picture,name){const blob=await new Promise(resolve=>picture.toBlob(resolve,'image/png'));if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
document.getElementById('cover-download').addEventListener('click',()=>download(canvas,'AMZ-培养皿-封面.png'));
const sample=makeSpecimen('AmzTjh34230','lurker');
document.getElementById('sample-download').addEventListener('click',()=>download(drawPoster(sample,null,null),'AMZ-物种证件.png'));
document.getElementById('pair-download').addEventListener('click',()=>{const friend=makeSpecimen('今天也在潜水','chaos');download(drawPoster(sample,friend,makeExperiment(sample,friend)),'AMZ-双人实验-示例.png');});
const proof=readMatch(location.search);
if(proof){const button=document.createElement('button');button.textContent=`导出这局 ${proof.score} 分战绩`;button.addEventListener('click',()=>download(drawScorePoster(proof.specimen,{score:proof.score,seed:proof.seed,frames:proof.frames}),`AMZ-${proof.score}分战绩-修订.png`));document.querySelector('.press-actions').append(button);}
