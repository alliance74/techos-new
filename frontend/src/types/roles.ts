// User roles matching backend enum
export enum UserRole {
  CEO = 'ceo',
  CTO = 'cto',
  CISO = 'ciso',
  FINANCE = 'finance',
  SOFTWARE_ENGINEER = 'software_engineer',
  UI_UX_DESIGNER = 'ui_ux_designer',
  CUSTOMER_SUPPORT = 'customer_support',
}

// Permission types
export enum Permission {
  // Projects & Tasks
  VIEW_PROJECTS = 'view_projects',
  CREATE_PROJECTS = 'create_projects',
  EDIT_PROJECTS = 'edit_projects',
  DELETE_PROJECTS = 'delete_projects',
  MANAGE_TASKS = 'manage_tasks',

  // HR
  VIEW_EMPLOYEES = 'view_employees',
  MANAGE_EMPLOYEES = 'manage_employees',
  VIEW_LEAVE_REQUESTS = 'view_leave_requests',
  APPROVE_LEAVE_REQUESTS = 'approve_leave_requests',

  // Finance
  VIEW_INVOICES = 'view_invoices',
  CREATE_INVOICES = 'create_invoices',
  VIEW_EXPENSES = 'view_expenses',
  APPROVE_EXPENSES = 'approve_expenses',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',

  // CRM
  VIEW_CONTACTS = 'view_contacts',
  MANAGE_CONTACTS = 'manage_contacts',
  VIEW_DEALS = 'view_deals',
  MANAGE_DEALS = 'manage_deals',

  // Product
  VIEW_FEATURES = 'view_features',
  MANAGE_FEATURES = 'manage_features',
  VIEW_BUGS = 'view_bugs',
  MANAGE_BUGS = 'manage_bugs',
  VIEW_RELEASES = 'view_releases',
  MANAGE_RELEASES = 'manage_releases',

  // Communication
  VIEW_MESSAGES = 'view_messages',
  SEND_MESSAGES = 'send_messages',
  VIEW_MEETINGS = 'view_meetings',
  SCHEDULE_MEETINGS = 'schedule_meetings',

  // Documents & Analytics
  VIEW_DOCUMENTS = 'view_documents',
  MANAGE_DOCUMENTS = 'manage_documents',
  VIEW_ANALYTICS = 'view_analytics',

  // AI & Integrations
  USE_AI = 'use_ai',
  MANAGE_INTEGRATIONS = 'manage_integrations',

  // Settings
  VIEW_SETTINGS = 'view_settings',
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_USERS = 'manage_users',

  // Announcements & Calendar
  VIEW_ANNOUNCEMENTS = 'view_announcements',
  CREATE_ANNOUNCEMENTS = 'create_announcements',
  VIEW_CALENDAR = 'view_calendar',

  // Goals & Reports
  VIEW_GOALS = 'view_goals',
  MANAGE_GOALS = 'manage_goals',
  VIEW_REPORTS = 'view_reports',
  VIEW_SECURITY_AUDITS = 'view_security_audits',
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CEO]: Object.values(Permission),

  [UserRole.CTO]: [
    Permission.VIEW_PROJECTS,
    Permission.CREATE_PROJECTS,
    Permission.EDIT_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_FEATURES,
    Permission.MANAGE_FEATURES,
    Permission.VIEW_BUGS,
    Permission.MANAGE_BUGS,
    Permission.VIEW_RELEASES,
    Permission.MANAGE_RELEASES,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENTS,
    Permission.MANAGE_DOCUMENTS,
    Permission.USE_AI,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_MESSAGES,
    Permission.SEND_MESSAGES,
    Permission.VIEW_MEETINGS,
    Permission.SCHEDULE_MEETINGS,
    Permission.VIEW_CALENDAR,
    Permission.VIEW_GOALS,
    Permission.MANAGE_GOALS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.CISO]: [
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_SECURITY_AUDITS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_MESSAGES,
    Permission.VIEW_MEETINGS,
    Permission.VIEW_CALENDAR,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.SOFTWARE_ENGINEER]: [
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.VIEW_FEATURES,
    Permission.VIEW_BUGS,
    Permission.MANAGE_BUGS,
    Permission.VIEW_DOCUMENTS,
    Permission.USE_AI,
    Permission.VIEW_MESSAGES,
    Permission.SEND_MESSAGES,
    Permission.VIEW_MEETINGS,
    Permission.VIEW_CALENDAR,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.UI_UX_DESIGNER]: [
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.VIEW_FEATURES,
    Permission.VIEW_BUGS,
    Permission.VIEW_DOCUMENTS,
    Permission.MANAGE_DOCUMENTS,
    Permission.USE_AI,
    Permission.VIEW_MESSAGES,
    Permission.SEND_MESSAGES,
    Permission.VIEW_MEETINGS,
    Permission.VIEW_CALENDAR,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.FINANCE]: [
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.VIEW_EXPENSES,
    Permission.APPROVE_EXPENSES,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENTS,
    Permission.MANAGE_DOCUMENTS,
    Permission.VIEW_MESSAGES,
    Permission.SEND_MESSAGES,
    Permission.VIEW_MEETINGS,
    Permission.VIEW_CALENDAR,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.CUSTOMER_SUPPORT]: [
    Permission.VIEW_CONTACTS,
    Permission.MANAGE_CONTACTS,
    Permission.VIEW_BUGS,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_MESSAGES,
    Permission.SEND_MESSAGES,
    Permission.VIEW_MEETINGS,
    Permission.VIEW_CALENDAR,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_SETTINGS,
  ],
};

// Route to required permissions mapping
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': [],
  '/dashboard/projects': [Permission.VIEW_PROJECTS],
  '/dashboard/analytics': [Permission.VIEW_ANALYTICS],
  '/dashboard/hr/employees': [Permission.VIEW_EMPLOYEES],
  '/dashboard/hr/leave-requests': [Permission.VIEW_LEAVE_REQUESTS],
  '/dashboard/finance/invoices': [Permission.VIEW_INVOICES],
  '/dashboard/finance/expenses': [Permission.VIEW_EXPENSES],
  '/dashboard/crm/contacts': [Permission.VIEW_CONTACTS],
  '/dashboard/crm/deals': [Permission.VIEW_DEALS],
  '/dashboard/product/features': [Permission.VIEW_FEATURES],
  '/dashboard/product/bugs': [Permission.VIEW_BUGS],
  '/dashboard/product/releases': [Permission.VIEW_RELEASES],
  '/dashboard/messages': [Permission.VIEW_MESSAGES],
  '/dashboard/meetings': [Permission.VIEW_MEETINGS],
  '/dashboard/documents': [Permission.VIEW_DOCUMENTS],
  '/dashboard/calendar': [Permission.VIEW_CALENDAR],
  '/dashboard/ai': [Permission.USE_AI],
  '/dashboard/goals': [Permission.VIEW_GOALS],
  '/dashboard/reports': [Permission.VIEW_REPORTS],
  '/dashboard/ciso/audits': [Permission.VIEW_SECURITY_AUDITS],
  '/dashboard/announcements': [Permission.VIEW_ANNOUNCEMENTS],
  '/dashboard/integrations': [Permission.MANAGE_INTEGRATIONS],
  '/dashboard/settings': [Permission.VIEW_SETTINGS],
  '/dashboard/settings/users': [Permission.MANAGE_USERS],
  '/dashboard/settings/organization': [Permission.MANAGE_ORGANIZATION],
};

// Default landing page per role
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  [UserRole.CEO]: '/ceo',
  [UserRole.CTO]: '/cto',
  [UserRole.CISO]: '/ciso',
  [UserRole.FINANCE]: '/finance',
  [UserRole.SOFTWARE_ENGINEER]: '/software-engineer',
  [UserRole.UI_UX_DESIGNER]: '/ui-ux-designer',
  [UserRole.CUSTOMER_SUPPORT]: '/customer-support',
};
