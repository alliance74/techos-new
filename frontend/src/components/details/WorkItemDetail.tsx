'use client';

import { useState } from 'react';
import { Bug, CheckSquare, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useUpdateEntity } from '@/hooks/useEntityApi';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Progress } from '@/components/UI/Progress';
import { Select } from '@/components/UI/Select';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import { cn } from '@/lib/utils';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailRecord,
  type DetailViewProps,
} from './DetailShell';
import { ActivityFeed, CommentThread, MetaGrid, PeopleList, RelatedList } from './shared';

const TASK_FLOW = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];
const BUG_FLOW = ['Open', 'Triaged', 'In Progress', 'In Review', 'Resolved', 'Closed'];

/** Linear/Jira-style work item for tasks and bugs. */
export function WorkItemDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const isBug = entityKey === 'bugs';
  const flow = isBug ? BUG_FLOW : TASK_FLOW;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const statusMutation = useUpdateEntity(entityKey);
  const [status, setStatus] = useState<string | null>(null);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const current = status ?? data.status;
  const Icon = isBug ? Bug : CheckSquare;

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={`${isBug ? 'Bug' : 'Task'} · ${data.id}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{current}</Badge>
            {data.priority && (
              <Badge
                variant={
                  data.priority === 'critical' || data.priority === 'high' ? 'error' : 'warning'
                }
              >
                {data.priority}
              </Badge>
            )}
          </>
        }
        actions={
          <Button size="sm" variant="secondary" onClick={() => toast.error('Linking pull requests is not available yet.')}>
            <GitBranch className="h-4 w-4 mr-2" />
            Link PR
          </Button>
        }
      />

      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Icon className="h-4 w-4 text-brand mr-1" />
          {flow.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                setStatus(step);
                statusMutation.mutate({ id: data.id, data: { ...data, status: step } });
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                step.toLowerCase() === current.toLowerCase()
                  ? 'bg-brand text-white border-brand'
                  : 'border-border text-ink-secondary hover:border-brand/40',
              )}
            >
              {step}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-ink mb-2">Description</h3>
              <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                {data.description}
              </p>
            </div>
            {isBug && (
              <div className="rounded-xl border border-border bg-bg-muted p-4 space-y-2 text-sm">
                <p>
                  <span className="text-ink-muted">Environment · </span>
                  <span className="text-ink">{data.category || 'production'}</span>
                </p>
                <p>
                  <span className="text-ink-muted">Repro · </span>
                  <span className="text-ink">
                    1) Open the affected screen 2) Trigger the action 3) Observe failure
                  </span>
                </p>
                <p>
                  <span className="text-ink-muted">Expected · </span>
                  <span className="text-ink">Feature behaves without error</span>
                </p>
              </div>
            )}
            {typeof data.progress === 'number' && data.progress > 0 && (
              <Progress value={data.progress} label={`${data.progress}%`} />
            )}
            {data.tags && (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((t) => (
                  <Badge key={t} size="sm">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Tabs defaultValue="comments">
            <TabList>
              <Tab value="comments">Comments</Tab>
              <Tab value="activity">Activity</Tab>
              <Tab value="links">Links</Tab>
            </TabList>
            <TabPanel value="comments" className="pt-4">
              <CommentThread seed={extras.comments} entityKey={entityKey} recordId={detailId} />
            </TabPanel>
            <TabPanel value="activity" className="pt-4">
              <ActivityFeed items={extras.activities} />
            </TabPanel>
            <TabPanel value="links" className="pt-4">
              <Card>
                <RelatedList items={extras.related} entityKey={entityKey} recordId={detailId} />
              </Card>
            </TabPanel>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <PeopleList title="Assignee" names={[data.assignee || data.owner]} />
            <PeopleList title="Watchers" names={extras.watchers} />
            <MetaGrid
              items={[
                { label: 'Reporter', value: data.owner },
                { label: 'Due', value: data.dueDate ? formatDate(data.dueDate) : '—' },
                { label: 'Updated', value: formatDate(data.updatedAt) },
                { label: 'Sprint', value: data.tags?.[0] || '—' },
              ]}
            />
            <Select
              label="Priority"
              defaultValue={data.priority || 'medium'}
              onChange={(event) =>
                statusMutation.mutate({ id: data.id, data: { ...data, priority: event.target.value } })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Points" defaultValue="5" type="number" />
              <Input label="Time spent" defaultValue="3h" />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
