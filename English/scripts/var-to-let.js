/**
 * 将 js/ 下所有源文件的 var 替换为 let/const
 * 保留：顶层 `var FlashcardApp = window.FlashcardApp || {};`（跨文件全局共享需要 var 挂到 window）
 */
const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { resolve } = require('path');

const JS_DIR = resolve(__dirname, '..', 'js');
const TOP_VAR_PATTERN = 'var FlashcardApp = window.FlashcardApp || {};';
const TEMP_MARKER = '@@TOP_FLASHCARDAPP@@';

const files = readdirSync(JS_DIR).filter(f => f.endsWith('.js') && !f.includes('__tests__'));

files.forEach(f => {
  const filePath = resolve(JS_DIR, f);
  let code = readFileSync(filePath, 'utf-8');
  if (!code.includes('var ')) return;

  // 保护顶层声明
  code = code.replace(TOP_VAR_PATTERN, TEMP_MARKER);

  // 所有 var 替换为 let
  code = code.replace(/\bvar\b/g, 'let');

  // 恢复顶层声明
  code = code.replace(TEMP_MARKER, TOP_VAR_PATTERN);

  writeFileSync(filePath, code, 'utf-8');
  console.log(`  ${f}`);
});

console.log('Done.');
