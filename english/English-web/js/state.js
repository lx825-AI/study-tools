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

  /* 清理旧版演示牌组（v2.7 起不再创建演示数据，清除老用户存量数据） */
  App.removeDemoDecks = function () {
    var before = App.state.decks.length;
    App.state.decks = App.state.decks.filter(function (d) {
      return d.name.indexOf('（演示）') === -1;
    });
    if (App.state.currentDeckId && !App.getDeck(App.state.currentDeckId)) {
      App.state.currentDeckId = null;
    }
    if (App.state.decks.length < before) App.saveData();
  };

})(FlashcardApp);
