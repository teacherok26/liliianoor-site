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
    const core = mctx.getImageData(0, 0, mask.width, mask.height).data;
    mctx.lineWidth = lw * 1.6; mctx.lineJoin = "round"; mctx.strokeStyle = "#000"; mctx.strokeText(ch, x, y);
    const wide = mctx.getImageData(0, 0, mask.width, mask.height).data;
    maskCore = core; maskWide = wide;
    ictx.clearRect(0, 0, size, size);
    traceDone = false;
    redraw();
    feedback(`Trace ${LETTERS[current - 1].name} with your finger.`, "");
  }

  function redraw() {
    ctx.clearRect(0, 0, size, size);
    const ch = LETTERS[current - 1].ch, [x, y] = placeLetter(ctx);
    ctx.fillStyle = css("--gold-soft") || "#efe7f7"; ctx.fillText(ch, x, y);
    ctx.setLineDash([6, 7]); ctx.lineWidth = 2; ctx.strokeStyle = css("--gold") || "#7a5aa6"; ctx.strokeText(ch, x, y); ctx.setLineDash([]);
    ctx.drawImage(ink, 0, 0, size, size);
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
    const d = ictx.getImageData(0, 0, ink.width, ink.height).data;
    let core = 0, covered = 0, drawn = 0, outside = 0;
    for (let i = 3; i < d.length; i += 4 * 3) {
      const inked = d[i] > 40;
      if (maskCore[i] > 100) { core++; if (inked) covered++; }
      if (inked) { drawn++; if (maskWide[i] < 40) outside++; }
    }
    const cov = core ? covered / core : 0, out = drawn ? outside / drawn : 0;
    if (cov >= 0.62 && out <= 0.3) return success();
    if (out > 0.3 && drawn > 200) feedback("Try to stay on the letter. Tap Clear and try again!", "no");
    else feedback(cov > 0.3 ? "Keep going, almost there!" : "Follow the dotted line.", "");
  }

  function success() {
    traceDone = true;
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
    else if (t.dataset.act === "clear") { ictx.clearRect(0, 0, size, size); traceDone = false; redraw(); feedback(`Trace ${LETTERS[current - 1].name} with your finger.`, ""); }
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
