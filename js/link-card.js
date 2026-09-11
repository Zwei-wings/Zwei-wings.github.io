/* link-card.js · 链接卡片并排布局（2026-09-11）
 * 问题背景：butterfly 把每张 {% link %} 渲染成
 *   <div style="display:inline-block"><a class="link-card">…</a></div>
 * 多张是各自 wrapper 的【兄弟】。之前用 CSS :has() 兄弟检测，
 * 在部分浏览器上嵌套 :has() 整条失效 → 多卡被单卡规则钉成 block 整行 → 全堆单列。
 * 这里改用 JS 在渲染后遍历、按"相邻 wrapper"分组打 class，彻底绕开 :has()：
 *   .link-card-wrap = 单卡（独占整行）
 *   .link-multi     = 同组 ≥2 张（并排，每张约 31%）
 * 视觉样式（描边/配色）仍由 custom.css 的 a.link-card 规则负责，本文件只管布局。
 */
(function () {
  // 判断某个 DIV 是否直接包着 a.link-card（不用 :has / :scope，兼容性最好）
  function hasDirectCard(div) {
    if (!div || div.tagName !== 'DIV') return false;
    var kids = div.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.tagName === 'A' && k.classList && k.classList.contains('link-card')) return true;
    }
    return false;
  }

  function layout(root) {
    root = root || document;
    // 1) 收集所有含卡片的容器的直接父级（去重）
    var parents = [];
    var cards = root.querySelectorAll('a.link-card');
    for (var c = 0; c < cards.length; c++) {
      var w = cards[c].parentElement;
      if (!w || w.tagName !== 'DIV') continue;
      var p = w.parentElement;
      if (p && parents.indexOf(p) === -1) parents.push(p);
    }
    // 2) 在每个父级内，把【相邻】的卡片 wrapper 当作一组
    parents.forEach(function (parent) {
      var kids = Array.prototype.slice.call(parent.children);
      var group = [];
      function flush() {
        if (group.length >= 2) {
          group.forEach(function (el) {
            el.classList.remove('link-card-wrap');
            el.classList.add('link-multi');
          });
        } else if (group.length === 1) {
          group[0].classList.add('link-card-wrap');
        }
        group = [];
      }
      kids.forEach(function (kid) {
        if (hasDirectCard(kid)) group.push(kid);
        else flush();
      });
      flush();
    });
  }

  function init() { layout(document); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // butterfly 用 pjax 局部刷新文章，切换后重新布局
  document.addEventListener('pjax:complete', function () { setTimeout(init, 60); });
  window.addEventListener('load', init);
})();
