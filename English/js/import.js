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
      let script = document.createElement('script');
      script.src = bookInfo.file;
      script.onload = function () {
        delete App._wordbookFetching[bookInfo.key];
        let data = window.__VOCAB_REGISTRY__[bookInfo.key];
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
    let data = window.__VOCAB_REGISTRY__[bookInfo.key];
    if (!data) return false;
    return !!App.state.decks.find(function (d) { return d.name === data.name; });
  };

  App.importWordbookFromRegistry = function (bookKey) {
    let data = window.__VOCAB_REGISTRY__[bookKey];
    if (!data) { App.showToast('词书数据未加载，请先加载词书', 'error'); return; }

    let deck = App.state.decks.find(function (d) { return d.name === data.name; });
    let existingWords = deck ? new Set(deck.cards.map(function (c) { return (c.front || c.word || '').toLowerCase(); })) : new Set();
    let added = 0;

    if (!deck) {
      deck = { id: App.genId(), name: data.name, cards: [] };
      App.state.decks.push(deck);
    }

    data.words.forEach(function (item) {
      let front = Array.isArray(item) ? item[0] : item.word;
      let back = Array.isArray(item) ? item[1] : (item.definitions || [''])[0];
      if (!existingWords.has(front.toLowerCase())) {
        let card = Array.isArray(item)
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
    let statusEl = document.getElementById('importStatus');
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

  /** 通用文本解析：从 JSON/CSV/TXT 文本中提取单词数组 */
  App._parseImportText = function (text, sourceName) {
    let words = [];
    let deckName = sourceName;

    /* 尝试 JSON */
    try {
      let data = JSON.parse(text);
      if (data && typeof data === 'object') {
        deckName = data.name || deckName;
        let rawWords = data.words || data;
        if (Array.isArray(rawWords)) {
          rawWords.forEach(function (item) {
            if (Array.isArray(item) && item.length >= 2) {
              words.push(item);
            } else if (item && item.word) {
              words.push({ word: item.word, phonetic: item.phonetic || '', pos: item.pos || '', definitions: item.definitions || [''], phrases: item.phrases || [], sentences: item.sentences || [], synonyms: item.synonyms || [], antonyms: item.antonyms || [], confused: item.confused || [] });
            }
          });
        }
        if (words.length > 0) return { words: words, deckName: deckName };
      }
    } catch (e) { /* 非 JSON，尝试其他格式 */ }

    /* CSV 或 TXT 按行解析 */
    let lines = text.split(/[\r\n]+/).filter(Boolean);
    if (lines.length === 0) return null;

    /* 检测分隔符：优先 tab，其次逗号，最后空格 */
    let sep = '\t';
    let firstLine = lines[0];
    if (firstLine.indexOf('\t') === -1 && firstLine.indexOf(',') !== -1) sep = ',';

    lines.forEach(function (line) {
      let cols;
      if (sep === '\t' || sep === ',') {
        cols = App.parseCSVLine(line);
      } else {
        cols = line.split(/\s{2,}/);
      }
      if (cols.length >= 2 && cols[0].trim() && cols[1].trim()) {
        words.push([cols[0].trim(), cols[1].trim()]);
      }
    });

    if (words.length === 0) return null;
    return { words: words, deckName: deckName };
  };

  App.handleFileImport = function (file) {
    let reader = new FileReader();
    let sourceName = file.name.replace(/\.(json|txt|csv|text)$/, '');
    reader.onload = function (e) {
      try {
        let result = App._parseImportText(e.target.result, sourceName);
        if (!result || result.words.length === 0) {
          App.showToast('未能解析到有效单词，请检查文件格式', 'error');
          return;
        }
        let key = 'custom-' + Date.now();
        window.__VOCAB_REGISTRY__[key] = { name: result.deckName, description: '从文件导入 (' + result.words.length + '词)', words: result.words };
        App.importWordbookFromRegistry(key);
        delete window.__VOCAB_REGISTRY__[key];
      } catch (err) {
        App.showToast('文件解析失败: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  /** 从外部 URL 导入词书 */
  App.handleUrlImport = function (url) {
    if (!url || !/^https?:\/\/.+/.test(url)) {
      App.showToast('请输入有效的 HTTP/HTTPS 链接', 'warn');
      return;
    }
    let statusEl = document.getElementById('importStatus');
    statusEl.innerHTML = '<span class="spinner"></span>正在获取词书...';
    statusEl.style.color = '#64748b';

    fetch(url, { mode: 'cors' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
        return res.text();
      })
      .then(function (text) {
        let sourceName = url.split('/').pop().replace(/\.(json|txt|csv|text|js)$/, '') || 'external';
        let result = App._parseImportText(text, sourceName);
        if (!result || result.words.length === 0) {
          App.showToast('未能解析到有效单词数据，请检查链接内容格式', 'error');
          statusEl.textContent = '';
          return;
        }
        let key = 'external-' + Date.now();
        window.__VOCAB_REGISTRY__[key] = { name: result.deckName, description: '从链接导入 (' + result.words.length + '词)', words: result.words };
        App.importWordbookFromRegistry(key);
        delete window.__VOCAB_REGISTRY__[key];
        statusEl.textContent = '';
      })
      .catch(function (err) {
        statusEl.textContent = '获取失败: ' + err.message;
        statusEl.style.color = '#dc2626';
        console.error(err);
      });
  };

  /** 粘贴 JSON 文本导入 */
  App.handlePasteImport = function () {
    let textarea = document.getElementById('importPasteArea');
    let text = textarea.value.trim();
    if (!text) { App.showToast('请粘贴词书 JSON 数据', 'warn'); return; }

    try {
      let result = App._parseImportText(text, '粘贴导入');
      if (!result || result.words.length === 0) {
        App.showToast('未能解析到有效单词数据，请检查 JSON 格式', 'error');
        return;
      }
      let key = 'paste-' + Date.now();
      window.__VOCAB_REGISTRY__[key] = { name: result.deckName, description: '粘贴导入 (' + result.words.length + '词)', words: result.words };
      App.importWordbookFromRegistry(key);
      delete window.__VOCAB_REGISTRY__[key];
      textarea.value = '';
    } catch (err) {
      App.showToast('JSON 解析失败: ' + err.message, 'error');
    }
  };

  App.renderImportModal = function () {
    let bookList = document.getElementById('importBookList');
    let statusEl = document.getElementById('importStatus');

    statusEl.textContent = '';
    let books = App.getRegisteredWordbooks();

    /* 内置词书部分 */
    var builtinHtml = '<div class="import-section-title">📚 内置词书</div>';
    builtinHtml += books.map(function (b) {
      var imported = App.isWordbookImported(b);
      return '<button data-book="' + b.key + '"' + (imported ? ' disabled' : '') + '>' +
        (imported ? '✅' : '📥') + ' ' + App.escHtml(b.name) +
        '<span style="color:#94a3b8;font-size:12px;">— ' + (b.loaded ? b.count + ' 词' : b.desc) + '</span>' +
        (imported ? '<span style="color:#16a34a;">（已导入）</span>' : '') +
        (!b.loaded ? '<span style="color:#f59e0b;">（需加载）</span>' : '') +
      '</button>';
    }).join('');

    /* 外部导入部分 */
    var externalHtml = '<div class="import-section-title" style="margin-top:16px;">🌐 外部导入</div>';

    /* 从 URL 导入 */
    externalHtml += '<details class="import-details">' +
      '<summary>🔗 从链接导入</summary>' +
      '<div class="import-details-body">' +
      '<input type="url" id="importUrlInput" placeholder="输入词书数据链接 (JSON/TXT/CSV)..." style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:var(--radius);font-size:13px;margin-bottom:8px;background:var(--surface);color:var(--text-primary);">' +
      '<button class="btn btn-primary btn-sm btn-block" id="btnUrlImport">获取并导入</button>' +
      '</div></details>';

    /* 粘贴 JSON */
    externalHtml += '<details class="import-details">' +
      '<summary>📋 粘贴 JSON 导入</summary>' +
      '<div class="import-details-body">' +
      '<textarea id="importPasteArea" rows="5" placeholder=\'粘贴词书 JSON 数据：&#10;{"name":"我的词书","words":[&#10;  {"word":"hello","definitions":["你好"]},&#10;  {"word":"world","definitions":["世界"]}&#10;]}\' style="width:100%;padding:10px;border:2px solid var(--border);border-radius:var(--radius);font-size:13px;resize:vertical;margin-bottom:8px;background:var(--surface);color:var(--text-primary);font-family:monospace;"></textarea>' +
      '<button class="btn btn-primary btn-sm btn-block" id="btnPasteImport">导入</button>' +
      '</div></details>';

    /* 从文件导入 */
    externalHtml += '<button class="btn btn-outline btn-sm btn-block" id="btnImportFile" style="margin-top:8px;">📁 从文件导入 (JSON/TXT/CSV)</button>';

    bookList.innerHTML = builtinHtml + '<div style="margin-top:4px;"></div>' + externalHtml;

    /* 绑定新按钮事件 */
    var btnUrl = document.getElementById('btnUrlImport');
    if (btnUrl) btnUrl.addEventListener('click', function () {
      App.handleUrlImport(document.getElementById('importUrlInput').value.trim());
    });

    var btnPaste = document.getElementById('btnPasteImport');
    if (btnPaste) btnPaste.addEventListener('click', App.handlePasteImport);

    /* 重新绑定文件导入（因为按钮被重建了） */
    var btnFile = document.getElementById('btnImportFile');
    if (btnFile) btnFile.addEventListener('click', function () {
      document.getElementById('importFileInput').click();
    });
  };

  App.closeImportModal = function () {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importFileInput').value = '';
    document.getElementById('importStatus').textContent = '';
    var urlInput = document.getElementById('importUrlInput');
    if (urlInput) urlInput.value = '';
    var pasteArea = document.getElementById('importPasteArea');
    if (pasteArea) pasteArea.value = '';
  };

})(FlashcardApp);
