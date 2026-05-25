/* models.js —— 数据模型工具 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.DIFFICULTY_MAX = 5;

  App.genId = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  App.avgDifficulty = function (deck) {
    if (deck.cards.length === 0) return 0;
    var sum = deck.cards.reduce(function (s, c) { return s + (c.difficulty || 0); }, 0);
    return sum / deck.cards.length;
  };

  /* 将旧格式 ['word','def'] 标准化为新格式 { word, definitions } */
  App.normalizeWord = function (item) {
    if (Array.isArray(item)) {
      return { word: item[0], definitions: [item[1]], phonetic: '', pos: '', phrases: [], sentences: [], synonyms: [], antonyms: [], confused: [] };
    }
    return item;
  };

})(FlashcardApp);
