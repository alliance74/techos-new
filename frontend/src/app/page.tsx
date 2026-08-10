'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getRoleRoute } from '@/lib/roleRoutes';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(getRoleRoute(user.role));
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen page-shell">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-strong border-t-brand" />
    </div>
  );
}
