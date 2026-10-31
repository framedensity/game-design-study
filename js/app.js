// 画面の切り替え
// URLの # のあとで画面が決まります（例：#rules は一覧、#rules/r001 はその課題）。
// メニューは5つ：今日の学習／練習／企画ノート／読む・見る／進捗。

(() => {
  const app = document.getElementById('app');
  const data = window.GDS_DATA || {};
  const questions = (data.quiz && data.quiz.questions) || [];
  const QUICK_COUNT = 5;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const BACKUP_EVERY_DAYS = 30;

  // 書いてから答え合わせする練習の種類
  const RULES = {
    route: 'rules',
    title: 'ルール変更',
    lead: 'ルールを1つだけ変えたら、遊びはどう変わる？ まず自分で予想を書いてから、解説で答え合わせします。',
    answerLabel: 'あなたの予想',
    items: (data.rules && data.rules.items) || [],
  };
  const PROBLEMS = {
    route: 'problems',
    title: '課題と解決',
    lead: 'プレイヤーの困りごとを、あなたならどう解く？ まず自分の案を書いてから、設計の考え方の例と比べます。',
    answerLabel: 'あなたの解決案',
    items: (data.problems && data.problems.items) || [],
  };
  const VERBAL = {
    route: 'verbal',
    title: '言語化',
    lead: '考えを、短く、伝わる言葉にする練習です。まず自分で書いてから、書き方のコツと例を見ます。答えは、企画ノートに入れられるものもあります。',
    answerLabel: 'あなたの答え',
    items: (data.verbal && data.verbal.items) || [],
  };

  // 「今日のひとこと」は、ページを開いた時に1つ選んで、そのまま使う
  const todayTip = Tips.pick({});

  const views = {
    quiz: showHome,
    review: showReview,
    practice: () => Hubs.showPractice(app, { verbal: VERBAL, rules: RULES, problems: PROBLEMS }),
    verbal: (param) => showExercise(VERBAL, param),
    breakdown: (param) => (param ? Breakdown.showEditor(app, param) : Breakdown.showList(app)),
    rules: (param) => showExercise(RULES, param),
    problems: (param) => showExercise(PROBLEMS, param),
    playtest: (param) => (param ? Notebooks.playtests.showEditor(app, param) : Notebooks.playtests.showList(app)),
    project: (param) => (param ? Notebooks.projects.showEditor(app, param) : Notebooks.projects.showList(app)),
    kikaku: () => PitchDoc.showGuide(app),
    doc: (param) => PitchDoc.showProjectDoc(app, param),
    read: () => Hubs.showRead(app, questions.length),
    glossary: (param) => Glossary.show(app, questions, param),
    sakurai: () => SakuraiGuide.show(app),
    library: () => Library.show(app),
    progress: showProgress,
  };
  const doneActions = {
    restart: () => { location.hash = '#quiz'; route(); },
    goReview: () => { location.hash = '#review'; },
    goProgress: () => { location.hash = '#progress'; },
  };

  setupRubyToggle();
  window.addEventListener('hashchange', route);
  route();

  // オフラインでも開けるようにする（https で公開した時だけ動く。ファイルを直接開いた時は何もしない）
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  function route() {
    const [name, param] = location.hash.slice(1).split('/');
    const view = views[name] ? name : 'quiz';
    // メニューの1つが、いくつかの画面をまとめている（data-views に並べた画面で光る）
    document.querySelectorAll('.site-nav a, .tabbar a').forEach((a) => {
      a.classList.toggle('active', a.dataset.views.split(' ').includes(view));
    });
    views[view](param);
    window.scrollTo(0, 0);
  }

  function showExercise(kind, id) {
    const item = id && kind.items.find((i) => i.id === id);
    if (item) Exercise.showItem(app, kind, item);
    else Exercise.showList(app, kind);
  }

  function setupRubyToggle() {
    const button = document.getElementById('ruby-toggle');
    let visible = Store.loadSettings().ruby !== false;
    apply();
    button.addEventListener('click', () => {
      visible = !visible;
      apply();
      Store.saveSettings({ ...Store.loadSettings(), ruby: visible });
    });

    function apply() {
      Ruby.setVisible(visible);
      button.textContent = visible ? 'ふりがな：あり' : 'ふりがな：なし';
      button.setAttribute('aria-pressed', String(visible));
    }
  }

  function categories() {
    return [...new Set(questions.map((q) => q.category))];
  }

  function runOptions(mode) {
    return { mode, allQuestions: questions, onDone: doneActions };
  }

  // 途中のクイズがある時は、消してよいかを聞いてから始める
  function startQuiz(list, mode) {
    if (!list.length) return;
    if (Store.loadSession() && !confirm('途中のクイズがあります。それをやめて、新しく始めますか？')) return;
    QuizRunner.start(app, list, runOptions(mode));
  }

  // 今日復習する問題（間違えた問題と、復習の日が来た問題）
  function dueQuestions() {
    const ids = Store.dueQuestionIds();
    return questions.filter((q) => ids.includes(q.id));
  }

  // 「おまかせ」で出す問題：今日の復習 → まだ解いていない問題 → 解いたことがある問題 の順
  function pickQuick(count) {
    const progress = Store.loadProgress();
    const due = QuizRunner.shuffle(dueQuestions());
    const dueIds = due.map((q) => q.id);
    const fresh = QuizRunner.shuffle(questions.filter((q) => !progress.answers[q.id]));
    const rest = QuizRunner.shuffle(questions.filter((q) => progress.answers[q.id] && !dueIds.includes(q.id)));
    return [...due, ...fresh, ...rest].slice(0, count);
  }

  // 途中のクイズのカード（なければ空）
  function resumeCard() {
    const session = Store.loadSession();
    if (!session) return '';
    const kind = session.mode === 'review' ? '復習' : 'クイズ';
    return `
      <div class="card resume">
        <h3>途中の${kind}があります</h3>
        <p>${session.results.length} / ${session.ids.length} 問 済み。続きから始められます。</p>
        <div class="btn-row">
          <button class="btn" type="button" data-action="resume">続きから</button>
          <button class="btn secondary" type="button" data-action="discard">やめる</button>
        </div>
      </div>`;
  }

  function bindResumeCard(rerender) {
    const resumeButton = app.querySelector('[data-action="resume"]');
    if (!resumeButton) return;
    resumeButton.addEventListener('click', () => {
      const session = Store.loadSession();
      QuizRunner.resume(app, session, runOptions(session.mode));
    });
    app.querySelector('[data-action="discard"]').addEventListener('click', () => {
      if (confirm('途中のクイズをやめますか？（それまでの答えの記録は残ります）')) {
        Store.clearSession();
        rerender();
      }
    });
  }

  // 書いたものがあって、しばらく書き出していない時だけ、バックアップをすすめる
  function backupCard() {
    const settings = Store.loadSettings();
    const progress = Store.loadProgress();
    const hasWriting = progress.breakdowns.length || progress.projects.length || progress.playtests.length
      || Object.keys(progress.exercises).length;
    const now = Date.now();
    if (!hasWriting) return '';
    if (now - (settings.lastExportAt || 0) < BACKUP_EVERY_DAYS * DAY_MS) return '';
    if ((settings.backupSnoozeUntil || 0) > now) return '';
    return `
      <div class="card backup">
        <h3>記録のバックアップ</h3>
        <p class="note">書いた記録は、このスマホ（ブラウザ）の中だけに保存されています。ときどきファイルに保存しておくと、安心です。</p>
        <div class="btn-row">
          <button class="btn" type="button" id="backup-now">ファイルに保存する</button>
          <button class="btn secondary" type="button" id="backup-later">あとで</button>
        </div>
      </div>`;
  }

  function bindBackupCard(rerender) {
    const now = app.querySelector('#backup-now');
    if (!now) return;
    now.addEventListener('click', () => {
      UI.exportProgress();
      rerender();
    });
    app.querySelector('#backup-later').addEventListener('click', () => {
      Store.saveSettings({ ...Store.loadSettings(), backupSnoozeUntil: Date.now() + 7 * DAY_MS });
      rerender();
    });
  }

  // ----- 今日の学習 -----
  function showHome() {
    const progress = Store.loadProgress();
    const laterTips = progress.later.map(Tips.byId).filter(Boolean);
    const due = dueQuestions();
    const options = categories()
      .map((c) => `<option value="${Ruby.escape(c)}">${Ruby.escape(Ruby.plain(c))}</option>`)
      .join('');

    app.innerHTML = `
      <h2>今日の学習</h2>
      <p class="lead">時間がある分だけ進めましょう。答えるたびに保存されるので、いつやめても大丈夫です。</p>

      ${resumeCard()}
      ${backupCard()}

      <div class="card">
        <h3>すぐに始める</h3>
        <p class="note">今日の復習（${due.length}問）→ まだ解いていない問題 の順に出ます。初めての考え方は、先に「学ぶカード」で読んでから、問題で確かめます。</p>
        <div class="btn-row">
          <button class="btn" type="button" id="quick">おまかせ ${QUICK_COUNT}問</button>
          ${due.length ? `<a class="btn secondary" href="#review">今日の復習（${due.length}問）</a>` : ''}
        </div>
      </div>

      <div class="card">
        <h3>ほかの学び方</h3>
        <div class="modes">
          <a class="mode" href="#verbal"><strong><ruby>言語化<rt>げんごか</rt></ruby></strong><span>考えを、短く伝わる言葉にする（${Exercise.countDone(VERBAL.items)} / ${VERBAL.items.length}）</span></a>
          <a class="mode" href="#project"><strong><ruby>企画<rt>きかく</rt></ruby>ノート</strong><span>自分の企画を、学んだことで育てる（${progress.projects.length}件）</span></a>
          <a class="mode" href="#kikaku"><strong><ruby>企画書<rt>きかくしょ</rt></ruby>の書き方</strong><span>型・サンプル・練習</span></a>
          <a class="mode" href="#practice"><strong><ruby>練習<rt>れんしゅう</rt></ruby></strong><span>ゲーム分解・ルール変更・課題と解決・試遊ログ</span></a>
          <a class="mode" href="#read"><strong>読む・見る</strong><span>用語集・桜井さんの動画・資料</span></a>
        </div>
      </div>

      <div class="card">
        <h3>分野を選んで解く</h3>
        <div class="field">
          <label for="category">分野</label>
          <select id="category"><option value="">すべて（${questions.length}問）</option>${options}</select>
        </div>
        <div class="field">
          <label for="count">問題数</label>
          <select id="count">
            <option value="5">5問</option>
            <option value="10">10問</option>
            <option value="all">すべて</option>
          </select>
        </div>
        <div class="btn-row"><button class="btn secondary" id="start" type="button">はじめる</button></div>
      </div>

      ${todayTip ? `<div class="card"><h3>今日のひとこと</h3>${Tips.renderCard(todayTip)}</div>` : ''}

      ${laterTips.length ? `<div class="card"><h3>あとでやる（${laterTips.length}）</h3>${laterTips.map(Tips.renderCard).join('')}</div>` : ''}`;

    bindResumeCard(showHome);
    bindBackupCard(showHome);
    Demos.mountAll(app);
    Tips.bindActions(app, showHome);

    app.querySelector('#quick').addEventListener('click', () => startQuiz(pickQuick(QUICK_COUNT), 'normal'));
    app.querySelector('#start').addEventListener('click', () => {
      const category = app.querySelector('#category').value;
      const count = app.querySelector('#count').value;
      let list = category ? questions.filter((q) => q.category === category) : questions;
      list = QuizRunner.shuffle(list);
      if (count !== 'all') list = list.slice(0, Number(count));
      startQuiz(list, 'normal');
    });
  }

  // ----- 今日の復習 -----
  function showReview() {
    const list = dueQuestions();
    const body = list.length
      ? `<p class="lead">今日復習する問題が ${list.length} 問あります。間違えた問題と、前に正解してから日数がたった問題です。正解を重ねるほど、次に出るまでの日数がのびます（1日 → 3日 → 7日 → 21日）。</p>
         <div class="card"><div class="btn-row" style="margin:0"><button class="btn" id="start" type="button">復習をはじめる</button></div></div>`
      : '<div class="card"><p>今日復習する問題はありません。間違えた問題や、日数がたった問題が、ここに入ります。</p></div>';

    app.innerHTML = `<h2>今日の<ruby>復習<rt>ふくしゅう</rt></ruby></h2>${resumeCard()}${body}`;
    bindResumeCard(showReview);
    const startButton = app.querySelector('#start');
    if (startButton) startButton.addEventListener('click', () => startQuiz(list, 'review'));
  }

  // ----- 進捗 -----
  function showProgress() {
    const progress = Store.loadProgress();
    const answers = progress.answers;
    const answeredIds = Object.keys(answers);
    const attempts = answeredIds.reduce((sum, id) => sum + answers[id].attempts, 0);
    const correct = answeredIds.reduce((sum, id) => sum + answers[id].correct, 0);
    const rate = attempts ? Math.round((correct / attempts) * 100) : 0;
    const handsOnIds = Object.keys(progress.handsOn);
    const handsOnTotal = Tips.items.filter((t) => t.type === 'やってみよう').length;
    const settings = Store.loadSettings();

    const categoryRows = categories().map((c) => {
      const inCategory = questions.filter((q) => q.category === c);
      const done = inCategory.filter((q) => answers[q.id]);
      const a = done.reduce((sum, q) => sum + answers[q.id].attempts, 0);
      const ok = done.reduce((sum, q) => sum + answers[q.id].correct, 0);
      return `<tr><td>${Ruby.render(c)}</td><td>${done.length} / ${inCategory.length}</td><td>${a ? Math.round((ok / a) * 100) + '%' : '—'}</td></tr>`;
    }).join('');

    const formatDate = (at) => new Date(at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const sessionRows = progress.sessions.slice(0, 10).map((s) =>
      `<tr><td>${formatDate(s.at)}</td><td>${s.mode === 'review' ? '復習' : 'クイズ'}</td><td>${s.correct} / ${s.total}</td></tr>`).join('');

    const handsOnRows = handsOnIds
      .map((id) => ({ tip: Tips.byId(id), at: progress.handsOn[id] }))
      .filter((r) => r.tip)
      .sort((a, b) => b.at - a.at)
      .map((r) => `<tr><td>${formatDate(r.at)}</td><td>${Ruby.render(r.tip.title)}</td></tr>`).join('');

    const stat = (num, label) => `<div class="stat"><div class="num">${num}</div><div class="label">${label}</div></div>`;

    app.innerHTML = `
      <h2><ruby>進捗<rt>しんちょく</rt></ruby></h2>
      <div class="stats">
        ${stat(`${answeredIds.length} / ${questions.length}`, '解いた問題（種類）')}
        ${stat(attempts, '答えた回数')}
        ${stat(`${rate}%`, '正解率')}
        ${stat(dueQuestions().length, '今日の復習')}
        ${stat(`${Exercise.countDone(VERBAL.items)} / ${VERBAL.items.length}`, '言語化（答え合わせ済み）')}
        ${stat(progress.projects.length, '企画ノート')}
        ${stat(progress.breakdowns.length, '書いたゲーム分解')}
        ${stat(`${Exercise.countDone(RULES.items)} / ${RULES.items.length}`, 'ルール変更（答え合わせ済み）')}
        ${stat(`${Exercise.countDone(PROBLEMS.items)} / ${PROBLEMS.items.length}`, '課題と解決（答え合わせ済み）')}
        ${stat(progress.playtests.length, '試遊ログ')}
        ${stat(`${handsOnIds.length} / ${handsOnTotal}`, '手を動かした課題')}
        ${stat(`${SakuraiGuide.countDone()} / ${SakuraiGuide.items.length}`, '見た桜井さんの動画')}
        ${stat(`${Library.countDone()} / ${Library.items.length}`, '読んだ・見た資料')}
      </div>

      <div class="card">
        <h3>分野ごと</h3>
        <table><tr><th>分野</th><th>解いた問題</th><th>正解率</th></tr>${categoryRows}</table>
      </div>

      <div class="card">
        <h3>最近の記録</h3>
        ${sessionRows ? `<table><tr><th>日時</th><th>種類</th><th>正解</th></tr>${sessionRows}</table>` : '<p class="note">まだ記録がありません。</p>'}
      </div>

      <div class="card">
        <h3>やった「やってみよう」</h3>
        ${handsOnRows ? `<table><tr><th>日時</th><th>課題</th></tr>${handsOnRows}</table>` : '<p class="note">まだありません。クイズの合間や結果の画面に出てきます。</p>'}
      </div>

      <div class="card">
        <h3>記録の保存（バックアップ）</h3>
        <p class="note">記録はこのブラウザの中に保存されます。ファイルに保存しておけば、別のブラウザやPCでも読み込んで続けられます。
          ${settings.lastExportAt ? `最後に保存した日：${formatDate(settings.lastExportAt)}` : 'まだ一度も保存していません。'}</p>
        <div class="btn-row">
          <button class="btn secondary" id="export" type="button">ファイルに保存する</button>
          <label class="btn secondary">ファイルから読み込む<input id="import" type="file" accept="application/json" hidden></label>
          <button class="btn danger" id="reset" type="button">記録を消す</button>
        </div>
      </div>`;

    app.querySelector('#export').addEventListener('click', () => {
      UI.exportProgress();
      showProgress();
    });

    app.querySelector('#import').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      file.text().then((text) => {
        try {
          Store.importJson(text);
          showProgress();
        } catch (e) {
          alert('読み込めませんでした：' + e.message);
        }
      });
    });

    app.querySelector('#reset').addEventListener('click', () => {
      if (confirm('学習の記録をすべて消します。よろしいですか？')) {
        Store.resetProgress();
        showProgress();
      }
    });
  }
})();
