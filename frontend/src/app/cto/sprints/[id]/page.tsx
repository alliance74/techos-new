'use client';

import { SprintWorkspace } from '@/components/boards/SprintWorkspace';

export default function Page() {
  return (
    <SprintWorkspace
      breadcrumbs={[
        { label: 'CTO Workspace', href: '/cto' },
        { label: 'Sprints', href: '/cto/sprints' },
        { label: 'Sprint Detail' },
      ]}
    />
  );
}
