// 学習資料リスト

const Library = (() => {
  const items = (window.GDS_DATA && window.GDS_DATA.library && window.GDS_DATA.library.items) || [];

  function countDone() {
    return items.filter((item) => Store.isLibraryDone(item.id)).length;
  }

  function card(item) {
    const done = Store.isLibraryDone(item.id);
    return `
      <div class="lib-item">
        <div class="tip-head">
          <span class="tip-type">${Ruby.escape(item.type)}</span>
          <strong>${Ruby.render(item.title)}</strong>
        </div>
        <p class="note">${Ruby.render(item.by)}　／　${Ruby.escape(item.lang)}</p>
        <p>${Ruby.render(item.about)}</p>
        <p class="sources-line">
          <a href="${Ruby.escape(item.url)}" target="_blank" rel="noopener">${Ruby.escape(item.url)}</a>
          <span class="status ${item.status === '確認済み' ? 'verified' : 'unverified'}">${Ruby.escape(item.status)}</span>
        </p>
        <button class="chip${done ? ' on' : ''}" type="button" data-lib="${item.id}">${done ? '✓ 読んだ・見た' : '読んだ・見た'}</button>
      </div>`;
  }

  function show(app) {
    const groups = [...new Set(items.map((item) => item.group))];
    app.innerHTML = `
      <h2><ruby>資料<rt>しりょう</rt></ruby></h2>
      <p class="lead">書誌や公開を確かめられたものだけを載せています。読んだり見たりしたら、1つだけでも、自分の企画に使ってみましょう。</p>
      <p class="note">読んだ・見た ${countDone()} / ${items.length}</p>
      ${groups.map((group) => `
        <div class="card">
          <h3>${Ruby.escape(group)}</h3>
          ${items.filter((item) => item.group === group).map(card).join('')}
        </div>`).join('')}`;

    app.querySelectorAll('[data-lib]').forEach((button) => {
      button.addEventListener('click', () => {
        Store.toggleLibraryDone(button.dataset.lib);
        const y = window.scrollY;
        show(app);
        window.scrollTo(0, y);
      });
    });
  }

  return { items, show, countDone };
})();
