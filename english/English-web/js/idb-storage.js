/* idb-storage.js —— IndexedDB 持久化存储（解决 localStorage 5MB 限制） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  var DB_NAME = 'flashcard-db';
  var DB_VERSION = 1;
  var STORE_NAME = 'app-data';
  var DATA_KEY = 'flashcard-data';

  /* localStorage 保留的轻量键 */
  var LOCAL_KEYS = [
    'flashcard-daily-goal',
    'flashcard-theme',
    'flashcard-tts-accent',
    'flashcard-new-words-per-session',
    'flashcard-reminder',
  ];

  /** 打开数据库 */
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = function (e) { resolve(e.target.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  /** 从 IndexedDB 读取数据 */
  function readFromIDB(db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var store = tx.objectStore(STORE_NAME);
      var request = store.get(DATA_KEY);
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  /** 写入 IndexedDB */
  function writeToIDB(db, value) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var request = store.put(value, DATA_KEY);
      request.onsuccess = function () { resolve(); };
      request.onerror = function () { reject(request.error); };
    });
  }

  /** 精简卡片数据：移除空的可选字段以节省空间 */
  function stripCard(card) {
    var stripped = {
      i: card.id,
      f: card.front || card.word || '',
      b: App.getCardBack(card),
      d: card.difficulty || 3,
      r: card.repetitions || 0,
      e: card.easeFactor || 2.5,
      iv: card.interval || 0,
      nr: card.nextReview || '',
      es: card.ebbinghausStage || 0,
      en: card.ebbinghausNextReview || '',
    };
    /* 仅保留非空的可选字段 */
    if (card.word && card.word !== stripped.f) stripped.w = card.word;
    if (card.phonetic) stripped.p = card.phonetic;
    if (card.pos) stripped.ps = card.pos;
    if (card.definitions && card.definitions.length > 0 && (card.definitions.length > 1 || card.definitions[0] !== stripped.b))
      stripped.dfs = card.definitions;
    if (card.phrases && card.phrases.length > 0) stripped.ph = card.phrases;
    if (card.sentences && card.sentences.length > 0) stripped.se = card.sentences;
    if (card.synonyms && card.synonyms.length > 0) stripped.sy = card.synonyms;
    if (card.antonyms && card.antonyms.length > 0) stripped.an = card.antonyms;
    if (card.confused && card.confused.length > 0) stripped.cf = card.confused;
    if (card.ebbinghausHistory && card.ebbinghausHistory.length > 0) stripped.eh = card.ebbinghausHistory;
    return stripped;
  }

  /** 展开精简卡片为完整格式 */
  function expandCard(stripped) {
    return {
      id: stripped.i,
      front: stripped.f,
      back: stripped.b,
      word: stripped.w || stripped.f,
      phonetic: stripped.p || '',
      pos: stripped.ps || '',
      definitions: stripped.dfs || [stripped.b],
      phrases: stripped.ph || [],
      sentences: stripped.se || [],
      synonyms: stripped.sy || [],
      antonyms: stripped.an || [],
      confused: stripped.cf || [],
      difficulty: stripped.d || 3,
      repetitions: stripped.r || 0,
      easeFactor: stripped.e || 2.5,
      interval: stripped.iv || 0,
      nextReview: stripped.nr || '',
      ebbinghausStage: stripped.es || 0,
      ebbinghausNextReview: stripped.en || '',
      ebbinghausHistory: stripped.eh || [],
    };
  }

  /** 精简牌组 */
  function stripDeck(deck) {
    return {
      id: deck.id,
      name: deck.name,
      cards: deck.cards.map(stripCard),
    };
  }

  /** 展开牌组 */
  function expandDeck(stripped) {
    return {
      id: stripped.id,
      name: stripped.name,
      cards: stripped.cards.map(expandCard),
    };
  }

  /** 精简整个数据对象 */
  function stripData(data) {
    return {
      decks: data.decks.map(stripDeck),
      currentDeckId: data.currentDeckId || null,
    };
  }

  /** 展开整个数据对象 */
  function expandData(stripped) {
    return {
      decks: stripped.decks.map(expandDeck),
      currentDeckId: stripped.currentDeckId || null,
    };
  }

  /* ========== 公开 API（兼容旧 storage.js 接口） ========== */

  App.STORAGE_KEY = DATA_KEY;

  /** 异步加载数据 */
  App.loadDataAsync = function () {
    return openDB().then(readFromIDB).then(function (raw) {
      if (raw && raw.decks) {
        return expandData(raw);
      }
      return App._loadFromLocalStorage();
    }).catch(function () {
      return App._loadFromLocalStorage();
    });
  };

  /** 同步从 localStorage 加载（兼容旧数据 / 降级） */
  App._loadFromLocalStorage = function () {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        /* 检测是否为损坏的精简格式（'i' 代替 'id'）——清空并等 IDB 恢复 */
        if (data.decks && data.decks.length > 0) {
          var firstDeck = data.decks[0];
          if (firstDeck.cards && firstDeck.cards.length > 0) {
            var c = firstDeck.cards[0];
            if (c.i !== undefined && c.id === undefined) {
              console.warn('Detected stripped-format data in localStorage, clearing...');
              localStorage.removeItem(DATA_KEY);
              return { decks: [], currentDeckId: null };
            }
          }
        }
        return { decks: data.decks || [], currentDeckId: data.currentDeckId || null };
      }
    } catch (e) { /* 数据损坏 */ }
    return { decks: [], currentDeckId: null };
  };

  /** 从 IndexedDB 同步读取（缓存 + 异步刷新） */
  App.loadData = function () {
    /* 首次调用：先用 localStorage 做初始数据 */
    if (!App._idbCache) {
      App._idbCache = App._loadFromLocalStorage();
      /* 异步从 IndexedDB 读取——仅当 IDB 数据比当前缓存更多时才更新 */
      App.loadDataAsync().then(function (data) {
        var idbCardCount = 0;
        if (data.decks) {
          data.decks.forEach(function (d) { idbCardCount += d.cards.length; });
        }
        var currentCardCount = 0;
        if (App._idbCache && App._idbCache.decks) {
          App._idbCache.decks.forEach(function (d) { currentCardCount += d.cards.length; });
        }
        /* 仅当 IDB 有更多数据时才替换（防止空 IDB 覆盖演示数据） */
        if (idbCardCount > currentCardCount) {
          App._idbCache = data;
          App.state = data;
          App.renderAll();
        } else if (idbCardCount > 0 && currentCardCount === 0) {
          /* localStorage 无数据但 IDB 有数据 → 恢复 */
          App._idbCache = data;
          App.state = data;
          App.renderAll();
        }
      }).catch(function () {});
    }
    return App._idbCache;
  };

  /** 保存数据到 IndexedDB（异步），同时 localStorage 降级备份 */
  App.saveData = function () {
    var stateData = { decks: App.state.decks, currentDeckId: App.state.currentDeckId };
    var stripped = stripData(stateData);
    App._idbCache = stateData;

    /* IndexedDB 主存储 */
    openDB().then(function (db) {
      return writeToIDB(db, stripped);
    }).catch(function () {});

    /* localStorage 降级备份（存完整格式确保可读，超限则仅用 IndexedDB） */
    try {
      var json = JSON.stringify(stateData);
      if (json.length < 4 * 1024 * 1024) {
        localStorage.setItem(DATA_KEY, json);
      } else {
        localStorage.removeItem(DATA_KEY);
      }
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('localStorage backup skipped (quota exceeded), using IndexedDB only');
        try { localStorage.removeItem(DATA_KEY); } catch (_) {}
      }
    }
  };

  /** 初始化：检查是否需要从 localStorage 迁移到 IndexedDB */
  App.migrateToIDB = function () {
    var localData = App._loadFromLocalStorage();
    if (!localData.decks || localData.decks.length === 0) return;

    openDB().then(function (db) {
      return readFromIDB(db).then(function (existing) {
        if (!existing || !existing.decks || existing.decks.length === 0) {
          /* IndexedDB 为空，从 localStorage 迁移 */
          var stripped = stripData(localData);
          return writeToIDB(db, stripped).then(function () {
            console.log('Migrated ' + localData.decks.length + ' decks to IndexedDB');
          });
        }
      });
    }).catch(function () {});
  };

  /** 获取存储使用情况 */
  App.getStorageInfo = function () {
    return openDB().then(function (db) {
      return readFromIDB(db).then(function (raw) {
        var json = JSON.stringify(raw || {});
        var sizeKB = (json.length / 1024).toFixed(1);
        var deckCount = raw ? raw.decks.length : 0;
        var cardCount = raw ? raw.decks.reduce(function (s, d) { return s + d.cards.length; }, 0) : 0;
        return { sizeKB: sizeKB, decks: deckCount, cards: cardCount, type: 'IndexedDB' };
      });
    }).catch(function () {
      /* 降级到 localStorage */
      var raw = localStorage.getItem(DATA_KEY);
      var sizeKB = raw ? (raw.length / 1024).toFixed(1) : '0';
      return Promise.resolve({ sizeKB: sizeKB, decks: 0, cards: 0, type: 'localStorage' });
    });
  };

})(FlashcardApp);
