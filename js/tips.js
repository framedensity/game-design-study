// 「ひとこと」（知識・コツ・やってみよう）の表示

const Tips = (() => {
  const items = (window.GDS_DATA && window.GDS_DATA.tips && window.GDS_DATA.tips.items) || [];
  const TYPE_CLASS = { '知識': 'knowledge', 'コツ': 'trick', 'やってみよう': 'handson' };

  function byId(id) {
    return items.find((t) => t.id === id) || null;
  }

  // 条件に合うものから1つ選ぶ。同じ分野のものがあれば、それを優先する。
  function pick({ category, type, exclude = [] } = {}) {
    let pool = items.filter((t) => !exclude.includes(t.id) && (!type || t.type === type));
    const sameCategory = category ? pool.filter((t) => t.category === category) : [];
    if (sameCategory.length) pool = sameCategory;
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderCard(tip) {
    const cls = TYPE_CLASS[tip.type] || 'knowledge';
    let actions = '';
    if (tip.type === 'やってみよう') {
      actions = Store.isHandsOnDone(tip.id)
        ? '<p class="note">✓ やりました</p>'
        : `<div class="btn-row">
             <button class="btn small" type="button" data-tip-action="done" data-tip="${tip.id}">やった！</button>
             ${Store.isLater(tip.id)
               ? '<span class="note">「あとでやる」に入っています</span>'
               : `<button class="btn secondary small" type="button" data-tip-action="later" data-tip="${tip.id}">あとでやる</button>`}
           </div>`;
    }
    return `
      <div class="tip ${cls}">
        <div class="tip-head"><span class="tip-type">${Ruby.escape(tip.type)}</span><strong>${Ruby.render(tip.title)}</strong></div>
        <p>${Ruby.render(tip.body)}</p>
        ${tip.demo ? Demos.slot(tip.demo) : ''}
        ${UI.renderSources(tip.sources)}
        ${actions}
      </div>`;
  }

  // 「やった！」「あとでやる」ボタンを動かす。押した後は onChange で表示を描き直す。
  function bindActions(root, onChange) {
    root.querySelectorAll('[data-tip-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.tip;
        if (button.dataset.tipAction === 'done') Store.markHandsOnDone(id);
        else Store.addLater(id);
        onChange();
      });
    });
  }

  return { items, byId, pick, renderCard, bindActions };
})();
