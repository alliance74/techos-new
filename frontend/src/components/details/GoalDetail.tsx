'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useCreateKeyResult,
  useDeleteKeyResult,
  useKeyResults,
  useUpdateKeyResult,
} from '@/hooks/useGoals';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Progress } from '@/components/UI/Progress';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailMutations,
  useDetailRecord,
  type DetailViewProps,
} from './DetailShell';
import { ActivityFeed, CommentThread, MetaGrid, RelatedList } from './shared';

function krProgress(current: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/** Goal detail with live key-results CRUD against Nest. */
export function GoalDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const { updateEntity, removeAndBack } = useDetailMutations(entityKey);
  const krsQuery = useKeyResults(detailId);
  const createKr = useCreateKeyResult();
  const updateKr = useUpdateKeyResult();
  const deleteKr = useDeleteKeyResult();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', target: '', current: '', unit: '%' });

  const keyResults = useMemo(() => {
    const rows = krsQuery.data || [];
    return rows.map((kr: any) => ({
      id: kr.id,
      title: kr.title || 'Key result',
      target: Number(kr.target ?? kr.targetValue ?? 0),
      current: Number(kr.current ?? kr.currentValue ?? 0),
      unit: kr.unit || '',
    }));
  }, [krsQuery.data]);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const onAdd = async () => {
    if (!form.title.trim()) {
      toast.error('Key result title is required');
      return;
    }
    await createKr.mutateAsync({
      goalId: detailId,
      title: form.title.trim(),
      type: 'numeric',
      startValue: 0,
      targetValue: Number(form.target) || 0,
      unit: form.unit,
      dueDate: new Date().toISOString().slice(0, 10),
      // Nest fields (mapped in hook)
      goal_id: detailId,
      target: Number(form.target) || 0,
      current: Number(form.current) || 0,
    } as any);
    setOpen(false);
    setForm({ title: '', target: '', current: '', unit: '%' });
    krsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || data.name || title}
        subtitle={`Goal · ${data.type || 'company'}`}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-secondary">{data.description}</p>
            {typeof data.progress === 'number' && (
              <Progress value={data.progress} label={`Overall ${data.progress}%`} />
            )}
            <MetaGrid
              items={[
                { label: 'Owner', value: data.owner },
                { label: 'Level', value: data.type || '—' },
                ...(data.dueDate ? [{ label: 'Due', value: formatDate(data.dueDate) }] : []),
                { label: 'Updated', value: formatDate(data.updatedAt) },
              ]}
            />
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">Key results</h3>
              <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
                Add KR
              </Button>
            </div>
            {krsQuery.isLoading ? (
              <p className="text-sm text-ink-muted">Loading key results…</p>
            ) : keyResults.length === 0 ? (
              <EmptyState
                title="No key results"
                description="Break this goal into measurable key results."
                action={{ label: 'Add key result', onClick: () => setOpen(true) }}
              />
            ) : (
              <div className="space-y-4">
                {keyResults.map((kr) => (
                  <div key={kr.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{kr.title}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void deleteKr.mutateAsync(kr.id).then(() => krsQuery.refetch())
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <Progress
                      value={krProgress(kr.current, kr.target)}
                      label={`${kr.current}${kr.unit} / ${kr.target}${kr.unit}`}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        className="max-w-[140px]"
                        defaultValue={kr.current}
                        onBlur={(e) => {
                          const current = Number(e.target.value);
                          if (Number.isNaN(current) || current === kr.current) return;
                          void updateKr
                            .mutateAsync({ id: kr.id, data: { current } as any })
                            .then(() => krsQuery.refetch());
                        }}
                      />
                      <span className="self-center text-xs text-ink-muted">Update current</span>
                    </div>
                  </div>
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

        <aside>
          <Card className="space-y-2 text-sm text-ink-secondary">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">OKR</p>
            <p className="font-medium text-ink">{keyResults.length} key results</p>
            <p>Progress rolls up from key-result current vs target values.</p>
          </Card>
        </aside>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add key result" size="md">
        <div className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Reach $50k MRR"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Current"
              type="number"
              value={form.current}
              onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            />
            <Input
              label="Target"
              type="number"
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            />
            <Input
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={createKr.isPending} onClick={() => void onAdd()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
