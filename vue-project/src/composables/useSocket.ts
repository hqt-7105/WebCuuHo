// Composable quản lý vòng đời kết nối Socket.IO — tách riêng khỏi MapView.vue,
// giống cách useLeafletMap.ts tách logic bản đồ. File này không biết gì về Leaflet
// hay Pinia cả — chỉ lo đúng 1 việc: kết nối, lắng nghe, và gọi callback khi có dữ liệu.

import { ref, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket'
import type { BaoCaoSuCo } from '@/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface SocketHandlers {
  onBaoCaoMoi?: (data: BaoCaoSuCo) => void
}

export function useSocket(handlers: SocketHandlers = {}) {
  const isConnected = ref(false)
  const daThuKetNoi = ref(false)
  let socket: AppSocket | null = null

  function connect(url: string) {
    daThuKetNoi.value = true

    socket = io(url, {
      // Giới hạn số lần tự thử lại — mặc định Socket.IO thử vô hạn, nếu không giới hạn
      // và chưa có server thật, console sẽ báo lỗi liên tục không dừng.
      reconnectionAttempts: 5,
      timeout: 4000
    })

    socket.on('connect', () => {
      isConnected.value = true
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    // Bắt lỗi kết nối thất bại — KHÔNG throw, chỉ âm thầm cập nhật trạng thái,
    // vì việc chưa có server thật là tình huống bình thường ở giai đoạn này,
    // không phải sự cố cần chặn cả trang lại.
    socket.on('connect_error', () => {
      isConnected.value = false
    })

    socket.on('bao-cao:moi', (data) => {
      handlers.onBaoCaoMoi?.(data)
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
    isConnected.value = false
  }

  // Tự dọn dẹp khi component dùng composable này bị huỷ — tránh tình huống
  // vào/ra trang /map nhiều lần mà kết nối cũ không đóng, chồng chất dần.
  onUnmounted(() => disconnect())

  return { isConnected, daThuKetNoi, connect, disconnect }
}