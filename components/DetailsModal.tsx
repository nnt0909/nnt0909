import React from 'react';
import { CalculatedEmployee, LeaveDetails } from '../types';

const DetailsModal: React.FC<{ employee: CalculatedEmployee, month: number, onClose: () => void }> = ({ employee, month, onClose }) => {
    const leaveData = employee.leaveByMonth[month] || {};
    // FIX: Cast `details` to `LeaveDetails` because Object.values infers the value as `unknown`
    const hasLeave = Object.values(leaveData).some(details => (details as LeaveDetails).dates.length > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-100">
                    Chi tiết phép Tháng {month} - {employee.name}
                </h2>
                <div className="p-6 space-y-2 text-gray-700 dark:text-gray-300">
                    {!hasLeave ? (
                        <p>Nhân viên không có ngày nghỉ nào trong tháng {month}.</p>
                    ) : (
                        Object.entries(leaveData).map(([leaveType, details]) => {
                            // FIX: Cast `details` to `LeaveDetails` as Object.entries infers the value as `unknown`
                            const leaveDetails = details as LeaveDetails;
                            if (leaveDetails.dates.length === 0) return null;
                            const totalDays = leaveDetails.dates.reduce((sum, d) => sum + d.duration, 0);
                            const datesStr = leaveDetails.dates.map(d => `${new Date(d.date).getDate()} (${d.duration})`).join(', ');
                            return (
                                <div key={leaveType}>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{leaveType} ({totalDays} ngày):</span> {datesStr}
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="p-4 border-t dark:border-gray-700 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-600 transition">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
