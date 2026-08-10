'use client';

import { useState } from 'react';
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CreateEntityForm, createEntityLabel } from '@/components/forms/CreateEntityForm';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
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
import { ActivityFeed, CommentThread, MetaGrid, PeopleList, RelatedList } from './shared';

const PROCESS_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Paused', value: 'paused' },
  { label: 'Retired', value: 'retired' },
];

function labelize(value?: string) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-muted/30 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function processPayload(data: Record<string, any>, overrides: Record<string, any> = {}) {
  return {
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    owner: data.owner_id || data.owner,
    owner_id: data.owner_id,
    owner_name:
      typeof data.owner === 'string' && data.owner !== data.owner_id ? data.owner : data.owner_name,
    category: data.category,
    process_type: data.process_type,
    frequency: data.frequency,
    department: data.department,
    systems: data.systems,
    sla_hours: data.sla_hours,
    steps_total: data.steps_total,
    steps_done: data.steps_done,
    next_review_date: data.next_review_date || data.dueDate,
    last_run_date: data.last_run_date,
    risk_level: data.risk_level,
    compliance_required: data.compliance_required,
    ...overrides,
  };
}

/** Process Street / Notion Ops–style operational process detail. */
export function OperationsDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const { updateEntity, deleteEntity, removeAndBack } = useDetailMutations(entityKey);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const stepsTotal = Number(data.steps_total ?? 0);
  const stepsDone = Number(data.steps_done ?? 0);
  const progress =
    typeof data.progress === 'number'
      ? data.progress
      : stepsTotal > 0
        ? Math.min(100, Math.round((stepsDone / stepsTotal) * 100))
        : 0;
  const currentStatus = String(data.status || 'draft').toLowerCase();

  const setStatus = async (status: string) => {
    if (status === currentStatus) return;
    await updateEntity.mutateAsync({
      id: detailId,
      data: processPayload(data, { status }),
    });
  };

  const bumpStep = async (delta: number) => {
    if (stepsTotal <= 0) return;
    const next = Math.max(0, Math.min(stepsTotal, stepsDone + delta));
    await updateEntity.mutateAsync({
      id: detailId,
      data: processPayload(data, { steps_done: next }),
    });
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || data.name || title}
        subtitle={`${labelize(data.process_type)} · ${labelize(data.category)}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{labelize(data.status)}</Badge>
            {data.priority ? (
              <Badge
                variant={
                  String(data.priority).toLowerCase() === 'critical' ||
                  String(data.priority).toLowerCase() === 'high'
                    ? 'error'
                    : String(data.priority).toLowerCase() === 'medium'
                      ? 'warning'
                      : 'default'
                }
              >
                {labelize(data.priority)}
              </Badge>
            ) : null}
            {data.compliance_required ? <Badge variant="warning">Compliance</Badge> : null}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4 text-[var(--danger)]" />
              Delete
            </Button>
          </div>
        }
      />

      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ClipboardList className="mr-1 h-4 w-4 text-brand" />
          {PROCESS_STATUSES.map((s) => {
            const active = s.value === currentStatus;
            return (
              <button
                key={s.value}
                type="button"
                disabled={updateEntity.isPending}
                onClick={() => void setStatus(s.value)}
                className={
                  active
                    ? 'rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-white'
                    : 'rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-brand hover:text-brand'
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Steps"
          value={stepsTotal ? `${stepsDone}/${stepsTotal}` : '—'}
          hint={stepsTotal ? `${progress}% complete` : 'Set steps in Edit'}
        />
        <Stat
          label="SLA"
          value={data.sla_hours != null ? `${data.sla_hours}h` : '—'}
          hint={labelize(data.frequency)}
        />
        <Stat label="Risk" value={labelize(data.risk_level)} hint={labelize(data.priority)} />
        <Stat
          label="Next review"
          value={
            data.next_review_date || data.dueDate
              ? formatDate(data.next_review_date || data.dueDate)
              : '—'
          }
          hint={data.last_run_date ? `Last run ${formatDate(data.last_run_date)}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-secondary">
              {data.description || 'No SOP summary yet.'}
            </p>
            {stepsTotal > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Checklist progress</span>
                  <span className="tabular-nums text-ink">
                    {stepsDone}/{stepsTotal}
                  </span>
                </div>
                <Progress value={progress} label={`${progress}%`} />
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateEntity.isPending || stepsDone <= 0}
                    onClick={() => void bumpStep(-1)}
                  >
                    Undo step
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={updateEntity.isPending || stepsDone >= stepsTotal}
                    onClick={() => void bumpStep(1)}
                  >
                    Complete step
                  </Button>
                </div>
              </div>
            )}
            <MetaGrid
              items={[
                { label: 'Owner', value: data.owner },
                { label: 'Department', value: data.department || '—' },
                { label: 'Category', value: labelize(data.category) },
                { label: 'Type', value: labelize(data.process_type) },
                { label: 'Systems', value: data.systems || '—' },
                { label: 'Frequency', value: labelize(data.frequency) },
                {
                  label: 'Compliance',
                  value: data.compliance_required ? 'Required' : 'Not required',
                },
                { label: 'Updated', value: formatDate(data.updatedAt) },
              ]}
            />
          </Card>

          <Tabs defaultValue="timeline">
            <TabList>
              <Tab value="timeline">Timeline</Tab>
              <Tab value="notes">Notes</Tab>
              <Tab value="related">Related</Tab>
            </TabList>
            <TabPanel value="timeline" className="pt-4">
              <ActivityFeed items={extras.activities} />
            </TabPanel>
            <TabPanel value="notes" className="pt-4">
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
          <Card className="space-y-4">
            <PeopleList title="Process owner" names={[data.owner].filter(Boolean)} />
            <Button size="sm" variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
              Edit process
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={updateEntity.isPending || currentStatus === 'active'}
              onClick={() => void setStatus('active')}
            >
              Publish / activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={updateEntity.isPending || currentStatus === 'under_review'}
              onClick={() => void setStatus('under_review')}
            >
              Mark for review
            </Button>
          </Card>
        </aside>
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${createEntityLabel(entityKey)}`}
        size="lg"
      >
        <CreateEntityForm entityKey={entityKey} record={data} onDone={() => setEditOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        title="Delete process?"
        description={`This will permanently delete “${data.title || data.name || 'this process'}”.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteEntity.isPending}
        onConfirm={async () => {
          await removeAndBack(detailId);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
