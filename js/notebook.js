// 書きためるノートの共通のしくみ（企画ノート・試遊ログ）
//
// 一覧と、1つを書く画面を作ります。書いた内容は、入力するたびに自動で保存されます。
// 使い方は js/notebooks.js を見てください。

const Notebook = (() => {
  // config:
  //   key       … 保存先（Store の 'projects' や 'playtests'）
  //   route     … 画面の名前（#project、#project/<ID>）
  //   title, lead, newLabel … 見出し・説明・「新しく作る」ボタンの文字
  //   fields    … [{ key, label, hint, rows, link, linkLabel, options }]
  //               rows が 1 なら1行の入力。options は候補の一覧を返す関数（なくてもよい）
  //   listTitle(item), listSub(item) … 一覧に出す文字
  //   extraTop() … 一覧の上に足すHTML（なくてもよい）
  //   bindExtra(app) … extraTop のボタンを動かす（なくてもよい）
  //   editorExtra(item) … 書く画面の下のボタンに足すHTML（なくてもよい）
  function create(config) {
    function formatDate(at) {
      return new Date(at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    }

    function showList(app) {
      const items = Store.loadList(config.key);
      const rows = items.map((item) => `
        <a class="ex-row" href="#${config.route}/${item.id}">
          <span class="ex-title">${Ruby.escape(config.listTitle(item))}</span>
          <span class="note">${Ruby.escape(config.listSub(item).slice(0, 30))}</span>
          <span class="note">${formatDate(item.updatedAt)}</span>
        </a>`).join('');

      app.innerHTML = `
        <h2>${config.title}</h2>
        <p class="lead">${config.lead}</p>
        <div class="card">
          <div class="btn-row" style="margin-top:0">
            <button class="btn" id="nb-new" type="button">＋ ${config.newLabel}</button>
            ${config.extraTop ? config.extraTop() : ''}
          </div>
        </div>
        <div class="card">
          <h3>これまでの記録（${items.length}）</h3>
          ${items.length ? `<div class="ex-list">${rows}</div>` : '<p class="note">まだありません。</p>'}
        </div>`;

      app.querySelector('#nb-new').addEventListener('click', () => {
        const id = Store.addListItem(config.key, {});
        location.hash = `#${config.route}/${id}`;
      });
      if (config.bindExtra) config.bindExtra(app);
    }

    function fieldHtml(field, value) {
      const id = `nb-${field.key}`;
      const options = field.options ? field.options() : [];
      const datalist = options.length
        ? `<datalist id="${id}-list">${options.map((o) => `<option value="${Ruby.escape(o)}"></option>`).join('')}</datalist>`
        : '';
      const input = field.rows === 1
        ? `<input id="${id}" data-key="${field.key}" type="text" value="${Ruby.escape(value || '')}"${datalist ? ` list="${id}-list"` : ''}>${datalist}`
        : `<textarea id="${id}" data-key="${field.key}" rows="${field.rows}">${Ruby.escape(value || '')}</textarea>`;
      return `
        <div class="nb-field">
          <div class="nb-label-row">
            <label class="label" for="${id}">${Ruby.render(field.label)}</label>
            ${field.link ? `<a class="field-link" href="${field.link}">${Ruby.render(field.linkLabel || '学ぶカード')} →</a>` : ''}
          </div>
          ${field.hint ? `<p class="note hint">${Ruby.render(field.hint)}</p>` : ''}
          ${input}
        </div>`;
    }

    function showEditor(app, id) {
      const item = Store.loadList(config.key).find((x) => x.id === id);
      if (!item) {
        showList(app);
        return;
      }
      // 開いた企画を「最後に開いた企画」にする
      if (config.key === 'projects') Store.updateListItem(config.key, id, {});

      app.innerHTML = `
        <p><a class="back" href="#${config.route}">← ${config.title}の一覧へ</a></p>
        <div class="card">
          <h2>${Ruby.escape(config.listTitle(item))}</h2>
          <p class="note">書いた内容は、自動で保存されます。</p>
          ${config.fields.map((field) => fieldHtml(field, item[field.key])).join('')}
          <div class="btn-row">
            ${config.editorExtra ? config.editorExtra(item) : ''}
            <a class="btn secondary" href="#${config.route}">一覧へ戻る</a>
            <button class="btn danger" id="nb-delete" type="button">削除する</button>
          </div>
        </div>`;

      app.querySelectorAll('[data-key]').forEach((input) => {
        Exercise.autosave(input, (value) => Store.updateListItem(config.key, id, { [input.dataset.key]: value }));
      });
      app.querySelector('#nb-delete').addEventListener('click', () => {
        if (confirm('削除しますか？')) {
          Store.deleteListItem(config.key, id);
          location.hash = `#${config.route}`;
        }
      });
    }

    return { showList, showEditor };
  }

  return { create };
})();
