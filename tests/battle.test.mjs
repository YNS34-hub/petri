import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeReplay,decodeReplay,readMatch,makeMatchLink,sampleReplay,REPLAY_FRAMES} from '../dist/battle.js';
import {makeSpecimen} from '../dist/genetics.js';
const frames=Array.from({length:REPLAY_FRAMES},(_,i)=>[i/REPLAY_FRAMES*1.8-.9,.2,i*10]);
test('真实二十秒轨迹压缩后可通过分享链接复现',()=>{
  const encoded=encodeReplay(frames);assert.ok(encoded.length<600);
  const decoded=decodeReplay(encoded);assert.equal(decoded.length,101);assert.equal(decoded.at(-1)[2],1000);
  assert.ok(Math.abs(decoded[31][0]-frames[31][0])<.008);
  const link=makeMatchLink('https://example.com/?private=1#x',{seed:123,frames},makeSpecimen('AMZ','chaos'));
  const match=readMatch(new URL(link).search);assert.equal(match.score,1000);assert.equal(match.seed,123);assert.equal(match.specimen.name,'AMZ');assert.ok(!link.includes('private'));
});
test('损坏、超长和不完整的回放安全降级',()=>{
  for(const raw of ['', '<script>', 'a'.repeat(2000), 'YWJj'])assert.equal(decodeReplay(raw),null);
  assert.throws(()=>encodeReplay(frames.slice(1)),/完整/);
  assert.equal(readMatch('?r=YWJj&seed=abc'),null);
});
test('幽灵在边界时刻使用真实轨迹和对应得分',()=>{
  assert.equal(sampleReplay(frames,0).score,0);
  assert.equal(sampleReplay(frames,20).score,1000);
  assert.equal(sampleReplay(frames,25).score,1000);
  assert.equal(sampleReplay(frames,-1).score,0);
});
