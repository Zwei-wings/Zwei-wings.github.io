(function() {
  'use strict';

  // === 读取配置（由 scripts/wordcloud-config.js 注入） ===
  var CFG = (typeof window.__wordcloudConfig !== 'undefined')
    ? window.__wordcloudConfig
    : { repeat: 3, repeat_scale: 0.4, minSize: 10, maxSize: 60 };

  // === 暖色系调色板 ===
  var warmPalette = [
    '#E5734A','#F28B66','#FF9A5C','#FFB088','#D8434E','#E56B6F',
    '#C77B50','#D4995C','#B89B7A','#A8886B','#D47E3A','#BF6A30',
    '#9C5D42','#C4885C','#8B5A3C','#6D4230','#E8A87C','#D49A6A'
  ];

  function getColor() {
    return warmPalette[Math.floor(Math.random() * warmPalette.length)];
  }

  // === 从 DOM 读取标签数据 ===
  var _tagLinks = [];

  function buildWordList() {
    var anchors = document.querySelectorAll('.tag-cloud-list a');
    if (!anchors.length) return null;

    _tagLinks = [];
    var originals = [];
    var copies = [];
    anchors.forEach(function(a) {
      var text = a.textContent.trim();
      var href = a.getAttribute('href');
      // weight = font-size（em）× 10，范围 ~12–21
      var style = a.getAttribute('style') || '';
      var m = style.match(/font-size:\s*([\d.]+)em/);
      var weight = m ? parseFloat(m[1]) * 10 : 10;
      _tagLinks.push({ text: text, href: href });
      // 本体：原权重 → 先放入列表，螺旋算法从中心开始，优先占位
      originals.push([text, weight]);
      // 替身：缩放权重 → 后排入列表，只能填边缘缝隙
      var copyW = Math.round(weight * CFG.repeat_scale);
      for (var r = 1; r < CFG.repeat; r++) {
        copies.push([text, copyW]);
      }
    });
    // 本体按权重降序：最大标签抢最中心位置
    originals.sort(function(a, b) { return b[1] - a[1]; });
    // 本体在前、替身在后：螺旋放置时自然形成中心→边缘的层次
    return originals.concat(copies);
  }

  function findByText(text) {
    for (var i = 0; i < _tagLinks.length; i++) {
      if (_tagLinks[i].text === text) return _tagLinks[i];
    }
    return null;
  }

  // === 渲染词云 ===
  function render() {
    var cloudList = document.querySelector('.tag-cloud-list');
    if (!cloudList) return;                              // 不在标签总览页
    if (document.getElementById('tag-wordcloud-canvas')) return; // 已渲染

    var wordList = buildWordList();
    if (!wordList || !wordList.length) return;

    // 创建 canvas 容器（尺寸沿用 680x520，即原设计比例）
    var c = document.createElement('canvas');
    c.id = 'tag-wordcloud-canvas';
    c.width  = 680;
    c.height = 520;
    Object.assign(c.style, {
      display: 'block',
      maxWidth: '100%',
      margin: '0 auto',
      cursor: 'pointer'
    });
    cloudList.parentNode.insertBefore(c, cloudList);

    // 隐藏原始列表（保留 DOM 供 SEO）
    cloudList.style.cssText = 'visibility:hidden;height:0;overflow:hidden';

    // 确保 WordCloud 已加载
    function doRender() {
      var ctx = c.getContext('2d');

      // 跟随主题的画布底色：亮色白底、暗色深灰底（= 卡片背景 --card-bg #121212）。
      // 这是修暗色"白边"的关键：暗色下画布底色 = 卡片底色，心形外的"标记色"(markRGB)
      // 与底色只差 1 个亮度，即使不擦也看不出边，擦掉后更彻底透明。
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var bg = isDark ? '#121212' : '#ffffff';
      var bgRGB = isDark ? [18, 18, 18] : [255, 255, 255];   // 背景色 = 可放字区
      var markRGB = isDark ? [19, 19, 19] : [0, 0, 0];       // 标记色 = 心形外占用区

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);

      var opts = {
        list: wordList,
        gridSize: 9,
        weightFactor: 2,
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        color: getColor,
        backgroundColor: bg,
        clearCanvas: false,   // 不清理，保留手动绘制的 mask
        rotateRatio: 0.25,
        rotationSteps: 2,
        minSize: CFG.minSize,
        shrinkToFit: false,
        drawOutOfBound: false,
        ellipticity: 1,
        click: function(item) {
          var t = findByText(item[0]);
          if (t && t.href) window.location.href = t.href;
        }
      };

      // maxSize 等比缩放：如果最大字号超限，整体缩放所有权重
      (function() {
        var maxW = 0;
        for (var i = 0; i < wordList.length; i++) {
          if (wordList[i][1] > maxW) maxW = wordList[i][1];
        }
        if (maxW * opts.weightFactor > CFG.maxSize) {
          var scale = (CFG.maxSize / opts.weightFactor) / maxW;
          for (var j = 0; j < wordList.length; j++) {
            wordList[j][1] = Math.round(wordList[j][1] * scale);
          }
        }
      })();

      // 加载心形 PNG 作为形状约束。mask 图是"白心(灰度255) + 浅灰底(灰度242)"。
      // 处理思路：先缩放到 canvas 尺寸，再二值化(>250=白心,否则=底)，然后重映射成两档精确色：
      //   白心 → bgRGB（=背景色，wordcloud2 判定为"可放字"）
      //   浅灰底 → markRGB（≠背景色，判定为"占用"，不放字）
      // 先缩放后二值化，消除缩放插值灰带；两档精确色让清理时零模糊地带。
      var mask = new Image();
      mask.src = '/img/wordcloud-heart.png';
      mask.onload = function() {
        // ① 缩放 mask 到 canvas 尺寸，二值化并重映射为"背景色/标记色"两档
        var proc = document.createElement('canvas');
        proc.width  = c.width;
        proc.height = c.height;
        var pctx = proc.getContext('2d');
        pctx.drawImage(mask, 0, 0, c.width, c.height);
        var pdata = pctx.getImageData(0, 0, c.width, c.height);
        var pd = pdata.data;
        for (var i = 0; i < pd.length; i += 4) {
          var isWhite = pd[i] > 250;   // 灰度 R 通道：255=白心，242=浅灰底
          if (isWhite) {
            pd[i] = bgRGB[0]; pd[i+1] = bgRGB[1]; pd[i+2] = bgRGB[2];
          } else {
            pd[i] = markRGB[0]; pd[i+1] = markRGB[1]; pd[i+2] = markRGB[2];
          }
          pd[i+3] = 255;
        }
        pctx.putImageData(pdata, 0, 0);

        // ② 画到主 canvas（尺寸一致，1:1 无缩放）
        ctx.drawImage(proc, 0, 0);

        // ③ 渲染完成后清理：精确匹配"背景色"或"标记色"的像素 → 擦透明；其余（暖色字及抗锯齿边缘）→ 保留。
        //    因为 mask 已被二值化成两档精确色，这里用精确相等判断即可，无阈值模糊。
        c.addEventListener('wordcloudstop', function cleanup() {
          c.removeEventListener('wordcloudstop', cleanup);
          var afterImg = ctx.getImageData(0, 0, c.width, c.height);
          var d = afterImg.data;
          for (var i = 0; i < d.length; i += 4) {
            var isBg = d[i] === bgRGB[0] && d[i+1] === bgRGB[1] && d[i+2] === bgRGB[2];
            var isMark = d[i] === markRGB[0] && d[i+1] === markRGB[1] && d[i+2] === markRGB[2];
            if (isBg || isMark) {
              d[i+3] = 0;
            }
          }
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.putImageData(afterImg, 0, 0);
        });

        WordCloud(c, opts);
      };
      mask.onerror = function() {
        opts.clearCanvas = true;
        opts.shape = 'cardioid';
        WordCloud(c, opts);
      };
    }

    if (typeof WordCloud !== 'undefined') {
      doRender();
    } else {
      // fallback: 动态加载 CDN（如果 inject.bottom 没加载成功）
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/wordcloud@1.2.2/src/wordcloud2.min.js';
      s.onload = doRender;
      document.head.appendChild(s);
    }
  }

  // === 销毁词云（PJAX 离开时）===
  function destroy() {
    var c = document.getElementById('tag-wordcloud-canvas');
    if (c) c.remove();
    var l = document.querySelector('.tag-cloud-list');
    if (l) l.style.cssText = '';
  }

  // === 入口 ===
  render();

  // PJAX 兼容
  document.addEventListener('pjax:send', destroy);
  document.addEventListener('pjax:complete', function() {
    setTimeout(render, 120);
  });

  // === 主题切换时重绘词云 ===
  // butterfly 切换暗色/亮色只改 documentElement 的 data-theme 属性（不派发事件），
  // 而 render() 有"已渲染就跳过"的守卫，故用 MutationObserver 监听 data-theme 变化 → 重绘，
  // 让词云底色即时跟随主题，无需手动刷新。
  if (typeof MutationObserver !== 'undefined') {
    var themeTimer = null;
    var themeObserver = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-theme') {
          if (themeTimer) clearTimeout(themeTimer);
          themeTimer = setTimeout(function() {
            destroy();
            render();
          }, 60);
          break;
        }
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
})();
