// Pinia store — nguồn dữ liệu DUY NHẤT cho điểm cứu trợ & báo cáo sự cố.
// Trước đây (bản composable thuần) dữ liệu này nằm kẹt trong useLeafletMap.ts,
// chỉ MapView.vue dùng được. Giờ bất kỳ component nào cũng gọi useMapDataStore()
// để đọc/ghi mà không cần truyền qua props từng tầng (prop drilling).

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DiemCuuTro, BaoCaoSuCo, MapLayerKey } from '@/types'
import { fetchDiemCuuTro as apiFetchDiemCuuTro } from '@/services/diemCuuTroService'

export const useMapDataStore = defineStore('mapData', () => {
  // TOẠ ĐỘ THẬT của các đô thị trong tỉnh, NỘI DUNG là dữ liệu minh hoạ cho đồ án.
  // Khi có PostGIS + API thật, thay bằng action fetchDiemCuuTro() gọi CONFIG.apiBaseUrl.
  const diemCuuTro = ref<DiemCuuTro[]>([
    { ten: 'Nhà văn hoá Đà Lạt', lat: 11.9404, lng: 108.4383, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
    { ten: 'Trung tâm y tế Bảo Lộc', lat: 11.5459, lng: 107.8091, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
    { ten: 'Kho vật tư Phan Thiết', lat: 10.9333, lng: 108.1, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
    { ten: 'Trạm y tế Gia Nghĩa', lat: 12.0044, lng: 107.6877, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
    { ten: 'Nhà văn hoá Đức Trọng', lat: 11.7583, lng: 108.4267, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' }
  ])
  const dangTaiDiemCuuTro = ref(false)

  async function taiDiemCuuTroTuServer() {
    dangTaiDiemCuuTro.value = true
    try {
      const data = await apiFetchDiemCuuTro()
      diemCuuTro.value = data
    } catch {
      // Interceptor ở http.ts đã tự hiện toast báo lỗi — giữ nguyên dữ liệu mock
      // cũ làm fallback, không xoá trắng danh sách khi API lỗi.
    } finally {
      dangTaiDiemCuuTro.value = false
    }
  }
  // Vị trí minh hoạ ban đầu — báo cáo người dùng gửi thật (qua ReportModal) sẽ được
  // action themBaoCao() nối thêm vào đây, KHÔNG thay thế mảng minh hoạ này.
  const baoCaoSuCo = ref<BaoCaoSuCo[]>([
    { ten: 'Sạt lở đèo Bảo Lộc', lat: 11.4767, lng: 107.7967, mucDo: 'Khẩn cấp', mau: '#a8462b' },
    { ten: 'Ngập cục bộ khu vực Di Linh', lat: 11.5764, lng: 108.0742, mucDo: 'Cảnh báo', mau: '#d99a35' },
    { ten: 'Cây đổ quốc lộ 28, Đắk Glong cũ', lat: 12.08, lng: 107.79, mucDo: 'Cảnh báo', mau: '#d99a35' }
  ])

  // getter: đếm số điểm hiển thị theo đúng lớp đang chọn — dùng chung được cho
  // MapStats.vue và bất kỳ nơi nào khác cần con số này, không tính lại logic 2 lần.
  const soDiemTheoLop = computed(() => {
    return (layer: MapLayerKey): number => {
      if (layer === 'diem-cuutro') return diemCuuTro.value.length
      if (layer === 'bao-cao') return baoCaoSuCo.value.length
      return diemCuuTro.value.length + baoCaoSuCo.value.length
    }
  })

  function themBaoCao(baoCao: BaoCaoSuCo) {
    baoCaoSuCo.value.push(baoCao)
  }

  // Gọi khi người dùng bấm "Đánh dấu đã xử lý" trong popup — loại báo cáo khỏi danh sách đang mở.
  function xacNhanDaXuLy(baoCao: BaoCaoSuCo) {
    baoCaoSuCo.value = baoCaoSuCo.value.filter((b) => b !== baoCao)
  }

    return {
    diemCuuTro, baoCaoSuCo, soDiemTheoLop,
    themBaoCao, xacNhanDaXuLy,
    dangTaiDiemCuuTro, taiDiemCuuTroTuServer
  }
})