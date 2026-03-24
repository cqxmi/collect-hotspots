// playwrightManager.js
const { chromium } = require('playwright');

let browser = null;

// accountId => { context, page, stop }
const taskMap = new Map();

async function initBrowser() {
    if (!browser) {
        browser = await chromium.launch({
            headless: false,
            channel: 'chrome'
        });
    }
}

export async function startMonitor({ accountId, cookies, url, onMessage }) {
    if (taskMap.has(accountId)) return;

    await initBrowser();

    const context = await browser.newContext();
    // ✅ 设置 cookie
    await context.addCookies(
        cookies.map(c => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path || '/',
            expires: c.expirationDate
                ? Math.floor(c.expirationDate)
                : undefined,
            httpOnly: c.httpOnly,
            secure: c.secure,
            sameSite: normalizeSameSite(c.sameSite)
        }))
    );

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    let stopped = false;

    async function loop() {
        while (!stopped) {
            try {
                await page.waitForTimeout(1000);

                const messages = await page.evaluate(() => {
                    const items = document.querySelectorAll('.semi-list-item');
                    const result = [];

                    items.forEach(item => {
                        const badge = item.querySelector('.semi-badge-count');
                        if (badge) {
                            const name = item.querySelector('[class*="item-header-name"]')?.innerText;
                            const content = item.querySelector('[class*="item-content"]')?.innerText;
                            result.push({ name, content });
                        }
                    });

                    return result;
                });

                if (messages.length && onMessage) {
                    onMessage(messages);
                }
            } catch (e) {
                console.error('监控异常:', e);
            }
        }
    }

    loop();

    taskMap.set(accountId, {
        context,
        page,
        stop: async () => {
            stopped = true;
            await page.close().catch(() => { });
            await context.close().catch(() => { });
        }
    });
}

export async function stopMonitor(accountId) {
    const task = taskMap.get(accountId);
    if (!task) return;

    await task.stop();
    taskMap.delete(accountId);
}

function normalizeSameSite(sameSite) {
    if (!sameSite) return 'Lax';

    switch (sameSite) {
        case 'no_restriction':
            return 'None';
        case 'strict':
        case 'Strict':
            return 'Strict';
        case 'lax':
        case 'Lax':
            return 'Lax';
        case 'unspecified':
        default:
            return 'Lax';
    }
}