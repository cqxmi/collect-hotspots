import { contextBridge, ipcRenderer } from 'electron'

// const serverAddress = "http://debug.doupoo.cn/app";


contextBridge.exposeInMainWorld('electronAPI', {
  openChildWindow: (url) => ipcRenderer.invoke('open-child-window', url),

  onChildWindowClosed: (callback) => {
    ipcRenderer.on('child-window-closed', (_, data) => {
      callback(data);
    });
  },
  getEncodeRequest: (
    url,
    cookie,
    params,
    headers = {},
    method = "GET",
    showError = true,
    isForm = false
  ) => {
    return new Promise((solve, reject) => {
      ipcRenderer
        .invoke(
          "api-dy-data",
          url,
          cookie,
          params,
          headers,
          method,
          isForm,
          showError
        )
        .then((res) => {
          if (res != null) {
            solve(res);
            return;
          } else {
            reject(new Error("api-dy-data 返回 null"));
          }
        })
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  },
  getPreloadPath: () => ipcRenderer.invoke('get-preload-path'),
  setWebviewCookie: (uid, cookies) => ipcRenderer.invoke('set-webview-cookie', uid, cookies),
  pwStart: (payload) => ipcRenderer.invoke('pw:start', payload),
  pwStop: (payload) => ipcRenderer.invoke('pw:stop', payload)
})

contextBridge.exposeInMainWorld("store", {
  get(key) {
    return ipcRenderer.sendSync("electron-store-get", key);
  },
  set(property, val) {
    ipcRenderer.send("electron-store-set", property, val);
  },
});