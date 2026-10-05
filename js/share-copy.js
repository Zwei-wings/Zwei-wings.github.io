/* 分享栏「复制链接」按钮
 * ---------------------------------------------------------------------------
 * 为什么自己做：本站分享栏用的是 share.js（overtrue/social-share.js）。
 *   它的站点表里**没有** copy —— 源码实证（v1.0.16）：
 *   `copy` / `clipboard` / `execCommand` 全部 0 命中，只有 11 个外链平台。
 *   主题内置的另一套 AddToAny 才有 copy_link，但那要额外引 static.addtoany.com
 *   这个境外脚本；为一个「复制当前网址」付这条依赖不值。
 *
 * 为什么用内联 SVG 而不是图标字体：
 *   share.js 的样式表有一条 `.social-share * { font-family:"socialshare" !important }`，
 *   凡是靠字体渲染的字形，一旦塞进 .social-share 就会被强制换字体（显示成空框）。
 *   本站已加载的 FontAwesome 也一样会被压掉。SVG 走 stroke 画笔，不吃字体，最干净。
 *   字形取 feather 的 link（链条）与 check（对勾）。
 *
 * 插入位置：.social-share 容器**内部的第一位**，并挂同一个 `social-share-icon` 类，
 *   这样主题给那排图标定的尺寸（1.85em 圆 / 1.2em 字号 / 1px 描边 / margin 0 4px）
 *   会原样套上来，不用重写一份、也不会跟旁边几个对不齐。
 *   颜色与暗色适配写在 source/css/custom.css 的「分享栏」段。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var SVG_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
    '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

  var SVG_DONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<polyline points="20 6 9 17 4 12"/></svg>';

  function shareUrl() {
    return location.href.split('#')[0];
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-2000px;left:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(ta);
    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function flash(el, ok) {
    el.innerHTML = ok ? SVG_DONE : SVG_LINK;
    el.classList.remove('is-done', 'is-fail');
    el.classList.add(ok ? 'is-done' : 'is-fail');
    /* 失败也要有反馈，否则用户以为按钮坏了。
       这条极少触发（现代浏览器 + https 下 clipboard 基本都成功），
       但本地 http 调试、或浏览器回收剪贴板权限时会遇上，
       此时至少要让 title 告诉用户「手动复制地址栏」。 */
    el.title = ok ? '复制链接' : '复制失败，请手动复制地址栏';
    clearTimeout(el._vwShareT);
    el._vwShareT = setTimeout(function () {
      el.classList.remove('is-done', 'is-fail');
      el.title = '复制链接';
      el.innerHTML = SVG_LINK;
    }, 1600);
  }

  function copyLink(el) {
    var text = shareUrl();
    /* clipboard API 只在安全上下文（https / localhost）可用，本地 http 会 undefined，
       所以必须有 execCommand 这条后路，否则本地调试时按钮永远"没反应"。 */
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { flash(el, true); },
        function () { flash(el, legacyCopy(text)); }
      );
      return;
    }
    flash(el, legacyCopy(text));
  }

  /* 返回 true = 不用再试（已插好 / 本页没有分享栏） */
  function build() {
    var wrap = document.querySelector('.post_share .social-share');
    if (!wrap) return true;
    if (wrap.querySelector('.vw-share-copy')) return true;
    if (!wrap.querySelector('.social-share-icon')) return false;  // 等 share.js 先把图标渲染出来

    var a = document.createElement('a');
    a.className = 'social-share-icon vw-share-copy';
    a.href = 'javascript:;';
    a.title = '复制链接';
    a.setAttribute('aria-label', '复制链接');
    a.innerHTML = SVG_LINK;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      copyLink(a);
    });
    wrap.insertBefore(a, wrap.firstChild);
    return true;
  }

  function start() {
    if (build()) return;
    var n = 0;
    (function tick() {                       // share.js 是 defer 的异步脚本，得等它跑完
      if (build() || ++n > 60) return;
      setTimeout(tick, 120);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
