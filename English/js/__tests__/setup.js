/**
 * 测试 setup：将 IIFE 源文件以普通脚本方式在 jsdom 中执行，
 * 确保 `var FlashcardApp = window.FlashcardApp` 正确挂载到 window 上。
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 依赖顺序加载
const files = [
  'models.js',
  'utils.js',
  'study-panel.js',
  'idb-storage.js',
];

files.forEach(f => {
  const code = readFileSync(resolve(__dirname, '..', f), 'utf-8');
  // 注释掉开头的那行 var FlashcardApp = window.FlashcardApp || {};
  // 只保留 IIFE 内容，通过 eval 在全局作用域执行
  const iife = code.replace(/^var FlashcardApp = window\.FlashcardApp \|\| \{\};?\s*/m, '');
  window.FlashcardApp = window.FlashcardApp || {};
  const wrapped = '(function(App) {\n' + iife + '\n})(window.FlashcardApp);';
  (0, eval)(wrapped);
});

// 每个测试初始状态
beforeEach(() => {
  // 重置 IndexedDB 缓存，确保 loadData 每次从 localStorage 重新读取
  window.FlashcardApp._idbCache = undefined;
  window.FlashcardApp.state = window.FlashcardApp.state || {};
  window.FlashcardApp.state.decks = window.FlashcardApp.state.decks || [];
});
