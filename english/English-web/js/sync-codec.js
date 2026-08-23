/* sync-codec.js —— 跨端数据联通纯函数核心（与小程序 src/utils/sync-codec.js 语义一致） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 设计要点：
   * - 词书 key canonical = 小程序 key（词书数据上游）；web 侧经 WORDBOOK_KEY_MAP 换算
   * - 卡片锚点 = (canonical source, lower(word))；词条内容不传输
   * - 日志对端合并防重复累计：M = max(本地, 快照) + max(0, 远端 − 远端上次全量)
   * 共享测试向量：English-mini-app/tests/data/sync-vectors.js（两端测试共同引用） */

  var SC = {};

  SC.SCHEMA_VERSION = 1;
  SC.APP_NAME = 'english-app';

  /* web key → canonical（小程序 key）映射 */
  SC.WORDBOOK_KEY_MAP = {
    'senior-high-enriched': 'senior-high-new',
    'cet4-syllabus-enriched': 'cet4-new',
    'cet6-syllabus-enriched': 'cet6-new',
    'cet6-core-enriched': 'cet6-core',
    'kaoyan-enriched': 'kaoyan-new'
  };

  /* canonical key 全集（20 本；未知 key 拒绝传输，防词书漂移） */
  SC.CANONICAL_KEYS = [
    'junior-high', 'junior-high-sorted',
    'junior-high-core', 'junior-high-core-sorted',
    'senior-high-new', 'senior-high-sorted',
    'senior-high-core', 'senior-high-core-sorted',
    'cet4-new', 'cet4-sorted',
    'cet4-core', 'cet4-core-sorted',
    'cet6-new', 'cet6-sorted',
    'cet6-core', 'cet6-core-sorted',
    'kaoyan-new', 'kaoyan-sorted',
    'kaoyan-core', 'kaoyan-core-sorted'
  ];
  var CANONICAL_SET = {};
  SC.CANONICAL_KEYS.forEach(function (k) { CANONICAL_SET[k] = true; });

  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  /* ================= 工具 ================= */

  function isObj(v) {
    return v !== null && typeof v === 'object';
  }

  function clampInt(v, min, max, dflt) {
    var n = (typeof v === 'number' && isFinite(v)) ? Math.round(v) : NaN;
    if (isNaN(n)) return dflt;
    return Math.min(max, Math.max(min, n));
  }

  function clampNum(v, min, max, dflt) {
    var n = (typeof v === 'number' && isFinite(v)) ? v : NaN;
    if (isNaN(n)) return dflt;
    return Math.min(max, Math.max(min, n));
  }

  function dateStr(v) {
    return (typeof v === 'string' && DATE_RE.test(v)) ? v : '';
  }

  /* FNV-1a 32-bit（完整性校验，非加密） */
  SC.fnv1a = function (str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  /* 本端词书 key → canonical key；无效/未知 key 返回 null（该 deck 不参与传输） */
  SC.canonicalizeKey = function (key, deviceKind) {
    if (typeof key !== 'string' || !key) return null;
    var mapped = deviceKind === 'web' ? (SC.WORDBOOK_KEY_MAP[key] || key) : key;
    return CANONICAL_SET[mapped] ? mapped : null;
  };

  /* ================= 进度对象 ================= */

  function normalizeHistoryEntry(e) {
    if (!isObj(e)) return null;
    if (!dateStr(e.date) || typeof e.stage !== 'number') return null;
    return {
      stage: clampInt(e.stage, 0, 7, 0),
      date: e.date,
      passed: !!e.passed,
      quality: typeof e.quality === 'string' ? e.quality : (e.passed ? 'correct' : 'wrong')
    };
  }

  function normalizeDates(list) {
    if (!Array.isArray(list)) return [];
    var set = {};
    var out = [];
    list.forEach(function (d) {
      if (dateStr(d) && !set[d]) { set[d] = true; out.push(d); }
    });
    return out.sort();
  }

  /* 本地完整卡片 → 传输进度对象；无 word 返回 null */
  SC.cardToProgress = function (card) {
    if (!isObj(card)) return null;
    var w = String(card.word || card.front || '').trim().toLowerCase();
    if (!w) return null;
    return {
      w: w,
      st: clampInt(card.ebbinghausStage, 0, 7, 0),
      nr: dateStr(card.ebbinghausNextReview),
      h: Array.isArray(card.ebbinghausHistory)
        ? card.ebbinghausHistory.map(normalizeHistoryEntry).filter(Boolean)
        : [],
      r: clampInt(card.repetitions, 0, 9999, 0),
      e: clampNum(card.easeFactor, 0, 10, 2.5),
      wc: clampInt(card.wrongCount, 0, 9999, 0),
      wd: normalizeDates(card.wrongDates),
      ih: !!card.isHard
    };
  };

  function pickEarlier(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a < b ? a : b;
  }

  function mergeHistory(aList, bList) {
    var map = {};
    function put(entry) {
      var e = normalizeHistoryEntry(entry);
      if (!e) return;
      var key = e.date + '|' + e.stage + '|' + (e.passed ? 1 : 0);
      var prev = map[key];
      /* 同键冲突保留非 correct 质量（更保守），防同一次复习双记 */
      if (!prev || (prev.quality === 'correct' && e.quality !== 'correct')) map[key] = e;
    }
    (Array.isArray(aList) ? aList : []).forEach(put);
    (Array.isArray(bList) ? bList : []).forEach(put);
    var list = [];
    Object.keys(map).forEach(function (k) { list.push(map[k]); });
    list.sort(function (x, y) {
      if (x.date < y.date) return -1;
      if (x.date > y.date) return 1;
      return 0;
    });
    return list.slice(-100);
  }

  /* 进度对象合并（幂等、可交换） */
  SC.cardMerge = function (a, b) {
    var sa = clampInt(a && a.st, 0, 7, 0);
    var sb = clampInt(b && b.st, 0, 7, 0);
    var aNr = a ? dateStr(a.nr) : '';
    var bNr = b ? dateStr(b.nr) : '';
    var nr;
    if (sa > sb) nr = aNr || bNr;
    else if (sb > sa) nr = bNr || aNr;
    else nr = pickEarlier(aNr, bNr);
    var wd = normalizeDates((a && a.wd) || []).concat(normalizeDates((b && b.wd) || []));
    var wdSet = normalizeDates(wd);
    var wc = Math.max(clampInt(a && a.wc, 0, 9999, 0), clampInt(b && b.wc, 0, 9999, 0), wdSet.length);
    return {
      w: (a && a.w) || (b && b.w) || '',
      st: Math.max(sa, sb),
      nr: nr,
      h: mergeHistory((a && a.h) || [], (b && b.h) || []),
      r: Math.max(clampInt(a && a.r, 0, 9999, 0), clampInt(b && b.r, 0, 9999, 0)),
      e: Math.max(clampNum(a && a.e, 0, 10, 0), clampNum(b && b.e, 0, 10, 0)),
      wc: wc,
      wd: wdSet,
      ih: !!(a && a.ih) || !!(b && b.ih)
    };
  };

  /* 将合并进度写回本地完整卡片（原地改写并返回） */
  SC.applyProgressToCard = function (card, progress) {
    card.ebbinghausStage = progress.st;
    card.ebbinghausNextReview = progress.nr;
    card.ebbinghausHistory = progress.h.slice();
    card.repetitions = progress.r;
    card.easeFactor = progress.e;
    card.wrongCount = progress.wc;
    card.wrongDates = progress.wd.slice();
    card.isHard = progress.ih;
    return card;
  };

  function cardKey(card) {
    return String(card.word || card.front || '').trim().toLowerCase();
  }

  /* 将远端进度列表合并进本端卡片数组 */
  SC.mergeDeckCards = function (localCards, remoteProgressList) {
    var cards = Array.isArray(localCards) ? localCards : [];
    var byKey = {};
    cards.forEach(function (c, i) {
      var k = cardKey(c);
      if (k && byKey[k] === undefined) byKey[k] = i;
    });
    var mergedCount = 0;
    var skippedCount = 0;
    (Array.isArray(remoteProgressList) ? remoteProgressList : []).forEach(function (p) {
      if (!isObj(p) || !p.w) return;
      var idx = byKey[p.w];
      if (idx === undefined) {
        skippedCount++; /* 本端词书缺该词条，无法重建词条内容 → 跳过 */
        return;
      }
      var localProgress = SC.cardToProgress(cards[idx]);
      var base = { w: p.w, st: 0, nr: '', h: [], r: 0, e: 0, wc: 0, wd: [], ih: false };
      cards[idx] = SC.applyProgressToCard(cards[idx], SC.cardMerge(localProgress || base, p));
      mergedCount++;
    });
    return { cards: cards, mergedCount: mergedCount, skippedCount: skippedCount };
  };

  /* ================= 日志三向合并 ================= */

  function entryOrNull(entry) {
    if (!isObj(entry)) return null;
    return {
      cardsStudied: clampInt(entry.cardsStudied, 0, 999999, 0),
      correct: clampInt(entry.correct, 0, 999999, 0),
      wrong: clampInt(entry.wrong, 0, 999999, 0),
      duration: clampInt(entry.duration, 0, 999999, 0),
      completedGoal: !!entry.completedGoal
    };
  }

  function zeroEntry() {
    return { cardsStudied: 0, correct: 0, wrong: 0, duration: 0, completedGoal: false };
  }

  function mergeEntry(localEntry, snapEntry, remoteEntry, remotePrevEntry, dateKey) {
    var l = localEntry || zeroEntry();
    var s = snapEntry || zeroEntry();
    var r = remoteEntry || zeroEntry();
    var rp = remotePrevEntry || zeroEntry();
    /* 求和字段：本地取 max(当前, 快照)（守卫同日覆盖回退），远端只算上次全量之上的增量 */
    return {
      date: dateKey,
      cardsStudied: Math.max(l.cardsStudied, s.cardsStudied) + Math.max(0, r.cardsStudied - rp.cardsStudied),
      correct: Math.max(l.correct, s.correct) + Math.max(0, r.correct - rp.correct),
      wrong: Math.max(l.wrong, s.wrong) + Math.max(0, r.wrong - rp.wrong),
      duration: Math.max(l.duration, s.duration, r.duration),
      completedGoal: !!(l.completedGoal || s.completedGoal || r.completedGoal)
    };
  }

  /* 接收端日志对端合并（文件/云通道统一）：
   * M = max(本地, 快照) + max(0, 远端 − 远端上次全量)，状态按发送端分槽存储 */
  SC.logMerge = function (local, remote, state) {
    var localLogs = isObj(local) ? local : {};
    var remoteLogs = isObj(remote) ? remote : {};
    var st = isObj(state) ? state : {};
    var snapLogs = isObj(st.snap) ? st.snap : {};
    var remotePrevLogs = isObj(st.remotePrev) ? st.remotePrev : {};
    var merged = {};
    var seen = {};
    Object.keys(remoteLogs).concat(Object.keys(localLogs)).forEach(function (d) {
      if (seen[d] || !DATE_RE.test(d)) return;
      seen[d] = true;
      var entry = mergeEntry(
        entryOrNull(localLogs[d]),
        entryOrNull(snapLogs[d]),
        entryOrNull(remoteLogs[d]),
        entryOrNull(remotePrevLogs[d]),
        d
      );
      /* 零词日不落库（calcStreak 以 key 存在判打卡） */
      if (entry.cardsStudied > 0) merged[d] = entry;
    });
    return { merged: merged, state: { snap: merged, remotePrev: remoteLogs } };
  };

  /* 发起端回程应用：final = 合并结果 + max(0, 本端当前 − 本端已发送) */
  SC.applyLogResult = function (current, sent, received) {
    var currentLogs = isObj(current) ? current : {};
    var sentLogs = isObj(sent) ? sent : {};
    var receivedLogs = isObj(received) ? received : {};
    var out = {};
    var seen = {};
    Object.keys(receivedLogs).concat(Object.keys(currentLogs)).forEach(function (d) {
      if (seen[d] || !DATE_RE.test(d)) return;
      seen[d] = true;
      var r = entryOrNull(receivedLogs[d]) || zeroEntry();
      var c = entryOrNull(currentLogs[d]) || zeroEntry();
      var s = entryOrNull(sentLogs[d]) || zeroEntry();
      var entry = {
        date: d,
        cardsStudied: r.cardsStudied + Math.max(0, c.cardsStudied - s.cardsStudied),
        correct: r.correct + Math.max(0, c.correct - s.correct),
        wrong: r.wrong + Math.max(0, c.wrong - s.wrong),
        duration: Math.max(r.duration, c.duration),
        completedGoal: !!(r.completedGoal || c.completedGoal)
      };
      if (entry.cardsStudied > 0) out[d] = entry;
    });
    return out;
  };

  /* ================= 设置 ================= */

  /* 归一化设置对象（非法值 → undefined） */
  SC.normalizeSettings = function (settings) {
    var s = isObj(settings) ? settings : {};
    var goal = parseInt(s.dailyGoal, 10);
    return {
      dailyGoal: isFinite(goal) ? Math.min(100, Math.max(10, goal)) : undefined,
      accent: (s.accent === 'us' || s.accent === 'uk') ? s.accent : undefined,
      theme: (s.theme === 'light' || s.theme === 'dark') ? s.theme : undefined
    };
  };

  /* 字段级合并：远端有合法值即采用（以导出端为准），缺失/非法回退本地 */
  SC.settingsMerge = function (local, remote) {
    var l = SC.normalizeSettings(local);
    var r = SC.normalizeSettings(remote);
    return {
      dailyGoal: r.dailyGoal !== undefined ? r.dailyGoal : l.dailyGoal,
      accent: r.accent || l.accent || 'us',
      theme: r.theme || l.theme || 'light'
    };
  };

  /* ================= codec ================= */

  SC.encodePayload = function (payload) {
    return JSON.stringify(payload, null, 2);
  };

  /* 解析传输 payload：校验 appName/版本；旧版 data-io 格式自动转换 */
  SC.decodePayload = function (text) {
    var raw;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      throw new Error('数据解析失败：不是有效的 JSON 文件');
    }
    if (!isObj(raw)) throw new Error('数据格式不正确');
    if (raw.appName !== SC.APP_NAME) throw new Error('数据格式不正确（非本应用导出的文件）');
    if (raw.schemaVersion === SC.SCHEMA_VERSION) return raw;
    if (raw.schemaVersion !== undefined && raw.schemaVersion > SC.SCHEMA_VERSION) {
      throw new Error('数据版本过新，请升级应用后再导入');
    }
    if (typeof raw.version === 'number') return SC.convertLegacyPayload(raw);
    throw new Error('数据格式不正确（缺少版本信息）');
  };

  /* 旧版 data-io 覆盖式备份格式 → v1 规范 payload（仅进度，丢弃会话/派生副本） */
  SC.convertLegacyPayload = function (raw) {
    var data = isObj(raw.data) ? raw.data : {};
    var user = isObj(data.user) ? data.user : {};
    var cardsByDeck = isObj(data.cards) ? data.cards : {};
    var decks = [];
    (Array.isArray(data.decks) ? data.decks : []).forEach(function (d) {
      if (!isObj(d)) return;
      var source = SC.canonicalizeKey(d.source, 'mini'); /* 旧导出仅由小程序产生 */
      if (!source) return;
      var deckId = d._id || d.id;
      var cards = (Array.isArray(cardsByDeck[deckId]) ? cardsByDeck[deckId] : [])
        .map(SC.cardToProgress)
        .filter(Boolean);
      decks.push({ source: source, name: d.name || '', cards: cards });
    });
    return {
      schemaVersion: SC.SCHEMA_VERSION,
      appName: SC.APP_NAME,
      deviceKind: 'mini',
      exportTime: typeof raw.exportTime === 'string' ? raw.exportTime : '',
      data: {
        settings: SC.normalizeSettings(user.settings),
        decks: decks,
        logs: {
          deep: isObj(data.learningLogs) ? data.learningLogs : {},
          quick: isObj(data.quickLogs) ? data.quickLogs : {}
        }
      }
    };
  };

  /* payload → 分块（云数据库单文档 512KB 限制，单块默认 64KB） */
  SC.chunkPayload = function (payload, maxSize) {
    var size = maxSize || 65536;
    var json = JSON.stringify(payload);
    var checksum = SC.fnv1a(json);
    if (json.length <= size) {
      return {
        chunks: [{ chunkIndex: 0, total: 1, data: json, checksum: checksum }],
        totalSize: json.length,
        checksum: checksum
      };
    }
    var chunks = [];
    var offset = 0;
    var index = 0;
    while (offset < json.length) {
      var end = Math.min(offset + size, json.length);
      /* 不切在代理对中间：下一个码元是低位代理则回退一位 */
      if (end < json.length) {
        var code = json.charCodeAt(end);
        if (code >= 0xdc00 && code <= 0xdfff) end--;
      }
      var data = json.slice(offset, end);
      chunks.push({ chunkIndex: index, total: 0, data: data, checksum: SC.fnv1a(data) });
      offset = end;
      index++;
    }
    chunks.forEach(function (c) { c.total = chunks.length; });
    return { chunks: chunks, totalSize: json.length, checksum: checksum };
  };

  /* 分块重组：缺块/序号不连续/校验失败 → throw（整包丢弃，绝不部分应用） */
  SC.assembleChunks = function (chunks, expectedTotal, checksum) {
    if (!Array.isArray(chunks) || chunks.length === 0) throw new Error('CHUNK_MISMATCH');
    var sorted = chunks.slice().sort(function (a, b) { return a.chunkIndex - b.chunkIndex; });
    var total = expectedTotal !== undefined ? expectedTotal : sorted[0].total;
    if (sorted.length !== total) throw new Error('CHUNK_MISMATCH');
    var json = '';
    for (var i = 0; i < total; i++) {
      var c = sorted[i];
      if (!isObj(c) || c.chunkIndex !== i || SC.fnv1a(c.data) !== c.checksum) throw new Error('CHUNK_MISMATCH');
      json += c.data;
    }
    if (checksum && SC.fnv1a(json) !== checksum) throw new Error('CHUNK_MISMATCH');
    return JSON.parse(json);
  };

  App.SyncCodec = SC;
})(FlashcardApp);
