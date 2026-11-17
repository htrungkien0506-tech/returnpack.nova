# RETURNPACK MANAGEMENT SYSTEM (RMS)
**Tagline:** Giao hàng xanh – Bao bì tuần hoàn

Hệ thống SaaS quản lý vòng đời bao bì thương mại điện tử tái sử dụng (Reusable E-commerce Packaging Lifecycle Management System) được thiết kế theo kiến trúc **Next.js (App Router) + React + TypeScript + Tailwind CSS + Supabase PostgreSQL (RLS)**.

## 1. Kiến trúc & Bảo mật
- **31 Bảng PostgreSQL chuẩn hóa**: Xem chi tiết tại `supabase/migrations/001_returnpack_schema_and_rls.sql`.
- **7 Vai trò RBAC & RLS**: `SUPER_ADMIN`, `RETURNPACK_ADMIN`, `SHOP_OWNER`, `SHOP_STAFF`, `SHIPPER`, `WAREHOUSE_STAFF`, `CUSTOMER`.
- **Cô lập dữ liệu (Data Isolation)**: Shop A không thể truy cập dữ liệu của Shop B. Shipper chỉ xem được các nhiệm vụ đã phân công. Trang QR công khai (`/return/[token]`) chỉ sử dụng mã định danh túi (`RP-xxxxxx`), tuyệt đối không lộ thông tin cá nhân của khách hàng trước đó.
- **Bảo vệ khóa bí mật**: `SUPABASE_SERVICE_ROLE_KEY` chỉ nằm trên biến môi trường máy chủ, không bao giờ đưa ra phía client.

## 2. Cài đặt tại máy cá nhân (Không cần Docker)
1. Sao chép file cấu hình môi trường:
   ```bash
   cp .env.example .env.local
   ```
2. Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` từ Supabase Dashboard của bạn.
3. Chạy migration SQL trong Supabase SQL Editor bằng nội dung của:
   - `supabase/migrations/001_returnpack_schema_and_rls.sql`
   - `supabase/migrations/002_seed_demo_data.sql` (Dữ liệu mẫu có gắn nhãn `[DEMO]`)
4. Cài đặt dependencies và khởi chạy:
   ```bash
   npm install
   npm run dev
   ```

## 3. Triển khai lên tên miền `app.returnpack.id.vn` (Vercel)
1. Đẩy source code lên GitHub repository của dự án Returnpack.
2. Đăng nhập Vercel, chọn **Add New Project** và kết nối repository.
3. Thiết lập các biến môi trường trong `.env.example` vào mục **Environment Variables** trên Vercel.
4. Vào **Settings -> Domains**, thêm domain `app.returnpack.id.vn`.
5. Tại trang quản trị DNS của tên miền `returnpack.id.vn`, thêm bản ghi:
   - **Type**: `CNAME`
   - **Name**: `app`
   - **Value**: `cname.vercel-dns.com`
