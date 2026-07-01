/* 初中英语语法学习网站 —— 交互逻辑 */
(function () {
  "use strict";

  let DATA = { categories: [], items: [] };
  let currentIndex = -1;

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // ---------- 加载数据 ----------
  fetch("data.json?v=" + Date.now())
    .then((r) => {
      if (!r.ok) throw new Error("无法加载 data.json");
      return r.json();
    })
    .then((json) => {
      DATA = json;
      buildNav();
      buildHome();
      handleHash();
    })
    .catch((err) => {
      $("#home").innerHTML =
        '<h1>加载失败</h1><p>请通过本地服务器打开本页面（不要直接双击 HTML 文件）。<br>' +
        "错误：" + err.message + "</p>";
    });

  // ---------- 侧栏导航 ----------
  function buildNav() {
    const nav = $("#nav");
    nav.innerHTML = "";
    DATA.categories.forEach((cat) => {
      const group = el("div", "cat-group");
      group.appendChild(el("div", "cat-title", cat));
      DATA.items.forEach((it, idx) => {
        if (it.category !== cat) return;
        const item = el("div", "nav-item");
        item.dataset.index = idx;
        item.dataset.title = it.title;
        item.appendChild(el("span", "num", it.id));
        item.appendChild(el("span", null, stripExt(it.title)));
        item.addEventListener("click", () => {
          location.hash = "#/" + idx;
        });
        group.appendChild(item);
      });
      nav.appendChild(group);
    });
  }

  function stripExt(title) {
    return title.replace(/\s*\(.*?\)\s*/g, " ").replace(/【拓展】/g, "").trim();
  }

  // ---------- 首页 ----------
  function buildHome() {
    const totalItems = DATA.items.length;
    const totalEx = DATA.items.reduce((s, it) => s + it.exercises.length, 0);
    const stats = $("#homeStats");
    stats.innerHTML = "";
    [
      [DATA.categories.length, "大类"],
      [totalItems, "知识点"],
      [totalEx, "练习题"],
    ].forEach(([n, l]) => {
      const c = el("div", "stat-card");
      c.appendChild(el("div", "n", n));
      c.appendChild(el("div", "l", l));
      stats.appendChild(c);
    });

    const cats = $("#homeCats");
    cats.innerHTML = "";
    DATA.categories.forEach((cat) => {
      const box = el("div", "home-cat");
      box.appendChild(el("h3", null, cat));
      DATA.items.forEach((it, idx) => {
        if (it.category !== cat) return;
        const a = el("a", null, it.id + "  " + stripExt(it.title));
        a.addEventListener("click", () => (location.hash = "#/" + idx));
        box.appendChild(a);
      });
      cats.appendChild(box);
    });
  }

  // ---------- 路由 ----------
  window.addEventListener("hashchange", handleHash);
  function handleHash() {
    const m = location.hash.match(/^#\/(\d+)$/);
    if (m) {
      showLesson(parseInt(m[1], 10));
    } else {
      showHome();
    }
    closeSidebar();
  }

  function showHome() {
    currentIndex = -1;
    Teach.stop();
    const tt = $("#teachToggle"); if (tt) tt.disabled = true;
    $("#home").classList.remove("hidden");
    $("#lesson").classList.add("hidden");
    setActiveNav(-1);
    window.scrollTo(0, 0);
  }

  // ---------- 渲染知识点 ----------
  function showLesson(idx) {
    const it = DATA.items[idx];
    if (!it) return showHome();
    currentIndex = idx;
    Teach.stop();
    const tt = $("#teachToggle"); if (tt) tt.disabled = false;
    $("#home").classList.add("hidden");
    const lesson = $("#lesson");
    lesson.classList.remove("hidden");
    lesson.innerHTML = "";

    const isExt = /【拓展】|\(拓展\)/.test(it.title);
    const h = el("h1", "lesson-title");
    h.appendChild(document.createTextNode(stripExt(it.title)));
    if (isExt) h.appendChild(el("span", "tag-ext", "拓展"));
    lesson.appendChild(h);
    lesson.appendChild(el("div", "lesson-cat", it.category + " · " + it.id));

    const isPhon = /音标|语音/.test(it.category);
    lesson.dataset.phon = isPhon ? "1" : "0";
    it.sections.forEach((sec) => {
      lesson.appendChild(el("div", "sec-heading", sec.heading));
      sec.blocks.forEach((b) => lesson.appendChild(renderBlock(b, isPhon)));
    });

    if (it.exercises.length) lesson.appendChild(renderPractice(it));

    lesson.appendChild(renderFooterNav(idx));

    setActiveNav(idx);
    window.scrollTo(0, 0);
  }

  function renderBlock(b, isPhon) {
    switch (b.kind) {
      case "sub":
        return el("div", "b-sub", b.text);
      case "para":
        return el("p", "b-para", b.text);
      case "bullet":
        return el("div", "b-bullet", b.text);
      case "eg":
        return el("div", "b-eg", b.text);
      case "note":
        return el("div", "b-note", b.text);
      case "table":
        return renderTable(b, isPhon);
      default:
        return el("p", "b-para", b.text || "");
    }
  }

  function renderTable(b, isPhon) {
    const table = el("table", "g-table");
    const thead = el("thead");
    const trh = el("tr");
    b.headers.forEach((hd) => trh.appendChild(el("th", null, hd)));
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = el("tbody");
    b.rows.forEach((row) => {
      const tr = el("tr");
      row.forEach((cell) => {
        const td = el("td", null, cell);
        if (isPhon) {
          const ipas = cell.match(/\/[^/]+\//g);
          if (ipas) {
            ipas.forEach((sym) => {
              const btn = el("button", "spk", "🔊");
              btn.title = "播放音标发音：" + sym;
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                speakPhoneme(sym);
              });
              td.appendChild(document.createTextNode(" "));
              td.appendChild(btn);
            });
          }
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  // ---------- 练习区 ----------
  function renderPractice(it) {
    const wrap = el("div", "practice");
    wrap.appendChild(el("h2", null, "巩固练习"));
    if (it.instruction) wrap.appendChild(el("div", "instruction", it.instruction));

    const inputs = [];
    it.exercises.forEach((ex, i) => {
      const item = el("div", "q-item");
      const qtext = el("div", "q-text");
      qtext.appendChild(el("span", "q-num", i + 1 + "."));
      qtext.appendChild(document.createTextNode(" " + ex.q));
      item.appendChild(qtext);

      const input = el("input", "q-input");
      input.type = "text";
      input.placeholder = "在此输入答案…";
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") checkOne(i);
      });
      item.appendChild(input);

      const fb = el("div", "q-feedback");
      item.appendChild(fb);

      inputs.push({ input, fb, ex });
      wrap.appendChild(item);
    });

    function checkOne(i) {
      const { input, fb, ex } = inputs[i];
      const val = input.value.trim();
      if (!val) {
        input.classList.remove("correct", "wrong");
        fb.className = "q-feedback";
        fb.textContent = "";
        return false;
      }
      const ok = isCorrect(val, ex.answer);
      input.classList.toggle("correct", ok);
      input.classList.toggle("wrong", !ok);
      fb.className = "q-feedback " + (ok ? "ok" : "no");
      fb.innerHTML = "";
      if (ok) {
        fb.appendChild(document.createTextNode("✓ 正确"));
      } else {
        fb.appendChild(document.createTextNode("✗ 参考答案："));
        fb.appendChild(el("span", "ans", ex.answer));
      }
      if (ex.tip) fb.appendChild(el("span", "tip", "（" + ex.tip + "）"));
      return ok;
    }

    const actions = el("div", "practice-actions");
    const checkBtn = el("button", "btn btn-primary", "提交并批改");
    const answerBtn = el("button", "btn btn-ghost", "显示答案");
    const resetBtn = el("button", "btn btn-ghost", "清空重做");
    const score = el("span", "score", "");

    checkBtn.addEventListener("click", () => {
      let correct = 0;
      inputs.forEach((_, i) => {
        if (checkOne(i)) correct++;
      });
      score.textContent = "得分：" + correct + " / " + inputs.length;
    });

    answerBtn.addEventListener("click", () => {
      inputs.forEach(({ input, fb, ex }) => {
        if (!input.value.trim()) input.value = firstAnswer(ex.answer);
        input.classList.remove("wrong");
        input.classList.add("correct");
        fb.className = "q-feedback ok";
        fb.innerHTML = "";
        fb.appendChild(document.createTextNode("参考答案："));
        fb.appendChild(el("span", "ans", ex.answer));
        if (ex.tip) fb.appendChild(el("span", "tip", "（" + ex.tip + "）"));
      });
      score.textContent = "";
    });

    resetBtn.addEventListener("click", () => {
      inputs.forEach(({ input, fb }) => {
        input.value = "";
        input.classList.remove("correct", "wrong");
        fb.className = "q-feedback";
        fb.textContent = "";
      });
      score.textContent = "";
    });

    actions.appendChild(checkBtn);
    actions.appendChild(answerBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(score);
    wrap.appendChild(actions);
    return wrap;
  }

  // ---------- 答案比对 ----------
  function normalize(s) {
    return s
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[。.]+$/, "")
      .trim();
  }

  function firstAnswer(answer) {
    // 取第一个可用答案，用于“显示答案”自动填入
    return answer.split(/\s*\/\s*/)[0].trim();
  }

  function isCorrect(input, answer) {
    const val = normalize(input);
    // 答案可能含多种正确形式，用 / 分隔；有的答案本身含空格（如 "have finished"）
    const candidates = [];
    candidates.push(answer);
    answer.split(/\s*\/\s*/).forEach((a) => candidates.push(a));
    // 处理形如 "Does / do" 组合作答的情况：也接受去掉斜杠后整体
    candidates.push(answer.replace(/\s*\/\s*/g, " "));
    return candidates.some((c) => normalize(c) === val);
  }

  // ---------- 底部上一/下一 ----------
  function renderFooterNav(idx) {
    const nav = el("div", "lesson-footer-nav");
    const prev = el("button", null, "← 上一个");
    const next = el("button", null, "下一个 →");
    prev.disabled = idx <= 0;
    next.disabled = idx >= DATA.items.length - 1;
    prev.addEventListener("click", () => (location.hash = "#/" + (idx - 1)));
    next.addEventListener("click", () => (location.hash = "#/" + (idx + 1)));
    nav.appendChild(prev);
    nav.appendChild(next);
    return nav;
  }

  function setActiveNav(idx) {
    document.querySelectorAll(".nav-item").forEach((n) => {
      n.classList.toggle("active", parseInt(n.dataset.index, 10) === idx);
    });
  }

  // ---------- 搜索 ----------
  $("#searchInput").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".nav-item").forEach((n) => {
      const t = (n.dataset.title || "").toLowerCase();
      n.classList.toggle("hidden", q && t.indexOf(q) === -1);
    });
    document.querySelectorAll(".cat-group").forEach((g) => {
      const anyVisible = g.querySelector(".nav-item:not(.hidden)");
      g.style.display = anyVisible ? "" : "none";
    });
  });

  // ---------- 移动端侧栏 ----------
  $("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
    $("#overlay").classList.toggle("show");
  });
  $("#overlay").addEventListener("click", closeSidebar);
  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#overlay").classList.remove("show");
  }

  // ================= 语音：音标发音 + 课堂讲解 =================
  const synth = window.speechSynthesis || null;
  let VOICES = [];
  function loadVoices() {
    if (synth) VOICES = synth.getVoices() || [];
  }
  if (synth) {
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
  }
  function pickVoice(kind) {
    if (!VOICES.length) loadVoices();
    const pref = kind === "en" ? "en" : "zh";
    return VOICES.find((v) => (v.lang || "").toLowerCase().indexOf(pref) === 0) || null;
  }

  // 音标 → 近似发音串（浏览器无标准音标音频时的后备方案）
  const IPA_SOUND = {
    // 单元音
    "iː": "ee", "ɪ": "ih", "uː": "oo", "ʊ": "uh", "ɜː": "ur", "ə": "uh",
    "ɔː": "or", "ɒ": "o", "ɑː": "ah", "ʌ": "uh", "e": "eh", "æ": "aa",
    // 双元音
    "eɪ": "ay", "aɪ": "eye", "ɔɪ": "oy", "aʊ": "ow", "əʊ": "oh",
    "ɪə": "ear", "eə": "air", "ʊə": "oor", "juː": "you",
    // 辅音
    "p": "puh", "b": "buh", "t": "tuh", "d": "duh", "k": "kuh", "g": "guh",
    "f": "fff", "v": "vvv", "s": "sss", "z": "zzz", "θ": "th", "ð": "th",
    "ʃ": "shh", "ʒ": "zh", "tʃ": "ch", "dʒ": "juh",
    "m": "mmm", "n": "nnn", "ŋ": "ng", "h": "huh",
    "l": "luh", "r": "ruh", "w": "wuh", "j": "yuh",
  };

  function ipaApprox(sym) {
    const key = String(sym).replace(/\//g, "").trim();
    return IPA_SOUND[key] || key;
  }

  // 音标 → 音频文件 slug（各字符 Unicode 码点，4 位小写十六进制，用 - 连接）
  function ipaSlug(sym) {
    const key = String(sym).replace(/\//g, "").trim();
    const parts = [];
    for (const ch of key) {
      parts.push(("0000" + ch.codePointAt(0).toString(16)).slice(-4));
    }
    return parts.join("-");
  }

  let currentAudio = null;

  // 音标发音：优先播放真实音标音频文件；失败则回退到近似 TTS
  function speakPhoneme(sym) {
    Teach.stop();
    if (synth) synth.cancel();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    const audio = new Audio("audio/" + ipaSlug(sym) + ".wav?v=3");
    currentAudio = audio;
    audio.play().catch(() => {
      // 音频不可用时回退
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(ipaApprox(sym));
      u.lang = "en-US";
      const v = pickVoice("en");
      if (v) u.voice = v;
      u.rate = 0.6;
      synth.speak(u);
    });
  }

  // 把中英文混合文本切分成分别用中/英语音朗读的片段
  function segmentText(text) {
    const segs = [];
    let cur = "";
    let ascii = null;
    for (const ch of text) {
      if (/[A-Za-z]/.test(ch)) {
        if (ascii === false && cur.trim()) {
          segs.push({ t: cur, lang: "zh" });
          cur = "";
        }
        ascii = true;
        cur += ch;
      } else if (/[\u4e00-\u9fff]/.test(ch)) {
        if (ascii === true && cur.trim()) {
          segs.push({ t: cur, lang: "en" });
          cur = "";
        }
        ascii = false;
        cur += ch;
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) segs.push({ t: cur, lang: ascii ? "en" : "zh" });
    return segs.filter((s) => /[A-Za-z\u4e00-\u9fff]/.test(s.t));
  }

  function tableToSpeech(table) {
    return Array.from(table.querySelectorAll("tbody tr"))
      .map((tr) =>
        Array.from(tr.children)
          .map((td) => td.textContent.replace("🔊", "").trim())
          .filter(Boolean)
          .join("，")
      )
      .join("。");
  }

  // 音标表格的一行 → 一组“上课”播报项：先播每个音标的真实音频，再朗读例词
  function phoneticRowItems(tr) {
    const items = [];
    Array.from(tr.children).forEach((td) => {
      const raw = td.textContent.replace(/🔊/g, "").trim();
      if (!raw) return;
      const ipas = raw.match(/\/[^/]+\//g);
      if (ipas) {
        ipas.forEach((sym) =>
          items.push({ kind: "audio", src: "audio/" + ipaSlug(sym) + ".wav?v=3", ipa: sym, el: tr })
        );
      } else {
        const words = raw.match(/[A-Za-z]+/g);
        if (words) items.push({ kind: "tts", text: words.join(", "), lang: "en", el: tr });
        // 纯中文单元格（长/短/规则说明）跳过
      }
    });
    return items;
  }

  const Teach = {
    list: [],
    idx: 0,
    playing: false,
    paused: false,
    curEl: null,
    audio: null,
    build() {
      const lesson = $("#lesson");
      if (!lesson || lesson.classList.contains("hidden")) return [];
      const phon = lesson.dataset.phon === "1";
      const sel =
        ".lesson-title, .sec-heading, .b-sub, .b-para, .b-bullet, .b-eg, .b-note, table.g-table";
      const out = [];
      Array.from(lesson.querySelectorAll(sel)).forEach((elm) => {
        if (elm.tagName === "TABLE") {
          if (phon) {
            // 音标表：逐行播报“音标真实音频 + 例词”，并逐行高亮
            Array.from(elm.querySelectorAll("tbody tr")).forEach((tr) => {
              phoneticRowItems(tr).forEach((it) => out.push(it));
            });
          } else {
            const text = tableToSpeech(elm);
            segmentText(text).forEach((seg) =>
              out.push({ kind: "tts", text: seg.t.trim(), lang: seg.lang, el: elm })
            );
          }
          return;
        }
        const text = elm.textContent.trim();
        if (!text) return;
        segmentText(text).forEach((seg) =>
          out.push({ kind: "tts", text: seg.t.trim(), lang: seg.lang, el: elm })
        );
      });
      return out.filter((x) => x.kind === "audio" || x.text);
    },
    start() {
      this.list = this.build();
      if (!this.list.length) return;
      if (!synth && !this.list.some((x) => x.kind === "audio")) {
        alert("当前浏览器不支持语音播放，请用 Chrome 或 Edge 打开。");
        return;
      }
      this.idx = 0;
      this.playing = true;
      this.paused = false;
      updateTeachUI();
      this._next();
    },
    _next() {
      if (!this.playing) return;
      if (this.idx >= this.list.length) {
        this.stop(true);
        return;
      }
      const item = this.list[this.idx];
      this._highlight(item.el);
      const advance = () => {
        if (this.playing) {
          this.idx++;
          this._next();
        }
      };
      if (item.kind === "audio") {
        const audio = new Audio(item.src);
        this.audio = audio;
        audio.onended = advance;
        audio.onerror = () => {
          // 音频缺失时退化为近似 TTS
          this.audio = null;
          if (!synth) return advance();
          const u = new SpeechSynthesisUtterance(ipaApprox(item.ipa));
          u.lang = "en-US";
          const v = pickVoice("en");
          if (v) u.voice = v;
          u.rate = 0.6;
          u.onend = advance;
          u.onerror = advance;
          synth.speak(u);
        };
        audio.play().catch(() => audio.onerror());
        return;
      }
      // 文本朗读
      if (!synth) return advance();
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = item.lang === "en" ? "en-US" : "zh-CN";
      const v = pickVoice(item.lang);
      if (v) u.voice = v;
      u.rate = item.lang === "en" ? 0.9 : 1.0;
      u.onend = advance;
      u.onerror = advance;
      synth.speak(u);
    },
    pause() {
      if (this.playing && !this.paused) {
        if (synth) synth.pause();
        if (this.audio) this.audio.pause();
        this.paused = true;
        updateTeachUI();
      }
    },
    resume() {
      if (this.playing && this.paused) {
        if (synth) synth.resume();
        if (this.audio) this.audio.play().catch(() => {});
        this.paused = false;
        updateTeachUI();
      }
    },
    stop() {
      if (synth) synth.cancel();
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      this.playing = false;
      this.paused = false;
      this.idx = 0;
      this._highlight(null);
      updateTeachUI();
    },
    _highlight(elm) {
      if (this.curEl) this.curEl.classList.remove("teaching");
      this.curEl = elm;
      if (elm) {
        elm.classList.add("teaching");
        elm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
  };

  function updateTeachUI() {
    const toggle = $("#teachToggle");
    const stop = $("#teachStop");
    if (!toggle) return;
    if (!Teach.playing) {
      toggle.textContent = "▶ 开始上课";
      if (stop) stop.style.display = "none";
    } else if (Teach.paused) {
      toggle.textContent = "▶ 继续";
      if (stop) stop.style.display = "";
    } else {
      toggle.textContent = "⏸ 暂停";
      if (stop) stop.style.display = "";
    }
  }

  // 返回键：知识点内 → 返回语法首页；已在语法首页 → 返回三大模块首页
  (function wireBack() {
    const b = $("#backBtn");
    if (!b) return;
    b.addEventListener("click", () => {
      if (currentIndex >= 0) {
        showHome();
        if (history.replaceState) history.replaceState(null, "", location.pathname);
        else location.hash = "";
      } else {
        location.href = "index.html";
      }
    });
  })();

  (function wireTeach() {
    const toggle = $("#teachToggle");
    const stop = $("#teachStop");
    if (toggle) {
      toggle.addEventListener("click", () => {
        if (currentIndex < 0) return;
        if (!Teach.playing) Teach.start();
        else if (Teach.paused) Teach.resume();
        else Teach.pause();
      });
    }
    if (stop) stop.addEventListener("click", () => Teach.stop());
  })();
})();
