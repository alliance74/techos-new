'use client';

import { Bell, Search, LogOut, User, Settings, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtime';

interface TopBarProps {
  settingsHref?: string;
  profileHref?: string;
}

export function TopBar({ settingsHref = '/ceo/settings', profileHref = '/ceo/settings' }: TopBarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Activate real-time websocket listener for notifications
  useRealtimeNotifications();

  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      ceo: 'CEO',
      cto: 'CTO',
      ciso: 'CISO',
      finance: 'Finance Manager',
      software_engineer: 'Software Engineer',
      ui_ux_designer: 'UI/UX Designer',
      customer_support: 'Customer Support',
    };
    return roleNames[role] || role;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    const base = pathname.split('/').slice(0, 2).join('/') || '/ceo';
    router.push(`${base}/messages?q=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  return (
    <div className="bg-transparent px-3 sm:px-6 py-3 w-full">
      <div className="flex items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, people, docs..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-muted border border-transparent text-ink placeholder:text-ink-muted rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus:border-brand/30 focus:bg-surface transition"
              aria-label="Search"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowUserMenu(false);
              }}
              className="relative p-2 hover:bg-surface-hover rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5 text-ink-secondary" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-brand rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-surface border border-transparent">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-lg border border-border z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">Notifications</p>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="text-xs text-ink-muted hover:text-brand flex items-center gap-1"
                        onClick={() => markAllAsRead.mutate()}
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <ul className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 && (
                      <li className="px-4 py-8 text-center text-sm text-ink-muted">No notifications yet</li>
                    )}
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors',
                            !n.read && 'bg-brand-mist/50',
                          )}
                          onClick={() => {
                            if (!n.read) markAsRead.mutate(n.id);
                            if (n.link) {
                              setShowNotifications(false);
                              const base = pathname.split('/').slice(0, 2).join('/') || '/ceo';
                              const targetUrl = n.link.startsWith('/') && !n.link.startsWith(base) 
                                ? `${base}${n.link}` 
                                : n.link;
                              router.push(targetUrl);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-ink">{n.title}</p>
                            {!n.read && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />}
                          </div>
                          <p className="text-xs text-ink-muted mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-[11px] text-ink-muted mt-1">
                            {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu((v) => !v);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-1.5 sm:p-2 hover:bg-surface-hover rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 bg-brand text-ink-inverse rounded-full flex items-center justify-center text-sm font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-ink">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-ink-muted">{getRoleName(user?.role || '')}</p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border py-2 z-20"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-ink">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push(profileHref);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-ink-secondary hover:bg-surface-hover flex items-center gap-3"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push(settingsHref);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-ink-secondary hover:bg-surface-hover flex items-center gap-3"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>

                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
