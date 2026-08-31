import axios from 'axios'
import { CONFIG } from '@/config'
import { useToastStore } from '@/stores/toast'

export const http = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const toastStore = useToastStore()

    if (error.code === 'ECONNABORTED') {
      toastStore.showToast('Kết nối máy chủ quá chậm, vui lòng thử lại.')
    } else if (!error.response) {
      toastStore.showToast('Không thể kết nối máy chủ. Kiểm tra lại mạng.')
    } else if (error.response.status >= 500) {
      toastStore.showToast('Máy chủ đang gặp sự cố, vui lòng thử lại sau.')
    }

    return Promise.reject(error)
  }
)