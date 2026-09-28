const KEY = 'daily-english-progress-v1';
const defaultState = { completedLessons: [], knownWords: [], reviewQueue: [], streak: 0, lastStudy: null };
export function loadProgress() { try { return { ...defaultState, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...defaultState }; } }
export function saveProgress(next) { localStorage.setItem(KEY, JSON.stringify(next)); return next; }
export function markLesson(state, lessonId) { const completedLessons = state.completedLessons.includes(lessonId) ? state.completedLessons : [...state.completedLessons, lessonId]; return saveProgress({ ...state, completedLessons, lastStudy: new Date().toISOString().slice(0, 10) }); }
export function rateWord(state, word, rating) { const old = state.reviewQueue.filter(item => item.word !== word); const days = rating === 'again' ? 1 : rating === 'hard' ? 3 : 7; const next = { word, due: Date.now() + days * 86400000, rating }; return saveProgress({ ...state, knownWords: rating === 'known' ? [...new Set([...state.knownWords, word])] : state.knownWords, reviewQueue: [...old, next] }); }
export function resetProgress() { localStorage.removeItem(KEY); return { ...defaultState }; }
