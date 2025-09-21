//axios 基础配置
import axios from 'axios'
import { useUserStore } from '@/stores/userStore'
import router from '@/router'

const instance = axios.create({
  baseURL: 'https://pcapi-xiaotuxian-front-devtest.itheima.net',
  timeout: 5000,
  retry: 2, // 重试次数
  retryDelay: 1000 // 重试间隔
})

// axios请求拦截器
instance.interceptors.request.use(config => {
  const userStore = useUserStore()
  const token = userStore.userInfo.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, e => Promise.reject(e))

// axios响应式拦截器
instance.interceptors.response.use(res => res.data, e => {
  const userStore = useUserStore()
  ElMessage.warning(e.response.data.message)
  if (e.response.status === 401) {
    // token过期
    userStore.clearUserInfo()
    router.push('/login')
  }
  return Promise.reject(e)
})


export default instance