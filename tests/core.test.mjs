import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, makeSpecimen, makeExperiment, readLink, makeLink } from '../dist/genetics.js';

test('相同网名与心情生成同一只生物，大小写和前缀不影响', () => {
  const {name:displayA,...a}=makeSpecimen('AmzTjh34230','chaos');
  const {name:displayB,...b}=makeSpecimen('@amztjh34230','chaos');
  assert.deepEqual(a,b);
  assert.notDeepEqual(makeSpecimen('amz','chaos'),makeSpecimen('amz','lurker'));
});
test('账号输入长度和字符受限，允许中文网名但拒绝标签', () => {
  assert.equal(normalizeName('  @AMZ  '),'AMZ');
  assert.throws(()=>normalizeName('<script>'),/网名/);
  assert.throws(()=>normalizeName('a'.repeat(25)),/24/);
  assert.throws(()=>normalizeName(''),/网名/);
  assert.equal(normalizeName('今天也在潜水'),'今天也在潜水');
});
test('物种参数可复现、有足够外形变化', () => {
  const types=new Set();
  for(let i=0;i<100;i++) {
    const s=makeSpecimen(`friend_${i}`,'auto');
    types.add(s.form);
    assert.ok(s.arms>=5 && s.arms<=12);
    assert.ok(s.hue>=0 && s.hue<360);
    assert.ok(s.energy>=0 && s.energy<=100);
  }
  assert.equal(types.size,6);
});
test('双人实验与顺序无关，并正确处理同一个人',()=>{
  const a=makeSpecimen('AMZ','auto'); const b=makeSpecimen('小水母','night');
  assert.deepEqual(makeExperiment(a,b),makeExperiment(b,a));
  assert.equal(makeExperiment(a,a).title,'和自己也能聊起来');
});
test('分享链接只带生成必需参数，恶意参数安全降级',()=>{
  const a=makeSpecimen('AMZ','chaos'); const b=makeSpecimen('今天潜水','lurker');
  const url=makeLink('https://example.com/petri/?secret=x#old',a,b);
  assert.ok(!url.includes('secret'));
  const data=readLink(new URL(url).search);
  assert.equal(data.a.name,'AMZ'); assert.equal(data.b.name,'今天潜水');
  assert.equal(readLink('?a=%3Cscript%3E').a,null);
  assert.equal(readLink('?a=AMZ&m=bad').a.mood,'auto');
});
