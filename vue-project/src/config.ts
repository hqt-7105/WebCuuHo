// Cấu hình chung cho tầng trình diễn — bản TypeScript của config.js cũ.
// Khi tầng ứng dụng (backend) đã sẵn sàng, chỉ cần đổi apiBaseUrl tại đây.

export interface AppConfig {
  apiBaseUrl: string
  endpoints: {
    ranhGioi: string
    diemCuuTro: string
    baoCaoSuCo: string
  }
  socketUrl: string
}

export const CONFIG: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  endpoints: {
    ranhGioi: '/ranhgioi',
    diemCuuTro: '/diem-cuutro',
    baoCaoSuCo: '/baocao-sucao'
  },
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
}