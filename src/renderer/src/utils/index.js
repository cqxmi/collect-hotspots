export function formatTimestamp(ts) {
    const d = new Date(ts);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

let timer = null

export const sleep = (time) => {
    return new Promise((resolve) => {
        timer = setTimeout(() => {
            clearTimeout(timer);
            resolve(true);
        }, time);
    });
};