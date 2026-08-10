import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAllPermissions, hasAnyPermission, canAccessRoute } from '@/lib/rbac';
import { Permission, UserRole } from '@/types/roles';

export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAllPermissions(user.role as UserRole, permissions);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAnyPermission(user.role as UserRole, permissions);
  };

  const checkRouteAccess = (route: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role as UserRole, route);
  };

  return {
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,
    canAccessRoute: checkRouteAccess,
    userRole: user?.role,
  };
}
