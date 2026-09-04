// Pinia store cho toast — trước đây state toast (message/visible) chỉ sống trong
// MapView.vue, trang khác không gọi được. Giờ bất kỳ trang nào cũng showToast() được,
// ví dụ sau này HomeView.vue muốn báo "Đã gửi góp ý thành công" cũng dùng store này.

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const visible = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function showToast(msg: string, durationMs = 3200) {
    message.value = msg
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (visible.value = false), durationMs)
  }

  return { message, visible, showToast }
})