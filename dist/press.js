import { makeSpecimen,makeExperiment } from './genetics.js';
import { drawCreature,drawPoster } from './world.js';
const canvas=document.getElementById('cover'),c=canvas.getContext('2d');
await document.fonts.ready;
c.fillStyle='#eaf0f1';c.fillRect(0,0,1200,675);
const glow=c.createRadialGradient(850,330,0,850,330,600);glow.addColorStop(0,'#fcffff');glow.addColorStop(.7,'#dcecef');glow.addColorStop(1,'#eaf0f1');c.fillStyle=glow;c.fillRect(300,0,900,675);
c.fillStyle='#183a46';c.font='bold 22px "Microsoft YaHei",sans-serif';c.fillText('推友培养皿',52,63);c.font='10px Arial';c.fillText('A SMALL SOCIAL EXPERIMENT BY AMZ',52,89);
c.font='bold 61px "Microsoft YaHei",sans-serif';c.fillText('你的网名，',52,242);c.fillText('长成什么怪东西？',52,327);
c.fillStyle='#456b78';c.font='21px "Microsoft YaHei",sans-serif';c.fillText('输入网名，养一只互联网生物。',52,403);c.fillText('把朋友放进来，一起变得更抽象。',52,442);
const scenes=[['lurker',815,220,105],['chaos',1035,395,98],['soft',745,490,70]];
for(const [m,x,y,r]of scenes){const s=makeSpecimen('AmzTjh34230',m);drawCreature(c,s,x,y,r,1.8,{blink:1});}
c.fillStyle='#183a46';c.font='18px Arial';c.fillText('@AmzTjh34230',52,582);c.fillStyle='#506c77';c.font='15px Arial';c.fillText('yns34-hub.github.io/petri',52,616);c.textAlign='right';c.font='13px "Microsoft YaHei",sans-serif';c.fillText('虚构物种，纯属好玩。',1148,620);
async function download(picture,name){const blob=await new Promise(resolve=>picture.toBlob(resolve,'image/png'));if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
document.getElementById('cover-download').addEventListener('click',()=>download(canvas,'AMZ-培养皿-封面.png'));
const sample=makeSpecimen('AmzTjh34230','lurker');
document.getElementById('sample-download').addEventListener('click',()=>download(drawPoster(sample,null,null),'AMZ-物种证件.png'));
document.getElementById('pair-download').addEventListener('click',()=>{const friend=makeSpecimen('今天也在潜水','chaos');download(drawPoster(sample,friend,makeExperiment(sample,friend)),'AMZ-双人实验-示例.png');});
