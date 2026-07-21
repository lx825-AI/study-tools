/* state.js —— 全局状态管理 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.state = App.loadData();

  App.getDeck = function (id) {
    return App.state.decks.find(function (d) { return d.id === id; });
  };

  App.getCurrentDeck = function () {
    return App.state.currentDeckId ? App.getDeck(App.state.currentDeckId) : null;
  };

})(FlashcardApp);
