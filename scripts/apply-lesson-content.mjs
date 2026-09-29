// Apply hand-written editorial content (passage, phrases, scene quiz) onto the fixed
// 100-word curriculum in src/data/lessons/lesson-NN.js.
//
// The word allocation per lesson is fixed and never re-sorted here; this script only
// replaces generated placeholder passages / pseudo-collocations with real teaching content.
//
// Usage:
//   node scripts/apply-lesson-content.mjs              # validate + write every available lNN.mjs
//   node scripts/apply-lesson-content.mjs --check      # validate only, no writes
//   node scripts/apply-lesson-content.mjs 21 22 30     # only these lessons
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'scripts/lesson-content');
const lessonsDir = path.join(root, 'src/data/lessons');

// Editorial invariant: every lesson teaches exactly this many phrases.
const PHRASES_PER_LESSON = 20;

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const only = args.filter(a => /^\d+$/.test(a)).map(Number);

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = term => new RegExp(`(?<![a-z])${escape(term)}(?:es|s|ed|d|ing|ly|er|est)?(?![a-z])`, 'i');
const contains = (text, term) => stem(term).test(text);

const contentFiles = fs.readdirSync(contentDir)
  .filter(file => /^l\d{2}\.mjs$/.test(file))
  .sort()
  .map(file => ({ id: Number(file.slice(1, 3)), file: path.join(contentDir, file) }))
  .filter(entry => !only.length || only.includes(entry.id));

if (!contentFiles.length) {
  console.error('No lesson content files found.');
  process.exit(1);
}

const report = [];
const problems = [];
const warnings = [];

for (const { id, file } of contentFiles) {
  const lessonPath = path.join(lessonsDir, `lesson-${String(id).padStart(2, '0')}.js`);
  if (!fs.existsSync(lessonPath)) {
    problems.push(`lesson-${String(id).padStart(2, '0')}.js missing`);
    continue;
  }
  const content = (await import(file)).default;
  const lesson = (await import(lessonPath)).default;

  if (content.id !== id || lesson.id !== id) problems.push(`id mismatch ${file}`);
  if (!Array.isArray(content.paragraphs) || content.paragraphs.length < 4) {
    problems.push(`L${id}: need at least 4 paragraphs`);
    continue;
  }
  for (const pair of content.paragraphs) {
    if (!Array.isArray(pair) || pair.length !== 2 || !pair[0].trim() || !pair[1].trim()) {
      problems.push(`L${id}: every paragraph needs [en, zh]`);
    }
    if (pair[1] && !/[一-鿿]/.test(pair[1])) problems.push(`L${id}: paragraph translation must be Chinese`);
  }

  const phrases = content.phrases.map(line => {
    const [en, zh, usage, example, exampleZh] = line;
    if (!en || !zh || !usage || !example || !exampleZh) problems.push(`L${id}: phrase row incomplete (${en || '?'})`);
    const paragraph = content.paragraphs.findIndex(([text]) => contains(text, en));
    const targetWords = lesson.words.filter(w => contains(en, w.word)).map(w => w.word);
    if (paragraph < 0) problems.push(`L${id}: phrase "${en}" does not appear in the passage`);
    if (!contains(example, en)) problems.push(`L${id}: phrase example does not use "${en}"`);
    if (!targetWords.length) warnings.push(`L${id}: phrase "${en}" does not contain a target word`);
    return { en, zh, usage, example, exampleZh, paragraph, targetWords };
  });
  if (phrases.length !== PHRASES_PER_LESSON) problems.push(`L${id}: expected ${PHRASES_PER_LESSON} phrases, got ${phrases.length}`);

  const quiz = content.quiz;
  if (!Array.isArray(quiz) || quiz.length !== 4 || !Array.isArray(quiz[1]) || quiz[1].length < 3
    || !(quiz[2] >= 0 && quiz[2] < quiz[1].length) || !quiz[3]) {
    problems.push(`L${id}: quiz must be [question, options(>=3), answerIndex, explanation]`);
  }

  const text = content.paragraphs.map(p => p[0]).join(' ');
  const highlightedWords = lesson.words.filter(w => contains(text, w.word)).map(w => w.word);
  const readingWords = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  if (highlightedWords.length < 15) problems.push(`L${id}: passage uses only ${highlightedWords.length} target words (need >= 15)`);
  if (readingWords.length < 160) problems.push(`L${id}: passage too short (${readingWords.length} words, need >= 160)`);

  lesson.passage = {
    title: content.title,
    genre: content.genre,
    paragraphs: content.paragraphs.map(p => p[0]),
    translation: content.paragraphs.map(p => p[1]),
    highlightedWords,
  };
  lesson.phrases = phrases.map((phrase, index) => ({ id: `${id}-${index + 1}`, ...phrase }));
  lesson.focusWords = [...new Set([...phrases.flatMap(p => p.targetWords), ...highlightedWords])].slice(0, 12);
  lesson.words = lesson.words.map(word => {
    const related = lesson.phrases.filter(p => p.targetWords.includes(word.word));
    return { ...word, collocations: related.map(p => p.en), example: related[0]?.example || '', exampleZh: related[0]?.exampleZh || '' };
  });
  lesson.targetWords = lesson.words;
  lesson.practice = {
    multipleChoice: [{ question: quiz[0], options: quiz[1], answer: quiz[2], explanation: quiz[3] }],
    cloze: lesson.phrases.map((phrase, index) => ({
      sentence: phrase.example.replace(new RegExp(escape(phrase.en), 'i'), '___'),
      answer: phrase.en,
      wordBank: [lesson.phrases[(index + 2) % lesson.phrases.length].en, phrase.en, lesson.phrases[(index + 1) % lesson.phrases.length].en].sort((a, b) => a.localeCompare(b)),
      explanation: `${phrase.zh}。${phrase.usage}`,
      phraseId: phrase.id,
    })),
    translation: lesson.phrases.slice(0, 2).map(p => ({ prompt: `请用 ${p.en} 翻译：${p.exampleZh}`, answer: p.example })),
  };
  lesson.stats = {
    ...lesson.stats,
    passageWords: highlightedWords.length,
    readingWords: readingWords.length,
    collocations: lesson.phrases.length,
    phrases: lesson.phrases.length,
  };

  const output = `// Lesson ${String(id).padStart(2, '0')}: fixed curriculum content.\nexport default ${JSON.stringify(lesson, null, 2)};\n`;
  if (!checkOnly) fs.writeFileSync(lessonPath, output);
  report.push(`${id}:${content.paragraphs.length}p/${highlightedWords.length}hl/${readingWords.length}w/${lesson.phrases.length}ph`);
}

console.log(report.join(' '));
if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(' - ' + w);
}
if (problems.length) {
  console.error('\nProblems:');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log(checkOnly ? `\nValidated ${report.length} lesson(s); no files written.` : `\nApplied ${report.length} lesson(s).`);
