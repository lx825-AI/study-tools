/* import.js —— 词书导入 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  window.__VOCAB_REGISTRY__ = window.__VOCAB_REGISTRY__ || {};

  /* 内置词书注册表（与 scripts/wordbook-lib.js 的 BOOK_CONFIG 保持同步维护）
     level: 考试级别 | type: 'syllabus' 大纲词汇 / 'core' 核心词汇
     order: 'random' 乱序版 / 'sorted' 正序版（对齐小程序 wb-option 短标签）；wordCount 静态词数（免加载即可显示） */
  App.BUILTIN_WORDBOOKS = [
    /* 初中 */
    { key: 'junior-high', name: '初中大纲词汇', desc: '初中英语完整大纲词汇',
      file: 'wordbooks/junior-high.js', level: 'junior-high', type: 'syllabus', order: 'random', wordCount: 1986 },
    { key: 'junior-high-core', name: '初中核心词汇', desc: '初中英语考试高频核心词汇',
      file: 'wordbooks/junior-high-core.js', level: 'junior-high', type: 'core', order: 'random', wordCount: 1417 },
    { key: 'junior-high-sorted', name: '初中大纲词汇（正序）', desc: '初中英语完整大纲词汇，按字母正序排列',
      file: 'wordbooks/junior-high-sorted.js', level: 'junior-high', type: 'syllabus', order: 'sorted', wordCount: 1986 },
    { key: 'junior-high-core-sorted', name: '初中核心词汇（正序）', desc: '初中英语考试高频核心词汇，按字母正序排列',
      file: 'wordbooks/junior-high-core-sorted.js', level: 'junior-high', type: 'core', order: 'sorted', wordCount: 1417 },
    /* 高中 */
    { key: 'senior-high-enriched', name: '高中英语词汇（含词性）', desc: '高中英语完整大纲词汇，100% 音标覆盖',
      file: 'wordbooks/senior-high-enriched.js', level: 'senior-high', type: 'syllabus', order: 'random', wordCount: 3735 },
    { key: 'senior-high-core', name: '高中核心词汇', desc: '高中英语考试高频核心词汇',
      file: 'wordbooks/senior-high-core.js', level: 'senior-high', type: 'core', order: 'random', wordCount: 3659 },
    { key: 'senior-high-sorted', name: '高中英语词汇（含词性）（正序）', desc: '高中英语完整大纲词汇，100% 音标覆盖，按字母正序排列',
      file: 'wordbooks/senior-high-sorted.js', level: 'senior-high', type: 'syllabus', order: 'sorted', wordCount: 3735 },
    { key: 'senior-high-core-sorted', name: '高中核心词汇（正序）', desc: '高中英语考试高频核心词汇，按字母正序排列',
      file: 'wordbooks/senior-high-core-sorted.js', level: 'senior-high', type: 'core', order: 'sorted', wordCount: 3659 },
    /* 四级 */
    { key: 'cet4-syllabus-enriched', name: '四级大纲词汇（含词性）', desc: 'CET-4 完整大纲词汇，100% 音标覆盖',
      file: 'wordbooks/cet4-syllabus-enriched.js', level: 'cet4', type: 'syllabus', order: 'random', wordCount: 4542 },
    { key: 'cet4-core', name: '四级核心词汇', desc: 'CET-4 考试高频核心词汇',
      file: 'wordbooks/cet4-core.js', level: 'cet4', type: 'core', order: 'random', wordCount: 1161 },
    { key: 'cet4-sorted', name: '四级大纲词汇（含词性）（正序）', desc: 'CET-4 完整大纲词汇，100% 音标覆盖，按字母正序排列',
      file: 'wordbooks/cet4-sorted.js', level: 'cet4', type: 'syllabus', order: 'sorted', wordCount: 4542 },
    { key: 'cet4-core-sorted', name: '四级核心词汇（正序）', desc: 'CET-4 考试高频核心词汇，按字母正序排列',
      file: 'wordbooks/cet4-core-sorted.js', level: 'cet4', type: 'core', order: 'sorted', wordCount: 1161 },
    /* 六级 */
    { key: 'cet6-syllabus-enriched', name: '六级完整大纲（含词性）', desc: 'CET-6 完整大纲词汇，100% 音标覆盖',
      file: 'wordbooks/cet6-syllabus-enriched.js', level: 'cet6', type: 'syllabus', order: 'random', wordCount: 3990 },
    { key: 'cet6-core-enriched', name: '六级核心高频（含词性）', desc: 'CET-6 考试高频核心词汇，100% 音标覆盖',
      file: 'wordbooks/cet6-core-enriched.js', level: 'cet6', type: 'core', order: 'random', wordCount: 1227 },
    { key: 'cet6-sorted', name: '六级完整大纲（含词性）（正序）', desc: 'CET-6 完整大纲词汇，100% 音标覆盖，按字母正序排列',
      file: 'wordbooks/cet6-sorted.js', level: 'cet6', type: 'syllabus', order: 'sorted', wordCount: 3990 },
    { key: 'cet6-core-sorted', name: '六级核心高频（含词性）（正序）', desc: 'CET-6 考试高频核心词汇，100% 音标覆盖，按字母正序排列',
      file: 'wordbooks/cet6-core-sorted.js', level: 'cet6', type: 'core', order: 'sorted', wordCount: 1227 },
    /* 考研 */
    { key: 'kaoyan-enriched', name: '考研英语词汇（含词性）', desc: '考研英语完整大纲词汇，100% 音标覆盖',
      file: 'wordbooks/kaoyan-enriched.js', level: 'kaoyan', type: 'syllabus', order: 'random', wordCount: 5045 },
    { key: 'kaoyan-core', name: '考研核心词汇', desc: '考研英语考试高频核心词汇',
      file: 'wordbooks/kaoyan-core.js', level: 'kaoyan', type: 'core', order: 'random', wordCount: 1340 },
    { key: 'kaoyan-sorted', name: '考研英语词汇（含词性）（正序）', desc: '考研英语完整大纲词汇，100% 音标覆盖，按字母正序排列',
      file: 'wordbooks/kaoyan-sorted.js', level: 'kaoyan', type: 'syllabus', order: 'sorted', wordCount: 5045 },
    { key: 'kaoyan-core-sorted', name: '考研核心词汇（正序）', desc: '考研英语考试高频核心词汇，按字母正序排列',
      file: 'wordbooks/kaoyan-core-sorted.js', level: 'kaoyan', type: 'core', order: 'sorted', wordCount: 1340 }
  ];

  /* 词书级别分类（对齐小程序 decks 页：先选级别，再看大纲/核心） */
  App.WORDBOOK_LEVELS = [
    { id: 'junior-high', name: '初中', desc: '基础词汇', icon: '🏫' },
    { id: 'senior-high', name: '高中', desc: '高考词汇', icon: '🎓' },
    { id: 'cet4',        name: '四级', desc: 'CET-4',   icon: '📘' },
    { id: 'cet6',        name: '六级', desc: 'CET-6',   icon: '📗' },
    { id: 'kaoyan',      name: '考研', desc: '研究生入学', icon: '🎯' }
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
        level: b.level,
        type: b.type,
        order: b.order,
        wordCount: b.wordCount,
        loaded: !!window.__VOCAB_REGISTRY__[b.key],
        count: window.__VOCAB_REGISTRY__[b.key] ? window.__VOCAB_REGISTRY__[b.key].words.length : b.wordCount
      };
    });
  };

  App.isWordbookImported = function (bookInfo) {
    /* 按 source（词书 key）优先判定（对齐小程序）；旧牌组无 source 时回退按 name */
    if (App.state.decks.some(function (d) { return d.source === bookInfo.key; })) return true;
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
      deck = { id: App.genId(), name: data.name, cards: [], source: bookKey };
      App.state.decks.push(deck);
    }

    data.words.forEach(function (item) {
      let front = Array.isArray(item) ? item[0] : item.word;
      let defs = Array.isArray(item) ? [item[1]] : App._ensureDefinitionsArray(item.definitions, '');
      let back = defs[0] || '';
      if (!existingWords.has(front.toLowerCase())) {
        let card = Array.isArray(item)
          ? { id: App.genId(), front: front, back: back, difficulty: Math.floor(Math.random() * 5) + 1 }
          : { id: App.genId(), front: front, back: back, word: item.word, phonetic: item.phonetic || '', pos: item.pos || '', definitions: defs, phrases: item.phrases || [], sentences: item.sentences || [], synonyms: item.synonyms || [], antonyms: item.antonyms || [], confused: item.confused || [], difficulty: Math.floor(Math.random() * 5) + 1 };
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

  /* 渲染单本词书（Web 内容卡：🔀乱序版/🔤正序版 短标签 + 词数 + 主色导入按钮/已导入态） */
  App._renderWordbookButton = function (b) {
    var imported = App.isWordbookImported(b);
    var isSorted = b.order === 'sorted';
    var count = b.loaded ? b.count : b.wordCount;
    return '<button class="wb-option' + (imported ? ' selected' : '') + '" data-book="' + b.key + '"' +
      (imported ? ' disabled' : '') + '>' +
      '<span class="wb-option-top">' +
        '<span class="wb-option-icon">' + (isSorted ? '🔤' : '🔀') + '</span>' +
        '<span class="wb-option-name">' + (isSorted ? '正序版' : '乱序版') + '</span>' +
        '<span class="wb-option-count">' + count + ' 词</span>' +
      '</span>' +
      '<span class="wb-option-action">' +
        (imported
          ? '<span class="wb-option-check">✓ 已导入</span>'
          : '<span class="btn btn-primary btn-sm wb-option-import">导入</span>') +
      '</span>' +
    '</button>';
  };

  /* 第一屏：级别列表（对齐小程序 decks 页） */
  App.renderImportModal = function () {
    let bookList = document.getElementById('importBookList');
    let statusEl = document.getElementById('importStatus');

    statusEl.textContent = '';

    var html = '<div class="import-section-title">📚 选择级别</div>' +
      '<div class="level-grid">' +
      App.WORDBOOK_LEVELS.map(function (level) {
        return '<div class="level-item" data-level="' + level.id + '">' +
          '<span class="level-icon">' + level.icon + '</span>' +
          '<div class="level-info">' +
            '<div class="level-name">' + App.escHtml(level.name) + '</div>' +
            '<div class="level-desc">' + App.escHtml(level.desc) + '</div>' +
          '</div>' +
          '<span class="level-arrow">›</span>' +
        '</div>';
      }).join('') +
      '</div>' +

      /* 词书来源声明 */
      '<div class="import-section-title" style="margin-top:16px;">📖 词书来源</div>' +
      '<div style="font-size:12px;color:var(--text-muted);line-height:1.6;">' +
      '内置词书数据源自 <b>KyleBing/english-vocabulary</b>（GitHub，MIT 协议），' +
      '原始数据来自「不背单词」APP 与各考试大纲官方词汇表，' +
      '音标由 Free Dictionary API 生成，全部词书 100% 音标覆盖。' +
      '</div>';

    bookList.innerHTML = html;

    /* 绑定级别卡片点击 */
    bookList.querySelectorAll('.level-item').forEach(function (item) {
      item.addEventListener('click', function () {
        App.renderImportLevelBooks(item.getAttribute('data-level'));
      });
    });
  };

  /* 第二屏：该级别下的大纲/核心词书 */
  App.renderImportLevelBooks = function (levelId) {
    let bookList = document.getElementById('importBookList');
    let statusEl = document.getElementById('importStatus');

    statusEl.textContent = '';

    var books = App.getRegisteredWordbooks().filter(function (b) {
      return b.level === levelId;
    });

    var html = '<button class="btn btn-outline btn-sm level-back-btn" id="btnImportBack">← 返回</button>';

    /* 大纲词汇在前，核心词汇在后（与小程序顺序一致） */
    var typeSections = [
      { type: 'syllabus', icon: '📖', title: '大纲词汇', desc: '考试规定的全部词汇' },
      { type: 'core', icon: '⭐', title: '核心词汇', desc: '考试高频重点词汇' }
    ];
    typeSections.forEach(function (section) {
      /* 每类渲染全部词书（乱序 + 正序），Web 内容卡双列布局 */
      var sectionBooks = books.filter(function (b) { return b.type === section.type; });
      html += '<div class="wb-section-header" style="margin-top:12px;">' +
        '<span class="import-section-title" style="margin-bottom:0;">' + section.icon + ' ' + section.title + '</span>' +
        '<span class="wb-section-desc">' + section.desc + '</span>' +
      '</div>' +
      '<div class="wb-options">';
      sectionBooks.forEach(function (book) {
        html += App._renderWordbookButton(book);
      });
      html += '</div>';
    });

    bookList.innerHTML = html;

    /* 绑定返回按钮（词书按钮点击由 app.js 的 importModal 委托处理） */
    var backBtn = document.getElementById('btnImportBack');
    if (backBtn) backBtn.addEventListener('click', App.renderImportModal);

    /* 预取该级别全部词书脚本：用户浏览选择时后台并发加载，点击导入时 registry 已就绪，
       消除动态 script 加载（0.4-2MB/本）这一最大延迟；失败静默，点击时 loadAndImportWordbook 再报错 */
    books.forEach(function (b) {
      App.loadWordbookScript(b).catch(function () {});
    });
  };

  App.closeImportModal = function () {
    document.getElementById('importModal').style.display = 'none';
    document.getElementById('importStatus').textContent = '';
  };

})(FlashcardApp);
