import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRound, finishNugget, initialData, loadData, parseData, questionError, STORAGE_KEY } from '../src/model.ts';

test('round sizes assign one unique question per numbered nugget', () => {
  const bank = Array.from({ length: 60 }, (_, i) => ({ ...initialData().questions[i % 12], id: `q-${i}` }));
  for (const count of [1, 5, 12, 20, 60, 100]) {
    for (const selection of ['random', 'first'] as const) {
      const round = buildRound(bank, { count, selection });
      assert.equal(round.nuggets.length, Math.min(count, bank.length));
      assert.equal(new Set(round.nuggets.map(n => n.question.id)).size, round.nuggets.length);
      assert.equal(new Set(round.nuggets.map(n => n.number)).size, round.nuggets.length);
      assert.ok(round.nuggets.every(n => n.x > 50 && n.x < 1150 && n.y > 250));
      if (selection === 'first') assert.deepEqual(round.nuggets.map(n => n.question.id), bank.slice(0, count).map(q => q.id));
    }
  }
});
test('finishing nuggets is idempotent, preserves positions, and completes a round', () => {
  const data = initialData(); let round = buildRound(data.questions, data.config);
  const original = structuredClone(round.nuggets);
  round = finishNugget(round, 4); round = finishNugget(round, 4); round = finishNugget(round, 999);
  assert.deepEqual(round.collected, [4]); assert.deepEqual(round.nuggets, original);
  for (const n of round.nuggets) round = finishNugget(round, n.number);
  assert.equal(round.collected.length, round.nuggets.length);
  const fresh = buildRound(data.questions, data.config); assert.deepEqual(fresh.collected, []); assert.equal(data.questions.length, 12);
});
test('round snapshot is independent of later bank edits', () => {
  const data = initialData(); const round = buildRound(data.questions, { count: 5, selection: 'first' });
  const text = round.nuggets[0].question.text; data.questions[0].text = 'Changed'; data.questions[0].options[0] = 'Changed option';
  assert.equal(round.nuggets[0].question.text, text); assert.notEqual(round.nuggets[0].question.options[0], 'Changed option');
});
test('JSON export/import preserves data and validates required fields', () => {
  const data = initialData(); assert.deepEqual(parseData(JSON.parse(JSON.stringify(data))), data);
  for (const change of [ { text: '' }, { options: ['a', 'b', 'c'] }, { options: ['a', 'b', '', 'd'] }, { correct: 4 }, { correct: 1.5 }, { explanation: 7 }, { id: '' } ]) {
    assert.throws(() => parseData({ ...data, questions: [{ ...data.questions[0], ...change }] }));
  }
  assert.throws(() => parseData({ ...data, questions: [data.questions[0], data.questions[0]] }));
  assert.throws(() => parseData({ version: 2, questions: [] }));
  assert.ok(questionError({ ...data.questions[0], correct: -1 }));
  assert.equal(parseData({ ...data, config: { count: 200, selection: 'first' } }).config.count, 12);
});
test('first launch, saved empty bank, corrupt data, and storage failures are distinct', () => {
  assert.equal(loadData({ getItem: () => null }).data.questions.length, 12);
  const empty = { version: 1, questions: [], config: { count: 0, selection: 'random' } };
  assert.equal(loadData({ getItem: () => JSON.stringify(empty) }).data.questions.length, 0);
  const broken = loadData({ getItem: () => '{bad' }); assert.ok(broken.warning); assert.equal(broken.data.questions.length, 0);
  const unavailable = loadData({ getItem: () => { throw new Error('blocked'); } }); assert.ok(unavailable.warning);
  const stored = initialData(); stored.questions[0].text = 'Câu hỏi đã chỉnh sửa';
  const reloaded = loadData({ getItem: key => key === STORAGE_KEY ? JSON.stringify(stored) : null });
  assert.equal(reloaded.data.questions[0].text, 'Câu hỏi đã chỉnh sửa');
});
