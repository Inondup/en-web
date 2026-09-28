import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const source = process.env.ECDICT_SOURCE || '/tmp/en-web-ecdict.csv';
const output = path.resolve('src/data/vocabulary.json');
const rows = parse(fs.readFileSync(source), { columns: true, relax_quotes: true, skip_empty_lines: true });
const clean = value => String(value || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
const terms = rows.map(row => {
  const frequency = Number.parseInt(row.frq, 10) || Number.parseInt(row.bnc, 10) || 999999;
  const word = String(row.word || '').trim();
  const translation = clean(row.translation).replace(/^[a-z.]+\s+/i, '');
  const phonetic = clean(row.phonetic).replace(/[']/g, 'ˈ').replace(/,/g, ' ˌ');
  return { word, phonetic, translation, frequency, exchange: clean(row.exchange), tag: clean(row.tag) };
}).filter(row => /^[a-z]+(?:[-'][a-z]+)?$/i.test(row.word) && row.word.length > 1 && row.phonetic && row.translation && row.frequency < 30000);

const seen = new Set();
const selected = terms.sort((a, b) => a.frequency - b.frequency).filter(row => {
  const key = row.word.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}).slice(0, 5000);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(selected, null, 2));
console.log(`Wrote ${selected.length} words to ${output}`);
