'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function CustomerSupportLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.CUSTOMER_SUPPORT}>{children}</RoleLayout>;
}
