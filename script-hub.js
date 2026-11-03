/* ===== Render kartu materi di halaman index ===== */
(function () {
  const JUMLAH_MATERI = 12;
  const SOAL_PER_MATERI = 10;
  const KANJI = ["目的", "て形", "ない形", "経験", "引用", "許可", "様態", "可能", "受身", "使役", "条件", "授受"];

  const container = document.getElementById("link-list");
  if (!container) {
    console.warn("[script-hub] Elemen #link-list tidak ditemukan.");
    return;
  }

  function bacaRekor(n) {
    try {
      return JSON.parse(sessionStorage.getItem("n4-best-" + n) || "null");
    } catch (e) {
      return null;
    }
  }

  function renderMateri() {
    container.innerHTML = "";
    let dicoba = 0;

    for (let i = 1; i <= JUMLAH_MATERI; i++) {
      const judul =
        typeof BANK !== "undefined" && BANK[i] && BANK[i].judul ? BANK[i].judul : "JLPT N4 Bunpou";

      // "Tujuan: ～に行く / ..." → judul = "Tujuan", subjudul = pola tata bahasa
      const pos = judul.indexOf(":");
      const utama = pos > -1 ? judul.slice(0, pos).trim() : judul;
      const sub = pos > -1 ? judul.slice(pos + 1).trim() : "";

      const rekor = bacaRekor(i);
      if (rekor) dicoba++;
      const persen = rekor ? (rekor.benar / SOAL_PER_MATERI) * 100 : 0;
      let teksRekor = "Belum dicoba";
      let kelas = "mc-best";
      if (rekor) {
        teksRekor = (rekor.benar === SOAL_PER_MATERI ? "🏆 " : "⭐ ") + rekor.benar + "/" + SOAL_PER_MATERI;
        kelas += rekor.benar === SOAL_PER_MATERI ? " perfect" : " done";
      }

      let ikonKunci = "";
      if (typeof Akses !== "undefined" && Akses.perluKode(i)) {
        ikonKunci = Akses.terbuka(i)
          ? '<span class="mc-lock open" title="Sudah dibuka">🔓</span>'
          : '<span class="mc-lock" title="Perlu kode akses">🔒</span>';
      }

      const a = document.createElement("a");
      a.className = "materi-card";
      a.href = `soal-${i}.html`; // setiap materi punya halaman sendiri
      a.dataset.kanji = KANJI[i - 1] || "";
      a.style.animationDelay = (i - 1) * 0.05 + "s";
      a.innerHTML = `
        <div class="mc-top">
          <div class="mc-num">${i}</div>
          <div>
            <div class="mc-label">Materi ${i}</div>
            <div class="mc-title">${utama}</div>
          </div>
          ${ikonKunci}
        </div>
        <div class="mc-sub">${sub}</div>
        <div class="mc-bar"><i style="width:${persen}%"></i></div>
        <div class="mc-foot">
          <span class="mc-chip">${SOAL_PER_MATERI} soal</span>
          <span class="${kelas}">${teksRekor}</span>
        </div>
      `;
      container.appendChild(a);
    }

    const elDicoba = document.getElementById("stat-dicoba");
    if (elDicoba) elDicoba.textContent = dicoba;
  }

  /* ===== Tombol Refresh Data: ulang progres dari awal ===== */
  const btnReset = document.getElementById("btn-reset");
  const modal = document.getElementById("reset-modal");

  function hapusProgres() {
    for (let i = 1; i <= JUMLAH_MATERI; i++) {
      try { sessionStorage.removeItem("n4-best-" + i); } catch (e) {}
    }
    if (typeof Akses !== "undefined") Akses.reset(); // kunci ulang semua materi
    renderMateri();
  }

  if (btnReset && modal) {
    btnReset.addEventListener("click", () => { modal.hidden = false; });
    document.getElementById("reset-batal").addEventListener("click", () => { modal.hidden = true; });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
    document.getElementById("reset-ya").addEventListener("click", () => {
      hapusProgres();
      modal.hidden = true;
      btnReset.textContent = "✅ Data direset";
      setTimeout(() => { btnReset.textContent = "🔄 Refresh Data"; }, 1800);
    });
  }

  renderMateri();
})();
