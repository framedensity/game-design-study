// 用語集：クイズで扱う概念を、分野ごとに読めるページ
// 本を読んでいなくても、ここで先に学べます。

const Glossary = (() => {
  // openId を渡すと、その用語を開いて、そこまでスクロールする（例：#glossary/s002）
  function show(app, questions, openId) {
    const categories = [...new Set(questions.map((q) => q.category))];
    const answers = Store.loadProgress().answers;

    app.innerHTML = `
      <h2><ruby>用語集<rt>ようごしゅう</rt></ruby></h2>
      <p class="lead">クイズで出てくる考え方を、分野ごとにまとめています。気になるものを開いて読んでみましょう。本を読んでいなくても大丈夫です。</p>
      ${categories.map((c) => `
        <div class="card">
          <h3>${Ruby.render(c)}</h3>
          ${questions.filter((q) => q.category === c).map((q) => `
            <details class="term" data-id="${q.id}">
              <summary>${Ruby.render(q.concept || q.choices[q.answer])}${answers[q.id] ? '<span class="status verified">クイズ済み</span>' : ''}</summary>
              <p>${Ruby.render(q.explanation)}</p>
              ${q.example ? `<h4 class="label">例</h4><p>${Ruby.render(q.example)}</p>` : ''}
              ${q.demo ? Demos.slot(q.demo).replace('data-demo', 'data-demo-later') : ''}
              ${UI.renderSources(q.sources)}
            </details>`).join('')}
        </div>`).join('')}`;

    // 動く図解は、開いた時に初めて動かす（全部を一度に動かさない）
    app.querySelectorAll('details.term').forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        d.querySelectorAll('[data-demo-later]').forEach((el) => {
          el.setAttribute('data-demo', el.getAttribute('data-demo-later'));
          el.removeAttribute('data-demo-later');
        });
        Demos.mountAll(d);
      });
    });

    const target = openId && app.querySelector(`details.term[data-id="${openId}"]`);
    if (target) {
      target.open = true;
      setTimeout(() => target.scrollIntoView({ block: 'start' }), 0);
    }
  }

  return { show };
})();
