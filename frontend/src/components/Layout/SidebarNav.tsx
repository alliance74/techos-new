'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { isNavActive, type NavGroup } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  groups: NavGroup[];
  basePath: string;
  storageKey: string;
}

function groupContainsActive(group: NavGroup, pathname: string, basePath: string) {
  return group.items.some((item) => isNavActive(pathname, item.href, basePath));
}

function readStored(storageKey: string): Record<string, boolean> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return null;
  }
}

function defaultOpenMap(groups: NavGroup[], pathname: string, basePath: string, storageKey: string) {
  const stored = readStored(storageKey);
  const next: Record<string, boolean> = {};
  for (const group of groups) {
    const active = groupContainsActive(group, pathname, basePath);
    if (stored && typeof stored[group.id] === 'boolean') {
      next[group.id] = stored[group.id] || active;
    } else {
      next[group.id] =
        group.id === 'overview' ||
        group.id === 'my-work' ||
        group.id === 'queue' ||
        active;
    }
  }
  return next;
}

/** Shared collapse state so desktop + mobile drawers stay in sync. */
export function useSidebarGroups(groups: NavGroup[], basePath: string, storageKey: string) {
  const pathname = usePathname();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) initial[group.id] = true;
    return initial;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpenMap(defaultOpenMap(groups, pathname, basePath, storageKey));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    setOpenMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of groups) {
        if (groupContainsActive(group, pathname, basePath) && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, groups, basePath, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(openMap));
    } catch {
      // ignore
    }
  }, [openMap, storageKey, hydrated]);

  const toggleGroup = useCallback((id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return { openMap, toggleGroup, pathname };
}

export function SidebarNav({
  groups,
  basePath,
  openMap,
  toggleGroup,
  pathname,
}: {
  groups: NavGroup[];
  basePath: string;
  openMap: Record<string, boolean>;
  toggleGroup: (id: string) => void;
  pathname: string;
}) {
  return (
    <nav className="space-y-1" aria-label="Main">
      {groups.map((group) => {
        const open = openMap[group.id] ?? true;
        const activeInGroup = groupContainsActive(group, pathname, basePath);
        const panelId = `nav-group-${group.id}`;

        return (
          <div key={group.id} className="pb-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={open}
              aria-controls={panelId}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-colors',
                'hover:bg-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                activeInGroup ? 'text-ink' : 'text-ink-muted',
              )}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider">{group.label}</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                  open ? 'rotate-0' : '-rotate-90',
                )}
                aria-hidden
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-label={group.label}
              className={cn(
                'overflow-hidden transition-[grid-template-rows] duration-200 ease-out grid',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href, basePath);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-fast',
                        active
                          ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-ink',
                      )}
                      aria-current={active ? 'page' : undefined}
                      tabIndex={open ? 0 : -1}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/** Convenience wrapper that owns collapse state (single sidebar instance). */
export function SidebarNavConnected(props: SidebarNavProps) {
  const { openMap, toggleGroup, pathname } = useSidebarGroups(
    props.groups,
    props.basePath,
    props.storageKey,
  );
  return (
    <SidebarNav
      groups={props.groups}
      basePath={props.basePath}
      openMap={openMap}
      toggleGroup={toggleGroup}
      pathname={pathname}
    />
  );
}
