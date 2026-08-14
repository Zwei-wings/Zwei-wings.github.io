/**
 * 漫步 - 随机文章（客户端）
 * 职责：
 *   1. 读取 #wander-data JSON
 *   2. 在导航栏菜单插入「漫步」按钮（复用站点菜单项样式）
 *   3. 点击弹出下拉面板，列「全部 + 各一级分类」
 *   4. 选中后从对应范围随机抽一篇并跳转（排除当前页）
 */
(function () {
  'use strict';

  var data = null;          // { posts: [{path,title,cat}], categories: [...] }
  var btnEl = null;         // 导航栏里的漫步按钮 a.site-page
  var panelEl = null;       // 下拉面板
  var overlayEl = null;     // 遮罩层

  // ===== CSS =====
  var css = [
    '#wander-panel {',
    '  position: fixed; z-index: 1003; width: max-content; max-width: 70vw;',
    '  background: var(--sidebar-bg); border-radius: 8px;',
    '  box-shadow: 0 5px 20px -4px rgba(0,0,0,0.5);',
    '  overflow: hidden; display: none;',
    '  padding: 4px 0;',
    '}',
    '#wander-panel.wander-show { display: block; }',
    '#wander-panel .wander-item {',
    '  padding: 6px 14px; cursor: pointer;',
    '  color: var(--font-color); font-size: var(--global-font-size);',
    '  white-space: nowrap;',
    '  transition: background 0.15s;',
    '}',
    '#wander-panel .wander-item:hover { background: var(--text-bg-hover); }',
    '#wander-overlay {',
    '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
    '  z-index: 1002; display: none;',
    '}',
    '#wander-overlay.wander-show { display: block; }',
    ''
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ===== 数据 =====
  function loadData() {
    var el = document.getElementById('wander-data');
    if (!el) return false;
    try {
      data = JSON.parse(el.textContent);
      return !!(data && data.posts && data.posts.length);
    } catch (e) {
      return false;
    }
  }

  // ===== 按钮插入导航栏 =====
  function insertButton() {
    var menusItems = document.querySelector('#nav .menus_items');
    if (!menusItems || document.getElementById('wander-nav-item')) return;

    var item = document.createElement('div');
    item.className = 'menus_item';
    item.id = 'wander-nav-item';

    var link = document.createElement('a');
    link.className = 'site-page';
    link.href = 'javascript:void(0);';
    link.innerHTML = '<i class="fa-fw fas fa-dice"></i><span> 漫步</span>';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });

    item.appendChild(link);
    menusItems.appendChild(item);
    btnEl = link;
  }

  // ===== 面板 =====
  function ensurePanel() {
    if (panelEl) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'wander-overlay';
    overlayEl.addEventListener('click', closePanel);
    document.body.appendChild(overlayEl);

    panelEl = document.createElement('div');
    panelEl.id = 'wander-panel';
    document.body.appendChild(panelEl);
  }

  function renderPanel() {
    if (!panelEl || !data) return;
    var html = '';

    // 全部
    html += '<div class="wander-item" data-cat="">全部</div>';

    // 各一级分类
    data.categories.forEach(function (cat) {
      html += '<div class="wander-item" data-cat="' + cat.replace(/"/g, '&quot;') + '">' + cat + '</div>';
    });

    panelEl.innerHTML = html;

    // 事件委托
    panelEl.querySelectorAll('.wander-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var cat = el.getAttribute('data-cat');
        wander(cat);
      });
    });
  }

  function positionPanel() {
    if (!panelEl || !btnEl) return;
    var rect = btnEl.getBoundingClientRect();
    panelEl.style.top = (rect.bottom + 8) + 'px';
    // 右边缘贴齐按钮右边缘（与「文章」菜单 right:0 行为一致）
    var panelW = panelEl.offsetWidth;
    var left = rect.right - panelW;
    // 防止左边界超出视口
    if (left < 8) left = 8;
    panelEl.style.left = left + 'px';
    panelEl.style.transform = 'none';
  }

  function openPanel() {
    ensurePanel();
    renderPanel();
    panelEl.classList.add('wander-show');
    overlayEl.classList.add('wander-show');
    positionPanel();
  }

  function closePanel() {
    if (panelEl) panelEl.classList.remove('wander-show');
    if (overlayEl) overlayEl.classList.remove('wander-show');
  }

  function togglePanel() {
    if (panelEl && panelEl.classList.contains('wander-show')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  // ===== 随机跳转 =====
  // 将路径规范化为可比较的 key：decode 后去掉 index.html 与尾斜杠
  function normKey(p) {
    var s = p;
    try { s = decodeURIComponent(s); } catch (e) {}
    if (s !== '/') {
      s = s.replace(/index\.html?$/, '');
      s = s.replace(/\/+$/, '');
    }
    return s;
  }

  function currentPathKey() {
    return normKey(window.location.pathname || '/');
  }

  function wander(cat) {
    if (!data) return;

    var pool = cat
      ? data.posts.filter(function (p) { return p.cat === cat; })
      : data.posts.slice();

    // 排除当前页
    var cur = currentPathKey();
    var candidates = pool.filter(function (p) {
      return normKey(p.path) !== cur;
    });

    // 若排除后为空（例如单篇分类），退回全量池
    if (!candidates.length) candidates = pool;
    if (!candidates.length) return;

    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    closePanel();
    window.location.href = pick.path;
  }

  // ===== 事件 =====
  window.addEventListener('resize', function () {
    if (panelEl && panelEl.classList.contains('wander-show')) positionPanel();
  });

  document.addEventListener('pjax:complete', function () {
    closePanel();
    // 导航栏随 PJAX 刷新，重新插入按钮
    insertButton();
  });

  // ===== 启动 =====
  function init() {
    if (!loadData()) return;
    insertButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
