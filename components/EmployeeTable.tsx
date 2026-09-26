import React from 'react';
import { CalculatedEmployee, Employee } from '../types';
import { MONTHS, LEAVE_TYPES } from '../constants';

const EmployeeTable: React.FC<{
    employees: CalculatedEmployee[],
    onEdit: (employee: Employee) => void,
    onDelete: (id: string) => void,
    onShowDetails: (employee: CalculatedEmployee, month: number) => void,
}> = ({ employees, onEdit, onDelete, onShowDetails }) => {
    const columns = [
        "Họ Tên", "Phép năm cũ", "Tổng phép năm hiện tại", "Phép còn lại đầu kỳ", "Phép Hỗ Trợ",
        ...MONTHS.map(m => `T${m}`),
        "Tổng đã dùng", "Tổng phép năm đã nghỉ", ...LEAVE_TYPES, "Phép còn lại", "Trạng thái", "Hành động"
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-4 overflow-x-auto">
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Mẹo: Nhấp chuột vào một ô trong cột tháng để xem chi tiết các ngày nghỉ của nhân viên.</p>
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {columns.map(col => <th key={col} className="p-2 whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-2 font-medium whitespace-nowrap">{emp.name}</td>
                            <td className="p-2 text-center">{emp.previousYearLeave.toFixed(1)}</td>
                            <td className="p-2 text-center">{emp.currentYearLeave.toFixed(1)}</td>
                            <td className="p-2 text-center">{emp.totalAnnualLeave.toFixed(1)}</td>
                            <td className="p-2 text-center">{emp.specialLeave.toFixed(1)}</td>
                            {emp.monthlyTotals.map((total, i) => (
                                <td key={i} className="p-2 text-center cursor-pointer hover:underline" onClick={() => onShowDetails(emp, i + 1)}>{total.toFixed(1)}</td>
                            ))}
                            <td className="p-2 text-center">{emp.totalLeaveTaken.toFixed(1)}</td>
                            <td className="p-2 text-center font-bold bg-yellow-100 dark:bg-yellow-800">{emp.annualLeaveTaken.toFixed(1)}</td>
                            {LEAVE_TYPES.map(lt => <td key={lt} className="p-2 text-center">{emp.leaveTypeData[lt]?.toFixed(1) || '0.0'}</td>)}
                            <td className="p-2 text-center font-bold bg-blue-100 dark:bg-blue-800">{emp.remainingLeave.toFixed(1)}</td>
                            <td className={`p-2 text-center font-semibold ${emp.status === 'Vượt phép' ? 'text-red-500' : 'text-green-500'}`}>{emp.status}</td>
                            <td className="p-2 flex gap-2">
                                <button onClick={() => onEdit(emp)} className="text-custom-orange hover:underline">Sửa</button>
                                <button onClick={() => onDelete(emp.id)} className="text-custom-red hover:underline">Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmployeeTable;
