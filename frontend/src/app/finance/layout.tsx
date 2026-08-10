'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.FINANCE}>{children}</RoleLayout>;
}
