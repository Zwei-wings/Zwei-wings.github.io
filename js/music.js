/**
 * 导航栏音乐播放器 — 下拉面板 + 跨页续播
 */
(function () {
  'use strict';

  var navAp = null,
    uiEl = null,
    titleEl = null,
    playEl = null,
    panelEl = null,
    volumeSlider = null,
    loopBtn = null,
    songListEl = null,
    initDone = false,
    playerReady = false,
    panelVisible = false,
    currentLoopIdx = 0; // 0=列表循环 1=单曲循环 2=随机播放 3=顺序播放，自维护

  var LOOP_MODES = ['all', 'one', 'all', 'none'];
  var LOOP_ORDERS = ['list', 'list', 'random', 'list'];
  var LOOP_LABELS = ['列表循环', '单曲循环', '随机播放', '顺序播放'];

  // ===== CSS =====
  var css = [
    '/* 下拉歌单面板 */',
    '#nm-panel {',
    '  position: fixed; z-index: 1002; width: 320px; max-width: 92vw;',
    '  background: #fff; border-radius: 12px;',
    '  box-shadow: 0 4px 24px rgba(0,0,0,0.12);',
    '  overflow: hidden; display: none;',
    '  border: 0.5px solid rgba(0,0,0,0.08);',
    '}',
    '#nm-panel.nm-panel-show { display: block; }',
    '#nm-panel .nm-panel-header {',
    '  padding: 10px 14px; display: flex; align-items: center; gap: 10px;',
    '  border-bottom: 0.5px solid #eee;',
    '}',
    '#nm-panel .nm-vol-slider {',
    '  flex: 1; height: 3px; accent-color: #ff9a5c; cursor: pointer;',
    '  -webkit-appearance: none; appearance: none; background: #eee; border-radius: 3px; outline: none;',
    '}',
    '#nm-panel .nm-vol-slider::-webkit-slider-thumb {',
    '  -webkit-appearance: none; width: 12px; height: 12px;',
    '  border-radius: 50%; background: #ff9a5c; cursor: pointer;',
    '}',
    '#nm-panel .nm-vol-label {',
    '  font-size: 11px; color: #888; min-width: 24px; text-align: right;',
    '}',
    '#nm-panel .nm-loop-btn {',
    '  background: none; border: 1px solid #ddd; border-radius: 14px;',
    '  padding: 2px 10px; font-size: 11px; cursor: pointer; color: #666;',
    '  white-space: nowrap; transition: all 0.2s;',
    '}',
    '#nm-panel .nm-loop-btn:hover { border-color: #ff9a5c; color: #ff9a5c; }',
    '#nm-panel .nm-panel-mute {',
    '  font-size: 14px; cursor: pointer; color: #999; min-width: 16px; text-align: center;',
    '  transition: color 0.2s;',
    '}',
    '#nm-panel .nm-panel-mute:hover { color: #ff9a5c; }',
    '#nm-panel .nm-song-list {',
    '  max-height: 300px; overflow-y: auto;',
    '}',
    '#nm-panel .nm-song-item {',
    '  display: flex; align-items: center; gap: 8px;',
    '  padding: 9px 14px; cursor: pointer;',
    '  border-bottom: 0.5px solid #f5f5f5;',
    '  transition: background 0.15s;',
    '}',
    '#nm-panel .nm-song-item:hover { background: #fdf7f2; }',
    '#nm-panel .nm-song-item.nm-current {',
    '  background: #fff5ee;',
    '}',
    '#nm-panel .nm-song-index {',
    '  font-size: 12px; color: #bbb; min-width: 22px; text-align: center;',
    '}',
    '#nm-panel .nm-song-item.nm-current .nm-song-index {',
    '  color: #ff9a5c; font-weight: 500;',
    '}',
    '#nm-panel .nm-song-info {',
    '  flex: 1; min-width: 0;',
    '}',
    '#nm-panel .nm-song-name {',
    '  font-size: 13px; color: #333; overflow: hidden;',
    '  text-overflow: ellipsis; white-space: nowrap;',
    '}',
    '#nm-panel .nm-song-item.nm-current .nm-song-name {',
    '  color: #e67e3a; font-weight: 500;',
    '}',
    '#nm-panel .nm-song-artist {',
    '  font-size: 11px; color: #aaa; overflow: hidden;',
    '  text-overflow: ellipsis; white-space: nowrap;',
    '}',
    '#nm-panel .nm-song-dur {',
    '  font-size: 11px; color: #ccc; min-width: 36px; text-align: right;',
    '}',
    /* 面板遮罩 */
    '#nm-overlay {',
    '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
    '  z-index: 1001; display: none;',
    '}',
    '#nm-overlay.nm-overlay-show { display: block; }',
    /* 暗色适配：面板在亮底导航栏时使用 */
    ''
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ===== 工具 =====
  function fmtTime(sec) {
    if (!sec || isNaN(sec)) return '--:--';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ===== UI 更新 =====
  function updateUI() {
    if (!navAp || !playEl || !titleEl) return;
    var playing = !navAp.audio.paused;
    playEl.innerHTML = playing ? '\u23F8' : '\u25B6';
    if (navAp.list && navAp.list.audios && navAp.list.audios[navAp.list.index]) {
      titleEl.textContent = navAp.list.audios[navAp.list.index].title;
    }
  }

  // ===== 面板：歌单渲染 =====
  function renderSongList() {
    if (!songListEl || !navAp || !navAp.list || !navAp.list.audios) return;
    var list = navAp.list.audios;
    var curIdx = navAp.list.index;
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var cls = 'nm-song-item' + (i === curIdx ? ' nm-current' : '');
      html += '<div class="' + cls + '" data-idx="' + i + '">';
      html += '<span class="nm-song-index">' + (i === curIdx ? '\u25B6' : (i + 1)) + '</span>';
      html += '<span class="nm-song-info">';
      html += '<div class="nm-song-name">' + list[i].title + '</div>';
      html += '<div class="nm-song-artist">' + (list[i].artist || '') + '</div>';
      html += '</span>';
      html += '<span class="nm-song-dur">' + fmtTime(list[i].duration) + '</span>';
      html += '</div>';
    }
    songListEl.innerHTML = html;
  }

  function updateVolumeDisplay() {
    if (!volumeSlider || !navAp || !navAp.audio) return;
    volumeSlider.value = Math.round(navAp.audio.volume * 100);
    var label = document.querySelector('#nm-panel .nm-vol-label');
    if (label) label.textContent = volumeSlider.value;
  }

  function updateLoopDisplay() {
    if (!loopBtn) return;
    loopBtn.textContent = LOOP_LABELS[currentLoopIdx];
  }

  // ===== 面板：打开/关闭 =====
  function openPanel() {
    if (panelVisible) return;
    if (!navAp) return;
    panelVisible = true;
    if (!panelEl) createPanel();
    updateVolumeDisplay();
    updateLoopDisplay();
    renderSongList();
    panelEl.classList.add('nm-panel-show');
    document.getElementById('nm-overlay').classList.add('nm-overlay-show');
    positionPanel();
  }

  function closePanel() {
    if (!panelVisible) return;
    panelVisible = false;
    if (panelEl) panelEl.classList.remove('nm-panel-show');
    var overlay = document.getElementById('nm-overlay');
    if (overlay) overlay.classList.remove('nm-overlay-show');
  }

  function togglePanel() {
    if (panelVisible) closePanel();
    else openPanel();
  }

  // ===== 面板：创建 DOM =====
  function createPanel() {
    // 遮罩层
    var overlay = document.createElement('div');
    overlay.id = 'nm-overlay';
    // 面板
    panelEl = document.createElement('div');
    panelEl.id = 'nm-panel';
    panelEl.innerHTML =
      '<div class="nm-panel-header">' +
      '<span class="nm-panel-mute" id="nm-mute-btn" title="静音">\u266B</span>' +
      '<input type="range" class="nm-vol-slider" id="nm-vol-slider" min="0" max="100" value="70" />' +
      '<span class="nm-vol-label">70</span>' +
      '<button class="nm-loop-btn" id="nm-loop-btn">列表循环</button>' +
      '</div>' +
      '<div class="nm-song-list" id="nm-song-list"></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(panelEl);

    // 引用
    volumeSlider = document.getElementById('nm-vol-slider');
    loopBtn = document.getElementById('nm-loop-btn');
    songListEl = document.getElementById('nm-song-list');

    // 事件
    overlay.addEventListener('click', closePanel);

    // 音量
    volumeSlider.addEventListener('input', function () {
      if (!navAp || !navAp.audio) return;
      var v = parseInt(volumeSlider.value, 10) / 100;
      navAp.audio.volume = v;
      if (v > 0 && navAp.audio.muted) {
        navAp.audio.muted = false;
      }
      var label = document.querySelector('#nm-panel .nm-vol-label');
      if (label) label.textContent = volumeSlider.value;
    });

    // 静音
    document.getElementById('nm-mute-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      if (!navAp) return;
      navAp.audio.muted = !navAp.audio.muted;
      this.textContent = navAp.audio.muted ? '\uD83D\uDD07' : '\u266B';
    });

    // 循环模式
    loopBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      currentLoopIdx = (currentLoopIdx + 1) % 4;
      if (navAp && navAp.options) {
        navAp.options.loop = LOOP_MODES[currentLoopIdx];
        navAp.options.order = LOOP_ORDERS[currentLoopIdx];
      }
      if (navAp && navAp.audio) navAp.audio.loop = (currentLoopIdx === 1);
      loopBtn.textContent = LOOP_LABELS[currentLoopIdx];
    });

    // 歌单点击（委托）
    songListEl.addEventListener('click', function (e) {
      var item = e.target.closest('.nm-song-item');
      if (!item) return;
      var idx = parseInt(item.getAttribute('data-idx'), 10);
      if (isNaN(idx) || !navAp) return;
      if (idx === navAp.list.index) {
        if (navAp.audio.paused) navAp.play();
        else navAp.pause();
        return;
      }
      switchSong(idx);
    });
  }

  // ===== 切歌 =====
  function switchSong(idx) {
    if (!navAp || !navAp.list || !navAp.list.audios) return;
    if (idx < 0 || idx >= navAp.list.audios.length) return;
    if (idx === navAp.list.index) return;

    // 尝试多种切歌方式
    if (navAp.list.switch) {
      navAp.list.switch(idx);
    } else if (navAp.skipBack) {
      // 用 skipBack/skipForward 导航到目标
      var diff = idx - navAp.list.index;
      if (diff > 0) {
        for (var i = 0; i < diff; i++) navAp.skipForward();
      } else {
        for (var i = 0; i < -diff; i++) navAp.skipBack();
      }
    } else {
      // 终极 fallback：操作 DOM
      var items = document.querySelectorAll('#nav-music-engine .aplayer-list li');
      if (items[idx]) items[idx].click();
    }

    navAp.play();
    // 等播放器更新后刷新面板
    setTimeout(function () {
      renderSongList();
      updateUI();
    }, 300);
  }

  // ===== 面板定位 =====
  function positionPanel() {
    if (!panelEl || !uiEl) return;
    var rect = uiEl.getBoundingClientRect();
    panelEl.style.top = (rect.bottom + 6) + 'px';
    panelEl.style.left = (rect.left + rect.width / 2) + 'px';
    panelEl.style.transform = 'translateX(-50%)';
  }

  // ===== 初始化 =====
  function initMusic() {
    if (initDone) return;
    if (typeof loadMeting !== 'function') return;
    loadMeting();
    initDone = true;

    // 劫持 loadMeting
    var origLoadMeting = window.loadMeting;
    window.loadMeting = function () {
      origLoadMeting();
      var engine = document.getElementById('nav-music-engine');
      if (engine && navAp) {
        engine.classList.add('no-reload');
        if (window.aplayers && window.aplayers.indexOf(navAp) === -1) {
          window.aplayers.unshift(navAp);
        }
      }
    };

    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      var engine = document.getElementById('nav-music-engine');
      if (engine && engine.classList.contains('aplayer-fixed') && window.aplayers && window.aplayers.length > 0) {
        clearInterval(timer);
        playerReady = true;

        for (var i = 0; i < window.aplayers.length; i++) {
          if (window.aplayers[i].container.id === 'nav-music-engine') {
            navAp = window.aplayers[i];
            break;
          }
        }

        if (!navAp) { clearInterval(timer); return; }

        window.__navAp = navAp;
        engine.classList.add('no-reload');

        // 根据 APlayer 实际初始状态同步 currentLoopIdx
        if (navAp.options) {
          if (navAp.options.order === 'random') {
            currentLoopIdx = 2; // 随机播放
          } else if (navAp.options.loop === 'one') {
            currentLoopIdx = 1; // 单曲循环
          } else if (navAp.options.loop === 'none') {
            currentLoopIdx = 3; // 顺序播放
          } else {
            currentLoopIdx = 0; // 列表循环（默认）
          }
          updateLoopDisplay();
        }

        uiEl = document.getElementById('nav-music-ui');
        if (uiEl) {
          playEl = uiEl.querySelector('.nm-play');
          titleEl = uiEl.querySelector('.nm-title');
          var prevEl = uiEl.querySelector('.nm-prev');
          var nextEl = uiEl.querySelector('.nm-next');

          if (playEl) {
            playEl.addEventListener('click', function (e) {
              e.stopPropagation();
              if (navAp) navAp.toggle();
            });
          }
          if (prevEl) {
            prevEl.addEventListener('click', function (e) {
              e.stopPropagation();
              if (navAp) navAp.skipBack();
            });
          }
          if (nextEl) {
            nextEl.addEventListener('click', function (e) {
              e.stopPropagation();
              if (navAp) navAp.skipForward();
            });
          }
          if (titleEl) {
            titleEl.addEventListener('click', function (e) {
              e.stopPropagation();
              togglePanel();
            });
          }

          navAp.on('play', updateUI);
          navAp.on('pause', updateUI);
          navAp.on('ended', updateUI);
          // 切歌后刷新面板
          navAp.on('listswitch', function () {
            updateUI();
            if (panelVisible) renderSongList();
          });
          updateUI();
          // 延迟定位：等导航栏动画/布局稳定后再执行
          setTimeout(positionUI, 150);
          setTimeout(positionUI, 600);
        }
      }
      if (attempts > 30) clearInterval(timer);
    }, 200);
  }

  // ===== 定位 =====
  function positionUI() {
    if (!uiEl) return;
    var nav = document.getElementById('nav');
    if (!nav) return;
    var navRect = nav.getBoundingClientRect();
    // 以导航栏垂直中心为基准，确保不被遮挡
    uiEl.style.top = Math.max(0, navRect.top + navRect.height / 2 - 17) + 'px';
    uiEl.style.left = (navRect.left + navRect.width / 2) + 'px';
    uiEl.style.transform = 'translateX(-50%)';
    uiEl.style.right = 'auto';
    uiEl.style.bottom = 'auto';
  }

  // ===== 配色与显隐 =====
  function updateScheme() {
    if (!uiEl) return;
    var nav = document.getElementById('nav');
    if (!nav) return;

    var navRect = nav.getBoundingClientRect();
    if (navRect.bottom < 5) {
      uiEl.style.opacity = '0';
      uiEl.style.pointerEvents = 'none';
      closePanel();
      return;
    }
    uiEl.style.opacity = '1';
    uiEl.style.pointerEvents = 'auto';

    var bg = getComputedStyle(nav).backgroundColor;
    var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return;
    var r = parseInt(m[1], 10),
      g = parseInt(m[2], 10),
      b = parseInt(m[3], 10);
    var a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (a < 0.5) {
      uiEl.classList.remove('nm-dark');
      return;
    }
    var bright = (r * 299 + g * 587 + b * 114) / 1000;
    if (bright > 150) {
      uiEl.classList.add('nm-dark');
    } else {
      uiEl.classList.remove('nm-dark');
    }
  }

  // ===== 事件 =====
  document.addEventListener('pjax:complete', function () {
    closePanel();
    if (playerReady) {
      setTimeout(positionUI, 100);
      setTimeout(positionUI, 400);
      setTimeout(updateScheme, 120);
      // 重新绑定如果控件被替换
      uiEl = document.getElementById('nav-music-ui');
      if (uiEl && !playEl) {
        playEl = uiEl.querySelector('.nm-play');
        titleEl = uiEl.querySelector('.nm-title');
        if (playEl && navAp) {
          playEl.addEventListener('click', function (e) {
            e.stopPropagation();
            if (navAp) navAp.toggle();
          });
        }
        if (titleEl && navAp) {
          titleEl.addEventListener('click', function (e) {
            e.stopPropagation();
            togglePanel();
          });
        }
      }
    }
  });

  window.addEventListener('resize', function () {
    if (playerReady) { positionUI(); updateScheme(); if (panelVisible) positionPanel(); }
  });

  window.addEventListener('scroll', function () {
    if (playerReady) {
      updateScheme();
      clearTimeout(window._nmSchemeTimer);
      window._nmSchemeTimer = setTimeout(updateScheme, 300);
    }
  }, { passive: true });

  // ===== 启动 =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusic);
  } else {
    initMusic();
  }
})();
