
export interface LeaveDate {
  date: string; // ISO string format YYYY-MM-DD
  duration: number; // 0.5 or 1.0
}

export interface LeaveDetails {
  dates: LeaveDate[];
}

export type LeaveByMonth = {
  [month: number]: { // month is 1-12
    [leaveType: string]: LeaveDetails;
  };
};

export interface Employee {
  id: string;
  name: string;
  previousYearLeave: number;
  currentYearLeave: number;
  specialLeave: number;
  leaveByMonth: LeaveByMonth;
}

export interface CalculatedEmployee extends Employee {
  totalAnnualLeave: number;
  annualLeaveTaken: number;
  totalLeaveTaken: number;
  remainingLeave: number;
  status: 'Bình thường' | 'Vượt phép';
  leaveTypeData: { [key: string]: number };
  monthlyTotals: number[];
}
