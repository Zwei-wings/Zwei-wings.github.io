// 在设置面板（#rightside-config-hide）里，紧挨字号按钮注入“显示伏笔标注”开关
// 该容器本身受齿轮按钮(#rightside_config)控制显隐，所以本按钮自动同受控制。
//
// 定位：一次性彩蛋。状态只活在当前这份 DOM 里，不做任何持久化——
// 打开新页面 / 刷新 / 翻到下一章，一律回到关闭。
(function () {
  var LEGACY_KEY = 'vw-highlight-on' // 旧版记忆键，仅用于清理历史残留
  var btn = null

  // 旧版本把开关状态写进 localStorage，导致“一次开启永久记住”。
  // 现在改为不记忆，顺手把老访客浏览器里的残留值抹掉。
  try { localStorage.removeItem(LEGACY_KEY) } catch (e) {}

  function hasMarks() {
    return document.querySelectorAll('#article-container mark').length > 0
  }

  // 不写任何存储：只改当前页面的状态
  function apply(on) {
    document.body.classList.toggle('show-vw-highlight', on)
    if (btn) btn.classList.toggle('on', on)
  }

  function buildButton() {
    var container = document.getElementById('rightside-config-hide')
    if (!container || btn) return

    btn = document.createElement('button')
    btn.id = 'vw-highlight-toggle'
    btn.type = 'button'
    btn.title = '显示 / 隐藏伏笔标注'
    btn.setAttribute('aria-label', '伏笔标注')
    btn.innerHTML = '<i class="fas fa-highlighter"></i>'

    // 放在字号减号按钮旁边，跟它同容器
    var fontMinus = document.getElementById('font-minus')
    if (fontMinus && fontMinus.parentNode === container) {
      fontMinus.insertAdjacentElement('afterend', btn)
    } else {
      container.appendChild(btn)
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      apply(!document.body.classList.contains('show-vw-highlight'))
    })

    // 初始：一律关闭（不读取任何记忆）
    apply(false)
    refresh()
  }

  // 无标注的文章不显示该按钮（避免一个没用的死按钮）
  function refresh() {
    if (btn) btn.style.display = hasMarks() ? '' : 'none'
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton)
  } else {
    buildButton()
  }

  // butterfly 站内 pjax 跳转后，刷新按钮可见性
  document.addEventListener('pjax:complete', refresh)
})();
