/* eslint-disable no-unused-vars */
import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import { https } from './request'

export const store = new Store()

// 初始化窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      webviewTag: true, // ✅ 必须
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 打开子窗口
ipcMain.handle('open-child-window', (_, url) => {
  const partition = `temp:${Date.now()}`

  const win = new BrowserWindow({
    width: 900,
    height: 700,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      partition
    }
  })

  // 缓存最后URL
  let lastUrl = url

  // 页面跳转时更新
  win.webContents.on('did-navigate', (_, navUrl) => {
    lastUrl = navUrl
  })

  // SPA 路由跳转
  win.webContents.on('did-navigate-in-page', (_, navUrl) => {
    lastUrl = navUrl
  })

  win.loadURL(url)

  win.on('closed', async () => {
    try {
      const ses = session.fromPartition(partition)

      console.log('最后URL:', lastUrl)

      let hostname = ''

      try {
        hostname = new URL(lastUrl).hostname
      } catch (e) {
        console.error('解析 hostname 失败', e)
      }

      // 推荐直接读取全部 cookie
      const allCookies = await ses.cookies.get({})

      // 自动匹配域名
      const cookies = allCookies.filter((c) => {
        const cookieDomain = c.domain.replace(/^\./, '')

        return hostname.endsWith(cookieDomain)
      })

      let cookie = ''

      cookies.forEach((ele) => {
        cookie += `${ele.name}=${ele.value};`
      })

      mainWindow.webContents.send('child-window-closed', {
        domain: hostname,
        cookie,
        cookieObj: JSON.stringify(cookies)
      })
    } catch (err) {
      console.error('读取临时 cookie 失败', err)
    }
  })

  return true
})

let UserAgentConfig =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const JsonHeader = 'application/json, text/plain, */*'
const JsonContentType = 'application/json;charset=UTF-8'
const FormContentType = 'application/x-www-form-urlencoded'

const getReferer = () => ({
  origin: 'https://creator.douyin.com',
  Host: 'creator.douyin.com',
  referer: 'https://creator.douyin.com/'
})

let mainWindow

ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val)
})

ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val)
})

ipcMain.handle('api', (event, method, url, params) => {
  return https(url, params, method)
})
