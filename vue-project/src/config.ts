// Cấu hình chung cho tầng trình diễn — bản TypeScript của config.js cũ.
// Khi tầng ứng dụng (backend) đã sẵn sàng, chỉ cần đổi apiBaseUrl tại đây.

export interface AppConfig {
  apiBaseUrl: string
  endpoints: {
    ranhGioi: string
    diemCuuTro: string
    baoCaoSuCo: string
  }
}

export const CONFIG: AppConfig = {
  // Ví dụ sau này: "https://api.bandocuutro-lamdong.vn"
  apiBaseUrl: 'http://localhost:3000/api',
  endpoints: {
    ranhGioi: '/ranhgioi',
    diemCuuTro: '/diem-cuutro',
    baoCaoSuCo: '/baocao-sucao'
  }
}
