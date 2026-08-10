'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar,
  Users, 
  MessageSquare,
  DollarSign,
  UserCircle,
  FileText,
  Target,
  Megaphone,
  Package,
  BarChart3,
  Settings,
  Bot,
  Layers,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { canAccessRoute } from '@/lib/rbac';
import { UserRole } from '@/types/roles';

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Meetings', href: '/dashboard/meetings', icon: Users },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Goals & OKRs', href: '/dashboard/goals', icon: Target },
  { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { name: 'Reports', href: '/dashboard/reports', icon: ClipboardList },
  { name: 'CRM', href: '/dashboard/crm/contacts', icon: UserCircle },
  { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
  { name: 'HR', href: '/dashboard/hr', icon: Briefcase },
  { name: 'Product', href: '/dashboard/product/features', icon: Package },
  { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Layers },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  
  // Filter navigation based on user role permissions
  const navigation = allNavigation.filter(item => {
    if (!user?.role) return false;
    return canAccessRoute(user.role as UserRole, item.href);
  });

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-black">TechOS</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                  'group flex items-center px-2 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600',
                    'mr-3 flex-shrink-0 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
