import React from 'react';
import { LeaveDate } from '../types';

const SimpleCalendar: React.FC<{
    month: number,
    year: number,
    selectedDates: LeaveDate[],
    onDateToggle: (date: string) => void,
}> = ({ month, year, selectedDates, onDateToggle }) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun, 1=Mon...

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isSelected = (day: number) => selectedDates.some(d => d.date === `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

    return (
        <div className="grid grid-cols-7 gap-2 text-center">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day} className="font-bold text-sm text-gray-600 dark:text-gray-400">{day}</div>)}
            {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
            {days.map(day => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return (
                    <button
                        key={day}
                        onClick={() => onDateToggle(dateStr)}
                        className={`p-2 rounded-full transition ${isSelected(day) ? 'bg-custom-blue text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        {day}
                    </button>
                );
            })}
        </div>
    );
};

export default SimpleCalendar;
