import puppeteer from 'puppeteer';
let timer = null

const sleep = (time) => {
    return new Promise((resolve) => {
        timer = setTimeout(() => {
            clearTimeout(timer);
            resolve(true);
        }, time);
    });
};

export class AutoClickWorker {
    browser;
    page;
    timer = null;

    constructor(
        accountId,
        url,
        cookies
    ) {
        this.accountId = accountId
        this.url = url
        this.cookies = cookies
    }

    async start() {
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            userDataDir: `./profiles/${this.accountId}`,
            defaultViewport: null
        });

        const [page] = await this.browser.pages();

        this.page = page

        await this.page.goto('https://creator.douyin.com', {
            waitUntil: 'domcontentloaded'
        });

        await this.page.setCookie(...this.cookies);

        await this.page.goto(this.url, {
            waitUntil: 'domcontentloaded'
        });

        await sleep(10000)

        // 判断是否登录成功
        if (this.page.url() === 'https://creator.douyin.com/creator-micro/data/following/chat') {
            console.log(`${this.accountId}脚本登录成功`)
        } else {
            console.log(`${this.accountId}脚本登录失败`)
        }
        // this.startAutoClick();
        this.testToSend()
    }

    startAutoClick() {
        let idx = 0;

        this.timer = setInterval(async () => {
            try {
                const tabs = await this.page.$$('.semi-tabs-tab');
                if (tabs.length >= 2) {
                    await tabs[idx].click();
                    idx = idx === 0 ? 1 : 0;
                }
            } catch (e) {
                console.error(`[${this.accountId}] click error`, e);
            }
        }, 3000);
    }

    async testToSend() {
        let num = 0
        const items = await this.page.$$('.semi-list-item');
        items[0].click()
        this.timer = setInterval(async () => {
            try {
                await this.page.waitForSelector('.chat-input-dccKiL', {
                    visible: true
                });
                await this.page.click('.chat-input-dccKiL');
                await this.page.keyboard.type(`你好，这是一条自动输入的消息${num++}`, {
                    delay: 50 // 模拟真人输入
                });
                await this.page.click('.chat-btn')
            } catch (e) {
                console.error(`[${this.accountId}] click error`, e);
            }
        }, 5000);
    }

    stop() {
        this.timer && clearInterval(this.timer);
        this.timer = null;
    }

    async destroy() {
        this.stop();
        await this.browser?.close();
    }
}
