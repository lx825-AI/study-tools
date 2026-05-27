/* deck-panel.js —— 牌组管理 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.handleDeckAction = function (action, deckId) {
    if (action === 'study') {
      App.state.currentDeckId = deckId;
      App.studyOrder = 'difficulty';
      document.getElementById('btnStudyOrder').innerHTML = '<span class="order-icon">⚡</span><span class="order-label">智能复习</span><span class="order-arrow">▾</span>';
      document.getElementById('btnTypingOrder').innerHTML = '<span class="order-icon">⚡</span><span class="order-label">智能复习</span><span class="order-arrow">▾</span>';
      App.saveData();
      App.startStudy();
      App.switchTab('study');
      App.renderDeckSelect();
    } else if (action === 'edit') {
      App.state.currentDeckId = deckId;
      App.saveData();
      App.renderDeckSelect();
      App.switchTab('cards');
    } else if (action === 'delete') {
      if (confirm('确定删除这个牌组？其中的卡片也会被删除。')) {
        if (App.state.currentDeckId === deckId) {
          App.state.currentDeckId = null;
        }
        App.state.decks = App.state.decks.filter(function (d) { return d.id !== deckId; });
        App.saveData();
        App.renderAll();
      }
    } else if (action === 'export') {
      App.exportDeck(deckId);
    }
  };

  /* 导出牌组 */
  App.exportDeck = function (deckId, format) {
    let deck = App.getDeck(deckId);
    if (!deck) return;
    format = format || 'json';

    let content, filename, mimeType;
    if (format === 'csv') {
      let rows = deck.cards.map(function (c) {
        let front = (c.front || c.word || '').replace(/"/g, '""');
        let back = (c.back || (c.definitions || [''])[0]).replace(/"/g, '""');
        return '"' + front + '","' + back + '"';
      });
      content = 'front,back\n' + rows.join('\n');
      filename = deck.name + '.csv';
      mimeType = 'text/csv;charset=utf-8';
    } else {
      let exportData = {
        name: deck.name,
        exportedAt: new Date().toISOString(),
        cards: deck.cards.map(function (c) {
          return {
            front: c.front || c.word || '',
            back: c.back || (c.definitions || [''])[0],
            word: c.word || c.front || '',
            phonetic: c.phonetic || '',
            pos: c.pos || '',
            definitions: c.definitions || [c.back || ''],
            phrases: c.phrases || [],
            sentences: c.sentences || [],
            synonyms: c.synonyms || [],
            antonyms: c.antonyms || [],
            confused: c.confused || [],
            difficulty: c.difficulty || 3,
            repetitions: c.repetitions || 0,
            easeFactor: c.easeFactor || 2.5,
            interval: c.interval || 0,
            nextReview: c.nextReview || ''
          };
        })
      };
      content = JSON.stringify(exportData, null, 2);
      filename = deck.name + '.json';
      mimeType = 'application/json';
    }

    let blob = new Blob(['﻿' + content], { type: mimeType }); // BOM for Chinese charset
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

})(FlashcardApp);
