// ゲーム分解の練習
//
// 遊んだゲームを、決まった型に沿って書き出します。
// 新しく書いている途中の内容は「下書き」として自動で保存されます。

const Breakdown = (() => {
  const FIELDS = [
    { key: 'game', label: 'ゲーム名', hint: '分解するゲーム', rows: 1 },
    { key: 'verbs', label: '核《かく》となる遊び（動詞で）', hint: 'プレイヤーが一番多くしている行動。例：走る・跳ぶ・踏む', rows: 2 },
    { key: 'loop', label: 'コアループ', hint: '何をして → 何を得て → 次に何をしたくなる？', rows: 3 },
    { key: 'rules', label: '大事なルール（3つ）', hint: '遊びの形を決めているルールを、3つ', rows: 4 },
    { key: 'aim', label: '体験の狙い', hint: '遊んだ人に、どんな気持ちになってほしい作品だと思う？', rows: 3 },
    { key: 'notes', label: '気づいたこと・自分の企画に使えそうなこと', hint: '', rows: 3 },
  ];

  const SAMPLE = {
    game: 'スーパーマリオブラザーズ',
    verbs: '走る・跳ぶ・踏む',
    loop: 'ステージを進む → 穴や敵を跳び越える・踏む → コインやパワーアップを得る → 少し難しい次のステージへ',
    rules: '・穴に落ちたり、敵に横から触れたりするとミス\n・敵は上から踏むと倒せる\n・キノコで大きくなると、1回当たっても小さくなるだけ',
    aim: '思い通りに跳べる気持ちよさと、少し難しい場面を越えた時の達成感',
    notes: '「踏む」という1つの行動で、攻撃と移動の両方ができる。1つの動詞に、いくつもの役割を持たせると、操作がシンプルなまま遊びが深くなる。',
  };

  function isEmpty(values) {
    return !values || FIELDS.every((f) => !(values[f.key] || '').trim());
  }

  function sampleHtml() {
    const rows = FIELDS.map((f) => `<dt>${Ruby.render(f.label)}</dt><dd>${Ruby.escape(SAMPLE[f.key]).replace(/\n/g, '<br>')}</dd>`).join('');
    return `
      <details class="sample">
        <summary>例を見る（スーパーマリオブラザーズ）</summary>
        <dl>${rows}</dl>
        <p class="note">これは書き方の例として作った分析（考察）で、作り手の公式な説明ではありません。</p>
      </details>`;
  }

  function formatDate(at) {
    return new Date(at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  }

  function showList(app) {
    const draft = Store.loadBreakdownDraft();
    const items = Store.loadBreakdowns();
    const rows = items.map((b) => `
      <a class="ex-row" href="#breakdown/${b.id}">
        <span class="ex-title">${Ruby.escape(b.game || '（名前なし）')}</span>
        <span class="note">${Ruby.escape((b.verbs || '').slice(0, 24))}</span>
        <span class="note">${formatDate(b.updatedAt)}</span>
      </a>`).join('');

    app.innerHTML = `
      <h2>ゲーム<ruby>分解<rt>ぶんかい</rt></ruby></h2>
      <p class="lead">好きなゲームを10分遊んでから、決まった型に沿って書き出します。何度も繰り返すと、ゲームを「作り手の目」で見られるようになります。</p>

      ${isEmpty(draft) ? '' : `
        <div class="card resume">
          <h3>書きかけの分解があります</h3>
          <p>${Ruby.escape(draft.game || '（ゲーム名はまだ）')}</p>
          <div class="btn-row"><a class="btn" href="#breakdown/new">続きを書く</a></div>
        </div>`}

      <div class="card">
        <div class="btn-row" style="margin-top:0">
          <a class="btn${isEmpty(draft) ? '' : ' secondary'}" href="#breakdown/new">${isEmpty(draft) ? '新しく分解する' : '新しく分解する（書きかけを続ける）'}</a>
        </div>
        ${sampleHtml()}
      </div>

      <div class="card">
        <h3>保存した分解（${items.length}件）</h3>
        ${items.length ? `<div class="ex-list">${rows}</div>` : '<p class="note">まだありません。</p>'}
      </div>`;
  }

  // id が 'new' なら新しく書く（下書きに保存）。それ以外は保存済みの分解を直す。
  function showEditor(app, id) {
    const isNew = id === 'new';
    const existing = isNew ? null : Store.loadBreakdowns().find((b) => b.id === id);
    if (!isNew && !existing) {
      showList(app);
      return;
    }
    const values = isNew ? { ...(Store.loadBreakdownDraft() || {}) } : { ...existing };

    const fields = FIELDS.map((f) => `
      <label class="label" for="f-${f.key}">${Ruby.render(f.label)}</label>
      ${f.hint ? `<p class="note hint">${Ruby.render(f.hint)}</p>` : ''}
      ${f.rows === 1
        ? `<input id="f-${f.key}" data-key="${f.key}" type="text" value="${Ruby.escape(values[f.key] || '')}">`
        : `<textarea id="f-${f.key}" data-key="${f.key}" rows="${f.rows}">${Ruby.escape(values[f.key] || '')}</textarea>`}
    `).join('');

    app.innerHTML = `
      <p><a class="back" href="#breakdown">← ゲーム分解の一覧へ</a></p>
      <div class="card">
        <h2>${isNew ? '新しく分解する' : Ruby.escape(existing.game || '分解')}</h2>
        <p class="note">${isNew ? '書いた内容は、下書きとして自動で保存されます。' : '直した内容は、自動で保存されます。'}</p>
        ${fields}
        <div class="btn-row">
          ${isNew ? '<button class="btn" id="save" type="button">保存する</button>' : ''}
          <a class="btn secondary" href="#breakdown">${isNew ? 'あとで続ける' : '一覧へ戻る'}</a>
          ${isNew ? '' : '<button class="btn danger" id="delete" type="button">削除する</button>'}
        </div>
        ${sampleHtml()}
      </div>`;

    app.querySelectorAll('[data-key]').forEach((input) => {
      Exercise.autosave(input, (value) => {
        values[input.dataset.key] = value;
        if (isNew) Store.saveBreakdownDraft(values);
        else Store.updateBreakdown(id, { [input.dataset.key]: value });
      });
    });

    if (isNew) {
      app.querySelector('#save').addEventListener('click', () => {
        app.querySelectorAll('[data-key]').forEach((input) => { values[input.dataset.key] = input.value; });
        if (!values.game || !values.game.trim()) {
          alert('ゲーム名を書いてください。');
          return;
        }
        Store.addBreakdown(values);
        location.hash = '#breakdown';
      });
    } else {
      app.querySelector('#delete').addEventListener('click', () => {
        if (confirm('この分解を削除しますか？')) {
          Store.deleteBreakdown(id);
          location.hash = '#breakdown';
        }
      });
    }
  }

  return { showList, showEditor };
})();
