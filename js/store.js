// 学習記録の保存（ブラウザの localStorage を使います）
//
// 保存先はブラウザごとです。別のブラウザやPCで続けたい時は、
// 「進捗」画面の「記録を書き出す／読み込む」を使ってください。
// localStorage が使えない環境でも、開いている間は動くようにしています。

const Store = (() => {
  const PROGRESS_KEY = 'gds-progress-v1';
  const SETTINGS_KEY = 'gds-settings-v1';
  const SESSION_KEY = 'gds-session-v1';
  const MAX_SESSIONS = 50;
  const memory = {}; // localStorage が使えない時の代わり

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // 読めない時は、下の memory を使う
    }
    return memory[key] || fallback;
  }

  function write(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // 保存できなくても、画面はそのまま使える
    }
  }

  function remove(key) {
    memory[key] = null;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // 何もしない
    }
  }

  // ----- 進捗 -----
  // answers:  問題IDごとの記録 { attempts, correct, lastCorrect, lastAt }
  // review:   復習リスト（間違えた問題のID）
  // sessions: これまでに解いた回の記録
  // handsOn:  「やってみよう」をやった記録 { ID: やった日時 }
  // later:    「あとでやる」に入れた「やってみよう」のID
  // exercises: ルール変更・課題と解決で書いた内容 { ID: { answer, reflection, revealedAt, updatedAt } }
  // breakdowns: 保存したゲーム分解（新しい順）
  // breakdownDraft: 書きかけのゲーム分解
  // library:  「読んだ・見た」資料 { ID: 日時 }
  // watched:  「見た」桜井さんの動画 { ID: 日時 }
  function emptyProgress() {
    return {
      answers: {}, review: [], sessions: [], handsOn: {}, later: [],
      exercises: {}, breakdowns: [], breakdownDraft: null, library: {}, watched: {},
    };
  }

  function loadProgress() {
    const progress = read(PROGRESS_KEY, null);
    return progress ? { ...emptyProgress(), ...progress } : emptyProgress();
  }

  function saveProgress(progress) {
    write(PROGRESS_KEY, progress);
  }

  // 1問の答えを記録する。
  // 間違えた問題は復習リストに入り、あとで正解すると外れる。
  function recordAnswer(questionId, isCorrect) {
    const progress = loadProgress();
    const record = progress.answers[questionId] || { attempts: 0, correct: 0 };
    record.attempts += 1;
    if (isCorrect) record.correct += 1;
    record.lastCorrect = isCorrect;
    record.lastAt = Date.now();
    progress.answers[questionId] = record;

    let change = null;
    const inReview = progress.review.includes(questionId);
    if (!isCorrect && !inReview) {
      progress.review.push(questionId);
      change = 'added';
    } else if (isCorrect && inReview) {
      progress.review = progress.review.filter((id) => id !== questionId);
      change = 'removed';
    }

    saveProgress(progress);
    return change;
  }

  function addSession(session) {
    const progress = loadProgress();
    progress.sessions.unshift(session);
    progress.sessions = progress.sessions.slice(0, MAX_SESSIONS);
    saveProgress(progress);
  }

  function resetProgress() {
    saveProgress(emptyProgress());
    clearSession();
  }

  // ----- 途中のクイズ（中断して、あとで続きから） -----
  // { mode, ids, orders, results, shownTips, startedAt }
  function loadSession() {
    return read(SESSION_KEY, null);
  }

  function saveSession(session) {
    write(SESSION_KEY, session);
  }

  function clearSession() {
    remove(SESSION_KEY);
  }

  // ----- やってみよう -----
  function isHandsOnDone(tipId) {
    return Boolean(loadProgress().handsOn[tipId]);
  }

  function markHandsOnDone(tipId) {
    const progress = loadProgress();
    progress.handsOn[tipId] = Date.now();
    progress.later = progress.later.filter((id) => id !== tipId);
    saveProgress(progress);
  }

  function isLater(tipId) {
    return loadProgress().later.includes(tipId);
  }

  function addLater(tipId) {
    const progress = loadProgress();
    if (!progress.later.includes(tipId)) progress.later.push(tipId);
    saveProgress(progress);
  }

  // ----- 書いて答え合わせする練習（ルール変更・課題と解決） -----
  function getExercise(id) {
    return loadProgress().exercises[id] || {};
  }

  function saveExercise(id, fields) {
    const progress = loadProgress();
    progress.exercises[id] = { ...(progress.exercises[id] || {}), ...fields, updatedAt: Date.now() };
    saveProgress(progress);
  }

  // ----- ゲーム分解 -----
  function loadBreakdowns() {
    return loadProgress().breakdowns;
  }

  function addBreakdown(values) {
    const progress = loadProgress();
    const id = `b${Date.now()}`;
    progress.breakdowns.unshift({ ...values, id, createdAt: Date.now(), updatedAt: Date.now() });
    progress.breakdownDraft = null;
    saveProgress(progress);
    return id;
  }

  function updateBreakdown(id, fields) {
    const progress = loadProgress();
    progress.breakdowns = progress.breakdowns.map((b) => (b.id === id ? { ...b, ...fields, updatedAt: Date.now() } : b));
    saveProgress(progress);
  }

  function deleteBreakdown(id) {
    const progress = loadProgress();
    progress.breakdowns = progress.breakdowns.filter((b) => b.id !== id);
    saveProgress(progress);
  }

  function loadBreakdownDraft() {
    return loadProgress().breakdownDraft;
  }

  function saveBreakdownDraft(draft) {
    const progress = loadProgress();
    progress.breakdownDraft = draft;
    saveProgress(progress);
  }

  // ----- 資料 -----
  function isLibraryDone(id) {
    return Boolean(loadProgress().library[id]);
  }

  function toggleLibraryDone(id) {
    const progress = loadProgress();
    if (progress.library[id]) delete progress.library[id];
    else progress.library[id] = Date.now();
    saveProgress(progress);
  }

  // ----- 桜井さんの動画 -----
  function isWatched(id) {
    return Boolean(loadProgress().watched[id]);
  }

  function toggleWatched(id) {
    const progress = loadProgress();
    if (progress.watched[id]) delete progress.watched[id];
    else progress.watched[id] = Date.now();
    saveProgress(progress);
  }

  // ----- 設定 -----
  function loadSettings() {
    return read(SETTINGS_KEY, { ruby: true });
  }

  function saveSettings(settings) {
    write(SETTINGS_KEY, settings);
  }

  // ----- 書き出し・読み込み -----
  function exportJson() {
    return JSON.stringify({ progress: loadProgress(), settings: loadSettings() }, null, 2);
  }

  function importJson(text) {
    const data = JSON.parse(text);
    if (!data || !data.progress) throw new Error('記録の形式が正しくありません');
    saveProgress({ ...emptyProgress(), ...data.progress });
    if (data.settings) saveSettings(data.settings);
  }

  return {
    loadProgress, recordAnswer, addSession, resetProgress,
    loadSession, saveSession, clearSession,
    isHandsOnDone, markHandsOnDone, isLater, addLater,
    getExercise, saveExercise,
    loadBreakdowns, addBreakdown, updateBreakdown, deleteBreakdown, loadBreakdownDraft, saveBreakdownDraft,
    isLibraryDone, toggleLibraryDone,
    isWatched, toggleWatched,
    loadSettings, saveSettings, exportJson, importJson,
  };
})();
