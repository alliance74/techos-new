'use client';

import {
  createContext,
  KeyboardEvent,
  ReactNode,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  baseId: string;
  registerTab: (id: string) => void;
  tabOrder: string[];
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

interface TabsProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, defaultValue, value, onChange, className }: TabsProps) {
  const baseId = useId();
  const tabOrderRef = useRef<string[]>([]);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value! : internalValue;

  const setActiveTab = (id: string) => {
    if (!isControlled) setInternalValue(id);
    onChange?.(id);
  };

  const registerTab = (id: string) => {
    if (!tabOrderRef.current.includes(id)) {
      tabOrderRef.current.push(id);
      if (!isControlled && !internalValue) setInternalValue(id);
    }
  };

  const ctxValue = useMemo(
    () => ({ activeTab, setActiveTab, baseId, registerTab, tabOrder: tabOrderRef.current }),
    [activeTab, baseId]
  );

  return (
    <TabsContext.Provider value={ctxValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function TabList({ children, className, ...props }: TabListProps) {
  const { tabOrder, activeTab, setActiveTab } = useTabsContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const order = tabOrder;
    if (order.length === 0) return;
    const currentIndex = order.indexOf(activeTab);

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % order.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + order.length) % order.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = order.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextId = order[nextIndex];
      setActiveTab(nextId);
      const el = document.getElementById(`tab-${nextId}`);
      el?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={props['aria-label']}
      onKeyDown={handleKeyDown}
      className={cn('flex items-center gap-1 border-b border-border', className)}
    >
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Tab({ value, children, className, disabled }: TabProps) {
  const { activeTab, setActiveTab, registerTab, baseId } = useTabsContext();
  const registered = useRef(false);
  if (!registered.current) {
    registerTab(value);
    registered.current = true;
  }

  const isActive = activeTab === value;

  return (
    <button
      type="button"
      id={`tab-${value}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${baseId}-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-t-md',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive
          ? 'text-brand after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-brand'
          : 'text-ink-muted hover:text-ink',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeTab, baseId } = useTabsContext();
  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${baseId}-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn('focus:outline-none', className)}
    >
      {children}
    </div>
  );
}
