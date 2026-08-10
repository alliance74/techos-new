'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useState } from 'react';
import { useCreateEntity, useEntityList } from '@/hooks/useEntityApi';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';

export default function BenefitsPage() {
  const { data: benefits = [], isLoading } = useEntityList('benefits');
  const createBenefit = useCreateEntity('benefits');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', enrolled: '', total: '', amount: '', description: '' });
  const totalEnrollments = benefits.reduce((total, benefit) => total + Number(benefit.metadata?.enrolled || 0), 0);
  const monthlyCost = benefits.reduce((total, benefit) => total + Number(benefit.amount || 0), 0);
  const eligibleEmployees = benefits.reduce((total, benefit) => total + Number(benefit.metadata?.total || 0), 0);
  const participation = eligibleEmployees ? Math.round((totalEnrollments / eligibleEmployees) * 100) : 0;

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'paused': return <Badge variant="warning">Paused</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Benefits</h1>
          <p className="text-ink-muted mt-2">Employee benefits and perks administration</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />New Benefit</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <Shield className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Active Benefits</p>
          <p className="text-3xl font-bold text-ink mt-1">{benefits.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Users className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Total Enrollments</p>
          <p className="text-3xl font-bold text-ink mt-1">{totalEnrollments}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <DollarSign className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Monthly Cost</p>
          <p className="text-3xl font-bold text-ink mt-1">${monthlyCost.toLocaleString()}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <TrendingUp className="h-8 w-8 text-success mb-3" />
          <p className="text-sm text-ink-muted">Avg Participation</p>
          <p className="text-3xl font-bold text-ink mt-1">{participation}%</p>
        </Card>
      </div>

      {benefits.length === 0 ? <EmptyState icon={<Shield className="h-12 w-12" />} title="No benefits yet" description="Create a benefit to begin tracking enrollments and cost." /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map(benefit => {
          const enrolled = Number(benefit.metadata?.enrolled || 0);
          const total = Number(benefit.metadata?.total || 0);
          const pct = total ? Math.round((enrolled / total) * 100) : 0;
          return (
            <Card key={benefit.id} className="p-6 bg-surface border border-border hover:border-border-strong transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-brand-mist rounded-lg">
                  <Shield className="h-5 w-5 text-brand" />
                </div>
                {getStatusBadge(benefit.status)}
              </div>
              <h3 className="text-lg font-semibold text-ink mb-1">{benefit.title}</h3>
              <p className="text-sm text-ink-muted mb-4">{benefit.metadata?.type || benefit.description || 'Benefit'}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Enrolled</span>
                  <span className="text-ink font-medium">{enrolled}/{total}</span>
                </div>
                <div className="w-full bg-bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-brand-mist"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-ink-muted text-right">{pct}% participation</p>
              </div>
              
              {Number(benefit.amount) > 0 && (
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-ink-muted">Monthly Cost</span>
                  <span className="text-ink font-semibold">${Number(benefit.amount).toLocaleString()}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Benefit">
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          await createBenefit.mutateAsync({ ...form, status: 'active' });
          setCreateOpen(false);
          setForm({ title: '', type: '', enrolled: '', total: '', amount: '', description: '' });
        }}>
          <Input label="Name" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <Input label="Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Enrolled" type="number" value={form.enrolled} onChange={(event) => setForm({ ...form, enrolled: event.target.value })} />
            <Input label="Eligible employees" type="number" value={form.total} onChange={(event) => setForm({ ...form, total: event.target.value })} />
          </div>
          <Input label="Monthly cost" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <Input label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="flex justify-end"><Button type="submit" loading={createBenefit.isPending}>Create benefit</Button></div>
        </form>
      </Modal>
    </div>
  );
}
