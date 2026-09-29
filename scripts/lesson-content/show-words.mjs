// Helper: print the fixed 100 target words (and stage / grammar point) for a lesson id.
// Usage: node scripts/lesson-content/show-words.mjs 21 22 23
import { lessons } from '../../src/data/lessons.js';
import { grammar } from '../../src/data/grammar.js';

const ids = process.argv.slice(2).map(Number).filter(Boolean);
if (!ids.length) { console.error('usage: show-words.mjs <lessonId> ...'); process.exit(1); }
for (const id of ids) {
  const lesson = lessons[id - 1];
  const g = grammar[lesson.grammarId - 1];
  const ext = lesson.words.filter(w => w.role === 'extension').map(w => w.word);
  const act = lesson.words.filter(w => w.role === 'activation').map(w => w.word);
  console.log(`\n===== L${id} ${lesson.title} | ${lesson.enTitle} | topic ${lesson.topic} | level ${lesson.level}`);
  console.log(`summary: ${lesson.summary}`);
  console.log(`grammar ${g.id}: ${g.title} — ${g.formula}`);
  console.log(`EXTENSION (${ext.length}, newer B2-C1 words, must carry the teaching weight): ${ext.join(', ')}`);
  console.log(`ACTIVATION (${act.length}, known words used at a higher level): ${act.join(', ')}`);
  console.log(`order in lesson.words: ${lesson.words.map(w => w.word).join(', ')}`);
}
