# socket-test-server — CHỈ để tự kiểm tra, không phải backend thật

Thư mục này **hoàn toàn tách biệt** khỏi `vue-project/` — không chung `package.json`,
không chung `node_modules`. Xoá cả thư mục này đi bất cứ lúc nào cũng **không** ảnh hưởng
gì tới project Vue chính — `npm run dev` bên đó vẫn chạy bình thường, chỉ là không còn
ai gửi dữ liệu real-time tới nữa (chỉ báo góc dưới phải sẽ hiện "chưa kết nối").

## Cách chạy

Mở terminal MỚI (khác với terminal đang chạy `npm run dev` của vue-project), vào đúng
thư mục này:

```bash
cd socket-test-server
npm install
npm start
```

Thấy dòng `Đang chạy tại ws://localhost:4000` là server test đã sẵn sàng.

## Cách kiểm tra

1. Mở `vue-project` bằng `npm run dev` (terminal khác, vẫn phải chạy song song).
2. Mở `http://localhost:5173/map` trên trình duyệt.
3. Nhìn góc dưới phải — chỉ báo phải chuyển từ "chưa kết nối" sang "đang bật" trong vài giây.
4. Cứ mỗi 8 giây, 1 marker báo cáo mới sẽ tự xuất hiện trên bản đồ + có toast thông báo —
   không cần bấm gì cả, đây chính là phần "real-time" đang hoạt động.

## Khi có backend thật

Xoá thư mục này đi, và đổi `socketUrl` trong `vue-project/src/config.ts` trỏ sang địa chỉ
server Socket.IO thật. Toàn bộ code phía client (`useSocket.ts`, `MapView.vue`) không cần
sửa gì thêm — miễn backend thật cũng phát đúng sự kiện `bao-cao:moi` với đúng hình dạng dữ
liệu đã khai báo trong `vue-project/src/types/socket.ts`.
