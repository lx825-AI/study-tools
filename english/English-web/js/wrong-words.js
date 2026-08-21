/* wrong-words.js —— 错词列表模块：学习模式引导页「错题强化」折叠区（EF≤1.8 跨牌组收集、单卡移出） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /** 将卡片移出错词本（EF 重置回 2.5）；存在引导页时原位刷新列表与计数 */
  App.resetFailedCard = function (cardId) {
    var found = false;
    App.state.decks.forEach(function (deck) {
      deck.cards.forEach(function (c) {
        if (c.id === cardId) {
          c.easeFactor = 2.5;
          found = true;
        }
      });
    });
    if (found) {
      App.saveData();
      App.refreshModeFailedSection();
      App.updateNavBadges();
    }
  };

  /** 单条错词列表项 HTML（与统计面板「错题统计」共用 failed-word-* 样式） */
  function _failedItemHtml(f) {
    var card = f.card;
    var def = (card.definitions && card.definitions[0]) || card.back || '';
    return '<div class="failed-word-item">' +
      '<div class="failed-word-main">' +
        '<span class="failed-word">' + App.escHtml(card.word || card.front) + '</span>' +
        (card.phonetic ? '<span class="failed-phonetic">' + App.escHtml(card.phonetic) + '</span>' : '') +
        '<span class="failed-def">' + App.escHtml(def) + '</span>' +
      '</div>' +
      '<div class="failed-word-meta">' +
        '<span class="failed-ef">EF: ' + ((card.easeFactor || 2.5).toFixed(1)) + '</span>' +
        '<span class="failed-deck">' + App.escHtml(f.deckName) + '</span>' +
        '<button class="btn btn-outline btn-sm" data-remove-card="' + card.id + '">移出</button>' +
      '</div>' +
    '</div>';
  }

  /** 折叠区 HTML（供 _renderModeGuide 拼入引导字符串；默认收起） */
  App.renderModeFailedSectionHtml = function () {
    var failed = App.collectFailedCards();
    var listHtml = failed.length === 0
      ? '<div class="empty-state" style="padding:24px 0;text-align:center;color:var(--text-muted);">🎉 暂无错词，继续保持！</div>'
      : failed.map(_failedItemHtml).join('');
    return '<div class="mode-failed-section" id="modeFailedSection">' +
      '<button class="mode-failed-toggle" id="btnToggleFailedList" type="button" aria-expanded="false">' +
        '📋 待强化错词（<span id="modeFailedCount">' + failed.length + '</span> 个）' +
        '<span class="mode-failed-arrow">▸</span>' +
      '</button>' +
      '<div class="failed-words-list" id="modeFailedList" style="display:none;">' + listHtml + '</div>' +
    '</div>';
  };

  /** 折叠区事件委托（展开/收起 + 单卡移出；引导页每次挂载时绑定一次） */
  App.bindModeFailedSection = function () {
    var section = document.getElementById('modeFailedSection');
    if (!section) return;
    var toggle = document.getElementById('btnToggleFailedList');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = section.classList.toggle('open');
        var list = document.getElementById('modeFailedList');
        if (list) list.style.display = open ? '' : 'none';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    section.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove-card]');
      if (btn) App.resetFailedCard(btn.getAttribute('data-remove-card'));
    });
  };

  /** 原位刷新列表与计数（保持展开态、不重绑事件）；引导页未挂载时静默返回 */
  App.refreshModeFailedSection = function () {
    var list = document.getElementById('modeFailedList');
    if (!list) return;
    var failed = App.collectFailedCards();
    list.innerHTML = failed.length === 0
      ? '<div class="empty-state" style="padding:24px 0;text-align:center;color:var(--text-muted);">🎉 暂无错词，继续保持！</div>'
      : failed.map(_failedItemHtml).join('');
    var count = document.getElementById('modeFailedCount');
    if (count) count.textContent = failed.length;
    var cardCount = document.querySelector('#modeCardFailed .mode-card-count');
    if (cardCount) {
      cardCount.textContent = failed.length > 0 ? failed.length + ' 个待强化' : '暂无错词';
      cardCount.classList.toggle('count-empty', failed.length === 0);
    }
  };
})(FlashcardApp);
