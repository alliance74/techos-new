'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { entitySingular } from '@/mocks/detailExtras';
import { Badge } from '@/components/UI/Badge';
import { Card } from '@/components/UI/Card';
import { Progress } from '@/components/UI/Progress';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailRecord,
  useDetailMutations,
  type DetailViewProps,
} from './DetailShell';
import { ActivityFeed, CommentThread, MetaGrid, RelatedList } from './shared';
import { Button } from '@/components/UI/Button';

/** Fallback for goals, documents, campaigns, features, etc. */
export function GenericRecordDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const { updateEntity, removeAndBack } = useDetailMutations(entityKey);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || data.name || title}
        subtitle={`${entitySingular(entityKey)} · ${data.id}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{data.status}</Badge>
            {data.priority && <Badge variant="warning">{data.priority}</Badge>}
          </>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              loading={updateEntity.isPending}
              onClick={() =>
                updateEntity.mutate({
                  id: detailId,
                  data: {
                    title: data.title || data.name,
                    description: data.description,
                    status: data.status === 'active' ? 'completed' : 'active',
                    priority: data.priority,
                    owner: data.owner,
                    amount: data.amount,
                  },
                })
              }
            >
              Toggle status
            </Button>
            <Button size="sm" variant="danger" onClick={() => removeAndBack(detailId)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-4">
            <p className="text-sm text-ink-secondary leading-relaxed">{data.description}</p>
            {typeof data.progress === 'number' && (
              <Progress value={data.progress} label={`${data.progress}%`} />
            )}
            <MetaGrid
              items={[
                { label: 'Owner', value: data.owner },
                ...(data.company ? [{ label: 'Company', value: data.company }] : []),
                ...(typeof data.amount === 'number'
                  ? [{ label: 'Amount', value: formatCurrency(data.amount) }]
                  : []),
                ...(data.dueDate ? [{ label: 'Due', value: formatDate(data.dueDate) }] : []),
                { label: 'Updated', value: formatDate(data.updatedAt) },
                { label: 'Created', value: formatDate(data.createdAt) },
              ]}
            />
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

          <Tabs defaultValue="activity">
            <TabList>
              <Tab value="activity">Activity</Tab>
              <Tab value="comments">Comments</Tab>
              <Tab value="related">Related</Tab>
            </TabList>
            <TabPanel value="activity" className="pt-4">
              <ActivityFeed items={extras.activities} />
            </TabPanel>
            <TabPanel value="comments" className="pt-4">
              <CommentThread seed={extras.comments} entityKey={entityKey} recordId={detailId} />
            </TabPanel>
            <TabPanel value="related" className="pt-4">
              <Card>
                <RelatedList items={extras.related} entityKey={entityKey} recordId={detailId} />
              </Card>
            </TabPanel>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-2 text-sm text-ink-secondary">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Record type</p>
            <p className="text-ink font-medium">{entitySingular(entityKey)}</p>
            <p>Specialized layout not required for this entity — using the standard record view.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
