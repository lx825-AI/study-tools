/* utils.js —— 纯工具函数 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.escHtml = function (s) {
    if (typeof s !== 'string') return '';
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, function (c) { return map[c]; });
  };

  App.parseCSVLine = function (line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
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
    var matrix = [];
    for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (var i = 1; i <= b.length; i++) {
      for (var j = 1; j <= a.length; j++) {
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
    var inp = input.toLowerCase();
    var tgt = target.toLowerCase();
    if (tgt.indexOf(inp) !== -1) return true;            // 子串匹配
    if (inp.length >= 3 && App.levenshtein(inp, tgt) <= 2) return true; // 模糊匹配
    return false;
  };

})(FlashcardApp);
