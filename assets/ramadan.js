// Ramadan good-deeds chart. Data comes from the #ram-data JSON block; progress is saved in this browser only.
(function () {
  const app = document.getElementById("ram-app");
  if (!app) return;
  const D = JSON.parse(document.getElementById("ram-data").textContent);
  const KEY = "qa-ramadan-1448";
  const DAYS = D.deeds.length;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let state = { kids: [{ name: "", done: [] }], active: 0, start: D.start };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.kids) && saved.kids.length) state = Object.assign(state, saved);
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const kid = () => state.kids[state.active] || state.kids[0];

  // Which day of Ramadan is it today? 0 = not started, DAYS + 1 = finished.
  function ramadanDay() {
    const start = new Date(state.start + "T00:00:00");
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.round((now - start) / 86400000);
    if (diff < 0) return { day: 0, until: -diff };
    if (diff >= DAYS) return { day: DAYS + 1 };
    return { day: diff + 1 };
  }
  let today = ramadanDay();
  let selected = today.day >= 1 && today.day <= DAYS ? today.day : 1;
  let confirming = null;

  const duaFor = d => d > 20 ? D.last_ten : D.duas[(d - 1) % D.duas.length];

  function countdown() {
    const el = document.getElementById("ram-count");
    if (today.day === 0) {
      el.textContent = today.until === 1 ? "Ramadan starts tomorrow, in sha' Allah!"
        : `Ramadan starts in ${today.until} days, in sha' Allah. You can practise any day now.`;
    } else if (today.day > DAYS) {
      el.textContent = "Ramadan has ended. Eid Mubarak!";
    } else {
      el.textContent = `Today is day ${today.day} of Ramadan`;
    }
  }

  function jarSvg(done) {
    const frac = done / DAYS;
    const top = 70, bottom = 222, h = (bottom - top) * frac;
    return `<svg viewBox="0 0 200 240" class="jar" role="img" aria-label="Honey jar, ${done} of ${DAYS} filled">
      <defs><clipPath id="jar-clip"><path d="M40 70 Q40 60 50 60 H150 Q160 60 160 70 V205 Q160 222 143 222 H57 Q40 222 40 205 Z"/></clipPath></defs>
      <rect x="52" y="26" width="96" height="26" rx="8" class="jar-lid"/>
      <rect x="62" y="50" width="76" height="12" rx="4" class="jar-neck"/>
      <path d="M40 70 Q40 60 50 60 H150 Q160 60 160 70 V205 Q160 222 143 222 H57 Q40 222 40 205 Z" class="jar-glass"/>
      <g clip-path="url(#jar-clip)">
        <rect x="30" y="${bottom - h}" width="140" height="${h + 2}" class="jar-honey"/>
        ${h > 6 ? `<path d="M30 ${bottom - h} q 17 8 35 0 t 35 0 t 35 0 t 35 0 V ${bottom - h + 10} H30 Z" class="jar-wave"/>` : ""}
      </g>
      <path d="M40 70 Q40 60 50 60 H150 Q160 60 160 70 V205 Q160 222 143 222 H57 Q40 222 40 205 Z" class="jar-outline"/>
      <path d="M56 84 V170" class="jar-shine"/>
    </svg>`;
  }

  function cheer(n) {
    if (n === 0) return "Tap “I did it!” after each good deed to add honey to the jar.";
    if (n === DAYS) return "MashaAllah! The jar is full. Nur is so proud of you!";
    if (n >= 20) return "Almost full! Keep going in the last ten nights.";
    if (n >= 10) return "MashaAllah, the honey is rising!";
    return "A great start. Every good deed counts!";
  }

  function renderJar() {
    const k = kid(), n = k.done.length;
    const chips = state.kids.map((x, i) =>
      `<button type="button" class="kid-chip" data-kid="${i}" aria-pressed="${i === state.active}">${esc(x.name || `Child ${i + 1}`)}</button>`).join("");
    const removeBtn = state.kids.length > 1
      ? (confirming === "remove"
        ? `<button type="button" class="link-btn danger" data-act="remove-yes">Yes, remove ${esc(k.name || "this child")}</button> <button type="button" class="link-btn" data-act="cancel">Cancel</button>`
        : `<button type="button" class="link-btn" data-act="remove">Remove</button>`) : "";
    const resetBtn = confirming === "reset"
      ? `<button type="button" class="link-btn danger" data-act="reset-yes">Yes, empty the jar</button> <button type="button" class="link-btn" data-act="cancel">Cancel</button>`
      : `<button type="button" class="link-btn" data-act="reset">Start again</button>`;
    document.getElementById("ram-jar").innerHTML = `
      <div class="kids">${chips}<button type="button" class="kid-chip add" data-act="add">+ Add a child</button></div>
      <label class="name-field"><span>Name</span>
        <input id="ram-name" type="text" maxlength="24" placeholder="Your child's name" value="${esc(k.name)}" autocomplete="off"></label>
      ${jarSvg(n)}
      <div class="jar-count"><b>${n}</b> of ${DAYS} good deeds</div>
      <p class="jar-cheer">${cheer(n)}</p>
      <div class="jar-tools">${resetBtn} ${removeBtn}</div>`;
  }

  function renderDay() {
    const d = selected, deed = D.deeds[d - 1], dua = duaFor(d), done = kid().done.includes(d);
    const f = deed.friend && D.friends[deed.friend];
    const isToday = today.day === d;
    document.getElementById("ram-day").innerHTML = `
      <div class="day-top">
        <button type="button" class="nav-day" data-step="-1" ${d <= 1 ? "disabled" : ""} aria-label="Previous day">←</button>
        <div><div class="eyebrow">${isToday ? "Today · " : ""}Day ${d} of ${DAYS}</div></div>
        <button type="button" class="nav-day" data-step="1" ${d >= DAYS ? "disabled" : ""} aria-label="Next day">→</button>
      </div>
      <p class="label">Good deed</p>
      <p class="deed">${esc(deed.t)}</p>
      ${f ? `<a class="friend tinted" style="--t-l:${f.tint};--t-d:${f.tint_dark}" href="/books/${f.slug}/"><span lang="ar">${f.ar}</span> ${esc(f.name)} loves this one →</a>` : ""}
      <button type="button" class="btn ${done ? "btn-ghost" : "btn-gold"} did" data-act="toggle">${done ? "✓ Done! Tap to undo" : "I did it!"}</button>
      <div class="dua">
        <p class="label">${d > 20 ? "Dua for the last ten nights" : "Dua of the day"}</p>
        <p class="dua-ar" lang="ar" dir="rtl">${dua.ar}</p>
        <p class="dua-tr">${esc(dua.tr)}</p>
        <p class="dua-en">“${esc(dua.en)}”</p>
        <p class="dua-ref">${esc(dua.ref)}</p>
      </div>`;
  }

  function renderGrid() {
    const done = kid().done;
    document.getElementById("ram-grid").innerHTML = D.deeds.map((x, i) => {
      const d = i + 1, cls = [done.includes(d) ? "done" : "", d === selected ? "sel" : "", d === today.day ? "today" : ""].join(" ");
      return `<button type="button" class="cell ${cls}" data-day="${d}" aria-label="Day ${d}${done.includes(d) ? ", done" : ""}">
        <span class="cell-n">${d}</span><span class="cell-mark" aria-hidden="true">${done.includes(d) ? "★" : ""}</span>
        <span class="cell-t">${esc(x.t)}</span></button>`;
    }).join("");
  }

  function renderAll() { renderJar(); renderDay(); renderGrid(); }

  app.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.day) { selected = +t.dataset.day; renderDay(); renderGrid(); document.getElementById("ram-day").scrollIntoView({ block: "nearest" }); return; }
    if (t.dataset.step) { selected = Math.min(DAYS, Math.max(1, selected + +t.dataset.step)); renderDay(); renderGrid(); return; }
    if (t.dataset.kid) { state.active = +t.dataset.kid; confirming = null; save(); renderAll(); return; }
    const act = t.dataset.act;
    if (act === "toggle") {
      const k = kid(), i = k.done.indexOf(selected);
      if (i >= 0) k.done.splice(i, 1); else k.done.push(selected);
      save(); renderAll();
      if (i < 0) document.getElementById("ram-jar").classList.add("pop"), setTimeout(() => document.getElementById("ram-jar").classList.remove("pop"), 500);
    } else if (act === "add") {
      if (state.kids.length < 8) { state.kids.push({ name: "", done: [] }); state.active = state.kids.length - 1; save(); renderAll(); document.getElementById("ram-name").focus(); }
    } else if (act === "reset" || act === "remove") { confirming = act; renderJar(); }
    else if (act === "cancel") { confirming = null; renderJar(); }
    else if (act === "reset-yes") { kid().done = []; confirming = null; save(); renderAll(); }
    else if (act === "remove-yes") { state.kids.splice(state.active, 1); state.active = 0; confirming = null; save(); renderAll(); }
  });

  app.addEventListener("input", e => {
    if (e.target.id === "ram-name") {
      kid().name = e.target.value; save();
      const chip = app.querySelector(`.kid-chip[data-kid="${state.active}"]`);
      if (chip) chip.textContent = e.target.value || `Child ${state.active + 1}`;
    }
  });

  const startInput = document.getElementById("ram-start");
  startInput.value = state.start;
  startInput.addEventListener("change", () => {
    if (!startInput.value) return;
    state.start = startInput.value; save();
    today = ramadanDay();
    if (today.day >= 1 && today.day <= DAYS) selected = today.day;
    countdown(); renderAll();
  });

  countdown();
  renderAll();
})();
