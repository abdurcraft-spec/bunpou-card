const KODE_AKSES = {
  1: "SAKURA",
  2: "FUJI",
  3: "TORII",
  4: "NEKO",
  5: "MATCHA",
  6: "SUSHI",
  7: "RAMEN",
  8: "KIMONO",
  9: "NINJA",
  10: "SAMURAI",
  11: "ORIGAMI",
  12: "HANAMI",
};

const Akses = (function () {
  const PREFIX = "n4-unlock-";
  const JUMLAH = 12;
  const memori = {};

  const norm = (s) => String(s == null ? "" : s).replace(/\s+/g, "").toUpperCase();

  function perluKode(n) {
    return norm(KODE_AKSES[n]) !== "";
  }

  function terbuka(n) {
    try { return sessionStorage.getItem(PREFIX + n) === "1"; }
    catch (e) { return memori[n] === true; }
  }

  function simpanTerbuka(n) {
    memori[n] = true;
    try { sessionStorage.setItem(PREFIX + n, "1"); } catch (e) {}
  }

  function periksa(n, kode) {
    if (norm(kode) !== "" && norm(kode) === norm(KODE_AKSES[n])) {
      simpanTerbuka(n);
      return true;
    }
    return false;
  }

  function reset() {
    for (let i = 1; i <= JUMLAH; i++) {
      delete memori[i];
      try { sessionStorage.removeItem(PREFIX + i); } catch (e) {}
    }
  }

  function tampilkanForm(n, judul, onSukses) {
    document.body.classList.add("locked");

    const wrap = document.createElement("div");
    wrap.className = "overlay gate";
    wrap.innerHTML = `
      <form class="overlay-card gate-card" autocomplete="off">
        <div class="overlay-emoji">🔐</div>
        <h3>Masukkan Kode Akses</h3>
        <p class="gate-materi"></p>
        <input class="gate-input" type="text" placeholder="Kode akses" maxlength="30"
               autocomplete="off" autocapitalize="characters" spellcheck="false" />
        <div class="gate-error" role="alert" hidden></div>
        <div class="overlay-actions">
          <button type="submit" class="nav-btn primary">Masuk 🔓</button>
          <a class="nav-btn" href="index.html">⬅ Menu</a>
        </div>
      </form>`;
    document.body.appendChild(wrap);

    const form = wrap.querySelector("form");
    const input = wrap.querySelector(".gate-input");
    const err = wrap.querySelector(".gate-error");
    wrap.querySelector(".gate-materi").textContent = `Materi ${n}${judul ? " • " + judul : ""}`;
    setTimeout(() => input.focus(), 50);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (periksa(n, input.value)) {
        if (typeof Sound !== "undefined") Sound.benar(0, 0);
        wrap.remove();
        document.body.classList.remove("locked");
        onSukses();
      } else {
        if (typeof Sound !== "undefined") Sound.salah(0);
        err.hidden = false;
        err.textContent = "Kode salah, coba lagi ya.";
        form.classList.remove("shake");
        void form.offsetWidth;
        form.classList.add("shake");
        input.select();
      }
    });
  }

  return { perluKode, terbuka, periksa, reset, tampilkanForm };
})();