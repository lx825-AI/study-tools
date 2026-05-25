/* cards-panel.js —— 卡片编辑 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.cardsBatchMode = false;

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
      return;
    }

    list.innerHTML = deck.cards.map(function (c, i) {
      var front = c.front || c.word || '';
      var back = c.back || (c.definitions || [''])[0];
      var checkboxHtml = App.cardsBatchMode
        ? '<input type="checkbox" class="edit-card-checkbox" data-index="' + i + '">'
        : '';
      var deleteHtml = App.cardsBatchMode
        ? ''
        : '<button class="btn btn-danger btn-sm" data-action="deleteCard" data-index="' + i + '">删除</button>';
      return '<div class="edit-card-item">' +
        checkboxHtml +
        '<div class="edit-card-content">' +
          '<div class="edit-card-front">' + App.escHtml(front) + '</div>' +
          '<div class="edit-card-back">' + App.escHtml(back) + '</div>' +
        '</div>' +
        '<div class="edit-card-count" title="难度等级">⚡' + (c.difficulty || 0) + '</div>' +
        deleteHtml +
      '</div>';
    }).join('');
  };

  App.handleCardDelete = function (index) {
    var deck = App.getCurrentDeck();
    if (!deck) return;
    var front = deck.cards[index].front || deck.cards[index].word;
    if (confirm('确定删除卡片「' + front + '」？')) {
      deck.cards.splice(index, 1);
      App.saveData();
      App.renderAll();
    }
  };

  /* 批量模式切换 */
  App.toggleBatchMode = function () {
    App.cardsBatchMode = !App.cardsBatchMode;
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

    /* 从后往前删，索引不漂移 */
    var indices = [];
    checkboxes.forEach(function (cb) { indices.push(parseInt(cb.dataset.index)); });
    indices.sort(function (a, b) { return b - a; });
    indices.forEach(function (idx) { deck.cards.splice(idx, 1); });

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
      /* 支持: word  definition (空格/制表符分隔) 或 word,definition (逗号分隔) */
      var parts;
      if (line.indexOf('\t') !== -1) {
        parts = line.split('\t');
      } else if (line.indexOf(',') !== -1) {
        parts = line.split(',');
      } else {
        parts = line.split(/\s{2,}/);
        if (parts.length < 2) parts = line.split(/\s+/);
        /* 如果第一个词后面有空格，尝试拆分为 [word, rest] */
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
      App.renderAll();
      App.showToast('成功导入 ' + added + ' 个单词', 'success');
    } else {
      App.showToast('未能解析到有效单词，请检查格式', 'error');
    }
  };

})(FlashcardApp);
