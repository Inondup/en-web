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
- `src/data/references.js`：不规则动词、连接词、常用搭配等速查内容。
- `src/lib/progress.js`：本地学习记录、间隔复习和导入校验。
- `src/lib/speech.js`：浏览器朗读与在线单词音频回退。
- `scripts/build-vocabulary.mjs`：从 ECDICT CSV 筛选并构建词表。
- `scripts/split-lessons.mjs`：一次性迁移脚本；默认保护已有课件，只有明确使用 `FORCE=1` 才会重新生成。
- `tests/`：课程数据与学习进度测试。
- `public/images/`：课程图片（本地资源）。

运行：`npm install`，`npm run dev`。验证：`npm test`，`npm run build`。

重建课程：准备 Oxford 3000/5000 参考词表 JSON 后设置 `OXFORD_SOURCE=/path/to/full-word.json`，运行 `npm run rebuild-curriculum`。脚本会固定分配每课 100 个唯一目标词，并生成原创课文、重点词、搭配和场景练习。
