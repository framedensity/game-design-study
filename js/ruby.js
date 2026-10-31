// ふりがなの処理
//
// 教材データでは、次の記法でふりがなを書きます。
//   漢字《かんじ》        … 《 の直前に続く漢字に、ふりがなを付ける
//   ｜釣り合い《つりあい》 … 送りがなを含む言葉や、範囲をはっきりさせたい時は、全角の ｜ で始まりを示す
//   漢字《かんじ？》      … 読みに確信がない言葉は、読みの最後に ？ を付ける（「読み未確認」として表示）

const Ruby = (() => {
  const KANJI = '[\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF々〆ヶ]';
  const PATTERN = new RegExp(`｜([^｜《》]+)《([^》]+)》|(${KANJI}+)《([^》]+)》`, 'g');
  const UNVERIFIED_MARK = /[？?]$/;

  function escape(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 記法つきの文字列を、<ruby> タグ入りの安全なHTMLにする
  function render(text) {
    return escape(text).replace(PATTERN, (match, base1, reading1, base2, reading2) => {
      const base = base1 || base2;
      let reading = reading1 || reading2;
      if (UNVERIFIED_MARK.test(reading)) {
        reading = reading.replace(UNVERIFIED_MARK, '');
        return `<ruby class="unverified" title="読み未確認">${base}<rt>${reading}</rt></ruby>`;
      }
      return `<ruby>${base}<rt>${reading}</rt></ruby>`;
    });
  }

  // ふりがなを外した文字列（検索や title 属性用）
  function plain(text) {
    return String(text).replace(PATTERN, (match, base1, reading1, base2) => base1 || base2);
  }

  // 「読み未確認」の言葉を一覧にする（教材チェック用）
  function findUnverified(text) {
    const found = [];
    String(text).replace(PATTERN, (match, base1, reading1, base2, reading2) => {
      const reading = reading1 || reading2;
      if (UNVERIFIED_MARK.test(reading)) found.push(`${base1 || base2}（${reading}）`);
      return match;
    });
    return found;
  }

  function setVisible(visible) {
    document.documentElement.classList.toggle('ruby-hidden', !visible);
  }

  return { escape, render, plain, findUnverified, setVisible };
})();
