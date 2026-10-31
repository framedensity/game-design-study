// クイズの流れ：体験 → 名前 → 応用
//
// 新しい考え方は、説明を読む前に、まず手を動かします。
//   体験チャレンジがある考え方 … チャレンジ（目標をクリア）→ 名前と解説
//   ない考え方               … まず予想（当たらなくてよい）→ 名前と解説
// 学んだ直後には問題を出しません。1日後の復習から「確かめる」問題が出ます。
// 確かめる問題は、元の問題と「応用の問題」（data/apply.js）が、復習のたびに順番に出ます。
//
// 答えるたびに、途中の状態を保存します。ページを閉じても、次に開いた時に続きから始められます。
// TIP_EVERY 個ごとに、「ひとこと」（知識・コツ・やってみよう）をはさみます。

const QuizRunner = (() => {
  const TIP_EVERY = 3;
  const applyData = (window.GDS_DATA && window.GDS_DATA.apply) || {};

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
    session.orders = session.orders || {};

    let index = session.results.length;
    if (index >= session.ids.length) finish();
    else showNext();

    function conceptName(q) {
      return q.concept || q.choices[q.answer];
    }

    function meta(tag, extra = '') {
      return `
        <div class="quiz-meta">
          <span class="tag">${tag}</span>
          <span>${index + 1} / ${session.ids.length}${extra}</span>
        </div>`;
    }

    // 初めての考え方なら「学ぶ」、学んだことがあれば「確かめる」
    function showNext() {
      const q = byId[session.ids[index]];
      const record = Store.loadProgress().answers[q.id];
      if (!record) {
        if (q.challenge && Challenges.byId(q.challenge)) showChallenge(q);
        else showPretest(q);
      } else {
        showTest(q, record);
      }
    }

    function goNext(category) {
      index += 1;
      if (index >= session.ids.length) finish();
      else if (index % TIP_EVERY === 0) showTip(category);
      else showNext();
    }

    // 学んだと記録して、次へ（問題は、日をあけて出る）
    function learned(q) {
      Store.markLearned(q.id);
      session.results.push({ id: q.id, learned: true });
      Store.saveSession(session);
      goNext(q.category);
    }

    // 名前と解説（学ぶ）
    function lessonHtml(q) {
      return `
        <h2 class="concept">${Ruby.render(conceptName(q))}</h2>
        <p>${Ruby.render(q.explanation)}</p>
        ${q.example ? `<h4 class="label">例</h4><p>${Ruby.render(q.example)}</p>` : ''}
        ${q.demo ? `<h4 class="label">動かして確かめる</h4>${Demos.slot(q.demo)}` : ''}
        ${UI.renderSources(q.sources)}
        <p class="note">この考え方は、日をあけてから、別の場面の問題で確かめます。</p>
        <div class="btn-row"><button class="btn" id="learned" type="button">わかった。次へ</button></div>`;
    }

    // ----- 体験：チャレンジ -----
    function showChallenge(q) {
      const def = Challenges.byId(q.challenge);
      container.innerHTML = `
        <div class="card">
          ${meta('まず、やってみる')}
          <h2 class="ex-heading">${Ruby.render(def.title)}</h2>
          <div class="challenge-host"></div>
        </div>`;
      Challenges.mount(container.querySelector('.challenge-host'), q.challenge, () => {
        container.innerHTML = `
          <div class="card lesson">
            ${meta('名前を知る')}
            <p class="note">いま体験したのは……</p>
            ${lessonHtml(q)}
          </div>`;
        Demos.mountAll(container);
        container.querySelector('#learned').addEventListener('click', () => learned(q));
        window.scrollTo(0, 0);
      });
    }

    // ----- 体験：まず予想 -----
    function showPretest(q) {
      const order = shuffle(q.choices.map((_, i) => i));
      container.innerHTML = `
        <div class="card">
          ${meta('まず予想')}
          <p class="note">まだ習っていない考え方です。当たらなくて大丈夫。予想してから読むと、覚えやすくなります。</p>
          <p class="question">${Ruby.render(q.question)}</p>
          <div class="choices">${order.map((i) => `<button class="choice" type="button" data-choice="${i}">${Ruby.render(q.choices[i])}</button>`).join('')}</div>
          <div class="feedback-area"></div>
        </div>`;

      container.querySelectorAll('.choice').forEach((button) => {
        button.addEventListener('click', () => {
          const chosen = Number(button.dataset.choice);
          container.querySelectorAll('.choice').forEach((b) => {
            const i = Number(b.dataset.choice);
            b.disabled = true;
            if (i === q.answer) b.classList.add('correct');
            else if (i === chosen) b.classList.add('wrong');
          });
          container.querySelector('.feedback-area').innerHTML = `
            <div class="feedback">
              <p class="${chosen === q.answer ? 'result-ok' : 'note'}">${chosen === q.answer ? '予想どおり！' : '予想とちがいました。ここから覚えれば大丈夫です。'}</p>
              ${lessonHtml(q)}
            </div>`;
          Demos.mountAll(container);
          container.querySelector('#learned').addEventListener('click', () => learned(q));
        });
      });
    }

    // ----- 応用：確かめる（日をあけた復習） -----
    function showTest(q, record) {
      const variants = [...(applyData[q.id] || []), q];
      const variantIndex = (record.attempts || 0) % variants.length;
      const v = variants[variantIndex];
      const orderKey = `${q.id}#${variantIndex}`;
      if (!session.orders[orderKey]) {
        session.orders[orderKey] = shuffle(v.choices.map((_, i) => i));
        Store.saveSession(session);
      }
      const order = session.orders[orderKey];

      container.innerHTML = `
        <div class="card">
          ${meta(`確かめる・${Ruby.render(q.category)}`, session.mode === 'review' ? '（復習）' : '')}
          <p class="question">${Ruby.render(v.question)}</p>
          <div class="choices">${order.map((i) => `<button class="choice" type="button" data-choice="${i}">${Ruby.render(v.choices[i])}</button>`).join('')}</div>
          <div class="feedback-area"></div>
          <p class="note saved-note">答えるたびに保存されます。いつやめても、次に開いた時に続きから始められます。</p>
        </div>`;

      container.querySelectorAll('.choice').forEach((button) => {
        button.addEventListener('click', () => answer(q, v, Number(button.dataset.choice)));
      });
    }

    function answer(q, v, chosen) {
      const isCorrect = chosen === v.answer;
      session.results.push({ id: q.id, ok: isCorrect });
      Store.saveSession(session);
      const { change, nextInDays } = Store.recordAnswer(q.id, isCorrect);

      container.querySelectorAll('.choice').forEach((button) => {
        const i = Number(button.dataset.choice);
        button.disabled = true;
        if (i === v.answer) button.classList.add('correct');
        else if (i === chosen) button.classList.add('wrong');
      });

      const reviewNote = change === 'added'
        ? '<p class="note">この考え方を、もう一度復習に入れました。</p>'
        : `<p class="note">${change === 'removed' ? '正解したので、復習リストから外しました。' : ''}次は、${nextInDays}日後に出ます。</p>`;
      const isLast = index === session.ids.length - 1;

      container.querySelector('.saved-note').remove();
      container.querySelector('.feedback-area').innerHTML = `
        <div class="feedback">
          <p class="${isCorrect ? 'result-ok' : 'result-ng'}">${isCorrect ? '正解！' : '不正解'}　<span class="note">${Ruby.render(conceptName(q))}</span></p>
          ${reviewNote}
          ${v !== q && v.explanation ? `<p>${Ruby.render(v.explanation)}</p>` : ''}
          <details class="sample"${isCorrect ? '' : ' open'}>
            <summary>この考え方の解説を読む</summary>
            <p>${Ruby.render(q.explanation)}</p>
            ${q.example ? `<h4>例</h4><p>${Ruby.render(q.example)}</p>` : ''}
            ${q.demo ? `<h4>動かして確かめる</h4>${Demos.slot(q.demo)}` : ''}
            ${UI.renderSources(q.sources)}
          </details>
          <div class="btn-row">
            <button class="btn next" type="button">${isLast ? '結果を見る' : '次へ'}</button>
          </div>
        </div>`;
      Demos.mountAll(container);
      container.querySelector('.next').addEventListener('click', () => goNext(q.category));
    }

    // 合間の「ひとこと」
    function showTip(category) {
      const tip = Tips.pick({ category, exclude: session.shownTips });
      if (!tip) {
        showNext();
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
              <span>${index} / ${session.ids.length} 済み</span>
            </div>
            ${Tips.renderCard(tip)}
            <div class="btn-row"><button class="btn next" type="button">次へ</button></div>
          </div>`;
        Demos.mountAll(container);
        Tips.bindActions(container, render);
        container.querySelector('.next').addEventListener('click', showNext);
      }
    }

    function finish() {
      const results = session.results;
      const learnedList = results.filter((r) => r.learned).map((r) => byId[r.id]);
      const tested = results.filter((r) => !r.learned);
      const correct = tested.filter((r) => r.ok).length;
      Store.addSession({ mode: session.mode, total: tested.length, correct, learned: learnedList.length, at: Date.now() });
      Store.clearSession();

      const missed = tested.filter((r) => !r.ok).map((r) => byId[r.id]);
      // 間違えた分野か、今日学んだ分野の「やってみよう」を1つすすめる
      const focus = missed[0] || learnedList[0];
      const task = Tips.pick({ type: 'やってみよう', category: focus ? focus.category : undefined });

      render();
      function render() {
        container.innerHTML = `
          <div class="card">
            <h2>おつかれさまでした</h2>
            ${learnedList.length ? `
              <h3>新しく学んだ考え方（${learnedList.length}）</h3>
              <ul class="missed-list">${learnedList.map((q) => `<li>${Ruby.render(conceptName(q))}</li>`).join('')}</ul>
              <p class="note">明日以降の復習で、別の場面の問題として確かめます。</p>` : ''}
            ${tested.length ? `
              <h3>確かめた問題：${correct} / ${tested.length} 正解</h3>
              ${missed.length ? `<ul class="missed-list">${missed.map((q) => `<li>${Ruby.render(conceptName(q))}</li>`).join('')}</ul><p class="note">間違えた考え方は、また復習に出ます。</p>` : ''}` : ''}
            <div class="btn-row">
              <button class="btn restart" type="button">トップへ</button>
              <button class="btn secondary review" type="button">今日の復習へ</button>
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
