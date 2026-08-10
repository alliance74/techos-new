import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/types/roles';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  name?: string;
  avatar?: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('auth_token', token);
        set({ user, token });
      },
      updateUser: (patch) => {
        const current = get().user;
        if (!current) return;
        const next = { ...current, ...patch };
        if (patch.firstName !== undefined || patch.lastName !== undefined) {
          next.name = `${next.firstName || ''} ${next.lastName || ''}`.trim();
        }
        set({ user: next });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        return !!get().token;
      },
      hasRole: (role: UserRole) => {
        return get().user?.role === role;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
