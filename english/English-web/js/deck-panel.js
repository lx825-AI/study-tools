/* deck-panel.js —— 牌组管理 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.handleDeckAction = function (action, deckId) {
    if (action === 'study') {
      App.state.currentDeckId = deckId;
      App.isReviewMode = false;
      App.reviewSourceDeckId = null;
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
    }
  };

})(FlashcardApp);
