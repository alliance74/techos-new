'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';

export default function RegisterPage() {
  return (
    <AuthShell
      panelSide="right"
      panel={
        <>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome Back!</h2>
          <p className="mt-3 text-sm text-white/90">Already have an account?</p>
          <Link
            href="/login"
            className="mt-7 inline-flex min-w-[150px] items-center justify-center rounded-xl border-2 border-white px-10 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Login
          </Link>
        </>
      }
      form={
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-center text-3xl font-bold text-ink tracking-tight">Registration</h1>
          <div className="mt-8 rounded-xl border border-border bg-bg-muted p-5 space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <p className="font-semibold">Account provisioning is managed by your CEO.</p>
            </div>
            <p className="text-sm text-ink-muted">
              Ask your CEO to create your account and share your temporary credentials. After first login, we recommend updating your profile and password in settings.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-deep"
            >
              Go to Login
            </Link>
          </div>
        </div>
      }
    />
  );
}
