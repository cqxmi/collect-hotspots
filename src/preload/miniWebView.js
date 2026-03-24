// miniWebView.js
const { ipcRenderer } = require('electron');

let timer = null;

let flag = false

const sleep = (time) => {
    return new Promise((resolve) => {
        timer = setTimeout(() => {
            clearTimeout(timer);
            resolve(true);
        }, time);
    });
};

const toWatch = async (idx, doms) => {
    if (!flag) { return }

    doms[idx].click()
    // await sleep(2000);
    // 1. 获取所有 semi-list-item
    let listItems = document.querySelectorAll('.semi-list-item');

    if (listItems.length) {
        // 取前五个进行监控
        for (let i = 0; i < listItems.length && i < 5; i++) {
            // 寻找有没有红点
            const badge = listItems[i].querySelector('.semi-badge-count');
            // 有红点，输出用户名，并点击已读
            if (badge) {
                const name = listItems[i].querySelector('[class*="item-header-name"]');
                const content = listItems[i].querySelector('[class*="item-content"]');
                ipcRenderer.sendToHost('webview-message', {
                    type: 'INIT',
                    payload: {
                        msg: `${name.innerText} 发送了消息：${content.innerText}`,
                        time: Date.now()
                    }
                });
                name.click()
                await sleep(1000);
            }
        }

        // 五个监控完毕之后退出
        await sleep(1000);
        let backBtn = document.querySelector('.semi-button-with-icon-only')
        if (backBtn) {
            document.querySelector('.semi-button-with-icon-only').click()
        }
    }
    await sleep(1000);
    toWatch(idx === 1 ? 2 : 1, doms)
}

ipcRenderer.on('auto-click:start', () => {
    console.log('接收到消息');
    flag = true

    const doms = document.querySelectorAll('.semi-tabs-tab');

    // 开始判断
    toWatch(1, doms)
});

ipcRenderer.on('auto-click:stop', () => {
    // if (timer) {
    //     clearInterval(timer);
    //     timer = null;
    // }
    flag = false
});