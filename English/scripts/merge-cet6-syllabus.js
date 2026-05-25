/** merge-cet6-syllabus.js —— 合并四级大纲 + 六级大纲增量 + 六级核心独有词 → 完整六级大纲 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORDBOOKS_DIR = path.join(ROOT, 'wordbooks');

function parseWordbook(name) {
  const filePath = path.join(WORDBOOKS_DIR, name + '.js');
  if (!fs.existsSync(filePath)) {
    console.warn('  ⚠ File not found: ' + name + ', skipping');
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/window\.__VOCAB_REGISTRY__\['[^']+'\]\s*=\s*(\{[\s\S]*\})\s*;?\s*$/m);
  if (!match) {
    console.error('  ✗ Failed to parse: ' + name);
    return null;
  }
  let data;
  try {
    data = eval('(' + match[1] + ')');
  } catch (e) {
    console.error('  ✗ Failed to eval: ' + name, e.message);
    return null;
  }
  return data;
}

/* 加载三个源文件 */
console.log('Loading source wordbooks...');
const cet6delta = parseWordbook('cet6-syllabus-enriched');
const cet6core = parseWordbook('cet6-core-enriched');
const cet4 = parseWordbook('cet4-syllabus-enriched');

if (!cet6delta || !cet6core || !cet4) {
  console.error('Failed to load required wordbooks. Aborting.');
  process.exit(1);
}

console.log('  CET-6 syllabus delta: ' + cet6delta.words.length + ' words');
console.log('  CET-6 core:           ' + cet6core.words.length + ' words');
console.log('  CET-4 syllabus:       ' + cet4.words.length + ' words');

/* 合并：优先级 CET-6 delta > CET-6 core > CET-4 */
const merged = new Map();

function addWords(words, source) {
  let added = 0;
  for (const w of words) {
    const key = w.word.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, w);
      added++;
    }
  }
  return added;
}

const fromDelta = addWords(cet6delta.words, 'delta');
const fromCore = addWords(cet6core.words, 'core');
const fromCET4 = addWords(cet4.words, 'cet4');

console.log('\nMerge results:');
console.log('  From CET-6 delta (priority 1): ' + fromDelta + ' words');
console.log('  From CET-6 core (priority 2):  ' + fromCore + ' words');
console.log('  From CET-4 (priority 3):       ' + fromCET4 + ' words');
console.log('  Total merged:                  ' + merged.size + ' words');

/* 按字母排序 */
const sorted = Array.from(merged.values()).sort((a, b) =>
  a.word.localeCompare(b.word, 'en', { sensitivity: 'base' })
);

/* 生成输出文件 */
const jsonLines = sorted.map(w => '    ' + JSON.stringify(w)).join(',\n');

const total = sorted.length;
const content = [
  "window.__VOCAB_REGISTRY__ = window.__VOCAB_REGISTRY__ || {};",
  "window.__VOCAB_REGISTRY__['cet6-syllabus-enriched'] = {",
  "  name: '六级完整大纲（含词性）',",
  "  description: 'CET-6 完整考纲词汇（含四级），源自《全国大学英语四、六级考试大纲（2016年修订版）》，" + total + " 词，含词性标注',",
  "  words: [",
  jsonLines,
  "  ]",
  "};",
  ""
].join('\n');

const outFile = path.join(WORDBOOKS_DIR, 'cet6-syllabus-enriched.js');
fs.writeFileSync(outFile, content);
console.log('\n✓ Written: ' + outFile + ' (' + Buffer.byteLength(content, 'utf8').toLocaleString() + ' bytes)');
console.log('✓ Done.');
