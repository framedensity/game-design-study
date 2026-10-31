// 動く図解
//
// 考え方を、目で見て・触って確かめるための小さなデモです（ゲームの試作ではありません）。
// 教材データで "demo": "hitstop" のように名前を書くと、その問題やひとことの中に表示されます。
// 新しいデモを足す時は、下に関数を書いて registry に名前を登録します。

const Demos = (() => {
  const FRAME_MS = 1000 / 60;

  // ----- 共通の道具 -----

  function slot(name) {
    return registry[name] ? `<div class="demo" data-demo="${name}"></div>` : '';
  }

  // 画面の中のデモ置き場をすべて動かす
  function mountAll(root) {
    root.querySelectorAll('[data-demo]').forEach((el) => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';
      registry[el.dataset.demo](el);
    });
  }

  // CSSの色の変数を読む（ダークモードにも合う）
  function color(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
  }

  function makeCanvas(el, width, height) {
    const canvas = document.createElement('canvas');
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.aspectRatio = `${width} / ${height}`;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    el.appendChild(canvas);
    return { canvas, ctx };
  }

  function addControls(el, html) {
    const div = document.createElement('div');
    div.className = 'demo-controls';
    div.innerHTML = html;
    el.appendChild(div);
    return div;
  }

  // 1秒60コマの決まった歩幅で動かす。canvas が画面から消えたら止まる。
  function loop(canvas, step, draw) {
    let last = performance.now();
    let acc = 0;
    function tick(now) {
      if (!canvas.isConnected) return;
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= FRAME_MS) {
        step();
        acc -= FRAME_MS;
      }
      draw();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function chips(values, format) {
    return values.map((v) => `<button class="chip" type="button" data-value="${v}">${format(v)}</button>`).join('');
  }

  function selectChip(ui, value) {
    ui.querySelectorAll('.chip[data-value]').forEach((b) => b.classList.toggle('on', b.dataset.value === String(value)));
  }

  // ----- ヒットストップ -----
  // 当たった瞬間に止めるコマ数を変えて、手応えの違いを見比べる
  function hitstop(el) {
    el.insertAdjacentHTML('beforeend', '<p class="demo-title">ヒットストップ：止めるコマ数を変えて、見比べてみよう</p>');
    const W = 640, H = 170, GROUND = 140, SIZE = 36;
    const { canvas, ctx } = makeCanvas(el, W, H);
    const ui = addControls(el, `${chips([0, 4, 8, 14], (n) => `${n}コマ`)}
      <button class="chip slow" type="button">スロー</button><span class="demo-label"></span>`);
    const label = ui.querySelector('.demo-label');

    let stopFrames = 8;
    let slow = false;
    let tickCount = 0;
    let s;

    function reset() {
      s = { phase: 'approach', t: 0, ax: 60, tx: 380, tv: 0, shake: 0 };
    }

    ui.querySelectorAll('.chip[data-value]').forEach((b) => {
      b.addEventListener('click', () => {
        stopFrames = Number(b.dataset.value);
        selectChip(ui, stopFrames);
        label.textContent = stopFrames ? `当たった時に 約${(stopFrames / 60).toFixed(2)}秒 止まる` : '止めない';
        reset();
      });
    });
    ui.querySelector('.slow').addEventListener('click', (e) => {
      slow = !slow;
      e.currentTarget.classList.toggle('on', slow);
    });

    function step() {
      tickCount += 1;
      if (slow && tickCount % 4) return; // スローの時は4分の1の速さ
      s.t += 1;
      if (s.phase === 'approach') {
        s.ax += 9;
        if (s.ax + SIZE >= s.tx) {
          s.ax = s.tx - SIZE;
          s.phase = stopFrames ? 'stop' : 'knock';
          s.t = 0;
          s.tv = 14;
        }
      } else if (s.phase === 'stop') {
        s.shake = s.t % 2 ? 3 : -3;
        if (s.t >= stopFrames) { s.phase = 'knock'; s.t = 0; s.shake = 0; }
      } else if (s.phase === 'knock') {
        s.tx += s.tv;
        s.tv *= 0.9;
        if (s.t > 45) { s.phase = 'wait'; s.t = 0; }
      } else if (s.phase === 'wait' && s.t > 40) {
        reset();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = color('--line');
      ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
      ctx.fillStyle = color('--accent');
      ctx.fillRect(s.ax, GROUND - SIZE, SIZE, SIZE);
      ctx.fillStyle = color('--ng');
      ctx.fillRect(s.tx + s.shake, GROUND - SIZE, SIZE, SIZE);
      if (s.phase === 'stop') {
        ctx.strokeStyle = color('--warn');
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(s.tx, GROUND - SIZE / 2, 26, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    reset();
    ui.querySelector('.chip[data-value="8"]').click();
    loop(canvas, step, draw);
  }

  // ----- 予備動作 -----
  // 敵の予備動作の長さを変えて、よけやすさ（難しさ）がどう変わるかを体で確かめる
  function anticipation(el) {
    el.insertAdjacentHTML('beforeend',
      '<p class="demo-title">予備動作：敵が構えている間に「よける」を押そう。構えの長さを変えると？</p>');
    const W = 640, H = 170, GROUND = 140, SIZE = 36;
    const PLAYER_X = 150, ENEMY_X = 430;
    const { canvas, ctx } = makeCanvas(el, W, H);
    const ui = addControls(el, `${chips([6, 12, 24, 40], (n) => `構え ${n}コマ`)}
      <button class="btn small dodge" type="button">よける！（スペース）</button><span class="demo-label"></span>`);
    const label = ui.querySelector('.demo-label');

    let windup = 24;
    const stats = {}; // 構えのコマ数ごとの成績 { ok, total }
    let s;

    function reset() {
      s = { phase: 'idle', t: 0, ex: ENEMY_X, pressed: false, dodge: 0, message: '' };
    }

    function stat() {
      if (!stats[windup]) stats[windup] = { ok: 0, total: 0 };
      return stats[windup];
    }

    function showStat() {
      const st = stat();
      label.textContent = `${s.message ? s.message + '　' : ''}よけた ${st.ok} / ${st.total}`;
    }

    function press() {
      if (s.phase === 'windup' && !s.pressed) {
        s.pressed = true;
        s.dodge = 24;
        s.message = 'よけた！';
        stat().ok += 1;
      } else if (s.phase === 'idle') {
        s.message = '早すぎ';
      } else if (!s.pressed) {
        s.message = 'おそい…';
      }
      showStat();
    }

    ui.querySelectorAll('.chip').forEach((b) => {
      b.addEventListener('click', () => {
        windup = Number(b.dataset.value);
        selectChip(ui, windup);
        reset();
        showStat();
      });
    });
    ui.querySelector('.dodge').addEventListener('click', press);
    canvas.addEventListener('pointerdown', press);
    el.tabIndex = 0;
    el.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); press(); }
    });

    function step() {
      s.t += 1;
      if (s.dodge > 0) s.dodge -= 1;
      if (s.phase === 'idle' && s.t > 50) {
        s.phase = 'windup'; s.t = 0; s.pressed = false; s.message = '';
      } else if (s.phase === 'windup') {
        s.ex = ENEMY_X + (s.t / windup) * 24; // 後ろに引いて構える
        if (s.t >= windup) { s.phase = 'strike'; s.t = 0; }
      } else if (s.phase === 'strike') {
        s.ex -= 34;
        if (s.ex <= PLAYER_X + SIZE) {
          s.ex = PLAYER_X + SIZE;
          stat().total += 1;
          if (!s.pressed) s.message = '当たった';
          showStat();
          s.phase = 'recover'; s.t = 0;
        }
      } else if (s.phase === 'recover') {
        s.ex += (ENEMY_X - s.ex) * 0.12;
        if (s.t > 40) { s.phase = 'idle'; s.t = 0; s.ex = ENEMY_X; }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = color('--line');
      ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

      // プレイヤー（よけている間は跳ぶ）
      const jump = s.dodge > 0 ? Math.sin((s.dodge / 24) * Math.PI) * 60 : 0;
      ctx.fillStyle = color('--accent');
      ctx.fillRect(PLAYER_X, GROUND - SIZE - jump, SIZE, SIZE);

      // 敵（構えている間は光る）
      ctx.fillStyle = color('--ng');
      ctx.fillRect(s.ex, GROUND - SIZE, SIZE, SIZE);
      if (s.phase === 'windup') {
        ctx.strokeStyle = color('--warn');
        ctx.lineWidth = 3;
        ctx.strokeRect(s.ex - 4, GROUND - SIZE - 4, SIZE + 8, SIZE + 8);
        ctx.lineWidth = 1;
      }
    }

    reset();
    selectChip(ui, windup);
    showStat();
    loop(canvas, step, draw);
  }

  // ----- フロー -----
  // 挑戦の難しさと腕前の関係を図で見る。難しさの上げ方で、プレイヤーの気持ちがどこを通るか。
  function flow(el) {
    el.insertAdjacentHTML('beforeend', '<p class="demo-title">フロー：難しさの上げ方で、プレイヤーの気持ちはどこを通る？</p>');
    const W = 640, H = 320;
    const L = 56, R = 620, T = 20, B = 280;
    const BAND = 0.15;
    const { canvas, ctx } = makeCanvas(el, W, H);
    const patterns = {
      good: { name: 'ちょうどよく上げる', challenge: (skill, p) => skill + 0.08 * Math.sin(p * Math.PI * 6) },
      flat: { name: '上げない', challenge: () => 0.22 },
      spike: { name: '急に上げる', challenge: (skill, p) => (p < 0.15 ? skill : 0.88) },
    };
    const ui = addControls(el, `${Object.keys(patterns).map((k) =>
      `<button class="chip" type="button" data-value="${k}">${patterns[k].name}</button>`).join('')}<span class="demo-label"></span>`);
    const label = ui.querySelector('.demo-label');

    let pattern = 'good';
    let p = 0; // 0 → 1 で、遊びはじめから終わりまで

    ui.querySelectorAll('.chip').forEach((b) => {
      b.addEventListener('click', () => {
        pattern = b.dataset.value;
        selectChip(ui, pattern);
        p = 0;
      });
    });

    const x = (skill) => L + (R - L) * skill;
    const y = (challenge) => B - (B - T) * Math.max(0, Math.min(1, challenge));
    const skillAt = (q) => 0.08 + 0.84 * q;
    const zone = (skill, challenge) => (challenge - skill > BAND ? '不安' : skill - challenge > BAND ? '退屈' : 'フロー');

    function step() {
      p += 1 / 360; // 約6秒で一巡
      if (p > 1.25) p = 0; // 終わりで少し止まってから、もう一度
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '13px "Hiragino Sans", "Yu Gothic", sans-serif';

      // フローの帯
      ctx.fillStyle = color('--ok-bg');
      ctx.beginPath();
      ctx.moveTo(x(0), y(BAND));
      ctx.lineTo(x(1 - BAND), y(1));
      ctx.lineTo(x(1), y(1));
      ctx.lineTo(x(1), y(1 - BAND));
      ctx.lineTo(x(BAND), y(0));
      ctx.lineTo(x(0), y(0));
      ctx.closePath();
      ctx.fill();

      // 軸
      ctx.strokeStyle = color('--line');
      ctx.strokeRect(L, T, R - L, B - T);
      ctx.fillStyle = color('--mute');
      ctx.fillText('腕前 →', R - 54, B + 22);
      ctx.save(); ctx.translate(L - 16, T + 70); ctx.rotate(-Math.PI / 2); ctx.fillText('挑戦の難しさ →', 0, 0); ctx.restore();
      ctx.fillStyle = color('--ng'); ctx.fillText('不安（難しすぎる）', L + 14, T + 22);
      ctx.fillStyle = color('--accent'); ctx.fillText('退屈（簡単すぎる）', R - 140, B - 14);
      ctx.fillStyle = color('--ok'); ctx.fillText('フロー', x(0.5) + 10, y(0.5) + 4);

      // 通った道
      const pat = patterns[pattern];
      const end = Math.min(p, 1);
      ctx.strokeStyle = color('--ink');
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let q = 0; q <= end; q += 0.005) {
        const sk = skillAt(q);
        const px = x(sk), py = y(pat.challenge(sk, q));
        if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // 今の場所
      const sk = skillAt(end);
      const ch = pat.challenge(sk, end);
      ctx.fillStyle = color('--warn');
      ctx.beginPath(); ctx.arc(x(sk), y(ch), 7, 0, Math.PI * 2); ctx.fill();
      label.textContent = `今の気持ち：${zone(sk, ch)}`;
    }

    selectChip(ui, pattern);
    loop(canvas, step, draw);
  }

  const registry = { hitstop, anticipation, flow };

  return { slot, mountAll };
})();
