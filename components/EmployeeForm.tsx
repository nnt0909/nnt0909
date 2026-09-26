import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { MONTHS, LEAVE_TYPES, PLACEHOLDER_TEXT } from '../constants';
import { getNewEmployee } from '../utils';

const EmployeeForm: React.FC<{
    employees: Employee[],
    formData: Employee,
    setFormData: React.Dispatch<React.SetStateAction<Employee>>,
    onAdd: () => void,
    onUpdate: () => void,
    onClear: () => void,
    onOpenCalendar: (month: number, leaveType: string) => void,
}> = ({ employees, formData, setFormData, onAdd, onUpdate, onClear, onOpenCalendar }) => {

    const [prevLeaveStr, setPrevLeaveStr] = useState(formData.previousYearLeave.toString());
    const [currLeaveStr, setCurrLeaveStr] = useState(formData.currentYearLeave.toString());
    const [specLeaveStr, setSpecLeaveStr] = useState(formData.specialLeave.toString());

    // Sync state when formData changes (e.g. clicking Edit or Clear)
    useEffect(() => {
        setPrevLeaveStr(formData.previousYearLeave.toString());
        setCurrLeaveStr(formData.currentYearLeave.toString());
        setSpecLeaveStr(formData.specialLeave.toString());
    }, [formData.previousYearLeave, formData.currentYearLeave, formData.specialLeave]);

    const handleStringNumberChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, name: keyof Employee) => {
        const val = e.target.value;
        setter(val);
        const parsed = parseFloat(val);
        setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? 0 : parsed }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "name") {
            const matchedEmployee = employees.find(emp => emp.name === value);
            if (matchedEmployee) {
                setFormData(matchedEmployee);
            } else {
                setFormData(prev => {
                    if (prev.id && employees.some(e => e.id === prev.id)) {
                        const newForm = getNewEmployee();
                        newForm.name = value;
                        return newForm;
                    }
                    return { ...prev, name: value };
                });
            }
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
                    <input type="text" name="previousYearLeave" value={prevLeaveStr} onChange={(e) => handleStringNumberChange(e, setPrevLeaveStr, 'previousYearLeave')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tổng phép năm hiện tại</label>
                    <input type="text" name="currentYearLeave" value={currLeaveStr} onChange={(e) => handleStringNumberChange(e, setCurrLeaveStr, 'currentYearLeave')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phép Hỗ Trợ (Lương CB Vùng)</label>
                    <input type="text" name="specialLeave" value={specLeaveStr} onChange={(e) => handleStringNumberChange(e, setSpecLeaveStr, 'specialLeave')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50" />
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

export default EmployeeForm;
