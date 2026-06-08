// miniWebView.js
const { ipcRenderer } = require('electron')

let timer = null

let flag = false

let reply = ''

const sleep = (time) => {
  return new Promise((resolve) => {
    timer = setTimeout(() => {
      clearTimeout(timer)
      resolve(true)
    }, time)
  })
}

async function waitForAnswer(timeout = 30000) {
  const startTime = Date.now()

  // 循环检查
  while (true) {
    // 如果 answer 有值，直接结束等待
    if (typeof reply !== 'undefined' && reply !== null && reply !== '') {
      return true
    }

    // 如果超过 30 秒，抛出超时错误
    if (Date.now() - startTime > timeout) {
      throw new Error('等待 answer 超时（30秒）')
    }

    // 每 200ms 检查一次（可自己改）
    await sleep(200)
  }
}

const toWatch = async (idx, doms) => {
  if (!flag) {
    return
  }

  doms[idx].click()
  let listItems = document.querySelectorAll('.semi-list-item')

  if (listItems.length) {
    // 取前五个进行监控
    for (let i = 0; i < listItems.length && i < 5; i++) {
      // 寻找有没有红点
      const badge = listItems[i].querySelector('.semi-badge-count')
      // 有红点，输出用户名，并点击已读
      if (badge) {
        const name = listItems[i].querySelector('[class*="item-header-name"]')
        const content = listItems[i].querySelector('[class*="item-content"]')
        ipcRenderer.sendToHost('webview-message', {
          type: 'dy',
          payload: {
            company: name.innerText,
            msg: content.innerText,
            time: Date.now()
          }
        })
        name.click()
        // 在这里做一个等待的操作
        const isReply = await waitForAnswer(30000) // 等待 30 秒，超时会抛出错误

        if (isReply) {
          // 按照字数暂停，十个字5秒
          await sleep(Math.floor(reply.length / 2) * 1000)
          const input = document.querySelector('.chat-input-nSWBco')

          // 1. 聚焦输入框（必须）
          input.focus()
          await sleep(100)

          // 2. 设置内容（两种都写上，兼容99%场景）
          input.innerHTML = reply
          input.textContent = reply

          // 🔥 3. 触发框架能识别的输入事件（关键！）
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))

          await sleep(300)

          // 4. 点击发送
          document.querySelector('.chat-btn').click()

          reply = ''
        }
      }
    }

    // 五个监控完毕之后退出
    await sleep(1000)
    let backBtn = document.querySelector('.semi-button-with-icon-only')
    if (backBtn) {
      document.querySelector('.semi-button-with-icon-only').click()
    }
  }

  await sleep(1000)
  toWatch(idx === 1 ? 2 : 1, doms)
}

let partition = ''

ipcRenderer.on('auto-click:start', (event, payload) => {
  console.log('接收到消息', payload)
  partition = payload
  flag = true

  const doms = document.querySelectorAll('.semi-tabs-tab')

  // 开始判断
  toWatch(1, doms)
})

ipcRenderer.on('auto-click:stop', () => {
  flag = false
})

ipcRenderer.on('reply', (event, payload) => {
  console.log('收到回复', payload)
  reply = payload
})
