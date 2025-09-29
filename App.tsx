

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Import LeaveDetails to be used for type casting below.
import { Employee, LeaveDate, LeaveByMonth, CalculatedEmployee, LeaveDetails } from './types';
import { LEAVE_TYPES, MONTHS, PLACEHOLDER_TEXT } from './constants';

// FIX: Declare XLSX to inform TypeScript about the global variable from the xlsx library script, fixing multiple 'Cannot find name XLSX' errors.
declare var XLSX: any;

// --- UTILITY & HELPER FUNCTIONS ---

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const emptyLeaveByMonth = (): LeaveByMonth => {
    const data: LeaveByMonth = {};
    MONTHS.forEach(month => {
        data[month] = {};
        LEAVE_TYPES.forEach(lt => {
            data[month][lt] = { dates: [] };
        });
    });
    return data;
};

const getNewEmployee = (): Employee => ({
    id: generateUUID(),
    name: '',
    previousYearLeave: 0,
    currentYearLeave: 0,
    specialLeave: 0,
    leaveByMonth: emptyLeaveByMonth(),
});

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const calculateLeaveMetrics = (employee: Employee): CalculatedEmployee => {
    const leaveTypeData: { [key: string]: number } = {};
    let annualLeaveTaken = 0;
    const monthlyTotals = Array(12).fill(0);

    LEAVE_TYPES.forEach(lt => { leaveTypeData[lt] = 0; });

    for (const monthStr in employee.leaveByMonth) {
        const month = parseInt(monthStr, 10);
        const monthData = employee.leaveByMonth[month];
        let monthTotal = 0;
        for (const leaveType in monthData) {
            const days = monthData[leaveType].dates.reduce((sum, entry) => sum + entry.duration, 0);
            if (leaveType in leaveTypeData) {
                leaveTypeData[leaveType] += days;
            }
            if (leaveType === 'Phép Năm') {
                annualLeaveTaken += days;
            }
            monthTotal += days;
        }
        monthlyTotals[month-1] = monthTotal;
    }

    const totalLeaveTaken = Object.values(leaveTypeData).reduce((sum, days) => sum + days, 0);
    const totalAnnualLeave = employee.previousYearLeave + employee.currentYearLeave;
    const remainingLeave = totalAnnualLeave - annualLeaveTaken;
    const status = remainingLeave < 0 ? 'Vượt phép' : 'Bình thường';

    return {
        ...employee,
        totalAnnualLeave,
        annualLeaveTaken,
        totalLeaveTaken,
        remainingLeave,
        status,
        leaveTypeData,
        monthlyTotals,
    };
};

const exportToExcel = (employees: CalculatedEmployee[]): void => {
    if (!employees.length) {
        alert("Không có dữ liệu để xuất Excel.");
        return;
    }
    
    // @ts-ignore
    if (typeof XLSX === 'undefined') {
        alert("Thư viện xuất Excel chưa được tải. Vui lòng kiểm tra lại kết nối mạng.");
        return;
    }

    const dataToExport = employees.map(emp => ({
        'Họ Tên': emp.name,
        'Phép năm cũ': emp.previousYearLeave,
        'Tổng phép năm hiện tại': emp.currentYearLeave,
        'Phép còn lại đầu kỳ': emp.totalAnnualLeave,
        'Phép Hỗ Trợ (Lương CB Vùng)': emp.specialLeave,
        ...emp.monthlyTotals.reduce((acc, total, i) => ({ ...acc, [`Tháng ${i + 1}`]: total }), {}),
        'Tổng đã dùng': emp.totalLeaveTaken,
        'Tổng phép năm đã nghỉ': emp.annualLeaveTaken,
        ...LEAVE_TYPES.reduce((acc, lt) => ({ ...acc, [lt]: emp.leaveTypeData[lt] || 0 }), {}),
        'Phép còn lại': emp.remainingLeave,
        'Trạng thái': emp.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
    XLSX.utils.sheet_add_aoa(ws, [['THEO DÕI PHÉP NĂM TỔ IE']], { origin: 'A1' });
    XLSX.utils.sheet_add_json(ws, dataToExport, { origin: 'A3', skipHeader: false });
    
    // Auto-fit columns
    const colWidths = Object.keys(dataToExport[0]).map(key => ({ wch: Math.max(key.length, ...dataToExport.map(row => String(row[key as keyof typeof row]).length)) + 2 }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo phép năm");
    XLSX.writeFile(wb, "Bao_cao_phep_nam.xlsx");
};


// --- UI COMPONENTS ---

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

const DetailsModal: React.FC<{ employee: CalculatedEmployee, month: number, onClose: () => void }> = ({ employee, month, onClose }) => {
    const leaveData = employee.leaveByMonth[month] || {};
    // FIX: Cast `details` to `LeaveDetails` because Object.values infers the value as `unknown`, fixing 'Property 'dates' does not exist' error.
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
                            // FIX: Cast `details` to `LeaveDetails` as Object.entries infers the value as `unknown`, fixing 'Property 'dates' does not exist' errors.
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


const EmployeeForm: React.FC<{
    employees: Employee[],
    formData: Employee,
    setFormData: React.Dispatch<React.SetStateAction<Employee>>,
    onAdd: () => void,
    onUpdate: () => void,
    onClear: () => void,
    onOpenCalendar: (month: number, leaveType: string) => void,
}> = ({ employees, formData, setFormData, onAdd, onUpdate, onClear, onOpenCalendar }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "name") {
            const matchedEmployee = employees.find(emp => emp.name === value);
            if (matchedEmployee) {
                setFormData(matchedEmployee);
            } else {
                setFormData(prev => {
                    // If we were editing an existing employee (ID is in the main list)
                    // but now the name doesn't match anyone, it means the user is creating a new employee.
                    // So, we reset the form data, preserving only the newly typed name.
                    if (prev.id && employees.some(e => e.id === prev.id)) {
                        const newForm = getNewEmployee();
                        newForm.name = value;
                        return newForm;
                    }
                    // Otherwise, we're just typing a name for a new employee, so just update the name field.
                    return { ...prev, name: value };
                });
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ Tên</label>
                     <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        placeholder={PLACEHOLDER_TEXT}
                        list="employee-names"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                    />
                    <datalist id="employee-names">
                        {employees.map(e => <option key={e.id} value={e.name} />)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phép năm cũ</label>
                    <input type="number" name="previousYearLeave" value={formData.previousYearLeave} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tổng phép năm hiện tại</label>
                    <input type="number" name="currentYearLeave" value={formData.currentYearLeave} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phép Hỗ Trợ (Lương CB Vùng)</label>
                    <input type="number" name="specialLeave" value={formData.specialLeave} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50" />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                     <table className="min-w-full text-center text-sm">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="py-2 px-1 text-left">Loại Phép</th>
                                {MONTHS.map(m => <th key={m} className="py-2 px-1">T{m}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {LEAVE_TYPES.map(lt => (
                                <tr key={lt} className="border-b dark:border-gray-700">
                                    <td className="py-2 px-1 text-left text-gray-700 dark:text-gray-300 font-medium">{lt}</td>
                                    {MONTHS.map(m => {
                                        const days = formData.leaveByMonth[m]?.[lt]?.dates.reduce((sum, d) => sum + d.duration, 0) || 0;
                                        return (
                                            <td key={`${lt}-${m}`} className="py-2 px-1">
                                                <button onClick={() => onOpenCalendar(m, lt)} className="w-10 h-8 rounded bg-gray-200 dark:bg-gray-600 hover:bg-custom-blue hover:text-white transition">
                                                    {days.toFixed(1)}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={onAdd} className="px-4 py-2 bg-custom-green text-white rounded-md hover:bg-green-600 transition">Thêm</button>
                <button onClick={onUpdate} className="px-4 py-2 bg-custom-purple text-white rounded-md hover:bg-purple-600 transition">Cập nhật</button>
                <button onClick={onClear} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">Xóa dữ liệu</button>
            </div>
        </div>
    );
};

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


// --- MAIN APP COMPONENTS ---

const LeaveTrackerApp: React.FC = () => {
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [formData, setFormData] = useState<Employee>(getNewEmployee());
    const [filter, setFilter] = useState('');
    const [isGuideOpen, setGuideOpen] = useState(false);
    const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean, employee?: CalculatedEmployee, month?: number }>({ isOpen: false });
    const [calendarModal, setCalendarModal] = useState<{ isOpen: boolean, month?: number, leaveType?: string }>({ isOpen: false });

    const calculatedEmployees = useMemo(() => {
        return employees
            .map(calculateLeaveMetrics)
            .filter(emp => emp.name.toLowerCase().includes(filter.toLowerCase()));
    }, [employees, filter]);

    const handleClearForm = useCallback(() => {
        setFormData(getNewEmployee());
    }, []);
    
    const handleAddEmployee = () => {
        if (!formData.name.trim() || formData.name === PLACEHOLDER_TEXT) {
            alert("Vui lòng nhập tên nhân viên!");
            return;
        }
        if (employees.some(emp => emp.name === formData.name.trim())) {
            alert(`Nhân viên '${formData.name}' đã tồn tại. Vui lòng sử dụng nút 'Cập nhật'.`);
            return;
        }
        if (formData.specialLeave > 14) {
             alert("Phép Hỗ Trợ (Lương CB Vùng) không được vượt quá 14 ngày!");
             return;
        }
        setEmployees(prev => [...prev, { ...formData, id: generateUUID() }]);
        handleClearForm();
        alert("Đã thêm nhân viên mới.");
    };

    const handleUpdateEmployee = () => {
        if (!formData.id) {
            alert("Vui lòng chọn một nhân viên từ bảng để sửa, sau đó bấm cập nhật.");
            return;
        }
         if (formData.specialLeave > 14) {
             alert("Phép Hỗ Trợ (Lương CB Vùng) không được vượt quá 14 ngày!");
             return;
        }
        setEmployees(prev => prev.map(emp => emp.id === formData.id ? formData : emp));
        handleClearForm();
        alert("Đã cập nhật thông tin nhân viên.");
    };
    
    const handleDeleteEmployee = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
            setEmployees(prev => prev.filter(emp => emp.id !== id));
        }
    };
    
    const handleSelectForEdit = (employee: Employee) => {
        setFormData(JSON.parse(JSON.stringify(employee))); // deep copy
    };

    const handleOpenCalendar = (month: number, leaveType: string) => {
        setCalendarModal({ isOpen: true, month, leaveType });
    };

    const handleCalendarSave = (dates: LeaveDate[]) => {
        if (calendarModal.month && calendarModal.leaveType) {
            setFormData(prev => {
                const newLeaveByMonth = JSON.parse(JSON.stringify(prev.leaveByMonth));
                newLeaveByMonth[calendarModal.month!][calendarModal.leaveType!] = { dates };
                return { ...prev, leaveByMonth: newLeaveByMonth };
            });
        }
    };
    
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-4">
            <EmployeeForm 
                employees={employees}
                formData={formData} 
                setFormData={setFormData}
                onAdd={handleAddEmployee}
                onUpdate={handleUpdateEmployee}
                onClear={handleClearForm}
                onOpenCalendar={handleOpenCalendar}
            />

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-4">
                 <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lọc theo Họ Tên:</label>
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                        />
                    </div>
                     <div className="flex gap-2">
                        <button onClick={() => setGuideOpen(true)} className="px-4 py-2 bg-custom-cyan text-black rounded-md hover:bg-cyan-400 transition">Hướng dẫn</button>
                        <button onClick={() => exportToExcel(calculatedEmployees)} className="px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-600 transition">Xuất Excel</button>
                    </div>
                 </div>
            </div>
            
            <EmployeeTable
                employees={calculatedEmployees}
                onEdit={handleSelectForEdit}
                onDelete={handleDeleteEmployee}
                onShowDetails={(employee, month) => setDetailsModal({isOpen: true, employee, month})}
            />

            {isGuideOpen && <UserGuideModal onClose={() => setGuideOpen(false)} />}
            {detailsModal.isOpen && <DetailsModal employee={detailsModal.employee!} month={detailsModal.month!} onClose={() => setDetailsModal({ isOpen: false })} />}
            {calendarModal.isOpen && (
                <CalendarModal
                    month={calendarModal.month!}
                    leaveType={calendarModal.leaveType!}
                    initialDates={formData.leaveByMonth[calendarModal.month!]?.[calendarModal.leaveType!]?.dates || []}
                    onSave={handleCalendarSave}
                    onClose={() => setCalendarModal({isOpen: false})}
                />
            )}
        </div>
    );
};

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (username === 'nhuttruong' && password === 'Truong0909') {
            onLogin();
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Đăng nhập</h1>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Tên đăng nhập"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-custom-blue"
                    />
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-custom-blue"
                    />
                    <button
                        onClick={handleLogin}
                        className="w-full px-4 py-2 bg-custom-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    if (!isLoggedIn) {
        return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
    }

    return (
        <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-custom-blue">Công cụ theo dõi phép năm</h1>
                 <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-500 hidden md:block">Designed by NGUYỄN NHỰT TRƯỜNG</p>
                    <button onClick={toggleTheme} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </div>
            </header>
            <LeaveTrackerApp />
        </main>
    );
};

export default App;
