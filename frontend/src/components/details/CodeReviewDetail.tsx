'use client';

import { useMemo, useState } from 'react';
import { Check, ExternalLink, GitPullRequest, RefreshCw, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useUpdateEntity } from '@/hooks/useEntityApi';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailRecord,
  type DetailViewProps,
} from './DetailShell';
import { ActivityFeed, CommentThread, MetaGrid, PeopleList, RelatedList } from './shared';

type ReviewFile = {
  path: string;
  additions?: number;
  deletions?: number;
  patch?: string;
  status?: string;
};

function DiffPatch({ patch }: { patch?: string }) {
  const lines = useMemo(() => String(patch || '').split('\n'), [patch]);
  if (!patch?.trim()) {
    return (
      <p className="text-sm text-ink-muted px-3 py-4">
        No patch available for this file. Import from a PR URL or paste a diff when creating the review.
      </p>
    );
  }
  return (
    <pre className="overflow-x-auto text-xs font-mono leading-5 bg-surface-hover/40 rounded-lg border border-border">
      {lines.map((line, i) => {
        let cls = 'text-ink-secondary px-3';
        if (line.startsWith('+++') || line.startsWith('---')) cls = 'text-ink-muted px-3 bg-surface-hover/60';
        else if (line.startsWith('@@')) cls = 'text-brand px-3 bg-brand/5';
        else if (line.startsWith('+')) cls = 'text-success bg-success/10 px-3';
        else if (line.startsWith('-')) cls = 'text-danger bg-danger/10 px-3';
        return (
          <div key={i} className={cls}>
            {line || ' '}
          </div>
        );
      })}
    </pre>
  );
}

/** GitHub/GitLab PR review layout with stored diffs. */
export function CodeReviewDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const updateReview = useUpdateEntity('codeReviews');
  const queryClient = useQueryClient();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/code-reviews/${detailId}/sync`);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', 'codeReviews'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'codeReviews', detailId] });
      toast.success('Files synced from PR');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not sync from PR');
    },
  });

  const decideMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await api.post(`/code-reviews/${detailId}/decide`, { status });
      return res.data?.data || res.data;
    },
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['entity', 'codeReviews'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'codeReviews', detailId] });
      toast.success(status === 'approved' ? 'Review approved' : 'Changes requested');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update review');
    },
  });

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const files: ReviewFile[] = Array.isArray(data.files) ? data.files : [];
  const activePath = selectedPath && files.some((f) => f.path === selectedPath) ? selectedPath : files[0]?.path;
  const activeFile = files.find((f) => f.path === activePath);
  const branchLabel = data.branch || 'feature';
  const baseLabel = data.base_branch || 'main';
  const deciding = decideMutation.isPending || updateReview.isPending;

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={data.pr_url ? 'Pull request review' : `Code review · ${data.id}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={<Badge variant={data.statusVariant}>{data.status}</Badge>}
        actions={
          <>
            {data.pr_url ? (
              <Button
                size="sm"
                variant="outline"
                loading={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync files
              </Button>
            ) : null}
            {data.pr_url ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(String(data.pr_url), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open PR
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              loading={deciding}
              disabled={data.status === 'changes_requested'}
              onClick={() => decideMutation.mutate('changes_requested')}
            >
              <X className="h-4 w-4 mr-2" />
              Request changes
            </Button>
            <Button
              size="sm"
              loading={deciding}
              disabled={data.status === 'approved'}
              onClick={() => decideMutation.mutate('approved')}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </>
        }
      />

      <Card className="!p-3 flex flex-wrap items-center gap-3 text-sm">
        <GitPullRequest className="h-4 w-4 text-brand" />
        <span className="text-ink font-medium font-mono">{branchLabel}</span>
        <span className="text-ink-muted">→</span>
        <span className="text-ink font-mono">{baseLabel}</span>
        {data.repository ? (
          <Badge size="sm" variant="default">
            {data.repository}
          </Badge>
        ) : null}
        <span className="tabular-nums text-ink-muted ml-auto">
          <span className="text-success">+{data.additions ?? 0}</span>{' '}
          <span className="text-danger">-{data.deletions ?? 0}</span>
          <span className="ml-2">{files.length} files</span>
        </span>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Summary</h3>
            <p className="text-sm text-ink-secondary leading-relaxed">
              {data.description || 'No summary provided.'}
            </p>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Files changed</h3>
            {files.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No files yet. Add a GitHub/GitLab PR link and sync, or paste file diffs when creating the review.
              </p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setSelectedPath(f.path)}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      activePath === f.path
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:bg-surface-hover'
                    }`}
                  >
                    <span className="font-mono text-ink truncate text-left">{f.path}</span>
                    <span className="tabular-nums shrink-0 ml-3">
                      <span className="text-success">+{f.additions ?? 0}</span>{' '}
                      <span className="text-danger">-{f.deletions ?? 0}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {activeFile ? (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-mono text-ink">{activeFile.path}</span>
                  {activeFile.status ? <Badge size="sm">{activeFile.status}</Badge> : null}
                </div>
                <DiffPatch patch={activeFile.patch} />
              </div>
            ) : null}
          </Card>

          <Tabs defaultValue="discussion">
            <TabList>
              <Tab value="discussion">Discussion</Tab>
              <Tab value="activity">Activity</Tab>
              <Tab value="related">Related</Tab>
            </TabList>
            <TabPanel value="discussion" className="pt-4">
              <CommentThread seed={extras.comments} entityKey={entityKey} recordId={detailId} />
            </TabPanel>
            <TabPanel value="activity" className="pt-4">
              <ActivityFeed items={extras.activities} />
            </TabPanel>
            <TabPanel value="related" className="pt-4">
              <Card>
                <RelatedList items={extras.related} entityKey={entityKey} recordId={detailId} />
              </Card>
            </TabPanel>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <PeopleList title="Author" names={[data.author_name || data.owner]} />
            <PeopleList
              title="Reviewer"
              names={[data.reviewer_name].filter(Boolean) as string[]}
            />
            <MetaGrid
              items={[
                { label: 'Opened', value: formatDate(data.createdAt) },
                { label: 'Updated', value: formatDate(data.updatedAt) },
                { label: 'Project', value: data.project_name || '—' },
                { label: 'Priority', value: data.priority || '—' },
                { label: 'Files', value: String(files.length) },
              ]}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
