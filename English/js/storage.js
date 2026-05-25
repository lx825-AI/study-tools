/* storage.js —— localStorage 读写封装 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  var STORAGE_KEY = 'flashcard-data';
  App.STORAGE_KEY = STORAGE_KEY;

  App.loadData = function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        return { decks: data.decks || [], currentDeckId: data.currentDeckId || null };
      }
    } catch (e) { /* 数据损坏则重置 */ }
    return { decks: [], currentDeckId: null };
  };

  App.saveData = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        decks: App.state.decks,
        currentDeckId: App.state.currentDeckId,
      }));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        App.showToast('存储空间不足！请清理一些牌组或卡片后重试', 'error');
        console.error('localStorage quota exceeded');
      } else {
        throw e;
      }
    }
  };

})(FlashcardApp);
