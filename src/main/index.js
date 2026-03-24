/* eslint-disable no-unused-vars */
import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from "electron-store";
const { chromium } = require('playwright');
const store = new Store();
import { startMonitor, stopMonitor } from './playwrightManager';

const webviewPreload = join(__dirname, '../preload/miniWebView.js');

function createWindow() {
  // Create the browser window.
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
  // 传给渲染进程
  mainWindow.webContents.send('webview-preload-path', webviewPreload);
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

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

  win.loadURL(url)

  win.on('closed', async () => {
    try {
      const ses = session.fromPartition(partition)

      const cookies = await ses.cookies.get({
        domain: '.douyin.com'
      })

      let cookie = ''
      if (cookies && cookies.length) {
        cookies.forEach(ele => {
          cookie += `${ele.name}=${ele.value};`
        })
      }

      mainWindow.webContents.send('child-window-closed', {
        cookie,
        cookieObj: JSON.stringify(cookies)
      })

    } catch (err) {
      console.error('读取临时 cookie 失败', err)
    }
  })

  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1)
  })

  return true
})

// ipcMain.handle('open-child-window', async (_, url) => {

//   const browser = await chromium.launch({
//     headless: false
//   });
//   const page = await browser.newPage();
//   await page.goto(url);
//   // await browser.close();

//   return true
// })

ipcMain.handle('get-preload-path', () => {
  return webviewPreload
})

// 设置cookie
// ipcMain.handle('set-webview-cookie', async (_, uid, cookies) => {
//   const ses = session.fromPartition(`temp:${uid}`)
//   const temp = JSON.parse(cookies)
//   for (const c of temp) {
//     await ses.cookies.set({
//       url: 'https://creator.douyin.com', // ⭐ 必须
//       name: c.name,
//       value: c.value,
//       domain: c.domain,
//       path: c.path,
//       secure: c.secure,
//       httpOnly: c.httpOnly,
//       expirationDate: c.expirationDate,
//       sameSite: c.sameSite
//     })
//   }
//   return true
// })

let UserAgentConfig =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";
const HeaderReqType = "*/*";
const JsonHeader = "application/json, text/plain, */*";
const JsonContentType = "application/json;charset=UTF-8";
const FormContentType = "application/x-www-form-urlencoded";
const ProtobufHeader = "application/x-protobuf";

const getReferer = () => ({
  origin: 'https://creator.douyin.com',
  Host: 'creator.douyin.com',
  referer: 'https://creator.douyin.com/'
})
let mainWindow
ipcMain.on("electron-store-get", async (event, val) => {
  event.returnValue = store.get(val);
});

ipcMain.on("electron-store-set", async (event, key, val) => {
  // console.log(key, val)
  store.set(key, val);
});

function requestHttpsForm(
  url,
  cookie,
  params,
  method = "POST",
  addHeaders,
  showError = true
) {
  return new Promise((resolve, reject) => {
    if (url != null && cookie != null) {
      var headers = {
        accept: JsonHeader,
        cookie: cookie ?? "",
        "accept-language": "zh-CN,zh;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "user-agent": UserAgentConfig,
      };
      const referer = getReferer();
      headers = { ...headers, ...referer };
      if (addHeaders) {
        headers = { ...headers, ...addHeaders };
      }
      if (params != null) {
        headers = { ...headers, ...{ "content-type": FormContentType } };
      }
      if (is.dev) {
        console.log(`request: ${url}`);
      }
      fetch(url, {
        method: method,
        body: params,
        headers: { ...headers },
      })
        .then((response) => response.json())
        .then((responseData) => {
          if (is.dev) {
            console.log(url + " response: \n");
            console.log(responseData);
          }
          if (responseData.code !== 0) {
            if (showError) {
              let errorMsg = responseData.msg ?? "服务器异常";
              if (responseData.code === 9001) {
                errorMsg = "";
              }
              mainWindow.webContents.send("api-dig-message", {
                code: responseData.code,
                message: errorMsg,
                type: 2,
              });
            }
          }
          resolve(responseData);
        })
        .catch((error) => {
          if (showError) {
            mainWindow.webContents.send("api-dig-message", {
              code: 9999,
              message: error.msg ?? "服务器异常",
              type: 2,
            });
          }
          reject(error);
        });
    } else {
      mainWindow.webContents.send("api-dig-message", {
        code: 9999,
        message: "请求地址为空",
        type: 2,
      });
      reject({ code: 9999 });
    }
  });
}
function requestHttpsJson(
  url,
  cookie,
  params,
  method = "GET",
  addHeaders = null,
  showError = true
) {
  try {
    return new Promise((resolve, reject) => {
      if (url != null && cookie != null) {
        var headers = {
          accept: JsonHeader,
          cookie: cookie ?? "",
          "accept-language": "zh-CN,zh;q=0.9",
          "user-agent": UserAgentConfig,
        };
        const referer = getReferer();
        headers = { ...headers, ...referer };
        if (params != null) {
          headers = { ...headers, ...{ "content-type": JsonContentType } };
        }
        if (addHeaders != null) {
          headers = { ...headers, ...addHeaders };
        }
        console.log(`request: ${url}`);
        fetch(url, {
          method: method,
          body: params != null ? JSON.stringify(params) : null,
          headers: headers,
        })
          .then((response) => {
            if (response.headers.has("bdturing-verify")) {
              mainWindow.webContents.send("api-dig-message", {
                code: 8000,
                message: "请先验证滑块",
                type: 2,
              });
              reject({
                code: 8000,
                message: "请先验证滑块",
                type: 2,
              });
              return;
            }
            return response.json();
          })
          .then((responseData) => {
            if (is.dev) {
              console.log(url + " response: \n");
              console.log(responseData);
            }
            if (responseData.code !== 0) {
              if (showError) {
                let errorMsg = responseData.message ?? "服务器异常";
                if (responseData.code === 9001) {
                  errorMsg = "";
                }
                mainWindow.webContents.send("api-dig-message", {
                  code: responseData.code,
                  message: errorMsg,
                  type: 2,
                });
              }
            }
            resolve(responseData);
          })
          .catch((error) => {
            if (showError) {
              mainWindow.webContents.send("api-dig-message", {
                code: 9999,
                message: error.msg ?? "服务器异常",
                type: 2,
              });
            }
            reject(error);
          });
      } else {
        mainWindow.webContents.send("api-dig-message", {
          code: 9999,
          message: "请求地址为空",
          type: 2,
        });
        reject({ code: 9999 });
      }
    });
  } catch (err) {
    console.error("requestHttpsJson error:", err);
    throw err;
  }
}
/** dy 普通加密api **/
ipcMain.handle(
  "api-dy-data",
  async (
    event,
    url,
    cookie,
    params,
    headers,
    method = "GET",
    isForm = false,
    showError = true
  ) => {
    try {
      if (headers["user-agent"] != null) {
        UserAgentConfig = headers["user-agent"];
      }
      if (isForm) {
        return await requestHttpsForm(
          url,
          cookie,
          params,
          method,
          headers,
          showError
        );
      }
      return await requestHttpsJson(
        url,
        cookie,
        params,
        method,
        headers,
        showError
      );
    } catch (err) {
      console.error("【api-dy-data 错误】", err);
      throw err; // ⚠️ 一定要 throw 回 renderer
    }
  }
);

ipcMain.handle('pw:start', async (_, payload) => {
  const { accountId, cookies, url } = payload;

  await startMonitor({
    accountId,
    cookies,
    url,
    onMessage: (messages) => {
      mainWindow.webContents.send('pw:message', {
        accountId,
        messages
      });
    }
  });

  return true;
});

ipcMain.handle('pw:stop', async (_, { accountId }) => {
  await stopMonitor(accountId);
  return true;
});