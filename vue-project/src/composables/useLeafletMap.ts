// Composable chứa toàn bộ logic Leaflet — port từ map.js cũ.
// Tách riêng khỏi component .vue để MapView.vue chỉ còn lo phần template/UI,
// và để logic này có thể viết unit test độc lập sau này nếu cần.

import { ref, shallowRef } from 'vue'
import L from 'leaflet'
import type { DiemCuuTro, BaoCaoSuCo, MapLayerKey } from '@/types'

// TOẠ ĐỘ THẬT của các đô thị trong tỉnh, NỘI DUNG là dữ liệu minh hoạ cho đồ án.
// Khi có PostGIS + API thật, thay mảng này bằng fetch(CONFIG.apiBaseUrl + CONFIG.endpoints.diemCuuTro)
const DIEM_CUU_TRO: DiemCuuTro[] = [
  { ten: 'Nhà văn hoá Đà Lạt', lat: 11.9404, lng: 108.4383, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
  { ten: 'Trung tâm y tế Bảo Lộc', lat: 11.5459, lng: 107.8091, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
  { ten: 'Kho vật tư Phan Thiết', lat: 10.9333, lng: 108.1, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
  { ten: 'Trạm y tế Gia Nghĩa', lat: 12.0044, lng: 107.6877, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' },
  { ten: 'Nhà văn hoá Đức Trọng', lat: 11.7583, lng: 108.4267, loai: 'Điểm tiếp nhận', mau: '#1f3d2e' }
]

// Vị trí minh hoạ, sẽ thay bằng dữ liệu người dùng gửi thật qua endpoint baoCaoSuCo.
const BAO_CAO_SU_CO: BaoCaoSuCo[] = [
  { ten: 'Sạt lở đèo Bảo Lộc', lat: 11.4767, lng: 107.7967, mucDo: 'Khẩn cấp', mau: '#a8462b' },
  { ten: 'Ngập cục bộ khu vực Di Linh', lat: 11.5764, lng: 108.0742, mucDo: 'Cảnh báo', mau: '#d99a35' },
  { ten: 'Cây đổ quốc lộ 28, Đắk Glong cũ', lat: 12.08, lng: 107.79, mucDo: 'Cảnh báo', mau: '#d99a35' }
]

interface GeoJsonProps {
  TinhThanh: string
  SoXa: number
  Dtich_km2: number
  SapNhap: string
}

export function useLeafletMap() {
  const soDiemHienThi = ref(0)
  const boundaryError = ref<string | null>(null)

  // shallowRef: bản đồ Leaflet là object lớn, không cần Vue theo dõi sâu bên trong nó.
  const mapInstance = shallowRef<L.Map | null>(null)
  let diemCuuTroLayer: L.LayerGroup | null = null
  let baoCaoLayer: L.LayerGroup | null = null

  function addMarkers(list: (DiemCuuTro | BaoCaoSuCo)[], radius: number): L.LayerGroup {
    const group = L.layerGroup()
    list.forEach((p) => {
      const nhan = 'loai' in p ? p.loai : p.mucDo
      L.circleMarker([p.lat, p.lng], {
        radius,
        color: '#fff',
        weight: 2,
        fillColor: p.mau,
        fillOpacity: 1
      })
        .bindPopup(`<div class="pin-popup"><b>${p.ten}</b><span>${nhan}</span></div>`)
        .addTo(group)
    })
    return group
  }

  function applyLayerVisibility(map: L.Map, activeLayer: MapLayerKey) {
    if (!diemCuuTroLayer || !baoCaoLayer) return
    map.removeLayer(diemCuuTroLayer)
    map.removeLayer(baoCaoLayer)

    if (activeLayer === 'diem-cuutro') {
      diemCuuTroLayer.addTo(map)
      soDiemHienThi.value = DIEM_CUU_TRO.length
    } else if (activeLayer === 'bao-cao') {
      baoCaoLayer.addTo(map)
      soDiemHienThi.value = BAO_CAO_SU_CO.length
    } else {
      // ranh-gioi: hiện cả hai lớp điểm để có ngữ cảnh, trọng tâm là ranh giới
      diemCuuTroLayer.addTo(map)
      baoCaoLayer.addTo(map)
      soDiemHienThi.value = DIEM_CUU_TRO.length + BAO_CAO_SU_CO.length
    }
  }

  async function initMap(containerId: string, activeLayer: MapLayerKey) {
    const map = L.map(containerId, { zoomControl: false }).setView([11.94, 108.44], 8)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map)

    diemCuuTroLayer = addMarkers(DIEM_CUU_TRO, 8)
    baoCaoLayer = addMarkers(BAO_CAO_SU_CO, 9)
    applyLayerVisibility(map, activeLayer)

    // Lớp ranh giới hành chính — dữ liệu thật (xem nguồn trong README), không phải giả lập.
    try {
      const res = await fetch('/lamdong_tinh.geojson')
      if (!res.ok) throw new Error(`Không tải được lamdong_tinh.geojson (mã ${res.status})`)
      const geojson = await res.json()

      const boundaryLayer = L.geoJSON(geojson, {
        style: { color: '#a8462b', weight: 2, fillColor: '#1f3d2e', fillOpacity: 0.06 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties as GeoJsonProps
          layer.bindPopup(
            `<div class="pin-popup"><b>${p.TinhThanh}</b>` +
              `<span>${p.SoXa} xã/phường · ${p.Dtich_km2.toLocaleString('vi-VN')} km²</span>` +
              `<span>Hợp nhất từ: ${p.SapNhap}</span></div>`
          )
        }
      }).addTo(map)
      map.fitBounds(boundaryLayer.getBounds(), { padding: [30, 30] })
    } catch (err) {
      console.error(err)
      boundaryError.value =
        'Không tải được lớp ranh giới — kiểm tra file lamdong_tinh.geojson có nằm trong thư mục public/ không.'
    }

    mapInstance.value = map
    return map
  }

  function destroyMap() {
    mapInstance.value?.remove()
    mapInstance.value = null
  }

  return {
    mapInstance,
    soDiemHienThi,
    boundaryError,
    initMap,
    applyLayerVisibility,
    destroyMap
  }
}
