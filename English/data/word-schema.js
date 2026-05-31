/* word-schema.js —— 扩展单词数据结构定义与验证 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /*
   * 标准单词数据结构：
   * {
   *   word: string,           // 单词
   *   phonetic: string,       // 音标，如 '/əˈbændən/'
   *   pos: string,            // 词性，如 'v.'
   *   definitions: string[],  // 释义列表
   *   phrases: [{ en: string, zh: string }],  // 词组搭配
   *   sentences: [{ en: string, zh: string }], // 例句
   *   synonyms: string[],     // 同义词
   *   antonyms: string[],     // 反义词
   *   confused: string[],     // 易混淆词
   *   difficulty: number      // 难度 0-5
   * }
   */

  /* 验证一个词条是否为新格式 */
  App.isExtendedWord = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item) && typeof item.word === 'string';
  };

  /* 确保 definitions 字段始终为数组 */
  App._ensureDefinitionsArray = function (defs, fallback) {
    if (!defs) return fallback ? [fallback] : [''];
    if (Array.isArray(defs)) return defs.length > 0 ? defs : (fallback ? [fallback] : ['']);
    /* 如果是字符串，包装为数组 */
    return [defs];
  };

  /* 将旧格式标准化为扩展卡片格式 */
  App.normalizeToCard = function (item) {
    if (App.isExtendedWord(item)) {
      var defs = App._ensureDefinitionsArray(item.definitions, item.back);
      return {
        id: item.id || App.genId(),
        front: item.word,
        back: defs[0],
        word: item.word,
        phonetic: item.phonetic || '',
        pos: item.pos || '',
        definitions: defs,
        phrases: item.phrases || [],
        sentences: item.sentences || [],
        synonyms: item.synonyms || [],
        antonyms: item.antonyms || [],
        confused: item.confused || [],
        difficulty: item.difficulty || 3
      };
    } else if (Array.isArray(item) && item.length >= 2) {
      return {
        id: item.id || App.genId(),
        front: item[0],
        back: item[1],
        word: item[0],
        phonetic: '',
        pos: '',
        definitions: [item[1]],
        phrases: [],
        sentences: [],
        synonyms: [],
        antonyms: [],
        confused: [],
        difficulty: item.difficulty || 3
      };
    }
    // fallback
    var fallbackDefs = App._ensureDefinitionsArray(item.definitions, item.back);
    return {
      id: App.genId(),
      front: item.front || item.word || '',
      back: fallbackDefs[0],
      word: item.word || item.front || '',
      phonetic: item.phonetic || '',
      pos: item.pos || '',
      definitions: fallbackDefs,
      phrases: item.phrases || [],
      sentences: item.sentences || [],
      synonyms: item.synonyms || [],
      antonyms: item.antonyms || [],
      confused: item.confused || [],
      difficulty: item.difficulty || 3
    };
  };

  /* 迁移旧卡片数据：修复 definitions 为非数组的卡片、补充缺失的 front/back 字段 */
  App.migrateCardsSchema = function () {
    var fixed = 0;
    App.state.decks.forEach(function (deck) {
      deck.cards.forEach(function (card) {
        /* 修复 definitions：确保始终为数组 */
        if (card.definitions && !Array.isArray(card.definitions)) {
          card.definitions = [card.definitions];
          fixed++;
        }
        if (Array.isArray(card.definitions) && card.definitions.length === 0 && card.back) {
          card.definitions = [card.back];
          fixed++;
        }
        /* 补全缺失的 front（使用 word 回退） */
        if (!card.front && card.word) {
          card.front = card.word;
          fixed++;
        }
        /* 补全缺失的 back（使用 definitions[0] 回退） */
        if (!card.back && card.definitions && card.definitions.length > 0) {
          card.back = card.definitions[0];
          fixed++;
        }
      });
    });
    if (fixed > 0) {
      App.saveData();
      console.log('Schema migration: ' + fixed + ' cards normalized');
    }
  };

})(FlashcardApp);
