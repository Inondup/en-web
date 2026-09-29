// Merge additional paragraphs + phrases into lNN.mjs. For lessons that have a pristine
// copy under ./base, rebuild from that base each run so the tool is fully idempotent and
// additions files can be edited and re-applied. For lessons without a base copy, append
// while de-duplicating by text.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2).map(Number).filter(Boolean);
const ids = only.length ? only : Array.from({ length: 50 }, (_, i) => i + 1);
const load = async p => (await import(`${p}?t=${Date.now()}${Math.random()}`)).default;

for (const id of ids) {
  const pad = String(id).padStart(2, '0');
  const addPath = path.join(here, 'additions', `a${pad}.mjs`);
  if (!fs.existsSync(addPath)) continue;
  const contentPath = path.join(here, `l${pad}.mjs`);
  const basePath = path.join(here, 'base', `l${pad}.mjs`);
  const content = await load(fs.existsSync(basePath) ? basePath : contentPath);
  const add = await load(addPath);

  const seenPhrase = new Set(content.phrases.map(p => p[0].toLowerCase()));
  for (const pr of (add.phrases || [])) {
    if (seenPhrase.has(pr[0].toLowerCase())) continue;
    content.phrases.push(pr);
    seenPhrase.add(pr[0].toLowerCase());
  }
  const seenPara = new Set(content.paragraphs.map(p => p[0]));
  for (const pg of (add.paragraphs || [])) {
    if (seenPara.has(pg[0])) continue;
    content.paragraphs.push(pg);
    seenPara.add(pg[0]);
  }

  const out = `// Lesson ${pad} editorial content: passage, phrases and scene quiz.\nexport default ${JSON.stringify(content, null, 2)};\n`;
  fs.writeFileSync(contentPath, out);
  console.log(`L${id}: ${content.paragraphs.length} paragraphs, ${content.phrases.length} phrases`);
}
