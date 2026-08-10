'use client';

import { Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useApproveExpense, useRejectExpense } from '@/hooks/useFinance';
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
import { ActivityFeed, MetaGrid, RelatedList } from './shared';

/** Expense / payment / budget money-document layout. */
export function ExpenseDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const approve = useApproveExpense();
  const reject = useRejectExpense();

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const kind =
    entityKey === 'payments' ? 'Payment' : entityKey === 'budgets' ? 'Budget' : 'Expense';
  const amount = typeof data.amount === 'number' ? data.amount : 0;
  const showApproval = entityKey === 'expenses' && data.status.toLowerCase().includes('pending');

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={`${kind} · ${data.id}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={<Badge variant={data.statusVariant}>{data.status}</Badge>}
        actions={
          showApproval ? (
            <>
              <Button
                size="sm"
                variant="outline"
                loading={reject.isPending}
                onClick={() => reject.mutate({ id: data.id, reason: 'Rejected from expense detail' })}
              >
                Reject
              </Button>
              <Button size="sm" loading={approve.isPending} onClick={() => approve.mutate(data.id)}>
                Approve
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => toast.error('Receipt is not available yet.')}>
              View receipt
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" />
                  Amount
                </p>
                <p className="text-3xl font-semibold tabular-nums text-ink mt-1">
                  {formatCurrency(amount)}
                </p>
              </div>
              <Badge variant={data.statusVariant}>{data.status}</Badge>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed">{data.description}</p>
            <MetaGrid
              items={[
                { label: 'Submitted by', value: data.owner },
                { label: 'Category', value: data.category || data.tags?.[0] || 'General' },
                { label: 'Company / vendor', value: data.company || '—' },
                { label: 'Date', value: data.dueDate ? formatDate(data.dueDate) : formatDate(data.createdAt) },
                { label: 'Updated', value: formatDate(data.updatedAt) },
              ]}
            />
          </Card>

          <Tabs defaultValue="activity">
            <TabList>
              <Tab value="activity">Approval history</Tab>
              <Tab value="related">Related</Tab>
            </TabList>
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
          <Card className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Policy</p>
            <p className="text-ink-secondary">
              Expenses over $500 require manager approval. Receipts required within 14 days.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
