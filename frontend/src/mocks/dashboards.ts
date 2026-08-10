import type { MockUserRole, RoleDashboardData } from './types';

const emptyDashboard: RoleDashboardData = {
  stats: [],
  chartData: [],
  quickActions: [],
  activities: [],
  meetings: [],
  metrics: [],
};

/** Empty — dashboards use live `/dashboard/*` APIs. */
export const dashboardByRole: Record<MockUserRole, RoleDashboardData> = {
  ceo: emptyDashboard,
  cto: emptyDashboard,
  ciso: emptyDashboard,
  finance: emptyDashboard,
  software_engineer: emptyDashboard,
  ui_ux_designer: emptyDashboard,
  customer_support: emptyDashboard,
};

export function getDashboardForRole(role: string): RoleDashboardData {
  return dashboardByRole[role as MockUserRole] ?? emptyDashboard;
}
