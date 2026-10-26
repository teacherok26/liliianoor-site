// Printable bookmarks: pick designs, add a name, print. Nothing is sent anywhere.
(function () {
  const gallery = document.getElementById("bm-gallery");
  if (!gallery) return;
  const KEY = "qa-bookmarks";
  let picked = new Set();
  let name = "";
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) { picked = new Set(s.picked || []); name = s.name || ""; } } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ picked: [...picked], name })); } catch (e) {} };
  const input = document.getElementById("bm-name-input");
  input.value = name;

  function render() {
    gallery.querySelectorAll(".bm-card").forEach(card => {
      const on = picked.has(card.dataset.id);
      card.classList.toggle("picked", on);
      const b = card.querySelector(".bm-pick");
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "✓ Picked" : "Pick this one";
    });
    gallery.querySelectorAll(".bm-name").forEach(el => { el.textContent = name; });
    const n = picked.size;
    document.getElementById("bm-count").textContent = n === 0 ? "Pick the bookmarks you like"
      : `${n} bookmark${n > 1 ? "s" : ""} picked · ${Math.ceil(n / 3)} page${n > 3 ? "s" : ""} to print`;
    document.getElementById("bm-print").disabled = n === 0;
  }

  gallery.addEventListener("click", e => {
    const card = e.target.closest(".bm-card"); if (!card) return;
    const id = card.dataset.id;
    picked.has(id) ? picked.delete(id) : picked.add(id);
    save(); render();
  });
  input.addEventListener("input", () => { name = input.value.trim(); save(); render(); });
  document.getElementById("bm-print").addEventListener("click", () => { if (picked.size) window.print(); });
  render();
})();
