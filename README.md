# Khiên Số

**Khiên Số** là chương trình mô phỏng tương tác của **HDBank - IT Security**, giúp người chơi hình thành phản xạ trước các thủ đoạn lừa đảo trực tuyến phổ biến.

🌐 Bản public: [https://khien-so.hdbank-it-di-7575.chatgpt.site](https://khien-so.hdbank-it-di-7575.chatgpt.site)

## Tính năng

- 10 kịch bản phân nhánh theo 4 cấp độ khó
- Hệ thống tài sản, cảnh giác và điểm phòng vệ
- Phản hồi giải thích sau từng lựa chọn
- Tìm kiếm và lọc tình huống
- Chứng cứ, huy hiệu, chuỗi thành tích và thống kê
- Cẩm nang xử lý khẩn cấp theo quy tắc Dừng — Kiểm — Báo
- Chế độ sáng/tối và giao diện responsive
- Lưu tiến trình riêng trên thiết bị bằng `localStorage`
- Không yêu cầu hoặc thu thập dữ liệu cá nhân thật
- Bộ nhận diện HDBank chính thức với màu đỏ `#BE1128`, vàng `#FFDC00` và logo từ hdbank.com.vn

## Chạy cục bộ

Yêu cầu Node.js 22.13+ và pnpm.

```bash
pnpm install
pnpm run dev
```

Mở `http://localhost:3000`.

## Kiểm thử và build

```bash
pnpm run build
node --test tests/rendered-html.test.mjs
```

## Công nghệ

React 19, TypeScript, vinext/Vite và Cloudflare Workers-compatible output.

## Lưu ý

Đây là sản phẩm giáo dục mô phỏng. Khi đã phát sinh thiệt hại, hãy liên hệ ngân hàng để khoá giao dịch, lưu bằng chứng và trình báo cơ quan công an gần nhất.
