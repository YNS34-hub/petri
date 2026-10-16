import { makeSpecimen, makeExperiment, readLink, makeLink, MOODS } from './genetics.js';
import { PetriWorld, drawCreature, drawPoster } from './world.js';

const $=id=>document.getElementById(id);
let world=null,posterUrl='',a=makeSpecimen('AmzTjh34230','lurker'),b=null;
const shared=readLink(location.search);if(shared.a)a=shared.a;if(shared.a&&shared.b)b=shared.b;
$('name').value=a.name;document.querySelector(`input[name="mood"][value="${a.mood}"]`).checked=true;if(b)$('friend-name').value=b.name;
try{world=new PetriWorld($('world'));}catch{$('scene-error').hidden=false;}

function render(){
  const experiment=b?makeExperiment(a,b):null;
  world?.set(a,b,experiment);
  $('report-label').textContent=b?`双人观察 / @${a.name} + @${b.name}`:`正在观察 / @${a.name}`;
  $('report-code').textContent=a.code;
  $('scene-code').textContent=b?'CO-CULTURE / 两只生物，一份生态':`${a.code} / ${a.species}`;
  $('species-title').textContent=experiment?.title||a.title;
  $('species-description').textContent=experiment?.subtitle||a.description;
  $('species-quote').textContent=`「${experiment?.line||a.quote}」`;
  $('trait-one').textContent=b?`${a.species} × ${b.species}`:MOODS[a.mood];
  $('trait-two').textContent=b?'两只，正好':a.energy>68?'活力有点过剩':a.energy<45?'低耗能生存':'偶尔活跃一下';
  $('trait-three').textContent=b?'关系随网名生成':a.social>65?'靠近了就熟':a.social<40?'社交距离两米':'熟人限定营业';
  $('save-poster').textContent=b?'保存双人观察报告 ↓':'保存物种证件 ↓';
  $('copy-link').textContent=b?'复制这个双人实验 ↗':'复制这只生物的链接 ↗';
  $('remove-friend').hidden=!b;$('status').textContent='';
  const text=b?`我把自己和 @${b.name} 关进了同一个培养皿。\n观察结果：${experiment.title}。\n${experiment.line}\n\n@AmzTjh34230 做的这个有点抽象。`:`我的网名长成了一只「${a.title}」。\n${a.description}\n\n你是什么物种？来养一下。\n@AmzTjh34230 的推友培养皿`;
  const intent=new URL('https://twitter.com/intent/tweet');intent.searchParams.set('text',text);intent.searchParams.set('url',makeLink(location.href,a,b));$('share-x').href=intent.toString();
  // 更新地址但不刷新画面；刷新或分享时能够复现当前网名与心情。
  history.replaceState(null,'',makeLink(location.href,a,b));
  $('observation').classList.remove('is-growing');requestAnimationFrame(()=>$('observation').classList.add('is-growing'));
}
render();
if(world?.paused){$('pause').textContent='继续 ▶';$('pause').setAttribute('aria-pressed','true');}
$('specimen-form').addEventListener('submit',e=>{
  e.preventDefault();$('name-error').textContent='';
  try{a=makeSpecimen($('name').value,document.querySelector('input[name="mood"]:checked').value);render();if(innerWidth<=680)$('world').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}
  catch(error){$('name-error').textContent=error.message;$('name').focus();}
});
$('friend-form').addEventListener('submit',e=>{
  e.preventDefault();$('friend-error').textContent='';
  try{b=makeSpecimen($('friend-name').value,'auto');render();$('world').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}
  catch(error){$('friend-error').textContent=error.message;$('friend-name').focus();}
});
$('remove-friend').addEventListener('click',()=>{b=null;render();});
$('feed').addEventListener('click',()=>{world?.feed();$('status').textContent='投喂了 8 颗喜欢。它好像有点开心。';});
$('pause').addEventListener('click',()=>{
  if(!world)return;const paused=world.togglePause();$('pause').textContent=paused?'继续 ▶':'暂停 ⏸';$('pause').setAttribute('aria-pressed',String(paused));$('pause').setAttribute('aria-label',paused?'继续生物动画':'暂停生物动画');
});
$('copy-link').addEventListener('click',async()=>{
  const link=makeLink(location.href,a,b);
  try{await navigator.clipboard.writeText(link);$('status').textContent='链接已复制。朋友打开，就能看到同一只生物。';}
  catch{$('status').textContent=`可以手动复制浏览器地址，或此链接：${link}`;}
});
$('about-open').addEventListener('click',()=>$('about-dialog').showModal());$('about-close').addEventListener('click',()=>$('about-dialog').close());$('poster-close').addEventListener('click',()=>$('poster-dialog').close());

$('save-poster').addEventListener('click',async()=>{
  const button=$('save-poster');button.disabled=true;
  // 先抓取当前实验快照，等待字体和编码时继续操作也不会改变这份导出。
  const savedA=a,savedB=b;
  try{
    await document.fonts.ready;
    const canvas=drawPoster(savedA,savedB,savedB?makeExperiment(savedA,savedB):null);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('图片没有生成成功，可以再试一次。');
    if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=URL.createObjectURL(blob);
    $('poster-image').src=posterUrl;$('poster-download').href=posterUrl;$('poster-download').download=`AMZ-${savedB?'双人观察报告':savedA.species}.png`;
    $('poster-dialog').showModal();$('status').textContent='物种证据已生成，可以带回时间线了。';
  }catch(error){$('status').textContent=error.message||'暂时无法导出，可以先截图保存。';}
  finally{button.disabled=false;}
});

// 图鉴是可操作的预设心情，缩略图直接使用同一渲染器，没有静态占位图片。
const gallery=[['lurker','潜水水母'],['yapper','碎碎念海葵'],['chaos','抽象变形虫'],['night','夜游气泡鱼'],['soft','社交糯米团'],['drift','放空小电鳐']];
for(const [mood,title]of gallery){
  const specimen=makeSpecimen(a.name,mood);
  const button=document.createElement('button');button.type='button';button.className='collection-item';button.setAttribute('aria-label',`查看${title}`);
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=256;canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(ctx)drawCreature(ctx,specimen,160,title==='潜水水母'?98:120,50,1.2,{blink:1});
  const name=document.createElement('strong');name.textContent=title;const hint=document.createElement('span');hint.textContent=MOODS[mood];button.append(canvas,name,hint);
  button.addEventListener('click',()=>{
    try{a=makeSpecimen($('name').value||a.name,mood);$('name').value=a.name;document.querySelector(`input[name="mood"][value="${a.mood}"]`).checked=true;$('name-error').textContent='';render();$('world').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}
    catch(error){$('name-error').textContent=error.message;$('name').focus();}
  });$('collection').append(button);
}
window.addEventListener('pagehide',(event)=>{if(!event.persisted){world?.destroy();if(posterUrl)URL.revokeObjectURL(posterUrl);}});
