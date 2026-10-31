// 「練習」と「読む・見る」のまとめページ

const Hubs = (() => {
  function card(href, title, desc) {
    return `<a class="mode" href="${href}"><strong>${title}</strong><span>${desc}</span></a>`;
  }

  // kinds: { verbal, rules, problems }（それぞれ Exercise の種類）
  function showPractice(app, kinds) {
    const progress = Store.loadProgress();
    app.innerHTML = `
      <h2><ruby>練習<rt>れんしゅう</rt></ruby></h2>
      <p class="lead">手を動かして、書いて、確かめる練習です。どれも途中でやめても、自動で保存されます。</p>
      <div class="modes">
        ${card('#verbal', '<ruby>言語化<rt>げんごか</rt></ruby>', `考えを短く、伝わる言葉にする（${Exercise.countDone(kinds.verbal.items)} / ${kinds.verbal.items.length}）`)}
        ${card('#breakdown', 'ゲーム<ruby>分解<rt>ぶんかい</rt></ruby>', `遊んだゲームを、型に沿って書き出す（${progress.breakdowns.length}件）`)}
        ${card('#rules', 'ルール<ruby>変更<rt>へんこう</rt></ruby>', `ルールを1つ変えたら？を予想する（${Exercise.countDone(kinds.rules.items)} / ${kinds.rules.items.length}）`)}
        ${card('#problems', '<ruby>課題<rt>かだい</rt></ruby>と<ruby>解決<rt>かいけつ</rt></ruby>', `プレイヤーの困りごとを解く（${Exercise.countDone(kinds.problems.items)} / ${kinds.problems.items.length}）`)}
        ${card('#playtest', '<ruby>試遊<rt>しゆう</rt></ruby>ログ', `自分の試作を遊んだ記録（${progress.playtests.length}件）`)}
      </div>`;
  }

  function showRead(app, questionCount) {
    app.innerHTML = `
      <h2>読む・見る</h2>
      <p class="lead">考え方を、自分のペースで読んだり見たりする場所です。</p>
      <div class="modes">
        ${card('#glossary', '<ruby>用語集<rt>ようごしゅう</rt></ruby>', `クイズで出てくる考え方を、分野ごとに読む（${questionCount}）`)}
        ${card('#sakurai', '<ruby>桜井<rt>さくらい</rt></ruby>さんの<ruby>動画<rt>どうが</rt></ruby>ガイド', `モーション・UI・ゲーム性の動画を、テーマ別に見る（${SakuraiGuide.countDone()} / ${SakuraiGuide.items.length}）`)}
        ${card('#library', '<ruby>資料<rt>しりょう</rt></ruby>', `日本の作り手の本・講演・インタビュー（${Library.countDone()} / ${Library.items.length}）`)}
      </div>`;
  }

  return { showPractice, showRead };
})();
