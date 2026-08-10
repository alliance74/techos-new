'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function SoftwareEngineerLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.SOFTWARE_ENGINEER}>{children}</RoleLayout>;
}
