// Shipping calculator. Zones and book price come from the #ship-data JSON block on the page.
(function () {
  const root = document.getElementById("shipping");
  if (!root) return;
  const DATA = JSON.parse(document.getElementById("ship-data").textContent);
  const zones = DATA.zones, max = DATA.max_books, price = DATA.book_price;
  const money = n => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(n);
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
    let html = `<div class="ship-line"><span>Shipping</span><b>${c === 0 ? "Free" : money(c)}</b></div>
      <div class="ship-line"><span>Delivery time</span><b>${z.days} working days</b></div>`;
    if (price) {
      html += `<div class="ship-line"><span>Books (${state.qty} × ${money(price)})</span><b>${money(price * state.qty)}</b></div>
        <div class="ship-line total"><span>Total</span><span>${money(price * state.qty + c)}</span></div>`;
    }
    document.getElementById("ship-out").innerHTML = html;
    const notes = [];
    if (z.free_from && state.qty < z.free_from) notes.push(`Free shipping from ${z.free_from} books.`);
    if (z.id === "uk") notes.push("Printed books have 0% VAT in the UK, so there is usually nothing extra to pay on delivery.");
    notes.push("PDF activity books have no shipping.");
    document.getElementById("ship-note").textContent = notes.join(" ");
  }

  sel.addEventListener("change", e => { state.zone = e.target.value; render(); });
  document.getElementById("ship-minus").addEventListener("click", () => { if (state.qty > 1) { state.qty--; render(); } });
  document.getElementById("ship-plus").addEventListener("click", () => { if (state.qty < max) { state.qty++; render(); } });
  render();
})();
