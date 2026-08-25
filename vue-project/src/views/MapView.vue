<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import '@/assets/map-style.css'
import { useLeafletMap } from '@/composables/useLeafletMap'
import type { MapLayerKey } from '@/types'
import MapTopBar from '@/components/map/MapTopBar.vue'
import MapStats from '@/components/map/MapStats.vue'
import MapLegend from '@/components/map/MapLegend.vue'
import ReportModal from '@/components/map/ReportModal.vue'

const route = useRoute()
const activeLayer = computed<MapLayerKey>(() => (route.query.layer as MapLayerKey) || 'ranh-gioi')

const { mapInstance, soDiemHienThi, boundaryError, initMap, applyLayerVisibility, destroyMap } =
  useLeafletMap()

// ---------- Modal gửi báo cáo ----------
const isReportOpen = ref(false)
const pickMode = ref(false)
const pickedLocationText = ref(
  'Bấm vào bản đồ phía sau để chọn vị trí, hoặc để trống dùng vị trí trung tâm tỉnh.'
)

function openReport() {
  isReportOpen.value = true
  pickMode.value = true
  pickedLocationText.value = 'Bấm vào bản đồ phía sau để chọn vị trí, hoặc để trống dùng vị trí trung tâm tỉnh.'
}
function closeReport() {
  isReportOpen.value = false
  pickMode.value = false
}
function handleSubmitReport() {
  // Chưa có backend thật — đây là nơi sau này gọi:
  // fetch(CONFIG.apiBaseUrl + CONFIG.endpoints.baoCaoSuCo, { method: 'POST', body: JSON.stringify(data) })
  closeReport()
  showToast('Đã ghi nhận báo cáo (demo — chưa nối backend thật).')
}

// ---------- Toast ----------
const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastVisible.value = false), 3200)
}

watch(boundaryError, (msg) => {
  if (msg) showToast(msg)
})

// ---------- Khởi tạo / dọn dẹp bản đồ theo vòng đời component ----------
onMounted(async () => {
  const map = await initMap('map', activeLayer.value)
  map.on('click', (e) => {
    if (!pickMode.value) return
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
    <MapStats :so-diem="soDiemHienThi" />
    <div id="map"></div>
    <MapLegend />
    <ReportModal
      :is-open="isReportOpen"
      :picked-location-text="pickedLocationText"
      @close="closeReport"
      @submit="handleSubmitReport"
    />
    <div class="toast" :class="{ show: toastVisible }">{{ toastMessage }}</div>
  </div>
</template>
