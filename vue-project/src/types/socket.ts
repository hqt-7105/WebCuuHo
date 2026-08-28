// "Hợp đồng" sự kiện Socket.IO — cả client (file này) và server (khi ai đó xây dựng thật)
// đều phải bám đúng tên sự kiện + hình dạng dữ liệu khai báo ở đây. Không có server thật
// vẫn viết được vì đây thuần là khai báo kiểu, không gọi mạng gì cả.

import type { BaoCaoSuCo } from './index'

// Sự kiện SERVER gửi XUỐNG cho client
export interface ServerToClientEvents {
  'bao-cao:moi': (data: BaoCaoSuCo) => void
}

// Sự kiện CLIENT gửi LÊN cho server — hiện chưa dùng tới, khai báo sẵn chỗ cho sau này
// (ví dụ: báo server biết mình đang xem tỉnh nào để chỉ nhận đúng dữ liệu liên quan).
export interface ClientToServerEvents {
  'xem:trang-ban-do': () => void
}