'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function CTOLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.CTO}>{children}</RoleLayout>;
}
