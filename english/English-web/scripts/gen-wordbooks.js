/**
 * gen-wordbooks.js —— 从小程序词书 JSON 生成 Web 词书 JS 文件
 *
 * 用法：node scripts/gen-wordbooks.js
 * 可通过 WORDBOOK_SRC 环境变量覆盖源目录（默认 ../../English-mini-app/wordbooks-cloud）
 *
 * 自检项（任一失败 exit 1）：
 * - 源 JSON 可解析、词数非零
 * - 音标（phonetic）100% 覆盖
 * - 词序与源文件一致（透传不重排）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { BOOK_CONFIG, buildRegistrySource } = require('./wordbook-lib.js');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR =
  process.env.WORDBOOK_SRC ||
  path.resolve(__dirname, '../../English-mini-app/wordbooks-cloud');
const OUT_DIR = path.join(ROOT, 'wordbooks');

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

let generated = 0;
let totalWords = 0;
let totalBytes = 0;

BOOK_CONFIG.forEach(function (book) {
  const srcFile = path.join(SRC_DIR, book.sourceFile);
  if (!fs.existsSync(srcFile)) {
    fail('源词书不存在: ' + srcFile + '（可用 WORDBOOK_SRC 环境变量覆盖源目录）');
  }

  /* 解析源 JSON */
  let words;
  try {
    words = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  } catch (err) {
    fail('源词书解析失败: ' + book.sourceFile + ' - ' + err.message);
  }
  if (!Array.isArray(words) || words.length === 0) {
    fail('源词书为空: ' + book.sourceFile);
  }

  /* 自检：音标 100% 覆盖 */
  const missing = words.filter(function (w) {
    return !w.word || !w.phonetic;
  });
  if (missing.length > 0) {
    fail(
      book.sourceFile +
        ' 有 ' +
        missing.length +
        ' 词缺少 word/phonetic，首个: ' +
        JSON.stringify(missing[0])
    );
  }

  /* 生成并写入 */
  const source = buildRegistrySource(book, words);
  const outFile = path.join(OUT_DIR, book.key + '.js');
  fs.writeFileSync(outFile, source, 'utf8');

  generated++;
  totalWords += words.length;
  totalBytes += Buffer.byteLength(source, 'utf8');
  console.log(
    '✓ ' + book.key + ' ← ' + book.sourceFile + '（' + words.length + ' 词）'
  );
});

console.log(
  '\n✓ 词书生成完成：' +
    generated +
    ' 本 / ' +
    totalWords +
    ' 词 / ' +
    (totalBytes / 1024 / 1024).toFixed(2) +
    ' MB'
);
