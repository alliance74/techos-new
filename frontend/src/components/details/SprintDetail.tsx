'use client';

import { ListTodo } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/UI/Badge';
import { Card } from '@/components/UI/Card';
import { Progress } from '@/components/UI/Progress';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailRecord,
  type DetailViewProps,
} from './DetailShell';
import { ActivityFeed, MetaGrid, PeopleList, RelatedList } from './shared';

/** Jira sprint overview. */
export function SprintDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const progress = data.progress ?? 0;
  const committed = 42;
  const completed = Math.round((progress / 100) * committed);

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={`Sprint · ${data.id}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={<Badge variant={data.statusVariant}>{data.status}</Badge>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Committed', value: `${committed} pts` },
          { label: 'Completed', value: `${completed} pts` },
          { label: 'Remaining', value: `${committed - completed} pts` },
          { label: 'Days left', value: data.dueDate ? '5' : '—' },
        ].map((kpi) => (
          <Card key={kpi.label} className="!p-3">
            <p className="text-xs text-ink-muted">{kpi.label}</p>
            <p className="text-lg font-semibold text-ink mt-1">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-medium text-ink">Sprint goal</h3>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed">{data.description}</p>
            <Progress value={progress} label={`${progress}% complete`} />
            <MetaGrid
              items={[
                { label: 'Sprint lead', value: data.owner },
                { label: 'Start', value: data.startDate ? formatDate(data.startDate) : '—' },
                { label: 'End', value: data.dueDate ? formatDate(data.dueDate) : '—' },
                { label: 'Updated', value: formatDate(data.updatedAt) },
              ]}
            />
          </Card>

          <Tabs defaultValue="scope">
            <TabList>
              <Tab value="scope">Scope</Tab>
              <Tab value="activity">Activity</Tab>
            </TabList>
            <TabPanel value="scope" className="pt-4">
              <Card>
                <RelatedList items={extras.related} entityKey={entityKey} recordId={detailId} />
              </Card>
            </TabPanel>
            <TabPanel value="activity" className="pt-4">
              <ActivityFeed items={extras.activities} />
            </TabPanel>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <PeopleList title="Squad" names={extras.assignees} />
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
        </aside>
      </div>
    </div>
  );
}
