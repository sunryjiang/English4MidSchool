/*
 * TTS 桥接：安卓 WebView 不支持 Web Speech API(speechSynthesis)，
 * 这里用 Capacitor 的原生 TextToSpeech 插件伪装出一个 speechSynthesis，
 * 让 vocab.js / reading.js / app.js 里原来的朗读代码无需改动即可发音。
 * 仅在 Capacitor 原生环境下生效；普通浏览器仍用系统自带的 speechSynthesis。
 */
(function () {
  "use strict";
  var Cap = window.Capacitor;
  var isNative = !!(Cap && typeof Cap.isNativePlatform === "function" && Cap.isNativePlatform());
  if (!isNative) return; // 浏览器里不接管，用原生 Web Speech
  var TTS = Cap.Plugins && Cap.Plugins.TextToSpeech;
  if (!TTS) return;

  var voices = [];
  function refreshVoices(cb) {
    if (!TTS.getSupportedVoices) { if (cb) cb(); return; }
    TTS.getSupportedVoices()
      .then(function (r) {
        voices = ((r && r.voices) || []).map(function (v) {
          return { lang: v.lang || "", name: v.name || "", voiceURI: v.voiceURI || v.name || "", default: false };
        });
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }
  refreshVoices();

  // 伪 SpeechSynthesisUtterance
  function Utter(text) {
    this.text = text || "";
    this.lang = "en-US";
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.onend = null;
    this.onerror = null;
    this.onstart = null;
  }
  window.SpeechSynthesisUtterance = Utter;

  var curToken = 0;      // 用于取消：旧任务回调不再触发
  var speakingFlag = false;
  var pausedFlag = false;

  function clampRate(r) {
    r = Number(r) || 1;
    if (r < 0.1) r = 0.1;
    if (r > 2.0) r = 2.0;
    return r;
  }

  var shim = {
    getVoices: function () { return voices; },
    speak: function (u) {
      if (!u) return;
      var token = ++curToken;
      speakingFlag = true;
      pausedFlag = false;
      var lang = (u.voice && u.voice.lang) || u.lang || "en-US";
      if (typeof u.onstart === "function") { try { u.onstart(); } catch (e) {} }
      TTS.speak({
        text: u.text,
        lang: lang,
        rate: clampRate(u.rate),
        pitch: Number(u.pitch) || 1,
        volume: u.volume == null ? 1.0 : Number(u.volume),
        category: "playback"
      })
        .then(function () {
          if (token !== curToken) return; // 已被取消
          speakingFlag = false;
          if (typeof u.onend === "function") { try { u.onend(); } catch (e) {} }
        })
        .catch(function (err) {
          if (token !== curToken) return;
          speakingFlag = false;
          if (typeof u.onerror === "function") { try { u.onerror(err); } catch (e) {} }
          else if (typeof u.onend === "function") { try { u.onend(); } catch (e) {} }
        });
    },
    cancel: function () {
      curToken++;           // 让进行中的任务回调失效，避免误触发“下一句”
      speakingFlag = false;
      pausedFlag = false;
      if (TTS.stop) TTS.stop().catch(function () {});
    },
    // 原生插件不支持真正的暂停/恢复：暂停即停止当前朗读
    pause: function () {
      curToken++;
      speakingFlag = false;
      pausedFlag = true;
      if (TTS.stop) TTS.stop().catch(function () {});
    },
    resume: function () { pausedFlag = false; },
    addEventListener: function (ev, cb) {
      if (ev === "voiceschanged") refreshVoices(cb);
    },
    removeEventListener: function () {},
    get speaking() { return speakingFlag; },
    get paused() { return pausedFlag; },
    get pending() { return false; },
    onvoiceschanged: null
  };

  try {
    Object.defineProperty(window, "speechSynthesis", { value: shim, configurable: true });
  } catch (e) {
    window.speechSynthesis = shim;
  }
})();
