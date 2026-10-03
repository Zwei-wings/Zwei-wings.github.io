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
 *   3. 探到后把「当前这一张」的 <img> 换成原图，并按原图尺寸重算布局 —— 无缝变清晰
 *   4. 原图超过 TIP_DELAY 还没到，就在图片上边缘外侧浮一条「高清原图加载中…」，
 *      免得读者以为现在看到的就是原图、根本不等；原图到位（或确认没有）后自动淡出
 *
 * 【⚠ 铁律】fancybox 在 DOM 里同时保留「上一张 / 当前 / 下一张」三个 slide 的
 *   <img>（供左右滑动复用）。所以只能用 current.$image 这个局部引用，
 *   绝对不能用 $('.fancybox-image') 这类全局选择器 —— 那会一次把三张图全改成
 *   同一张原图，等切回去时「内容已经是别人的、尺寸还按自己的算」，比例直接崩坏。
 *   （另外 instance.$refs 里只有 container 一个键，没有 image，别去碰。）
 *
 * 【与 lightbox-crisp.js 的配合】那边把 current.width/height 由「自然像素」
 *   改成「自然像素 ÷ DPR」来让放大按物理像素 1:1；换图后尺寸全变了，必须
 *   按同样的口径重算、并把那边缓存的 __vwNat 换成原图的值，否则放大倍率算错。
 *   所以装了 crisp 时跟着除以 DPR，没装就按 fancybox 原本的语义用自然像素。
 *
 * 【回退】删掉本文件，或去掉 _config.butterfly.yml 里对应的 <script> 一行。
 *   只想去掉提示、保留原图功能：把下面 TIP_DELAY 改成 0 即可。
 */
(function () {
  'use strict';

  var ORIG_DIR = '原图';
  var TIP_DELAY = 400;   // 原图超过这么久还没到才浮出提示，避免秒开的图闪一下
  var TIP_GAP = 10;      // 提示与图片边缘的间距

  var $jq = null;
  var tip = null, tipTimer = null, followTimer = null;

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

  /* ==================== 加载提示 ==================== */

  function ensureCss() {
    if (document.getElementById('vw-orig-tip-css')) return;
    var s = document.createElement('style');
    s.id = 'vw-orig-tip-css';
    s.textContent = [
      '.vw-orig-tip{position:absolute;left:50%;transform:translateX(-50%);z-index:20;',
      'display:flex;align-items:center;gap:7px;padding:5px 13px 5px 11px;border-radius:999px;',
      'background:rgba(18,18,20,.76);color:#f2f2f2;font-family:inherit;font-size:12px;line-height:1.5;',
      'white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .22s ease}',
      '.vw-orig-tip.is-on{opacity:1}',
      '.vw-orig-tip i{display:block;flex:none;width:11px;height:11px;border-radius:50%;',
      'border:1.5px solid rgba(255,255,255,.28);border-top-color:#f2f2f2;',
      'animation:vw-orig-spin .7s linear infinite}',
      '@keyframes vw-orig-spin{to{transform:rotate(360deg)}}'
    ].join('');
    document.head.appendChild(s);
  }

  function tipEl(inst) {
    if (!inst || !inst.$refs || !inst.$refs.container || !inst.$refs.container.length) return null;
    var box = inst.$refs.container[0];
    ensureCss();
    if (tip && tip.parentNode && tip.parentNode !== box) { tip.parentNode.removeChild(tip); tip = null; }
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'vw-orig-tip';
      tip.setAttribute('aria-hidden', 'true');
      var dot = document.createElement('i');
      var txt = document.createElement('span');
      txt.textContent = '高清原图加载中…';
      tip.appendChild(dot);
      tip.appendChild(txt);
    }
    if (tip.parentNode !== box) box.appendChild(tip);
    return tip;
  }

  /* 摆在图片上边缘外侧；上面放不下就挪到下面，都放不下才贴图片内侧顶部 */
  function placeTip(inst, slide) {
    var el = tipEl(inst);
    if (!el || !slide || !slide.$image || !slide.$image.length) return;
    var r = slide.$image[0].getBoundingClientRect();
    var c = inst.$refs.container[0].getBoundingClientRect();
    var h = el.offsetHeight || 26;
    var top = r.top - c.top - TIP_GAP - h;
    if (top < 6) {
      var below = r.bottom - c.top + TIP_GAP;
      top = (below + h <= c.height - 6) ? below : (r.top - c.top + 8);
    }
    top = Math.max(6, Math.min(top, c.height - h - 6));
    el.style.top = Math.round(top) + 'px';
  }

  /* 提示存活期间图片可能被放大/拖动，跟着挪（150ms 采样，开销可忽略） */
  function startFollow() {
    if (followTimer) return;
    followTimer = setInterval(function () {
      var el = tip;
      if (!el || !el.classList.contains('is-on') || !$jq) { stopFollow(); return; }
      var inst = $jq.fancybox.getInstance();
      if (inst && inst.current) placeTip(inst, inst.current);
    }, 150);
  }

  function stopFollow() {
    if (followTimer) { clearInterval(followTimer); followTimer = null; }
  }

  function showTip(inst, slide) {
    if (!tipEl(inst)) return;
    placeTip(inst, slide);
    tip.classList.add('is-on');
    startFollow();
  }

  function hideTip() {
    if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
    stopFollow();
    if (tip) tip.classList.remove('is-on');
  }

  function destroyTip() {
    if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
    stopFollow();
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    tip = null;
  }

  /* ==================== 换图 ==================== */

  function upgrade(instance, current) {
    if (!current || current.type !== 'image') return;
    if (current.__vwOrigDone) return;

    var orig = origUrlOf(current.src);
    if (!orig) return;
    current.__vwOrigDone = true;

    hideTip();                                  // 清掉上一张留下的提示与计时
    var probe = new Image();
    var settled = false;

    tipTimer = setTimeout(function () {
      tipTimer = null;
      if (settled || instance.current !== current) return;  // 已经切走 / 已经拿到
      showTip(instance, current);
    }, TIP_DELAY);

    probe.onload = function () {
      settled = true;

      if (instance.current !== current) {
        /* 已经切走了：这一趟不作数，把标记退回去。
           原图此刻已进浏览器缓存，等切回这张时重探会瞬间命中、照样无缝换上。
           此刻绝不能改 src / width / height —— fancybox 复用 slide 时不重新排版，
           一旦改了尺寸而画面还是旧的缩略图，就会被硬拉伸放大。 */
        current.__vwOrigDone = false;
        return;
      }

      var r = $jq.fancybox.__vwCrisp ? dpr() : 1;  // 与 lightbox-crisp.js 同一口径
      current.__vwNat = { w: probe.naturalWidth, h: probe.naturalHeight };
      current.width = Math.max(1, Math.round(probe.naturalWidth / r));
      current.height = Math.max(1, Math.round(probe.naturalHeight / r));
      current.src = orig;                          // 让 fancybox 复用时也认这个地址
      hideTip();

      var $img = current.$image;                   // ← 只拿当前这一张，绝不碰邻图
      if (!$img || !$img.length) return;
      $img.attr('src', orig);
      if (typeof instance.update === 'function') instance.update();
    };

    probe.onerror = function () {
      settled = true;
      if (instance.current !== current) return;
      hideTip();                                   // 没有高清版：安静地保持缩略图
    };

    probe.src = orig;
  }

  function install($) {
    if (!$.fancybox || $.fancybox.__vwOrigInstalled) return;
    $.fancybox.__vwOrigInstalled = true;
    $jq = $;

    var d = $.fancybox.defaults;

    var prevAfterShow = d.afterShow;
    d.afterShow = function (instance, current) {
      if (typeof prevAfterShow === 'function') prevAfterShow.apply(this, arguments);
      upgrade(instance, current);
    };

    var prevAfterClose = d.afterClose;
    d.afterClose = function () {
      if (typeof prevAfterClose === 'function') prevAfterClose.apply(this, arguments);
      destroyTip();
    };

    window.addEventListener('resize', function () {
      if (!tip || !tip.classList.contains('is-on')) return;
      var inst = $.fancybox.getInstance();
      if (inst && inst.current) placeTip(inst, inst.current);
    });

    /* 取证/调试入口：可在控制台手动浮出提示看位置 */
    $.fancybox.__vwOrigShowTip = function () {
      var inst = $.fancybox.getInstance();
      if (inst && inst.current) showTip(inst, inst.current);
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
