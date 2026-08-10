import { Employee, LeaveRequest } from '@/types/hr';

export function getMockEmployees(): Employee[] {
  return [];
}

export function getMockLeaveRequests(): LeaveRequest[] {
  return [];
}

export function getMockHrStats() {
  return {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    pendingLeaves: 0,
    openPositions: 0,
    avgTenureMonths: 0,
    total_employees: 0,
    pending_leave_requests: 0,
    role_count: 0,
  };
}
