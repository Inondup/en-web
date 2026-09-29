import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/data/lessons.js';
import { grammar } from '../src/data/grammar.js';

const PHRASES_PER_LESSON = 20;

test('课程包含 50 课，每课有 100 个词和对应语法', () => {
  assert.equal(lessons.length, 50);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, 50);
  const allWords = lessons.flatMap(lesson => lesson.words);
  assert.equal(allWords.length, 5000);
  assert.equal(new Set(allWords.map(word => word.word.toLowerCase())).size, 5000);
  for (const lesson of lessons) {
    assert.equal(lesson.words.length, 100);
    assert.ok(lesson.targetWords.length === 100);
    assert.ok(lesson.words.every(word => (
      word.word
      && Array.isArray(word.pos) && word.pos.length > 0
      && typeof word.zh === 'string' && /[\u4e00-\u9fff]/.test(word.zh)
      && /^\/.+\/$/.test(word.ipaBrE)
      && /^\/.+\/$/.test(word.ipaAmE)
    )));
    assert.ok(lesson.words.every(word => ['extension', 'activation'].includes(word.role)));
    assert.equal(lesson.stats.extensionWords + lesson.stats.activationWords, 100);
    assert.ok(grammar[lesson.grammarId - 1]);
    // 课文为人工编写的教材式文章：4 个段落、逐段中文翻译、真实词组教学
    assert.ok(lesson.passage.paragraphs.length >= 4, `L${lesson.id} 课文段落不足`);
    assert.equal(lesson.passage.paragraphs.length, lesson.passage.translation.length);
    assert.ok(lesson.passage.title && lesson.passage.genre);
    assert.ok(lesson.passage.translation.every(zh => /[\u4e00-\u9fff]/.test(zh)));
    assert.ok(lesson.passage.highlightedWords.length >= 15, `L${lesson.id} 课文命中目标词过少`);
    assert.ok(lesson.passage.highlightedWords.every(w => lesson.words.some(item => item.word === w)));
    assert.equal(lesson.stats.readingWords >= 160, true);
    assert.equal(lesson.practice.multipleChoice.length, 1);
    assert.ok(lesson.practice.multipleChoice[0].options.length >= 3);
  }
});

test('词汇角色遵循五阶段固定配额', () => {
  for (let start = 0; start < 50; start += 10) {
    const block = lessons.slice(start, start + 10).flatMap(lesson => lesson.words);
    assert.equal(block.filter(word => word.role === 'extension').length, [600, 500, 400, 300, 200][start / 10]);
    assert.equal(block.filter(word => word.role === 'activation').length, [400, 500, 600, 700, 800][start / 10]);
  }
});

test('每课包含 20 个真实词组，并贯穿课文、词汇与练习', () => {
  for (const lesson of lessons) {
    assert.equal(lesson.phrases.length, PHRASES_PER_LESSON, `L${lesson.id} 词组数量应为 ${PHRASES_PER_LESSON}`);
    assert.equal(new Set(lesson.phrases.map(p => p.en)).size, PHRASES_PER_LESSON);
    const text = lesson.passage.paragraphs.join(' ').toLowerCase();
    let coversTargetWord = 0;
    for (const phrase of lesson.phrases) {
      assert.ok(phrase.zh && /[\u4e00-\u9fff]/.test(phrase.zh), `${phrase.en} 缺少中文释义`);
      assert.ok(phrase.usage && phrase.example && phrase.exampleZh, `${phrase.en} 用法或例句缺失`);
      assert.ok(phrase.paragraph >= 0 && phrase.paragraph < lesson.passage.paragraphs.length);
      assert.ok(text.includes(phrase.en.split(' ')[0].toLowerCase()), `${phrase.en} 未出现在课文中`);
      if (phrase.targetWords.length >= 1) coversTargetWord += 1;
    }
    assert.ok(coversTargetWord >= 12, `L${lesson.id} 词组覆盖目标词过少（${coversTargetWord}/${PHRASES_PER_LESSON}）`);
    assert.equal(lesson.stats.phrases, PHRASES_PER_LESSON);
    assert.equal(lesson.practice.cloze.length, PHRASES_PER_LESSON);
    assert.ok(lesson.focusWords.length >= 5 && lesson.focusWords.length <= 12);
    assert.ok(lesson.words.some(word => word.collocations.length > 0 && word.example));
  }
});

test('语法知识点具有例句和可验证练习', () => {
  assert.equal(grammar.length, 50);
  assert.ok(grammar.every(point => point.examples.length >= 2 && point.quiz.options.length >= 3));
});
