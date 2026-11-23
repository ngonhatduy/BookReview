# Hướng dẫn cài đặt CI/CD GitHub Pages, Supabase & Tên miền phamngoctran.page (Name.com)

Dự án **BookWeb (Tủ Sách Của Mình)** đã được cấu hình sẵn workflow CI/CD tại `.github/workflows/deploy.yml` và tên miền tùy chỉnh `public/CNAME` (`phamngoctran.page`). Mỗi khi bạn push code lên nhánh `main`, GitHub Actions sẽ tự động chạy `vue-tsc --noEmit`, build Vite và deploy lên GitHub Pages.

---

## Bước 1: Cấu hình Supabase (`rvesixokrnrkilkqqpmu`)

1. Nếu bạn chưa chạy SQL tạo bảng:
   - Mở [SQL Editor trên Supabase](https://supabase.com/dashboard/project/rvesixokrnrkilkqqpmu/sql/new).
   - Copy toàn bộ nội dung file `supabase/schema.sql`, dán vào khung soạn thảo và bấm **Run**.
2. Cấu hình đường dẫn Auth để chức năng đăng ký xác nhận email & quên mật khẩu chuyển hướng đúng:
   - Vào [Authentication → URL Configuration](https://supabase.com/dashboard/project/rvesixokrnrkilkqqpmu/auth/url-configuration).
   - **Site URL:**
     ```
     https://phamngoctran.page
     ```
   - **Redirect URLs** (thêm đủ cả 3 dòng):
     ```
     https://phamngoctran.page/**
     https://www.phamngoctran.page/**
     http://localhost:5173/**
     ```

---

## Bước 2: Thêm Secrets cho GitHub Actions (`ngonhatduy/BookReview`)

1. Vào trang cài đặt Secrets của repository:
   `https://github.com/ngonhatduy/BookReview/settings/secrets/actions`
2. Bấm **New repository secret** và thêm lần lượt 2 biến sau:

| Name | Secret |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://rvesixokrnrkilkqqpmu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_M-05Wp688osZ5fTtXWL6_Q_8wcPxJkQ` |

*(File `.env` ở máy cá nhân đã được `.gitignore` loại trừ để không bị đẩy lên GitHub).*

---

## Bước 3: Bật GitHub Pages & Custom Domain

1. Vào cài đặt Pages của repository:
   `https://github.com/ngonhatduy/BookReview/settings/pages`
2. Ở mục **Build and deployment → Source**, chọn **GitHub Actions**.
3. Ở mục **Custom domain**, nhập `phamngoctran.page` và bấm **Save**.
4. Sau khi cấu hình DNS ở Bước 4 hoàn tất và được GitHub kiểm tra thành công, tick chọn **Enforce HTTPS** *(bắt buộc đối với đuôi `.page` do cơ chế HSTS preload)*.

---

## Bước 4: Cấu hình DNS trên Name.com (`phamngoctran.page`)

1. Mở trang quản lý tên miền:
   `https://www.name.com/account/domain/details/phamngoctran.page` → chọn **Manage DNS Records**.
2. Xóa các bản ghi `A`, `CNAME`, `ANAME` hoặc `URL Redirect` mặc định đang trỏ về trang parking cho tên miền gốc (`@` / trống) và `www`.
3. Thêm đúng 5 bản ghi sau:

| Type | Host | Answer | TTL |
| :--- | :--- | :--- | :--- |
| `A` | *(để trống hoặc `@`)* | `185.199.108.153` | `300` |
| `A` | *(để trống hoặc `@`)* | `185.199.109.153` | `300` |
| `A` | *(để trống hoặc `@`)* | `185.199.110.153` | `300` |
| `A` | *(để trống hoặc `@`)* | `185.199.111.153` | `300` |
| `CNAME` | `www` | `ngonhatduy.github.io` | `300` |

4. Chờ 5–30 phút để DNS cập nhật trên toàn cầu, sau đó quay lại **GitHub Settings → Pages** để bật **Enforce HTTPS**.

---

## Bước 5: Tạo tài khoản Admin đầu tiên

1. Mở `https://phamngoctran.page`.
2. Bấm nút **Đăng nhập** ở góc trên bên phải → chuyển sang tab **Đăng ký**.
3. Tạo tài khoản đầu tiên của bạn — hệ thống sẽ tự động gán quyền **Admin** cho tài khoản đầu tiên này để bạn thêm/sửa/xóa sách và tải ảnh bìa.

---

## Chạy thử trên máy cá nhân (Local)

File `.env` đã được tạo sẵn với kết nối Supabase của bạn. Để chạy local:

```bash
npm run dev
```
