// "Find the pair" memory game. Friends come from the #memory-data JSON block.
(function () {
  const board = document.getElementById("mem-board");
  if (!board) return;
  const FRIENDS = JSON.parse(document.getElementById("memory-data").textContent);
  const LEVELS = {
    little: { pairs: 3, kind: "same", label: "Little" },
    big: { pairs: 6, kind: "same", label: "Big" },
    arabic: { pairs: 6, kind: "arabic", label: "Arabic" },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let level = "little", cards = [], open = [], found = 0, moves = 0, busy = false;
  let sound = false;
  try { sound = localStorage.getItem("qa-sound") === "on"; } catch (e) {}

  // Tiny sounds made in the browser, no files needed.
  let ctx = null;
  function beep(notes) {
    if (!sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      notes.forEach(([f, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d); t += d * 0.8;
      });
    } catch (e) {}
  }
  const sfx = {
    flip: () => beep([[660, 0.08]]),
    match: () => beep([[523, 0.12], [659, 0.12], [784, 0.2]]),
    miss: () => beep([[330, 0.12], [262, 0.18]]),
    win: () => beep([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.35]]),
  };

  function face(c) {
    const f = c.friend;
    if (c.side === "word") {
      return `<div class="mem-word tinted" style="--t-l:${f.tint};--t-d:${f.tint_dark}">
        <span class="mem-ar" lang="ar">${f.ar}</span><span class="mem-tr">${esc(f.tr)}</span></div>`;
    }
    const pic = f.img
      ? `<img src="/${esc(f.img)}" alt="" draggable="false">`
      : `<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#whale"/></svg>`;
    return `<div class="mem-pic">${pic}<span class="mem-name">${esc(f.animal)}</span></div>`;
  }

  function deal() {
    const L = LEVELS[level];
    const picks = shuffle(FRIENDS).slice(0, L.pairs);
    cards = shuffle(picks.flatMap(f => [
      { friend: f, side: "pic" },
      { friend: f, side: L.kind === "arabic" ? "word" : "pic" },
    ])).map((c, i) => Object.assign(c, { i, up: false, done: false }));
    open = []; found = 0; moves = 0; busy = false;
    board.className = `mem-board n${cards.length}`;
    board.innerHTML = cards.map(c => `
      <button type="button" class="mem-card" data-i="${c.i}" aria-label="Card ${c.i + 1}, hidden">
        <span class="mem-inner">
          <span class="mem-back" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#star"/></svg></span>
          <span class="mem-front">${face(c)}</span>
        </span>
      </button>`).join("");
    document.getElementById("mem-win").hidden = true;
    document.querySelectorAll(".mem-level").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.level === level)));
    status("Tap two cards to find a pair!");
    counters();
  }

  function counters() {
    document.getElementById("mem-moves").textContent = moves;
    document.getElementById("mem-found").textContent = `${found} / ${cards.length / 2}`;
  }
  function status(t) { document.getElementById("mem-status").textContent = t; }

  function label(c) {
    return c.side === "word" ? `${c.friend.ar} ${c.friend.tr}` : c.friend.animal;
  }

  function flip(i) {
    const c = cards[i];
    if (busy || c.up || c.done) return;
    c.up = true; open.push(c); sfx.flip();
    const el = board.querySelector(`[data-i="${i}"]`);
    el.classList.add("up"); el.setAttribute("aria-label", `Card ${i + 1}, ${label(c)}`);
    if (open.length < 2) return;

    moves++; counters();
    const [a, b] = open;
    if (a.friend.id === b.friend.id) {
      a.done = b.done = true; open = []; found++; counters();
      [a, b].forEach(x => board.querySelector(`[data-i="${x.i}"]`).classList.add("done"));
      sfx.match();
      status(`Yes! ${a.friend.name} · ${a.friend.ar}`);
      if (found === cards.length / 2) setTimeout(win, reduced ? 0 : 600);
    } else {
      busy = true; sfx.miss();
      status("Not a pair. Try again!");
      setTimeout(() => {
        [a, b].forEach(x => {
          x.up = false;
          const e = board.querySelector(`[data-i="${x.i}"]`);
          e.classList.remove("up"); e.setAttribute("aria-label", `Card ${x.i + 1}, hidden`);
        });
        open = []; busy = false;
      }, reduced ? 500 : 900);
    }
  }

  function win() {
    const pairs = cards.length / 2;
    const stars = moves <= pairs + 1 ? 3 : moves <= pairs * 2 ? 2 : 1;
    sfx.win();
    const w = document.getElementById("mem-win");
    w.querySelector(".mem-stars").innerHTML = [1, 2, 3].map(n =>
      `<svg viewBox="0 0 24 24" class="${n <= stars ? "on" : ""}" aria-hidden="true"><use href="#star"/></svg>`).join("");
    w.querySelector(".mem-stars").setAttribute("aria-label", `${stars} of 3 stars`);
    w.querySelector(".mem-sum").textContent = `You found ${pairs} pairs in ${moves} moves.`;
    w.hidden = false;
    if (!reduced) confetti();
    status("MashaAllah! You found all the friends!");
    w.querySelector("button").focus({ preventScroll: true });
  }

  function confetti() {
    const box = document.getElementById("mem-confetti");
    const shapes = ["star", "heart", "flower"];
    box.innerHTML = Array.from({ length: 28 }, (_, k) => {
      const s = shapes[k % 3], left = Math.random() * 100, delay = Math.random() * 0.6, dur = 1.6 + Math.random() * 1.2, size = 16 + Math.random() * 18;
      const vb = s === "heart" ? "0 0 24 22" : s === "flower" ? "0 0 40 40" : "0 0 24 24";
      return `<svg viewBox="${vb}" style="left:${left}%;width:${size}px;animation-delay:${delay}s;animation-duration:${dur}s"><use href="#${s}"/></svg>`;
    }).join("");
    setTimeout(() => { box.innerHTML = ""; }, 3200);
  }

  board.addEventListener("click", e => {
    const b = e.target.closest(".mem-card");
    if (b) flip(+b.dataset.i);
  });
  document.querySelectorAll(".mem-level").forEach(b => b.addEventListener("click", () => { level = b.dataset.level; deal(); }));
  document.getElementById("mem-again").addEventListener("click", deal);
  document.getElementById("mem-restart").addEventListener("click", deal);
  const sBtn = document.getElementById("mem-sound");
  const showSound = () => { sBtn.setAttribute("aria-pressed", String(sound)); sBtn.textContent = sound ? "Sound: on" : "Sound: off"; };
  sBtn.addEventListener("click", () => {
    sound = !sound; showSound();
    try { localStorage.setItem("qa-sound", sound ? "on" : "off"); } catch (e) {}
    sfx.flip();
  });
  showSound();
  deal();
})();
