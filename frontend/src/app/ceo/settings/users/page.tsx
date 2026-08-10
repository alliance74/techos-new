'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/UI/PageHeader';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Users } from 'lucide-react';

export default function UsersProvisioningPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Provisioning"
        description="User invites are managed from HR Employees."
      />
      <Card className="max-w-xl space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-brand-mist p-2">
            <Users className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-ink">Invite from Employees</h3>
            <p className="text-sm text-ink-muted mt-1">
              Create accounts, assign roles, and share temporary credentials from the HR Employees page.
            </p>
          </div>
        </div>
        <Link href="/ceo/hr/employees">
          <Button>Go to Employees</Button>
        </Link>
      </Card>
    </div>
  );
}
