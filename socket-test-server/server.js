// Server GIẢ — chỉ để tự kiểm tra useSocket.ts phía frontend có nhận đúng sự kiện
// và cập nhật bản đồ real-time hay không. KHÔNG phải backend thật của đồ án — không có
// PostGIS, không xác thực, không lưu trữ gì cả. Xoá cả thư mục này bất cứ lúc nào
// cũng không ảnh hưởng gì tới vue-project/.

const { Server } = require('socket.io')

const io = new Server(4000, {
  cors: { origin: '*' } // cho phép Vite dev server (cổng khác) gọi tới, chỉ dùng lúc test
})

// Dữ liệu giả — TOẠ ĐỘ THẬT trong tỉnh, nội dung là bịa cho mục đích test.
const BAO_CAO_GIA = [
  { ten: 'Sạt lở QL27, Đức Trọng', lat: 11.85, lng: 108.35, mucDo: 'Khẩn cấp', mau: '#a8462b' },
  { ten: 'Ngập cục bộ Bảo Lộc', lat: 11.55, lng: 107.8, mucDo: 'Cảnh báo', mau: '#d99a35' },
  { ten: 'Cây đổ Di Linh', lat: 11.58, lng: 108.08, mucDo: 'Cảnh báo', mau: '#d99a35' }
]

io.on('connection', (socket) => {
  console.log('[socket-test-server] Client vừa kết nối:', socket.id)

  let i = 0
  // Cứ 8 giây, giả vờ có 1 báo cáo mới gửi tới — để bạn thấy marker tự hiện lên
  // trên bản đồ đang mở mà không cần bấm nút hay tải lại trang gì cả.
  const interval = setInterval(() => {
    const baoCao = BAO_CAO_GIA[i % BAO_CAO_GIA.length]
    socket.emit('bao-cao:moi', baoCao)
    console.log('[socket-test-server] Đã gửi báo cáo giả:', baoCao.ten)
    i++
  }, 8000)

  socket.on('disconnect', () => {
    clearInterval(interval)
    console.log('[socket-test-server] Client ngắt kết nối:', socket.id)
  })
})

console.log('[socket-test-server] Đang chạy tại ws://localhost:4000 — nhấn Ctrl+C để dừng.')
