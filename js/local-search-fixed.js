/*!
 * 本地搜索（改良版）— 替代主题的 /js/search/local-search.js
 * 2026-10-16 基于 Butterfly 3.5.1 原版改造（原版出处：themes/butterfly/source/js/search/local-search.js）
 *
 * 改造点：
 *  1. 监听立即挂载：不再等 window.load（页面资源多时"点搜索没反应"的哑巴期）
 *  2. 索引未就绪时输入有反馈："正在准备搜索索引…"，就绪后自动补搜
 *  3. 加载失败显示"点此重试"，不再静默失灵（原版失败后本页搜索永久瘫痪）
 *  4. 页面空闲时预取索引：点开搜索≈秒开（命中浏览器 HTTP 缓存）
 */
(function () {
  'use strict'

  let state = 'idle' // idle | loading | ready | error
  let datas = []

  const MSG_LOADING = '<div class="local-search__tip">正在准备搜索索引…</div>'
  const MSG_ERROR = '<div class="local-search__tip"><span class="local-search__retry">索引加载失败，点此重试</span></div>'

  let $dialog, $input, $resultContent, $mask

  function showTip (html) {
    if ($resultContent) $resultContent.innerHTML = html
  }

  function fadeIn (el, time) {
    if (window.btf && btf.fadeIn) btf.fadeIn(el, time)
    else if (el) el.style.display = 'block'
  }

  function fadeOut (el, time) {
    if (window.btf && btf.fadeOut) btf.fadeOut(el, time)
    else if (el) el.style.display = 'none'
  }

  function openSearch () {
    document.body.style.cssText = 'width: 100%;overflow: hidden'
    $dialog.style.display = 'block'
    $input.focus()
    fadeIn($mask, 0.5)
    ensureData()
  }

  function closeSearch () {
    document.body.style.cssText = "width: '';overflow: ''"
    $dialog.style.animation = 'search_close .5s'
    setTimeout(function () {
      $dialog.style.cssText = "display: none; animation: ''"
    }, 500)
    fadeOut($mask, 0.5)
  }

  function ensureData () {
    if (state === 'ready' || state === 'loading') return
    loadData()
  }

  function loadData () {
    state = 'loading'
    showTip(MSG_LOADING)
    fetch(GLOBAL_CONFIG.root + GLOBAL_CONFIG.localSearch.path)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.text()
      })
      .then(function (str) {
        return new window.DOMParser().parseFromString(str, 'text/xml')
      })
      .then(function (data) {
        datas = [].slice.call(data.querySelectorAll('entry')).map(function (item) {
          return {
            title: item.querySelector('title').textContent,
            content: item.querySelector('content').textContent,
            url: item.querySelector('url').textContent
          }
        })
        state = 'ready'
        $resultContent.innerHTML = ''
        // 数据就绪时若用户已输入内容，立即补搜
        if ($input.value.trim().length > 0) handleInput()
      })
      .catch(function () {
        state = 'error'
        showTip(MSG_ERROR)
      })
  }

  function handleInput () {
    const value = $input.value
    const trimmed = value.trim()

    if (state === 'idle' || state === 'loading') {
      showTip(MSG_LOADING)
      ensureData()
      return
    }
    if (state === 'error') {
      showTip(MSG_ERROR)
      return
    }

    // state === 'ready'：以下为原版搜索逻辑
    let str = '<div class="search-result-list">'
    const keywords = trimmed.toLowerCase().split(/[\s]+/)
    $resultContent.innerHTML = ''
    if (trimmed.length <= 0) return
    let count = 0
    // perform local searching
    datas.forEach(function (data) {
      let isMatch = true
      if (!data.title || data.title.trim() === '') {
        data.title = 'Untitled'
      }
      let dataTitle = data.title.trim().toLowerCase()
      const dataContent = data.content.trim().replace(/<[^>]+>/g, '').toLowerCase()
      const dataUrl = data.url.startsWith('/') ? data.url : GLOBAL_CONFIG.root + data.url
      let indexTitle = -1
      let indexContent = -1
      let firstOccur = -1
      // only match artiles with not empty titles and contents
      if (dataTitle !== '' || dataContent !== '') {
        keywords.forEach(function (keyword, i) {
          indexTitle = dataTitle.indexOf(keyword)
          indexContent = dataContent.indexOf(keyword)
          if (indexTitle < 0 && indexContent < 0) {
            isMatch = false
          } else {
            if (indexContent < 0) {
              indexContent = 0
            }
            if (i === 0) {
              firstOccur = indexContent
            }
          }
        })
      } else {
        isMatch = false
      }

      // show search results
      if (isMatch) {
        const content = data.content.trim().replace(/<[^>]+>/g, '')
        if (firstOccur >= 0) {
          // cut out 130 characters
          let start = firstOccur - 30
          let end = firstOccur + 100

          if (start < 0) {
            start = 0
          }

          if (start === 0) {
            end = 100
          }

          if (end > content.length) {
            end = content.length
          }

          let matchContent = content.substring(start, end)

          // highlight all keywords
          keywords.forEach(function (keyword) {
            const regS = new RegExp(keyword, 'gi')
            matchContent = matchContent.replace(regS, '<span class="search-keyword">' + keyword + '</span>')
            dataTitle = dataTitle.replace(regS, '<span class="search-keyword">' + keyword + '</span>')
          })

          str += '<div class="local-search__hit-item"><a href="' + dataUrl + '" class="search-result-title">' + dataTitle + '</a>'
          count += 1

          if (dataContent !== '') {
            str += '<p class="search-result">' + matchContent + '...</p>'
          }
        }
        str += '</div>'
      }
    })
    if (count === 0) {
      str += '<div id="local-search__hits-empty">' + GLOBAL_CONFIG.localSearch.languages.hits_empty.replace(/\$\{query}/, trimmed) +
        '</div>'
    }
    str += '</div>'
    $resultContent.innerHTML = str
    window.pjax && window.pjax.refresh($resultContent)
  }

  function init () {
    $dialog = document.querySelector('#local-search .search-dialog')
    $input = document.querySelector('#local-search-input input')
    $resultContent = document.getElementById('local-search-results')
    $mask = document.getElementById('search-mask')
    if (!$dialog || !$input || !$resultContent || !$mask) return

    const $searchBtn = document.querySelector('#search-button > .search')
    if ($searchBtn) $searchBtn.addEventListener('click', openSearch)
    $mask.addEventListener('click', closeSearch)
    document.querySelector('#local-search .search-close-button').addEventListener('click', closeSearch)

    // ESC 关闭：全局只挂一次，弹窗打开时才响应
    document.addEventListener('keydown', function (event) {
      if (event.code === 'Escape' && $dialog.style.display === 'block') closeSearch()
    })

    // 输入监听立即绑定（不等索引下载完成）
    $input.addEventListener('input', handleInput)

    // 失败重试（事件委托，重试按钮是动态渲染的）
    $resultContent.addEventListener('click', function (e) {
      if (e.target && e.target.classList.contains('local-search__retry')) {
        state = 'idle'
        loadData()
      }
    })

    // pjax 兼容（本站在用与否都无害）
    window.addEventListener('pjax:complete', function () {
      getComputedStyle($dialog).display === 'block' && closeSearch()
      const btn = document.querySelector('#search-button > .search')
      if (btn) btn.addEventListener('click', openSearch)
    })
  }

  // —— 预取索引：页面 load 后稍等片刻静默下载，点开搜索≈秒开（命中 HTTP 缓存） ——
  // 不用 requestIdleCallback：其调度看浏览器脸色（无帧环境可能长期不给空闲回调）→ 预取不可靠。
  // 固定延时行为确定；此刻首屏已加载完，不抢带宽。
  function preloadSearchIndex () {
    // 注意：主题的 GLOBAL_CONFIG 是 const 声明（不挂在 window 上）——只能用 typeof 检测裸引用
    if (typeof GLOBAL_CONFIG === 'undefined' || !GLOBAL_CONFIG || !GLOBAL_CONFIG.localSearch) return
    // 静默预热：结果丢弃，只求落进浏览器缓存
    fetch(GLOBAL_CONFIG.root + GLOBAL_CONFIG.localSearch.path)
      .then(function () { /* noop */ })
      .catch(function () { /* noop */ })
  }

  function schedulePreload () {
    setTimeout(preloadSearchIndex, 2000)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  if (document.readyState === 'complete') {
    schedulePreload()
  } else {
    window.addEventListener('load', schedulePreload)
  }
})()
