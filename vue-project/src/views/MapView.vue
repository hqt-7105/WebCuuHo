<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import '@/assets/map-style.css'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { useMapDataStore } from '@/stores/mapData'
import { useToastStore } from '@/stores/toast'
import type { MapLayerKey } from '@/types'
import MapTopBar from '@/components/map/MapTopBar.vue'
import MapStats from '@/components/map/MapStats.vue'
import MapLegend from '@/components/map/MapLegend.vue'
import ReportModal from '@/components/map/ReportModal.vue'

const route = useRoute()
const activeLayer = computed<MapLayerKey>(() => (route.query.layer as MapLayerKey) || 'ranh-gioi')

const mapDataStore = useMapDataStore()
const toastStore = useToastStore()

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
  mapDataStore.themBaoCao(baoCaoMoi)
  themMarkerBaoCao(baoCaoMoi, activeLayer.value)

  closeReport()
  toastStore.showToast('Đã ghi nhận báo cáo (demo — chưa nối backend thật).')
}

watch(boundaryError, (msg) => {
  if (msg) toastStore.showToast(msg)
})

// ---------- Khởi tạo / dọn dẹp bản đồ theo vòng đời component ----------
onMounted(async () => {
  const map = await initMap('map', activeLayer.value)
  map.on('click', (e) => {
    if (!pickMode.value) return
    pickedLatLng.value = { lat: e.latlng.lat, lng: e.latlng.lng }
    pickedLocationText.value = `Đã chọn: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
  })
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
    <ReportModal
      :is-open="isReportOpen"
      :picked-location-text="pickedLocationText"
      @close="closeReport"
      @submit="handleSubmitReport"
    />
    <div class="toast" :class="{ show: toastStore.visible }">{{ toastStore.message }}</div>
  </div>
</template>