'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function CEOLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.CEO}>{children}</RoleLayout>;
}
