/* cards-panel.js —— 卡片编辑（虚拟滚动优化） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.cardsBatchMode = false;
  /* 虚拟滚动状态 */
  App._cardListScrollTop = 0;
  App._cardListRendered = [];

  var ITEM_HEIGHT = 74;   /* 每张卡片项高度（px） */
  var BUFFER = 8;         /* 上下缓冲区项数 */

  App.renderCardsPanel = function () {
    var deck = App.getCurrentDeck();
    var content = document.getElementById('cardsContent');
    var noDeck = document.getElementById('cardsNoDeck');
    var list = document.getElementById('cardList');
    var countTitle = document.getElementById('cardsCountTitle');

    if (!deck) {
      content.style.display = 'none';
      noDeck.style.display = 'block';
      return;
    }
    noDeck.style.display = 'none';
    content.style.display = 'block';
    countTitle.textContent = '卡片列表 (' + deck.cards.length + ' 张)';

    /* 批量模式按钮状态 */
    var btnBatchMode = document.getElementById('btnBatchMode');
    var batchActions = document.getElementById('batchActions');
    if (btnBatchMode) {
      btnBatchMode.textContent = App.cardsBatchMode ? '☑ 退出批量' : '☐ 批量模式';
    }
    if (batchActions) {
      batchActions.style.display = App.cardsBatchMode ? 'flex' : 'none';
    }

    if (deck.cards.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>还没有卡片，在下方添加</p></div>';
      list.style.overflowY = 'visible';
      return;
    }

    /* 少量卡片直接渲染（避免虚拟滚动开销） */
    if (deck.cards.length <= 100) {
      list.style.overflowY = 'visible';
      list.style.height = '';
      list.innerHTML = deck.cards.map(renderCardItem).join('');
      list.scrollTop = 0;
      return;
    }

    /* 大量卡片：虚拟滚动 */
    list.style.overflowY = 'auto';
    var listHeight = Math.min(deck.cards.length * ITEM_HEIGHT, window.innerHeight * 0.7);
    list.style.height = listHeight + 'px';
    list.scrollTop = App._cardListScrollTop || 0;
    App._cardListRendered = [];   /* 重置，确保首次渲染不被跳过 */

    /* 设置总高度占位 */
    list.innerHTML = '<div style="height:' + (deck.cards.length * ITEM_HEIGHT) + 'px;position:relative;" id="cardListInner">' +
      '<div id="cardListWindow" style="position:absolute;left:0;right:0;top:0;"></div></div>';

    /* 延迟到浏览器重排后渲染，确保 clientHeight 已生效（面板从隐藏切换时高度为 0） */
    requestAnimationFrame(function () {
      App._renderVisibleCards();
    });

    /* 绑定滚动事件（仅绑定一次） */
    if (!list._hasScrollListener) {
      list._hasScrollListener = true;
      list.addEventListener('scroll', function () {
        App._cardListScrollTop = list.scrollTop;
        App._renderVisibleCards();
      });
    }
  };

  /* 渲染单张卡片 HTML */
  function renderCardItem(c, i) {
    var front = App.getCardFront(c);
    var back = App.getCardBack(c);
    var checkboxHtml = App.cardsBatchMode
      ? '<input type="checkbox" class="edit-card-checkbox" data-index="' + i + '">'
      : '';
    var deleteHtml = App.cardsBatchMode
      ? ''
      : '<button class="btn btn-danger btn-sm" data-action="deleteCard" data-index="' + i + '">删除</button>';
    return '<div class="edit-card-item" style="height:' + ITEM_HEIGHT + 'px;box-sizing:border-box;">' +
      checkboxHtml +
      '<div class="edit-card-content">' +
        '<div class="edit-card-front">' + App.escHtml(front) +
          '<button class="speak-btn-sm speak-card-btn" title="朗读">🔊</button>' +
        '</div>' +
        '<div class="edit-card-back">' + App.escHtml(back) + '</div>' +
      '</div>' +
      '<div class="edit-card-count" title="难度等级">⚡' + (c.difficulty || 0) + '</div>' +
      deleteHtml +
    '</div>';
  }

  /* 虚拟滚动：仅渲染可见范围内的卡片 */
  App._renderVisibleCards = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length <= 100) return;

    var list = document.getElementById('cardList');
    var windowEl = document.getElementById('cardListWindow');
    if (!list || !windowEl) return;

    var scrollTop = list.scrollTop;
    /* 面板刚从隐藏切换时 clientHeight 可能为 0，用显式设置的高度兜底 */
    var viewHeight = list.clientHeight || parseInt(list.style.height) || 400;
    var firstVisible = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    var lastVisible = Math.min(deck.cards.length, Math.ceil((scrollTop + viewHeight) / ITEM_HEIGHT) + BUFFER);

    /* 如果可见范围没变，跳过 */
    if (App._cardListRendered[0] === firstVisible && App._cardListRendered[1] === lastVisible) return;
    App._cardListRendered = [firstVisible, lastVisible];

    /* 只渲染可见范围内的卡片 */
    var topOffset = firstVisible * ITEM_HEIGHT;
    var html = '';
    for (var i = firstVisible; i < lastVisible; i++) {
      html += renderCardItem(deck.cards[i], i);
    }
    windowEl.style.top = topOffset + 'px';
    windowEl.innerHTML = html;
  };

  App.handleCardDelete = function (index) {
    var deck = App.getCurrentDeck();
    if (!deck) return;
    var front = deck.cards[index].front || deck.cards[index].word;
    if (confirm('确定删除卡片「' + front + '」？')) {
      deck.cards.splice(index, 1);
      App._cardListScrollTop = 0;
      App._cardListRendered = [];
      App.saveData();
      App.renderAll();
    }
  };

  /* 批量模式切换 */
  App.toggleBatchMode = function () {
    App.cardsBatchMode = !App.cardsBatchMode;
    App._cardListRendered = [];
    App.renderCardsPanel();
  };

  /* 全选 */
  App.selectAllCards = function () {
    var checkboxes = document.querySelectorAll('#cardList .edit-card-checkbox');
    checkboxes.forEach(function (cb) { cb.checked = true; });
  };

  /* 取消全选 */
  App.deselectAllCards = function () {
    var checkboxes = document.querySelectorAll('#cardList .edit-card-checkbox');
    checkboxes.forEach(function (cb) { cb.checked = false; });
  };

  /* 批量删除选中的卡片 */
  App.batchDeleteCards = function () {
    var deck = App.getCurrentDeck();
    if (!deck) return;
    var checkboxes = document.querySelectorAll('#cardList .edit-card-checkbox:checked');
    if (checkboxes.length === 0) { App.showToast('请先勾选要删除的卡片', 'warn'); return; }
    if (!confirm('确定删除选中的 ' + checkboxes.length + ' 张卡片？此操作不可撤销。')) return;

    var indices = [];
    checkboxes.forEach(function (cb) { indices.push(parseInt(cb.dataset.index)); });
    indices.sort(function (a, b) { return b - a; });
    indices.forEach(function (idx) { deck.cards.splice(idx, 1); });

    App._cardListScrollTop = 0;
    App._cardListRendered = [];
    App.saveData();
    App.renderAll();
  };

  /* 批量粘贴导入 */
  App.batchImportCards = function () {
    var deck = App.getCurrentDeck();
    if (!deck) { App.showToast('请先选择一个牌组', 'warn'); return; }
    var text = document.getElementById('batchImportText').value.trim();
    if (!text) { App.showToast('请粘贴单词数据', 'warn'); return; }

    var lines = text.split(/[\r\n]+/).filter(Boolean);
    var added = 0;
    var existingWords = new Set(deck.cards.map(function (c) { return (c.front || c.word || '').toLowerCase(); }));

    lines.forEach(function (line) {
      var parts;
      if (line.indexOf('\t') !== -1) {
        parts = line.split('\t');
      } else if (line.indexOf(',') !== -1) {
        parts = line.split(',');
      } else {
        parts = line.split(/\s{2,}/);
        if (parts.length < 2) parts = line.split(/\s+/);
        if (parts.length < 2) {
          var match = line.match(/^(\S+)\s+(.+)$/);
          if (match) parts = [match[1], match[2]];
        }
      }
      if (parts.length >= 2) {
        var word = parts[0].trim();
        var def = parts.slice(1).join(',').trim();
        if (word && def && !existingWords.has(word.toLowerCase())) {
          deck.cards.push({ id: App.genId(), front: word, back: def, difficulty: 3 });
          existingWords.add(word.toLowerCase());
          added++;
        }
      }
    });

    if (added > 0) {
      App.saveData();
      document.getElementById('batchImportText').value = '';
      App._cardListRendered = [];
      App.renderAll();
      App.showToast('成功导入 ' + added + ' 个单词', 'success');
    } else {
      App.showToast('未能解析到有效单词，请检查格式', 'error');
    }
  };

})(FlashcardApp);
