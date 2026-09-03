// 在设置面板（#rightside-config-hide）里，紧挨字号按钮注入“显示伏笔标注”开关
// 该容器本身受齿轮按钮(#rightside_config)控制显隐，所以本按钮自动同受控制。
(function () {
  var KEY = 'vw-highlight-on'
  var btn = null

  function hasMarks() {
    return document.querySelectorAll('#article-container mark').length > 0
  }

  function apply(on) {
    document.body.classList.toggle('show-vw-highlight', on)
    if (btn) btn.classList.toggle('on', on)
    try { localStorage.setItem(KEY, on ? '1' : '0') } catch (e) {}
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

    // 初始：默认隐藏（无记忆时）；有记忆则跟随用户上次选择
    var saved = '0'
    try { saved = localStorage.getItem(KEY) || '0' } catch (e) {}
    apply(saved === '1')
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
