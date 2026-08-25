// Định nghĩa các kiểu dữ liệu dùng chung — thay cho việc không có ràng buộc kiểu ở bản JS thuần.
// Khi backend thật trả JSON không đúng những field này, TypeScript sẽ báo lỗi ngay lúc build
// thay vì để lỗi âm thầm xuất hiện lúc chạy.

export interface DiemCuuTro {
  ten: string
  lat: number
  lng: number
  loai: string
  mau: string
}

export interface BaoCaoSuCo {
  ten: string
  lat: number
  lng: number
  mucDo: string
  mau: string
}

export type MapLayerKey = 'ranh-gioi' | 'diem-cuutro' | 'bao-cao'

export interface LayerTab {
  key: MapLayerKey
  label: string
}

export interface FeatureCardData {
  num: string
  title: string
  desc: string
  linkLabel: string
  layer: MapLayerKey
}

export interface HighlightFeatureData {
  title: string
  desc: string
  icon: string // tên icon, dùng để chọn đúng SVG trong component
}

export interface ProcessStepData {
  n: number
  title: string
  desc: string
}
