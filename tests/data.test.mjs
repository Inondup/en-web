import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/data/lessons.js';
import { grammar } from '../src/data/grammar.js';

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
    assert.equal(lesson.passage.highlightedWords.length, 30);
    assert.equal(lesson.practice.multipleChoice.length, 1);
    assert.ok(grammar[lesson.grammarId - 1]);
    assert.equal(lesson.passage.paragraphs.length, 3);
  }
});

test('词汇角色遵循五阶段固定配额', () => {
  for (let start = 0; start < 50; start += 10) {
    const block = lessons.slice(start, start + 10).flatMap(lesson => lesson.words);
    assert.equal(block.filter(word => word.role === 'extension').length, [600, 500, 400, 300, 200][start / 10]);
    assert.equal(block.filter(word => word.role === 'activation').length, [400, 500, 600, 700, 800][start / 10]);
  }
});

test('语法知识点具有例句和可验证练习', () => {
  assert.equal(grammar.length, 50);
  assert.ok(grammar.every(point => point.examples.length >= 2 && point.quiz.options.length >= 3));
});
