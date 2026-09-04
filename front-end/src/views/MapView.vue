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
import SosButton from '@/components/sos/SosButton.vue'
import SosConfirmDialog from '@/components/sos/SosConfirmDialog.vue'
import AuthModal from '@/components/AuthModal.vue'
import { guiBaoCaoSuCo, guiSos } from '@/services/sosService'
import { useAuthStore } from '@/stores/auth.store'
import type { SosType } from '@/types'

const authStore = useAuthStore()
// Nút SOS chỉ dành cho người dân (victim). Rescuer/commander không gửi SOS.
const laVictim = computed(() => authStore.role === 'victim')

// ---------- Modal đăng nhập/đăng ký (chồng lên map) ----------
const isAuthOpen = ref(false)

// ---------- Luồng gửi SOS thật (nối SosButton → guiSos) ----------
const isSosDialogOpen = ref(false)
function moSosDialog() {
  isSosDialogOpen.value = true
}
async function xacNhanGuiSos(payload: { type: SosType; description: string }) {
  isSosDialogOpen.value = false
  // Lấy vị trí hiện tại của người dùng qua trình duyệt; nếu từ chối, dùng tâm bản đồ.
  const viTri = await layViTriHienTai()
  try {
    await guiSos({ lat: viTri.lat, lng: viTri.lng, type: payload.type, description: payload.description })
    toastStore.showToast('Đã gửi tín hiệu cứu trợ. Đội điều phối sẽ liên hệ sớm.')
  } catch {
    // Interceptor http.ts đã hiện toast lỗi mạng/server.
  }
}
function layViTriHienTai(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 11.94, lng: 108.44 })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 11.94, lng: 108.44 }), // từ chối quyền → tâm tỉnh
      { timeout: 5000 }
    )
  })
}

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

async function handleSubmitReport(data: SubmittedForm) {
  const viTri = pickedLatLng.value ?? { lat: 11.94, lng: 108.44 }

  const baoCaoMoi = {
    ten: data.reqType || 'Yêu cầu cứu trợ',
    lat: viTri.lat,
    lng: viTri.lng,
    mucDo: 'Khẩn cấp',
    mau: '#a8462b'
  }

  closeReport()

  if (navigator.onLine) {
    try {
      const daLuu = await guiBaoCaoSuCo(baoCaoMoi)
      mapDataStore.themBaoCao(daLuu)
      themMarkerBaoCao(daLuu, activeLayer.value)
      toastStore.showToast('Đã gửi báo cáo thành công.')
    } catch {
      offlineQueueStore.themBaoCaoVaoHangDoi(baoCaoMoi)
      toastStore.showToast('Gửi thất bại — đã lưu tạm, sẽ tự gửi lại sau.')
    }
  } else {
    offlineQueueStore.themBaoCaoVaoHangDoi(baoCaoMoi)
    toastStore.showToast('Đang mất mạng — đã lưu báo cáo, sẽ tự gửi khi có mạng trở lại.')
  }
}

  closeReport()
watch(boundaryError, (msg) => {
  if (msg) toastStore.showToast(msg)
})

// ---------- Socket.IO — cập nhật thời gian thực ----------
// TẠM THỜI (Phase 5.3/5.4 sẽ hoàn thiện): lắng nghe sự kiện SOS thật. Hiện chỉ hiện toast
// thông báo; việc vẽ marker SOS lên bản đồ sẽ nối khi mapData store đã đổi sang sosRequests.
const { isConnected, connect } = useSocket({
  onSosNew: (data) => {
    toastStore.showToast(`Có yêu cầu cứu trợ mới tại khu vực ${data.wardCode}`)
  },
  onSosUpdated: (data) => {
    toastStore.showToast(`Yêu cầu ${data.id.slice(0, 8)} chuyển trạng thái: ${data.status}`)
  }
})

// ---------- Khởi tạo / dọn dẹp bản đồ theo vòng đời component ----------
onMounted(async () => {
  const map = await initMap('map', activeLayer.value)
    mapDataStore.taiDiemCuuTroTuServer()
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
    <MapTopBar @open-report="openReport" @open-auth="isAuthOpen = true" />
    <MapStats />
    <div id="map"></div>
    <MapLegend />
    <!-- Nút SOS nổi — chỉ hiện cho người dân (victim) -->
    <div v-if="laVictim" class="sos-fab">
      <SosButton @open="moSosDialog" />
    </div>
    <SosConfirmDialog
      :is-open="isSosDialogOpen"
      @cancel="isSosDialogOpen = false"
      @confirm="xacNhanGuiSos"
    />
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
    <AuthModal :is-open="isAuthOpen" @close="isAuthOpen = false" @logged-in="isAuthOpen = false" />
  </div>
</template>