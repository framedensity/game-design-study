// クイズの出題と答え合わせ
//
// 答えるたびに、途中の状態を保存します。ページを閉じても、次に開いた時に続きから始められます。
// まだ一度も答えたことのない問題の前には、先に「学ぶカード」を出します（本を読んでいなくても学べるように）。
// TIP_EVERY 問ごとに、「ひとこと」（知識・コツ・やってみよう）をはさみます。

const QuizRunner = (() => {
  const TIP_EVERY = 3;

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // 新しく始める
  // options: { mode: 'normal' か 'review', allQuestions: 全問題, onDone: { restart, goReview, goProgress } }
  function start(container, questions, options) {
    const session = {
      mode: options.mode || 'normal',
      ids: shuffle(questions).map((q) => q.id),
      orders: {},
      results: [],
      shownTips: [],
      startedAt: Date.now(),
    };
    questions.forEach((q) => {
      session.orders[q.id] = shuffle(q.choices.map((_, i) => i));
    });
    Store.saveSession(session);
    run(container, session, options);
  }

  // 保存してあった途中のクイズを、続きから始める
  function resume(container, session, options) {
    run(container, session, options);
  }

  function run(container, session, options) {
    const byId = {};
    options.allQuestions.forEach((q) => { byId[q.id] = q; });
    // 教材から消した問題は飛ばす
    session.ids = session.ids.filter((id) => byId[id]);
    session.results = session.results.filter((r) => byId[r.id]);

    session.learned = session.learned || []; // この回で「学ぶカード」を読んだ問題
    let index = session.results.length;
    if (index >= session.ids.length) finish();
    else showQuestion();

    function conceptName(q) {
      return q.concept || q.choices[q.answer];
    }

    // 初めての問題なら、先に概念を学ぶ
    function showQuestion() {
      const q = byId[session.ids[index]];
      const isNew = !Store.loadProgress().answers[q.id];
      if (isNew && !session.learned.includes(q.id)) showLesson(q);
      else showAsk(q);
    }

    function showLesson(q) {
      container.innerHTML = `
        <div class="card lesson">
          <div class="quiz-meta">
            <span class="tag">新しく学ぶ</span>
            <span>${index + 1} / ${session.ids.length}</span>
          </div>
          <p class="note">${Ruby.render(q.category)}</p>
          <h2 class="concept">${Ruby.render(conceptName(q))}</h2>
          <p>${Ruby.render(q.explanation)}</p>
          ${q.example ? `<h4 class="label">例</h4><p>${Ruby.render(q.example)}</p>` : ''}
          ${q.demo ? `<h4 class="label">動かして確かめる</h4>${Demos.slot(q.demo)}` : ''}
          ${UI.renderSources(q.sources)}
          <div class="btn-row"><button class="btn" id="to-question" type="button">わかった。問題で確かめる</button></div>
        </div>`;
      Demos.mountAll(container);
      container.querySelector('#to-question').addEventListener('click', () => {
        session.learned.push(q.id);
        Store.saveSession(session);
        showAsk(q);
      });
    }

    function showAsk(q) {
      const order = session.orders[q.id] || q.choices.map((_, i) => i);
      const choices = order
        .map((i) => `<button class="choice" type="button" data-choice="${i}">${Ruby.render(q.choices[i])}</button>`)
        .join('');

      container.innerHTML = `
        <div class="card">
          <div class="quiz-meta">
            <span class="tag">${Ruby.render(q.category)}</span>
            <span>${index + 1} / ${session.ids.length}${session.mode === 'review' ? '（復習）' : ''}</span>
          </div>
          <p class="question">${Ruby.render(q.question)}</p>
          <div class="choices">${choices}</div>
          <div class="feedback-area"></div>
          <p class="note saved-note">答えるたびに保存されます。いつやめても、次に開いた時に続きから始められます。</p>
        </div>`;

      container.querySelectorAll('.choice').forEach((button) => {
        button.addEventListener('click', () => answer(q, Number(button.dataset.choice)));
      });
    }

    function answer(q, chosen) {
      const isCorrect = chosen === q.answer;
      session.results.push({ id: q.id, ok: isCorrect });
      Store.saveSession(session);
      const change = Store.recordAnswer(q.id, isCorrect);

      container.querySelectorAll('.choice').forEach((button) => {
        const i = Number(button.dataset.choice);
        button.disabled = true;
        if (i === q.answer) button.classList.add('correct');
        else if (i === chosen) button.classList.add('wrong');
      });

      const reviewNote = change === 'added'
        ? '<p class="note">この問題を復習リストに入れました。</p>'
        : change === 'removed'
          ? '<p class="note">正解したので、復習リストから外しました。</p>'
          : '';
      const isLast = index === session.ids.length - 1;

      // さっき「学ぶカード」で読んだばかりなら、解説はたたんでおく
      const details = `
        <h4>解説</h4>
        <p>${Ruby.render(q.explanation)}</p>
        ${q.example ? `<h4>例</h4><p>${Ruby.render(q.example)}</p>` : ''}
        ${q.demo ? `<h4>動かして確かめる</h4>${Demos.slot(q.demo)}` : ''}
        ${UI.renderSources(q.sources)}`;
      const justLearned = session.learned.includes(q.id);

      container.querySelector('.saved-note').remove();
      container.querySelector('.feedback-area').innerHTML = `
        <div class="feedback">
          <p class="${isCorrect ? 'result-ok' : 'result-ng'}">${isCorrect ? '正解！' : '不正解'}　<span class="note">${Ruby.render(conceptName(q))}</span></p>
          ${reviewNote}
          ${justLearned ? `<details class="sample"><summary>解説をもう一度読む</summary>${details}</details>` : details}
          <div class="btn-row">
            <button class="btn next" type="button">${isLast ? '結果を見る' : '次へ'}</button>
          </div>
        </div>`;
      Demos.mountAll(container);

      container.querySelector('.next').addEventListener('click', () => {
        index += 1;
        if (index >= session.ids.length) finish();
        else if (index % TIP_EVERY === 0) showTip(q.category);
        else showQuestion();
      });
    }

    // 問題の合間の「ひとこと」
    function showTip(category) {
      const tip = Tips.pick({ category, exclude: session.shownTips });
      if (!tip) {
        showQuestion();
        return;
      }
      session.shownTips.push(tip.id);
      Store.saveSession(session);

      render();
      function render() {
        container.innerHTML = `
          <div class="card">
            <div class="quiz-meta">
              <span class="tag">ひとこと</span>
              <span>${index} / ${session.ids.length} 問 済み</span>
            </div>
            ${Tips.renderCard(tip)}
            <div class="btn-row"><button class="btn next" type="button">次の問題へ</button></div>
          </div>`;
        Demos.mountAll(container);
        Tips.bindActions(container, render);
        container.querySelector('.next').addEventListener('click', showQuestion);
      }
    }

    function finish() {
      const results = session.results;
      const correct = results.filter((r) => r.ok).length;
      Store.addSession({ mode: session.mode, total: results.length, correct, at: Date.now() });
      Store.clearSession();

      const missed = results.filter((r) => !r.ok).map((r) => byId[r.id]);
      // 間違えた分野の「やってみよう」を1つすすめる
      const task = Tips.pick({ type: 'やってみよう', category: missed.length ? missed[0].category : undefined });

      render();
      function render() {
        const missedList = missed.length
          ? `<h3>間違えた問題</h3><ul class="missed-list">${missed.map((q) => `<li>${Ruby.render(q.question)}</li>`).join('')}</ul>`
          : '<p>全問正解です。</p>';

        container.innerHTML = `
          <div class="card">
            <h2>結果：${correct} / ${results.length} 問 正解</h2>
            ${missedList}
            <div class="btn-row">
              <button class="btn restart" type="button">トップへ</button>
              <button class="btn secondary review" type="button">復習へ</button>
              <button class="btn secondary progress" type="button">進捗を見る</button>
            </div>
          </div>
          ${task ? `<div class="card"><h3>手を動かしてみよう</h3>${Tips.renderCard(task)}</div>` : ''}`;

        Demos.mountAll(container);
        Tips.bindActions(container, render);
        container.querySelector('.restart').addEventListener('click', options.onDone.restart);
        container.querySelector('.review').addEventListener('click', options.onDone.goReview);
        container.querySelector('.progress').addEventListener('click', options.onDone.goProgress);
      }
    }
  }

  return { start, resume, shuffle };
})();
