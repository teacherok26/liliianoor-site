// Alif Ba: letter cards, finger tracing and a find-the-letter game.
// Data comes from the #ab-data JSON block. Progress is saved in this browser only.
(function () {
  const root = document.getElementById("ab-app");
  if (!root) return;
  const D = JSON.parse(document.getElementById("ab-data").textContent);
  const LETTERS = D.letters, FRIENDS = D.friends, KEY = "qa-alif-ba";
  const TATWEEL = "ـ";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let progress = { traced: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.traced)) progress = s; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) {} };
  const isDone = n => progress.traced.includes(n);

  let current = 1;
  try { const h = parseInt((location.hash.match(/^#letter-(\d+)$/) || [])[1], 10); if (h >= 1 && h <= 28) current = h; } catch (e) {}

  // Letter forms, written with the tatweel so the joins are visible.
  function forms(l) {
    if (!l.join) return [["Alone", l.ch], ["Start", l.ch], ["Middle", TATWEEL + l.ch], ["End", TATWEEL + l.ch]];
    return [["Alone", l.ch], ["Start", l.ch + TATWEEL], ["Middle", TATWEEL + l.ch + TATWEEL], ["End", TATWEEL + l.ch]];
  }

  function playLetter(n) {
    if (!D.audio) return;
    try { new Audio(`/audio/letters/${String(n).padStart(2, "0")}.mp3`).play().catch(() => {}); } catch (e) {}
  }

  /* ---------- Grid ---------- */
  function renderGrid() {
    document.getElementById("ab-grid").innerHTML = LETTERS.map(l => `
      <button type="button" class="ab-tile${l.n === current ? " sel" : ""}${isDone(l.n) ? " done" : ""}" data-n="${l.n}"
        aria-label="${esc(l.name)}${isDone(l.n) ? ", traced" : ""}" aria-pressed="${l.n === current}">
        <span class="ab-ch" lang="ar">${l.ch}</span><span class="ab-nm">${esc(l.name)}</span>
        ${isDone(l.n) ? '<svg class="ab-star" viewBox="0 0 24 24" aria-hidden="true"><use href="#star"/></svg>' : ""}
      </button>`).join("");
    const n = progress.traced.length;
    document.getElementById("ab-progress").innerHTML =
      `<span><b>${n}</b> of 28 letters traced</span><span class="ab-bar"><span style="width:${(n / 28) * 100}%"></span></span>`;
  }

  /* ---------- Letter card ---------- */
  function wordBlock(w, friendId) {
    const f = friendId && FRIENDS[friendId];
    const pic = f ? `<img src="/${esc(f.img)}" alt="" loading="lazy">` : "";
    const link = f ? `<a class="ab-friend" href="/books/${esc(f.slug)}/">${esc(f.name)} →</a>` : "";
    return `<div class="ab-word">${pic}<div><span class="ab-word-ar" lang="ar" dir="rtl">${w.word}</span>
      <span class="ab-word-tr">${esc(w.word_tr)} · ${esc(w.word_en)}</span>${link}</div></div>`;
  }

  function renderLetter() {
    const l = LETTERS[current - 1];
    const listen = D.audio ? `<button type="button" class="btn btn-ghost ab-listen" data-act="listen">Listen</button>` : "";
    document.getElementById("ab-letter").innerHTML = `
      <div class="ab-head">
        <button type="button" class="nav-day" data-step="-1" ${current <= 1 ? "disabled" : ""} aria-label="Previous letter">←</button>
        <span class="eyebrow">Letter ${current} of 28</span>
        <button type="button" class="nav-day" data-step="1" ${current >= 28 ? "disabled" : ""} aria-label="Next letter">→</button>
      </div>
      <div class="ab-big" lang="ar">${l.ch}</div>
      <h3 class="ab-name">${esc(l.name)}</h3>
      <p class="ab-sound">Sounds like ${esc(l.sound)}</p>
      ${listen}
      <p class="label">How it looks in a word</p>
      <div class="ab-forms">${forms(l).map(([t, f]) => `<div><span lang="ar">${f}</span><small>${t}</small></div>`).join("")}</div>
      <p class="label">Word with ${esc(l.name)}</p>
      ${wordBlock(l, l.friend)}${l.also ? wordBlock(l.also, l.also.friend) : ""}`;
  }

  /* ---------- Tracing ---------- */
  const cv = document.getElementById("ab-canvas"), ctx = cv.getContext("2d");
  const mask = document.createElement("canvas"), mctx = mask.getContext("2d", { willReadFrequently: true });
  const ink = document.createElement("canvas"), ictx = ink.getContext("2d", { willReadFrequently: true });
  let size = 0, drawing = false, last = null, traceDone = false, maskCore = null, maskWide = null;
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function letterFont() { return `${Math.round(size * 0.74)}px Amiri, "Noto Naskh Arabic", serif`; }
  function placeLetter(c) {
    c.textAlign = "center"; c.textBaseline = "alphabetic"; c.direction = "rtl"; c.font = letterFont();
    const m = c.measureText(LETTERS[current - 1].ch);
    const h = (m.actualBoundingBoxAscent || size * 0.4) + (m.actualBoundingBoxDescent || 0);
    return [size / 2, size / 2 + h / 2 - (m.actualBoundingBoxDescent || 0)];
  }

  // Where to start the body of each letter, as fractions of the body's box, and the first direction to move.
  // [fx, fy, dx, dy]; Arabic letters are mostly started at the top right.
  const STARTS = {
    "ا": [.5, 0, 0, 1], "ب": [1, 0, -.3, 1], "ت": [1, 0, -.3, 1], "ث": [1, 0, -.3, 1],
    "ج": [1, 0, -1, .15], "ح": [1, 0, -1, .15], "خ": [1, 0, -1, .15],
    "د": [.5, 0, .4, 1], "ذ": [.5, 0, .4, 1], "ر": [1, 0, -.6, 1], "ز": [1, 0, -.6, 1],
    "س": [1, .2, -.4, 1], "ش": [1, .2, -.4, 1], "ص": [.55, .35, .6, -1], "ض": [.55, .35, .6, -1],
    "ط": [.35, .7, .6, -1], "ظ": [.35, .7, .6, -1], "ع": [1, 0, -1, .3], "غ": [1, 0, -1, .3],
    "ف": [1, .1, -.5, -1], "ق": [1, .1, -.5, -1], "ك": [1, 0, 0, 1], "ل": [1, 0, 0, 1],
    "م": [1, 0, -1, .4], "ن": [1, .1, -.3, 1], "ه": [.5, 0, -1, .6], "و": [.9, 0, -1, .3], "ي": [1, 0, -1, .3],
  };
  const CELL = 3;
  let grid = null, stage = 0, startPt = null, startDir = null;

  // Split the letter into its body and its marks (dots, the small sign in kaf) by finding connected parts.
  function analyse() {
    const W = mask.width, G = Math.ceil(W / CELL), lab = new Int32Array(G * G).fill(-1), on = new Uint8Array(G * G);
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      const x = Math.min(W - 1, gx * CELL + 1), y = Math.min(W - 1, gy * CELL + 1);
      on[gy * G + gx] = maskCore[(y * W + x) * 4 + 3] > 100 ? 1 : 0;
    }
    const comps = [];
    for (let i = 0; i < on.length; i++) {
      if (!on[i] || lab[i] >= 0) continue;
      const id = comps.length, q = [i], cells = []; lab[i] = id;
      while (q.length) {
        const c = q.pop(); cells.push(c); const cx = c % G, cy = (c / G) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue;
          const n = ny * G + nx; if (on[n] && lab[n] < 0) { lab[n] = id; q.push(n); }
        }
      }
      comps.push(cells);
    }
    const big = Math.max(...comps.map(c => c.length));
    const group = comps.map(c => c.length >= big * .35 ? 0 : c.length >= 3 ? 1 : -1); // 0 body, 1 mark, -1 speck
    const marks = [];
    comps.forEach((c, k) => { if (group[k] === 1) marks.push({ id: k, cells: c }); });
    grid = { G, W, lab, group, marks, comps };
  }

  function cellXY(c) { const { G } = grid, dpr = mask.width / size; return [((c % G) * CELL + 1) / dpr, (((c / G) | 0) * CELL + 1) / dpr]; }
  function boxOf(cells) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    cells.forEach(c => { const [x, y] = cellXY(c); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    return { x0, y0, x1, y1 };
  }

  function findStart() {
    const l = LETTERS[current - 1], st = STARTS[l.ch] || [1, 0, -1, 0];
    const bodyCells = grid.comps.filter((c, k) => grid.group[k] === 0).flat();
    const b = boxOf(bodyCells), tx = b.x0 + st[0] * (b.x1 - b.x0), ty = b.y0 + st[1] * (b.y1 - b.y0);
    let best = null, bd = 1e18;
    bodyCells.forEach(c => { const [x, y] = cellXY(c), d = (x - tx) ** 2 + (y - ty) ** 2; if (d < bd) { bd = d; best = [x, y]; } });
    const len = Math.hypot(st[2], st[3]) || 1;
    startPt = best; startDir = [st[2] / len, st[3] / len];
  }

  async function setupTrace() {
    const ch = LETTERS[current - 1].ch;
    try { await document.fonts.load(`100px Amiri`, ch); } catch (e) {}
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(cv.getBoundingClientRect().width) || 320;
    size = w;
    [cv, mask, ink].forEach(c => { c.width = w * dpr; c.height = w * dpr; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); });
    const lw = Math.max(10, size * 0.055);
    // Mask: the letter itself (core) and the letter grown by the pen width (allowed area).
    mctx.clearRect(0, 0, size, size);
    const [x, y] = placeLetter(mctx);
    mctx.fillStyle = "#000"; mctx.fillText(ch, x, y);
    maskCore = mctx.getImageData(0, 0, mask.width, mask.height).data;
    mctx.lineWidth = lw * 1.6; mctx.lineJoin = "round"; mctx.strokeStyle = "#000"; mctx.strokeText(ch, x, y);
    maskWide = mctx.getImageData(0, 0, mask.width, mask.height).data;
    analyse(); findStart();
    ictx.clearRect(0, 0, size, size);
    traceDone = false; stage = 0;
    redraw();
    feedback("Start at the green dot and follow the arrow.", "");
  }

  function marksWord() {
    const l = LETTERS[current - 1], n = grid.marks.length;
    if (l.ch === "ك") return "the little mark";
    const dots = { "ب": 1, "ت": 2, "ث": 3, "ج": 1, "خ": 1, "ذ": 1, "ز": 1, "ش": 3, "ض": 1, "ظ": 1, "غ": 1, "ف": 1, "ق": 2, "ن": 1, "ي": 2 }[l.ch] || n;
    return dots === 1 ? "the dot" : `the ${dots} dots`;
  }

  function redraw() {
    ctx.clearRect(0, 0, size, size);
    const ch = LETTERS[current - 1].ch, [x, y] = placeLetter(ctx);
    ctx.fillStyle = css("--gold-soft") || "#efe7f7"; ctx.fillText(ch, x, y);
    ctx.setLineDash([6, 7]); ctx.lineWidth = 2; ctx.strokeStyle = css("--gold") || "#7a5aa6"; ctx.strokeText(ch, x, y); ctx.setLineDash([]);
    ctx.drawImage(ink, 0, 0, size, size);
    const green = css("--leaf") || "#5f9c7f";
    if (!traceDone && stage === 0 && startPt) {
      // Arrow showing where to start and which way to go.
      const [sx, sy] = startPt, L = size * 0.14, ex = sx + startDir[0] * L, ey = sy + startDir[1] * L, a = Math.atan2(ey - sy, ex - sx);
      ctx.strokeStyle = green; ctx.fillStyle = green; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 12 * Math.cos(a - .5), ey - 12 * Math.sin(a - .5)); ctx.lineTo(ex - 12 * Math.cos(a + .5), ey - 12 * Math.sin(a + .5)); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
      ctx.fillText("1", sx, sy + 1);
    }
    if (!traceDone && stage === 1) {
      // Rings around the dots that still need to be added.
      ctx.setLineDash([5, 5]); ctx.lineWidth = 3; ctx.strokeStyle = green;
      grid.marks.forEach(m => { if (m.done) return; const b = boxOf(m.cells); const r = Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2 + 12;
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = green; ctx.beginPath(); ctx.arc(cx + r * .72, cy - r * .72, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
        ctx.fillText("2", cx + r * .72, cy - r * .72 + 1); ctx.setLineDash([5, 5]); });
      ctx.setLineDash([]);
    }
  }

  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * size / r.width, (e.clientY - r.top) * size / r.height]; }
  function stroke(a, b) {
    ictx.lineCap = "round"; ictx.lineJoin = "round"; ictx.lineWidth = Math.max(10, size * 0.055);
    ictx.strokeStyle = css("--gilt") || "#b08a3e";
    ictx.beginPath(); ictx.moveTo(a[0], a[1]); ictx.lineTo(b[0], b[1]); ictx.stroke();
  }
  cv.addEventListener("pointerdown", e => { if (traceDone) return; drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); stroke(last, [last[0] + .1, last[1] + .1]); redraw(); e.preventDefault(); });
  cv.addEventListener("pointermove", e => { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; redraw(); e.preventDefault(); });
  const end = () => { if (!drawing) return; drawing = false; check(); };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end); cv.addEventListener("pointerleave", end);

  function check() {
    const d = ictx.getImageData(0, 0, ink.width, ink.height).data, { G, W, lab, group } = grid;
    let body = 0, bodyHit = 0, drawn = 0, outside = 0;
    const mk = new Map(grid.marks.map(m => [m.id, [0, 0]]));
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      const x = Math.min(W - 1, gx * CELL + 1), y = Math.min(W - 1, gy * CELL + 1), i = (y * W + x) * 4 + 3;
      const inked = d[i] > 40, c = gy * G + gx, l = lab[c];
      if (l >= 0 && group[l] === 0) { body++; if (inked) bodyHit++; }
      else if (l >= 0 && group[l] === 1) { const v = mk.get(l); v[0]++; if (inked) v[1]++; }
      if (inked) { drawn++; if (maskWide[i] < 40) outside++; }
    }
    const bodyCov = body ? bodyHit / body : 0, out = drawn ? outside / drawn : 0;
    grid.marks.forEach(m => { const [n, h] = mk.get(m.id); m.cov = n ? h / n : 0; m.done = m.cov >= 0.4; });
    if (out > 0.3 && drawn > 150) return feedback("Try to stay on the letter. Tap Clear and try again!", "no");

    if (stage === 0) {
      if (bodyCov >= 0.6) {
        if (!grid.marks.length) return success();
        stage = 1; grid.marks.forEach(m => { m.done = false; });
        // Dots drawn before the body do not count: clear them so they are added at the end.
        redrawInkWithoutMarks();
        redraw();
        return feedback(`Great! Now add ${marksWord()}.`, "");
      }
      if (grid.marks.some(m => m.cov > 0.3) && bodyCov < 0.3) {
        ictx.clearRect(0, 0, size, size); redraw();
        return feedback("The dots come last! First trace the letter, starting at the green dot.", "no");
      }
      return feedback(bodyCov > 0.3 ? "Keep going, almost there!" : "Start at the green dot and follow the arrow.", "");
    }
    if (grid.marks.every(m => m.done)) return success();
    redraw();
    const left = grid.marks.filter(m => !m.done).length;
    feedback(left === grid.marks.length ? `Now add ${marksWord()}.` : `${left} more to go!`, "");
  }

  // Erase any ink on the marks, keeping the body, so the dots must be added after it.
  function redrawInkWithoutMarks() {
    const dpr = mask.width / size;
    ictx.save(); ictx.setTransform(1, 0, 0, 1, 0, 0);
    grid.marks.forEach(m => { const b = boxOf(m.cells), pad = Math.max(10, size * 0.055);
      ictx.clearRect((b.x0 - pad) * dpr, (b.y0 - pad) * dpr, (b.x1 - b.x0 + 2 * pad) * dpr, (b.y1 - b.y0 + 2 * pad) * dpr); });
    ictx.restore();
  }

  function success() {
    traceDone = true; redraw();
    const l = LETTERS[current - 1];
    if (!isDone(current)) { progress.traced.push(current); save(); }
    feedback(`MashaAllah! You wrote ${l.name}!`, "ok");
    document.getElementById("ab-trace").classList.add("win");
    setTimeout(() => document.getElementById("ab-trace").classList.remove("win"), 900);
    renderGrid();
    if (!reduced) burst();
  }

  function burst() {
    const box = document.getElementById("ab-burst");
    box.innerHTML = Array.from({ length: 14 }, (_, k) => {
      const a = (k / 14) * Math.PI * 2, r = 90 + Math.random() * 60;
      return `<svg viewBox="0 0 24 24" style="--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px;animation-delay:${Math.random() * .15}s"><use href="#star"/></svg>`;
    }).join("");
    setTimeout(() => { box.innerHTML = ""; }, 1300);
  }

  function feedback(t, cls) {
    const el = document.getElementById("ab-feedback");
    el.textContent = t; el.className = "ab-feedback " + cls;
  }

  /* ---------- Find the letter ---------- */
  const SIBLINGS = ["بتث", "جحخ", "دذ", "رز", "سش", "صض", "طظ", "عغ", "فق"];
  let game = null;
  function newGame() {
    game = { i: 0, score: 0, answered: null, qs: shuffle(LETTERS).slice(0, 8).map(l => {
      const sib = SIBLINGS.find(s => s.includes(l.ch));
      const pool = shuffle(LETTERS.filter(x => x.n !== l.n));
      const near = sib ? pool.filter(x => sib.includes(x.ch)).slice(0, 1) : [];
      const rest = pool.filter(x => !near.includes(x)).slice(0, 3 - near.length);
      return { answer: l.n, options: shuffle([l, ...near, ...rest]).map(x => x.n) };
    }) };
    renderGame();
  }
  function renderGame() {
    const box = document.getElementById("ab-game");
    if (game.i >= game.qs.length) {
      box.innerHTML = `<div class="result"><div>You found</div><div class="big">${game.score} of ${game.qs.length}</div>
        <p>${game.score === game.qs.length ? "MashaAllah! You know your letters!" : "Great practice! Play again to find them all."}</p>
        <button type="button" class="btn btn-gold" data-act="again">Play again</button></div>`;
      return;
    }
    const q = game.qs[game.i], right = LETTERS[q.answer - 1];
    box.innerHTML = `<div class="quiz-top"><span class="score">${game.i + 1} / ${game.qs.length}</span><span class="score">Score ${game.score}</span></div>
      <div class="q-prompt"><div class="ask">Tap the letter</div><div class="big-lesson">${esc(right.name)}</div>
        <div class="ab-hint">${esc(right.sound)}</div></div>
      <div class="ab-opts">${q.options.map(n => {
        const cls = game.answered ? (n === q.answer ? "ok" : n === game.answered ? "no" : "") : "";
        return `<button type="button" class="ab-opt ${cls}" data-pick="${n}" ${game.answered ? "disabled" : ""} lang="ar">${LETTERS[n - 1].ch}</button>`;
      }).join("")}</div>
      <p class="feedback ${game.answered ? (game.answered === q.answer ? "ok" : "no") : ""}">${game.answered ? (game.answered === q.answer ? "Yes! Well done!" : `That one is ${esc(LETTERS[game.answered - 1].name)}.`) : ""}</p>
      <div class="quiz-foot">${game.answered ? `<button type="button" class="btn btn-gold" data-act="next">${game.i === game.qs.length - 1 ? "See my result" : "Next"}</button>` : ""}</div>`;
  }

  /* ---------- Events ---------- */
  function select(n) {
    current = n; renderGrid(); renderLetter(); setupTrace(); playLetter(n);
    try { history.replaceState(null, "", `#letter-${n}`); } catch (e) {}
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.n) { select(+t.dataset.n); document.getElementById("ab-letter").scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
    else if (t.dataset.step) select(Math.min(28, Math.max(1, current + +t.dataset.step)));
    else if (t.dataset.act === "listen") playLetter(current);
    else if (t.dataset.act === "clear") { ictx.clearRect(0, 0, size, size); traceDone = false; stage = 0; redraw(); feedback("Start at the green dot and follow the arrow.", ""); }
    else if (t.dataset.act === "next-letter") select(current >= 28 ? 1 : current + 1);
    else if (t.dataset.pick) { const q = game.qs[game.i]; game.answered = +t.dataset.pick; if (game.answered === q.answer) game.score++; renderGame(); }
    else if (t.dataset.act === "next") { game.i++; game.answered = null; renderGame(); }
    else if (t.dataset.act === "again") newGame();
    else if (t.dataset.act === "reset-yes") { progress.traced = []; save(); renderGrid(); document.getElementById("ab-reset").innerHTML = resetHtml(false); }
    else if (t.dataset.act === "reset") document.getElementById("ab-reset").innerHTML = resetHtml(true);
    else if (t.dataset.act === "reset-no") document.getElementById("ab-reset").innerHTML = resetHtml(false);
  });
  const resetHtml = confirm => confirm
    ? `<button type="button" class="link-btn danger" data-act="reset-yes">Yes, remove all stars</button> <button type="button" class="link-btn" data-act="reset-no">Cancel</button>`
    : `<button type="button" class="link-btn" data-act="reset">Start again</button>`;
  document.getElementById("ab-reset").innerHTML = resetHtml(false);

  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setupTrace, 200); });
  renderGrid(); renderLetter(); setupTrace(); newGame();
})();
