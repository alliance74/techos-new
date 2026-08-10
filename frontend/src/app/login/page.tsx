'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getRoleRoute } from '@/lib/roleRoutes';
import { mapBackendUserToFrontend } from '@/lib/apiMappers/auth';
import { useLoginMutation } from '@/hooks/useAuthMutations';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!username.trim()) next.username = 'Username is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    const email = username.includes('@')
      ? username.trim()
      : `${username.trim().toLowerCase().replace(/\s+/g, '.')}@techos.io`;

    try {
      const data = await loginMutation.mutateAsync({ email, password });
      if (data.success) {
        const user = mapBackendUserToFrontend(data.data.user);
        setAuth(user, data.data.token);
        toast.success('Welcome back!');
        router.push(getRoleRoute(user.role));
        return;
      }
      toast.error('Login failed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <AuthShell
      panelSide="left"
      panel={
        <>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Hello, Welcome!</h2>
          <p className="mt-3 text-sm text-white/90">Don&apos;t have an account?</p>
          <Link
            href="/register"
            className="mt-7 inline-flex min-w-[150px] items-center justify-center rounded-xl border-2 border-white px-10 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Register
          </Link>
        </>
      }
      form={
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-center text-3xl font-bold text-ink tracking-tight">Login</h1>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
            <AuthField
              icon={<User className="h-4 w-4" />}
              placeholder="Email"
              autoComplete="username"
              value={username}
              error={errors.username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <AuthField
              icon={<Lock className="h-4 w-4" />}
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="text-center">
              <p className="text-xs text-ink-muted">
                Contact your workspace admin if you need a password reset.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      }
    />
  );
}
