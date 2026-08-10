'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/rbac';
import { Permission, UserRole } from '@/types/roles';

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any permission
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = true,
  fallback = null,
}: PermissionGateProps) {
  const user = useAuthStore((state) => state.user);

  if (!user?.role) {
    return <>{fallback}</>;
  }

  const userRole = user.role as UserRole;
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook version for programmatic permission checking
 */
export function usePermissionGate() {
  const user = useAuthStore((state) => state.user);

  const can = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const canAll = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    return hasAllPermissions(user.role as UserRole, permissions);
  };

  const canAny = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    return hasAnyPermission(user.role as UserRole, permissions);
  };

  return { can, canAll, canAny, userRole: user?.role };
}
