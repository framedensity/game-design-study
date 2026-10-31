// 「書いてから、解説で答え合わせ」をする練習（ルール変更／課題と解決）
//
// まず自分の予想や案を書き、そのあとで解説を見ます。
// 書いた内容は、入力するたびに自動で保存されます。途中でやめても、次に開いた時に残っています。

const Exercise = (() => {
  const SAVE_DELAY_MS = 400;

  function status(item) {
    const record = Store.getExercise(item.id);
    if (record.revealedAt) return { label: '答え合わせ済み', cls: 'verified' };
    if (record.answer && record.answer.trim()) return { label: '書きかけ', cls: 'unverified' };
    return { label: 'まだ', cls: 'none' };
  }

  function countDone(items) {
    return items.filter((item) => Store.getExercise(item.id).revealedAt).length;
  }

  // 入力が止まってから少し待って保存する。入力欄から離れた時も保存する。
  function autosave(textarea, save, stateEl) {
    let timer;
    const saveNow = () => {
      clearTimeout(timer);
      save(textarea.value);
      if (stateEl) stateEl.textContent = '保存しました';
    };
    textarea.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(saveNow, SAVE_DELAY_MS);
    });
    textarea.addEventListener('blur', saveNow);
  }

  // kind: { route, title, lead, answerLabel, items }
  function showList(app, kind) {
    const rows = kind.items.map((item) => {
      const st = status(item);
      return `
        <a class="ex-row" href="#${kind.route}/${item.id}">
          <span class="tag">${Ruby.render(item.tag)}</span>
          <span class="ex-title">${Ruby.render(item.title)}</span>
          <span class="status ${st.cls}">${st.label}</span>
        </a>`;
    }).join('');

    app.innerHTML = `
      <h2>${kind.title}</h2>
      <p class="lead">${kind.lead}</p>
      <p class="note">答え合わせ済み ${countDone(kind.items)} / ${kind.items.length}</p>
      <div class="ex-list">${rows}</div>`;
  }

  // まだ答え合わせしていない、次の課題
  function nextItem(kind, current) {
    const index = kind.items.indexOf(current);
    const after = kind.items.slice(index + 1).concat(kind.items.slice(0, index));
    return after.find((item) => !Store.getExercise(item.id).revealedAt) || null;
  }

  function showItem(app, kind, item) {
    const record = Store.getExercise(item.id);

    app.innerHTML = `
      <p><a class="back" href="#${kind.route}">← ${kind.title}の一覧へ</a></p>
      <div class="card">
        <span class="tag">${Ruby.render(item.tag)}</span>
        <h2 class="ex-heading">${Ruby.render(item.title)}</h2>
        <h4 class="label">場面</h4>
        <p>${Ruby.render(item.situation)}</p>
        ${item.demo ? Demos.slot(item.demo) : ''}
        <div class="prompt">${Ruby.render(item.prompt)}</div>
        <label class="label" for="answer">${item.answerLabel || kind.answerLabel}</label>
        <textarea id="answer" rows="5" placeholder="短くてもいいので、思いつくことを書いてみましょう">${Ruby.escape(record.answer || '')}</textarea>
        ${item.limit ? '<p class="note counter"></p>' : ''}
        <p class="note save-state">書いた内容は、自動で保存されます。</p>
        <div class="btn-row reveal-row"><button class="btn" id="reveal" type="button">解説を見て、答え合わせ</button></div>
        <div class="reveal-area"></div>
      </div>`;
    Demos.mountAll(app);

    const answer = app.querySelector('#answer');
    const revealButton = app.querySelector('#reveal');
    const updateButton = () => { revealButton.disabled = !answer.value.trim(); };
    updateButton();
    answer.addEventListener('input', updateButton);

    // 文字数の目安がある練習では、文字数を数えて見せる
    const counter = app.querySelector('.counter');
    const updateCounter = () => {
      if (!counter) return;
      const length = [...answer.value.replace(/\s/g, '')].length;
      counter.textContent = `${length}文字（目安：${item.limit}文字まで）`;
      counter.classList.toggle('over', length > item.limit);
    };
    updateCounter();
    answer.addEventListener('input', updateCounter);
    autosave(answer, (value) => Store.saveExercise(item.id, { answer: value }), app.querySelector('.save-state'));

    revealButton.addEventListener('click', () => {
      Store.saveExercise(item.id, { answer: answer.value, revealedAt: Date.now() });
      showReveal();
    });
    if (record.revealedAt) showReveal();

    function showReveal() {
      app.querySelector('.reveal-row').remove();
      const saved = Store.getExercise(item.id);
      const next = nextItem(kind, item);

      const approaches = item.approaches
        ? item.approaches.map((a) => `
            <div class="approach">
              <strong>${Ruby.render(a.title)}</strong>
              <p>${Ruby.render(a.body)}</p>
              <p class="tradeoff">代償：${Ruby.render(a.tradeoff)}</p>
            </div>`).join('')
        : '';
      const points = item.points
        ? `<ul class="points">${item.points.map((p) => `<li>${Ruby.render(p)}</li>`).join('')}</ul>`
        : '';

      app.querySelector('.reveal-area').innerHTML = `
        <div class="feedback">
          <h3>${item.approaches ? '解決の方向の例' : '考え方の例'}</h3>
          ${approaches}
          ${item.approaches && points ? '<h4>まとめ</h4>' : ''}
          ${points}
          ${item.examples ? `<h4>書き方の例</h4><ul class="points examples">${item.examples.map((e) => `<li>${Ruby.render(e)}</li>`).join('')}</ul>` : ''}
          ${item.note ? `<p class="note">${Ruby.render(item.note)}</p>` : ''}
          ${projectButton(item)}
          ${UI.renderSources(item.sources)}
          <label class="label" for="reflection">自分の答えと比べて、気づいたこと（なくてもよい）</label>
          <textarea id="reflection" rows="3">${Ruby.escape(saved.reflection || '')}</textarea>
          <div class="btn-row">
            ${next
              ? `<a class="btn" href="#${kind.route}/${next.id}">次の課題へ</a>`
              : `<a class="btn" href="#${kind.route}">一覧へ戻る</a>`}
          </div>
        </div>`;
      autosave(app.querySelector('#reflection'), (value) => Store.saveExercise(item.id, { reflection: value }));
      bindProjectButton(app, item);
    }
  }

  // 「企画ノートに入れる」ボタン（projectField がある練習だけ）
  function projectButton(item) {
    if (!item.projectField) return '';
    const project = Store.activeProject();
    if (!project) {
      return '<p class="note">企画ノートを作ると、ここから答えを企画に入れられます。<a href="#project">企画ノートへ</a></p>';
    }
    return `
      <div class="btn-row">
        <button class="btn secondary" id="to-project" type="button">
          企画ノート「${Ruby.escape(project.title || '名前のない企画')}」の「${Ruby.escape(Notebooks.fieldLabel(item.projectField))}」に入れる
        </button>
      </div>
      <p class="note project-sent"></p>`;
  }

  function bindProjectButton(app, item) {
    const button = app.querySelector('#to-project');
    if (!button) return;
    button.addEventListener('click', () => {
      const project = Store.activeProject();
      const answer = (app.querySelector('#answer').value || '').trim();
      if (!project || !answer) return;
      const current = (project[item.projectField] || '').trim();
      Store.updateListItem('projects', project.id, {
        [item.projectField]: current ? `${current}\n${answer}` : answer,
      });
      app.querySelector('.project-sent').innerHTML = `入れました。<a href="#project/${project.id}">企画ノートを開く</a>`;
    });
  }

  return { showList, showItem, autosave, countDone };
})();
