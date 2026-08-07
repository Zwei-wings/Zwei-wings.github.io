(function() {
  'use strict';

  // === 词云密度：每个标签重复次数（标签少时增加以填充形状）===
  var REPEAT_FACTOR = 3;

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
    var result = [];
    anchors.forEach(function(a) {
      var text = a.textContent.trim();
      var href = a.getAttribute('href');
      // weight = font-size（em）× 10，范围 ~12–21
      var style = a.getAttribute('style') || '';
      var m = style.match(/font-size:\s*([\d.]+)em/);
      var weight = m ? parseFloat(m[1]) * 10 : 10;
      _tagLinks.push({ text: text, href: href });
      for (var r = 0; r < REPEAT_FACTOR; r++) {
        result.push([text, weight]);
      }
    });
    return result;
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

    // 创建 canvas 容器
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

      // 先把 canvas 填成白色（作为 mask 的"自由区"基准色）
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);

      var opts = {
        list: wordList,
        gridSize: 9,
        weightFactor: 2,
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        color: getColor,
        backgroundColor: '#ffffff',
        clearCanvas: false,   // 不清理，保留手动绘制的 mask
        rotateRatio: 0.25,
        rotationSteps: 2,
        minSize: 10,
        shrinkToFit: false,
        drawOutOfBound: false,
        ellipticity: 1,
        click: function(item) {
          var t = findByText(item[0]);
          if (t && t.href) window.location.href = t.href;
        }
      };

      // 加载心形 PNG 并绘制到 canvas 上
      // PNG 是白心浅灰底 → 白像素匹配 bg=自由区，浅灰不匹配=禁区
      var mask = new Image();
      mask.src = '/img/wordcloud-heart.png';
      mask.onload = function() {
        ctx.drawImage(mask, 0, 0, c.width, c.height);

        // 渲染完成后，把浅灰底色擦除为透明
        c.addEventListener('wordcloudstop', function cleanup() {
          c.removeEventListener('wordcloudstop', cleanup);
          var imgData = ctx.getImageData(0, 0, c.width, c.height);
          var d = imgData.data;
          for (var i = 0; i < d.length; i += 4) {
            // R、G、B 都 ≥ 240 的像素 → 判为 mask 底色 → 抹掉
            if (d[i] >= 240 && d[i+1] >= 240 && d[i+2] >= 240) {
              d[i+3] = 0;
            }
          }
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.putImageData(imgData, 0, 0);
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
})();