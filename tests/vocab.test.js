const test   = require('node:test');
const assert = require('node:assert/strict');
const { vocab } = require('../vocab.js');
const { ages }  = require('../quiz.js');

test('every word has a character, pinyin, meaning and level 1–3', () => {
    for (const v of vocab) {
        assert.ok(v.char,    `missing char: ${JSON.stringify(v)}`);
        assert.ok(v.pinyin,  `missing pinyin: ${v.char}`);
        assert.ok(v.meaning, `missing meaning: ${v.char}`);
        assert.ok([1, 2, 3].includes(v.level), `bad level for ${v.char}: ${v.level}`);
    }
});

test('no character appears twice', () => {
    const seen = new Set();
    for (const v of vocab) {
        assert.ok(!seen.has(v.char), `duplicate: ${v.char}`);
        seen.add(v.char);
    }
});

test('no meaning appears twice (needed for "Which word means…?")', () => {
    const seen = new Set();
    for (const v of vocab) {
        assert.ok(!seen.has(v.meaning), `duplicate meaning: ${v.meaning}`);
        seen.add(v.meaning);
    }
});

test('pinyin has one space-separated syllable per character', () => {
    for (const v of vocab) {
        const syllables = v.pinyin.split(' ');
        assert.equal(syllables.length, [...v.char].length, `${v.char} → "${v.pinyin}"`);
        assert.ok(syllables.every(s => s.length > 0), `extra space in "${v.pinyin}"`);
    }
});

test('pinyin uses tone marks, not tone numbers', () => {
    for (const v of vocab) {
        assert.doesNotMatch(v.pinyin, /\d/, `${v.char} → "${v.pinyin}"`);
    }
});

test('every age has enough words for a full quiz', () => {
    for (const [age, p] of Object.entries(ages)) {
        const pool = vocab.filter(v => v.level >= p.minLevel && v.level <= p.maxLevel);
        assert.ok(pool.length >= p.questions,
            `age ${age}: ${pool.length} words for ${p.questions} questions`);
        assert.ok(pool.length >= p.choices, `age ${age}: not enough words for ${p.choices} choices`);
    }
});
