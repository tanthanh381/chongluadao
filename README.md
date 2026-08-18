# Khiên Số

**Khiên Số** là chương trình mô phỏng tương tác của **HDBank - IT Security**, giúp người chơi hình thành phản xạ trước các thủ đoạn lừa đảo trực tuyến phổ biến.

🌐 Bản public: [https://tanthanh381.github.io/chongluadao/](https://tanthanh381.github.io/chongluadao/)

## Tính năng

- 10 kịch bản phân nhánh theo 4 cấp độ khó
- Hệ thống tài sản, cảnh giác và điểm phòng vệ
- Phản hồi giải thích sau từng lựa chọn
- Tìm kiếm và lọc tình huống
- Chứng cứ, huy hiệu, chuỗi thành tích và thống kê
- Cẩm nang xử lý khẩn cấp theo quy tắc Dừng — Kiểm — Báo
- Chế độ sáng/tối và giao diện responsive
- Đăng ký/đăng nhập email bằng Supabase Auth
- Tham gia ngay với tư cách khách, không cần đăng ký và không tạo bản ghi Supabase
- Đồng bộ hồ sơ, tiến trình và kết quả kiểm tra giữa các thiết bị
- Dashboard dữ liệu tập trung, chỉ mở cho tài khoản được cấp quyền CISO
- Row Level Security bảo đảm người dùng thường chỉ đọc/ghi dữ liệu của chính mình
- `localStorage` chỉ dùng cho giao diện và tiến trình khách chưa đăng nhập
- Không yêu cầu hoặc thu thập dữ liệu ngân hàng
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

React 19, TypeScript, vinext/Vite, Supabase Auth/Postgres và Cloudflare Workers-compatible output.

## Dữ liệu và phân quyền

Cấu trúc cơ sở dữ liệu nằm tại `supabase/schema.sql`. Website chỉ chứa khóa Supabase publishable dành cho trình duyệt; không chứa secret key hoặc `service_role`.

Để cấp quyền Dashboard cho một tài khoản đã xác nhận email, chạy bằng SQL Editor của Supabase với email quản trị thực tế:

```sql
insert into private.app_admins (user_id)
select id from auth.users where email = 'ciso@example.com'
on conflict (user_id) do nothing;
```

Trong Supabase Authentication → URL Configuration, đặt Site URL là `https://tanthanh381.github.io/chongluadao/` và thêm cùng URL vào Redirect URLs để liên kết xác nhận email quay lại đúng website.

## Lưu ý

Đây là sản phẩm giáo dục mô phỏng. Khi đã phát sinh thiệt hại, hãy liên hệ ngân hàng để khoá giao dịch, lưu bằng chứng và trình báo cơ quan công an gần nhất.
