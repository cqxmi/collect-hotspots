import axios from 'axios'
import { store } from './index'

const AxoisService = axios.create({
  baseURL: '',
  timeout: 60000,
  headers: {
    accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json;charset=UTF-8',
    'accept-language': 'zh-CN,zh;q=0.9',
    'accept-encoding': 'gzip, deflate, br'
  }
})

AxoisService.interceptors.request.use(
  (config) => {
    if (store.get('token')) {
      config.headers['token'] = store.get('token')
    }
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

// 通用请求封装：自动处理 GET/POST 传参 + headers
export function https(url, params = {}, method = 'GET', headers = {}) {
  // 返回 Promise
  return new Promise((resolve, reject) => {
    // 转大写，避免大小写问题
    const reqMethod = method.toUpperCase()

    // 请求配置
    const config = {
      url,
      method: reqMethod,
      headers: {
        // 默认 Content-Type，可被外部 headers 覆盖
        'Content-Type': 'application/json;charset=UTF-8',
        ...headers
      }
    }

    // 🔥 关键：自动区分 GET/POST 传参
    if (reqMethod === 'GET') {
      // GET → params
      config.params = params
    } else if (reqMethod === 'POST') {
      // POST → data
      config.data = params
    }

    // 发送请求
    AxoisService(config)
      .then((response) => {
        // 成功返回数据
        resolve(response)
      })
      .catch((error) => {
        // 失败返回错误
        reject(error)
      })
  })
}
