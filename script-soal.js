/* ===== script-soal.js (Terbaru: Hanya Soal & Opsi Klik yang Memiliki Suara) ===== */
(function () {
  const params = new URLSearchParams(location.search);
  let materi = parseInt(
    document.body.dataset.materi || params.get("materi"),
    10,
  );
  if (!(materi >= 1 && materi <= 12)) materi = 1;

  function galat(html) {
    document.body.classList.remove("locked");
    const box = document.querySelector(".quiz-container");
    if (box) {
      box.innerHTML =
        '<div class="correction-box"><div class="c-title">⚠️ Terjadi masalah</div><div>' +
        html +
        '</div></div><p style="text-align:center;margin-top:14px"><a class="nav-btn" href="index.html">⬅ Menu</a></p>';
    }
  }

  const adaData = typeof BANK !== "undefined";
  const bank = adaData && BANK[materi] ? BANK[materi] : null;
  if (!bank) {
    galat(
      !adaData
        ? "File <b>data-soal.js</b> tidak berhasil dimuat."
        : "Materi " + materi + " tidak ada.",
    );
    return;
  }

  const JUMLAH_SOAL = 10;
  bank.soal = bank.soal.slice(0, JUMLAH_SOAL);
  const TOTAL = bank.soal.length;
  const NYAWA_AWAL = 3;

  const $ = (id) => document.getElementById(id);
  const el = {
    skor: $("skor"),
    combo: $("combo"),
    nyawa: $("nyawa"),
    progress: $("progress"),
    bubble: $("bubble"),
    mascot: $("mascot"),
    info: $("materi-info"),
    tanya: $("pertanyaan"),
    opsi: $("opsi"),
    feedback: $("feedback"),
    koreksi: $("koreksi"),
    prev: $("btn-prev"),
    next: $("btn-next"),
    counter: $("counter"),
    overlay: $("overlay"),
  };

  // Fungsi Pembaca Suara AI (Text-to-Speech) khusus Bahasa Jepang
  function speakText(text) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Hentikan suara yang sedang berjalan
      const cleanText = text.replace(/<[^>]*>?/gm, "").replace(/____/g, "koko");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "ja-JP"; // Suara bahasa Jepang
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  const PESAN_BENAR = [
    ["Sugoi! Benar sekali!", "🥳"],
    ["Yatta! Jawabanmu tepat!", "😸"],
    ["Hebat! Pertahankan ya!", "🤩"],
    ["Subarashii! Terus semangat!", "😻"],
  ];
  const PESAN_SALAH = [
    ["Jangan berkecil hati, ayo coba lagi!", "🥺"],
    ["Tidak apa-apa, baca koreksinya ya!", "😿"],
    ["Ganbatte! Kesalahan itu bagian dari belajar.", "🥹"],
  ];

  const LABEL = ["A", "B", "C", "D"];

  let items, jawaban, idx, skor, combo, nyawa;
  let aktif = false;

  function acak(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mulai() {
    items = bank.soal.map(([q, benar, ...sisa]) => {
      const e = sisa.pop();
      return { q, benar, e, opsi: acak([benar, ...sisa]) };
    });
    jawaban = Array(TOTAL).fill(null);
    idx = 0;
    skor = 0;
    combo = 0;
    nyawa = NYAWA_AWAL;
    el.overlay.hidden = true;
    $("btn-tinjau").hidden = false;
    render();
    // Otomatis membaca KALIMAT SOAL saat pertama kali dibuka
    speakText(items[idx].q);
  }

  function jumlahTerjawab() {
    return jawaban.filter(Boolean).length;
  }

  function render() {
    const it = items[idx];
    const j = jawaban[idx];

    el.skor.textContent = skor;
    el.combo.textContent = combo + "×";
    el.nyawa.textContent = "💗".repeat(nyawa) + "🤍".repeat(NYAWA_AWAL - nyawa);
    el.progress.style.width = (jumlahTerjawab() / TOTAL) * 100 + "%";
    el.info.textContent = `Materi ${materi} • ${bank.judul}`;
    el.counter.textContent = `Soal ${idx + 1} / ${TOTAL}`;

    el.tanya.textContent = it.q;

    el.opsi.innerHTML = "";
    it.opsi.forEach((teks, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt-btn";
      b.textContent = `${LABEL[i]}. ${teks}`;
      if (j) {
        b.disabled = true;
        const tandai = (tanda) => {
          b.textContent = "";
          const t = document.createElement("span");
          t.className = "opt-tick";
          t.textContent = tanda;
          const a = document.createElement("span");
          a.className = "opt-ans";
          a.textContent = `${LABEL[i]}. ${teks}`;
          b.append(t, a);
        };
        if (teks === it.benar) {
          b.classList.add("correct");
          tandai("✓ Benar");
        } else if (i === j.pilih) {
          b.classList.add("wrong");
          tandai("✗ Salah");
        } else b.classList.add("dim");
      } else {
        b.addEventListener("click", () => {
          // Hanya membaca OPSI JAWABAN yang diklik
          speakText(teks);
          jawab(i);
        });
      }
      el.opsi.appendChild(b);
    });

    if (!j) {
      el.bubble.textContent = "Ganbatte! Pilih jawaban yang tepat.";
      el.mascot.textContent = "🐱";
      el.feedback.hidden = true;
      el.koreksi.hidden = true;
    } else if (j.ok) {
      const [teks, emo] = PESAN_BENAR[idx % PESAN_BENAR.length];
      el.bubble.textContent = teks;
      el.mascot.textContent = emo;
      el.feedback.hidden = false;
      el.feedback.className = "feedback-box ok";
      el.feedback.textContent = `Jawaban Benar! +${j.poin} Poin`;
      el.koreksi.hidden = false;
      el.koreksi.innerHTML = `
        <div class="c-title">💡 Penjelasan:</div>
        <div class="c-note">${it.e}</div>
      `;
      // Catatan: Penjelasan tidak dibaca oleh AI voice
    } else {
      const [teks, emo] = PESAN_SALAH[idx % PESAN_SALAH.length];
      el.bubble.textContent = teks;
      el.mascot.textContent = emo;
      el.feedback.hidden = false;
      el.feedback.className = "feedback-box wrong";
      el.feedback.textContent = "Jawaban Salah! Nyawa Berkurang 1";

      const kalimat = it.q.replace("____", `<b>${it.benar}</b>`);
      el.koreksi.hidden = false;
      el.koreksi.innerHTML = `
        <div class="c-title">💡 Penjelasan:</div>
        <div>Jawaban benar: <b>${it.benar}</b></div>
        <div class="c-sentence">${kalimat}</div>
        <div class="c-note">${it.e}</div>
      `;
      // Catatan: Penjelasan tidak dibaca oleh AI voice
    }

    el.prev.disabled = idx === 0;
    if (idx < TOTAL - 1) {
      el.next.textContent = "Berikutnya ➡";
      el.next.disabled = false;
    } else {
      el.next.textContent = "Lihat Hasil 🏁";
      el.next.disabled = jumlahTerjawab() < TOTAL;
    }
  }

  function jawab(i) {
    if (!aktif || jawaban[idx]) return;
    const it = items[idx];
    const ok = it.opsi[i] === it.benar;
    let poin = 0;

    if (ok) {
      combo++;
      poin = 10 + (combo > 1 ? (combo - 1) * 2 : 0);
      skor += poin;
    } else {
      combo = 0;
      nyawa = Math.max(0, nyawa - 1);
    }

    jawaban[idx] = { pilih: i, ok, poin };
    if (typeof Sound !== "undefined") {
      ok ? Sound.benar(idx, combo) : Sound.salah(idx);
    }
    render();

    if (nyawa === 0) {
      setTimeout(tampilkanGameOver, 1400);
      return;
    }

    if (jumlahTerjawab() === TOTAL) {
      setTimeout(tampilkanHasil, 1400);
    }
  }

  function pindah(arah) {
    if (!aktif) return;
    const baru = idx + arah;
    if (baru < 0) return;
    if (baru >= TOTAL) {
      if (jumlahTerjawab() === TOTAL) tampilkanHasil();
      return;
    }
    idx = baru;
    render();
    // Otomatis membaca KALIMAT SOAL saat pindah ke nomor berikutnya/sebelumnya
    speakText(items[idx].q);
  }

  function tampilkanGameOver() {
    const benar = jawaban.filter((x) => x && x.ok).length;
    $("hasil-emoji").textContent = "😿";
    $("hasil-judul").textContent = "Nyawa Habis!";
    $("hasil-teks").innerHTML =
      `Materi ${materi}<br>Benar: <b>${benar}</b> / ${TOTAL}<br>Skor: <b>${skor}</b><br>` +
      `Kamu akan mengulang dari soal pertama.`;
    if (typeof Sound !== "undefined") Sound.kalah();
    $("btn-tinjau").hidden = true;
    const lanjut = document.getElementById("btn-materi-lanjut");
    if (lanjut) lanjut.hidden = true;
    el.overlay.hidden = false;
  }

  function tampilkanHasil() {
    $("btn-tinjau").hidden = false;
    const lanjut = document.getElementById("btn-materi-lanjut");
    if (lanjut) lanjut.hidden = false;
    const benar = jawaban.filter((x) => x && x.ok).length;
    let emo = "💪",
      judul = "Terus Berlatih!";
    if (benar === TOTAL) {
      emo = "🏆";
      judul = "Sempurna! Omedetou!";
    } else if (benar >= 8) {
      emo = "🎉";
      judul = "Sugoi! Luar Biasa!";
    } else if (benar >= 6) {
      emo = "😺";
      judul = "Bagus, Sedikit Lagi!";
    }

    if (typeof Sound !== "undefined") Sound.menang();
    try {
      const k = "n4-best-" + materi,
        lama = JSON.parse(sessionStorage.getItem(k) || "null");
      if (
        !lama ||
        benar > lama.benar ||
        (benar === lama.benar && skor > lama.skor)
      ) {
        sessionStorage.setItem(k, JSON.stringify({ benar, skor }));
      }
    } catch (e) {}
    $("hasil-emoji").textContent = emo;
    $("hasil-judul").textContent = judul;
    $("hasil-teks").innerHTML =
      `Materi ${materi}<br>Benar: <b>${benar}</b> / ${TOTAL}<br>Skor akhir: <b>${skor}</b>`;
    el.overlay.hidden = false;
  }

  if (materi < 12) {
    const a = document.createElement("a");
    a.className = "nav-btn";
    a.id = "btn-materi-lanjut";
    a.href = `soal-${materi + 1}.html`;
    a.textContent = "Materi " + (materi + 1) + " ➡";
    document.querySelector(".overlay-actions").appendChild(a);
  }

  el.prev.addEventListener("click", () => pindah(-1));
  el.next.addEventListener("click", () => pindah(1));
  $("btn-tinjau").addEventListener("click", () => {
    el.overlay.hidden = true;
  });
  $("btn-ulang").addEventListener("click", mulai);

  document.addEventListener("keydown", (e) => {
    if (!aktif || !el.overlay.hidden) return;
    if (e.key === "ArrowLeft") pindah(-1);
    if (e.key === "ArrowRight") pindah(1);
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !jawaban[idx]) {
      speakText(items[idx].opsi[n - 1]);
      jawab(n - 1);
    }
  });

  const btnSuara = $("btn-sound");
  function ikonSuara() {
    if (!btnSuara || typeof Sound === "undefined") return;
    btnSuara.textContent = Sound.isMuted() ? "🔇" : "🔊";
  }
  if (btnSuara) {
    if (typeof Sound === "undefined") btnSuara.hidden = true;
    btnSuara.addEventListener("click", () => {
      Sound.toggle();
      ikonSuara();
    });
    ikonSuara();
  }

  function masuk() {
    aktif = true;
    document.body.classList.remove("locked");
    mulai();
  }

  document.body.classList.add("locked");
  if (typeof Akses === "undefined") {
    galat("File <b>akses.js</b> tidak ditemukan.");
    return;
  }
  if (Akses.perluKode(materi) && !Akses.terbuka(materi)) {
    Akses.tampilkanForm(materi, bank.judul, masuk);
  } else {
    masuk();
  }
})();
