import type { MockRecord } from './types';

/** Empty entity collections — app data comes from the API only. */
export const mockEntities: Record<string, MockRecord[]> = {
  projects: [],
  tasks: [],
  bugs: [],
  sprints: [],
  invoices: [],
  expenses: [],
  payments: [],
  budgets: [],
  leads: [],
  deals: [],
  contacts: [],
  tickets: [],
  campaigns: [],
  features: [],
  releases: [],
  documents: [],
  meetings: [],
  goals: [],
  employees: [],
  candidates: [],
  leaveRequests: [],
  codeReviews: [],
  commits: [],
  notifications: [],
  reports: [],
  subscriptions: [],
  quotations: [],
  opportunities: [],
  customers: [],
  knowledgeBase: [],
  prototypes: [],
  research: [],
  deployments: [],
  architecture: [],
  announcements: [],
  processes: [],
  teams: [],
  payroll: [],
  benefits: [],
  jobs: [],
  performanceReviews: [],
  onboardingTasks: [],
};

export const entityKeys = Object.keys(mockEntities);

export function getEntities(key: string): MockRecord[] {
  return mockEntities[key] ?? [];
}

export const OWNERS: string[] = [];
