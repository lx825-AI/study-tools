/* utils.js —— 纯工具函数 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.escHtml = function (s) {
    if (typeof s !== 'string') return '';
    let map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, function (c) { return map[c]; });
  };

  /* 安全获取卡片的正面文本（英文单词） */
  App.getCardFront = function (c) {
    return c.front || c.word || '';
  };

  /* 安全获取卡片的背面文本（释义），处理 definitions 可能是字符串或数组的情况 */
  App.getCardBack = function (c) {
    if (c.back) return c.back;
    var defs = c.definitions;
    if (!defs) return '';
    if (Array.isArray(defs)) return defs.filter(Boolean).join('; ') || '';
    return defs;
  };

  App.parseCSVLine = function (line) {
    let result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
      else { current += ch; }
    }
    result.push(current);
    return result;
  };

  /* Levenshtein 距离，用于模糊搜索 */
  App.levenshtein = function (a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    let matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }
    return matrix[b.length][a.length];
  };

  /* 判读字符串是否模糊匹配（编辑距离 ≤ 2） */
  App.fuzzyMatch = function (input, target) {
    let inp = input.toLowerCase();
    let tgt = target.toLowerCase();
    if (tgt.indexOf(inp) !== -1) return true;            // 子串匹配
    if (inp.length >= 3 && App.levenshtein(inp, tgt) <= 2) return true; // 模糊匹配
    return false;
  };

  /* ========== 拼写槽位纯函数（对齐小程序 helpers.js） ========== */

  /* 剥除非字母（撇号/连字符/空格/数字/标点全部去除） */
  App.lettersOnly = function (str) {
    return (str || '').replace(/[^a-zA-Z]/g, '');
  };

  /* 单词解析为字母槽 + 静态分隔符：空格→组间分隔，撇号/连字符→static 槽，字母→letter 槽（全局 letterIndex 跨组连续） */
  App.parseWordSlots = function (word) {
    var groups = [];
    var letterCount = 0;
    (word || '').split(/\s+/).forEach(function (part) {
      if (!part) return;
      groups.push(part.split('').map(function (ch) {
        if (/[a-zA-Z]/.test(ch)) return { kind: 'letter', char: ch, letterIndex: letterCount++ };
        return { kind: 'static', char: ch };
      }));
    });
    return { groups: groups, letterCount: letterCount };
  };

  /* 从隐藏输入框的值重建槽位字母数组（过滤非字母、按序填充、截断到 letterCount）
   * 单输入框方案：native 值为真值源，退格=值变短，末尾字母自动撤回 */
  App.rebuildSlotLetters = function (value, letterCount) {
    var chars = (value || '').replace(/[^a-zA-Z]/g, '').split('');
    var letters = Array(letterCount).fill('');
    for (var i = 0; i < Math.min(chars.length, letterCount); i++) {
      letters[i] = chars[i];
    }
    return { letters: letters, filled: chars.length >= letterCount };
  };

  /* 第一个空槽索引（当前输入光标位）；全部填满返回 -1 */
  App.firstEmptySlotIndex = function (letters) {
    for (var i = 0; i < (letters || []).length; i++) {
      if (!letters[i]) return i;
    }
    return -1;
  };

  /* 每日目标词数（默认 10，损坏值兜底；统计页 KPI 与学习模式引导页共用） */
  App.getDailyGoal = function () {
    var goal = parseInt(localStorage.getItem('flashcard-daily-goal') || '10', 10);
    if (!isFinite(goal) || goal <= 0) goal = 10;
    return goal;
  };

  /* 卡片阶段分类（对齐小程序 preview filterTabs 口径：新词 stage0/无、学习中 1-6、已掌握 ≥7） */
  App.cardStageCategory = function (card) {
    var stage = card.ebbinghausStage;
    if (!stage || stage === 0) return 'new';
    if (stage >= App.EB_MASTERED_STAGE) return 'mastered';
    return 'learning';
  };

  /* 按分类筛选卡片，保留 deck.cards 原下标（删除/批量删除依赖 data-index 原下标） */
  App.filterCardsByStage = function (cards, filter) {
    var out = [];
    cards.forEach(function (c, i) {
      if (filter === 'all' || App.cardStageCategory(c) === filter) {
        out.push({ card: c, index: i });
      }
    });
    return out;
  };

})(FlashcardApp);
