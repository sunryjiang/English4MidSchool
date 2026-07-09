/* 分级阅读：点读 + 中英对照 + 理解填空 + 全文朗读 */
(function () {
  "use strict";

  const synth = window.speechSynthesis || null;
  let voices = [];
  function loadVoices() {
    if (synth) voices = synth.getVoices() || [];
  }
  loadVoices();
  if (synth && typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = loadVoices;
  }
  function pickEnVoice() {
    if (!voices.length) loadVoices();
    return (
      voices.find((v) => /en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  }
  function speakOne(text, rate, onend) {
    if (!synth) return onend && onend();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const v = pickEnVoice();
    if (v) u.voice = v;
    u.rate = rate || 0.9;
    if (onend) {
      u.onend = onend;
      u.onerror = onend;
    }
    synth.speak(u);
  }
  function speak(text, rate) {
    if (!synth) {
      alert("当前浏览器不支持语音朗读，请用 Chrome 或 Edge 打开。");
      return;
    }
    synth.cancel();
    speakOne(text, rate);
  }

  const STARS = (n) => "★".repeat(n) + "☆".repeat(4 - n);
  const els = {
    nav: document.getElementById("readNav"),
    main: document.getElementById("reading"),
    readAll: document.getElementById("readAll"),
    readStop: document.getElementById("readStop"),
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
  };

  let DATA = null;
  let cur = null;

  fetch("reading.json?v=" + Date.now())
    .then((r) => {
      if (!r.ok) throw new Error("无法加载 reading.json");
      return r.json();
    })
    .then((json) => {
      DATA = json;
      buildNav();
      if (location.hash) showDay(parseInt(location.hash.slice(2), 10));
    })
    .catch((e) => {
      els.main.innerHTML =
        '<div class="vocab-empty">加载失败：' + e.message + "</div>";
    });

  function buildNav() {
    const weeks = {};
    DATA.items.forEach((it) => {
      (weeks[it.week] = weeks[it.week] || []).push(it);
    });
    els.nav.innerHTML = "";
    Object.keys(weeks)
      .sort((a, b) => a - b)
      .forEach((wk) => {
        const g = document.createElement("div");
        g.className = "nav-group";
        const lvl = weeks[wk][0].level;
        g.innerHTML =
          '<div class="nav-cat">第 ' + wk + " 周 <span class=\"nav-star\">" +
          STARS(lvl) + "</span></div>";
        weeks[wk].forEach((it) => {
          const a = document.createElement("a");
          a.className = "nav-link";
          a.href = "#/" + it.day;
          a.innerHTML =
            '<span class="nl-day">Day ' + it.day + "</span> " + it.title;
          a.onclick = () => closeSidebar();
          g.appendChild(a);
        });
        els.nav.appendChild(g);
      });
  }

  window.addEventListener("hashchange", () => {
    if (location.hash) showDay(parseInt(location.hash.slice(2), 10));
  });

  function showDay(day) {
    stopReading();
    const it = DATA.items.find((x) => x.day === day);
    if (!it) return;
    cur = it;
    Array.from(els.nav.querySelectorAll(".nav-link")).forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === "#/" + day)
    );

    let html =
      '<div class="read-head">' +
      '<div class="rh-meta">Day ' + it.day + " · 第 " + it.week +
      " 周 · " + STARS(it.level) + " · " + it.wordCount + " 词" +
      (it.theme ? " · " + it.theme : "") + "</div>" +
      "<h1>" + it.title + "</h1>" +
      "</div>";

    // 正文（逐句点读 + 中英对照）
    html += '<div class="read-body">';
    it.sentences.forEach((s, i) => {
      html +=
        '<p class="rsent" data-i="' + i + '">' +
        '<span class="rs-spk" data-i="' + i + '">🔊</span> ' +
        '<span class="rs-en">' + s.en + "</span>" +
        '<span class="rs-cn">' + s.cn + "</span>" +
        "</p>";
    });
    html += "</div>";

    // 生词
    if (it.words && it.words.length) {
      html += '<h3 class="read-h3">生词表</h3><div class="word-grid">';
      it.words.forEach((w) => {
        html +=
          '<div class="wg-item"><span class="wg-spk" data-w="' +
          encodeURIComponent(w.word) + '">🔊</span> <b>' + w.word + "</b>" +
          (w.ipa ? ' <span class="wg-ipa">/' + w.ipa + "/</span>" : "") +
          " <i>" + (w.pos || "") + "</i> " + (w.cn || "") + "</div>";
      });
      html += "</div>";
    }

    // 理解练习
    if (it.questions && it.questions.length) {
      html += '<h3 class="read-h3">读后理解 · 填空</h3>';
      html += '<ol class="ex-list">';
      it.questions.forEach((q, i) => {
        html +=
          '<li class="ex-item">' +
          '<div class="ex-q">' + q.q + "</div>" +
          '<div class="ex-row">' +
          '<input class="ex-input" data-i="' + i + '" type="text" placeholder="输入答案" />' +
          '<button class="ex-check" data-i="' + i + '">检查</button>' +
          '<span class="ex-feedback" data-i="' + i + '"></span>' +
          "</div>" +
          '<div class="ex-tip" data-i="' + i + '" style="display:none"></div>' +
          "</li>";
      });
      html += "</ol>";
      html +=
        '<div class="ex-actions"><button id="checkAll" class="cc-btn primary">全部检查</button>' +
        '<span id="exScore" class="ex-score"></span></div>';
    }

    els.main.innerHTML = html;
    els.readAll.disabled = false;
    wireEvents(it);
    window.scrollTo(0, 0);
  }

  function wireEvents(it) {
    // 句子点读
    els.main.querySelectorAll(".rs-spk").forEach((sp) => {
      sp.onclick = () => {
        const i = +sp.dataset.i;
        speak(it.sentences[i].en, 0.9);
      };
    });
    // 生词点读
    els.main.querySelectorAll(".wg-spk").forEach((sp) => {
      sp.onclick = () => speak(decodeURIComponent(sp.dataset.w), 0.85);
    });
    // 练习判分
    const norm = (s) =>
      (s || "").trim().toLowerCase().replace(/[.。!！?？,，]/g, "");
    const isCorrect = (input, answer) => {
      const a = norm(input);
      if (!a) return false;
      return answer
        .split("/")
        .map((x) => norm(x))
        .some((x) => x === a);
    };
    function check(i) {
      const input = els.main.querySelector('.ex-input[data-i="' + i + '"]');
      const fb = els.main.querySelector('.ex-feedback[data-i="' + i + '"]');
      const tip = els.main.querySelector('.ex-tip[data-i="' + i + '"]');
      const q = it.questions[i];
      if (isCorrect(input.value, q.a)) {
        fb.textContent = "✓ 正确";
        fb.className = "ex-feedback ok";
        input.classList.remove("wrong");
        input.classList.add("right");
      } else {
        fb.textContent = "✗ 正确答案：" + q.a;
        fb.className = "ex-feedback no";
        input.classList.add("wrong");
      }
      if (q.tip) {
        tip.textContent = "提示：" + q.tip;
        tip.style.display = "block";
      }
    }
    els.main.querySelectorAll(".ex-check").forEach((b) => {
      b.onclick = () => check(+b.dataset.i);
    });
    els.main.querySelectorAll(".ex-input").forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") check(+inp.dataset.i);
      });
    });
    const checkAll = document.getElementById("checkAll");
    if (checkAll) {
      checkAll.onclick = () => {
        let right = 0;
        it.questions.forEach((q, i) => {
          check(i);
          const input = els.main.querySelector('.ex-input[data-i="' + i + '"]');
          if (isCorrect(input.value, q.a)) right++;
        });
        document.getElementById("exScore").textContent =
          "得分：" + right + " / " + it.questions.length;
      };
    }
  }

  // ---------- 全文朗读 ----------
  let reading = false;
  let readIdx = 0;
  function highlight(i) {
    els.main.querySelectorAll(".rsent").forEach((p) =>
      p.classList.toggle("reading", +p.dataset.i === i)
    );
  }
  function readNext() {
    if (!reading || !cur) return;
    if (readIdx >= cur.sentences.length) {
      stopReading();
      return;
    }
    highlight(readIdx);
    const el = els.main.querySelector('.rsent[data-i="' + readIdx + '"]');
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    speakOne(cur.sentences[readIdx].en, 0.9, () => {
      if (reading) {
        readIdx++;
        readNext();
      }
    });
  }
  function startReading() {
    if (!cur || !synth) {
      if (!synth) alert("当前浏览器不支持语音朗读，请用 Chrome 或 Edge 打开。");
      return;
    }
    synth.cancel();
    reading = true;
    readIdx = 0;
    els.readAll.style.display = "none";
    els.readStop.style.display = "";
    readNext();
  }
  function stopReading() {
    reading = false;
    if (synth) synth.cancel();
    highlight(-1);
    els.readAll.style.display = "";
    els.readStop.style.display = "none";
  }
  els.readAll.onclick = startReading;
  els.readStop.onclick = stopReading;

  function closeSidebar() {
    els.sidebar.classList.remove("open");
    els.overlay.classList.remove("show");
  }
})();
