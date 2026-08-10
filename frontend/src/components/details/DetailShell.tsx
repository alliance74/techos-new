'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { MockRecord } from '@/mocks';
import type {
  DetailActivity,
  DetailAttachment,
  DetailChecklistItem,
  DetailComment,
  DetailRelated,
} from '@/mocks/detailExtras';
import { useEntityItem, useEntityActivity, useUpdateEntity, useDeleteEntity } from '@/hooks/useEntityApi';
import { Button } from '@/components/UI/Button';
import { EmptyState } from '@/components/UI/EmptyState';
import { PageHeader } from '@/components/UI/PageHeader';
import { Skeleton, SkeletonCard } from '@/components/UI/Skeleton';
import { useRouter } from 'next/navigation';

type ActivityRecord = {
  id?: string;
  actor_name?: string;
  action?: string;
  summary?: string;
  created_at?: string;
};

export interface DetailViewProps {
  title: string;
  entityKey: string;
  detailId: string;
  breadcrumbs: { label: string; href?: string }[];
  basePath: string;
}

export interface LoadedDetail {
  record: MockRecord & { position?: string };
  extras: {
    assignees: string[];
    watchers: string[];
    activities: DetailActivity[];
    comments: DetailComment[];
    attachments: DetailAttachment[];
    checklist: DetailChecklistItem[];
    related: DetailRelated[];
    workflow: string[];
  };
}

export function useDetailRecord(entityKey: string, detailId: string) {
  const apiQuery = useEntityItem(entityKey, detailId);
  const activityQuery = useEntityActivity(entityKey, detailId);

  const extras = useMemo<LoadedDetail['extras']>(() => {
    const apiActivities = ((activityQuery.data || []) as ActivityRecord[]).map((a, i) => ({
      id: a.id || `act-${i}`,
      actor: a.actor_name || 'System',
      action: a.action || 'updated',
      target: a.summary || '',
      time: a.created_at ? new Date(a.created_at).toLocaleString() : '',
    }));
    return {
      assignees: [apiQuery.data?.owner].filter(Boolean),
      watchers: [],
      activities: apiActivities,
      comments: [],
      attachments: [],
      checklist: [],
      related: [],
      workflow: [],
    };
  }, [apiQuery.data, activityQuery.data]);

  return {
    data: apiQuery.data as LoadedDetail['record'] | undefined,
    isLoading: apiQuery.isLoading || activityQuery.isLoading,
    isError: apiQuery.isError,
    extras,
  };
}

export function useDetailMutations(entityKey: string) {
  const router = useRouter();
  const updateEntity = useUpdateEntity(entityKey);
  const deleteEntity = useDeleteEntity(entityKey);
  return {
    updateEntity,
    deleteEntity,
    removeAndBack: async (id: string) => {
      await deleteEntity.mutateAsync(id);
      router.back();
    },
  };
}

export function DetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SkeletonCard className="xl:col-span-2 h-80" />
        <SkeletonCard className="h-80" />
      </div>
    </div>
  );
}

export function DetailNotFound({ entityKey, detailId }: { entityKey: string; detailId: string }) {
  return (
    <EmptyState
      title="Record not found"
      description={`No ${entityKey.slice(0, -1).toLowerCase()} matches “${detailId}”.`}
      action={{ label: 'Back to list', onClick: () => history.back() }}
    />
  );
}

export function DetailHeader({
  title,
  subtitle,
  breadcrumbs,
  basePath,
  badges,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs: { label: string; href?: string }[];
  basePath: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={subtitle}
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Link href={basePath}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          {badges}
          {actions}
        </>
      }
    />
  );
}
