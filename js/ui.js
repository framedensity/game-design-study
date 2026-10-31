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

  // 学習の記録を、ファイルに書き出す（バックアップ）。書き出した日時を覚えておく。
  function exportProgress() {
    const blob = new Blob([Store.exportJson()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `game-design-study-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    Store.saveSettings({ ...Store.loadSettings(), lastExportAt: Date.now() });
  }

  return { renderSources, exportProgress };
})();
