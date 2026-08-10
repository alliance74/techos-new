'use client';

import { Download, Mail, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSendInvoice } from '@/hooks/useFinance';
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

/** Stripe/QuickBooks-style invoice document. */
export function InvoiceDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, extras, isLoading } = useDetailRecord(entityKey, detailId);
  const sendMutation = useSendInvoice();

  if (isLoading) return <DetailLoading />;
  if (!data || !extras) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const amount = typeof data.amount === 'number' ? data.amount : 0;
  const description = data.description || 'Invoice';

  return (
    <div className="space-y-6">
      <DetailHeader
        title={data.title || title}
        subtitle={`Invoice · ${data.company || 'Customer'}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={<Badge variant={data.statusVariant}>{data.status}</Badge>}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => toast.error('PDF export is not available yet.')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              size="sm"
              loading={sendMutation.isPending}
              disabled={!data.email}
              onClick={() => {
                if (!data.email) return;
                sendMutation.mutate({ id: data.id, recipient_email: data.email });
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Bill to</p>
                <p className="text-lg font-semibold text-ink mt-1">{data.company}</p>
                <p className="text-sm text-ink-secondary">{data.email}</p>
              </div>
              <div className="text-sm space-y-1 sm:text-right">
                <p>
                  <span className="text-ink-muted">Invoice # </span>
                  <span className="text-ink font-medium">{data.title}</span>
                </p>
                <p>
                  <span className="text-ink-muted">Issued </span>
                  <span className="text-ink">{formatDate(data.createdAt)}</span>
                </p>
                <p>
                  <span className="text-ink-muted">Due </span>
                  <span className="text-ink">{data.dueDate ? formatDate(data.dueDate) : '—'}</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-ink-secondary">{description}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-border">
                    <th className="py-2 font-medium">Description</th>
                    <th className="py-2 font-medium">Qty</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60">
                      <td className="py-3 text-ink">{description}</td>
                      <td className="py-3 text-ink-secondary">1</td>
                      <td className="py-3 text-right tabular-nums text-ink">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                </tbody>
                <tfoot className="text-sm">
                  <tr>
                    <td colSpan={2} className="pt-4 text-ink-muted">
                      Total due
                    </td>
                    <td className="pt-4 text-right font-semibold tabular-nums text-ink">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Tabs defaultValue="payments">
            <TabList>
              <Tab value="payments">Payments</Tab>
              <Tab value="activity">Audit trail</Tab>
              <Tab value="related">Related</Tab>
            </TabList>
            <TabPanel value="payments" className="pt-4">
              <Card className="space-y-3 text-sm">
                {data.status === 'Paid' ? (
                  <div className="flex justify-between">
                    <span className="text-ink">Full payment received</span>
                    <span className="tabular-nums font-medium">{formatCurrency(amount)}</span>
                  </div>
                ) : (
                  <p className="text-ink-muted">No payments recorded yet.</p>
                )}
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
          <Card className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-ink-muted">Balance</p>
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {data.status === 'Paid' ? formatCurrency(0) : formatCurrency(amount)}
            </p>
            <Badge variant={data.statusVariant}>{data.status}</Badge>
          </Card>
          <Card>
            <MetaGrid
              items={[
                { label: 'Owner', value: data.owner },
                { label: 'Currency', value: data.currency || 'USD' },
                { label: 'Terms', value: 'Net 30' },
                { label: 'Updated', value: formatDate(data.updatedAt) },
              ]}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
