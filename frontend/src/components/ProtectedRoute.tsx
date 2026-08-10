'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, getDefaultRoute } from '@/lib/rbac';
import { UserRole } from '@/types/roles';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has permission to access current route
    if (user && !canAccessRoute(user.role as UserRole, pathname)) {
      // Redirect to default route for their role
      const defaultRoute = getDefaultRoute(user.role as UserRole);
      router.push(defaultRoute);
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render content if not authenticated or no permission
  if (!isAuthenticated || (user && !canAccessRoute(user.role as UserRole, pathname))) {
    return null;
  }

  return <>{children}</>;
}
