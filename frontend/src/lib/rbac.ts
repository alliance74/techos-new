import { UserRole, Permission, ROLE_PERMISSIONS, ROUTE_PERMISSIONS, ROLE_DEFAULT_ROUTES } from '@/types/roles';

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user role has all required permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a user role has at least one of the required permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user role can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  
  // If no specific permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  return hasAllPermissions(role, requiredPermissions);
}

/**
 * Get the default landing route for a user role
 */
export function getDefaultRoute(role: UserRole): string {
  return ROLE_DEFAULT_ROUTES[role] || '/dashboard';
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all accessible routes for a user role
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  return Object.keys(ROUTE_PERMISSIONS).filter(route => canAccessRoute(role, route));
}

/**
 * Filter navigation items based on user permissions
 */
export interface NavigationItem {
  href: string;
  label: string;
  icon?: any;
  children?: NavigationItem[];
}

export function filterNavigationByPermissions(
  navigation: NavigationItem[],
  role: UserRole
): NavigationItem[] {
  return navigation
    .filter(item => canAccessRoute(role, item.href))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: filterNavigationByPermissions(item.children, role),
        };
      }
      return item;
    })
    .filter(item => !item.children || item.children.length > 0);
}
