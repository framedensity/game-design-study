// 体験チャレンジ
//
// 説明を読む前に、まず手を動かして体験します。目標を満たすと「名前を知る」ボタンが押せるようになります。
// 種類（type）ごとの動かし方は、下の TYPES にあります。新しい種類を足す時は、TYPES に関数を1つ足します。

const Challenges = (() => {
  const items = (window.GDS_DATA && window.GDS_DATA.challenges && window.GDS_DATA.challenges.items) || [];
  const { makeCanvas, loop, color } = Demos.helpers;

  function byId(id) {
    return items.find((c) => c.id === id) || null;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // el の中にチャレンジを出す。終わったら onDone() を呼ぶ。
  // options.doneLabel … 終わった後のボタンの文字
  function mount(el, id, onDone, options = {}) {
    const def = byId(id);
    if (!def) {
      onDone();
      return;
    }
    el.innerHTML = `
      <div class="challenge">
        <p class="challenge-goal">目標：${Ruby.render(def.goal)}</p>
        <div class="challenge-body"></div>
        <p class="challenge-status"></p>
        <div class="btn-row">
          <button class="btn" type="button" data-ch="done" disabled>${options.doneLabel || '名前と解説を見る →'}</button>
          <button class="btn secondary small" type="button" data-ch="skip">わからない。先に解説を見る</button>
        </div>
      </div>`;
    const body = el.querySelector('.challenge-body');
    const statusEl = el.querySelector('.challenge-status');
    const doneButton = el.querySelector('[data-ch="done"]');

    const api = {
      status(html) { statusEl.innerHTML = html; },
      complete(html) {
        statusEl.innerHTML = `<span class="result-ok">クリア！</span> ${html || ''}`;
        doneButton.disabled = false;
        el.querySelector('[data-ch="skip"]').remove();
      },
    };
    doneButton.addEventListener('click', onDone);
    el.querySelector('[data-ch="skip"]').addEventListener('click', onDone);
    TYPES[def.type](body, def, api);
  }

  // ===== 並べ替え（タップした順に並ぶ） =====
  function order(body, def, api) {
    let picked = [];
    let pool = null; // 札の並び（最初に1回だけシャッフルして、そのあとは同じ並びを使う）
    render();

    function render() {
      const rest = def.items.filter((t) => !picked.includes(t));
      body.innerHTML = `
        <p class="note">下の札を、順番にタップしてください。並べた札をタップすると、戻せます。</p>
        <ol class="order-picked">${picked.map((t) => `<li><button class="chip on" type="button" data-back="${Ruby.escape(t)}">${Ruby.escape(t)}</button></li>`).join('')}</ol>
        <div class="order-pool">${shuffleOnce(rest).map((t) => `<button class="chip" type="button" data-pick="${Ruby.escape(t)}">${Ruby.escape(t)}</button>`).join('')}</div>
        ${picked.length === def.items.length ? '<div class="btn-row"><button class="btn small" type="button" data-check>確かめる</button></div>' : ''}`;
      body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { picked.push(b.dataset.pick); render(); }));
      body.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { picked = picked.filter((t) => t !== b.dataset.back); render(); }));
      const check = body.querySelector('[data-check]');
      if (check) check.addEventListener('click', judge);
    }

    function shuffleOnce(rest) {
      if (!pool) pool = shuffle(def.items);
      return pool.filter((t) => rest.includes(t));
    }

    function judge() {
      let ok;
      if (def.mustFirst || def.mustLast) {
        const first = (def.mustFirst || []).every((t, i) => picked[i] === t);
        const last = (def.mustLast || []).every((t) => picked.indexOf(t) >= picked.length - def.mustLast.length);
        ok = first && last;
      } else {
        ok = picked.every((t, i) => t === def.items[i]);
      }
      if (ok) api.complete(Ruby.render(def.result || ''));
      else api.status('<span class="result-ng">おしい。</span>どこかの順番がちがいます。並べ直して、もう一度確かめてください。');
    }
  }

  // ===== ヒットストップの押し比べ =====
  function compareHitstop(body, def, api) {
    const heavyIs = Math.random() < 0.5 ? 'A' : 'B';
    body.innerHTML = `
      <div class="ab-wrap">
        <div class="ab-col"><p class="ab-label">A</p><div class="ab-canvas" data-ab="A"></div></div>
        <div class="ab-col"><p class="ab-label">B</p><div class="ab-canvas" data-ab="B"></div></div>
      </div>
      <div class="btn-row">
        <button class="btn secondary small" type="button" data-choose="A">Aの方が重い</button>
        <button class="btn secondary small" type="button" data-choose="B">Bの方が重い</button>
      </div>`;
    ['A', 'B'].forEach((name) => hitLoop(body.querySelector(`[data-ab="${name}"]`), name === heavyIs ? 12 : 0));

    body.querySelectorAll('[data-choose]').forEach((b) => {
      b.addEventListener('click', () => {
        const picked = b.dataset.choose;
        const message = picked === heavyIs
          ? `${heavyIs}は、当たった瞬間に12コマ止めていました。`
          : `じつは${heavyIs}の方が、当たった瞬間に12コマ止めていました。もう一度見比べてみましょう。違いはそこだけです。`;
        api.complete(message);
      });
    });
  }

  // 1つの攻撃を、くり返し見せる小さなアニメーション（stopFrames が止めるコマ数）
  function hitLoop(el, stopFrames) {
    const W = 300, H = 120, GROUND = 100, SIZE = 30;
    const { canvas, ctx } = makeCanvas(el, W, H);
    let s;
    const reset = () => { s = { phase: 'go', t: 0, ax: 20, tx: 170, tv: 0, shake: 0 }; };
    reset();
    loop(canvas, () => {
      s.t += 1;
      if (s.phase === 'go') {
        s.ax += 8;
        if (s.ax + SIZE >= s.tx) { s.ax = s.tx - SIZE; s.phase = stopFrames ? 'stop' : 'fly'; s.t = 0; s.tv = 11; }
      } else if (s.phase === 'stop') {
        s.shake = s.t % 2 ? 3 : -3;
        if (s.t >= stopFrames) { s.phase = 'fly'; s.t = 0; s.shake = 0; }
      } else if (s.phase === 'fly') {
        s.tx += s.tv; s.tv *= 0.9;
        if (s.t > 40) { s.phase = 'wait'; s.t = 0; }
      } else if (s.t > 35) reset();
    }, () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = color('--line');
      ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
      ctx.fillStyle = color('--accent');
      ctx.fillRect(s.ax, GROUND - SIZE, SIZE, SIZE);
      ctx.fillStyle = color('--ng');
      ctx.fillRect(s.tx + s.shake, GROUND - SIZE, SIZE, SIZE);
    });
  }

  // ===== 攻撃のコマ数を、条件に合わせる =====
  function tuneAttack(body, def, api) {
    const demo = document.createElement('div');
    const checklist = document.createElement('ul');
    checklist.className = 'checks';
    body.append(checklist, demo);
    let cleared = false;
    Demos.create('attack', demo, {
      onChange(v) {
        const results = def.checks.map((c) => ({
          ...c,
          ok: (c.max === undefined || v[c.key] <= c.max) && (c.min === undefined || v[c.key] >= c.min),
        }));
        checklist.innerHTML = results.map((r) => `<li class="${r.ok ? 'ok' : ''}">${r.ok ? '✓' : '・'} ${Ruby.render(r.label)}</li>`).join('');
        if (!cleared && results.every((r) => r.ok)) {
          cleared = true;
          api.complete('短いかまえで反応を速く保ちながら、止めと戻りで重さを出せました。');
        }
      },
    });
  }

  // ===== 攻撃判定のコマを選ぶ =====
  function timingHitbox(body, def, api) {
    const W = 520, H = 220, FRAMES = 20;
    const PIVOT = { x: 220, y: 140 }, LENGTH = 110;
    const TARGET = { x: 300, y: 105, w: 34, h: 70 };
    // 振りはじめはゆっくり、だんだん速く（コマごとの角度）
    const angle = (f) => -2.6 + 3.2 * Math.pow(f / FRAMES, 2);
    const tip = (f) => ({ x: PIVOT.x + LENGTH * Math.cos(angle(f)), y: PIVOT.y + LENGTH * Math.sin(angle(f)) });
    const inTarget = (p) => p.x >= TARGET.x && p.x <= TARGET.x + TARGET.w && p.y >= TARGET.y && p.y <= TARGET.y + TARGET.h;
    const hitFrames = [];
    for (let f = 1; f <= FRAMES; f++) if (inTarget(tip(f))) hitFrames.push(f);

    const holder = document.createElement('div');
    body.append(holder);
    const { canvas, ctx } = makeCanvas(holder, W, H);
    body.insertAdjacentHTML('beforeend', `
      <label class="slider"><span>判定を出すコマ：<b data-out>4</b> / ${FRAMES}</span>
        <input type="range" min="1" max="${FRAMES}" value="4"></label>
      <p class="note" data-result></p>`);
    const input = body.querySelector('input');
    const out = body.querySelector('[data-out]');
    const resultEl = body.querySelector('[data-result]');
    let chosen = 4;
    let frame = 0, tick = 0, cleared = false;

    const judge = () => {
      const hit = hitFrames.includes(chosen);
      resultEl.textContent = hit ? '刃が相手に届いた瞬間に、当たりが出ています。' : (chosen < hitFrames[0] ? '刃が届く前に、当たりが出ています（「当たっていないのに」と感じる）。' : '刃が通り過ぎた後に、当たりが出ています（「当たったのに」と感じる）。');
      if (hit && !cleared) {
        cleared = true;
        api.complete('見た目の動きと、ゲームとしての当たりが一致しました。');
      }
    };
    input.addEventListener('input', () => { chosen = Number(input.value); out.textContent = chosen; judge(); });
    judge();

    loop(canvas, () => {
      tick += 1;
      if (tick % 3) return; // 見やすいように、ゆっくり動かす
      frame = frame >= FRAMES + 8 ? 0 : frame + 1;
    }, () => {
      const f = Math.min(frame, FRAMES);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color('--ng');
      ctx.globalAlpha = 0.85;
      ctx.fillRect(TARGET.x, TARGET.y, TARGET.w, TARGET.h);
      ctx.globalAlpha = 1;
      // 剣の通り道
      ctx.strokeStyle = color('--line');
      ctx.beginPath();
      for (let g = 0; g <= FRAMES; g++) { const p = tip(g); if (g === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
      ctx.stroke();
      // 剣
      const p = tip(f);
      ctx.strokeStyle = color('--accent');
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(PIVOT.x, PIVOT.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = color('--accent');
      ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 10, 0, Math.PI * 2); ctx.fill();
      // 選んだコマで出る当たり
      if (f === chosen) {
        ctx.strokeStyle = color('--warn');
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      }
      ctx.fillStyle = color('--mute');
      ctx.font = '13px "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillText(`コマ ${f} / ${FRAMES}`, 12, 20);
    });
  }

  // ===== 短い構えと、長い構えをよける =====
  function dodge(body, def, api) {
    const demo = document.createElement('div');
    const progress = document.createElement('p');
    progress.className = 'note';
    body.append(progress, demo);
    let cleared = false;
    const show = (stats) => {
      const a = (stats[6] && stats[6].total) || 0;
      const b = (stats[40] && stats[40].total) || 0;
      progress.textContent = `構え6コマ：${Math.min(a, 3)} / 3回　構え40コマ：${Math.min(b, 3)} / 3回`;
      if (!cleared && a >= 3 && b >= 3) {
        cleared = true;
        const ok6 = stats[6].ok, ok40 = stats[40].ok;
        api.complete(`よけた数　構え6コマ：${ok6} / ${a}　構え40コマ：${ok40} / ${b}`);
      }
    };
    show({});
    Demos.create('anticipation', demo, { onStat: (windup, stats) => show(stats) });
  }

  // ===== サイコロの押し引き =====
  function dice(body, def, api) {
    const ROUNDS = 5;
    let round = 1, total = 0, pot = 0, face = '–', last = '';
    render();

    function render() {
      body.innerHTML = `
        <div class="dice-row">
          <div class="dice-face">${face}</div>
          <div>
            <p>${round <= ROUNDS ? `${round} / ${ROUNDS} 回目` : '終わり'}　この回の点：<b>${pot}</b></p>
            <p>合計：<b>${total}</b> 点</p>
            <p class="note">${last}</p>
          </div>
        </div>
        ${round <= ROUNDS ? `
          <div class="btn-row">
            <button class="btn small" type="button" data-roll>振る</button>
            <button class="btn secondary small" type="button" data-stop ${pot ? '' : 'disabled'}>止めて、点を確定</button>
          </div>` : ''}`;
      const roll = body.querySelector('[data-roll]');
      if (roll) roll.addEventListener('click', onRoll);
      const stop = body.querySelector('[data-stop]');
      if (stop) stop.addEventListener('click', onStop);
    }

    function onRoll() {
      const n = 1 + Math.floor(Math.random() * 6);
      face = n;
      if (n === 1) {
        last = '1が出た！ この回の点は0になりました。';
        pot = 0;
        nextRound();
      } else {
        pot += n;
        last = `${n}が出た。もっと振る？ それとも止める？`;
        render();
      }
    }

    function onStop() {
      total += pot;
      last = `${pot}点を確定しました。`;
      pot = 0;
      nextRound();
    }

    function nextRound() {
      round += 1;
      render();
      if (round > ROUNDS) api.complete(`合計 ${total} 点。毎回「もう1回振るか、止めるか」を考えましたね。`);
    }
  }

  // ===== 難しさの上げ方（フロー） =====
  function flowSet(body, def, api) {
    const W = 520, H = 260, L = 50, R = 500, T = 16, B = 230, BAND = 0.15;
    const SKILL = [0.2, 0.4, 0.6, 0.8];
    const values = [0.3, 0.3, 0.3, 0.3];
    const holder = document.createElement('div');
    body.append(holder);
    const { canvas, ctx } = makeCanvas(holder, W, H);
    body.insertAdjacentHTML('beforeend', `<div class="demo-controls">${SKILL.map((s, i) => `
      <label class="slider"><span>ステージ${i + 1}の難しさ</span><input type="range" min="0" max="100" value="30" data-stage="${i}"></label>`).join('')}</div>`);
    let cleared = false;

    const x = (s) => L + (R - L) * s;
    const y = (c) => B - (B - T) * c;
    const zone = (s, c) => (c - s > BAND ? '不安' : s - c > BAND ? '退屈' : 'ちょうどよい');

    function check() {
      const zones = SKILL.map((s, i) => zone(s, values[i]));
      api.status(zones.map((z, i) => `ステージ${i + 1}：${z}`).join('　'));
      if (!cleared && zones.every((z) => z === 'ちょうどよい')) {
        cleared = true;
        api.complete('腕前が上がるのに合わせて、難しさも上げられました。');
      }
    }
    body.querySelectorAll('[data-stage]').forEach((input) => {
      input.addEventListener('input', () => { values[Number(input.dataset.stage)] = Number(input.value) / 100; check(); });
    });
    check();

    loop(canvas, () => {}, () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color('--ok-bg');
      ctx.beginPath();
      ctx.moveTo(x(0), y(BAND)); ctx.lineTo(x(1 - BAND), y(1)); ctx.lineTo(x(1), y(1));
      ctx.lineTo(x(1), y(1 - BAND)); ctx.lineTo(x(BAND), y(0)); ctx.lineTo(x(0), y(0));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = color('--line');
      ctx.strokeRect(L, T, R - L, B - T);
      ctx.font = '12px "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillStyle = color('--mute');
      ctx.fillText('腕前 →', R - 46, B + 18);
      ctx.fillText('↑ 難しさ', 4, T + 10);
      ctx.fillStyle = color('--ng'); ctx.fillText('不安', L + 8, T + 16);
      ctx.fillStyle = color('--accent'); ctx.fillText('退屈', R - 34, B - 8);
      SKILL.forEach((s, i) => {
        const ok = zone(s, values[i]) === 'ちょうどよい';
        ctx.fillStyle = color(ok ? '--ok' : '--warn');
        ctx.beginPath(); ctx.arc(x(s), y(values[i]), 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color('--ink');
        ctx.fillText(String(i + 1), x(s) - 3, y(values[i]) - 12);
      });
    });
  }

  // ===== レース（追い上げあり・なし） =====
  function race(body, def, api) {
    const NAMES = ['上手', 'ふつう', '初心者A', '初心者B'];
    const SKILL = [1.0, 0.92, 0.85, 0.78];
    // 助けあり：先頭以外の人が、ときどき加速する（後ろの人ほど起きやすい）。
    // 数字はシミュレーションで決めた。助けなしでは「上手」が約9割勝ち、助けありでは勝つ人がばらける。
    const BURST_CHANCE = 0.03; // 順位が1つ下がるごとに、この確率が足される（1コマごと）
    const BURST = 6;
    const wins = { off: [0, 0, 0, 0], on: [0, 0, 0, 0] };
    const runs = { off: 0, on: 0 };
    let mode = 'off';
    let running = false;
    let cleared = false;

    body.innerHTML = `
      <div class="demo-controls">
        <button class="chip on" type="button" data-mode="off">助けなし</button>
        <button class="chip" type="button" data-mode="on">助けあり（後ろの人ほど、加速が出やすい）</button>
        <button class="btn small" type="button" data-run>レース！</button>
      </div>
      <div class="race">${NAMES.map((n, i) => `<div class="race-lane"><span class="race-name">${n}</span><div class="race-track"><div class="race-car" data-car="${i}"></div></div></div>`).join('')}</div>
      <table class="race-table"></table>`;
    const table = body.querySelector('.race-table');
    const cars = [...body.querySelectorAll('[data-car]')];

    function showTable() {
      table.innerHTML = `<tr><th></th>${NAMES.map((n) => `<th>${n}</th>`).join('')}</tr>
        <tr><td>助けなし（${runs.off}回）</td>${wins.off.map((w) => `<td>${w}勝</td>`).join('')}</tr>
        <tr><td>助けあり（${runs.on}回）</td>${wins.on.map((w) => `<td>${w}勝</td>`).join('')}</tr>`;
    }
    showTable();

    body.querySelectorAll('[data-mode]').forEach((b) => {
      b.addEventListener('click', () => {
        if (running) return;
        mode = b.dataset.mode;
        body.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b));
      });
    });

    body.querySelector('[data-run]').addEventListener('click', () => {
      if (running) return;
      running = true;
      const pos = [0, 0, 0, 0];
      const GOAL = 100;
      // 決まった間隔（約60回/秒）で進める。画面から消えたら止める。
      const timer = setInterval(() => stepRace(), 16);
      const stepRace = () => {
        if (!body.isConnected) {
          clearInterval(timer);
          return;
        }
        const ranking = [0, 1, 2, 3].sort((a, b) => pos[b] - pos[a]);
        for (let i = 0; i < 4; i++) {
          const rank = ranking.indexOf(i); // 0 が先頭
          pos[i] += SKILL[i] * 0.7 + Math.random() * 1.2;
          const burst = mode === 'on' && rank > 0 && Math.random() < BURST_CHANCE * rank;
          if (burst) pos[i] += BURST;
          cars[i].classList.toggle('boost', burst);
          cars[i].style.width = `${Math.min(100, pos[i])}%`;
        }
        const winner = pos.findIndex((p) => p >= GOAL);
        if (winner >= 0) {
          clearInterval(timer);
          wins[mode][winner] += 1;
          runs[mode] += 1;
          running = false;
          showTable();
          if (!cleared && runs.off >= 3 && runs.on >= 3) {
            cleared = true;
            api.complete('助けなしでは上手な人が勝ちやすく、助けありでは勝つ人がばらけやすくなりました。');
          }
        }
      };
      cars.forEach((c) => { c.style.width = '0%'; });
    });
  }

  // ===== ボタンの押し比べ（フィードバック） =====
  function feedbackPress(body, def, api) {
    const demo = document.createElement('div');
    body.append(demo);
    let cleared = false;
    Demos.create('uifeedback', demo, {
      onPress(kind, counts) {
        if (!cleared && counts.plain >= 3 && counts.rich >= 3) {
          cleared = true;
          api.complete('同じ「押す」でも、反応の有無で、押した手応えがまったく違います。');
        }
      },
    });
  }

  // ===== どの壁が登れそう？（アフォーダンス） =====
  function affordance(body, def, api) {
    const WALLS = [
      { id: 'plain', name: 'つるつるの壁', svg: '<rect x="5" y="5" width="90" height="140" rx="4" class="wall"/>' },
      { id: 'ledge', name: '出っぱりのある壁', svg: '<rect x="5" y="5" width="90" height="140" rx="4" class="wall"/>' + [30, 60, 90, 120].map((yy, i) => `<rect x="${i % 2 ? 40 : 15}" y="${yy}" width="45" height="7" rx="2" class="ledge"/>`).join('') },
      { id: 'crack', name: 'ひびの入った壁', svg: '<rect x="5" y="5" width="90" height="140" rx="4" class="wall"/><path d="M50 20 L40 50 L58 70 L44 100 L60 130" class="crack"/><path d="M58 70 L78 80" class="crack"/>' },
    ];
    const QUESTIONS = [
      { ask: '登れそうな壁は？', answer: 'ledge', why: '出っぱりは「つかめそう」「足をかけられそう」と、見ただけで伝えます。' },
      { ask: '壊せそうな壁は？', answer: 'crack', why: 'ひびは「ここは弱い」「壊れそう」と、説明なしに伝えます。' },
    ];
    const order = shuffle(WALLS);
    let step = 0;
    const notes = [];
    render();

    function render() {
      const q = QUESTIONS[step];
      body.innerHTML = `
        ${q ? `<p><b>${q.ask}</b>　タップしてください。</p>` : ''}
        <div class="walls">${order.map((w) => `
          <button class="wall-btn" type="button" data-wall="${w.id}" ${q ? '' : 'disabled'}>
            <svg viewBox="0 0 100 150" aria-label="${w.name}">${w.svg}</svg>
          </button>`).join('')}</div>
        ${notes.map((n) => `<p class="note">${n}</p>`).join('')}`;
      body.querySelectorAll('[data-wall]').forEach((b) => b.addEventListener('click', () => choose(b.dataset.wall)));
    }

    function choose(id) {
      const q = QUESTIONS[step];
      const name = WALLS.find((w) => w.id === q.answer).name;
      notes.push(`${q.ask} → ${id === q.answer ? '正解！' : `答えは「${name}」。`}${q.why}`);
      step += 1;
      render();
      if (step >= QUESTIONS.length) api.complete('どちらも、文字の説明なしに、形だけで使い方が伝わっていました。');
    }
  }

  const TYPES = {
    order,
    'compare-hitstop': compareHitstop,
    'tune-attack': tuneAttack,
    'timing-hitbox': timingHitbox,
    dodge,
    dice,
    'flow-set': flowSet,
    race,
    'feedback-press': feedbackPress,
    affordance,
  };

  // ===== 「体験チャレンジ」の一覧と、1つを遊ぶ画面（いつでも、くり返し遊べる） =====
  function showList(app, questions) {
    const byQuiz = (id) => questions.find((q) => q.id === id);
    app.innerHTML = `
      <h2><ruby>体験<rt>たいけん</rt></ruby>チャレンジ</h2>
      <p class="lead">手を動かして、体で確かめる課題です。新しい考え方を学ぶ時にも出てきますが、ここからは何度でも遊べます。</p>
      <div class="ex-list">${items.map((c) => {
        const q = byQuiz(c.quiz);
        return `<a class="ex-row" href="#lab/${c.id}"><span class="ex-title">${Ruby.render(c.title)}</span>${q ? `<span class="tag">${Ruby.render(q.concept || '')}</span>` : ''}</a>`;
      }).join('')}</div>`;
  }

  function showOne(app, id, questions) {
    const def = byId(id);
    if (!def) {
      showList(app, questions);
      return;
    }
    const q = questions.find((x) => x.id === def.quiz);
    app.innerHTML = `
      <p><a class="back" href="#lab">← 体験チャレンジの一覧へ</a></p>
      <div class="card">
        <span class="tag">体験</span>
        <h2 class="ex-heading">${Ruby.render(def.title)}</h2>
        <div class="challenge-host"></div>
        <div class="lab-after"></div>
      </div>`;
    mount(app.querySelector('.challenge-host'), id, () => {
      app.querySelector('.lab-after').innerHTML = q
        ? `<p>いま体験したのは「<b>${Ruby.render(q.concept || q.choices[q.answer])}</b>」です。</p>
           <div class="btn-row"><a class="btn" href="#glossary/${q.id}">解説を読む</a><a class="btn secondary" href="#lab">ほかのチャレンジ</a></div>`
        : '';
    }, { doneLabel: 'これは何という考え方？ →' });
  }

  return { items, byId, mount, showList, showOne };
})();
