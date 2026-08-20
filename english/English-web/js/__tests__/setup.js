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
  'idb-storage.js',
  'state.js',
  'models.js',
  'utils.js',
  'ebbinghaus.js',
  '../data/word-schema.js',
  'ui.js',
  'daily-quote.js',
  'quick-mode.js',
  'study-panel.js',
  'wrong-words.js',
  'import.js',
  'stats-panel.js',
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

/**
 * 共享 DOM 桩：学习面板完整结构
 * （renderStudyPanel/answerStudy/checkSpelling/toggleSpellMode 所需的全部 DOM 元素）
 */
window.mountStudyDOM = function () {
  document.body.innerHTML =
    '<div id="panelStudy" class="panel visible">' +
      '<div id="studyNoDeck" style="display:none"></div>' +
      '<div id="studyContent" style="display:none">' +
        '<div class="study-header"><button id="btnBackToMode"></button></div>' +
        '<div class="card-scene">' +
          '<div class="flashcard" id="flashcard">' +
            '<div class="card-face card-front">' +
              '<div class="card-text" id="cardFrontText"></div>' +
              '<div class="card-hint"></div>' +
            '</div>' +
            '<div class="card-face card-back"><div class="card-text" id="cardBackText"></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="study-actions"></div>' +
        '<div class="spell-mode-section" id="spellModeSection" style="display:none">' +
          '<button id="btnToggleSpell"></button>' +
        '</div>' +
      '</div>' +
      '<div id="studyComplete" style="display:none">' +
        '<div id="completeTitle"></div>' +
        '<div id="completeStats"></div>' +
        '<button id="btnRestart"></button>' +
      '</div>' +
      '<div id="studyEmpty" style="display:none"></div>' +
    '</div>' +
    '<button id="btnFail"></button>' +
    '<button id="btnPass"></button>' +
    '<button id="btnPrevCard"></button>' +
    '<div id="studyModeSelect"></div>' +
    '<div id="studyDeckName"></div>' +
    '<div id="studyProgress"></div>' +
    '<div id="progressFill"></div>';
};
