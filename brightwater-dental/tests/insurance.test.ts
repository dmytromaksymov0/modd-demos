import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, carriers } from '../src/lib/insurance.ts';

test('in-network PPO → $0 preventive, CTA carries the plan into /book', () => {
  const a = answer('delta', 'ppo');
  assert.equal(a.tone, 'yes'); assert.equal(a.amount, '$0');
  assert.equal(a.cta.href, '/book/?insurance=delta-ppo');
});
test('UT SELECT explains it rides on Delta Dental PPO', () => {
  assert.match(answer('ut-select', 'ppo').detail, /Delta Dental PPO network/);
});
test('not sure → likely in-network, hedged', () => {
  const a = answer('cigna', 'unsure');
  assert.equal(a.tone, 'maybe'); assert.match(a.headline, /likely in-network/);
});
test('DHMO → not in network, $99 first visit', () => {
  const a = answer('aetna', 'dhmo');
  assert.equal(a.tone, 'no'); assert.equal(a.amount, '$99');
});
test('out-of-network carrier → we still file', () => {
  const a = answer('principal', 'ppo');
  assert.equal(a.tone, 'maybe'); assert.equal(a.amount, 'Varies');
});
test('no insurance → the $29 plan', () => {
  const a = answer('none', 'ppo');
  assert.equal(a.tone, 'plan'); assert.equal(a.amount, '$29');
});
test('unknown carrier id falls back safely', () => {
  assert.equal(answer('nope', 'ppo').amount, '$0');
  assert.ok(carriers.some((c) => c.id === 'state-tx'));
});
