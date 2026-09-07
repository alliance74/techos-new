'use client';

import { SprintWorkspace } from '@/components/boards/SprintWorkspace';

export default function SprintsPage() {
  return (
    <SprintWorkspace
      breadcrumbs={[
        { label: 'CTO Workspace', href: '/cto' },
        { label: 'Sprints' },
      ]}
    />
  );
}
