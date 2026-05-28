import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openChildWindow: (url) => ipcRenderer.invoke('open-child-window', url),
  onChildWindowClosed: (callback) => {
    const listener = (_, data) => {
      callback(data)
    }

    ipcRenderer.on('child-window-closed', listener)

    // 返回解绑函数
    return () => {
      ipcRenderer.removeListener('child-window-closed', listener)
    }
  },
  removeChildWindowClosed: (callback) => {
    ipcRenderer.removeListener('child-window-closed', callback)
  },
  getEncodeRequest: (
    url,
    cookie,
    params,
    headers = {},
    method = 'GET',
    showError = true,
    isForm = false
  ) => {
    return new Promise((solve, reject) => {
      ipcRenderer
        .invoke('api-dy-data', url, cookie, params, headers, method, isForm, showError)
        .then((res) => {
          if (res != null) {
            solve(res)
            return
          } else {
            reject(new Error('api-dy-data 返回 null'))
          }
        })
        .catch((error) => {
          console.error(error)
          reject(error)
        })
    })
  },
  pwStart: (payload) => ipcRenderer.invoke('pw:start', payload),
  pwStop: (payload) => ipcRenderer.invoke('pw:stop', payload)
})

const baseURL = 'http://127.0.0.1:3000'

contextBridge.exposeInMainWorld('api', {
  get: (url, params) => {
    return new Promise((solve, reject) => {
      ipcRenderer
        .invoke('api', 'GET', baseURL + url, params)
        .then((res) => {
          solve(res)
        })
        .catch((error) => {
          console.error(error)
          reject(error)
        })
    })
  },
  post: (url, body) => {
    return new Promise((solve, reject) => {
      ipcRenderer
        .invoke('api', 'POST', baseURL + url, body)
        .then((res) => {
          solve(res)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
})

contextBridge.exposeInMainWorld('store', {
  get(key) {
    return ipcRenderer.sendSync('electron-store-get', key)
  },
  set(property, val) {
    ipcRenderer.send('electron-store-set', property, val)
  }
})
