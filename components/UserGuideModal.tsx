import React from 'react';

const UserGuideModal: React.FC<{onClose: () => void}> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-100">Hướng dẫn sử dụng</h2>
            <div className="p-6 overflow-y-auto text-gray-700 dark:text-gray-300 space-y-3">
                <p>Phần mềm này giúp bạn quản lý và theo dõi ngày nghỉ phép của nhân viên một cách hiệu quả. Dưới đây là các chức năng chính:</p>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">1. Nhập thông tin nhân viên:</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li><b>Họ Tên:</b> Nhập tên nhân viên vào ô.</li>
                    <li><b>Phép năm cũ:</b> Nhập số ngày phép còn lại từ năm trước.</li>
                    <li><b>Tổng phép năm hiện tại:</b> Nhập tổng số ngày phép năm của năm hiện tại.</li>
                    <li><b>Phép Hỗ Trợ:</b> Nhập số ngày phép hưởng lương chế độ.</li>
                    <li><b>Số ngày nghỉ theo tháng:</b> Bấm vào nút "0" tương ứng với tháng và loại phép để mở lịch, sau đó chọn các ngày nghỉ. Bạn có thể chọn nghỉ 0.5 ngày hoặc 1.0 ngày.</li>
                </ul>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">2. Các nút chức năng:</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li><b>Thêm:</b> Thêm nhân viên mới vào danh sách.</li>
                    <li><b>Sửa:</b> Chọn một nhân viên từ bảng, sau đó bấm nút này để tải thông tin của họ lên các ô nhập liệu.</li>
                    <li><b>Cập nhật:</b> Sau khi sửa thông tin, bấm nút này để lưu lại các thay đổi.</li>
                    <li><b>Xóa:</b> Chọn một nhân viên từ bảng, sau đó bấm nút này để xóa họ.</li>
                    <li><b>Xóa dữ liệu:</b> Xóa dữ liệu khỏi các ô nhập liệu phía trên.</li>
                    <li><b>Xuất Excel:</b> Xuất toàn bộ dữ liệu ra file Excel (.xlsx).</li>
                </ul>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">3. Báo cáo phép năm:</h3>
                <p>Khu vực này hiển thị toàn bộ danh sách nhân viên. Bạn có thể lọc theo tên và nhấp vào một ô trong cột tháng để xem chi tiết ngày nghỉ.</p>
            </div>
            <div className="p-4 border-t dark:border-gray-700 text-right">
                <button onClick={onClose} className="px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-600 transition">Đóng</button>
            </div>
        </div>
    </div>
);

export default UserGuideModal;
