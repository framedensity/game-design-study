// 企画ノートと試遊ログの設定
// 欄を足したい時は、FIELDS に1行足すだけで画面に出ます。

const Notebooks = (() => {
  // 自分の企画ノートの欄。link は、その欄に関係する学ぶカードや練習。
  const PROJECT_FIELDS = [
    { key: 'title', label: '企画名', rows: 1 },
    { key: 'concept', label: '一言コンセプト', hint: 'どんなゲームかを、一文で。', rows: 2, link: '#verbal/w001', linkLabel: '言語化：一文で' },
    { key: 'pitch', label: '30秒ピッチ', hint: '誰に・何をする・なぜ面白い。', rows: 4, link: '#verbal/w005', linkLabel: '言語化：30秒で話す' },
    { key: 'analogy', label: 'たとえると', hint: '知っているゲームや遊びで、たとえると？ そして、どこが違う？', rows: 2, link: '#verbal/w010', linkLabel: '言語化：たとえる' },
    { key: 'target', label: '誰に遊んでほしい？', rows: 2 },
    { key: 'pillars', label: 'デザインの柱（3つ）', hint: '迷った時に立ち返る、大切にすること。体験の言葉で。', rows: 4, link: '#glossary/q019' },
    { key: 'verbs', label: '核《かく》となる遊び（動詞）', hint: 'プレイヤーが一番多くする行動。', rows: 2, link: '#glossary/q001' },
    { key: 'loop', label: 'コアループ', hint: '何をして → 何を得て → 次に何をしたくなる？', rows: 3, link: '#glossary/q002' },
    { key: 'risk', label: 'リスクとリターン', hint: 'プレイヤーは、どんな危険を冒《おか》して、何を得る？', rows: 3, link: '#glossary/q009' },
    { key: 'firstMinute', label: '最初の1分', hint: 'どうやって引き込み、どうやって遊び方を教える？', rows: 3, link: '#glossary/s008' },
    { key: 'feel', label: '手触り（気持ちいい瞬間）', hint: '一番気持ちいい瞬間と、それを作る工夫（止め・揺れ・音・動き）。', rows: 3, link: '#glossary/s001' },
    { key: 'ui', label: '画面・UI', hint: '何を、どこに、どれくらい目立たせて見せる？', rows: 3, link: '#glossary/u002' },
    { key: 'open', label: '決めていないこと・悩み', rows: 3, link: '#problems', linkLabel: '課題と解決' },
  ];

  // 前に一緒に考えた「十二支」の企画から始めるための下書き
  const ZODIAC = {
    title: '十二支ラッシュ（仮）',
    concept: '自分の干支と向き合う旅。選んだ道が、最後の相手を決める。',
    analogy: 'タイプ相性のあるボスラッシュ。ただし、戦うたびに、相手の強さを自分で選ぶ。',
    target: '小学校高学年から大人まで。絵のタッチで、さらに広げる。誰にでも干支があるので、家族で遊ぶきっかけにもなる。',
    pillars: '・選んだ道が、最後の戦いに返ってくる\n・生まれ年から始まる、自分だけの物語\n・毎回ちがう組み合わせ',
    verbs: '選ぶ・戦う・探す',
    loop: '迷路の街を探索する → 3つの扉（EASY／MID／HARD）から選ぶ → 干支のボスと戦い、能力を得る → 次の干支へ（最後は自分の干支）',
    risk: 'EASY：楽に勝てるが育ちにくく、最後が手強い。HARD：厳しいが育ちが早い。MID：その間。扉ごとに手に入る能力も違う。',
    open: '・1月・2月生まれの扱い（暦年か旧正月か、選べるようにする案）\n・能力は、戦いの前に見えるようにするか',
  };

  const PLAYTEST_FIELDS = [
    { key: 'project', label: 'どの試作？', rows: 1, options: () => Store.loadList('projects').map((p) => p.title).filter(Boolean) },
    { key: 'changed', label: '変えたこと（1つだけ）', hint: 'ルールを変える時は、1度に1つだけ。', rows: 2 },
    { key: 'predicted', label: '遊ぶ前の予想', hint: '変えたことで、遊びはどうなると思った？', rows: 3 },
    { key: 'happened', label: '実際に起きたこと', hint: '遊んだ人が迷った所・笑った所・手が止まった所。口は出さずに見る。', rows: 4 },
    { key: 'next', label: '次に試すこと', rows: 2 },
  ];

  const projects = Notebook.create({
    key: 'projects',
    route: 'project',
    title: '企画ノート',
    lead: '自分の企画を、学んだことを使って育てるノートです。言語化の練習の答えも、ここに入れられます。各欄の「→」から、関係する学ぶカードや練習に飛べます。',
    newLabel: '新しい企画',
    fields: PROJECT_FIELDS,
    listTitle: (p) => p.title || '名前のない企画',
    listSub: (p) => p.concept || '',
    extraTop: () => '<button class="btn secondary" id="from-zodiac" type="button">十二支の企画から始める</button><a class="btn secondary" href="#kikaku">企画書の書き方</a>',
    editorExtra: (item) => `<a class="btn" href="#doc/${item.id}">企画書の形で見る</a>`,
    bindExtra: (app) => {
      app.querySelector('#from-zodiac').addEventListener('click', () => {
        const id = Store.addListItem('projects', ZODIAC);
        location.hash = `#project/${id}`;
      });
    },
  });

  const playtests = Notebook.create({
    key: 'playtests',
    route: 'playtest',
    title: '試遊ログ',
    lead: '自分で作った試作を遊んだ（遊んでもらった）時の記録です。「変えたこと → 予想 → 実際」を書きためると、自分の予想のくせが見えてきます。',
    newLabel: '新しい記録',
    fields: PLAYTEST_FIELDS,
    listTitle: (t) => t.changed || '（変えたこと：未記入）',
    listSub: (t) => t.project || '',
  });

  function fieldLabel(key) {
    const field = PROJECT_FIELDS.find((f) => f.key === key);
    return field ? Ruby.plain(field.label) : key;
  }

  return { projects, playtests, fieldLabel };
})();
