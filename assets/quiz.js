// "Who is my animal friend?" quiz. Book data comes from the #quiz-data JSON block on the page.
(function () {
  const box = document.getElementById("quiz-box");
  if (!box) return;
  const BOOKS = JSON.parse(document.getElementById("quiz-data").textContent);
  const ROUNDS = 6;
  const PRAISE = ["MashaAllah, correct!", "Well done!", "Yes, that's right!"];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const byId = id => BOOKS.find(b => b.id === id);
  let quiz;

  function newQuiz() {
    quiz = {
      i: 0, score: 0, answered: null, results: [],
      qs: shuffle(BOOKS).slice(0, ROUNDS).map((b, k) => ({
        answer: b.id,
        kind: k % 2 === 0 ? "arabic" : "lesson",
        options: shuffle([b, ...shuffle(BOOKS.filter(x => x.id !== b.id)).slice(0, 3)]).map(x => x.id),
      })),
    };
    render();
  }

  function picture(b) {
    return b.cover
      ? `<img src="/${esc(b.cover)}" alt="">`
      : `<span class="tile tinted" style="--t-l:${b.tint};--t-d:${b.tint_dark}"></span>`;
  }

  function render() {
    const dots = quiz.qs.map((_, k) => {
      const r = quiz.results[k];
      return `<span class="${r === true ? "ok" : r === false ? "no" : k === quiz.i ? "on" : ""}"></span>`;
    }).join("");

    if (quiz.i >= quiz.qs.length) {
      const s = quiz.score;
      const msg = s === ROUNDS
        ? "MashaAllah! You know all the animal friends. Now pick a book and meet them again."
        : s >= ROUNDS / 2 ? "Great job! Read the books to learn even more about the animals."
        : "Good try! Read the stories together and play again.";
      box.innerHTML = `<div class="quiz-top"><div class="dots">${dots}</div></div>
        <div class="result"><div>You got</div><div class="big">${s} of ${ROUNDS}</div>
        <p>${msg}</p><button type="button" class="btn btn-gold" id="q-again">Play again</button></div>`;
      document.getElementById("q-again").onclick = newQuiz;
      return;
    }

    const q = quiz.qs[quiz.i], right = byId(q.answer);
    const prompt = q.kind === "arabic"
      ? `<div class="big-ar" lang="ar">${right.ar}</div><div class="ask">Which animal is this?</div>`
      : `<div class="ask">Which friend teaches this lesson?</div><div class="big-lesson">“${esc(right.lesson)}”</div>`;
    const opts = q.options.map(id => {
      const b = byId(id);
      const cls = quiz.answered ? (id === q.answer ? "ok" : id === quiz.answered ? "no" : "") : "";
      return `<button type="button" class="opt ${cls}" data-id="${id}" ${quiz.answered ? "disabled" : ""}>${picture(b)}${esc(b.animal)}</button>`;
    }).join("");

    let fb = "", fbCls = "";
    if (quiz.answered) {
      const ok = quiz.answered === q.answer;
      fb = ok ? PRAISE[quiz.i % PRAISE.length] : `Not quite. The answer is ${right.animal}.`;
      fbCls = ok ? "ok" : "no";
    }
    const last = quiz.i === quiz.qs.length - 1;

    box.innerHTML = `<div class="quiz-top"><div class="dots">${dots}</div><span class="score">${quiz.i + 1} / ${ROUNDS}</span></div>
      <div class="q-prompt">${prompt}</div>
      <div class="options">${opts}</div>
      <p class="feedback ${fbCls}">${esc(fb)}</p>
      <div class="quiz-foot">${quiz.answered ? `<button type="button" class="btn btn-gold" id="q-next">${last ? "See my result" : "Next question"}</button>` : ""}</div>`;

    box.querySelectorAll(".opt").forEach(btn => btn.onclick = () => {
      quiz.answered = btn.dataset.id;
      const ok = quiz.answered === q.answer;
      quiz.results[quiz.i] = ok;
      if (ok) quiz.score++;
      render();
      document.getElementById("q-next")?.focus({ preventScroll: true });
    });
    const next = document.getElementById("q-next");
    if (next) next.onclick = () => { quiz.i++; quiz.answered = null; render(); };
  }

  newQuiz();
})();
