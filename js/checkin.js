/**
 * 签到日历 - 客户端渲染
 * 职责：读取 #checkin-data JSON → 渲染侧边栏迷你月历 / 正文页日历
 */
(function() {
  'use strict';

  // ===== CSS 注入 =====
  var css = [
    '/* 签到日历 - 侧边栏卡片 */',
    '.card-checkin .checkin-link { display: block; text-align: center; font-size: 12px; margin-top: 10px; color: var(--checkin-accent, #ff9a5c); text-decoration: none; }',
    '.card-checkin .checkin-link:hover { text-decoration: underline; }',

    '/* 迷你月历 */',
    '#checkin-mini .cm-header { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 500; margin-bottom: 8px; color: var(--font-color, #4c4948); }',
    '#checkin-mini .cm-nav-btn { background: none; border: none; cursor: pointer; font-size: 15px; padding: 0 4px; color: var(--font-color, #4c4948); opacity: 0.4; line-height: 1; transition: opacity 0.2s; }',
    '#checkin-mini .cm-nav-btn:hover { opacity: 1; }',
    '#checkin-mini .cm-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); font-size: 10px; opacity: 0.5; margin-bottom: 4px; color: var(--font-color, #4c4948); text-align: center; }',
    '#checkin-mini .cm-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }',
    '#checkin-mini .cm-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 11px; position: relative; color: var(--font-color, #4c4948); cursor: default; }',
    '#checkin-mini .cm-cell.cm-empty { color: transparent; }',
    '#checkin-mini .cm-cell.cm-today { font-weight: 700; color: var(--checkin-accent, #ff9a5c); box-shadow: 0 0 0 1.5px var(--checkin-accent, #ff9a5c) inset; }',
    '#checkin-mini .cm-dots { position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); display: flex; gap: 2px; }',
    '#checkin-mini .cm-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }',
    '.cm-dot-posted { background: #FF8A65; }',
    '.cm-dot-read { background: #B39DDB; }',

    '/* 正文页 */',
    '.checkin-page { max-width: 800px; margin: 0 auto; }',
    '.checkin-page h2 { font-size: 18px; font-weight: 500; margin: 28px 0 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color, #eaecef); }',
    '.checkin-legend { display: flex; gap: 18px; margin-bottom: 16px; font-size: 13px; color: var(--font-color, #4c4948); }',
    '.checkin-legend span { display: inline-flex; align-items: center; gap: 5px; }',
    '.cm-dot-leg { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }',
    '.cp-stats { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }',
    '.cp-stat { background: var(--card-bg, #f6f8fa); border-radius: 10px; padding: 14px 18px; min-width: 100px; text-align: center; }',
    '.cp-stat .cp-stat-num { font-size: 26px; font-weight: 500; color: var(--checkin-accent, #ff9a5c); }',
    '.cp-stat .cp-stat-label { font-size: 12px; opacity: 0.65; margin-top: 4px; color: var(--font-color, #4c4948); }',

    '/* 月历翻页 */',
    '.checkin-month-nav { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 14px; }',
    '.cm-nav-btn-page { background: var(--card-bg, #f6f8fa); border: 1px solid var(--border-color, #eaecef); border-radius: 6px; padding: 5px 16px; font-size: 13px; cursor: pointer; color: var(--font-color, #4c4948); transition: all 0.2s; }',
    '.cm-nav-btn-page:hover { background: var(--checkin-accent, #ff9a5c); color: #fff; border-color: var(--checkin-accent, #ff9a5c); }',
    '.cm-nav-btn-today { font-size: 12px; padding: 4px 12px; opacity: 0.7; }',
    '.cm-nav-btn-today:hover { opacity: 1; }',
    '#cm-title-page { font-size: 15px; font-weight: 500; color: var(--font-color, #4c4948); min-width: 100px; text-align: center; }',

    '/* 月历表格 */',
    '.checkin-month { margin-bottom: 24px; }',
    '.cm-table { width: 100%; border-collapse: collapse; table-layout: fixed; }',
    '.cm-table th { font-size: 11px; font-weight: 500; opacity: 0.5; padding: 8px 0; text-align: center; color: var(--font-color, #4c4948); }',
    '.cm-table td { padding: 3px; text-align: center; vertical-align: top; }',
    '.cm-day { border-radius: 8px; padding: 6px 3px 8px; min-height: 72px; overflow: visible; font-size: 13px; background: var(--card-bg, #f6f8fa); color: var(--font-color, #4c4948); }',
    '.cm-day.cm-empty { background: transparent; }',
    '.cm-day.cm-today { box-shadow: 0 0 0 2px var(--checkin-accent, #ff9a5c) inset; }',
    '.cm-day .cm-day-num { font-weight: 500; margin-bottom: 4px; }',
    '.cm-day .cm-day-marks { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 10px; }',
    '.cm-mark { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 10px; font-size: 10px; white-space: nowrap; }',
    '.cm-mark-posted { background: #FBE9E7; color: #D84315; }',
    '.cm-mark-read   { background: #EDE7F6; color: #5E35B1; }',

    '/* 热力图 */',
    '.checkin-heatmap { margin-bottom: 28px; overflow-x: auto; }',
    '.ch-months { display: flex; margin-left: 32px; font-size: 11px; opacity: 0.55; color: var(--font-color, #4c4948); }',
    '.ch-months span { min-width: 12px; margin-right: 2px; }',
    '.ch-body { display: flex; }',
    '.ch-week-labels { display: flex; flex-direction: column; gap: 2px; font-size: 10px; opacity: 0.5; width: 28px; padding-top: 2px; color: var(--font-color, #4c4948); }',
    '.ch-week-labels span { height: 12px; line-height: 12px; text-align: right; padding-right: 4px; }',
    '.ch-grid { display: flex; flex-direction: column; gap: 2px; }',
    '.ch-row { display: flex; gap: 2px; }',
    '.ch-cell { width: 12px; height: 12px; border-radius: 2px; }',
    '.ch-cell-lv0 { background: var(--card-bg, #ebedf0); }',
    '.ch-cell-lv1 { background: #FFE0B2; }',
    '.ch-cell-lv2 { background: #FFB74D; }',
    '.ch-cell-lv3 { background: #FF8A65; }',
    '.ch-cell-lv4 { background: #D84315; }',

    '/* 响应式 */',
    '@media (max-width: 768px) {',
    '  .cp-stats { gap: 8px; }',
    '  .cp-stat { min-width: 70px; padding: 10px 12px; }',
    '  .cp-stat .cp-stat-num { font-size: 22px; }',
    '  .cm-day { min-height: 52px; font-size: 12px; }',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ===== 常量 =====
  var MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var WEEKDAY_NAMES = ['一','二','三','四','五','六','日'];

  // ===== 全局状态 =====
  var DATA = null;
  var sidebarYear, sidebarMonth;
  var pageYear, pageMonth;

  // ===== 工具函数 =====
  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function fmtDate(y, m, d) {
    return y + '-' + pad2(m + 1) + '-' + pad2(d);
  }

  function getMarks(dateStr) {
    return DATA && DATA.dates && DATA.dates[dateStr];
  }

  function isToday(dateStr) {
    return DATA && dateStr === DATA.today;
  }

  function isoWeekStart(date) {
    var d = new Date(date);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isoWeekEnd(date) {
    var d = new Date(date);
    var day = d.getDay();
    var diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // ===== 数据加载 =====
  function loadData() {
    var el = document.getElementById('checkin-data');
    if (!el) return null;
    try {
      var raw = JSON.parse(el.textContent);
      // 去重：可能有多个 #checkin-data（filter + tag 都注入时）
      var allEls = document.querySelectorAll('#checkin-data');
      for (var i = 1; i < allEls.length; i++) {
        allEls[i].parentNode.removeChild(allEls[i]);
      }
      return raw;
    } catch(e) {
      console.error('[checkin] JSON parse error:', e);
      return null;
    }
  }

  // ===== 侧边栏迷你月历 =====
  function renderSidebarCalendar() {
    var container = document.getElementById('checkin-mini');
    if (!container) return;

    var firstDay = new Date(sidebarYear, sidebarMonth, 1);
    var daysInMonth = new Date(sidebarYear, sidebarMonth + 1, 0).getDate();
    var startDow = (firstDay.getDay() || 7) - 1; // Mon=0, Sun=6

    var html = '';
    html += '<div class="cm-header">';
    html += '<button class="cm-nav-btn" data-action="sidebar-prev">&lsaquo;</button>';
    html += '<span>' + sidebarYear + '年' + MONTH_NAMES[sidebarMonth] + '</span>';
    html += '<button class="cm-nav-btn" data-action="sidebar-next">&rsaquo;</button>';
    html += '</div>';

    html += '<div class="cm-weekdays">';
    for (var w = 0; w < 7; w++) {
      html += '<span>' + WEEKDAY_NAMES[w] + '</span>';
    }
    html += '</div>';

    html += '<div class="cm-grid">';
    // 填充月初空白格
    for (var i = 0; i < startDow; i++) {
      html += '<div class="cm-cell cm-empty"></div>';
    }
    // 日期格子
    for (var d = 1; d <= daysInMonth; d++) {
      var ds = fmtDate(sidebarYear, sidebarMonth, d);
      var marks = getMarks(ds);
      var today = isToday(ds);
      var cls = 'cm-cell' + (today ? ' cm-today' : '');

      html += '<div class="' + cls + '">';
      html += '<span>' + d + '</span>';
      if (marks && (marks.posted || marks.read)) {
        html += '<div class="cm-dots">';
        if (marks.posted) html += '<span class="cm-dot cm-dot-posted" title="更文"></span>';
        if (marks.read) html += '<span class="cm-dot cm-dot-read" title="细读"></span>';
        html += '</div>';
      }
      html += '</div>';
    }
    // 填充月末空白格
    var total = startDow + daysInMonth;
    var rem = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (var r = 0; r < rem; r++) {
      html += '<div class="cm-cell cm-empty"></div>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  // ===== 正文页 - 统计卡片 =====
  function renderStats() {
    var el = document.getElementById('checkin-stats');
    if (!el || !DATA) return;

    var dates = DATA.dates;
    var y = '' + pageYear;
    var m = fmtDate(pageYear, pageMonth, 1).substring(0, 7);
    var keys = Object.keys(dates);

    var yearKeys = [];
    var monthKeys = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.substring(0, 4) === y) yearKeys.push(k);
      if (k.substring(0, 7) === m) monthKeys.push(k);
    }

    function count(ks, key) {
      var n = 0;
      for (var i = 0; i < ks.length; i++) {
        if (dates[ks[i]][key]) n++;
      }
      return n;
    }

    el.innerHTML =
      '<div class="cp-stat"><div class="cp-stat-num">' + yearKeys.length + '</div><div class="cp-stat-label">年内活跃天</div></div>' +
      '<div class="cp-stat"><div class="cp-stat-num">' + count(yearKeys, 'posted') + '</div><div class="cp-stat-label">更新文章</div></div>' +
      '<div class="cp-stat"><div class="cp-stat-num">' + count(yearKeys, 'read') + '</div><div class="cp-stat-label">认真细读</div></div>' +
      '<div class="cp-stat"><div class="cp-stat-num">' + monthKeys.length + '</div><div class="cp-stat-label">本月活跃天</div></div>';
  }

  // ===== 正文页 - 月历翻页栏 =====
  function renderNav() {
    var el = document.getElementById('checkin-nav');
    if (!el) return;
    el.innerHTML =
      '<button class="cm-nav-btn-page" id="cm-prev-btn">&lsaquo; 上月</button>' +
      '<span id="cm-title-page">' + pageYear + '年' + MONTH_NAMES[pageMonth] + '</span>' +
      '<button class="cm-nav-btn-page cm-nav-btn-today" id="cm-today-btn">今天</button>' +
      '<button class="cm-nav-btn-page" id="cm-next-btn">下月 &rsaquo;</button>';
  }

  function updateNavTitle() {
    var el = document.getElementById('cm-title-page');
    if (el) el.textContent = pageYear + '年' + MONTH_NAMES[pageMonth];
  }

  // ===== 正文页 - 月历表格 =====
  function renderMonthTable() {
    var container = document.getElementById('checkin-month-table');
    if (!container) return;

    var firstDay = new Date(pageYear, pageMonth, 1);
    var daysInMonth = new Date(pageYear, pageMonth + 1, 0).getDate();
    var startDow = (firstDay.getDay() || 7) - 1;

    // 构建周数组
    var weeks = [];
    var cw = [];
    for (var j = 0; j < 7; j++) cw[j] = null;
    var di = startDow;

    for (var d = 1; d <= daysInMonth; d++) {
      cw[di] = d;
      di++;
      if (di === 7) {
        weeks.push(cw);
        cw = [];
        for (var j2 = 0; j2 < 7; j2++) cw[j2] = null;
        di = 0;
      }
    }
    if (di > 0) weeks.push(cw);

    var html = '<div class="checkin-month"><table class="cm-table">';
    html += '<thead><tr>';
    for (var w = 0; w < 7; w++) {
      html += '<th>' + WEEKDAY_NAMES[w] + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var wi = 0; wi < weeks.length; wi++) {
      html += '<tr>';
      for (var di2 = 0; di2 < 7; di2++) {
        var day = weeks[wi][di2];
        if (day === null) {
          html += '<td><div class="cm-day cm-empty"></div></td>';
        } else {
          var ds = fmtDate(pageYear, pageMonth, day);
          var marks = getMarks(ds);
          var today = isToday(ds);
          var cls = 'cm-day' + (today ? ' cm-today' : '');

          html += '<td><div class="' + cls + '">';
          html += '<div class="cm-day-num">' + day + '</div>';
          if (marks && (marks.posted || marks.read)) {
            html += '<div class="cm-day-marks">';
            if (marks.posted) html += '<span class="cm-mark cm-mark-posted">更文</span>';
            if (marks.read) html += '<span class="cm-mark cm-mark-read">细读</span>';
            html += '</div>';
          }
          html += '</div></td>';
        }
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // ===== 正文页 - 热力图 =====
  function renderHeatmap() {
    var container = document.getElementById('checkin-heatmap');
    if (!container || !DATA) return;

    var s = isoWeekStart(new Date(pageYear, 0, 1));
    var e = isoWeekEnd(new Date(pageYear, 11, 31));

    var weeks = [];
    var cw = [];
    var cursor = new Date(s);

    while (cursor <= e) {
      var ds = fmtDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      var inYear = cursor.getFullYear() === pageYear;
      var marks = DATA.dates[ds];
      var lv = 0;
      if (marks) {
        if (marks.read && marks.posted) lv = 4;
        else if (marks.posted) lv = 3;
        else if (marks.read) lv = 2;
        else lv = 1;
      }
      cw.push({ date: ds, level: lv, inYear: inYear });

      if (cursor.getDay() === 0) { // Sunday = end of ISO week
        weeks.push(cw);
        cw = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (cw.length > 0) weeks.push(cw);

    var numWeeks = weeks.length;

    // 月份标签定位
    var monthPositions = [];
    for (var w = 0; w < numWeeks; w++) {
      var fd = weeks[w][0];
      if (fd && fd.inYear) {
        var fdDate = new Date(fd.date + 'T00:00:00');
        if (fdDate.getDate() <= 7) {
          var mth = fdDate.getMonth();
          var exists = false;
          for (var p = 0; p < monthPositions.length; p++) {
            if (monthPositions[p].month === mth) { exists = true; break; }
          }
          if (!exists) monthPositions.push({ col: w, month: mth });
        }
      }
    }

    var html = '<div class="checkin-heatmap">';
    html += '<div class="ch-months">';
    for (var c = 0; c < numWeeks; c++) {
      var found = null;
      for (var p2 = 0; p2 < monthPositions.length; p2++) {
        if (monthPositions[p2].col === c) { found = monthPositions[p2]; break; }
      }
      html += '<span>' + (found ? MONTH_NAMES[found.month] : '') + '</span>';
    }
    html += '</div>';

    html += '<div class="ch-body">';
    html += '<div class="ch-week-labels">';
    var labels = ['一','','三','','五','','日'];
    for (var l = 0; l < 7; l++) {
      html += '<span>' + labels[l] + '</span>';
    }
    html += '</div>';

    html += '<div class="ch-grid">';
    for (var row = 0; row < 7; row++) {
      html += '<div class="ch-row">';
      for (var col = 0; col < numWeeks; col++) {
        var cell = weeks[col][row];
        if (cell && cell.inYear) {
          html += '<div class="ch-cell ch-cell-lv' + cell.level + '" title="' + cell.date + '"></div>';
        } else {
          html += '<div style="width:12px;height:12px;"></div>';
        }
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  function updateHeatmapTitle() {
    var el = document.getElementById('checkin-heatmap-year');
    if (el) el.textContent = pageYear;
  }

  // ===== 翻页逻辑 =====
  function navSidebar(dir) {
    sidebarMonth += dir;
    if (sidebarMonth < 0) { sidebarMonth = 11; sidebarYear--; }
    if (sidebarMonth > 11) { sidebarMonth = 0; sidebarYear++; }
    renderSidebarCalendar();
  }

  function navPage(dir) {
    pageMonth += dir;
    if (pageMonth < 0) { pageMonth = 11; pageYear--; }
    if (pageMonth > 11) { pageMonth = 0; pageYear++; }
    renderStats();
    renderMonthTable();
    renderHeatmap();
    updateNavTitle();
    updateHeatmapTitle();
  }

  function navToToday() {
    // 重置为"今天"对应的年月
    var parts = DATA.today ? DATA.today.split('-') : null;
    if (parts) {
      pageYear = parseInt(parts[0], 10);
      pageMonth = parseInt(parts[1], 10) - 1;
    } else {
      var now = new Date();
      pageYear = now.getFullYear();
      pageMonth = now.getMonth();
    }
    renderStats();
    renderMonthTable();
    renderHeatmap();
    updateNavTitle();
    updateHeatmapTitle();
  }

  // ===== 事件绑定（委托） =====
  function bindEvents() {
    document.addEventListener('click', function(e) {
      var t = e.target;

      if (t.closest) {
        if (t.closest('[data-action="sidebar-prev"]')) {
          e.preventDefault();
          navSidebar(-1);
          return;
        }
        if (t.closest('[data-action="sidebar-next"]')) {
          e.preventDefault();
          navSidebar(1);
          return;
        }
        if (t.closest('#cm-prev-btn')) {
          e.preventDefault();
          navPage(-1);
          return;
        }
        if (t.closest('#cm-next-btn')) {
          e.preventDefault();
          navPage(1);
          return;
        }
        if (t.closest('#cm-today-btn')) {
          e.preventDefault();
          navToToday();
          return;
        }
      }
    });
  }

  // ===== 初始化 =====
  function init() {
    DATA = loadData();
    if (!DATA) return;

    // 从数据中读取"今天"
    var parts = DATA.today ? DATA.today.split('-') : null;
    if (parts) {
      sidebarYear = pageYear = parseInt(parts[0], 10);
      sidebarMonth = pageMonth = parseInt(parts[1], 10) - 1;
    } else {
      var now = new Date();
      sidebarYear = pageYear = now.getFullYear();
      sidebarMonth = pageMonth = now.getMonth();
    }

    // 侧边栏
    if (document.getElementById('checkin-mini')) {
      renderSidebarCalendar();
    }

    // 正文页
    if (document.getElementById('checkin-page-root')) {
      renderStats();
      renderNav();
      renderMonthTable();
      renderHeatmap();
    }

    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
