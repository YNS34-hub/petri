import { makeSpecimen, makeExperiment, readLink, makeLink, MOODS } from './genetics.js';
import { PetriWorld, drawCreature, drawPoster, drawScorePoster } from './world.js';
import { dailySeed, readMatch, makeMatchLink, scoreTitle } from './battle.js';

const $=id=>document.getElementById(id);
let world=null,posterUrl='',a=makeSpecimen('AmzTjh34230','lurker'),b=null,lastRound=null,roundSpecimen=null;
const opponent=readMatch(location.search);
const shared=readLink(location.search);if(shared.a)a=shared.a;if(shared.a&&shared.b)b=shared.b;
if(opponent){let playerName='新来的推友';try{playerName=localStorage.getItem('amz-arena-name')||playerName;}catch{}a=makeSpecimen(playerName,'auto');b=null;$('opponent-invite').hidden=false;$('opponent-invite').textContent=`@${opponent.specimen.name} 留下 ${opponent.score} 分，等你来赢。`;}
$('name').value=a.name;document.querySelector(`input[name="mood"][value="${a.mood}"]`).checked=true;if(b)$('friend-name').value=b.name;
try{world=new PetriWorld($('world'));}catch{$('scene-error').hidden=false;}

function render(){
  lastRound=null;
  document.querySelector('.intro-kicker').textContent=opponent?'朋友的残影，已经在水里等你。':'20 秒，谁的微生物更能抢？';
  $('share-x').hidden=true;
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
  if(!opponent)history.replaceState(null,'',makeLink(location.href,a,b));
  $('copy-link').textContent='复制场地链接 ↗';
  $('scene-hint').textContent='移动吃蓝泡，绕开红菌。准备好就开战。';
  $('observation').classList.remove('is-growing');requestAnimationFrame(()=>$('observation').classList.add('is-growing'));
}
render();
document.querySelector('.report-actions').append($('share-x'));
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
  const link=lastRound?makeMatchLink(location.href,lastRound,roundSpecimen):opponent?location.href:makeLink(location.href,a,null);
  try{await navigator.clipboard.writeText(link);$('status').textContent=lastRound?'挑战链接已复制。朋友打开，就能和你这一局的残影比赛。':'场地链接已复制，打一局后就能分享你的残影。';}
  catch{$('status').textContent=`可以手动复制浏览器地址，或此链接：${link}`;}
});
$('about-open').addEventListener('click',()=>$('about-dialog').showModal());$('about-close').addEventListener('click',()=>$('about-dialog').close());$('poster-close').addEventListener('click',()=>$('poster-dialog').close());

$('save-poster').addEventListener('click',async()=>{
  const button=$('save-poster');button.disabled=true;
  // 先抓取当前实验快照，等待字体和编码时继续操作也不会改变这份导出。
  const savedA=a,savedB=b,savedRound=lastRound,savedRoundSpecimen=roundSpecimen;
  try{
    await document.fonts.ready;
    const canvas=savedRound?drawScorePoster(savedRoundSpecimen,savedRound):drawPoster(savedA,savedB,savedB?makeExperiment(savedA,savedB):null);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('图片没有生成成功，可以再试一次。');
    if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=URL.createObjectURL(blob);
    $('poster-image').src=posterUrl;$('poster-download').href=posterUrl;$('poster-download').download=`AMZ-${savedRound?`${savedRound.score}分战绩`:savedB?'双人观察报告':savedA.species}.png`;
    $('poster-title').textContent=savedRound?'带着战绩，去下战书。':'带走你的奇怪选手。';$('poster-image').alt=savedRound?'推友斗菌场真实战绩海报':'推友斗菌场选手物种证件';
    $('poster-dialog').showModal();$('status').textContent=savedRound?'战绩海报已生成。记得同时带上残影挑战链接。':'选手证件已生成，可以保存。';
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

function battleState(playing){
  for(const element of document.querySelectorAll('#specimen-form input,#specimen-form button,.collection-item'))element.disabled=playing;
  $('start-battle').disabled=playing;$('start-battle').textContent=playing?'正在抢食…':'再来一局 ↗';
  $('feed').hidden=playing;$('pause').hidden=playing;$('dash').hidden=!playing;$('save-poster').disabled=playing;
  if(!playing)$('battle-countdown').hidden=true;
}

$('dash').addEventListener('click',()=>world?.dash());
$('start-battle').addEventListener('click',()=>{
  if(!world){$('status').textContent='当前浏览器无法开启竞技场，请换一个浏览器。';return;}
  try{a=makeSpecimen($('name').value,document.querySelector('input[name="mood"]:checked').value);$('name-error').textContent='';}
  catch(error){$('name-error').textContent=error.message;return;}
  render();battleState(true);$('battle-hud').hidden=false;$('ghost-score-wrap').hidden=!opponent;$('battle-score').textContent='0';$('battle-time').textContent='20.0';$('scene-hint').textContent='蓝泡加分 · 红菌扣 15 · 连吃有加成';
  try{localStorage.setItem('amz-arena-name',a.name);}catch{}
  const canvas=$('world');canvas.scrollIntoView({behavior:'instant',block:'center'});canvas.focus({preventScroll:true});
  world.startGame({specimen:a,seed:opponent?.seed??dailySeed(),opponent,
    onTick:state=>{
      $('battle-time').textContent=state.remaining.toFixed(1);$('battle-score').textContent=String(state.score);
      if(state.opponentScore!==null)$('ghost-score').textContent=String(state.opponentScore);
      $('battle-countdown').hidden=!state.countdown;if(state.countdown)$('battle-countdown').textContent=state.countdown;
      $('dash').textContent=state.dashReady?'冲刺 · 空格 ↗':'冲刺恢复中';
      if(!state.countdown)$('scene-hint').textContent=state.combo>=2?`连击 ×${state.combo}！下一颗快一点。`:'蓝泡加分 · 红菌扣 15 · 连吃有加成';
    },
    onCancel:message=>{battleState(false);$('status').textContent=message;$('scene-hint').textContent='这一局没有记录。准备好可以重新开始。';},
    onFinish:result=>{
      battleState(false);lastRound=result;roundSpecimen=a;world.set(a,opponent?.specimen||null,opponent?{behavior:'close'}:null);
      $('battle-time').textContent='0.0';$('battle-score').textContent=String(result.score);if(opponent)$('ghost-score').textContent=String(opponent.score);
      $('report-label').textContent=`20 秒真实战绩 / @${a.name}`;
      const outcome=opponent?result.score>opponent.score?'你赢了！':result.score===opponent.score?'平手，再来！':'这一局，朋友赢了。':scoreTitle(result.score);
      $('species-title').textContent=`${result.score} 分 · ${outcome}`;$('species-description').textContent=`抢到 ${result.collected} 颗营养泡泡，碰到 ${result.hits} 次红菌。`;
      $('species-quote').textContent=opponent?`对手 ${opponent.score} 分，你 ${result.score} 分。${result.score>opponent.score?'把胜利甩回时间线。':'把你的残影发出去，换朋友来追。'}`:'把你的残影留在培养皿里，让朋友追一次。';
      $('trait-one').textContent=a.species;$('trait-two').textContent='20 秒限时';$('trait-three').textContent='同场地异步挑战';
      $('save-poster').textContent='保存战绩海报 ↓';$('copy-link').textContent='复制我的残影挑战 ↗';
      const link=makeMatchLink(location.href,result,a),intent=new URL('https://twitter.com/intent/tweet');intent.searchParams.set('text',`我在「推友斗菌场」20秒抢了 ${result.score} 分。\n我的小怪物已经留在水里了，来打我的残影。\n\n@AmzTjh34230 做的，别光看，来赢我。`);intent.searchParams.set('url',link);$('share-x').href=intent.toString();
      $('share-x').hidden=false;
      $('status').textContent='这一局的真实轨迹已生成，复制链接就能邀战。';$('scene-hint').textContent=opponent?outcome:'残影已就位，等朋友来挑战。';
      $('observation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
    }
  });
});
window.addEventListener('pagehide',(event)=>{if(!event.persisted){world?.destroy();if(posterUrl)URL.revokeObjectURL(posterUrl);}});
