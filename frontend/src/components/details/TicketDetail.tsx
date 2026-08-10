'use client';

import { useState } from 'react';
import { Headphones, Timer } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useUpdateEntity } from '@/hooks/useEntityApi';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
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

const QUEUE = ['New', 'Open', 'Pending', 'Waiting on Customer', 'Resolved', 'Closed'];

/** Zendesk/Intercom-style support ticket. */
export function TicketDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const statusMutation = useUpdateEntity('tickets');
  const [status, setStatus] = useState<string | null>(null);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const current = status ?? data.status;
  const urgent = data.priority === 'critical' || data.priority === 'high';

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={`Ticket · ${data.id}${data.company ? ` · ${data.company}` : ''}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{current}</Badge>
            {data.priority && <Badge variant={urgent ? 'error' : 'warning'}>{data.priority}</Badge>}
          </>
        }
        actions={
          <Button size="sm" onClick={() => toast.error('Ticket escalation is not available yet.')}>
            Escalate
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'First response SLA', value: urgent ? '15 min' : '4 hours' },
          { label: 'Resolution SLA', value: urgent ? '4 hours' : '2 business days' },
          { label: 'Channel', value: 'Email / Portal' },
          { label: 'Queue', value: urgent ? 'Priority' : 'General' },
        ].map((kpi) => (
          <Card key={kpi.label} className="!p-3">
            <p className="text-xs text-ink-muted flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {kpi.label}
            </p>
            <p className="text-sm font-semibold text-ink mt-1">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="!p-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          <Headphones className="h-4 w-4 text-brand mr-1" />
          {QUEUE.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                setStatus(step);
                statusMutation.mutate({ id: data.id, data: { ...data, status: step } });
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium border',
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
          <Card className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Customer request</h3>
            <p className="text-sm text-ink-secondary leading-relaxed">{data.description}</p>
          </Card>

          <Tabs defaultValue="conversation">
            <TabList>
              <Tab value="conversation">Conversation</Tab>
              <Tab value="internal">Internal notes</Tab>
              <Tab value="activity">Activity</Tab>
              <Tab value="related">Related</Tab>
            </TabList>
            <TabPanel value="conversation" className="pt-4">
              <CommentThread seed={extras.comments} entityKey={entityKey} recordId={detailId} />
            </TabPanel>
            <TabPanel value="internal" className="pt-4">
              <Card className="text-sm text-ink-secondary">
                Internal: Check latest release notes before suggesting a workaround. Customer is on Pro plan.
              </Card>
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
            <PeopleList title="Assignee" names={[data.assignee || data.owner]} />
            <MetaGrid
              items={[
                { label: 'Requester', value: data.company || data.owner },
                { label: 'Email', value: data.email || '—' },
                { label: 'Created', value: formatDate(data.createdAt) },
                { label: 'Updated', value: formatDate(data.updatedAt) },
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
              <option value="critical">Urgent</option>
            </Select>
          </Card>
        </aside>
      </div>
    </div>
  );
}
