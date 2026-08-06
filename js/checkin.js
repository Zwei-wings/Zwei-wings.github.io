/**
 * 签到日历 - 客户端渲染
 * 职责：读取 #checkin-data JSON → 渲染侧边栏周历 / 正文页完整内容
 */
(function() {
  'use strict';

  // ===== CSS 注入 =====
  var css = [
    /* ---- 侧边栏 - 签到卡片通用 ---- */
    '.card-checkin .checkin-link { display: block; text-align: center; font-size: 12px; margin-top: 10px; color: var(--checkin-accent, #ff9a5c); text-decoration: none; }',
    '.card-checkin .checkin-link:hover { text-decoration: underline; }',

    /* ---- 侧边栏 - 周历条 ---- */
    '#checkin-week-strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 8px; }',
    '.cw-day { text-align: center; padding: 5px 2px 6px; border-radius: 6px; background: var(--card-bg, #f6f8fa); font-size: 10px; position: relative; }',
    '.cw-day.cw-today { box-shadow: 0 0 0 1.5px #FF8A65 inset; }',
    '.cw-day-name { font-size: 9px; opacity: 0.5; margin-bottom: 2px; color: var(--font-color, #4c4948); }',
    '.cw-day-num { font-weight: 500; font-size: 13px; line-height: 1; color: var(--font-color, #4c4948); }',
    '.cw-today .cw-day-num { color: #D84315; }',
    '.cw-dots { display: flex; justify-content: center; gap: 2px; margin-top: 3px; min-height: 6px; }',
    '.cw-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }',
    '.cw-dot-p { background: #FF8A65; }',
    '.cw-dot-r { background: #B39DDB; }',

    /* ---- 侧边栏 - 迷你进度条 ---- */
    '.cw-divider { border: none; border-top: 0.5px solid var(--border-color, #eaecef); margin: 16px 0 14px; }',
    '.cw-section-label { font-size: 11px; font-weight: 500; margin-bottom: 6px; color: var(--font-color, #4c4948); display: flex; justify-content: space-between; align-items: center; }',
    '.cw-week-range { font-size: 9px; opacity: 0.5; font-weight: 400; }',
    '.cw-track { margin-bottom: 6px; }',
    '.cw-track:last-child { margin-bottom: 0; }',
    '.cw-track-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; font-size: 10px; }',
    '.cw-track-label { display: flex; align-items: center; gap: 4px; opacity: 0.65; color: var(--font-color, #4c4948); }',
    '.cw-track-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }',
    '.cw-track-dot-p { background: #FF8A65; }',
    '.cw-track-dot-r { background: #B39DDB; }',
    '.cw-count { font-weight: 500; font-size: 11px; }',
    '.cw-count-p { color: #D84315; }',
    '.cw-count-r { color: #5E35B1; }',
    '.cw-goal { opacity: 0.45; font-weight: 400; font-size: 10px; }',
    '.cw-bar { height: 6px; border-radius: 3px; background: var(--card-bg, #ebedf0); overflow: hidden; position: relative; }',
    '.cw-bar-fill { height: 100%; border-radius: 3px; }',
    '.cw-bar-fill-p { background: #FF8A65; }',
    '.cw-bar-fill-r { background: #B39DDB; }',

    /* ---- 正文页 - 通用 ---- */
    '.checkin-page { max-width: 800px; margin: 0 auto; }',

    /* ---- 正文页 - 夸夸面板 ---- */
    '.cp-praise { background: #FFF3E0; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 20px; border-left: 4px solid #FF8A65; }',
    '.cp-praise-main { font-size: 15px; font-weight: 500; color: #D84315; margin: 0 0 4px; }',
    '.cp-praise-sub { font-size: 11px; color: #BF360C; opacity: 0.75; margin: 0; }',

    /* ---- 正文页 - 双轨进度条 ---- */
    '.tp-track-row { display: flex; gap: 16px; margin-bottom: 12px; }',
    '.tp-track-card { flex: 1; background: var(--card-bg, #f6f8fa); border-radius: 12px; padding: 16px 18px; transition: box-shadow 0.3s; }',
    '.tp-track-card.tp-perfect { box-shadow: 0 0 0 2px #FFB74D; }',
    '.tp-track-label { font-size: 12px; opacity: 0.6; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; color: var(--font-color, #4c4948); }',
    '.tp-track-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }',
    '.tp-track-dot-p { background: #FF8A65; }',
    '.tp-track-dot-r { background: #B39DDB; }',
    '.tp-track-count { font-size: 26px; font-weight: 500; }',
    '.tp-track-count-p { color: #D84315; }',
    '.tp-track-count-r { color: #5E35B1; }',
    '.tp-track-goal { font-size: 13px; opacity: 0.45; font-weight: 400; }',
    '.tp-prog-wrap { position: relative; margin: 10px 0 2px; padding: 18px 0 6px; }',
    '.tp-prog { height: 12px; border-radius: 6px; background: var(--card-bg, #ebedf0); overflow: hidden; }',
    '.tp-prog-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; }',
    '.tp-prog-fill-p { background: #FF8A65; }',
    '.tp-prog-fill-r { background: #B39DDB; }',
    '.tp-prog-fill-p-over { background: linear-gradient(90deg, #FF8A65, #D84315); }',
    '.tp-prog-fill-r-over { background: linear-gradient(90deg, #B39DDB, #7E57C2); }',
    '.tp-tick { position: absolute; top: 2px; bottom: 14px; width: 1px; background: var(--font-color, #4c4948); opacity: 0.2; transition: all 0.3s; }',
    '.tp-tick-pass { }',
    '.tp-tick-max { }',
    '.tp-tick-pass.tp-tick-active { background: #D84315; opacity: 1; width: 2px; top: 0; bottom: 12px; }',
    '.tp-tick-max.tp-tick-active { background: #FFB74D; opacity: 1; width: 2px; top: 0; bottom: 12px; }',
    '.tp-tick-dot { position: absolute; top: -4px; width: 8px; height: 8px; border-radius: 50%; background: #D84315; transform: translateX(-3.5px); display: none; }',
    '.tp-tick-active .tp-tick-dot, .tp-tick-pass.tp-tick-active .tp-tick-dot { display: block; }',
    '.tp-tick-label { position: absolute; top: -16px; font-size: 9px; transform: translateX(-50%); white-space: nowrap; opacity: 0; transition: opacity 0.3s; }',
    '.tp-tick-active ~ .tp-tick-label, .tp-tick-pass.tp-tick-active ~ .tp-tick-label { opacity: 0.7; color: #D84315; }',
    '.tp-tick-max.tp-tick-active ~ .tp-tick-label { opacity: 0.8; color: #E65100; }',
    '.tp-tier-tag { font-size: 11px; padding: 3px 12px; border-radius: 12px; display: inline-block; margin-top: 8px; }',
    '.tp-tier-below { background: var(--card-bg, #f6f8fa); color: var(--font-color, #4c4948); opacity: 0.55; }',
    '.tp-tier-pass { background: #EDE7F6; color: #5E35B1; }',
    '.tp-tier-close { background: #FFF3E0; color: #E65100; }',
    '.tp-tier-perfect { background: #FBE9E7; color: #D84315; }',
    '.tp-tier-overflow { background: #D84315; color: #fff; }',
    '.tp-overflow-wrap { margin-top: 8px; }',
    '.tp-overflow-label { font-size: 10px; color: #BF360C; margin-bottom: 3px; display: flex; justify-content: space-between; }',
    '.tp-overflow-bar { height: 8px; border-radius: 4px; background: var(--card-bg, #ebedf0); overflow: hidden; }',
    '.tp-overflow-fill { height: 100%; border-radius: 4px; background: #BF360C; transition: width 0.5s ease; }',

    /* ---- 正文页 - 连续追踪（进度条延伸） ---- */
    '.ci-section { margin-bottom: 16px; border: 0.5px solid var(--border-color, #eaecef); border-radius: 12px; padding: 14px 16px 10px; }',
    '.ci-section-title { font-size: 11px; font-weight: 500; color: var(--font-color, #4c4948); margin-bottom: 10px; opacity: 0.5; }',
    '.ci-streak-row { display: flex; gap: 8px; }',
    '.ci-streak-card { flex: 1; border-radius: 8px; padding: 10px 10px 10px; text-align: center; }',
    '.ci-streak-card.ci-st-p { background: rgba(255, 138, 101, 0.06); }',
    '.ci-streak-card.ci-st-r { background: rgba(179, 157, 219, 0.06); }',
    '.ci-st-num { font-size: 20px; font-weight: 500; }',
    '.ci-st-num-p { color: #D84315; }',
    '.ci-st-num-r { color: #5E35B1; }',
    '.ci-st-label { font-size: 10px; opacity: 0.55; margin-top: 2px; color: var(--font-color, #4c4948); }',

    /* ---- 正文页 - 数量统计 ---- */
    '.cs-section { margin-bottom: 16px; border: 0.5px solid var(--border-color, #eaecef); border-radius: 12px; padding: 14px 16px 10px; }',
    '.cs-stat-row { display: flex; gap: 10px; }',
    '.cs-stat-card { flex: 1; background: var(--card-bg, #f6f8fa); border-radius: 10px; padding: 14px 10px; text-align: center; min-width: 0; }',
    '.cs-stat-num { font-size: 22px; font-weight: 500; color: var(--checkin-accent, #ff9a5c); }',
    '.cs-stat-label { font-size: 10px; opacity: 0.55; margin-top: 3px; color: var(--font-color, #4c4948); }',

    /* ---- 月历 ---- */
    '.checkin-month-nav { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 14px; }',
    '.cm-nav-btn-page { background: var(--card-bg, #f6f8fa); border: 1px solid var(--border-color, #eaecef); border-radius: 6px; padding: 5px 16px; font-size: 13px; cursor: pointer; color: var(--font-color, #4c4948); transition: all 0.2s; }',
    '.cm-nav-btn-page:hover { background: var(--checkin-accent, #ff9a5c); color: #fff; border-color: var(--checkin-accent, #ff9a5c); }',
    '.cm-nav-btn-today { font-size: 12px; padding: 4px 12px; opacity: 0.7; }',
    '.cm-nav-btn-today:hover { opacity: 1; }',
    '#cm-title-page { font-size: 15px; font-weight: 500; color: var(--font-color, #4c4948); min-width: 100px; text-align: center; }',
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

    /* ---- 热力图 ---- */
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

    /* ---- 响应式 ---- */
    '@media (max-width: 768px) {',
    '  .tp-track-row { flex-direction: column; gap: 10px; }',
    '  .cs-stat-row { flex-wrap: wrap; gap: 8px; }',
    '  .cs-stat-card { min-width: calc(50% - 4px); flex: none; }',
    '  .ci-streak-row { flex-wrap: wrap; }',
    '  .ci-streak-card { min-width: calc(50% - 4px); flex: none; }',
    '  .cm-day { min-height: 52px; font-size: 12px; }',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ===== 常量 =====
  var MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  var WEEKDAY_NAMES = ['一','二','三','四','五','六','日'];
  var WEEKDAY_FULL = ['周一','周二','周三','周四','周五','周六','周日'];

  // ===== 全局状态 =====
  var DATA = null;
  var pageYear, pageMonth;

  // ===== 工具函数 =====
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }
  function getMarks(dateStr) { return DATA && DATA.dates && DATA.dates[dateStr]; }
  function isToday(dateStr) { return DATA && dateStr === DATA.today; }
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
      var allEls = document.querySelectorAll('#checkin-data');
      for (var i = 1; i < allEls.length; i++) {
        allEls[i].parentNode.removeChild(allEls[i]);
      }
      return raw;
    } catch(e) {
      return null;
    }
  }

  // ===== 侧边栏：周历条 =====
  function renderSidebarWeekStrip() {
    var container = document.getElementById('checkin-week-strip');
    if (!container || !DATA || !DATA.week) return;

    var days = DATA.week.days;
    var html = '';
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var cls = 'cw-day' + (day.date === DATA.today ? ' cw-today' : '');

      html += '<div class="' + cls + '">';
      html += '<div class="cw-day-name">' + WEEKDAY_FULL[i][1] + '</div>';
      html += '<div class="cw-day-num">' + day.day + '</div>';
      html += '<div class="cw-dots">';
      if (day.posted > 0) {
        html += '<span class="cw-dot cw-dot-p" title="更文' + day.posted + '篇"></span>';
      }
      if (day.read) {
        html += '<span class="cw-dot cw-dot-r" title="细读"></span>';
      }
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  // ===== 侧边栏：迷你进度条 =====
  function renderSidebarTracks() {
    var container = document.getElementById('checkin-week-tracks');
    if (!container || !DATA || !DATA.weekly) return;

    var p = DATA.weekly.posted;
    var r = DATA.weekly.read;
    var pPct = Math.min(p.current, p.max) / p.max * 100;
    var rPct = Math.min(r.current, r.max) / r.max * 100;
    var passPct = p.goal / p.max * 100;
    var rpassPct = r.goal / r.max * 100;

    var html = '';
    html += '<div class="cw-track">';
    html += '<div class="cw-track-hd">';
    html += '<span class="cw-track-label"><span class="cw-track-dot cw-track-dot-p"></span>更文</span>';
    html += '<span><span class="cw-count cw-count-p">' + p.current + '</span><span class="cw-goal">/' + p.max + '</span></span>';
    html += '</div>';
    html += '<div class="cw-bar"><div class="cw-bar-fill cw-bar-fill-p" style="width:' + pPct + '%"></div>';
    html += '<div style="position:absolute;top:-1px;bottom:-1px;left:' + passPct + '%;width:1px;background:var(--font-color,#4c4948);opacity:' + (p.current >= p.goal ? '0.6' : '0.2') + ';"></div>';
    html += '<div style="position:absolute;top:-1px;bottom:-1px;left:100%;width:1px;background:var(--font-color,#4c4948);opacity:' + (p.current >= p.max ? '0.5' : '0.15') + ';"></div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="cw-track">';
    html += '<div class="cw-track-hd">';
    html += '<span class="cw-track-label"><span class="cw-track-dot cw-track-dot-r"></span>细读</span>';
    html += '<span><span class="cw-count cw-count-r">' + r.current + '</span><span class="cw-goal">/' + r.max + '</span></span>';
    html += '</div>';
    html += '<div class="cw-bar"><div class="cw-bar-fill cw-bar-fill-r" style="width:' + rPct + '%"></div>';
    html += '<div style="position:absolute;top:-1px;bottom:-1px;left:' + rpassPct + '%;width:1px;background:var(--font-color,#4c4948);opacity:' + (r.current >= r.goal ? '0.6' : '0.2') + ';"></div>';
    html += '<div style="position:absolute;top:-1px;bottom:-1px;left:100%;width:1px;background:var(--font-color,#4c4948);opacity:' + (r.current >= r.max ? '0.5' : '0.15') + ';"></div>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  function renderSidebarWeekLabel() {
    var el = document.getElementById('checkin-week-label');
    if (!el || !DATA || !DATA.week) return;
    el.textContent = DATA.week.startLabel + ' - ' + DATA.week.endLabel;
  }

  function renderSidebar() {
    renderSidebarWeekStrip();
    renderSidebarWeekLabel();
    renderSidebarTracks();
  }

  // ===== 正文页：夸夸面板 =====
  function renderPraise() {
    var el = document.getElementById('checkin-praise');
    if (!el || !DATA || !DATA.praise || !DATA.praise.combined) return;

    var p = DATA.praise;
    var subParts = [];
    if (p.posted) subParts.push(p.posted);
    if (p.read) subParts.push(p.read);

    el.innerHTML =
      '<div class="cp-praise">' +
      '<p class="cp-praise-main">' + p.combined + '</p>' +
      '<p class="cp-praise-sub">' + subParts.join('  ·  ') + '</p>' +
      '</div>';
  }

  // ===== 正文页：双轨进度条 =====
  function renderWeeklyTracks() {
    var container = document.getElementById('checkin-weekly-tracks');
    if (!container || !DATA || !DATA.weekly) return;

    var html = '<div class="tp-track-row">';
    html += renderOneTrack('更新文章', 'p', DATA.weekly.posted);
    html += renderOneTrack('认真细读', 'r', DATA.weekly.read);
    html += '</div>';
    container.innerHTML = html;
  }

  function renderOneTrack(label, cls, track) {
    var pct = Math.min(track.current, track.max) / track.max * 100;
    var passPct = track.goal / track.max * 100;
    var tier = track.tier;
    var isOverflow = tier === 'overflow';
    var isPerfect = tier === 'perfect' || tier === 'overflow';
    var isPass = tier === 'pass' || tier === 'close' || tier === 'perfect' || tier === 'overflow';
    var isClose = tier === 'close' || tier === 'perfect' || tier === 'overflow';

    // 进度条填充颜色
    var fillCls = 'tp-prog-fill-' + cls;
    if (isPerfect) fillCls += ' tp-prog-fill-' + cls + '-over';

    // 卡片是否加金边
    var cardCls = 'tp-track-card';
    if (isPerfect) cardCls += ' tp-perfect';

    // 分级标签
    var tierLabel = '';
    var tierCls = '';
    switch (tier) {
      case 'below': tierLabel = '还需努力'; tierCls = 'tp-tier-below'; break;
      case 'pass': tierLabel = '目标达成'; tierCls = 'tp-tier-pass'; break;
      case 'close': tierLabel = '接近满分'; tierCls = 'tp-tier-close'; break;
      case 'perfect': tierLabel = '日更达成!'; tierCls = 'tp-tier-perfect'; break;
      case 'overflow': tierLabel = '写作力溢出!'; tierCls = 'tp-tier-overflow'; break;
    }

    // 显示数字
    var display = track.current;
    if (isOverflow) display = track.max + '+' + (track.current - track.max);

    var html = '';
    html += '<div class="' + cardCls + '">';
    html += '<div class="tp-track-label"><span class="tp-track-dot tp-track-dot-' + cls + '"></span>' + label + '</div>';
    html += '<div><span class="tp-track-count tp-track-count-' + cls + '">' + display + '</span>';
    html += '<span class="tp-track-goal"> /' + track.max + '</span></div>';

    // 进度条区域
    html += '<div class="tp-prog-wrap">';
    html += '<div class="tp-prog"><div class="tp-prog-fill ' + fillCls + '" style="width:' + pct + '%"></div></div>';

    // 及格线刻度
    html += '<div class="tp-tick tp-tick-pass' + (isPass ? ' tp-tick-active' : '') + '" style="left:' + passPct + '%">';
    if (isPass) html += '<div class="tp-tick-dot"></div>';
    html += '</div>';
    html += '<div class="tp-tick-label" style="left:' + passPct + '%;' + (isPass ? 'opacity:0.7;color:#D84315' : '') + '">及格 ' + track.goal + '</div>';

    // 满分线刻度
    html += '<div class="tp-tick tp-tick-max' + (isPerfect ? ' tp-tick-active' : '') + '" style="left:100%">';
    if (isPerfect) html += '<div class="tp-tick-dot"></div>';
    html += '</div>';
    html += '<div class="tp-tick-label" style="left:100%;' + (isClose ? 'opacity:0.5;color:#E65100' : '') + (isPerfect ? 'opacity:0.7;color:#FFB74D' : '') + '">日更 ' + track.max + '</div>';

    html += '</div>'; // tp-prog-wrap

    // 溢出条
    if (isOverflow) {
      var overflowCount = track.current - track.max;
      html += '<div class="tp-overflow-wrap">';
      html += '<div class="tp-overflow-label"><span>溢出</span><span>+' + overflowCount + '</span></div>';
      html += '<div class="tp-overflow-bar"><div class="tp-overflow-fill" style="width:100%"></div></div>';
      html += '</div>';
    }

    // 分级标签
    html += '<span class="tp-tier-tag ' + tierCls + '">' + tierLabel + '</span>';

    html += '</div>'; // tp-track-card
    return html;
  }

  // ===== 正文页：连续追踪 =====
  function renderStreak() {
    var el = document.getElementById('checkin-streak-info');
    if (!el || !DATA || !DATA.streak) return;

    var sp = DATA.streak.posted;
    var sr = DATA.streak.read;

    el.innerHTML =
      '<div class="ci-section">' +
      '<div class="ci-streak-row">' +
      '<div class="ci-streak-card ci-st-p">' +
      '<div class="ci-st-num ci-st-num-p">' + sp.current + '<span style="font-size:11px;font-weight:400;"> 天</span></div>' +
      '<div class="ci-st-label">更文连续活跃</div>' +
      '</div>' +
      '<div class="ci-streak-card ci-st-p">' +
      '<div class="ci-st-num ci-st-num-p">' + sp.longest + '<span style="font-size:11px;font-weight:400;"> 天</span></div>' +
      '<div class="ci-st-label">更文历史最长</div>' +
      '</div>' +
      '<div class="ci-streak-card ci-st-r">' +
      '<div class="ci-st-num ci-st-num-r">' + sr.current + '<span style="font-size:11px;font-weight:400;"> 天</span></div>' +
      '<div class="ci-st-label">细读连续活跃</div>' +
      '</div>' +
      '<div class="ci-streak-card ci-st-r">' +
      '<div class="ci-st-num ci-st-num-r">' + sr.longest + '<span style="font-size:11px;font-weight:400;"> 天</span></div>' +
      '<div class="ci-st-label">细读历史最长</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  // ===== 正文页：统计卡片 =====
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

    function countRead(ks) {
      var n = 0;
      for (var i = 0; i < ks.length; i++) {
        if (dates[ks[i]].read) n++;
      }
      return n;
    }

    function countPosted(ks) {
      var n = 0;
      for (var i = 0; i < ks.length; i++) {
        n += (dates[ks[i]].posted || 0);
      }
      return n;
    }

    el.innerHTML =
      '<div class="cs-section">' +
      '<div class="cs-stat-row">' +
      '<div class="cs-stat-card"><div class="cs-stat-num">' + countPosted(yearKeys) + '<span style="font-size:12px;font-weight:400;"> 篇</span></div><div class="cs-stat-label">更新文章</div></div>' +
      '<div class="cs-stat-card"><div class="cs-stat-num">' + countRead(yearKeys) + '<span style="font-size:12px;font-weight:400;"> 天</span></div><div class="cs-stat-label">认真细读</div></div>' +
      '<div class="cs-stat-card"><div class="cs-stat-num">' + yearKeys.length + '</div><div class="cs-stat-label">年内活跃天</div></div>' +
      '<div class="cs-stat-card"><div class="cs-stat-num">' + monthKeys.length + '</div><div class="cs-stat-label">本月活跃天</div></div>' +
      '</div>' +
      '</div>';
  }

  // ===== 正文页：月历翻页 =====
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

  // ===== 正文页：月历表格 =====
  function renderMonthTable() {
    var container = document.getElementById('checkin-month-table');
    if (!container) return;

    var firstDay = new Date(pageYear, pageMonth, 1);
    var daysInMonth = new Date(pageYear, pageMonth + 1, 0).getDate();
    var startDow = (firstDay.getDay() || 7) - 1;

    var weeks = [];
    var cw = [];
    for (var j = 0; j < 7; j++) cw[j] = null;
    var di = startDow;

    for (var d = 1; d <= daysInMonth; d++) {
      cw[di] = d;
      di++;
      if (di === 7) { weeks.push(cw); cw = []; for (var j2 = 0; j2 < 7; j2++) cw[j2] = null; di = 0; }
    }
    if (di > 0) weeks.push(cw);

    var html = '<div class="checkin-month"><table class="cm-table"><thead><tr>';
    for (var w = 0; w < 7; w++) html += '<th>' + WEEKDAY_NAMES[w] + '</th>';
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
          html += '<td><div class="' + cls + '"><div class="cm-day-num">' + day + '</div>';
          if (marks && (marks.posted > 0 || marks.read)) {
            html += '<div class="cm-day-marks">';
            if (marks.posted > 0) html += '<span class="cm-mark cm-mark-posted">更文' + (marks.posted > 1 ? ' x' + marks.posted : '') + '</span>';
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

  // ===== 正文页：热力图 =====
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
        if (marks.read && marks.posted > 0) lv = 4;
        else if (marks.posted > 0) lv = 3;
        else if (marks.read) lv = 2;
        else lv = 1;
      }
      cw.push({ date: ds, level: lv, inYear: inYear });
      if (cursor.getDay() === 0) { weeks.push(cw); cw = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (cw.length > 0) weeks.push(cw);

    var numWeeks = weeks.length;
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

    var html = '<div class="checkin-heatmap"><div class="ch-months">';
    for (var c = 0; c < numWeeks; c++) {
      var found = null;
      for (var p2 = 0; p2 < monthPositions.length; p2++) {
        if (monthPositions[p2].col === c) { found = monthPositions[p2]; break; }
      }
      html += '<span>' + (found ? MONTH_NAMES[found.month] : '') + '</span>';
    }
    html += '</div><div class="ch-body"><div class="ch-week-labels">';
    var labels = ['一','','三','','五','','日'];
    for (var l = 0; l < 7; l++) html += '<span>' + labels[l] + '</span>';
    html += '</div><div class="ch-grid">';
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
    html += '</div></div></div>';
    container.innerHTML = html;
  }

  function updateHeatmapTitle() {
    var el = document.getElementById('checkin-heatmap-year');
    if (el) el.textContent = pageYear;
  }

  // ===== 翻页 =====
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

  // ===== 事件绑定 =====
  function bindEvents() {
    document.addEventListener('click', function(e) {
      var t = e.target;
      if (t.closest) {
        if (t.closest('#cm-prev-btn')) { e.preventDefault(); navPage(-1); return; }
        if (t.closest('#cm-next-btn')) { e.preventDefault(); navPage(1); return; }
        if (t.closest('#cm-today-btn')) { e.preventDefault(); navToToday(); return; }
      }
    });
  }

  // ===== 初始化 =====
  function init() {
    DATA = loadData();
    if (!DATA) return;

    var parts = DATA.today ? DATA.today.split('-') : null;
    if (parts) {
      pageYear = parseInt(parts[0], 10);
      pageMonth = parseInt(parts[1], 10) - 1;
    } else {
      var now = new Date();
      pageYear = now.getFullYear();
      pageMonth = now.getMonth();
    }

    // 侧边栏
    if (document.getElementById('checkin-week-strip')) {
      renderSidebar();
    }

    // 正文页
    if (document.getElementById('checkin-page-root')) {
      renderPraise();
      renderWeeklyTracks();
      renderStreak();
      renderStats();
      renderNav();
      renderMonthTable();
      renderHeatmap();
    }

    bindEvents();
  }

  // PJAX 兼容：重新渲染
  function pjaxReload() {
    DATA = loadData();
    if (!DATA) return;

    if (document.getElementById('checkin-week-strip')) {
      renderSidebar();
    }
    if (document.getElementById('checkin-page-root')) {
      renderPraise();
      renderWeeklyTracks();
      renderStreak();
      renderStats();
      renderMonthTable();
      renderHeatmap();
      updateNavTitle();
      updateHeatmapTitle();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // PJAX 事件
  if (typeof window !== 'undefined') {
    var origPjax = window.pjaxReload;
    window.pjaxReload = function() {
      if (origPjax) origPjax();
      pjaxReload();
    };
    document.addEventListener('pjax:complete', pjaxReload);
  }
})();
