# Chính sách quyền riêng tư — YouTube Không AI

Cập nhật: 12/10/2026. Áp dụng cho phiên bản 1.4.0.

> Trước khi đăng công khai, thay thông tin nhà phát triển và liên hệ ở cuối trang bằng thông tin thật.

YouTube Không AI giúp người dùng lọc các thẻ video trên YouTube bằng từ khóa, nhãn AI và tùy chọn kênh/thể loại.

## Dữ liệu được xử lý

Tiện ích đọc tiêu đề video, tên kênh, handle, đường dẫn/ID video, mô tả ngắn và nhãn trên các thẻ video của `https://www.youtube.com`. Dữ liệu được dùng để quyết định ẩn hoặc hiển thị thẻ video và đếm số thẻ đang bị chặn. Tiện ích không truy cập API lịch sử duyệt web, mật khẩu, cookie đăng nhập hay thông tin thanh toán.

Khi bật kiểm tra nhãn AI từ trang video, tiện ích gửi yêu cầu HTTPS tới YouTube cho các ID video gần vùng nhìn thấy và đọc thông tin nhãn trong phản hồi HTML. Các yêu cầu bổ sung này dùng `credentials: omit`, không đính kèm cookie đăng nhập. YouTube vẫn nhận ID video được yêu cầu và thông tin kết nối như địa chỉ IP, theo chính sách riêng của YouTube/Google. Không có yêu cầu tới máy chủ của nhà phát triển hoặc dịch vụ bên thứ ba.

## Lưu trữ và thời hạn

Cài đặt bật/tắt, từ khóa, danh sách chặn và danh sách cho phép được lưu trong `chrome.storage.local` trên máy của người dùng, không dùng đồng bộ tài khoản.

Kết quả kiểm tra nhãn được lưu trong bộ nhớ của từng tab, tối đa 500 mục. Kết quả hết hạn sau 1 giờ; khi kiểm tra không thành công, mục tạm hết hạn sau 10 phút. Tải lại hoặc đóng tab sẽ xóa bộ nhớ này. Số đếm không phải lịch sử cộng dồn và không được gửi cho nhà phát triển.

## Sử dụng và chia sẻ

Dữ liệu chỉ phục vụ chức năng lọc video mà người dùng nhìn thấy. Nhà phát triển không nhận, bán hoặc dùng dữ liệu này để quảng cáo, theo dõi hành vi hay huấn luyện mô hình. Tiện ích không có phân tích sử dụng hoặc mã theo dõi. Việc xử lý dữ liệu tuân theo Chính sách dữ liệu người dùng của Chrome Web Store, bao gồm các yêu cầu Limited Use.

## Quyền kiểm soát

Người dùng có thể tắt toàn bộ bộ lọc, tắt kiểm tra nhãn, sửa/xóa danh sách từ khóa và kênh trong popup rồi lưu. Gỡ cài đặt tiện ích sẽ xóa cài đặt lưu trong vùng lưu trữ của tiện ích. Tiện ích không phân tích hình ảnh/âm thanh và không bảo đảm nhận diện mọi video AI.

## Liên hệ

Nhà phát triển: [ĐIỀN TÊN NHÀ PHÁT TRIỂN]

Email hỗ trợ: [ĐIỀN EMAIL LIÊN HỆ]
