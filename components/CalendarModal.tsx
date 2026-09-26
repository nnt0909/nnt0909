import React, { useState } from 'react';
import { LeaveDate } from '../types';
import SimpleCalendar from './SimpleCalendar';

const CalendarModal: React.FC<{
    month: number,
    leaveType: string,
    initialDates: LeaveDate[],
    onSave: (dates: LeaveDate[]) => void,
    onClose: () => void,
}> = ({ month, leaveType, initialDates, onSave, onClose }) => {
    const [selectedDates, setSelectedDates] = useState<LeaveDate[]>(initialDates);
    const [duration, setDuration] = useState<number>(1.0);
    const year = new Date().getFullYear();

    const handleDateToggle = (dateStr: string) => {
        setSelectedDates(prev => {
            const existing = prev.find(d => d.date === dateStr);
            if (existing) {
                return prev.filter(d => d.date !== dateStr);
            } else {
                return [...prev, { date: dateStr, duration }];
            }
        });
    };

    const handleSave = () => {
        onSave(selectedDates.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700 text-gray-800 dark:text-gray-100">
                    Chọn ngày nghỉ: {leaveType} - Tháng {month}
                </h2>
                <div className="p-6 space-y-4">
                    <div className="flex justify-center items-center space-x-4">
                        <span className="text-gray-700 dark:text-gray-300">Số ngày nghỉ:</span>
                        <label className="flex items-center space-x-2">
                            <input type="radio" name="duration" value={0.5} checked={duration === 0.5} onChange={() => setDuration(0.5)} className="form-radio text-custom-blue"/>
                            <span>0.5 ngày</span>
                        </label>
                         <label className="flex items-center space-x-2">
                            <input type="radio" name="duration" value={1.0} checked={duration === 1.0} onChange={() => setDuration(1.0)} className="form-radio text-custom-blue"/>
                            <span>1.0 ngày</span>
                        </label>
                    </div>
                    <SimpleCalendar month={month} year={year} selectedDates={selectedDates} onDateToggle={handleDateToggle} />
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-600 transition">Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
