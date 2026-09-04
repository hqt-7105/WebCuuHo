// Composable chứa toàn bộ logic Leaflet.
// Điểm mới so với bản trước: marker giờ dùng L.marker + icon tuỳ biến (thay L.circleMarker
// chấm tròn), và nội dung popup được RENDER BẰNG COMPONENT VUE THẬT (MarkerPopupCard.vue)
// thay vì chuỗi HTML tĩnh — có thể bấm nút, gọi thẳng action của Pinia store.

import { h, render, ref, shallowRef } from 'vue'
import L from 'leaflet'
import type { DiemCuuTro, BaoCaoSuCo, MapLayerKey } from '@/types'
import { useMapDataStore } from '@/stores/mapData'
import { useToastStore } from '@/stores/toast'
import { taoIconMarker, type MarkerKind } from '@/utils/markerIcon'
import MarkerPopupCard from '@/components/map/MarkerPopupCard.vue'

interface GeoJsonProps {
  TinhThanh: string
  SoXa: number
  Dtich_km2: number
  SapNhap: string
}

export function useLeafletMap() {
  const store = useMapDataStore()
  const toastStore = useToastStore()

  const soDiemHienThi = ref(0)
  const boundaryError = ref<string | null>(null)
  const mapInstance = shallowRef<L.Map | null>(null)

  let diemCuuTroLayer: L.LayerGroup | null = null
  let baoCaoLayer: L.LayerGroup | null = null

  function markerTuDuLieu(p: DiemCuuTro | BaoCaoSuCo): L.Marker {
    const isDiem = 'loai' in p
    const kind: MarkerKind = isDiem ? 'tiep-nhan' : p.mucDo === 'Khẩn cấp' ? 'khan-cap' : 'canh-bao'

    const marker = L.marker([p.lat, p.lng], { icon: taoIconMarker(p.mau, kind) })

    // Container rỗng đưa cho Leaflet — Vue sẽ "bơm" nội dung thật vào đây lúc popup mở.
    const popupContainer = document.createElement('div')
    marker.bindPopup(popupContainer, { minWidth: 170 })

    marker.on('popupopen', () => {
      const vnode = h(MarkerPopupCard, {
        title: p.ten,
        subtitle: isDiem ? p.loai : p.mucDo,
        badge: isDiem ? undefined : p.mucDo,
        showAction: !isDiem,
        onAction: () => {
          if (!isDiem) {
            store.xacNhanDaXuLy(p)
            baoCaoLayer?.removeLayer(marker)
            toastStore.showToast('Đã đánh dấu báo cáo là hoàn tất xử lý.')
          }
        }
      })
      render(vnode, popupContainer)
      // Leaflet đo kích thước popup NGAY lúc mở — nhưng lúc đó Vue chưa kịp bơm nội dung
      // vào (dòng render() ở trên chạy SAU khi Leaflet đã đo xong div rỗng). Nếu không gọi
      // update() ở đây, Leaflet giữ nguyên kích thước cũ (quá nhỏ), khiến chữ tràn ra ngoài
      // khung trắng. update() bảo Leaflet đo lại đúng kích thước sau khi có nội dung thật.
      marker.getPopup()?.update()
    })

    // BẮT BUỘC gỡ component khi popup đóng — không gỡ sẽ rò rỉ bộ nhớ vì Vue vẫn giữ
    // instance component cũ dù người dùng không còn thấy nó trên màn hình nữa.
    marker.on('popupclose', () => {
      render(null, popupContainer)
    })

    return marker
  }

  function buildMarkerLayers() {
    diemCuuTroLayer = L.layerGroup(store.diemCuuTro.map(markerTuDuLieu))
    baoCaoLayer = L.layerGroup(store.baoCaoSuCo.map(markerTuDuLieu))
  }

  function applyLayerVisibility(map: L.Map, activeLayer: MapLayerKey) {
    if (!diemCuuTroLayer || !baoCaoLayer) return
    map.removeLayer(diemCuuTroLayer)
    map.removeLayer(baoCaoLayer)

    if (activeLayer === 'diem-cuutro') {
      diemCuuTroLayer.addTo(map)
    } else if (activeLayer === 'bao-cao') {
      baoCaoLayer.addTo(map)
    } else {
      diemCuuTroLayer.addTo(map)
      baoCaoLayer.addTo(map)
    }
    soDiemHienThi.value = store.soDiemTheoLop(activeLayer)
  }

  function themMarkerBaoCao(baoCao: BaoCaoSuCo, activeLayer: MapLayerKey) {
    if (!baoCaoLayer || !mapInstance.value) return
    markerTuDuLieu(baoCao).addTo(baoCaoLayer)
    applyLayerVisibility(mapInstance.value, activeLayer)
  }

  async function initMap(containerId: string, activeLayer: MapLayerKey) {
    const map = L.map(containerId, { zoomControl: false }).setView([11.94, 108.44], 8)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map)

    buildMarkerLayers()
    applyLayerVisibility(map, activeLayer)

    // Ưu tiên ranh giới XÃ/PHƯỜNG (dữ liệu tĩnh, api-contract: không có API ranh giới).
    // Nếu file wards chưa có (đang chờ nhóm cung cấp), fallback về ranh giới TỈNH để
    // bản đồ không trống. Khi có file wards thật, tự động dùng, không cần sửa code.
    try {
      let geojson: unknown
      let laRanhGioiXa = true

      const resWards = await fetch('/data/lamdong-wards.geojson')
      if (resWards.ok) {
        geojson = await resWards.json()
      } else {
        // Fallback: file xã/phường chưa có → dùng ranh giới tỉnh tạm.
        laRanhGioiXa = false
        const resTinh = await fetch('/lamdong_tinh.geojson')
        if (!resTinh.ok) throw new Error(`Không tải được ranh giới (mã ${resTinh.status})`)
        geojson = await resTinh.json()
      }

      const boundaryLayer = L.geoJSON(geojson as GeoJSON.GeoJsonObject, {
        // Ranh giới xã: đường mảnh, nhạt (nhiều vùng). Ranh giới tỉnh: đường đậm hơn.
        style: laRanhGioiXa
          ? { color: '#a8462b', weight: 1, fillColor: '#1f3d2e', fillOpacity: 0.03 }
          : { color: '#a8462b', weight: 2, fillColor: '#1f3d2e', fillOpacity: 0.06 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties ?? {}
          if (laRanhGioiXa) {
            // Tên field tuỳ nguồn dữ liệu wards — thử vài tên phổ biến (ten_xa, TenXa, name...).
            const tenXa = p.ten_xa ?? p.TenXa ?? p.name ?? p.NAME ?? 'Xã/phường'
            const maXa = p.ma_xa ?? p.MaXa ?? p.ward_code ?? ''
            layer.bindPopup(
              `<div class="pin-popup"><b>${tenXa}</b>` +
                (maXa ? `<span>Mã: ${maXa}</span>` : '') +
                `</div>`
            )
          } else {
            const gp = p as GeoJsonProps
            layer.bindPopup(
              `<div class="pin-popup"><b>${gp.TinhThanh}</b>` +
                `<span>${gp.SoXa} xã/phường · ${gp.Dtich_km2.toLocaleString('vi-VN')} km²</span>` +
                `<span>Hợp nhất từ: ${gp.SapNhap}</span></div>`
            )
          }
        }
      }).addTo(map)
      map.fitBounds(boundaryLayer.getBounds(), { padding: [30, 30] })
    } catch (err) {
      console.error(err)
      boundaryError.value =
        'Không tải được lớp ranh giới — kiểm tra file public/data/lamdong-wards.geojson hoặc public/lamdong_tinh.geojson.'
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
    themMarkerBaoCao,
    destroyMap
  }
}