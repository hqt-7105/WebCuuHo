<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import '@/assets/map-style.css'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { useSocket } from '@/composables/useSocket'
import { useMapDataStore } from '@/stores/mapData'
import { useToastStore } from '@/stores/toast'
import { useOfflineQueueStore } from '@/stores/offlineQueue'
import { CONFIG } from '@/config'
import type { MapLayerKey } from '@/types'
import MapTopBar from '@/components/map/MapTopBar.vue'
import MapStats from '@/components/map/MapStats.vue'
import MapLegend from '@/components/map/MapLegend.vue'
import ReportModal from '@/components/map/ReportModal.vue'

const route = useRoute()
const activeLayer = computed<MapLayerKey>(() => (route.query.layer as MapLayerKey) || 'ranh-gioi')

const mapDataStore = useMapDataStore()
const toastStore = useToastStore()
const offlineQueueStore = useOfflineQueueStore()

const { mapInstance, boundaryError, initMap, applyLayerVisibility, themMarkerBaoCao, destroyMap } =
  useLeafletMap()

// ---------- Modal gửi báo cáo ----------
const isReportOpen = ref(false)
const pickMode = ref(false)
const pickedLocationText = ref(
  'Bấm vào bản đồ phía sau để chọn vị trí, hoặc để trống dùng vị trí trung tâm tỉnh.'
)
const pickedLatLng = ref<{ lat: number; lng: number } | null>(null)

function openReport() {
  isReportOpen.value = true
  pickMode.value = true
  pickedLatLng.value = null
  pickedLocationText.value = 'Bấm vào bản đồ phía sau để chọn vị trí, hoặc để trống dùng vị trí trung tâm tỉnh.'
}
function closeReport() {
  isReportOpen.value = false
  pickMode.value = false
}

interface SubmittedForm {
  reqType: string
  phone: string
  description: string
}

function handleSubmitReport(data: SubmittedForm) {
  // Chưa có backend thật — đây là nơi sau này gọi thêm:
  // fetch(CONFIG.apiBaseUrl + CONFIG.endpoints.baoCaoSuCo, { method: 'POST', body: JSON.stringify(data) })
  const viTri = pickedLatLng.value ?? { lat: 11.94, lng: 108.44 } // mặc định: trung tâm tỉnh

  // Tạo ĐÚNG 1 object dùng chung cho cả store và marker — nếu tạo 2 object riêng
  // (dù nội dung giống hệt), sau này "Đánh dấu đã xử lý" sẽ không khớp được đúng phần tử
  // trong store, vì store.xacNhanDaXuLy() so khớp theo tham chiếu, không so theo nội dung.
  const baoCaoMoi = {
    ten: data.reqType || 'Yêu cầu cứu trợ',
    lat: viTri.lat,
    lng: viTri.lng,
    mucDo: 'Khẩn cấp',
    mau: '#a8462b'
  }

  closeReport()

  // ĐIỂM RẼ NHÁNH quan trọng nhất của offline queue: cùng 1 hành động "gửi báo cáo"
  // nhưng xử lý khác hẳn nhau tuỳ có mạng hay không.
  if (navigator.onLine) {
    mapDataStore.themBaoCao(baoCaoMoi)
    themMarkerBaoCao(baoCaoMoi, activeLayer.value)
    toastStore.showToast('Đã ghi nhận báo cáo (demo — chưa nối backend thật).')
  } else {
    // Mất mạng: KHÔNG hiển thị lên bản đồ ngay — báo cáo này chưa từng "được gửi" cả,
    // chỉ đang nằm chờ trên máy người dùng. Nó sẽ tự hiện lên khi có mạng trở lại.
    offlineQueueStore.themBaoCaoVaoHangDoi(baoCaoMoi)
    toastStore.showToast('Đang mất mạng — đã lưu báo cáo, sẽ tự gửi khi có mạng trở lại.')
  }
}

watch(boundaryError, (msg) => {
  if (msg) toastStore.showToast(msg)
})

// ---------- Socket.IO — cập nhật thời gian thực ----------
// onBaoCaoMoi tái dùng ĐÚNG luồng xử lý đã có (store + marker) — không viết logic riêng
// biệt cho "báo cáo tới từ socket" so với "báo cáo tự mình gửi", tránh 2 đường code
// làm cùng 1 việc mà dễ lệch nhau khi sửa sau này.
const { isConnected, connect } = useSocket({
  onBaoCaoMoi: (data) => {
    mapDataStore.themBaoCao(data)
    themMarkerBaoCao(data, activeLayer.value)
    toastStore.showToast(`Có báo cáo mới: ${data.ten}`)
  }
})

// ---------- Khởi tạo / dọn dẹp bản đồ theo vòng đời component ----------
onMounted(async () => {
  const map = await initMap('map', activeLayer.value)
  map.on('click', (e) => {
    if (!pickMode.value) return
    pickedLatLng.value = { lat: e.latlng.lat, lng: e.latlng.lng }
    pickedLocationText.value = `Đã chọn: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
  })
  connect(CONFIG.socketUrl)
  // Khi có mạng trở lại, mỗi báo cáo trong hàng đợi sẽ được "gửi" theo đúng luồng
  // themMarkerBaoCao() có sẵn — tái dùng, không viết logic vẽ marker riêng lần 2.
  offlineQueueStore.khoiTao((baoCao) => themMarkerBaoCao(baoCao, activeLayer.value))
})
onUnmounted(() => destroyMap())

// Đổi tab lớp (?layer=...) không cần tải lại trang — chỉ cập nhật marker đang hiện.
watch(activeLayer, (layer) => {
  if (mapInstance.value) applyLayerVisibility(mapInstance.value, layer)
})
</script>

<template>
  <div class="map-page">
    <MapTopBar @open-report="openReport" />
    <MapStats />
    <div id="map"></div>
    <MapLegend />
    <div class="socket-status" :class="{ connected: isConnected }">
      <span class="dot"></span>{{ isConnected ? 'Cập nhật thời gian thực: đang bật' : 'Cập nhật thời gian thực: chưa kết nối' }}
    </div>
    <div v-if="offlineQueueStore.soLuongChoGui > 0" class="offline-badge">
      <span class="dot"></span>{{ offlineQueueStore.soLuongChoGui }} báo cáo đang chờ gửi
    </div>
    <ReportModal
      :is-open="isReportOpen"
      :picked-location-text="pickedLocationText"
      @close="closeReport"
      @submit="handleSubmitReport"
    />
    <div class="toast" :class="{ show: toastStore.visible }">{{ toastStore.message }}</div>
  </div>
</template>