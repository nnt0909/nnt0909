import React, { useState } from 'react';
import { Employee, LeaveDate, LeaveByMonth, CalculatedEmployee, LeaveDetails } from '../types';
import { LEAVE_TYPES, MONTHS } from '../constants';

// FIX: Declare XLSX to inform TypeScript about the global variable from the xlsx library script
declare var XLSX: any;

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const emptyLeaveByMonth = (): LeaveByMonth => {
    const data: LeaveByMonth = {};
    MONTHS.forEach(month => {
        data[month] = {};
        LEAVE_TYPES.forEach(lt => {
            data[month][lt] = { dates: [] };
        });
    });
    return data;
};

export const getNewEmployee = (): Employee => ({
    id: generateUUID(),
    name: '',
    previousYearLeave: 0,
    currentYearLeave: 0,
    specialLeave: 0,
    leaveByMonth: emptyLeaveByMonth(),
});

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
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

export const calculateLeaveMetrics = (employee: Employee): CalculatedEmployee => {
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

export const exportToExcel = (employees: CalculatedEmployee[]): void => {
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
