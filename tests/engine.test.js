const test = require('node:test');
const assert = require('node:assert/strict');

const Engine = require('../assets/engine.js');

test('createSession starts at the intro with seven neutral traits', () => {
  const session = Engine.createSession('moon-001');

  assert.equal(session.id, 'moon-001');
  assert.equal(session.step, 'intro');
  assert.deepEqual(Object.keys(session.traits), [
    'novelty',
    'control',
    'emotion',
    'intuition',
    'aftertaste',
    'boundary',
    'decorum',
  ]);
  assert.ok(Object.values(session.traits).every((value) => value === 50));
  assert.deepEqual(session.actions, []);
});

test('duration comparison uses the users own median baseline', () => {
  const session = Engine.createSession('moon-002');
  Engine.recordDuration(session, 'skin', 2000);
  Engine.recordDuration(session, 'filling', 4000);
  Engine.recordDuration(session, 'blend', 3000);

  assert.equal(Engine.getDurationRatio(session, 6000), 2);
  assert.equal(Engine.getDurationRatio(session, 1500), 0.5);
});

test('a random ingredient does not affect traits until the user catches it', () => {
  const ignored = Engine.createSession('moon-003');
  Engine.recordSurprise(ignored, {
    id: 'chilli',
    deltas: { novelty: 40, emotion: 20 },
  }, 'missed', { hesitationRatio: 1 });

  const caught = Engine.createSession('moon-004');
  Engine.recordSurprise(caught, {
    id: 'chilli',
    deltas: { novelty: 40, emotion: 20 },
  }, 'caught', { hesitationRatio: 1 });

  assert.equal(Engine.scoreSession(ignored).novelty, 50);
  assert.ok(Engine.scoreSession(caught).novelty > 50);
});

test('catching different random ingredients produces the same behavior score', () => {
  const chilli = Engine.createSession('moon-ingredient-a');
  const moonlight = Engine.createSession('moon-ingredient-b');
  Engine.recordSurprise(chilli, { id: 'chilli', name: '辣椒', deltas: { novelty: 50 } }, 'caught');
  Engine.recordSurprise(moonlight, { id: 'moonlight', name: '月光', deltas: { emotion: 50 } }, 'caught');

  assert.deepEqual(Engine.scoreSession(chilli), Engine.scoreSession(moonlight));
});

test('missing every surprise can be recorded without assigning an ingredient', () => {
  const session = Engine.createSession('moon-missed');
  assert.doesNotThrow(() => Engine.recordSurprise(session, null, 'missed'));
  assert.equal(session.choices.surprise, 'none');
  assert.equal(session.actions.at(-1).ingredientId, null);
});

test('choice behavior and fate signals contribute 45 45 and 10 percent', () => {
  const session = Engine.createSession('moon-005');
  Engine.addSignal(session, 'choice', { novelty: 40 }, '选了陌生口味');
  Engine.addSignal(session, 'behavior', { novelty: -20 }, '后续很快收手');
  Engine.addSignal(session, 'fate', { novelty: 50 }, '在分岔里选择新鲜');

  assert.equal(Engine.scoreSession(session).novelty, 64);
});

test('four binary primary axes map to all sixteen archetype codes', () => {
  const codes = new Set();
  [40, 60].forEach((novelty) => {
    [40, 60].forEach((control) => {
      [40, 60].forEach((emotion) => {
        [40, 60].forEach((intuition) => {
          codes.add(Engine.classifyTraits({ novelty, control, emotion, intuition }));
        });
      });
    });
  });

  assert.equal(codes.size, 16);
  assert.ok(codes.has('NCEI'));
  assert.ok(codes.has('FLRA'));
});

test('fate selection can reach all eight authored branches after the trigger gate', () => {
  const indexes = new Set();
  for (let seed = 0; seed < 128; seed += 4) {
    indexes.add(Engine.pickFateIndex(seed, 8));
  }
  assert.deepEqual([...indexes].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('hidden pages are triggered by over-adjusting or waiting into the焦边 zone', () => {
  assert.deepEqual(
    Engine.getHiddenPages({ ratioAdjustments: 9, bakeLevel: 72 }),
    ['indecision'],
  );
  assert.deepEqual(
    Engine.getHiddenPages({ ratioAdjustments: 2, bakeLevel: 93 }),
    ['charred-edge'],
  );
  assert.deepEqual(
    Engine.getHiddenPages({ ratioAdjustments: 11, bakeLevel: 96 }),
    ['indecision', 'charred-edge'],
  );
});

test('evidence keeps the most diagnostic real actions and limits the result', () => {
  const session = Engine.createSession('moon-006');
  Engine.addSignal(session, 'behavior', { control: 8 }, '调了两次比例');
  Engine.addSignal(session, 'behavior', { control: 38 }, '最后停在 63:37');
  Engine.addSignal(session, 'choice', { novelty: 26 }, '接住了月光碎片');
  Engine.addSignal(session, 'choice', { emotion: 4 }, '选了莲蓉');

  assert.deepEqual(Engine.selectEvidence(session, 2), [
    '最后停在 63:37',
    '接住了月光碎片',
  ]);
});

test('relative behavior deviation outranks a large but ordinary choice delta', () => {
  const session = Engine.createSession('moon-evidence-relative');
  Engine.addSignal(session, 'choice', { novelty: 45 }, '选了陌生口味');
  Engine.addSignal(session, 'behavior', { control: 12 }, '这一段明显慢下来', { diagnosticScore: 80 });
  assert.equal(Engine.selectEvidence(session, 1)[0], '这一段明显慢下来');
});
