/*!
 * lightbox-orig.js —— 灯箱点开时「先顶上缩略图，后台换成高清原图」
 *
 * 【背景】正文里放的现在是缩略图（长边 800，几十 KB，进视口就秒开，不用干等）；
 *   全尺寸原图躺在同一个目录下的「原图/」里，只在点开灯箱时才按需加载。
 *
 * 【约定】同目录下，name.webp 的高清版就是 原图/name.webp：
 *     /about/index/木祈栎.webp        ← 展示用，小图
 *     /about/index/原图/木祈栎.webp    ← 点开灯箱时才加载，全尺寸
 *   按这个约定直接把地址推出来，再静默探一张：拿到了就换上，没有（404）就
 *   什么都不做、保持缩略图。不依赖渲染期做任何标记，所以任何页面、任何图，
 *   只要目录结构对就自动生效 —— 以后铺开到小说正文里的三视图不用再改代码。
 *
 * 【做法】fancybox 打开某张图时：
 *   1. 灯箱先按缩略图显示 —— 用户立刻看到画面，不空等转圈
 *   2. 同时用 new Image() 在后台静默拉原图（不阻塞、不显加载条）
 *   3. 探到后把灯箱里的 <img> 换成原图，并按原图尺寸重算布局 —— 无缝变清晰
 *
 * 【与 lightbox-crisp.js 的配合】那边把 current.width/height 由「自然像素」
 *   改成「自然像素 ÷ DPR」来让放大按物理像素 1:1；换图后尺寸全变了，必须
 *   按同样的口径重算、并把那边缓存的 __vwNat 换成原图的值，否则放大倍率算错。
 *   所以装了 crisp 时跟着除以 DPR，没装就按 fancybox 原本的语义用自然像素。
 *
 * 【回退】删掉本文件，或去掉 _config.butterfly.yml 里对应的 <script> 一行。
 */
(function () {
  'use strict';

  var ORIG_DIR = '原图';

  function dpr() { return window.devicePixelRatio || 1; }

  /* 按目录约定推导原图地址：同目录下多一层「原图/」 */
  function origUrlOf(src) {
    if (!src) return '';
    var p = String(src).split('?')[0].split('#')[0];
    p = p.replace(/^https?:\/\/[^/]+/i, ''); // 去掉协议和域名，只留路径
    var i = p.lastIndexOf('/');
    if (i < 0) return '';
    var dir = p.slice(0, i);
    if (new RegExp('(^|/)' + ORIG_DIR + '$').test(dir)) return ''; // 已经在原图目录里了
    return dir + '/' + ORIG_DIR + p.slice(i);
  }

  function upgrade($, instance, current) {
    if (!current || current.type !== 'image') return;
    if (current.__vwOrigDone) return;

    var orig = origUrlOf(current.src);
    if (!orig) return;
    current.__vwOrigDone = true;

    var probe = new Image();
    probe.onload = function () {
      var $img = (instance.$refs && instance.$refs.image) || $('.fancybox-image');
      if (!$img || !$img.length) return;

      // 与 lightbox-crisp.js 同一口径
      var r = $.fancybox.__vwCrisp ? dpr() : 1;
      current.__vwNat = { w: probe.naturalWidth, h: probe.naturalHeight };
      current.width = Math.max(1, Math.round(probe.naturalWidth / r));
      current.height = Math.max(1, Math.round(probe.naturalHeight / r));

      current.src = orig;       // 让 fancybox 的幻灯片/缩略图后续也认这个地址
      $img.attr('src', orig);   // 真正换上去的那一下
      if (typeof instance.update === 'function') instance.update();
    };
    probe.onerror = function () { /* 没有高清版，保持缩略图，不做任何事 */ };
    probe.src = orig;
  }

  function install($) {
    if (!$.fancybox || $.fancybox.__vwOrigInstalled) return;
    $.fancybox.__vwOrigInstalled = true;

    var d = $.fancybox.defaults;
    var prevAfterShow = d.afterShow;
    d.afterShow = function (instance, current) {
      if (typeof prevAfterShow === 'function') prevAfterShow.apply(this, arguments);
      upgrade($, instance, current);
    };
  }

  /* butterfly 在 main.js 里异步拉 fancybox，等它出现 */
  var tries = 0;
  (function wait() {
    if (window.jQuery && window.jQuery.fancybox) { install(window.jQuery); return; }
    if (++tries > 200) return;
    setTimeout(wait, 100);
  })();
})();
