'use client';

import { SprintWorkspace } from '@/components/boards/SprintWorkspace';

export default function CisoBoardPage() {
  return (
    <SprintWorkspace
      breadcrumbs={[
        { label: 'CISO Workspace', href: '/ciso' },
        { label: 'Board' },
      ]}
    />
  );
}
