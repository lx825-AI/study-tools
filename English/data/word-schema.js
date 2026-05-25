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

  /* 将旧格式标准化为扩展卡片格式 */
  App.normalizeToCard = function (item) {
    if (App.isExtendedWord(item)) {
      return {
        id: item.id || App.genId(),
        front: item.word,
        back: (item.definitions || [''])[0],
        word: item.word,
        phonetic: item.phonetic || '',
        pos: item.pos || '',
        definitions: item.definitions || [item.back || ''],
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
    return {
      id: App.genId(),
      front: item.front || item.word || '',
      back: item.back || (item.definitions || [''])[0],
      word: item.word || item.front || '',
      phonetic: item.phonetic || '',
      pos: item.pos || '',
      definitions: item.definitions || [item.back || ''],
      phrases: item.phrases || [],
      sentences: item.sentences || [],
      synonyms: item.synonyms || [],
      antonyms: item.antonyms || [],
      confused: item.confused || [],
      difficulty: item.difficulty || 3
    };
  };

})(FlashcardApp);
