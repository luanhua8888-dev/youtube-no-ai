# Đưa YouTube Không AI lên Chrome Web Store

## Gói tải lên

File `output/youtube-khong-ai-1.4.0.zip` chứa manifest ở gốc, mã chạy của tiện ích và icon. Không chứa `node_modules`, kiểm thử hoặc ảnh minh họa. Đây là gói code để tải lên, không thay thế các mục hồ sơ cửa hàng bên dưới.

## Quy trình

1. Truy cập https://chrome.google.com/webstore/devconsole, đăng nhập tài khoản Google và đăng ký nhà phát triển. Thanh toán phí đăng ký một lần theo số tiền dashboard hiển thị, bật xác minh hai bước và hoàn tất thông tin tài khoản mà dashboard yêu cầu.
2. Chọn **Add new item / New item**, tải file ZIP. Không tải toàn bộ thư mục dự án hoặc file CRX.
3. Điền thông tin Store Listing: tiếng Việt, tên, mô tả, danh mục phù hợp, icon `icons/icon128.png`, ảnh chụp và hình quảng bá.
4. Điền Privacy: mục đích duy nhất, giải thích quyền và cách xử lý dữ liệu đúng theo mã hiện tại; đưa URL công khai của chính sách quyền riêng tư.
5. Chọn vùng phân phối và mức hiển thị. Có thể dùng Unlisted cho người có link thử trước. Điền hướng dẫn kiểm thử bên dưới.
6. Chọn **Submit for review**. Có thể chọn tự đăng sau duyệt hoặc đăng thủ công. Thời gian duyệt do Google quyết định; không bảo đảm được duyệt.

## Nội dung có thể sao chép

Tên: YouTube Không AI

Mô tả ngắn: Tùy chỉnh bảng tin YouTube bằng nhãn AI, từ khóa và bộ lọc kênh.

Mô tả đầy đủ:

YouTube Không AI giúp bạn ẩn các thẻ video không muốn xem trên YouTube máy tính.

- Lọc nội dung về AI hoặc video có dấu hiệu do AI tạo bằng từ khóa.
- Kiểm tra nhãn AI của YouTube ngay cả khi tiêu đề không nhắc AI. Kiểm tra bổ sung tải thông tin trang video từ YouTube khi thẻ gần vùng nhìn thấy; có thể mất vài giây.
- Tùy chọn lọc nhóm truyện xuyên không/trọng sinh và kênh có tên Vietsub. Đây là bộ lọc theo sở thích, không phải xác nhận các video thuộc nhóm đó do AI tạo.
- Thêm từ khóa, chặn kênh, cho phép kênh và hiện lại video bị lọc nhầm.
- Xem số video đang bị chặn trên tab hiện tại.
- Giao diện tiếng Việt, tùy chọn ẩn hoàn toàn hoặc hiển thị lý do lọc.

Cài đặt lưu trên máy. Tiện ích chỉ kết nối với YouTube để kiểm tra nhãn; không có máy chủ hoặc analytics của nhà phát triển. Không phân tích hình ảnh/âm thanh; có thể bỏ sót hoặc lọc nhầm, nhất là khi YouTube đổi giao diện hoặc không trả dữ liệu nhãn. Tiện ích không dừng video đang phát, không hỗ trợ ứng dụng YouTube trên điện thoại. Đây là tiện ích độc lập, không liên kết hoặc được YouTube/Google bảo trợ.

Mục đích duy nhất / Single purpose:

Cho phép người dùng tùy chỉnh các thẻ video hiển thị trên YouTube theo nhãn AI, từ khóa và sở thích về kênh/thể loại.

Giải thích quyền storage:

Lưu cục bộ trạng thái bật/tắt, từ khóa, danh sách kênh và tùy chọn lọc; không đồng bộ hoặc gửi cài đặt cho nhà phát triển.

Giải thích quyền truy cập `https://www.youtube.com/*` qua content scripts:

Đọc nội dung thẻ video trên YouTube để lọc và thêm nút hiện lại/cho phép kênh. Khi bật kiểm tra nhãn bổ sung, gửi yêu cầu tới trang video của chính YouTube để đọc nhãn AI. Chỉ chạy trên YouTube, không cần truy cập mọi website.

Remote code:

Không sử dụng mã thực thi từ xa. JavaScript/CSS được đóng gói trong tiện ích. HTML tải từ YouTube chỉ được đọc như dữ liệu; script tải về không được thực thi.

Hướng dẫn kiểm thử:

Không cần tài khoản riêng của tiện ích. Mở YouTube máy tính, kiểm tra trang chủ/tìm kiếm/đề xuất. Video có từ khóa AI, tiêu đề trọng sinh/xuyên về hoặc kênh Vietsub sẽ được lọc theo tùy chọn mặc định. Mở popup để xem số thẻ bị chặn, đổi bộ lọc và lưu. Thử Hiện video và Cho phép kênh. Tắt toàn bộ bộ lọc để khôi phục thẻ. Kiểm tra nhãn bổ sung có thể mất vài giây và phụ thuộc phản hồi từ YouTube.

## Chính sách quyền riêng tư và ảnh

- Điền tên nhà phát triển/email thật trong `store/PRIVACY_POLICY.md`, đăng nội dung lên một trang HTTPS công khai (chẳng hạn trang của bạn hoặc GitHub Pages), rồi điền URL vào dashboard. File trên máy không phải URL công khai.
- Khai báo việc xử lý **Website content** và các URL/ID video dùng cho kiểm tra nhãn trong phần dữ liệu; đọc định nghĩa **Web history** trong dashboard để chọn mục phù hợp với dữ liệu được xử lý. Không khai “không xử lý dữ liệu” chỉ vì dữ liệu phần lớn ở trên máy. Không khai thu thập mật khẩu, thanh toán hoặc dữ liệu sức khỏe vì tiện ích không truy cập những dữ liệu đó.
- Icon đã có: `icons/icon128.png`.
- Chuẩn bị ít nhất 1 ảnh chụp 1280×800 hoặc 640×400 và hình quảng bá nhỏ 440×280. Các ảnh `output/popup-*.png` hiện có kích thước 820×1200, dùng số đếm giả lập; chưa phải ảnh chụp đúng chuẩn để tải thẳng lên Store. Nên chụp bản chạy thực tế trên YouTube và trình bày đúng khả năng của tiện ích.
- Kiểm tra bản ZIP trên Chrome với YouTube thật trước khi gửi duyệt; các kiểm thử tự động không thay thế kiểm tra giao diện YouTube đang dùng.

## Nguồn chính thức

- Đăng ký: https://developer.chrome.com/docs/webstore/register/
- Tài khoản: https://developer.chrome.com/docs/webstore/set-up-account
- Đăng tiện ích: https://developer.chrome.com/docs/webstore/publish
- Hình ảnh: https://developer.chrome.com/docs/webstore/images
- Khai báo quyền riêng tư: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Dữ liệu xử lý cục bộ cũng phải khai báo: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
