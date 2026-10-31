// 企画書：書き方ガイド・サンプル・自分の企画ノートを企画書の形で見る

const PitchDoc = (() => {
  const guide = (window.GDS_DATA && window.GDS_DATA.pitchguide) || { sections: [], tips: [], samples: [] };

  function text(value) {
    return Ruby.escape(value || '').replace(/\n/g, '<br>');
  }

  // doc を企画書の形に並べる。points があれば注釈として出す。
  // emptyHtml(section) は、空いている項目に出すもの（なければ、空いている項目は出さない）
  function renderDoc(doc, points, emptyHtml) {
    const sections = guide.sections.map((s) => {
      const filled = (doc[s.key] || '').trim();
      if (!filled && !emptyHtml) return '';
      return `
        <section class="doc-section${filled ? '' : ' empty'}">
          <h3>${Ruby.render(s.title)}</h3>
          ${filled ? `<p>${text(doc[s.key])}</p>` : emptyHtml(s)}
          ${points && points[s.key] ? `<p class="doc-point">ポイント：${Ruby.render(points[s.key])}</p>` : ''}
        </section>`;
    }).join('');
    return `
      <article class="doc">
        <p class="doc-kicker">企画書</p>
        <h2 class="doc-title">${Ruby.escape(doc.title || '名前のない企画')}</h2>
        ${sections}
      </article>`;
  }

  // ----- 企画書の書き方（ガイド・サンプル・練習） -----
  function showGuide(app) {
    const project = Store.activeProject();
    const rows = guide.sections.map((s) => `
      <tr>
        <td><strong>${Ruby.render(s.title)}</strong></td>
        <td>${Ruby.render(s.what)}${s.drill ? `<br><a class="field-link" href="#verbal/${s.drill}">練習する →</a>` : ''}</td>
      </tr>`).join('');

    app.innerHTML = `
      <h2><ruby>企画書<rt>きかくしょ</rt></ruby>の書き方</h2>
      <p class="lead">企画書は、まだない作品を、読む人に思い描いてもらうための書類です。下の型に沿って、少しずつ埋めていきましょう。全部埋めなくても大丈夫です。</p>

      <div class="card">
        <h3>書き方のコツ</h3>
        <ul class="points">${guide.tips.map((t) => `<li>${Ruby.render(t)}</li>`).join('')}</ul>
        ${UI.renderSources(guide.tipSources)}
      </div>

      <div class="card">
        <h3>企画書の項目</h3>
        <p class="note">項目の名前は、企画ノートの欄とそろえてあります。企画ノートに書いたものは、そのまま企画書の形で見られます。</p>
        <table>${rows}</table>
      </div>

      <div class="card">
        <h3>サンプル</h3>
        ${guide.samples.map((sample) => `
          <details class="sample">
            <summary>${Ruby.escape(sample.name)}</summary>
            <p class="note">${Ruby.render(sample.intro)}</p>
            ${renderDoc(sample.doc, sample.points, null)}
          </details>`).join('')}
      </div>

      <div class="card">
        <h3>練習</h3>
        <div class="ex-list">
          ${['w013', 'w014', 'w015', 'w016', 'w017'].map((id) => {
            const item = (window.GDS_DATA.verbal.items || []).find((x) => x.id === id);
            return item ? `<a class="ex-row" href="#verbal/${id}"><span class="ex-title">${Ruby.render(item.title)}</span></a>` : '';
          }).join('')}
        </div>
      </div>

      <div class="card">
        <h3>自分の企画を、企画書の形で見る</h3>
        ${project
          ? `<p>企画ノート「${Ruby.escape(project.title || '名前のない企画')}」を、企画書の形に並べます。</p>
             <div class="btn-row"><a class="btn" href="#doc/${project.id}">企画書の形で見る</a></div>`
          : '<p class="note">まだ企画ノートがありません。<a href="#project">企画ノート</a>で企画を作ると、ここから企画書の形で見られます。</p>'}
      </div>`;
  }

  // ----- 自分の企画ノートを、企画書の形で見る -----
  function showProjectDoc(app, id) {
    const project = Store.loadList('projects').find((p) => p.id === id);
    if (!project) {
      showGuide(app);
      return;
    }
    const empty = (s) => `
      <p class="note">まだ書いていません。
        <a href="#project/${project.id}">企画ノートで書く</a>${s.drill ? `　／　<a href="#verbal/${s.drill}">練習する</a>` : ''}
      </p>`;
    const filledCount = guide.sections.filter((s) => (project[s.key] || '').trim()).length;

    app.innerHTML = `
      <p class="no-print"><a class="back" href="#project/${project.id}">← 企画ノートへ</a>　<a class="back" href="#kikaku">企画書の書き方</a></p>
      <p class="note no-print">埋まっている項目：${filledCount} / ${guide.sections.length}。印刷やPDFにする時は、下のボタンを押してください（スマホでは、共有メニューからPDFにできます）。</p>
      <div class="btn-row no-print"><button class="btn secondary" id="print" type="button">印刷・PDFにする</button></div>
      ${renderDoc(project, null, empty)}`;
    app.querySelector('#print').addEventListener('click', () => window.print());
  }

  return { showGuide, showProjectDoc };
})();
