// Store điều phối hàng đợi offline — nơi DUY NHẤT biết cả IndexedDB (lưu trữ) lẫn
// mapDataStore (dữ liệu hiển thị lên bản đồ). Tự lắng nghe sự kiện online/offline
// của trình duyệt, không cần component nào phải tự gọi tay.

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QueuedBaoCao } from '@/types/offline'
import type { BaoCaoSuCo } from '@/types'
import { themVaoHangDoi, layToanBoHangDoi, xoaKhoiHangDoi } from '@/utils/offlineQueue'
import { useMapDataStore } from './mapData'
import { useToastStore } from './toast'

export const useOfflineQueueStore = defineStore('offlineQueue', () => {
  const soLuongChoGui = ref(0)
  const dangOffline = ref(!navigator.onLine)

  async function capNhatSoLuong() {
    const list = await layToanBoHangDoi()
    soLuongChoGui.value = list.length
  }

  // Gọi khi người dùng gửi báo cáo LÚC ĐANG MẤT MẠNG — lưu vào IndexedDB,
  // KHÔNG hiển thị lên bản đồ ngay (vì "báo cáo" này về bản chất chưa từng
  // được gửi đi đâu cả, chỉ đang nằm chờ trên máy người dùng).
  async function themBaoCaoVaoHangDoi(baoCao: BaoCaoSuCo) {
    const item: QueuedBaoCao = {
      ...baoCao,
      localId: crypto.randomUUID(),
      taoLuc: new Date().toISOString()
    }
    await themVaoHangDoi(item)
    await capNhatSoLuong()
  }

  // Gọi khi có mạng trở lại — duyệt qua từng báo cáo đang chờ, "gửi" (ở giai đoạn
  // chưa có backend thật: coi như gửi thành công ngay, thêm vào mapDataStore để
  // hiển thị lên bản đồ), rồi xoá khỏi hàng đợi. Khi có backend thật, thay đúng
  // đoạn "coi như gửi thành công" bằng lệnh fetch POST thật, giữ nguyên phần còn lại.
  async function xuLyHangDoiKhiCoMang(themLenBanDo: (baoCao: BaoCaoSuCo) => void) {
    const list = await layToanBoHangDoi()
    if (list.length === 0) return

    const mapDataStore = useMapDataStore()
    const toastStore = useToastStore()

    for (const item of list) {
      const { localId, taoLuc, ...baoCao } = item
      void taoLuc // chỉ dùng để hiển thị sau này nếu cần, chưa dùng tới ở bước này
      mapDataStore.themBaoCao(baoCao)
      themLenBanDo(baoCao)
      await xoaKhoiHangDoi(localId)
    }

    toastStore.showToast(`Đã tự động gửi ${list.length} báo cáo lưu tạm lúc mất mạng.`)
    await capNhatSoLuong()
  }

  function khoiTao(themLenBanDo: (baoCao: BaoCaoSuCo) => void) {
    capNhatSoLuong()

    window.addEventListener('online', () => {
      dangOffline.value = false
      xuLyHangDoiKhiCoMang(themLenBanDo)
    })
    window.addEventListener('offline', () => {
      dangOffline.value = true
    })
  }

  return { soLuongChoGui, dangOffline, themBaoCaoVaoHangDoi, khoiTao }
})