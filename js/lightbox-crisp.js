/*!
 * lightbox-crisp.js —— 让灯箱的「放大到 1:1」按物理像素算，而不是 CSS 像素
 *
 * 【问题】fancybox 3.5 算显示尺寸时全程只用 CSS 像素，从不看 devicePixelRatio：
 *   · getFitPos()     : scale = Math.min(1, 可用宽/自然宽, 可用高/自然高)
 *                       —— 上限锁死为「图片自然 CSS 像素」
 *   · scaleToActual() : 点图放大的目标尺寸 = 自然 CSS 像素
 *   于是在 150% 缩放的屏幕上，所谓「1:1」实际需要 自然像素 × 1.5 个物理像素，
 *   图片被硬拉伸 1.5 倍 → 立绘一点开放大，细节全糊。
 *   （实测：2848×1600 的立绘放大后显示 2848 CSS px，需求 4272 物理 px，倍率 1.500）
 *
 * 【做法】图片加载后，把 current.width / current.height 由「自然像素」改成「自然像素 ÷ DPR」。
 *   fancybox 的适配尺寸、放大目标、拖拽边界全部由这两个值推算，于是一起变成物理像素 1:1：
 *   显示 1899 CSS px × DPR 1.5 = 2848 物理像素 = 图片真实像素数，一个不多一个不少。
 *   不换图、不加载任何新文件，全站所有图片一起受益。
 *
 * 【取舍】物理视口比图片自然像素还大的屏幕上（例如 4K@150%），灯箱里图片会比屏幕小一圈，
 *   换来的是「绝不插值」。反之在小图上没有任何变化。
 *
 * 【回退】删掉本文件，或去掉 _config.butterfly.yml 里对应的 <script> 一行即可。
 */
(function () {
  'use strict';

  function dpr() { return window.devicePixelRatio || 1; }

  /* 把「自然像素」换算成「物理 1:1 对应的 CSS 尺寸」；只做一次，原值缓存在 __vwNat */
  function crisp(cur) {
    if (!cur || cur.type !== 'image') return false;
    if (!cur.width || !cur.height) return false;
    if (!cur.__vwNat) cur.__vwNat = { w: cur.width, h: cur.height };
    var r = dpr();
    cur.width = Math.max(1, Math.round(cur.__vwNat.w / r));
    cur.height = Math.max(1, Math.round(cur.__vwNat.h / r));
    return true;
  }

  function install($) {
    if (!$.fancybox || $.fancybox.__vwCrisp) return;
    $.fancybox.__vwCrisp = true;

    var d = $.fancybox.defaults;
    var prevAfterLoad = d.afterLoad;
    var prevAfterShow = d.afterShow;

    /* 图片加载完成、还没排版的那一刻改掉尺寸，后续计算就全对了 */
    d.afterLoad = function (instance, current) {
      if (typeof prevAfterLoad === 'function') prevAfterLoad.apply(this, arguments);
      crisp(current);
    };

    /* 兜底：万一某些路径在 afterLoad 之前就排完了版，这里再纠正一次 */
    d.afterShow = function (instance, current) {
      if (typeof prevAfterShow === 'function') prevAfterShow.apply(this, arguments);
      if (!crisp(current)) return;
      if (instance && typeof instance.update === 'function') instance.update();
    };

    /* 窗口在不同 DPR 的屏幕之间移动时，缓存值会过期 */
    var lastDpr = dpr();
    window.addEventListener('resize', function () {
      if (dpr() === lastDpr) return;
      lastDpr = dpr();
      var inst = $.fancybox.getInstance();
      if (!inst || !inst.current) return;
      var cur = inst.current;
      if (cur.__vwNat) { cur.width = cur.__vwNat.w; cur.height = cur.__vwNat.h; }
      if (crisp(cur) && typeof inst.update === 'function') inst.update();
    });
  }

  /* butterfly 是在 main.js 里异步拉 fancybox 的，所以等它出现 */
  var tries = 0;
  (function wait() {
    if (window.jQuery && window.jQuery.fancybox) { install(window.jQuery); return; }
    if (++tries > 200) return;
    setTimeout(wait, 100);
  })();
})();
