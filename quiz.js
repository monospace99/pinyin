// ── AGE SETTINGS ──────────────────────────────────────────────────────────────
// types: ctp = char→pinyin, ptc = pinyin→char, mtc = meaning→char
// hint:  show the English meaning under the question
const ages = {
    5:  { label:'5',   color:'#FF6FB5', minLevel:1, maxLevel:1, questions:5,  choices:3, types:['ctp','ptc'],       hint:true  },
    6:  { label:'6',   color:'#FF8E53', minLevel:1, maxLevel:1, questions:6,  choices:4, types:['ctp','ptc'],       hint:true  },
    7:  { label:'7',   color:'#F1C40F', minLevel:1, maxLevel:2, questions:8,  choices:4, types:['ctp','ptc'],       hint:false },
    8:  { label:'8',   color:'#4ECDC4', minLevel:1, maxLevel:2, questions:10, choices:4, types:['ctp','ptc'],       hint:false },
    9:  { label:'9',   color:'#2ECC71', minLevel:2, maxLevel:3, questions:10, choices:4, types:['ctp','ptc','mtc'], hint:false },
    10: { label:'10+', color:'#3498DB', minLevel:2, maxLevel:3, questions:12, choices:6, types:['ctp','ptc','mtc'], hint:false },
};

// ── UTILS ────────────────────────────────────────────────────────────────────
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── QUESTION GENERATION ───────────────────────────────────────────────────────
function buildQuestions(p, words = vocab) {
    const pool = words.filter(v => v.level >= p.minLevel && v.level <= p.maxLevel);

    // pinyin → frequency within this pool (to detect ambiguous ones like 他/她 both tā)
    const freq = {};
    pool.forEach(v => freq[v.pinyin] = (freq[v.pinyin] || 0) + 1);

    const picked = shuffle(pool).slice(0, p.questions);
    return picked.map(correct => {
        // if pinyin is shared by multiple chars, pinyin→char has two right answers
        let types = p.types;
        if (freq[correct.pinyin] > 1) types = types.filter(t => t !== 'ptc');
        const type = types[Math.floor(Math.random() * types.length)];

        // options are shown as pinyin for ctp, as characters otherwise;
        // skip wrongs that would look identical to the answer or to each other
        const seen = new Set([correct.pinyin, correct.char, correct.meaning]);
        const wrongs = [];
        for (const v of shuffle(pool)) {
            if (wrongs.length === p.choices - 1) break;
            const keys = type === 'ctp' ? [v.pinyin] : [v.char, v.pinyin, v.meaning];
            if (keys.some(k => seen.has(k))) continue;
            keys.forEach(k => seen.add(k));
            wrongs.push(v);
        }
        const options = shuffle([correct, ...wrongs]);
        return { type, correct, options };
    });
}

// ── RESULT RATING ─────────────────────────────────────────────────────────────
function rating(score, total) {
    const pct = score / total;
    if (pct === 1)  return { stars:'⭐⭐⭐⭐⭐', msg:`🎊 PERFECT! You're a Pinyin Master! 🎊`, emoji:'🏆', celebrate:true  };
    if (pct >= .8)  return { stars:'⭐⭐⭐⭐☆', msg:`Amazing! Almost perfect! 🌟`,            emoji:'🎉', celebrate:true  };
    if (pct >= .6)  return { stars:'⭐⭐⭐☆☆', msg:`Great work! Keep it up! 💪`,              emoji:'😊', celebrate:false };
    if (pct >= .4)  return { stars:'⭐⭐☆☆☆', msg:`Good try! You're learning! 📚`,           emoji:'🙂', celebrate:false };
    return                 { stars:'⭐☆☆☆☆', msg:`Keep going! Practice makes perfect! 🌱`,  emoji:'🐼', celebrate:false };
}

// lets the tests load this file in Node; ignored in the browser
if (typeof module !== 'undefined') module.exports = { ages, shuffle, buildQuestions, rating };
