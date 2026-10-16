export const CREATOR = 'AmzTjh34230';
export const MOODS = {
  auto: '随便长长', lurker: '默默潜水', chaos: '有点抽象', yapper: '忍不住说', night: '半夜出没', soft: '世界和平', drift: '偶尔放电',
};

export function normalizeName(value) {
  const name = String(value ?? '').trim().replace(/^@/, '');
  if (!name) throw new Error('先留一个网名，生物才知道跟谁走。');
  if (Array.from(name).length > 24) throw new Error('网名最多 24 个字，给培养皿留点空间。');
  if (!/^[\p{L}\p{N}_\-. ]+$/u.test(name)) throw new Error('网名可以用中文、字母、数字、空格和 _ . -');
  return name;
}

export function hashString(text) {
  let value = 2166136261;
  for (const char of text) { value ^= char.codePointAt(0); value = Math.imul(value, 16777619); }
  return value >>> 0;
}

export function random(seed) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let n = value;
    n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

const species = [
  ['潜水水母', '消息都看见了，正在水下组织语言。', '再潜一会，世界会自己安静下来。'],
  ['碎碎念海葵', '触手很多，每条都有自己的观点。', '最后一句，说完最后一句就睡。'],
  ['抽象变形虫', '没有固定形状，但很有自己的想法。', '无法解释，先长成这样吧。'],
  ['夜游气泡鱼', '白天信号微弱，半夜突然满格。', '你也没睡？那就不算熬夜。'],
  ['社交糯米团', '看起来软乎乎，熟了以后很黏人。', '碰一下，就是朋友了。'],
  ['放空小电鳐', '偶尔放电，大部分时间在发呆。', '今天的电量，够喜欢一点世界。'],
];
const descriptors = ['透明系','慢热型','迷你型','反骨型','松弛型','游离态','高能型','软着陆'];
const moodForm = { lurker:0, yapper:1, chaos:2, night:3, soft:4, drift:5 };

export function makeSpecimen(input, selectedMood = 'auto') {
  const name = normalizeName(input);
  const mood = Object.hasOwn(MOODS,selectedMood) ? selectedMood : 'auto';
  const seed = hashString(`${name.toLocaleLowerCase('en')}|${mood}`);
  const rng = random(seed);
  const form = moodForm[mood] ?? Math.floor(rng()*species.length);
  const hue = [166,306,212,38,336,182][form] + Math.floor(rng()*24)-12;
  const arms = 5 + Math.floor(rng()*8);
  const descriptor = descriptors[Math.floor(rng()*descriptors.length)];
  return {
    name,mood,seed,form,hue:(hue+360)%360,arms,
    lobes:3+Math.floor(rng()*5), eyes:form===2 ? 3 : 2,
    energy:25+Math.floor(rng()*71), social:15+Math.floor(rng()*81),
    title:`${descriptor}${species[form][0]}`,
    species:species[form][0],description:species[form][1],quote:species[form][2],
    code:`AMZ-${seed.toString(36).toUpperCase().padStart(7,'0')}`,
  };
}

const outcomes = [
  { title:'一起变得更抽象', line:'别的生物在进化，你们在互相带偏。', behavior:'orbit', subtitle:'两只生物开始围着彼此转圈。' },
  { title:'刚认识，就像老朋友', line:'没有破冰环节，直接开始互倒日常。', behavior:'close', subtitle:'两只生物在小心翼翼地靠近。' },
  { title:'各潜各的，也很舒服', line:'不用找话题，待在同一片水里就够了。', behavior:'apart', subtitle:'它们保留一点距离，安静地陪着彼此。' },
  { title:'一个敢说，一个敢接', line:'话掉不到地上，梗也永远有人捡。', behavior:'bounce', subtitle:'你来我往，连水面都开始热闹。' },
  { title:'一靠近，就有小火花', line:'不一定聊得明白，但肯定不会无聊。', behavior:'chase', subtitle:'它们开始追逐，然后假装什么都没发生。' },
  { title:'同时掉线，同时上线', line:'谁也不催回复，一出现就又接上了。', behavior:'wave', subtitle:'两只生物用同一种频率起伏。' },
];

export function makeExperiment(a,b) {
  if(a.name.toLocaleLowerCase('en')===b.name.toLocaleLowerCase('en')) return { title:'和自己也能聊起来',line:'一个人，也可以自成一个热闹的生态。',behavior:'orbit',subtitle:'观察对象：两个不同心情的自己。' };
  // 对名字排序后再取种子，确保朋友反向打开同一链接时不会得到另一种结果。
  const seed=hashString([a.seed,b.seed].sort((x,y)=>x-y).join('|'));
  return {...outcomes[seed%outcomes.length]};
}

export function makeLink(href,a,b=null) {
  const url=new URL(href); url.search=''; url.hash='';
  url.searchParams.set('a',a.name); url.searchParams.set('m',a.mood);
  if(b){url.searchParams.set('b',b.name);url.searchParams.set('n',b.mood);}
  return url.toString();
}

export function readLink(search) {
  const params=new URLSearchParams(search);
  const read=(name,mood)=>{try{return params.get(name)?makeSpecimen(params.get(name),params.get(mood)):null;}catch{return null;}};
  return {a:read('a','m'),b:read('b','n')};
}
