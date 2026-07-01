/* 顶部“返回”键：优先返回上一个界面，没有历史则回到首页三大模块 */
(function () {
  "use strict";
  var b = document.getElementById("backBtn");
  if (!b) return;
  b.addEventListener("click", function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "index.html";
    }
  });
})();
