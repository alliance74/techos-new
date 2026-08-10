'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/roles';
import { getRoleRoute } from '@/lib/roleRoutes';
import { ROLE_NAV, hasNavHref } from '@/lib/navigation';
import { TopBar } from '@/components/Layout/TopBar';
import { SidebarNav, useSidebarGroups } from '@/components/Layout/SidebarNav';
import { cn } from '@/lib/utils';

interface RoleLayoutProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleLayout({ role, children }: RoleLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = ROLE_NAV[role];

  const { openMap, toggleGroup } = useSidebarGroups(
    config?.groups ?? [],
    config?.basePath ?? '/',
    `techos-nav-${role}`,
  );

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== role) {
      router.push(getRoleRoute(user.role));
    }
  }, [user, role, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!user || user.role !== role || !config) {
    return (
      <div className="min-h-screen page-shell flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-brand" />
      </div>
    );
  }

  const settingsHref = hasNavHref(config.groups, '/settings')
    ? `${config.basePath}/settings`
    : config.basePath;

  const renderSidebar = (opts?: { showClose?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="p-4 pb-2">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <Link href={config.basePath} className="text-2xl font-bold text-brand tracking-tight">
              TechOS
            </Link>
            <p className="text-sm text-ink-muted mt-0.5">{config.title}</p>
          </div>
          {opts?.showClose && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-ink-muted hover:bg-sidebar-hover hover:text-ink"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <SidebarNav
          groups={config.groups}
          basePath={config.basePath}
          openMap={openMap}
          toggleGroup={toggleGroup}
          pathname={pathname}
        />
      </div>

      <div className="mt-auto p-4 pt-4 border-t border-sidebar-border">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Signed in</p>
        <p className="text-sm font-medium text-ink mt-1 truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-ink-muted truncate">{user.email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen page-shell text-ink">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-inverse/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside className="hidden lg:block w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 overflow-y-auto z-30 shadow-sm">
        {renderSidebar()}
      </aside>

      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border overflow-y-auto shadow-lg transition-transform duration-normal',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {renderSidebar({ showClose: true })}
      </aside>

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-20 flex items-center bg-topbar/90 backdrop-blur border-b border-topbar-border">
          <button
            type="button"
            className="lg:hidden ml-3 p-2 rounded-lg text-ink-secondary hover:bg-surface-hover"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <TopBar settingsHref={settingsHref} profileHref={settingsHref} />
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">{children}</main>
      </div>
    </div>
  );
}
