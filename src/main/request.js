import axios from 'axios'

const AxoisProtoBufService = axios.create({
    baseURL: '',
    timeout: 60000,
    headers: {
        accept: 'application/x-protobuf',
        'Content-Type': 'application/x-protobuf',
        'accept-language': 'zh-CN,zh;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
    },
    responseType: 'arraybuffer',
})
const AxoisService = axios.create({
    baseURL: '',
    timeout: 60000,
    headers: {
        accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8',
        'accept-language': 'zh-CN,zh;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
    }
})

AxoisService.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

AxoisService.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error) => {
        return Promise.reject(error)
    }
)
export function formRequest(url, params, method, headers, agent = null) {
    return new Promise((resolve, reject) => {
        let data = {}
        if (method == 'GET') data = { params }
        if (method == 'POST') data = { ...data, ...params }
        if (method == 'POST') {
            AxoisService.post(url, data, { headers: headers, httpsAgent: agent })
                .then((res) => {
                    resolve(res)
                })
                .catch((error) => {
                    console.log(`formRequest error ${JSON.stringify(error)}`)
                    reject(error)
                })
        } else {
            AxoisService.get(url, { headers: headers, httpsAgent: agent })
                .then((res) => {
                    resolve(res)
                })
                .catch((error) => {
                    console.log(`formRequest error ${JSON.stringify(error)}`)
                    reject(error)
                })
        }
    })
}
export function probufRequest(url, data, method, headers, agent = null) {
    return new Promise((resolve, reject) => {
        AxoisProtoBufService.post(url, data, { headers: headers, httpsAgent: agent })
            .then((res) => {
                resolve(res)
            })
            .catch((error) => {
                console.log(error)
                reject(error)
            })
    })
}
