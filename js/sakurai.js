// 桜井政博さんの動画ガイド
// 動画は YouTube で見ます。「YouTubeで探す」は、チャンネル名とタイトルで YouTube を検索します。

const SakuraiGuide = (() => {
  const data = (window.GDS_DATA && window.GDS_DATA.sakurai) || { items: [] };
  const items = data.items;
  const CHANNEL = '桜井政博のゲーム作るには';

  function searchUrl(title) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${CHANNEL} ${title}`)}`;
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${y}年${m}月${d}日`;
  }

  function countDone() {
    return items.filter((item) => Store.isWatched(item.id)).length;
  }

  function row(item) {
    const watched = Store.isWatched(item.id);
    return `
      <div class="video">
        <div class="tip-head">
          <strong>${Ruby.escape(item.title)}</strong>
          <span class="tag">${Ruby.escape(item.cat)}</span>
        </div>
        <p class="note">${formatDate(item.date)}</p>
        <p>${Ruby.render(item.note)}</p>
        <div class="btn-row">
          <a class="btn small secondary" href="${searchUrl(item.title)}" target="_blank" rel="noopener">YouTubeで探す</a>
          ${item.quiz ? `<a class="btn small secondary" href="#glossary/${item.quiz}">学ぶカードを読む</a>` : ''}
          <button class="chip${watched ? ' on' : ''}" type="button" data-video="${item.id}">${watched ? '✓ 見た' : '見た'}</button>
        </div>
      </div>`;
  }

  function show(app) {
    const themes = [...new Set(items.map((item) => item.theme))];
    app.innerHTML = `
      <h2><ruby>桜井<rt>さくらい</rt></ruby>さんの<ruby>動画<rt>どうが</rt></ruby>ガイド</h2>
      <p class="lead">YouTube「${CHANNEL}」から、ゲーム設計とモーションに近い動画を選んで、テーマごとに並べました。1本は数分です。見たら「見た」を押して、関係する学ぶカードで復習しましょう。</p>
      <p class="note">見た ${countDone()} / ${items.length}</p>
      ${themes.map((theme) => `
        <div class="card">
          <h3>${Ruby.escape(theme)}</h3>
          ${items.filter((item) => item.theme === theme).map(row).join('')}
        </div>`).join('')}
      <p class="note">タイトル・公開日・カテゴリは、<a href="${Ruby.escape(data.sourceUrl)}" target="_blank" rel="noopener">TheTVDB のエピソード一覧</a>で確かめました。ひとことメモは、一覧の説明文をもとに自分の言葉でまとめたもので、動画の細かな内容は確かめていません。</p>`;

    app.querySelectorAll('[data-video]').forEach((button) => {
      button.addEventListener('click', () => {
        Store.toggleWatched(button.dataset.video);
        const y = window.scrollY;
        show(app);
        window.scrollTo(0, y);
      });
    });
  }

  return { items, show, countDone };
})();
