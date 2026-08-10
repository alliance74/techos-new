'use client';

import { useState } from 'react';
import { Building2, Handshake, Pencil, Trash2, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCalculateLeadScore, useContactLeadScore } from '@/hooks/useCRM';
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

const DEAL_STAGES = [
  { label: 'Qualification', value: 'qualification' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Won', value: 'closed_won' },
  { label: 'Lost', value: 'closed_lost' },
];

function scoreVariant(rating?: string): 'success' | 'warning' | 'error' | 'default' {
  if (rating === 'hot') return 'error';
  if (rating === 'warm') return 'warning';
  if (rating === 'cold') return 'default';
  return 'default';
}

/** HubSpot/Salesforce-style CRM records (deals, leads, contacts, opportunities). */
export function CrmDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const { updateEntity, deleteEntity, removeAndBack } = useDetailMutations(entityKey);
  const isDeal = entityKey === 'deals' || entityKey === 'opportunities';
  const isContact = entityKey === 'contacts' || entityKey === 'customers' || entityKey === 'leads';
  const calculateScore = useCalculateLeadScore();
  const scoreQuery = useContactLeadScore(detailId, isContact);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const leadScore = scoreQuery.data
    ? { score: Number(scoreQuery.data.score), rating: String(scoreQuery.data.rating || '') }
    : null;

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const Icon = isDeal ? Handshake : isContact ? UserCircle : Building2;
  const kindLabel =
    entityKey === 'leads'
      ? 'Lead'
      : entityKey === 'deals'
        ? 'Deal'
        : entityKey === 'opportunities'
          ? 'Opportunity'
          : entityKey === 'customers'
            ? 'Customer'
            : 'Contact';

  const currentStage = String(data.status || '')
    .toLowerCase()
    .replace(/\s+/g, '_');

  const setStage = async (stage: string) => {
    if (!isDeal || stage === currentStage) return;
    await updateEntity.mutateAsync({
      id: detailId,
      data: {
        title: data.title,
        amount: data.amount,
        status: stage,
        owner: data.owner_id || data.assigned_to,
        dueDate: data.dueDate,
        company: data.company,
        email: data.email,
        phone: data.phone,
        description: data.description,
      },
    });
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || data.name || title}
        subtitle={`${kindLabel}${data.company ? ` · ${data.company}` : ''}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{data.status}</Badge>
            {leadScore ? (
              <Badge variant={scoreVariant(leadScore.rating)}>
                Score {leadScore.score} · {leadScore.rating}
              </Badge>
            ) : null}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            {isContact ? (
              <Button
                size="sm"
                variant="outline"
                loading={calculateScore.isPending}
                onClick={() => void calculateScore.mutateAsync(detailId)}
              >
                Recalc score
              </Button>
            ) : null}
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

      {isDeal && (
        <Card className="!p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Icon className="mr-1 h-4 w-4 text-brand" />
            {DEAL_STAGES.map((stage) => {
              const active =
                stage.value === currentStage ||
                (stage.value === 'closed_won' && currentStage === 'won') ||
                (stage.value === 'closed_lost' && currentStage === 'lost');
              return (
                <button
                  key={stage.value}
                  type="button"
                  disabled={updateEntity.isPending}
                  onClick={() => void setStage(stage.value)}
                  className={
                    active
                      ? 'rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-white'
                      : 'rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-brand hover:text-brand'
                  }
                >
                  {stage.label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-secondary">{data.description}</p>
            {typeof data.amount === 'number' && (
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Deal value</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
                  {formatCurrency(data.amount)}
                </p>
              </div>
            )}
            {typeof data.progress === 'number' && (
              <div>
                <p className="mb-2 text-sm text-ink-muted">Win probability</p>
                <Progress value={data.progress} label={`${data.progress}%`} />
              </div>
            )}
            {leadScore ? (
              <div>
                <p className="mb-2 text-sm text-ink-muted">Lead score</p>
                <Progress
                  value={leadScore.score}
                  label={`${leadScore.score}/100 · ${leadScore.rating}`}
                />
              </div>
            ) : null}
            <MetaGrid
              items={[
                { label: 'Owner', value: data.owner },
                { label: 'Company', value: data.company || '—' },
                { label: 'Email', value: data.email || '—' },
                ...(isContact || data.phone
                  ? [{ label: 'Phone', value: data.phone || '—' }]
                  : []),
                {
                  label: isDeal ? 'Close / next step' : 'Status',
                  value: isDeal
                    ? data.dueDate
                      ? formatDate(data.dueDate)
                      : '—'
                    : data.status || '—',
                },
                { label: 'Created', value: formatDate(data.createdAt) },
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
            <PeopleList title="Account team" names={extras.assignees} />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={!data.email}
              onClick={() => {
                if (!data.email) {
                  toast.error('Add an email on Edit first');
                  return;
                }
                window.location.href = `mailto:${data.email}`;
              }}
            >
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setEditOpen(true)}
            >
              Edit record
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
        <CreateEntityForm
          entityKey={entityKey}
          record={data}
          onDone={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        title={`Delete ${kindLabel.toLowerCase()}?`}
        description={`This will permanently delete “${data.title || data.name || 'this record'}”.`}
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
