/* preview-panel.js —— 预览模式 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.previewAnswersVisible = true;

  App.renderPreviewPanel = function () {
    var deck = App.getCurrentDeck();
    document.getElementById('previewNoDeck').style.display = 'none';
    document.getElementById('previewContent').style.display = 'none';

    if (!deck) { document.getElementById('previewNoDeck').style.display = 'block'; return; }
    document.getElementById('previewContent').style.display = 'block';
    document.getElementById('previewDeckName').textContent = deck.name;
    document.getElementById('previewCount').textContent = deck.cards.length;
    document.getElementById('previewSearch').value = '';

    var btnToggle = document.getElementById('btnToggleAnswer');
    btnToggle.textContent = App.previewAnswersVisible ? '🙈 隐藏释义' : '👁️ 显示释义';

    /* 判断是否有词性数据来决定是否显示词性列 */
    var hasPos = deck.cards.some(function (c) { return c.pos; });
    App._hasPosColumn = hasPos;
    App._renderPreviewTable(deck.cards);
  };

  App._renderPreviewTable = function (cards, highlightWord) {
    var tbody = document.getElementById('previewTbody');
    var cls = App.previewAnswersVisible ? '' : ' hidden-answer';
    var showPos = App._hasPosColumn;

    /* 动态更新表头 */
    var thead = document.querySelector('.preview-table thead tr');
    if (thead) {
      thead.innerHTML = '<th class="col-idx">#</th>' +
        '<th class="col-front">英文</th>' +
        (showPos ? '<th class="col-pos">词性</th>' : '') +
        '<th class="col-back">释义</th>';
    }

    tbody.innerHTML = cards.map(function (c, i) {
      var front = c.front || c.word || '';
      var back = c.back || (c.definitions || [''])[0];
      var pos = c.pos || '';
      var frontHtml = App.escHtml(front);
      var backHtml = App.escHtml(back);
      if (highlightWord && front.toLowerCase() === highlightWord.toLowerCase()) {
        frontHtml = '<mark>' + frontHtml + '</mark>';
      }
      return '<tr>' +
        '<td class="col-idx">' + (i + 1) + '</td>' +
        '<td class="col-front">' + frontHtml + '</td>' +
        (showPos ? '<td class="col-pos">' + App.escHtml(pos) + '</td>' : '') +
        '<td class="col-back' + cls + '">' + backHtml + '</td>' +
      '</tr>';
    }).join('');
  };

})(FlashcardApp);
