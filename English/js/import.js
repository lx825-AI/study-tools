/* import.js —— 词书导入 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  window.__VOCAB_REGISTRY__ = window.__VOCAB_REGISTRY__ || {};

  App.BUILTIN_WORDBOOKS = [
    { key: 'senior-high-enriched',     name: '高中英语词汇（含词性）',  desc: '高中英语大纲词汇约 3500 词，含词性标注',                      file: 'wordbooks/senior-high-enriched.js' },
    { key: 'kaoyan-enriched',          name: '考研英语词汇（含词性）',  desc: '考研英语大纲词汇约 5500 词，含词性标注',                      file: 'wordbooks/kaoyan-enriched.js' },
    { key: 'cet6-core-enriched',       name: '六级核心高频（含词性）',  desc: 'CET-6 高频约 2138 词，含自动词性标注（43%覆盖）',            file: 'wordbooks/cet6-core-enriched.js' },
    { key: 'cet4-syllabus-enriched',   name: '四级大纲词汇（含词性）',  desc: 'CET-4 完整考纲词汇约 4541 词，含自动词性标注（33%覆盖）',     file: 'wordbooks/cet4-syllabus-enriched.js' },
    { key: 'cet6-syllabus-enriched',   name: '六级完整大纲（含词性）',  desc: 'CET-6 完整考纲词汇（含四级）约 6363 词，含词性标注',     file: 'wordbooks/cet6-syllabus-enriched.js' },
  ];

  App._wordbookFetching = {};

  /** 通过动态 &lt;script&gt; 标签加载 JS 词书（文件自注册到 window.__VOCAB_REGISTRY__） */
  App.loadWordbookScript = function (bookInfo) {
    if (window.__VOCAB_REGISTRY__[bookInfo.key]) {
      return Promise.resolve(window.__VOCAB_REGISTRY__[bookInfo.key]);
    }
    /* 去重：同一词书只发一次请求 */
    if (App._wordbookFetching[bookInfo.key]) {
      return App._wordbookFetching[bookInfo.key];
    }
    App._wordbookFetching[bookInfo.key] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = bookInfo.file;
      script.onload = function () {
        delete App._wordbookFetching[bookInfo.key];
        var data = window.__VOCAB_REGISTRY__[bookInfo.key];
        if (data) {
          resolve(data);
        } else {
          reject(new Error('词书脚本已加载但未注册数据: ' + bookInfo.file));
        }
      };
      script.onerror = function () {
        delete App._wordbookFetching[bookInfo.key];
        reject(new Error('词书加载失败: ' + bookInfo.file + ' (脚本加载错误)'));
      };
      document.head.appendChild(script);
    });
    return App._wordbookFetching[bookInfo.key];
  };

  App.getRegisteredWordbooks = function () {
    return App.BUILTIN_WORDBOOKS.map(function (b) {
      return {
        key: b.key,
        name: b.name,
        desc: b.desc,
        file: b.file,
        loaded: !!window.__VOCAB_REGISTRY__[b.key],
        count: window.__VOCAB_REGISTRY__[b.key] ? window.__VOCAB_REGISTRY__[b.key].words.length : 0
      };
    });
  };

  App.isWordbookImported = function (bookInfo) {
    var data = window.__VOCAB_REGISTRY__[bookInfo.key];
    if (!data) return false;
    return !!App.state.decks.find(function (d) { return d.name === data.name; });
  };

  App.importWordbookFromRegistry = function (bookKey) {
    var data = window.__VOCAB_REGISTRY__[bookKey];
    if (!data) { App.showToast('词书数据未加载，请先加载词书', 'error'); return; }

    var deck = App.state.decks.find(function (d) { return d.name === data.name; });
    var existingWords = deck ? new Set(deck.cards.map(function (c) { return (c.front || c.word || '').toLowerCase(); })) : new Set();
    var added = 0;

    if (!deck) {
      deck = { id: App.genId(), name: data.name, cards: [] };
      App.state.decks.push(deck);
    }

    data.words.forEach(function (item) {
      var front = Array.isArray(item) ? item[0] : item.word;
      var back = Array.isArray(item) ? item[1] : (item.definitions || [''])[0];
      if (!existingWords.has(front.toLowerCase())) {
        var card = Array.isArray(item)
          ? { id: App.genId(), front: front, back: back, difficulty: Math.floor(Math.random() * 5) + 1 }
          : { id: App.genId(), front: front, back: back, word: item.word, phonetic: item.phonetic || '', pos: item.pos || '', definitions: item.definitions || [back], phrases: item.phrases || [], sentences: item.sentences || [], synonyms: item.synonyms || [], antonyms: item.antonyms || [], confused: item.confused || [], difficulty: Math.floor(Math.random() * 5) + 1 };
        deck.cards.push(card);
        existingWords.add(front.toLowerCase());
        added++;
      }
    });

    App.saveData();
    App.renderAll();
    App.closeImportModal();
    App.showToast('已导入「' + data.name + '」，新增 ' + added + ' 个单词', 'success');
  };

  App.loadAndImportWordbook = async function (bookInfo) {
    var statusEl = document.getElementById('importStatus');
    try {
      statusEl.innerHTML = '<span class="spinner"></span>加载中...';
      statusEl.style.color = '#64748b';
      await App.loadWordbookScript(bookInfo);
      App.importWordbookFromRegistry(bookInfo.key);
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.style.color = '#dc2626';
      console.error(err);
    }
  };

  App.handleFileImport = function (file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var text = e.target.result;
        var words = [];
        var deckName = '';

        if (file.name.endsWith('.json')) {
          var data = JSON.parse(text);
          deckName = data.name || file.name.replace('.json', '');
          var rawWords = data.words || data;
          if (Array.isArray(rawWords)) {
            rawWords.forEach(function (item) {
              if (Array.isArray(item) && item.length >= 2) {
                words.push(item);
              } else if (item.word) {
                words.push([item.word, (item.definitions || [''])[0]]);
              }
            });
          }
        } else if (file.name.endsWith('.csv')) {
          deckName = file.name.replace('.csv', '');
          var lines = text.split(/[\r\n]+/).filter(Boolean);
          lines.forEach(function (line) {
            var cols = App.parseCSVLine(line);
            if (cols.length >= 2 && cols[0].trim() && cols[1].trim()) {
              words.push([cols[0].trim(), cols[1].trim()]);
            }
          });
        } else {
          deckName = file.name.replace(/\.(txt|text)$/, '');
          var txtLines = text.split(/[\r\n]+/).filter(Boolean);
          txtLines.forEach(function (line) {
            var parts = line.split(/\t|\s{2,}/);
            if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
              words.push([parts[0].trim(), parts[1].trim()]);
            }
          });
        }

        if (words.length === 0) { App.showToast('未能解析到有效单词，请检查文件格式', 'error'); return; }

        var key = 'custom-' + Date.now();
        window.__VOCAB_REGISTRY__[key] = { name: deckName, description: '从文件导入 (' + words.length + '词)', words: words };
        App.importWordbookFromRegistry(key);
        delete window.__VOCAB_REGISTRY__[key];
      } catch (err) {
        App.showToast('文件解析失败: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  App.renderImportModal = function () {
    var bookList = document.getElementById('importBookList');
    var statusEl = document.getElementById('importStatus');

    statusEl.textContent = '';
    var books = App.getRegisteredWordbooks();

    bookList.innerHTML = books.map(function (b) {
      var imported = App.isWordbookImported(b);
      return '<button data-book="' + b.key + '"' + (imported ? ' disabled' : '') + '>' +
        (imported ? '✅' : '📥') + ' ' + b.name +
        '<span style="color:#94a3b8;font-size:12px;">— ' + (b.loaded ? b.count + ' 词' : b.desc) + '</span>' +
        (imported ? '<span style="color:#16a34a;">（已导入）</span>' : '') +
        (!b.loaded ? '<span style="color:#f59e0b;">（需加载）</span>' : '') +
      '</button>';
    }).join('');
  };

  App.closeImportModal = function () {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importFileInput').value = '';
    document.getElementById('importStatus').textContent = '';
  };

})(FlashcardApp);
