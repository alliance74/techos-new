'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function CISOLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.CISO}>{children}</RoleLayout>;
}
