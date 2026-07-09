/* 四周学习计划：把语法 / 单词 / 阅读排进 28 天 */
(function () {
  "use strict";

  // 每天的语法安排（按“先基础后拓展”的顺序）
  const GRAMMAR = [
    "名词 + 冠词", "代词 + 数词", "形容词 + 副词", "形容词和副词的比较等级",
    "一般现在时", "一般过去时", "一般将来时（+ 本周复习）",
    "现在进行时", "过去进行时", "现在完成时", "介词",
    "连词", "句子成分与五种基本句型", "简单句·并列句·复合句（+ 本周复习）",
    "There be 句型 + 祈使句", "感叹句 + 疑问句", "反意疑问句", "情态动词",
    "宾语从句", "定语从句", "状语从句（+ 本周复习）",
    "被动语态", "动词不定式", "动名词", "主谓一致 + 系动词与表语",
    "直接引语与间接引语", "过去将来时 + 过去完成时（拓展）",
    "综合复习（虚拟语气 / 倒装 / 分词，拓展选学）",
  ];

  // 8 个单词单元（标题 + 词数），与 vocab.json 对应
  const UNITS = [
    ["人物·身体·家庭", 200], ["学校·时间·数字", 200],
    ["食物·健康·家居", 200], ["购物·职业·场所", 200],
    ["自然·动物·动作", 200], ["社会·文化·体育", 200],
    ["核心形容词·动词", 200], ["介词·副词·代词", 180],
  ];
  // 每周用哪两个单元（0 基索引）
  const WEEK_UNITS = { 1: [0, 1], 2: [2, 3], 3: [4, 5], 4: [6, 7] };

  // 把某周“两个单元拼接后”的第 gs..ge 个词，转成可读标签
  function vocabLabel(week, dayInWeek) {
    const [u0, u1] = WEEK_UNITS[week];
    const seq = [
      { title: UNITS[u0][0], size: UNITS[u0][1] },
      { title: UNITS[u1][0], size: UNITS[u1][1] },
    ];
    const total = seq[0].size + seq[1].size;
    const per = Math.ceil(total / 7);
    const gs = dayInWeek * per + 1;
    const ge = Math.min((dayInWeek + 1) * per, total);
    // 映射全局区间到各单元
    const parts = [];
    let offset = 0;
    for (const u of seq) {
      const uStart = offset + 1;
      const uEnd = offset + u.size;
      const s = Math.max(gs, uStart);
      const e = Math.min(ge, uEnd);
      if (s <= e) {
        parts.push(u.title + " 第 " + (s - offset) + "–" + (e - offset) + " 词");
      }
      offset += u.size;
    }
    return parts.join("；");
  }

  const WEEK_TITLE = {
    1: "第 1 周 · 基础词法 + 基本时态（★）",
    2: "第 2 周 · 时态进阶 + 句子基础（★★）",
    3: "第 3 周 · 句式 + 从句 + 情态（★★★）",
    4: "第 4 周 · 语态 + 非谓语 + 综合（★★★★）",
  };

  const box = document.getElementById("planTables");
  for (let week = 1; week <= 4; week++) {
    const sec = document.createElement("section");
    sec.className = "plan-week";
    let html = '<h2 class="pw-title">' + WEEK_TITLE[week] + "</h2>";
    html +=
      '<table class="plan-table"><thead><tr>' +
      "<th>天</th><th>语法（打地基）</th><th>背单词</th><th>分级阅读</th>" +
      "</tr></thead><tbody>";
    for (let d = 0; d < 7; d++) {
      const day = (week - 1) * 7 + d + 1;
      html +=
        "<tr>" +
        '<td class="pt-day">Day ' + day + "</td>" +
        '<td><a href="grammar.html">' + GRAMMAR[day - 1] + "</a></td>" +
        "<td>" + vocabLabel(week, d) + "</td>" +
        '<td><a href="reading.html#/' + day + '">Day ' + day + " 阅读</a></td>" +
        "</tr>";
    }
    html += "</tbody></table>";
    sec.innerHTML = html;
    box.appendChild(sec);
  }
})();
