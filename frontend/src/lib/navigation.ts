import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Users,
  FolderKanban,
  Package,
  UserCircle,
  TrendingUp,
  Target,
  Calendar,
  MessageSquare,
  FileText,
  Megaphone,
  Bot,
  Settings,
  Building2,
  ListTodo,
  CheckSquare,
  GitPullRequest,
  Boxes,
  Server,
  FileBarChart,
  Receipt,
  CreditCard,
  Wallet,
  Bug,
  Code2,
  Sparkles,
  Palette,
  Layers,
  Ticket,
  BookOpen,
  MessageCircle,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/types/roles';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface RoleNavConfig {
  role: UserRole;
  title: string;
  basePath: string;
  /** Grouped sidebar sections (real-world product IA). */
  groups: NavGroup[];
}

export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}

export function hasNavHref(groups: NavGroup[], suffix: string): boolean {
  return flattenNav(groups).some((n) => n.href.endsWith(suffix));
}

export const ROLE_NAV: Record<string, RoleNavConfig> = {
  [UserRole.CEO]: {
    role: UserRole.CEO,
    title: 'CEO Dashboard',
    basePath: '/ceo',
    groups: [
      {
        id: 'overview',
        label: 'Overview',
        items: [
          { name: 'Dashboard', href: '/ceo', icon: LayoutDashboard },
          { name: 'Analytics', href: '/ceo/analytics', icon: BarChart3 },
          { name: 'Reports', href: '/ceo/reports', icon: FileBarChart },
          { name: 'Goals', href: '/ceo/goals', icon: Target },
        ],
      },
      {
        id: 'business',
        label: 'Business',
        items: [
          { name: 'Finance', href: '/ceo/finance', icon: DollarSign },
          { name: 'Sales', href: '/ceo/sales', icon: TrendingUp },
          { name: 'CRM', href: '/ceo/crm', icon: UserCircle },
          { name: 'Marketing', href: '/ceo/marketing', icon: Megaphone },
        ],
      },
      {
        id: 'people',
        label: 'People & Ops',
        items: [
          { name: 'HR', href: '/ceo/hr', icon: Users },
          { name: 'Operations', href: '/ceo/operations', icon: Building2 },
          { name: 'Teams', href: '/ceo/teams', icon: Users },
        ],
      },
      {
        id: 'delivery',
        label: 'Delivery',
        items: [
          { name: 'Product', href: '/ceo/product', icon: FolderKanban },
          { name: 'Board', href: '/ceo/tasks', icon: ListTodo },
        ],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Calendar', href: '/ceo/calendar', icon: Calendar },
          { name: 'Meetings', href: '/ceo/meetings', icon: Users },
          { name: 'Messages', href: '/ceo/messages', icon: MessageSquare },
          { name: 'Documents', href: '/ceo/documents', icon: FileText },
          { name: 'AI Assistant', href: '/ceo/ai', icon: Bot },
          { name: 'Settings', href: '/ceo/settings', icon: Settings },
        ],
      },
    ],
  },
  [UserRole.CTO]: {
    role: UserRole.CTO,
    title: 'CTO Dashboard',
    basePath: '/cto',
    groups: [
      {
        id: 'overview',
        label: 'Overview',
        items: [
          { name: 'Dashboard', href: '/cto', icon: LayoutDashboard },
          { name: 'Analytics', href: '/cto/analytics', icon: BarChart3 },
          { name: 'Goals', href: '/cto/goals', icon: Target },
          { name: 'Reports', href: '/cto/reports', icon: FileBarChart },
        ],
      },
      {
        id: 'delivery',
        label: 'Delivery',
        items: [
          { name: 'Projects', href: '/cto/projects', icon: FolderKanban },
          { name: 'Board', href: '/cto/tasks', icon: ListTodo },
          { name: 'Product', href: '/cto/product', icon: Package },
        ],
      },
      {
        id: 'engineering',
        label: 'Engineering',
        items: [
          { name: 'Code Reviews', href: '/cto/code-reviews', icon: GitPullRequest },
          { name: 'Architecture', href: '/cto/architecture', icon: Boxes },
          { name: 'Documentation', href: '/cto/documentation', icon: FileText },
          { name: 'Infrastructure', href: '/cto/infrastructure', icon: Server },
        ],
      },
      {
        id: 'people',
        label: 'People',
        items: [{ name: 'Teams', href: '/cto/team', icon: Users }],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Calendar', href: '/cto/calendar', icon: Calendar },
          { name: 'Meetings', href: '/cto/meetings', icon: Users },
          { name: 'Messages', href: '/cto/messages', icon: MessageSquare },
          { name: 'AI Assistant', href: '/cto/ai', icon: Bot },
          { name: 'Settings', href: '/cto/settings', icon: Settings },
        ],
      },
    ],
  },
  [UserRole.CISO]: {
    role: UserRole.CISO,
    title: 'CISO Dashboard',
    basePath: '/ciso',
    groups: [
      {
        id: 'overview',
        label: 'Overview',
        items: [{ name: 'Dashboard', href: '/ciso', icon: LayoutDashboard }],
      },
      {
        id: 'security-ops',
        label: 'Security Ops',
        items: [
          { name: 'Audit Tasks', href: '/ciso/tasks', icon: CheckSquare },
          { name: 'Project Audits', href: '/ciso/projects', icon: ShieldCheck },
          { name: 'Security Reports', href: '/ciso/reports', icon: FileBarChart },
        ],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Calendar', href: '/ciso/calendar', icon: Calendar },
          { name: 'Meetings', href: '/ciso/meetings', icon: Users },
          { name: 'Messages', href: '/ciso/messages', icon: MessageSquare },
          { name: 'Settings', href: '/ciso/settings', icon: Settings },
        ],
      },
    ],
  },
  [UserRole.FINANCE]: {
    role: UserRole.FINANCE,
    title: 'Finance Dashboard',
    basePath: '/finance',
    groups: [
      {
        id: 'overview',
        label: 'Overview',
        items: [
          { name: 'Dashboard', href: '/finance', icon: LayoutDashboard },
          { name: 'Analytics', href: '/finance/analytics', icon: BarChart3 },
          { name: 'Reports', href: '/finance/reports', icon: FileBarChart },
        ],
      },
      {
        id: 'money',
        label: 'Money',
        items: [
          { name: 'Invoices', href: '/finance/invoices', icon: FileText },
          { name: 'Expenses', href: '/finance/expenses', icon: Receipt },
          { name: 'Payments', href: '/finance/payments', icon: CreditCard },
          { name: 'Budgets', href: '/finance/budgets', icon: Wallet },
          { name: 'Revenue', href: '/finance/revenue', icon: DollarSign },
          { name: 'Financial Reports', href: '/finance/financial-reports', icon: FileBarChart },
        ],
      },
      {
        id: 'growth',
        label: 'Growth',
        items: [
          { name: 'Sales', href: '/finance/sales', icon: TrendingUp },
          { name: 'Marketing', href: '/finance/marketing', icon: Megaphone },
          { name: 'CRM', href: '/finance/crm', icon: UserCircle },
        ],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Documents', href: '/finance/documents', icon: FileText },
          { name: 'Calendar', href: '/finance/calendar', icon: Calendar },
          { name: 'Meetings', href: '/finance/meetings', icon: Users },
          { name: 'Messages', href: '/finance/messages', icon: MessageSquare },
          { name: 'AI Assistant', href: '/finance/ai', icon: Bot },
          { name: 'Settings', href: '/finance/settings', icon: Settings },
        ],
      },
    ],
  },
  [UserRole.SOFTWARE_ENGINEER]: {
    role: UserRole.SOFTWARE_ENGINEER,
    title: 'Engineering',
    basePath: '/software-engineer',
    groups: [
      {
        id: 'my-work',
        label: 'My work',
        items: [
          { name: 'Dashboard', href: '/software-engineer', icon: LayoutDashboard },
          { name: 'My Tasks', href: '/software-engineer/tasks', icon: CheckSquare },
          { name: 'My Bugs', href: '/software-engineer/bugs', icon: Bug },
          { name: 'My Commits', href: '/software-engineer/commits', icon: Code2 },
        ],
      },
      {
        id: 'delivery',
        label: 'Delivery',
        items: [
          { name: 'Projects', href: '/software-engineer/projects', icon: FolderKanban },
          { name: 'Teams', href: '/software-engineer/teams', icon: Users },
          { name: 'Board', href: '/software-engineer/tasks', icon: ListTodo },
          { name: 'Code Reviews', href: '/software-engineer/code-reviews', icon: GitPullRequest },
        ],
      },
      {
        id: 'knowledge',
        label: 'Knowledge',
        items: [
          { name: 'Documentation', href: '/software-engineer/documentation', icon: FileText },
          { name: 'AI Assistant', href: '/software-engineer/ai', icon: Bot },
        ],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Calendar', href: '/software-engineer/calendar', icon: Calendar },
          { name: 'Meetings', href: '/software-engineer/meetings', icon: Users },
          { name: 'Messages', href: '/software-engineer/messages', icon: MessageSquare },
          { name: 'Settings', href: '/software-engineer/settings', icon: Settings },
        ],
      },
    ],
  },
  [UserRole.UI_UX_DESIGNER]: {
    role: UserRole.UI_UX_DESIGNER,
    title: 'Design',
    basePath: '/ui-ux-designer',
    groups: [
      {
        id: 'my-work',
        label: 'My work',
        items: [
          { name: 'Dashboard', href: '/ui-ux-designer', icon: LayoutDashboard },
          { name: 'Design Tasks', href: '/ui-ux-designer/tasks', icon: CheckSquare },
          { name: 'UI/UX Issues', href: '/ui-ux-designer/bugs', icon: Bug },
        ],
      },
      {
        id: 'craft',
        label: 'Craft',
        items: [
          { name: 'Projects', href: '/ui-ux-designer/projects', icon: FolderKanban },
          { name: 'Features', href: '/ui-ux-designer/features', icon: Sparkles },
          { name: 'Prototypes', href: '/ui-ux-designer/prototypes', icon: Layers },
          { name: 'Design System', href: '/ui-ux-designer/design-system', icon: Palette },
          { name: 'User Research', href: '/ui-ux-designer/user-research', icon: Users },
        ],
      },
      {
        id: 'knowledge',
        label: 'Knowledge',
        items: [
          { name: 'Documentation', href: '/ui-ux-designer/documentation', icon: FileText },
          { name: 'AI Assistant', href: '/ui-ux-designer/ai', icon: Bot },
        ],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Calendar', href: '/ui-ux-designer/calendar', icon: Calendar },
          { name: 'Meetings', href: '/ui-ux-designer/meetings', icon: Users },
          { name: 'Messages', href: '/ui-ux-designer/messages', icon: MessageSquare },
          { name: 'Settings', href: '/ui-ux-designer/settings', icon: Settings },
        ],
      },
    ],
  },
  [UserRole.CUSTOMER_SUPPORT]: {
    role: UserRole.CUSTOMER_SUPPORT,
    title: 'Support',
    basePath: '/customer-support',
    groups: [
      {
        id: 'queue',
        label: 'Queue',
        items: [
          { name: 'Dashboard', href: '/customer-support', icon: LayoutDashboard },
          { name: 'Support Tickets', href: '/customer-support/tickets', icon: Ticket },
          { name: 'Live Chat', href: '/customer-support/chat', icon: MessageCircle },
          { name: 'Reported Bugs', href: '/customer-support/bugs', icon: Bug },
        ],
      },
      {
        id: 'customers',
        label: 'Customers',
        items: [
          { name: 'Contacts', href: '/customer-support/contacts', icon: UserCircle },
          { name: 'Knowledge Base', href: '/customer-support/knowledge-base', icon: BookOpen },
          { name: 'Documentation', href: '/customer-support/documentation', icon: FileText },
        ],
      },
      {
        id: 'insights',
        label: 'Insights',
        items: [
          { name: 'Analytics', href: '/customer-support/analytics', icon: BarChart3 },
          { name: 'AI Assistant', href: '/customer-support/ai', icon: Bot },
        ],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          { name: 'Calendar', href: '/customer-support/calendar', icon: Calendar },
          { name: 'Meetings', href: '/customer-support/meetings', icon: Users },
          { name: 'Messages', href: '/customer-support/messages', icon: MessageSquare },
          { name: 'Settings', href: '/customer-support/settings', icon: Settings },
        ],
      },
    ],
  },
};

export function isNavActive(pathname: string, href: string, basePath: string): boolean {
  if (href === basePath) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return 'Dashboard';
  const last = segments[segments.length - 1];
  if (last === 'create' || last === 'new') {
    const parent = segments[segments.length - 2] || 'Item';
    return `Create ${humanize(parent)}`;
  }
  if (!/^[a-z]+-\d+$/i.test(last) && last.length > 20) {
    return 'Details';
  }
  if (/^[a-z]{2,}-\d+$/i.test(last) || /^\d+$/.test(last) || last.length > 24) {
    const parent = segments[segments.length - 2] || 'Item';
    return `${humanize(parent)} Details`;
  }
  return humanize(last);
}

export function humanize(segment: string): string {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildBreadcrumbs(pathname: string, basePath: string, roleTitle: string) {
  const segments = pathname.split('/').filter(Boolean);
  const items: { label: string; href?: string }[] = [
    { label: roleTitle.replace(' Dashboard', ''), href: basePath },
  ];

  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    if (acc === basePath) continue;
    const isLast = i === segments.length - 1;
    const label = humanize(seg);
    items.push(isLast ? { label } : { label, href: acc });
  }

  return items;
}
