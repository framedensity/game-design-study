// 画面の切り替え
// URLの # のあとで画面が決まります（例：#rules は一覧、#rules/r001 はその課題）。

(() => {
  const app = document.getElementById('app');
  const data = window.GDS_DATA || {};
  const questions = (data.quiz && data.quiz.questions) || [];
  const QUICK_COUNT = 5;

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

  // 「今日のひとこと」は、ページを開いた時に1つ選んで、そのまま使う
  const todayTip = Tips.pick({});

  const views = {
    quiz: showHome,
    review: showReview,
    glossary: (param) => Glossary.show(app, questions, param),
    sakurai: () => SakuraiGuide.show(app),
    breakdown: (param) => (param ? Breakdown.showEditor(app, param) : Breakdown.showList(app)),
    rules: (param) => showExercise(RULES, param),
    problems: (param) => showExercise(PROBLEMS, param),
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
    document.querySelectorAll('.site-nav a, .tabbar a').forEach((a) => {
      a.classList.toggle('active', a.dataset.view === view);
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

  // 「おまかせ」で出す問題：間違えた問題 → まだ解いていない問題 → 解いたことがある問題 の順
  function pickQuick(count) {
    const progress = Store.loadProgress();
    const review = QuizRunner.shuffle(questions.filter((q) => progress.review.includes(q.id)));
    const fresh = QuizRunner.shuffle(questions.filter((q) => !progress.answers[q.id]));
    const rest = QuizRunner.shuffle(questions.filter((q) => progress.answers[q.id] && !progress.review.includes(q.id)));
    return [...review, ...fresh, ...rest].slice(0, count);
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

  // ----- トップ（今日の学習） -----
  function showHome() {
    const progress = Store.loadProgress();
    const laterTips = progress.later.map(Tips.byId).filter(Boolean);
    const options = categories()
      .map((c) => `<option value="${Ruby.escape(c)}">${Ruby.escape(Ruby.plain(c))}</option>`)
      .join('');

    app.innerHTML = `
      <h2>今日の学習</h2>
      <p class="lead">時間がある分だけ進めましょう。答えるたびに保存されるので、いつやめても大丈夫です。</p>

      ${resumeCard()}

      <div class="card">
        <h3>すぐに始める</h3>
        <p class="note">初めての考え方は、先に「学ぶカード」で読んでから、問題で確かめます。間違えた問題 → まだ解いていない問題 の順に出ます。</p>
        <div class="btn-row">
          <button class="btn" type="button" id="quick">おまかせ ${QUICK_COUNT}問</button>
          <a class="btn secondary" href="#glossary">用語集を読む</a>
        </div>
      </div>

      <div class="card">
        <h3>ほかの学び方</h3>
        <div class="modes">
          <a class="mode" href="#breakdown"><strong>ゲーム<ruby>分解<rt>ぶんかい</rt></ruby></strong><span>遊んだゲームを、型に沿って書き出す（${Store.loadBreakdowns().length}件）</span></a>
          <a class="mode" href="#rules"><strong>ルール<ruby>変更<rt>へんこう</rt></ruby></strong><span>ルールを1つ変えたら？を予想する（${Exercise.countDone(RULES.items)} / ${RULES.items.length}）</span></a>
          <a class="mode" href="#problems"><strong><ruby>課題<rt>かだい</rt></ruby>と<ruby>解決<rt>かいけつ</rt></ruby></strong><span>プレイヤーの困りごとを解く（${Exercise.countDone(PROBLEMS.items)} / ${PROBLEMS.items.length}）</span></a>
          <a class="mode" href="#sakurai"><strong><ruby>桜井<rt>さくらい</rt></ruby>さんの<ruby>動画<rt>どうが</rt></ruby>ガイド</strong><span>モーションやゲーム性の動画を、テーマ別に見る（${SakuraiGuide.countDone()} / ${SakuraiGuide.items.length}）</span></a>
          <a class="mode" href="#glossary"><strong><ruby>用語集<rt>ようごしゅう</rt></ruby></strong><span>考え方を、分野ごとに読む（${questions.length}）</span></a>
          <a class="mode" href="#library"><strong><ruby>資料<rt>しりょう</rt></ruby></strong><span>日本の作り手の本・講演・動画（${Library.countDone()} / ${Library.items.length}）</span></a>
          <a class="mode" href="#review"><strong><ruby>復習<rt>ふくしゅう</rt></ruby></strong><span>間違えた問題（${progress.review.length}問）</span></a>
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

  // ----- 復習 -----
  function showReview() {
    const reviewIds = Store.loadProgress().review;
    const list = questions.filter((q) => reviewIds.includes(q.id));

    const body = list.length
      ? `<p class="lead">間違えた問題が ${list.length} 問あります。正解すると、復習リストから外れます。</p>
         <div class="card"><div class="btn-row" style="margin:0"><button class="btn" id="start" type="button">復習をはじめる</button></div></div>`
      : '<div class="card"><p>復習する問題はありません。クイズで間違えた問題が、ここに入ります。</p></div>';

    app.innerHTML = `<h2><ruby>復習<rt>ふくしゅう</rt></ruby></h2>${resumeCard()}${body}`;
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

    app.innerHTML = `
      <h2><ruby>進捗<rt>しんちょく</rt></ruby></h2>
      <div class="stats">
        <div class="stat"><div class="num">${answeredIds.length} / ${questions.length}</div><div class="label">解いた問題（種類）</div></div>
        <div class="stat"><div class="num">${attempts}</div><div class="label">答えた回数</div></div>
        <div class="stat"><div class="num">${rate}%</div><div class="label">正解率</div></div>
        <div class="stat"><div class="num">${progress.review.length}</div><div class="label">復習リストの問題</div></div>
        <div class="stat"><div class="num">${handsOnIds.length} / ${handsOnTotal}</div><div class="label">手を動かした課題</div></div>
        <div class="stat"><div class="num">${progress.breakdowns.length}</div><div class="label">書いたゲーム分解</div></div>
        <div class="stat"><div class="num">${Exercise.countDone(RULES.items)} / ${RULES.items.length}</div><div class="label">ルール変更（答え合わせ済み）</div></div>
        <div class="stat"><div class="num">${Exercise.countDone(PROBLEMS.items)} / ${PROBLEMS.items.length}</div><div class="label">課題と解決（答え合わせ済み）</div></div>
        <div class="stat"><div class="num">${Library.countDone()} / ${Library.items.length}</div><div class="label">読んだ・見た資料</div></div>
        <div class="stat"><div class="num">${SakuraiGuide.countDone()} / ${SakuraiGuide.items.length}</div><div class="label">見た桜井さんの動画</div></div>
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
        <h3>記録の保存</h3>
        <p class="note">記録はこのブラウザの中に保存されます。別のブラウザやPCで続けたい時は、書き出したファイルを読み込んでください。</p>
        <div class="btn-row">
          <button class="btn secondary" id="export" type="button">記録を書き出す</button>
          <label class="btn secondary">記録を読み込む<input id="import" type="file" accept="application/json" hidden></label>
          <button class="btn danger" id="reset" type="button">記録を消す</button>
        </div>
      </div>`;

    app.querySelector('#export').addEventListener('click', () => {
      const blob = new Blob([Store.exportJson()], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `game-design-study-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
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
