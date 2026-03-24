import { AutoClickWorker } from './worker';

const workers = new Map();

export async function startWorker(accountId, cookies) {
    if (workers.has(accountId)) return;

    const worker = new AutoClickWorker(
        accountId,
        'https://creator.douyin.com/creator-micro/data/following/chat',
        cookies
    );

    await worker.start();
    workers.set(accountId, worker);
}

export async function stopWorker(accountId) {
    const worker = workers.get(accountId);
    if (!worker) return;

    await worker.destroy();
    workers.delete(accountId);
}

export function listWorkers() {
    return [...workers.keys()];
}
