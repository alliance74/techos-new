'use client';

import { useState } from 'react';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
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

const CAMPAIGN_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
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

/** HubSpot / Google Ads–style marketing campaign detail. */
export function MarketingDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const { updateEntity, deleteEntity, removeAndBack } = useDetailMutations(entityKey);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const budget = Number(data.budget ?? data.amount ?? 0);
  const spent = Number(data.spent ?? 0);
  const remaining = Math.max(0, budget - spent);
  const spendPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const impressions = Number(data.impressions ?? 0);
  const clicks = Number(data.clicks ?? 0);
  const leads = Number(data.leads ?? 0);
  const conversions = Number(data.conversions ?? 0);
  const ctr = Number(data.ctr ?? (impressions > 0 ? (clicks / impressions) * 100 : 0));
  const cpl = leads > 0 && spent > 0 ? spent / leads : null;
  const currentStatus = String(data.status || 'draft').toLowerCase();

  const setStatus = async (status: string) => {
    if (status === currentStatus) return;
    await updateEntity.mutateAsync({
      id: detailId,
      data: {
        title: data.title,
        description: data.description,
        status,
        owner: data.owner_id || data.owner,
        owner_id: data.owner_id,
        owner_name: typeof data.owner === 'string' && !data.owner.includes('-') ? data.owner : data.owner_name,
        channel: data.channel,
        objective: data.objective,
        audience: data.audience,
        utm_campaign: data.utm_campaign,
        start_date: data.start_date,
        end_date: data.end_date || data.dueDate,
        budget: data.budget ?? data.amount,
        spent: data.spent,
        goal_metric: data.goal_metric,
        goal_target: data.goal_target,
        impressions: data.impressions,
        clicks: data.clicks,
        leads: data.leads,
        conversions: data.conversions,
      },
    });
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || data.name || title}
        subtitle={`${labelize(data.channel)} · ${labelize(data.objective)}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={<Badge variant={data.statusVariant}>{labelize(data.status)}</Badge>}
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
          <Megaphone className="mr-1 h-4 w-4 text-brand" />
          {CAMPAIGN_STATUSES.map((s) => {
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
        <Stat label="Budget" value={formatCurrency(budget)} hint={budget ? `${spendPct}% spent` : undefined} />
        <Stat label="Spend" value={formatCurrency(spent)} hint={`${formatCurrency(remaining)} remaining`} />
        <Stat label="Leads" value={String(leads)} hint={cpl != null ? `${formatCurrency(cpl)} CPL` : undefined} />
        <Stat
          label="CTR"
          value={`${ctr.toFixed(1)}%`}
          hint={`${clicks.toLocaleString()} clicks · ${impressions.toLocaleString()} impr.`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-secondary">
              {data.description || 'No campaign brief yet.'}
            </p>
            {typeof data.progress === 'number' && (
              <div>
                <p className="mb-2 text-sm text-ink-muted">
                  Goal progress ({labelize(data.goal_metric)} → {data.goal_target || 0})
                </p>
                <Progress value={data.progress} label={`${data.progress}%`} />
              </div>
            )}
            {budget > 0 && (
              <div>
                <p className="mb-2 text-sm text-ink-muted">Budget utilization</p>
                <Progress value={spendPct} label={`${spendPct}%`} />
              </div>
            )}
            <MetaGrid
              items={[
                { label: 'Owner', value: data.owner },
                { label: 'Channel', value: labelize(data.channel) },
                { label: 'Objective', value: labelize(data.objective) },
                { label: 'Audience', value: data.audience || '—' },
                { label: 'UTM campaign', value: data.utm_campaign || '—' },
                {
                  label: 'Schedule',
                  value:
                    data.start_date || data.end_date || data.dueDate
                      ? `${data.start_date ? formatDate(data.start_date) : '—'} → ${
                          data.end_date || data.dueDate
                            ? formatDate((data.end_date || data.dueDate) as string)
                            : '—'
                        }`
                      : '—',
                },
                { label: 'Conversions', value: String(conversions) },
                { label: 'Created', value: formatDate(data.createdAt) },
              ]}
            />
          </Card>

          <Tabs defaultValue="performance">
            <TabList>
              <Tab value="performance">Performance</Tab>
              <Tab value="timeline">Timeline</Tab>
              <Tab value="notes">Notes</Tab>
              <Tab value="related">Assets</Tab>
            </TabList>
            <TabPanel value="performance" className="pt-4">
              <Card className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Impressions" value={impressions.toLocaleString()} />
                <Stat label="Clicks" value={clicks.toLocaleString()} />
                <Stat label="Leads" value={leads.toLocaleString()} />
                <Stat label="Conversions" value={conversions.toLocaleString()} />
              </Card>
              <p className="mt-3 text-xs text-ink-muted">
                Update performance numbers via Edit — same fields marketers track in HubSpot / Ads Manager.
              </p>
            </TabPanel>
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
            <PeopleList title="Campaign owner" names={[data.owner].filter(Boolean)} />
            <Button size="sm" variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
              Edit campaign
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={updateEntity.isPending || currentStatus === 'active'}
              onClick={() => void setStatus('active')}
            >
              Launch / activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={updateEntity.isPending || currentStatus === 'paused'}
              onClick={() => void setStatus('paused')}
            >
              Pause campaign
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
        title="Delete campaign?"
        description={`This will permanently delete “${data.title || data.name || 'this campaign'}”.`}
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
