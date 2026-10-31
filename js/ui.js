// 画面の部品で、いくつかの機能が共通で使うもの

const UI = (() => {
  const STATUS_CLASS = { '確認済み': 'verified', '未確認': 'unverified', '出典なし': 'none' };

  // 出典のリスト
  function renderSources(sources) {
    if (!sources || !sources.length) return '';
    const items = sources.map((s) => {
      const link = s.url
        ? ` <a href="${Ruby.escape(s.url)}" target="_blank" rel="noopener">${Ruby.escape(s.url)}</a>`
        : '';
      const cls = STATUS_CLASS[s.status] || 'none';
      return `<li>${Ruby.render(s.text)}${link}<span class="status ${cls}">${Ruby.escape(s.status || '')}</span></li>`;
    });
    return `<h4>出典</h4><ul class="sources">${items.join('')}</ul>`;
  }

  return { renderSources };
})();
