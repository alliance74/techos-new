import { PageKind } from './types';

export * from './types';
export * from './users';
export * from './entities';
export * from './dashboards';
export * from './notifications';
export * from './messages';
export * from './calendar';
export * from './boards';
export * from './teams';
export * from './detailExtras';

/**
 * Maps a URL path segment (the last meaningful, non-dynamic segment of a
 * route) to a mock entity key in `mockEntities`. Segments are matched from
 * the end of the pathname backwards so dynamic id segments (e.g. `prj-001`,
 * `[id]`) and the `create` segment are simply skipped over until a known
 * segment is found.
 */
const SEGMENT_TO_ENTITY_KEY: Record<string, string> = {
  // Projects / Tasks / Engineering
  projects: 'projects',
  tasks: 'tasks',
  bugs: 'bugs',
  sprints: 'sprints',
  'code-reviews': 'codeReviews',
  commits: 'commits',

  // Finance
  invoices: 'invoices',
  expenses: 'expenses',
  approve: 'expenses',
  payments: 'payments',
  budgets: 'budgets',
  revenue: 'invoices',
  subscriptions: 'subscriptions',
  quotations: 'quotations',
  'financial-reports': 'reports',

  // CRM / Sales / Marketing
  leads: 'leads',
  deals: 'deals',
  pipeline: 'deals',
  contacts: 'contacts',
  opportunities: 'opportunities',
  customers: 'customers',
  crm: 'contacts',
  sales: 'deals',
  campaigns: 'campaigns',
  marketing: 'campaigns',
  'social-media': 'campaigns',
  'email-marketing': 'campaigns',
  content: 'campaigns',

  // Support
  tickets: 'tickets',
  'knowledge-base': 'knowledgeBase',
  chat: 'tickets',

  // Product / Engineering
  features: 'features',
  roadmap: 'features',
  releases: 'releases',
  'user-feedback': 'research',
  // `product` is role-aware in resolveEntityKey (CEO → projects, others → features)
  architecture: 'architecture',
  design: 'architecture',
  decisions: 'architecture',
  deployments: 'deployments',
  infrastructure: 'deployments',
  monitoring: 'deployments',

  // Docs / Meetings / Goals
  documents: 'documents',
  documentation: 'documents',
  guides: 'documents',
  'api-docs': 'documents',
  meetings: 'meetings',
  goals: 'goals',

  // HR
  employees: 'employees',
  team: 'employees',
  members: 'employees',
  workload: 'employees',
  performance: 'performanceReviews',
  onboarding: 'onboardingTasks',
  benefits: 'benefits',
  payroll: 'payroll',
  users: 'employees',
  hr: 'employees',
  candidates: 'candidates',
  recruitment: 'jobs',
  hiring: 'candidates',
  'leave-requests': 'leaveRequests',

  // Reports / Analytics-ish tables
  reports: 'reports',
  quarterly: 'reports',
  annual: 'reports',
  'profit-loss': 'reports',
  'cash-flow': 'reports',
  'balance-sheet': 'reports',
  'tax-reports': 'reports',
  custom: 'reports',
  'team-metrics': 'reports',
  'product-metrics': 'reports',
  'code-quality': 'reports',
  growth: 'reports',
  efficiency: 'reports',
  capacity: 'reports',
  satisfaction: 'reports',
  'sales-analytics': 'reports',
  'marketing-roi': 'reports',
  forecasting: 'reports',
  finance: 'invoices',

  // Design / Research
  prototypes: 'prototypes',
  'user-research': 'research',
  research: 'research',

  // Company-wide
  announcements: 'announcements',
  processes: 'processes',
  operations: 'processes',
  integrations: 'integrations',
  notifications: 'notifications',
};

/** All segments that appear somewhere in the app's route tree. Used to tell
 * apart a dynamic `[id]` segment (not in this set) from a known static one. */
const KNOWN_STATIC_SEGMENTS = new Set<string>([
  ...Object.keys(SEGMENT_TO_ENTITY_KEY),
  'product',
  'ceo',
  'cto',
  'ciso',
  'finance',
  'software-engineer',
  'ui-ux-designer',
  'customer-support',
  'settings',
  'security',
  'organization',
  'analytics',
  'messages',
  'calendar',
  'ai',
  'tasks',
  'sprints',
  'team',
  'teams',
  'create',
  'design-system',
  'typography',
  'colors',
  'components',
  'login',
  'register',
]);

/**
 * Resolves the mock entity key associated with a given pathname, e.g.
 * `/ceo/crm/leads` -> `leads`, `/finance/invoices` -> `invoices`,
 * `/software-engineer/bugs` -> `bugs`, `/customer-support/tickets` -> `tickets`,
 * `/cto/code-reviews` -> `codeReviews`. Falls back to `'projects'`.
 */
export function resolveEntityKey(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const root = segments[0]?.toLowerCase();

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i].toLowerCase();
    if (segment === 'product') {
      // CEO Delivery "Product" is the former Projects hub; other roles keep features.
      return root === 'ceo' ? 'projects' : 'features';
    }
    if (SEGMENT_TO_ENTITY_KEY[segment]) {
      return SEGMENT_TO_ENTITY_KEY[segment];
    }
  }

  return 'projects';
}

const ROLE_ROOTS = new Set([
  'ceo',
  'cto',
  'ciso',
  'finance',
  'software-engineer',
  'ui-ux-designer',
  'customer-support',
]);

/**
 * Resolves what "kind" of page a given pathname represents, so a single
 * generic page component can decide whether to render a table, a detail
 * view, a form, a chart-heavy analytics layout, etc.
 */
export function resolvePageKind(pathname: string): PageKind {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return 'dashboard';
  }

  if (segments.length === 1 && ROLE_ROOTS.has(segments[0].toLowerCase())) {
    return 'dashboard';
  }

  const last = segments[segments.length - 1].toLowerCase();

  if (last === 'create' || last === 'new') {
    return 'create';
  }

  if (last === 'messages' || last === 'chat') {
    return 'messages';
  }

  if (last === 'calendar') {
    return 'calendar';
  }

  if (last === 'tasks') {
    return 'tasks';
  }

  if (last === 'sprints') {
    return 'sprints';
  }

  // Exact team hub pages (not nested team/members, team/workload, etc.)
  if (last === 'team' || last === 'teams') {
    return 'teams';
  }

  if (last === 'ai') {
    return 'ai';
  }

  if (segments.some((segment) => segment.toLowerCase() === 'settings')) {
    return 'settings';
  }

  const ANALYTICS_SEGMENTS = new Set([
    'analytics',
    'metrics',
    'growth',
    'efficiency',
    'capacity',
    'code-quality',
    'team-metrics',
    'product-metrics',
    'sales-analytics',
    'marketing-roi',
    'forecasting',
    'satisfaction',
    'workload',
    'roadmap',
  ]);

  // Saved / generated reports hub (not AnalyticsHub).
  if (
    segments.some((s) => {
      const v = s.toLowerCase();
      return v === 'reports' || v === 'financial-reports';
    }) ||
    ['profit-loss', 'cash-flow', 'balance-sheet', 'tax-reports', 'quarterly', 'annual'].includes(last)
  ) {
    return 'reports';
  }

  // Finance list routes (expenses / revenue) must stay lists — not AnalyticsHub.
  const FINANCE_LIST_OVERRIDE = new Set(['expenses', 'revenue', 'payments', 'invoices', 'budgets']);
  const underFinance = segments.some((s) => s.toLowerCase() === 'finance');
  if (underFinance && FINANCE_LIST_OVERRIDE.has(last)) {
    // fall through to list/detail resolution
  } else if (
    segments.some((segment) => segment.toLowerCase() === 'analytics') ||
    ANALYTICS_SEGMENTS.has(last)
  ) {
    return 'analytics';
  }

  // Record ids look like prj-001, inv-012, or long opaque tokens.
  const looksLikeId =
    /^[a-z]{2,}[-_]\d+$/i.test(last) ||
    /^[a-f0-9-]{20,}$/i.test(last) ||
    (/^\d+$/.test(last) && last.length >= 1);

  // A trailing segment that isn't a known static route name, sitting right
  // after a known list-type segment, is treated as a dynamic `[id]` detail
  // page (e.g. `/ceo/product/prj-001`).
  const isDynamicLike = !KNOWN_STATIC_SEGMENTS.has(last);
  const parent = segments.length > 1 ? segments[segments.length - 2].toLowerCase() : undefined;

  if (isDynamicLike && (looksLikeId || (parent && SEGMENT_TO_ENTITY_KEY[parent]))) {
    return 'detail';
  }

  return 'list';
}
