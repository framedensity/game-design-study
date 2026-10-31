// 学習資料リスト
//
// 書誌や公開を確かめられたものだけを載せます。確かめられていないことは、about や note に「未確認」と書きます。
//
// 1つの形:
//   id     … 重ならない番号（例: "L001"）。「読んだ・見た」の記録はこのIDで保存されるので、後から変えない
//   group  … 「日本の作り手」か「海外の作り手・研究」
//   type   … 本／動画／講演／論文／インタビュー
//   title  … 題名
//   by     … 著者・話し手、出版社、年
//   about  … どんなことが学べるか（自分の言葉で）
//   lang   … 言語
//   url    … 確かめたページ
//   status … 「確認済み」「未確認」

window.GDS_DATA = window.GDS_DATA || {};
window.GDS_DATA.library = {
  "version": 1,
  "items": [
    {
      "id": "L001", "group": "日本の作り手", "type": "本", "lang": "日本語",
      "title": "「ついやってしまう」体験のつくりかた　人を動かす「直感・驚き・物語」のしくみ",
      "by": "玉樹真一郎《たまきしんいちろう》、ダイヤモンド社、2019年",
      "about": "元任天堂のWiiの企画担当者が、人が思わず行動してしまう体験のしくみを、「直感」「驚き」「物語」の3つから解説した本です。",
      "url": "https://www.diamond.co.jp/book/9784478106167.html", "status": "確認済み"
    },
    {
      "id": "L002", "group": "日本の作り手", "type": "本", "lang": "日本語",
      "title": "岩田さん　岩田聡《いわたさとる》はこんなことを話していた。",
      "by": "ほぼ日、2019年",
      "about": "任天堂の元社長・岩田聡さんの言葉を、インタビューや「社長が訊く」などから集めて、1冊にまとめた本です。宮本茂《みやもとしげる》さんへのインタビューも入っています。",
      "url": "https://www.gamebusiness.jp/article/2019/07/01/15915.html", "status": "確認済み"
    },
    {
      "id": "L003", "group": "日本の作り手", "type": "動画", "lang": "日本語（英語版のチャンネルもあり）",
      "title": "YouTube「桜井政博《さくらいまさひろ》のゲーム作るには」",
      "by": "桜井政博、2022年〜2024年",
      "about": "『星のカービィ』『大乱闘スマッシュブラザーズ』の桜井政博さんが、ゲーム作りの考え方を、短い動画で話したチャンネルです。「リスクとリターン」「ヒットストップ」など、テーマごとに見られます。",
      "url": "https://automaton-media.com/articles/newsjp/20220824-216055/", "status": "確認済み"
    },
    {
      "id": "L004", "group": "日本の作り手", "type": "本", "lang": "日本語",
      "title": "桜井政博のゲームについて思うこと（シリーズ）",
      "by": "桜井政博、KADOKAWA",
      "about": "桜井政博さんが、ゲームについての考えをまとめた本のシリーズです。（リンクは2巻のページです。各巻の内容は未確認）",
      "url": "https://www.kadokawa.co.jp/product/200700003178/", "status": "確認済み"
    },
    {
      "id": "L005", "group": "日本の作り手", "type": "インタビュー", "lang": "日本語",
      "title": "社長が訊く（任天堂 公式サイト）",
      "by": "聞き手：岩田聡、任天堂",
      "about": "岩田聡さんが聞き手になり、任天堂の作品の開発者に、作り方や考え方を聞いた公式インタビューのシリーズです。（リンクは『スーパーマリオ』25周年の回の1ページです）",
      "url": "https://www.nintendo.co.jp/n10/interview/mario25th/vol1/index2.html", "status": "確認済み"
    },
    {
      "id": "L006", "group": "日本の作り手", "type": "講演", "lang": "日本語（報道記事）",
      "title": "CEDEC 2012 基調講演「あなたはなぜゲームを作るのか」",
      "by": "桜井政博、2012年",
      "about": "桜井政博さんが、ゲーム作りの基本としてリスクとリターンを軸に語った講演の報道記事です。",
      "url": "https://www.gamer.ne.jp/news/201208210004/", "status": "確認済み"
    },
    {
      "id": "L007", "group": "日本の作り手", "type": "講演", "lang": "英語（報道記事）",
      "title": "Change and Constant – Breaking Conventions with The Legend of Zelda: Breath of the Wild（GDC 2017）",
      "by": "藤林秀麿《ふじばやしひでまろ》ほか、任天堂、2017年",
      "about": "『ゼルダの伝説 ブレス オブ ザ ワイルド』の開発者が、「あたりまえ」を見直した作り方や、物理・化学のルールの仕組み、簡単な試作について話した講演の報道記事です。",
      "url": "https://nintendowire.com/news/2017/03/01/breath-wild-presentation-gdc-showcases-development-ideology-weird-early-concepts/", "status": "確認済み"
    },
    {
      "id": "L008", "group": "海外の作り手・研究", "type": "本", "lang": "日本語訳",
      "title": "フロー体験　喜びの現象学",
      "by": "M.チクセントミハイ著、今村浩明《いまむらひろあき？》訳、世界思想社、1996年",
      "about": "挑戦と腕前が釣り合った時の、時間を忘れるほど没頭《ぼっとう》した状態（フロー）について書いた、心理学の本です。",
      "url": "https://shopping.bookoff.co.jp/new/0012376089", "status": "確認済み"
    },
    {
      "id": "L009", "group": "海外の作り手・研究", "type": "本", "lang": "日本語訳",
      "title": "誰のためのデザイン？　増補・改訂版",
      "by": "D.A.ノーマン著、岡本明《おかもとあきら？》ほか訳、新曜社、2015年",
      "about": "物の形や見た目が、使い方をどう伝えるかを解説した、デザインの本です。アフォーダンスの考え方を学べます。",
      "url": "https://ndlsearch.ndl.go.jp/books/R100000002-I033080608", "status": "確認済み"
    },
    {
      "id": "L010", "group": "海外の作り手・研究", "type": "論文", "lang": "英語",
      "title": "MDA: A Formal Approach to Game Design and Game Research",
      "by": "Hunicke, LeBlanc, Zubek、2004年",
      "about": "ゲームを、仕組み・動き・体験の3つの層で見る考え方（MDA）の論文です。短く、無料で読めます。",
      "url": "https://users.cs.northwestern.edu/~hunicke/MDA.pdf", "status": "確認済み"
    },
    {
      "id": "L011", "group": "海外の作り手・研究", "type": "論文", "lang": "英語",
      "title": "Hearts, Clubs, Diamonds, Spades: Players Who Suit MUDs",
      "by": "Richard Bartle、1996年",
      "about": "オンラインゲームのプレイヤーの楽しみ方を、4つのタイプに分けた論文です。無料で読めます。",
      "url": "https://mud.co.uk/richard/hcds.htm", "status": "確認済み"
    },
    {
      "id": "L012", "group": "海外の作り手・研究", "type": "本", "lang": "英語（日本語版の有無は未確認）",
      "title": "Game Feel: A Game Designer's Guide to Virtual Sensation",
      "by": "Steve Swink、2008年",
      "about": "操作した時の手触りや気持ちよさ（ゲームフィール）を、詳しく分析した本です。モーションを作る人に近いテーマです。",
      "url": "https://shop.elsevier.com/books/game-feel/swink/978-0-12-374328-2", "status": "確認済み"
    },
    {
      "id": "L013", "group": "海外の作り手・研究", "type": "講演", "lang": "英語",
      "title": "Interesting Decisions（GDC 2012）",
      "by": "Sid Meier、2012年",
      "about": "プレイヤーの選択を、どうすれば面白くできるかを話した講演です。",
      "url": "https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay", "status": "確認済み"
    }
  ]
};
