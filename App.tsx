import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Employee, LeaveDate, CalculatedEmployee } from './types';
import { PLACEHOLDER_TEXT } from './constants';
import { getNewEmployee, generateUUID, useLocalStorage, calculateLeaveMetrics, exportToExcel } from './utils';

import EmployeeForm from './components/EmployeeForm';
import EmployeeTable from './components/EmployeeTable';
import UserGuideModal from './components/UserGuideModal';
import DetailsModal from './components/DetailsModal';
import CalendarModal from './components/CalendarModal';
import LoginScreen from './components/LoginScreen';

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
