// 档案馆 /collection/ 的前端交互：分区切换、筛选、详情浮层
// 卡片墙本身是构建时生成好的，没这段 JS 也能看，只是点不开详情
(function () {
  'use strict';

  function init() {
    var wrap = document.querySelector('.cl-wrap');
    if (!wrap || wrap.getAttribute('data-cl-init') === '1') return;
    wrap.setAttribute('data-cl-init', '1');

    var modal = wrap.querySelector('.cl-modal');
    var secs = [].slice.call(wrap.querySelectorAll('.cl-sec'));

    /* ---------- 分区 ---------- */
    function showSection(name) {
      secs.forEach(function (s) {
        s.classList.toggle('on', s.getAttribute('data-sec') === name);
      });
      [].forEach.call(wrap.querySelectorAll('.cl-tab'), function (t) {
        t.classList.toggle('on', t.getAttribute('data-sec') === name);
      });
    }

    [].forEach.call(wrap.querySelectorAll('.cl-tab'), function (t) {
      t.addEventListener('click', function () { showSection(t.getAttribute('data-sec')); });
    });

    if (secs.length) showSection(secs[0].getAttribute('data-sec'));

    /* ---------- 筛选 ---------- */
    function applyFilter(kind) {
      [].forEach.call(wrap.querySelectorAll('.cl-chip'), function (c) {
        c.classList.toggle('on', c.getAttribute('data-filter') === kind);
      });
      [].forEach.call(wrap.querySelectorAll('.cl-card'), function (card) {
        var both = card.getAttribute('data-both') === '1';
        var show = kind === 'all' ||
          (kind === 'both' && both) ||
          (kind === 'solo' && !both);
        card.style.display = show ? '' : 'none';
      });
    }

    [].forEach.call(wrap.querySelectorAll('.cl-chip'), function (c) {
      c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
    });

    /* ---------- 详情浮层 ---------- */
    function open(card) {
      if (!modal) return;

      var cover = card.querySelector('.cl-cover img');
      var nameEl = card.querySelector('.cl-name');
      var metaEl = card.querySelector('.cl-meta');
      var rows = card.querySelectorAll('.cl-scores .cl-row');
      var mineEl = card.querySelector('.cl-d-mine');
      var hisEl = card.querySelector('.cl-d-his');

      // 站内 lazyload 把真实地址放在 data-lazy-src，src 只是占位图
      var coverSrc = cover ? (cover.getAttribute('data-lazy-src') || cover.getAttribute('src')) : '';
      modal.querySelector('.cl-modal-cover').innerHTML = coverSrc
        ? '<img src="' + coverSrc + '" alt="">'
        : '';
      modal.querySelector('.cl-modal-name').textContent = nameEl ? nameEl.textContent : '';
      modal.querySelector('.cl-modal-meta').textContent = metaEl ? metaEl.textContent : '';

      var scoreBox = modal.querySelector('.cl-modal-scores');
      scoreBox.innerHTML = '';
      [].forEach.call(rows, function (row) {
        scoreBox.appendChild(row.cloneNode(true));
      });

      var noteMine = modal.querySelector('.cl-note-c[data-role="mine"]');
      var noteHis = modal.querySelector('.cl-note-c[data-role="his"]');
      if (noteMine) noteMine.innerHTML = mineEl ? mineEl.innerHTML : '';
      if (noteHis) noteHis.innerHTML = hisEl ? hisEl.innerHTML : '';

      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cl-lock');

      var body = modal.querySelector('.cl-modal-body');
      if (body) body.scrollTop = 0;
    }

    function close() {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cl-lock');
    }

    [].forEach.call(wrap.querySelectorAll('.cl-card'), function (card) {
      card.addEventListener('click', function () { open(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(card);
        }
      });
    });

    if (modal) {
      var bg = modal.querySelector('.cl-modal-bg');
      var x = modal.querySelector('.cl-modal-x');
      if (bg) bg.addEventListener('click', close);
      if (x) x.addEventListener('click', close);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 本站 pjax 未启用，留作兼容
  document.addEventListener('pjax:complete', init);
})();
