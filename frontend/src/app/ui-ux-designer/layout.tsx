'use client';

import { RoleLayout } from '@/components/Layout/RoleLayout';
import { UserRole } from '@/types/roles';

export default function UIUXDesignerLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role={UserRole.UI_UX_DESIGNER}>{children}</RoleLayout>;
}
