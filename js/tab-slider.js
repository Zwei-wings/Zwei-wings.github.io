/* tab-slider.js · 分栏 tabs 胶囊滑动指示块（2026-09-12）
 * 配合 custom.css 的「胶囊骑卡」美化：给每个 .nav-tabs 插入一个
 * .tab-slider 主色滑动块，点击标签时用 transform + width/height 平滑
 * 滑到对应标签；初始定位完成后给 .tabs 加 .slider-ready 开启动画。
 * 主题 tabsFn.clickFnOfTabs 负责切 active，本文件只负责滑动块跟随，
 * 故点击后走 requestAnimationFrame（下一帧 active 已切换）再定位。
 */
(function () {
  function position(nav, slider) {
    var active = nav.querySelector('.tab.active');
    if (!active) return;
    slider.style.transform = 'translate(' + active.offsetLeft + 'px,' + active.offsetTop + 'px)';
    slider.style.width = active.offsetWidth + 'px';
    slider.style.height = active.offsetHeight + 'px';
  }

  function build(root) {
    var groups = root.querySelectorAll('#article-container .tabs > .nav-tabs');
    for (var i = 0; i < groups.length; i++) {
      var nav = groups[i];
      if (nav.querySelector('.tab-slider')) continue;   // 已初始化，跳过

      var slider = document.createElement('div');
      slider.className = 'tab-slider';
      nav.appendChild(slider);
      position(nav, slider);

      var host = nav.parentNode;                          // 直接父级即 .tabs
      if (host && host.classList) host.classList.add('slider-ready');

      var tabs = nav.querySelectorAll('.tab');
      for (var j = 0; j < tabs.length; j++) {
        tabs[j].addEventListener('click', function () {
          var n = this.parentNode;                        // .nav-tabs
          var s = n.querySelector('.tab-slider');
          requestAnimationFrame(function () { position(n, s); });
        });
      }
    }
  }

  function init() { build(document); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // butterfly 用 pjax 局部刷新文章，切换后重新插入滑动块
  document.addEventListener('pjax:complete', function () { setTimeout(init, 60); });
  window.addEventListener('load', init);
})();
