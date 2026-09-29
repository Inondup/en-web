# 项目导航

- `src/App.jsx`：课程目录、课文、词表、语法、速查、复习与设置界面。
- `src/styles.css`：响应式界面样式。
- `src/data/lessons/index.js`：按顺序聚合 50 个独立课程模块。
- `src/data/lessons/lesson-01.js` ... `lesson-50.js`：每课独立保存课程主题、双语课文、100 个词和语法关联，可单课编辑。
- `src/data/grammar.js`：50 个中高级语法知识点、例句和练习。
- `src/data/vocabulary.json`：课程词表；每课 100 词，含 IPA 与词频。
- `src/data/oxford5000/wordbank.json`：固定的 5000 词目标词库，含 CEFR、词性、角色、搭配、词族和例句。
- `src/data/oxford5000/word-families.json` / `collocations.json`：词族与搭配索引。
- `src/data/oxford5000/translations.json`：5000 个目标词的中文释义（源自 ECDICT，已清洗），保证每词都有词性、翻译、音标。
- `scripts/rebuild-curriculum.mjs`：从 Oxford 参考词表一次性重建 50 课；运行时不会重排词汇。
- `scripts/lesson-content/l01.mjs` ... `l50.mjs`：每课的课文与词组稿件（passage 段落、中文翻译、20 个词组、场景单选），手工编写，供下面脚本写回课程文件。
- `scripts/lesson-content/additions/a01.mjs` ... `a50.mjs`：为每课补充的 2 段课文与 15 个词组稿件（在原 5 条基础上扩到 20 条）。
- `scripts/lesson-content/base/`：扩写前 l13–l50 的原始稿件备份，供 `extend.mjs` 幂等重建使用。
- `scripts/lesson-content/extend.mjs`：把 aNN.mjs 的补充段落与词组合并进 lNN.mjs（按文本去重，幂等）。用法：`node scripts/lesson-content/extend.mjs`（全部）或指定课号。
- `scripts/apply-lesson-content.mjs`：把 lNN.mjs 的课文与词组写回 `src/data/lessons/lesson-NN.js`。它只替换 passage / phrases / practice / stats，不改 100 个固定目标词的顺序；词组必须出现在课文原句中、例句必须用到该词组。用法：`node scripts/apply-lesson-content.mjs`（全部）、`node scripts/apply-lesson-content.mjs --check 21`（只校验）。
- `scripts/lesson-content/show-words.mjs`：打印某课的固定 100 词、阶段与语法点，写稿前用它确认可用词汇。
- `src/data/references.js`：不规则动词、连接词、常用搭配等速查内容。
- `src/lib/progress.js`：本地学习记录、间隔复习和导入校验。
- `src/lib/speech.js`：浏览器朗读与在线单词音频回退。
- `scripts/build-vocabulary.mjs`：从 ECDICT CSV 筛选并构建词表。
- `scripts/split-lessons.mjs`：一次性迁移脚本；默认保护已有课件，只有明确使用 `FORCE=1` 才会重新生成。
- `tests/`：课程数据与学习进度测试。
- `public/images/`：课程图片（本地资源）。

课文与词组结构：每课 `passage` 含 title、genre、4 个英文段落及逐段中文翻译；`phrases` 固定 20 条，各含英文词组、中文释义、用法说明、例句与例句翻译，并标出它覆盖的目标词；`practice.cloze` 由这些词组例句自动生成。界面「课文精读」标签下的「词组」页负责词组教学。

运行：`npm install`，`npm run dev`。验证：`npm test`，`npm run build`。

重建课程：准备 Oxford 3000/5000 参考词表 JSON 后设置 `OXFORD_SOURCE=/path/to/full-word.json`，运行 `npm run rebuild-curriculum`。脚本会固定分配每课 100 个唯一目标词，并生成原创课文、重点词、搭配和场景练习。
