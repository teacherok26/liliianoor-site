// Shipping calculator. Zones and book price come from the #ship-data JSON block on the page.
(function () {
  const root = document.getElementById("shipping");
  if (!root) return;
  const DATA = JSON.parse(document.getElementById("ship-data").textContent);
  const zones = DATA.zones, max = DATA.max_books, price = DATA.book_price;
  const L = DATA.labels || {};
  const money = n => new Intl.NumberFormat(DATA.locale || "en-GB", { style: "currency", currency: "EUR" }).format(n);
  const cost = (z, q) => (z.free_from && q >= z.free_from) ? 0 : z.first + z.extra * (q - 1);
  const state = { zone: zones[0].id, qty: 1 };

  const sel = document.getElementById("ship-zone");
  sel.innerHTML = zones.map(z => `<option value="${z.id}">${z.name}</option>`).join("");

  function render() {
    const z = zones.find(x => x.id === state.zone) || zones[0];
    const c = cost(z, state.qty);
    document.getElementById("ship-qty").textContent = state.qty;
    document.getElementById("ship-minus").disabled = state.qty <= 1;
    document.getElementById("ship-plus").disabled = state.qty >= max;
    let html = `<div class="ship-line"><span>${L.shipping}</span><b>${c === 0 ? L.free : money(c)}</b></div>
      <div class="ship-line"><span>${L.days}</span><b>${z.days} ${L.working}</b></div>`;
    if (price) {
      const bundle = (DATA.bundles || []).find(b => b.books === state.qty);
      const books = bundle ? bundle.price : price * state.qty;
      const label = bundle ? `${bundle.name} (${L.bundle})` : `${L.books} (${state.qty} × ${money(price)})`;
      html += `<div class="ship-line"><span>${label}</span><b>${money(books)}</b></div>
        <div class="ship-line total"><span>${L.total}</span><span>${money(books + c)}</span></div>`;
    }
    document.getElementById("ship-out").innerHTML = html;
    const notes = [];
    if (z.free_from && state.qty < z.free_from) notes.push(L.freeFrom.replace("{n}", z.free_from));
    if (z.id === "uk") notes.push(L.uk);
    notes.push(L.pdf);
    document.getElementById("ship-note").textContent = notes.join(" ");
  }

  sel.addEventListener("change", e => { state.zone = e.target.value; render(); });
  document.getElementById("ship-minus").addEventListener("click", () => { if (state.qty > 1) { state.qty--; render(); } });
  document.getElementById("ship-plus").addEventListener("click", () => { if (state.qty < max) { state.qty++; render(); } });
  render();
})();
