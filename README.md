# Khiên Số

**Khiên Số** là trò chơi cộng đồng độc lập giúp người chơi luyện phản xạ nhận diện lừa đảo trực tuyến qua các tình huống mô phỏng.

🌐 Trải nghiệm công khai: [https://tanthanh381.github.io/chongluadao/](https://tanthanh381.github.io/chongluadao/)

## Định vị

- Dự án giáo dục cộng đồng, không đại diện cho bất kỳ ngân hàng hoặc tổ chức nào
- Không phải website giao dịch và không cung cấp tư vấn pháp lý hoặc tài chính
- Không yêu cầu đăng ký tài khoản
- Không thu thập họ tên, email, số điện thoại hoặc dữ liệu ngân hàng
- Không gửi kết quả chơi lên máy chủ
- Tiến trình chỉ được lưu cục bộ trong trình duyệt của người chơi

## Tính năng

- 10 kịch bản phân nhánh theo 4 cấp độ khó
- Hệ thống tài sản mô phỏng, cảnh giác và điểm phòng vệ
- Phản hồi giải thích sau từng lựa chọn
- Tìm kiếm và lọc tình huống
- Chứng cứ, huy hiệu, chuỗi thành tích và thống kê ẩn danh
- Cẩm nang xử lý theo quy tắc Dừng — Kiểm — Báo
- Chế độ sáng/tối và giao diện responsive
- Trang giới thiệu, điều khoản sử dụng và chính sách quyền riêng tư

## Quyền riêng tư

Website chỉ lưu các trường sau trong `localStorage` của trình duyệt:

- Tài sản và mức cảnh giác trong trò chơi
- Các lựa chọn mô phỏng và huy hiệu đã mở
- Chế độ giao diện sáng/tối

Người chơi có thể chọn **Đặt lại toàn bộ tiến trình** hoặc xóa dữ liệu website trong trình duyệt để xóa toàn bộ dữ liệu cục bộ. Website không sử dụng hệ thống tài khoản, cơ sở dữ liệu người dùng hoặc Dashboard tập trung.

## Chạy cục bộ

Yêu cầu Node.js 22.13+ và pnpm.

```bash
pnpm install
pnpm run dev
```

Mở `http://localhost:3000`.

## Kiểm thử và phát hành

```bash
pnpm run test
pnpm run build:pages
```

GitHub Pages được phát hành từ bản build tĩnh trong nhánh `gh-pages`.

## Công nghệ

React 19, TypeScript, vinext/Vite và đầu ra tương thích Cloudflare Workers/GitHub Pages.

## Lưu ý an toàn

Không nhập mật khẩu, OTP, số tài khoản, CCCD, thông tin khách hàng hoặc dữ liệu bí mật vào website. Khi đã phát sinh sự cố thật, hãy dừng giao dịch, liên hệ tổ chức liên quan qua kênh chính thức, lưu bằng chứng và trình báo cơ quan chức năng gần nhất.
