const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlineScript = html.split('<script>')[1].split('</script>')[0];

test('every script the page loads exists', () => {
    const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(srcs, ['vocab.js', 'quiz.js']);
    for (const src of srcs) assert.ok(fs.existsSync(path.join(root, src)), `${src} missing`);
});

test('the page script has no syntax errors', () => {
    assert.doesNotThrow(() => new Function(inlineScript));
});

test('every onclick calls a function that exists', () => {
    const calls = [...html.matchAll(/onclick="(\w+)\(/g)].map(m => m[1]);
    assert.ok(calls.length > 0);
    for (const fn of calls) {
        assert.match(inlineScript, new RegExp(`function ${fn}\\(`), `${fn}() not defined`);
    }
});

test('the quiz screen has a Home button', () => {
    const quiz = html.split('id="s-quiz"')[1].split('id="s-results"')[0];
    assert.match(quiz, /onclick="goHome\(\)"/);
});

test('the start screen asks for age, not names', () => {
    assert.match(html, /How old are you\?/);
    assert.doesNotMatch(html, /Ella|Elliott/);
});
