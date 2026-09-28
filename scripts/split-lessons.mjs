import fs from 'node:fs';
import path from 'node:path';
import { lessons } from '../src/data/lessons.js';

const outputDir = path.resolve('src/data/lessons');
const existingFiles = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter(file => file.endsWith('.js')) : [];
if (existingFiles.length > 0 && process.env.FORCE !== '1') {
  throw new Error(`Refusing to overwrite ${existingFiles.length} lesson modules. Use FORCE=1 only for a deliberate regeneration.`);
}
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const imports = [];
for (const lesson of lessons) {
  const fileName = `lesson-${String(lesson.id).padStart(2, '0')}.js`;
  const source = `// Lesson ${String(lesson.id).padStart(2, '0')}: edit this file to revise one lesson's content.\nexport default ${JSON.stringify(lesson, null, 2)};\n`;
  fs.writeFileSync(path.join(outputDir, fileName), source);
  imports.push(`import lesson${lesson.id} from './${fileName}';`);
}

const index = `${imports.join('\n')}\n\nexport const lessons = [\n${lessons.map(lesson => `  lesson${lesson.id},`).join('\n')}\n];\n`;
fs.writeFileSync(path.join(outputDir, 'index.js'), index);
console.log(`Split ${lessons.length} lessons into ${outputDir}`);
