/**
 * OC 专栏配音播放条 — 播放/暂停、时长、独立音量、同屏只播一个
 * 依赖结构：.oc-voice[data-src] > .oc-voice-btn / .oc-voice-name / .oc-voice-wave / .oc-voice-time / .oc-voice-vol(.oc-voice-mute + .oc-voice-slider) / .oc-voice-text
 * 兼容 PJAX（事件委托 + pjax:complete 重建）
 */
(function () {
  'use strict';

  var current = null; // 当前正在播放的 audio（同屏只播一个）

  var VOLUME_PREFIX = 'oc-voice-volume:';
  var DEFAULT_VOLUME = 0.7; // 与导航栏音乐播放器默认音量对齐

  function getStoredVolume(src) {
    try {
      var v = localStorage.getItem(VOLUME_PREFIX + src);
      if (v !== null) {
        var n = parseFloat(v);
        if (!isNaN(n) && n >= 0 && n <= 1) return n;
      }
    } catch (e) {}
    return DEFAULT_VOLUME;
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function stopCurrent(except) {
    if (current && current !== except) {
      current.pause();
      try { current.currentTime = 0; } catch (e) {}
      var wrap = current.closest && current.closest('.oc-voice');
      if (wrap) wrap.classList.remove('playing');
    }
  }

  function toggle(audio, wrap) {
    if (audio.paused) {
      stopCurrent(audio);
      audio.play().then(function () {
        wrap.classList.add('playing');
        current = audio;
      }).catch(function () {
        /* 自动播放被拦截等，忽略 */
      });
    } else {
      audio.pause();
      wrap.classList.remove('playing');
      current = null;
    }
  }

  function init(root) {
    var boxes = root.querySelectorAll('.oc-voice');
    for (var i = 0; i < boxes.length; i++) {
      (function (box) {
        if (box.dataset.voiceInit) return;
        box.dataset.voiceInit = '1';

        var src = box.dataset.src;
        if (!src) return;

        var btn = box.querySelector('.oc-voice-btn');
        var timeEl = box.querySelector('.oc-voice-time');
        var slider = box.querySelector('.oc-voice-slider');
        var muteBtn = box.querySelector('.oc-voice-mute');

        var audio = new Audio(src);
        audio.preload = 'none';
        audio.volume = getStoredVolume(src);

        function updateSliderFill() {
          if (!slider) return;
          var pct = Math.round(audio.volume * 100);
          slider.style.background = 'linear-gradient(to right, #ff9a5c 0%, #ff9a5c ' + pct + '%, var(--oc-vol-track) ' + pct + '%)';
        }

        function updateMuteIcon() {
          if (muteBtn) muteBtn.classList.toggle('muted', audio.muted);
        }

        if (slider) {
          slider.value = Math.round(audio.volume * 100);
          updateSliderFill();
          slider.addEventListener('input', function () {
            var v = parseInt(slider.value, 10) / 100;
            audio.volume = v;
            if (v > 0) audio.muted = false;
            updateSliderFill();
            updateMuteIcon();
            try { localStorage.setItem(VOLUME_PREFIX + src, String(v)); } catch (e) {}
          });
        }

        if (muteBtn) {
          muteBtn.addEventListener('click', function (e) {
            e.preventDefault();
            audio.muted = !audio.muted;
            updateMuteIcon();
          });
        }
        updateMuteIcon();

        audio.addEventListener('loadedmetadata', function () {
          if (timeEl) timeEl.textContent = formatTime(audio.duration);
        });

        audio.addEventListener('ended', function () {
          box.classList.remove('playing');
          if (current === audio) current = null;
        });

        audio.addEventListener('play', function () {
          box.classList.add('playing');
          current = audio;
        });

        audio.addEventListener('pause', function () {
          box.classList.remove('playing');
          if (current === audio) current = null;
        });

        if (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            toggle(audio, box);
          });
        }
      })(boxes[i]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    init(document);
  });

  document.addEventListener('pjax:complete', function () {
    stopCurrent(null);
    init(document);
  });
})();
