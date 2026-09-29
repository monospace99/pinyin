const test   = require('node:test');
const assert = require('node:assert/strict');
const { vocab } = require('../vocab.js');
const { ages, shuffle, buildQuestions, rating } = require('../quiz.js');

// questions are random, so each check runs over many quizzes
const RUNS = 300;

// what the player sees on each answer button
const shown = (q, opt) => q.type === 'ctp' ? opt.pinyin : opt.char;

// ── AGE SETTINGS ──────────────────────────────────────────────────────────────
test('ages 5 to 10+ are available', () => {
    assert.deepEqual(Object.keys(ages), ['5', '6', '7', '8', '9', '10']);
    assert.equal(ages[10].label, '10+');
});

test('each age has valid settings', () => {
    for (const [age, p] of Object.entries(ages)) {
        assert.ok(p.minLevel <= p.maxLevel, `age ${age}: minLevel > maxLevel`);
        assert.ok(p.questions > 0, `age ${age}: no questions`);
        assert.ok(p.choices >= 2, `age ${age}: fewer than 2 choices`);
        assert.ok(p.types.length > 0, `age ${age}: no question types`);
        assert.ok(p.types.every(t => ['ctp', 'ptc', 'mtc'].includes(t)), `age ${age}: unknown type`);
    }
});

test('older ages never get an easier quiz', () => {
    const list = Object.values(ages);
    for (let i = 1; i < list.length; i++) {
        const [younger, older] = [list[i - 1], list[i]];
        assert.ok(older.maxLevel  >= younger.maxLevel,  `${older.label}: lower word level`);
        assert.ok(older.questions >= younger.questions, `${older.label}: fewer questions`);
        assert.ok(older.choices   >= younger.choices,   `${older.label}: fewer choices`);
    }
});

test('only ages 5 and 6 get the English hint', () => {
    for (const [age, p] of Object.entries(ages)) {
        assert.equal(p.hint, age <= 6, `age ${age}`);
    }
});

test('"Which word means…?" questions are only for ages 9 and up', () => {
    for (const [age, p] of Object.entries(ages)) {
        assert.equal(p.types.includes('mtc'), age >= 9, `age ${age}`);
    }
});

// ── QUESTION GENERATION ───────────────────────────────────────────────────────
for (const [age, p] of Object.entries(ages)) {
    test(`age ${p.label}: quizzes are built correctly`, () => {
        for (let r = 0; r < RUNS; r++) {
            const qs = buildQuestions(p, vocab);

            assert.equal(qs.length, p.questions, 'wrong number of questions');
            assert.equal(new Set(qs.map(q => q.correct.char)).size, qs.length,
                'same word asked twice in one quiz');

            for (const q of qs) {
                assert.ok(p.types.includes(q.type), `type ${q.type} not allowed`);
                assert.equal(q.options.length, p.choices, `${q.correct.char}: wrong number of choices`);

                const answers = q.options.filter(o => o.char === q.correct.char);
                assert.equal(answers.length, 1, `${q.correct.char}: correct answer not in options exactly once`);

                const labels = q.options.map(o => shown(q, o));
                assert.equal(new Set(labels).size, labels.length, `duplicate buttons: ${labels}`);

                for (const o of [q.correct, ...q.options]) {
                    assert.ok(o.level >= p.minLevel && o.level <= p.maxLevel,
                        `${o.char} (level ${o.level}) outside age ${age}'s levels`);
                }
            }
        }
    });
}

test('only one option matches the question (no second right answer)', () => {
    for (const p of Object.values(ages)) {
        for (let r = 0; r < RUNS; r++) {
            for (const q of buildQuestions(p, vocab)) {
                const matches = q.options.filter(o =>
                    q.type === 'ctp' ? o.pinyin  === q.correct.pinyin  :
                    q.type === 'ptc' ? o.pinyin  === q.correct.pinyin  :
                                       o.meaning === q.correct.meaning);
                assert.equal(matches.length, 1, `${q.type} ${q.correct.char}: ${matches.length} matches`);
            }
        }
    }
});

test('他 and 她 (both tā) are never asked as pinyin → character', () => {
    for (let r = 0; r < RUNS; r++) {
        for (const q of buildQuestions(ages[6], vocab)) {
            if (q.correct.pinyin === 'tā') assert.notEqual(q.type, 'ptc');
        }
    }
});

test('a small word list gives fewer choices instead of crashing', () => {
    const words = [
        { char:'一', pinyin:'yī', meaning:'one', level:1 },
        { char:'二', pinyin:'èr', meaning:'two', level:1 },
    ];
    const qs = buildQuestions({ ...ages[6], questions: 5 }, words);
    assert.equal(qs.length, 2);
    for (const q of qs) assert.equal(q.options.length, 2);
});

// ── SHUFFLE ───────────────────────────────────────────────────────────────────
test('shuffle keeps the same items and does not change the original', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy  = [...input];
    const out   = shuffle(input);
    assert.deepEqual(input, copy);
    assert.deepEqual([...out].sort((a, b) => a - b), copy);
});

test('shuffle actually changes the order', () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    let changed = false;
    for (let r = 0; r < 10 && !changed; r++) {
        changed = shuffle(input).some((v, i) => v !== input[i]);
    }
    assert.ok(changed);
});

// ── RESULT RATING ─────────────────────────────────────────────────────────────
test('stars match the score', () => {
    const cases = [
        [10, 10, 5], [9, 10, 4], [8, 10, 4], [7, 10, 3], [6, 10, 3],
        [5, 10, 2], [4, 10, 2], [3, 10, 1], [0, 10, 1],
        [5, 5, 5], [4, 5, 4], [3, 5, 3], [2, 5, 2], [1, 5, 1],
    ];
    for (const [score, total, stars] of cases) {
        const r = rating(score, total);
        assert.equal([...r.stars].filter(s => s === '⭐').length, stars, `${score}/${total}`);
        assert.equal([...r.stars].length, 5, `${score}/${total}: not 5 star slots`);
    }
});

test('confetti only for 80% and above', () => {
    assert.equal(rating(10, 10).celebrate, true);
    assert.equal(rating(8, 10).celebrate, true);
    assert.equal(rating(7, 10).celebrate, false);
    assert.equal(rating(0, 10).celebrate, false);
});

test('results messages do not mention any names', () => {
    for (let score = 0; score <= 12; score++) {
        const { msg } = rating(score, 12);
        assert.doesNotMatch(msg, /Ella|Elliott/);
    }
});
