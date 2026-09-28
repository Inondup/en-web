import fs from 'node:fs';
import path from 'node:path';
import { lessons as existingLessons } from '../src/data/lessons.js';

const root = path.resolve('.');
const oxfordSource = process.env.OXFORD_SOURCE || '/tmp/Oxford-5000-words-main/full-word.json';
const ecdictPath = path.join(root, 'src/data/vocabulary.json');
const wordbankDir = path.join(root, 'src/data/oxford5000');
const lessonsDir = path.join(root, 'src/data/lessons');
const wordbankPath = path.join(wordbankDir, 'wordbank.json');

const stagePlans = [
  { start: 1, end: 10, extension: 60 },
  { start: 11, end: 20, extension: 50 },
  { start: 21, end: 30, extension: 40 },
  { start: 31, end: 40, extension: 30 },
  { start: 41, end: 50, extension: 20 },
];

const scenes = [
  ['daily-life', 'habits, health, housing, commuting, meals, travel, and personal time'],
  ['work', 'email, meetings, feedback, problems, negotiation, trust, presentations, remote work, and careers'],
  ['public-life', 'conflict, banking, healthcare, airports, hotels, online life, news, public issues, and data'],
  ['culture-knowledge', 'learning, books, film, cultural difference, the environment, cities, AI, media, and uncertainty'],
  ['complex-expression', 'decisions, research, explanation, speaking, review, future plans, values, responsibility, and synthesis'],
];

const sceneTerms = {
  'daily-life': ['habit', 'routine', 'health', 'sleep', 'meal', 'food', 'home', 'house', 'room', 'rent', 'bus', 'train', 'travel', 'weekend', 'time', 'rest', 'exercise', 'choice'],
  work: ['work', 'office', 'email', 'meeting', 'agenda', 'project', 'task', 'team', 'client', 'feedback', 'report', 'manager', 'career', 'trust', 'remote', 'present', 'negotiate', 'deadline'],
  'public-life': ['bank', 'pay', 'price', 'account', 'health', 'doctor', 'hospital', 'airport', 'flight', 'hotel', 'online', 'network', 'news', 'public', 'policy', 'data', 'service', 'problem'],
  'culture-knowledge': ['learn', 'study', 'skill', 'book', 'read', 'film', 'culture', 'environment', 'green', 'city', 'future', 'art', 'media', 'attention', 'machine', 'uncertain', 'science'],
  'complex-expression': ['decide', 'research', 'evidence', 'explain', 'speak', 'review', 'future', 'value', 'responsible', 'result', 'cause', 'effect', 'assume', 'reflect', 'plan', 'argument'],
};

const isWord = word => /^[a-z]+(?:[-'][a-z]+)?$/i.test(word) && word.length > 1 && word === word.toLowerCase();
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const uniqueByWord = values => {
  const seen = new Set();
  return values.filter(value => {
    const key = value.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function readOxfordWords() {
  if (!fs.existsSync(oxfordSource)) {
    if (fs.existsSync(wordbankPath)) {
      return JSON.parse(fs.readFileSync(wordbankPath)).map(row => ({
        word: row.word,
        level: row.cefr,
        type: row.pos?.[0] || 'noun',
        phonetics: { uk: row.ipaBrE, us: row.ipaAmE },
        examples: [],
        exchange: row.wordFamily?.join('/'),
        source: row.source,
      }));
    }
    throw new Error(`Oxford source not found: ${oxfordSource}`);
  }
  const rows = JSON.parse(fs.readFileSync(oxfordSource)).map(row => row.value || row).filter(row => (
    isWord(row.word) && ['A1', 'A2', 'B1', 'B2', 'C1'].includes(row.level) && row.phonetics?.uk
  ));
  return uniqueByWord(rows);
}

function readEcdict() {
  if (!fs.existsSync(ecdictPath)) return new Map();
  const rows = JSON.parse(fs.readFileSync(ecdictPath));
  return new Map(rows.filter(row => isWord(row.word)).map(row => [row.word.toLowerCase(), row]));
}

function makePos(type) {
  const normalized = clean(type).toLowerCase();
  if (normalized.includes('verb')) return ['verb'];
  if (normalized.includes('adverb')) return ['adverb'];
  if (normalized.includes('adjective')) return ['adjective'];
  if (normalized.includes('preposition')) return ['preposition'];
  if (normalized.includes('pronoun')) return ['pronoun'];
  if (normalized.includes('conjunction')) return ['conjunction'];
  if (normalized.includes('determiner')) return ['determiner'];
  if (normalized.includes('number')) return ['number'];
  return ['noun'];
}

function familyFor(word, exchange = '') {
  const family = [word];
  for (const candidate of clean(exchange).split('/')) {
    const value = candidate.replace(/^[^:]+:/, '').trim().toLowerCase();
    if (isWord(value) && !family.includes(value)) family.push(value);
  }
  const suffixes = [
    ['tion', 'te'], ['ment', ''], ['ness', ''], ['ity', ''], ['able', ''],
    ['ly', ''], ['ing', ''], ['ed', ''], ['er', ''], ['s', ''],
  ];
  for (const [suffix, replacement] of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const rootWord = `${word.slice(0, -suffix.length)}${replacement}`;
      if (isWord(rootWord) && !family.includes(rootWord)) family.push(rootWord);
    }
  }
  return family.slice(0, 4);
}

function collocationsFor(word, pos) {
  if (pos === 'verb') return [`${word} a plan`, `${word} carefully`, `${word} with others`];
  if (pos === 'adjective') return [`a ${word} approach`, `remain ${word}`, `${word} enough`];
  if (pos === 'adverb') return [`respond ${word}`, `work ${word}`, `speak ${word}`];
  return [`a ${word}`, `the role of ${word}`, `${word} and evidence`];
}

function zhFor(word, ecdict, type) {
  const translation = clean(ecdict?.translation).replace(/\s+(?:n|v|a|ad|prep|conj|vt|vi|aux)\.?\s+/gi, '；');
  if (translation) return translation.slice(0, 90);
  return `${type || '词汇'}：${word}`;
}

function chooseExample(word, type) {
  const pos = makePos(type)[0];
  if (pos === 'verb') return `We can ${word} the next step together.`;
  if (pos === 'adjective') return `A ${word} approach makes the situation easier to explain.`;
  if (pos === 'adverb') return `We can respond ${word} when the situation changes.`;
  return `This ${word} matters when people need to make a clear decision.`;
}

function sceneFor(id) {
  return scenes[Math.min(4, Math.floor((id - 1) / 10))];
}

function roleCountsFor(lessonId) {
  const plan = stagePlans.find(item => lessonId >= item.start && lessonId <= item.end);
  return { extension: plan.extension, activation: 100 - plan.extension };
}

function topicScore(item, sceneKey, ecdict) {
  const haystack = `${item.word} ${ecdict.get(item.word.toLowerCase())?.translation || ''}`.toLowerCase();
  return sceneTerms[sceneKey].reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function buildWordbank() {
  const ecdict = readEcdict();
  const oxford = readOxfordWords();
  const missing = [...ecdict.values()]
    .filter(row => !oxford.some(item => item.word.toLowerCase() === row.word.toLowerCase()))
    .sort((a, b) => a.frequency - b.frequency)
    .slice(0, Math.max(0, 5000 - oxford.length))
    .map(row => ({
      word: row.word,
      level: row.tag?.includes('cet6') ? 'B2' : 'B1',
      type: 'noun',
      phonetics: { uk: `/${row.phonetic || 'ə'}/`, us: `/${row.phonetic || 'ə'}/` },
      examples: [],
      exchange: row.exchange,
      source: 'Oxford 5000 companion',
    }));
  const sourceWords = [...oxford, ...missing].slice(0, 5000);
  if (sourceWords.length !== 5000) throw new Error(`Expected 5000 source words, found ${sourceWords.length}`);

  const extensionPool = sourceWords.filter(item => ['B2', 'C1'].includes(item.level));
  const activationPool = sourceWords.filter(item => !['B2', 'C1'].includes(item.level));
  const assigned = [];
  const take = (pool, count, sceneKey) => {
    const available = pool.filter(item => !assigned.includes(item)).sort((a, b) => (
      topicScore(b, sceneKey, ecdict) - topicScore(a, sceneKey, ecdict) || a.word.localeCompare(b.word)
    ));
    const result = available.slice(0, count);
    for (const item of result) pool.splice(pool.indexOf(item), 1);
    if (result.length < count) result.push(...sourceWords.filter(item => !assigned.includes(item) && !result.includes(item)).slice(0, count - result.length));
    assigned.push(...result);
    return result;
  };

  for (const lesson of existingLessons) {
    const counts = roleCountsFor(lesson.id);
    const sceneKey = sceneFor(lesson.id)[0];
    const extension = take(extensionPool, counts.extension, sceneKey).map(item => ({ item, role: 'extension' }));
    const activation = take(activationPool, counts.activation, sceneKey).map(item => ({ item, role: 'activation' }));
    lesson.__assignedWords = [...extension, ...activation];
  }

  const records = existingLessons.flatMap(lesson => lesson.__assignedWords.map(({ item, role }) => {
    const ecdictRow = ecdict.get(item.word.toLowerCase());
    const pos = makePos(item.type)[0];
    return {
      word: item.word,
      ipaBrE: item.phonetics.uk,
      ipaAmE: item.phonetics.us || item.phonetics.uk,
      ipa: item.phonetics.uk,
      pos: makePos(item.type),
      zh: zhFor(item.word, ecdictRow, item.type),
      cefr: item.level,
      source: item.source || 'Oxford 5000',
      role,
      topic: sceneFor(lesson.id)[0],
      collocations: collocationsFor(item.word, pos),
      wordFamily: familyFor(item.word, item.exchange || ecdictRow?.exchange),
      example: chooseExample(item.word, item.type),
      exampleZh: '把这个词放回本课真实场景中使用。',
    };
  }));
  fs.mkdirSync(wordbankDir, { recursive: true });
  fs.writeFileSync(wordbankPath, `${JSON.stringify(records, null, 2)}\n`);
  const families = Object.fromEntries(records.map(word => [word.word, word.wordFamily]));
  const collocations = Object.fromEntries(records.map(word => [word.word, word.collocations]));
  fs.writeFileSync(path.join(wordbankDir, 'word-families.json'), `${JSON.stringify(families, null, 2)}\n`);
  fs.writeFileSync(path.join(wordbankDir, 'collocations.json'), `${JSON.stringify(collocations, null, 2)}\n`);
  return records;
}

function splitWords(words, count) {
  const result = [];
  for (let i = 0; i < words.length && result.length < count; i += 1) {
    if (!result.includes(words[i])) result.push(words[i]);
  }
  return result;
}

function sceneText(lesson, words) {
  const [topic, focus] = sceneFor(lesson.id);
  const highlightedWords = splitWords(words.map(word => word.word), 30);
  const lead = highlightedWords.slice(0, 10).join(', ');
  const middle = highlightedWords.slice(10, 20).join(', ');
  const closing = highlightedWords.slice(20).join(', ');
  const paragraphSets = [
    [
      `A real ${topic} task usually begins with a small decision. In this lesson, we look at ${lesson.enTitle.toLowerCase()} through a situation involving ${focus}. The aim is to notice how people explain a choice and keep the next step practical. The first useful terms are ${lead}.`,
      `When the situation changes, a clear speaker can pause, ask for clarification, and respond with evidence. In this case, the conversation also involves ${middle}. These terms help a learner describe what is happening without forcing every expression into one sentence.`,
      `The final part of the task brings in ${closing}. By the end, connect at least one phrase to something you have done, need to do, or may discuss tomorrow. A word becomes easier to remember when it helps you complete a real task.`,
    ],
    [
      `Imagine that you are handling ${focus}. The first move is to define the situation, identify the people involved, and choose a reasonable outcome. This is the kind of ${topic} exchange that rewards precise but natural language. Start with ${lead}.`,
      `A useful response does not need to sound dramatic. You can acknowledge a concern, explain the reason, propose an alternative, and check whether the other person agrees. Here, the useful terms include ${middle}. The order matters because it keeps the conversation moving.`,
      `Use the vocabulary set to make the situation your own. The final terms are ${closing}. Add one detail from your experience. The goal is not to sound perfect; it is to make a clear decision and explain it.`,
    ],
  ];
  const paragraphs = paragraphSets[lesson.id % 2];
  const translations = [
    `一个真实的${topic}任务通常从一个小决定开始。本课通过${focus}相关的情境，理解如何解释选择，并让下一步切实可行。`,
    '情况变化时，清晰的表达者可以停顿、请求澄清，并用证据回应。与其把所有新表达硬塞进一句话，不如在对话、例句和后续任务中反复遇见实用语言。',
    `请用这组词把情境变成自己的经历，从${lead}中至少选一个短语，联系你做过、需要做或明天可能讨论的事情。词汇在完成真实任务时更容易记住。`,
  ];
  return { title: lesson.enTitle, paragraphs, translation: translations, highlightedWords };
}

function makePractice(lesson, words) {
  const focus = words.slice(0, 12);
  const first = focus[0];
  const second = focus[1];
  return {
    multipleChoice: [{
      question: `Which expression best fits the ${sceneFor(lesson.id)[0]} situation?`,
      options: [first.collocations[0], second.collocations[0], 'ignore the context'],
      answer: 0,
      explanation: `Use ${first.word} in a phrase rather than studying it in isolation.`,
    }],
    cloze: [{
      sentence: `A clear speaker can ___ the next step and explain the reason.`,
      answer: first.word,
      wordBank: [first.word, second.word, 'forget'],
    }],
    translation: [{
      prompt: `请用 ${first.word} 和 ${second.word} 说清楚本课场景中的一个下一步。`,
      answer: `Use ${first.word} and ${second.word} to explain the next step in this situation.`,
    }],
  };
}

function writeLessons(records) {
  const byLesson = new Map();
  records.forEach((record, index) => {
    const lessonId = Math.floor(index / 100) + 1;
    if (!byLesson.has(lessonId)) byLesson.set(lessonId, []);
    byLesson.get(lessonId).push(record);
  });
  const imports = [];
  for (const base of existingLessons) {
    const words = byLesson.get(base.id);
    const lesson = { ...base };
    delete lesson.__assignedWords;
    lesson.topic = sceneFor(base.id)[0];
    lesson.targetWords = words;
    lesson.words = words;
    lesson.focusWords = words.slice(0, 12).map(word => word.word);
    lesson.passage = sceneText(base, words);
    lesson.practice = makePractice(base, words);
    lesson.stats = {
      extensionWords: words.filter(word => word.role === 'extension').length,
      activationWords: words.filter(word => word.role === 'activation').length,
      passageWords: lesson.passage.highlightedWords.length,
      collocations: words.reduce((count, word) => count + word.collocations.length, 0),
    };
    const fileName = `lesson-${String(base.id).padStart(2, '0')}.js`;
    fs.writeFileSync(path.join(lessonsDir, fileName), `// Lesson ${String(base.id).padStart(2, '0')}: fixed curriculum content.\nexport default ${JSON.stringify(lesson, null, 2)};\n`);
    imports.push(`import lesson${base.id} from './${fileName}';`);
  }
  fs.writeFileSync(path.join(lessonsDir, 'index.js'), `${imports.join('\n')}\n\nexport const lessons = [\n${existingLessons.map(lesson => `  lesson${lesson.id},`).join('\n')}\n];\n`);
}

const records = buildWordbank();
writeLessons(records);
const counts = records.reduce((result, word) => { result[word.role] += 1; return result; }, { extension: 0, activation: 0 });
console.log(`Rebuilt 50 lessons and ${records.length} unique words (${counts.extension} extension, ${counts.activation} activation).`);
